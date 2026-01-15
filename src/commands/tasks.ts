import { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getUser, getUserTasks, createTask, deactivateTask } from '../db/queries.js';

const MAX_TASKS = 5;

// Track task addition state
const addTaskStates = new Map<number, boolean>();

export async function addTaskCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.reply('Please use /start first to set up your account!');
      return;
    }

    const tasksResult = await getUserTasks(user.id as number);
    const currentTasks = tasksResult.rows;

    if (currentTasks.length >= MAX_TASKS) {
      await ctx.reply(
        `❌ **You've reached the maximum of ${MAX_TASKS} tasks!**\n\n` +
        `Remove a task first using /removetask to add a new one.`
      );
      return;
    }

    addTaskStates.set(telegramId, true);

    await ctx.reply(
      `➕ **Add a new task**\n\n` +
      `You have ${currentTasks.length}/${MAX_TASKS} tasks.\n\n` +
      `**Type your new task** (e.g., "Read 20 pages")`
    );
  } catch (error) {
    console.error('Error in addTaskCommand:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

export async function handleAddTaskMessage(ctx: Context) {
  if (!ctx.from || !ctx.message || !('text' in ctx.message)) return false;

  const telegramId = ctx.from.id;

  if (!addTaskStates.get(telegramId)) return false;

  if (!ctx.message.text) return false;
  const taskName = ctx.message.text.trim();

  try {
    // Validate task name
    if (!taskName || taskName.length < 3) {
      await ctx.reply('Please enter a task name (at least 3 characters).');
      return true;
    }

    if (taskName.length > 100) {
      await ctx.reply('Please keep your task under 100 characters.');
      return true;
    }

    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.reply('User not found. Please /start first.');
      addTaskStates.delete(telegramId);
      return true;
    }

    // Check task limit again
    const tasksResult = await getUserTasks(user.id as number);
    if (tasksResult.rows.length >= MAX_TASKS) {
      await ctx.reply(`You've reached the maximum of ${MAX_TASKS} tasks!`);
      addTaskStates.delete(telegramId);
      return true;
    }

    // Create task
    await createTask(user.id as number, taskName);

    // Clear state
    addTaskStates.delete(telegramId);

    // Get updated task list
    const updatedTasksResult = await getUserTasks(user.id as number);
    const taskList = updatedTasksResult.rows
      .map((task: any, idx: number) => `${idx + 1}. ${task.task_name}`)
      .join('\n');

    await ctx.reply(
      `✅ **Task added!**\n\n` +
      `**Your tasks (${updatedTasksResult.rows.length}/${MAX_TASKS}):**\n${taskList}\n\n` +
      `Use /checkin to track your progress!`
    );

    return true;
  } catch (error) {
    console.error('Error in handleAddTaskMessage:', error);
    await ctx.reply('Error adding task. Please try again.');
    addTaskStates.delete(telegramId);
    return true;
  }
}

export async function removeTaskCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.reply('Please use /start first to set up your account!');
      return;
    }

    const tasksResult = await getUserTasks(user.id as number);
    const tasks = tasksResult.rows;

    if (tasks.length === 0) {
      await ctx.reply(
        `📭 **You have no tasks!**\n\n` +
        `Use /addtask to add your first task.`
      );
      return;
    }

    // Create keyboard with task buttons
    const keyboard = new InlineKeyboard();
    tasks.forEach((task: any) => {
      keyboard.text(`❌ ${task.task_name}`, `remove_task_${task.id}`).row();
    });

    await ctx.reply(
      `🗑️ **Remove a task**\n\n` +
      `Select a task to remove:`,
      { reply_markup: keyboard }
    );
  } catch (error) {
    console.error('Error in removeTaskCommand:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

export async function handleRemoveTask(ctx: Context, taskId: number) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.answerCallbackQuery('User not found');
      return;
    }

    // Deactivate the task
    await deactivateTask(taskId);

    await ctx.answerCallbackQuery('Task removed!');

    // Get updated task list
    const updatedTasksResult = await getUserTasks(user.id as number);
    const tasks = updatedTasksResult.rows;

    if (tasks.length === 0) {
      await ctx.editMessageText(
        `✅ **Task removed!**\n\n` +
        `You have no active tasks. Use /addtask to add new tasks.`
      );
    } else {
      const taskList = tasks
        .map((task: any, idx: number) => `${idx + 1}. ${task.task_name}`)
        .join('\n');

      await ctx.editMessageText(
        `✅ **Task removed!**\n\n` +
        `**Your remaining tasks:**\n${taskList}`
      );
    }
  } catch (error) {
    console.error('Error in handleRemoveTask:', error);
    await ctx.answerCallbackQuery('Error removing task. Please try again.');
  }
}

export { addTaskStates };
