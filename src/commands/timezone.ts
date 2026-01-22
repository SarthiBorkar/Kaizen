import { Context } from 'grammy';
import { getUser } from '../db/queries.js';
import { db } from '../db/client.js';

// Common timezones for quick selection
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

/**
 * /timezone command - View and set user timezone
 */
export async function timezoneCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Get user's current timezone
    const userResult = await getUser(userId);
    if (userResult.rows.length === 0) {
      await ctx.reply(
        '❌ **User not found**\n\n' +
        'Please use /start to set up your account first.'
      );
      return;
    }

    const user = userResult.rows[0];
    const currentTimezone = (user.timezone as string) || 'UTC';

    // Get the command argument
    const message = ctx.message?.text || '';
    const args = message.split(' ').slice(1);

    // If no arguments, show current timezone and instructions
    if (args.length === 0) {
      const now = new Date();
      const timeInUserTz = now.toLocaleString('en-US', {
        timeZone: currentTimezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      let message = `🌍 **Your Timezone**\n\n`;
      message += `📍 ${currentTimezone}\n`;
      message += `🕐 Current time: ${timeInUserTz}\n\n`;
      message += `**To change:**\n`;
      message += `/timezone <IANA timezone>\n\n`;
      message += `**Examples:**\n`;
      message += `• \`/timezone America/New_York\`\n`;
      message += `• \`/timezone Europe/London\`\n`;
      message += `• \`/timezone Asia/Tokyo\`\n\n`;
      message += `**Common timezones:**\n`;
      COMMON_TIMEZONES.forEach(tz => {
        message += `• ${tz}\n`;
      });
      message += `\n🔍 [Full timezone list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
      return;
    }

    // User wants to set a new timezone
    const newTimezone = args.join(' ').trim();

    // Validate timezone
    try {
      // Test if the timezone is valid by trying to use it
      new Date().toLocaleString('en-US', { timeZone: newTimezone });
    } catch (error) {
      await ctx.reply(
        `❌ **Invalid timezone:** \`${newTimezone}\`\n\n` +
        `Please use a valid IANA timezone name.\n\n` +
        `**Examples:**\n` +
        `• America/New_York\n` +
        `• Europe/London\n` +
        `• Asia/Tokyo\n\n` +
        `Use \`/timezone\` to see common options.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Update timezone in database
    await db.execute({
      sql: `UPDATE users SET timezone = ?, updated_at = datetime('now') WHERE telegram_id = ?`,
      args: [newTimezone, userId],
    });

    const now = new Date();
    const timeInNewTz = now.toLocaleString('en-US', {
      timeZone: newTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    await ctx.reply(
      `✅ **Timezone Updated!**\n\n` +
      `📍 ${newTimezone}\n` +
      `🕐 Current time: ${timeInNewTz}\n\n` +
      `💡 All your reminders will now use this timezone.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in timezoneCommand:', error);
    await ctx.reply(
      '❌ **Error**\n\n' +
      'Failed to update timezone. Please try again.'
    );
  }
}
