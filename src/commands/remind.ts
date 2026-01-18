import { Context } from 'grammy';
import { getUser, updateReminderTime } from '../db/queries.js';

/**
 * /remind command - Manage daily reminder settings
 *
 * Usage:
 * /remind          - Show current reminder setting
 * /remind 8:00 AM  - Set reminder to 8:00 AM
 * /remind 20       - Set reminder to 8:00 PM (20:00)
 * /remind off      - Disable reminders
 */
export async function remindCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Get user
    const userResult = await getUser(userId);
    if (userResult.rows.length === 0) {
      await ctx.reply(
        '❌ **User not found**\n\n' +
        'Please use /start to set up your account first.'
      );
      return;
    }

    const user = userResult.rows[0];
    const currentHour = user.reminder_hour as number | null;

    // Get the command argument
    const message = ctx.message?.text || '';
    const args = message.split(' ').slice(1);

    // If no arguments, show current setting
    if (args.length === 0) {
      if (currentHour === null || currentHour === -1) {
        await ctx.reply(
          '🔕 **Reminders are currently OFF**\n\n' +
          'To enable reminders, use:\n' +
          '• `/remind 8` - for 8:00 AM\n' +
          '• `/remind 18` - for 6:00 PM\n' +
          '• `/remind 20` - for 8:00 PM\n' +
          '• `/remind 22` - for 10:00 PM',
          { parse_mode: 'Markdown' }
        );
      } else {
        const time12hr = formatHour12(currentHour);
        await ctx.reply(
          `⏰ **Your reminder is set for ${time12hr}**\n\n` +
          'To change it:\n' +
          '• `/remind 8` - for 8:00 AM\n' +
          '• `/remind 18` - for 6:00 PM\n' +
          '• `/remind 20` - for 8:00 PM\n' +
          '• `/remind 22` - for 10:00 PM\n\n' +
          'To disable: `/remind off`',
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }

    const timeArg = args.join(' ').toLowerCase();

    // Handle "off" to disable reminders
    if (timeArg === 'off' || timeArg === 'disable') {
      await updateReminderTime(userId, -1);
      await ctx.reply(
        '🔕 **Reminders disabled**\n\n' +
        'You won\'t receive daily check-in reminders.\n\n' +
        'To enable them again, use `/remind` with a time.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Parse time input
    const hour = parseTimeInput(timeArg);

    if (hour === null) {
      await ctx.reply(
        '❌ **Invalid time format**\n\n' +
        'Please use one of these formats:\n' +
        '• `/remind 8` - for 8:00 AM\n' +
        '• `/remind 18` - for 6:00 PM\n' +
        '• `/remind 20` - for 8:00 PM\n' +
        '• `/remind 22` - for 10:00 PM\n\n' +
        'Or use `/remind off` to disable reminders.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Update reminder time
    await updateReminderTime(userId, hour);

    const time12hr = formatHour12(hour);
    await ctx.reply(
      `✅ **Reminder set for ${time12hr}**\n\n` +
      'You\'ll receive a daily reminder at this time to check in with your tasks.\n\n' +
      '💡 *Tip: Choose a time when you usually reflect on your day.*',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in remindCommand:', error);
    await ctx.reply(
      '❌ **Error**\n\n' +
      'Failed to update reminder settings. Please try again.'
    );
  }
}

/**
 * Parse various time input formats into 24-hour format
 * Supports: "8", "8am", "8:00", "8:00 AM", "20", "8pm", etc.
 */
function parseTimeInput(input: string): number | null {
  // Remove whitespace and convert to lowercase
  input = input.trim().toLowerCase();

  // Check for available reminder hours: 8, 18, 20, 22
  const availableHours = [8, 18, 20, 22];

  // Try to parse as simple hour number
  const simpleHour = parseInt(input);
  if (!isNaN(simpleHour) && availableHours.includes(simpleHour)) {
    return simpleHour;
  }

  // Parse formats like "8am", "8:00am", "8 am", "8:00 am"
  const amPmMatch = input.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/i);
  if (amPmMatch) {
    let hour = parseInt(amPmMatch[1]);
    const minutes = amPmMatch[2] ? parseInt(amPmMatch[2]) : 0;
    const ampm = amPmMatch[3];

    // Only accept :00 minutes
    if (minutes !== 0) {
      return null;
    }

    // Convert to 24-hour format if AM/PM specified
    if (ampm === 'pm' && hour !== 12) {
      hour += 12;
    } else if (ampm === 'am' && hour === 12) {
      hour = 0;
    }

    // Check if it's one of our available hours
    if (availableHours.includes(hour)) {
      return hour;
    }
  }

  return null;
}

/**
 * Format hour (24-hour) to 12-hour format with AM/PM
 */
function formatHour12(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}
