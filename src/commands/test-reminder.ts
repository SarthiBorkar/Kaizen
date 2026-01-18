import { Context } from 'grammy';
import { sendTestReminder } from '../handlers/reminders.js';

/**
 * /testreminder command - Send an immediate test reminder
 */
export async function testReminderCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    await ctx.reply('📬 Sending test reminder...');

    // @ts-ignore - bot is available on ctx
    await sendTestReminder(ctx.api, userId);

    await ctx.reply(
      '✅ **Test reminder sent!**\n\n' +
      'If you received a reminder message with your tasks, it means:\n' +
      '✅ Your reminder system is working\n' +
      '✅ You will get reminders at your scheduled time\n\n' +
      '**Reminder times:**\n' +
      '• 8:00 AM\n' +
      '• 6:00 PM\n' +
      '• 8:00 PM\n' +
      '• 10:00 PM\n\n' +
      'To change your reminder time, use /start again.'
    );
  } catch (error) {
    console.error('Error in testReminderCommand:', error);
    await ctx.reply(
      '❌ **Test reminder failed**\n\n' +
      'Possible reasons:\n' +
      '• You haven\'t set up your tasks yet (use /start)\n' +
      '• You haven\'t selected a reminder time\n\n' +
      'Use /start to complete your profile setup.'
    );
  }
}
