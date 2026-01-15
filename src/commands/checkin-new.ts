import { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getUser, getUserGroups, getUserTasks, createCheckin, createTaskCompletion, getGroup } from '../db/queries.js';
import { NO_GROUPS, ERROR_NO_COMMITMENT, MULTIPLE_GROUPS_SELECT } from '../utils/messages.js';
import { groupSelectionKeyboard } from '../utils/keyboards.js';
import { getTodayDate, calculateStreak } from '../utils/dates.js';
import { getQuoteForStreak, formatQuote } from '../utils/quotes.js';
import { checkMilestone, formatCelebration } from '../utils/celebrations.js';
import { getRankForStreak } from '../utils/visuals.js';

// Track check-in state: { groupId, taskCompletions: Set<taskId> }
const checkinStates = new Map<number, { groupId: number; taskCompletions: Set<number>; tasks: any[] }>();

export async function checkinCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    // Get user
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.reply('Please use /start first to set up your account!');
      return;
    }

    // Get user's tasks
    const tasksResult = await getUserTasks(user.id as number);
    const tasks = tasksResult.rows;

    if (tasks.length === 0) {
      await ctx.reply(
        `📝 **No tasks set!**\n\n` +
        `Use /addtask to add your first task, then come back to check in!`
      );
      return;
    }

    // Get user's groups
    const groupsResult = await getUserGroups(user.id as number);

    if (groupsResult.rows.length === 0) {
      await ctx.reply(NO_GROUPS);
      return;
    }

    if (groupsResult.rows.length === 1) {
      // Single group - show check-in directly
      const group = groupsResult.rows[0];
      await showTaskChecklist(ctx, tasks, group.id as number, group.name as string);
    } else {
      // Multiple groups - ask which one
      await ctx.reply(MULTIPLE_GROUPS_SELECT, {
        reply_markup: groupSelectionKeyboard(
          groupsResult.rows.map((g: any) => ({ id: g.id, name: g.name }))
        ),
      });
    }
  } catch (error) {
    console.error('Error in checkin command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

async function showTaskChecklist(ctx: Context, tasks: any[], groupId: number, groupName: string) {
  const telegramId = ctx.from!.id;

  // Initialize state
  checkinStates.set(telegramId, {
    groupId,
    taskCompletions: new Set(),
    tasks,
  });

  // Build keyboard with task checkboxes
  const keyboard = buildTaskKeyboard(tasks, new Set(), groupId);

  await ctx.reply(
    `📝 **Daily Check-in for ${groupName}**\n\n` +
    `Select the tasks you completed today:\n\n` +
    tasks.map((task: any) => `☐ ${task.task_name}`).join('\n'),
    { reply_markup: keyboard }
  );
}

function buildTaskKeyboard(tasks: any[], completed: Set<number>, groupId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  tasks.forEach((task: any) => {
    const isCompleted = completed.has(task.id);
    const emoji = isCompleted ? '✅' : '☐';
    keyboard.text(`${emoji} ${task.task_name}`, `toggle_task_${task.id}`).row();
  });

  // Add submit button
  keyboard.text('✅ Submit Check-in', `submit_checkin_${groupId}`);

  return keyboard;
}

export async function handleTaskToggle(ctx: Context, taskId: number) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const state = checkinStates.get(telegramId);

  if (!state) {
    await ctx.answerCallbackQuery('Please start with /checkin');
    return;
  }

  try {
    // Toggle task completion
    if (state.taskCompletions.has(taskId)) {
      state.taskCompletions.delete(taskId);
    } else {
      state.taskCompletions.add(taskId);
    }

    checkinStates.set(telegramId, state);

    // Rebuild keyboard
    const keyboard = buildTaskKeyboard(state.tasks, state.taskCompletions, state.groupId);

    // Update message
    const taskList = state.tasks
      .map((task: any) => {
        const isCompleted = state.taskCompletions.has(task.id);
        const emoji = isCompleted ? '✅' : '☐';
        return `${emoji} ${task.task_name}`;
      })
      .join('\n');

    await ctx.editMessageText(
      `📝 **Daily Check-in**\n\n` +
      `Select the tasks you completed today:\n\n` +
      taskList
    );

    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Error in handleTaskToggle:', error);
    await ctx.answerCallbackQuery('Error. Please try again.');
  }
}

export async function handleSubmitCheckin(ctx: Context, groupId: number) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const state = checkinStates.get(telegramId);

  if (!state || state.groupId !== groupId) {
    await ctx.answerCallbackQuery('Please start with /checkin');
    return;
  }

  const today = getTodayDate();

  try {
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.answerCallbackQuery('User not found');
      return;
    }

    // Calculate overall completion status
    const totalTasks = state.tasks.length;
    const completedTasksCount = state.taskCompletions.size;
    const completionRate = completedTasksCount / totalTasks;

    // Determine overall status
    let overallCompleted = false;
    let statusText = '';
    let statusEmoji = '';

    if (completionRate === 1) {
      overallCompleted = true;
      statusText = 'CRUSHED IT!';
      statusEmoji = '🌟';
    } else if (completionRate >= 0.75) {
      overallCompleted = true;
      statusText = 'Great job!';
      statusEmoji = '✅';
    } else if (completionRate >= 0.5) {
      overallCompleted = false;
      statusText = 'Partial progress';
      statusEmoji = '⚡';
    } else {
      overallCompleted = false;
      statusText = 'Keep trying';
      statusEmoji = '💪';
    }

    // Create checkin
    const checkinResult = await createCheckin(user.id as number, groupId, today, overallCompleted);
    const checkin = checkinResult.rows[0];

    // Save task completions
    for (const task of state.tasks) {
      const completed = state.taskCompletions.has(task.id);
      await createTaskCompletion(task.id, checkin.id as number, completed);
    }

    // Get streak info
    const { getUserCheckins } = await import('../db/queries.js');
    const checkinsResult = await getUserCheckins(user.id as number, groupId, 365);
    const currentStreak = calculateStreak(checkinsResult.rows as any);

    // Get quote
    const quote = getQuoteForStreak(currentStreak);
    const formattedQuote = formatQuote(quote);

    // Clear state
    checkinStates.delete(telegramId);

    // Build completion message
    const taskList = state.tasks
      .map((task: any) => {
        const isCompleted = state.taskCompletions.has(task.id);
        const emoji = isCompleted ? '✅' : '❌';
        return `${emoji} ${task.task_name}`;
      })
      .join('\n');

    let message = `${statusEmoji} **${statusText}**\n\n`;
    message += `**Tasks (${completedTasksCount}/${totalTasks}):**\n${taskList}\n\n`;
    message += `🔥 Current streak: **${currentStreak} day${currentStreak !== 1 ? 's' : ''}**\n\n`;
    message += formattedQuote;

    await ctx.editMessageText(message);
    await ctx.answerCallbackQuery('Check-in saved!');

    // Post to group
    try {
      const groupResult = await getGroup(groupId);
      const group = groupResult.rows[0];

      if (group && group.telegram_chat_id) {
        const userName = user.first_name || user.username || 'Someone';
        const rank = getRankForStreak(currentStreak);

        let groupMessage = `${statusEmoji} **${userName} ${statusText}**\n\n`;
        groupMessage += `**Tasks (${completedTasksCount}/${totalTasks}):**\n${taskList}\n\n`;
        groupMessage += `${rank.emoji} ${rank.name} • 🔥 ${currentStreak} day streak!`;

        const bot = ctx.api;
        await bot.sendMessage(group.telegram_chat_id as number, groupMessage);
      }
    } catch (groupError) {
      console.error('Error posting to group:', groupError);
    }
  } catch (error) {
    console.error('Error in handleSubmitCheckin:', error);
    await ctx.answerCallbackQuery('Error saving check-in. Please try again.');
  }
}

export { checkinStates };
