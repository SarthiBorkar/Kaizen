import { Context } from 'grammy';
import { handleReminderSelection } from '../commands/start.js';
import { handleCheckinResponse } from '../commands/checkin.js';

// Main callback query handler
export async function handleCallbackQuery(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;

  if (!callbackData) {
    await ctx.answerCallbackQuery('Invalid action');
    return;
  }

  try {
    // Reminder time selection (during onboarding)
    if (callbackData.startsWith('reminder_')) {
      const hour = parseInt(callbackData.replace('reminder_', ''));
      await handleReminderSelection(ctx, hour);
      return;
    }

    // Check-in responses
    if (callbackData.startsWith('checkin_yes_')) {
      const groupId = parseInt(callbackData.replace('checkin_yes_', ''));
      await handleCheckinResponse(ctx, true, groupId);
      return;
    }

    if (callbackData.startsWith('checkin_no_')) {
      const groupId = parseInt(callbackData.replace('checkin_no_', ''));
      await handleCheckinResponse(ctx, false, groupId);
      return;
    }

    // Group selection (for check-ins when multiple groups)
    if (callbackData.startsWith('select_group_')) {
      const groupId = parseInt(callbackData.replace('select_group_', ''));
      // TODO: Implement group selection for check-in
      await ctx.answerCallbackQuery('Group selected');
      return;
    }

    // View period selection
    if (callbackData.startsWith('view_')) {
      // TODO: Implement in next checkpoint
      await ctx.answerCallbackQuery('Coming soon!');
      return;
    }

    // Main menu actions
    if (callbackData === 'menu_checkin') {
      // TODO: Implement menu navigation
      await ctx.answerCallbackQuery('Use /checkin');
      return;
    }

    if (callbackData === 'menu_view') {
      await ctx.answerCallbackQuery('Use /view');
      return;
    }

    if (callbackData === 'menu_stats') {
      await ctx.answerCallbackQuery('Use /stats');
      return;
    }

    if (callbackData === 'menu_settings') {
      await ctx.answerCallbackQuery('Settings coming soon!');
      return;
    }

    // Unknown callback
    await ctx.answerCallbackQuery('Unknown action');
  } catch (error) {
    console.error('Error handling callback query:', error);
    await ctx.answerCallbackQuery('Error processing action. Please try again.');
  }
}
