import { Context } from 'grammy';
import { handleReminderSelection, handleTasksDone } from '../commands/start.js';
import { handleTaskToggle, handleSubmitCheckin } from '../commands/checkin-new.js';
import { handleRemoveTask } from '../commands/tasks.js';
import { handleAutomationCallback, handleResearchDepthCallback } from '../commands/automation.js';

// Main callback query handler
export async function handleCallbackQuery(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;

  if (!callbackData) {
    await ctx.answerCallbackQuery('Invalid action');
    return;
  }

  try {
    // === ONBOARDING CALLBACKS ===

    // Reminder time selection (during onboarding)
    if (callbackData.startsWith('reminder_')) {
      const hour = parseInt(callbackData.replace('reminder_', ''));
      await handleReminderSelection(ctx, hour);
      return;
    }

    // Tasks done button (during onboarding)
    if (callbackData === 'tasks_done') {
      await handleTasksDone(ctx);
      return;
    }

    // === CHECK-IN CALLBACKS ===

    // Task toggle (checkbox during check-in)
    if (callbackData.startsWith('toggle_task_')) {
      const taskId = parseInt(callbackData.replace('toggle_task_', ''));
      await handleTaskToggle(ctx, taskId);
      return;
    }

    // Submit check-in
    if (callbackData.startsWith('submit_checkin_')) {
      const groupId = parseInt(callbackData.replace('submit_checkin_', ''));
      await handleSubmitCheckin(ctx, groupId);
      return;
    }

    // === TASK MANAGEMENT CALLBACKS ===

    // Remove task
    if (callbackData.startsWith('remove_task_')) {
      const taskId = parseInt(callbackData.replace('remove_task_', ''));
      await handleRemoveTask(ctx, taskId);
      return;
    }

    // === LEGACY CALLBACKS (for backward compatibility) ===

    // Old check-in responses - redirect to new flow
    if (callbackData.startsWith('checkin_')) {
      await ctx.answerCallbackQuery('Please use the new task-based check-in!');
      const { checkinCommand } = await import('../commands/checkin-new.js');
      await checkinCommand(ctx as any);
      return;
    }

    // Group selection (for check-ins when multiple groups)
    if (callbackData.startsWith('select_group_')) {
      const groupId = parseInt(callbackData.replace('select_group_', ''));
      // TODO: Implement group selection for check-in
      await ctx.answerCallbackQuery('Group selected');
      return;
    }

    // === AUTOMATION CALLBACKS ===

    if (callbackData.startsWith('auto_') || callbackData.startsWith('cal_')) {
      await handleAutomationCallback(ctx);
      return;
    }

    if (callbackData.startsWith('depth_')) {
      await handleResearchDepthCallback(ctx);
      return;
    }

    // === MAIN MENU CALLBACKS ===

    if (callbackData === 'menu_checkin') {
      await ctx.answerCallbackQuery();
      const { checkinCommand } = await import('../commands/checkin-new.js');
      await checkinCommand(ctx as any);
      return;
    }

    if (callbackData === 'menu_view') {
      await ctx.answerCallbackQuery();
      const { viewCommand } = await import('../commands/view.js');
      await viewCommand(ctx as any);
      return;
    }

    if (callbackData === 'menu_stats') {
      await ctx.answerCallbackQuery();
      const { statsCommand } = await import('../commands/stats.js');
      await statsCommand(ctx as any);
      return;
    }

    if (callbackData === 'menu_quote') {
      await ctx.answerCallbackQuery();
      const { quoteCommand } = await import('../commands/quote.js');
      await quoteCommand(ctx as any);
      return;
    }

    if (callbackData === 'menu_groups') {
      await ctx.answerCallbackQuery();
      const { groupsCommand } = await import('../commands/groups.js');
      await groupsCommand(ctx as any);
      return;
    }

    if (callbackData === 'menu_help') {
      await ctx.answerCallbackQuery();
      const { helpCommand } = await import('../commands/help.js');
      await helpCommand(ctx as any);
      return;
    }

    // Unknown callback
    await ctx.answerCallbackQuery('Unknown action');
  } catch (error) {
    console.error('Error handling callback query:', error);
    await ctx.answerCallbackQuery('Error processing action. Please try again.');
  }
}
