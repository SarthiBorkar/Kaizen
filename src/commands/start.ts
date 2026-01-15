import { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { createUser, getUser, getUserTasks, createTask } from '../db/queries.js';
import { WELCOME_MESSAGE, REMINDER_TIME_PROMPT, ONBOARDING_COMPLETE } from '../utils/messages.js';
import { reminderTimeKeyboard } from '../utils/keyboards.js';

// Track user conversation state
const userStates = new Map<number, { state: string; tasks: string[] }>();

const MAX_TASKS = 5;

export async function startCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;

  try {
    // Create or update user in database
    await createUser(telegramId, username, firstName);

    // Check if user already has tasks set
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (user) {
      const tasksResult = await getUserTasks(user.id as number);

      if (tasksResult.rows.length > 0) {
        const taskList = tasksResult.rows
          .map((task: any, idx: number) => `${idx + 1}. ${task.task_name}`)
          .join('\n');

        await ctx.reply(
          `Welcome back, ${firstName}! 👋\n\n` +
          `**Your daily tasks:**\n${taskList}\n\n` +
          `Use /checkin to check in today, or /view to see your progress.\n\n` +
          `Manage your tasks: /addtask or /removetask`
        );
        return;
      }
    }

    // Start onboarding flow
    await ctx.reply(WELCOME_MESSAGE);
    await ctx.reply(
      `🎯 **Let's set up your daily tasks!**\n\n` +
      `You can commit to up to ${MAX_TASKS} daily tasks.\n\n` +
      `**Type your first task** (e.g., "Exercise for 30 minutes")`
    );

    // Set user state to expect first task
    userStates.set(telegramId, { state: 'awaiting_tasks', tasks: [] });
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

// Handle user messages during onboarding
export async function handleOnboardingMessage(ctx: Context) {
  if (!ctx.from || !ctx.message || !('text' in ctx.message)) return false;

  const telegramId = ctx.from.id;
  const userState = userStates.get(telegramId);

  if (!userState) return false;

  try {
    if (userState.state === 'awaiting_tasks') {
      if (!ctx.message.text) return false;
      const taskName = ctx.message.text.trim();

      // Validate task name
      if (!taskName || taskName.length < 3) {
        await ctx.reply('Please enter a task name (at least 3 characters).');
        return true;
      }

      if (taskName.length > 100) {
        await ctx.reply('Please keep your task under 100 characters.');
        return true;
      }

      // Add task to temporary list
      userState.tasks.push(taskName);
      const taskCount = userState.tasks.length;

      // Show current tasks and ask for more
      const taskList = userState.tasks
        .map((task, idx) => `${idx + 1}. ${task}`)
        .join('\n');

      if (taskCount >= MAX_TASKS) {
        // Reached max, proceed to reminder time
        await ctx.reply(
          `✅ **Tasks added:**\n${taskList}\n\n` +
          `You've reached the maximum of ${MAX_TASKS} tasks!`
        );

        // Ask for reminder time
        userState.state = 'awaiting_reminder';
        userStates.set(telegramId, userState);

        await ctx.reply(REMINDER_TIME_PROMPT, {
          reply_markup: reminderTimeKeyboard(),
        });
      } else {
        // Can add more tasks
        const keyboard = new InlineKeyboard()
          .text(`✅ Done (${taskCount} task${taskCount > 1 ? 's' : ''})`, 'tasks_done');

        await ctx.reply(
          `✅ **Task ${taskCount} added!**\n\n` +
          `**Current tasks:**\n${taskList}\n\n` +
          `**Type another task** or click Done to continue.`,
          { reply_markup: keyboard }
        );
      }

      return true;
    }
  } catch (error) {
    console.error('Error handling onboarding message:', error);
    await ctx.reply('Sorry, something went wrong. Please try /start again.');
    userStates.delete(telegramId);
  }

  return false;
}

// Handle "Tasks Done" button
export async function handleTasksDone(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const userState = userStates.get(telegramId);

  if (!userState || userState.state !== 'awaiting_tasks') {
    await ctx.answerCallbackQuery('Please start with /start');
    return;
  }

  if (userState.tasks.length === 0) {
    await ctx.answerCallbackQuery('Please add at least one task first!');
    return;
  }

  try {
    await ctx.answerCallbackQuery('Great!');

    // Update state to await reminder
    userState.state = 'awaiting_reminder';
    userStates.set(telegramId, userState);

    // Ask for reminder time
    await ctx.editMessageText(
      `✅ **Your tasks:**\n` +
      userState.tasks.map((task, idx) => `${idx + 1}. ${task}`).join('\n')
    );

    await ctx.reply(REMINDER_TIME_PROMPT, {
      reply_markup: reminderTimeKeyboard(),
    });
  } catch (error) {
    console.error('Error in handleTasksDone:', error);
    await ctx.answerCallbackQuery('Error. Please try again.');
  }
}

// Handle reminder time selection callback
export async function handleReminderSelection(ctx: Context, hour: number) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const userState = userStates.get(telegramId);

  if (!userState || userState.state !== 'awaiting_reminder') {
    await ctx.answerCallbackQuery('Please start with /start');
    return;
  }

  if (userState.tasks.length === 0) {
    await ctx.answerCallbackQuery('No tasks set. Please /start again.');
    return;
  }

  try {
    // Import queries here to avoid circular dependency
    const { updateReminderTime } = await import('../db/queries.js');

    // Get user from database
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.answerCallbackQuery('User not found. Please /start again.');
      return;
    }

    // Save all tasks to database
    for (const taskName of userState.tasks) {
      await createTask(user.id as number, taskName);
    }

    // Save reminder time
    await updateReminderTime(telegramId, hour);

    // Clear user state
    userStates.delete(telegramId);

    // Send completion message
    await ctx.answerCallbackQuery('All set!');

    const taskList = userState.tasks
      .map((task, idx) => `${idx + 1}. ${task}`)
      .join('\n');

    await ctx.editMessageText(
      `🎉 **You're all set!**\n\n` +
      `**Your daily tasks:**\n${taskList}\n\n` +
      `**Daily reminder:** ${hour === 8 ? '8:00 AM' : `${hour}:00 PM`}\n\n` +
      `Next steps:\n` +
      `1. Add me to a Telegram group with friends 👥\n` +
      `2. Use /checkin daily to track your progress 📝\n` +
      `3. Build your streak! 🔥\n\n` +
      `Commands:\n` +
      `/checkin - Daily check-in\n` +
      `/view - See your progress\n` +
      `/addtask - Add more tasks\n` +
      `/removetask - Remove a task\n\n` +
      `Let's build consistency together! 改善`
    );
  } catch (error) {
    console.error('Error saving reminder selection:', error);
    await ctx.answerCallbackQuery('Error saving settings. Please try again.');
  }
}

// Export user states for cleanup if needed
export { userStates };
