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

    // Check-in responses - Enhanced
    if (callbackData.startsWith('checkin_crushed_')) {
      const groupId = parseInt(callbackData.replace('checkin_crushed_', ''));
      await handleCheckinResponse(ctx, true, groupId, 'crushed');
      return;
    }

    if (callbackData.startsWith('checkin_yes_')) {
      const groupId = parseInt(callbackData.replace('checkin_yes_', ''));
      await handleCheckinResponse(ctx, true, groupId, 'completed');
      return;
    }

    if (callbackData.startsWith('checkin_partial_')) {
      const groupId = parseInt(callbackData.replace('checkin_partial_', ''));
      await handleCheckinResponse(ctx, true, groupId, 'partial');
      return;
    }

    if (callbackData.startsWith('checkin_no_')) {
      const groupId = parseInt(callbackData.replace('checkin_no_', ''));
      await handleCheckinResponse(ctx, false, groupId, 'missed');
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
      await ctx.answerCallbackQuery();
      const { checkinCommand } = await import('../commands/checkin.js');
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
