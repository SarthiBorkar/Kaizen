import { Context } from 'grammy';
import { getUser, getStreakFreezeStatus, useStreakFreeze } from '../db/queries.js';
import { getTodayDate } from '../utils/dates.js';

/**
 * /freeze command - Use streak freeze to protect streak
 *
 * Usage:
 * /freeze        - Use your weekly freeze
 * /freeze status - Check freeze availability
 */
export async function freezeCommand(ctx: Context) {
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

    // Get freeze status
    const freezeResult = await getStreakFreezeStatus(userId);
    if (freezeResult.rows.length === 0) {
      await ctx.reply('❌ Error fetching freeze status. Please try again.');
      return;
    }

    const freezeData = freezeResult.rows[0];
    const freezesAvailable = (freezeData.streak_freezes_available as number) || 0;
    const lastResetDate = freezeData.last_freeze_reset_date as string;
    const freezeUsedDate = freezeData.freeze_used_on_date as string | null;

    // Get command argument
    const message = ctx.message?.text || '';
    const args = message.split(' ').slice(1);
    const command = args[0]?.toLowerCase();

    // Handle "status" command
    if (command === 'status') {
      await showFreezeStatus(ctx, freezesAvailable, lastResetDate, freezeUsedDate);
      return;
    }

    // Use freeze
    if (freezesAvailable <= 0) {
      await ctx.reply(
        '❌ **No freezes available**\n\n' +
        'You\'ve already used your weekly freeze.\n\n' +
        '**When do freezes reset?**\n' +
        'You get 1 new freeze every 7 days.\n' +
        `Last reset: ${formatDate(lastResetDate)}\n` +
        `Next reset: ${formatDate(getNextResetDate(lastResetDate))}\n\n` +
        'Use `/freeze status` to check your freeze availability.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const today = getTodayDate();

    // Check if already used today
    if (freezeUsedDate === today) {
      await ctx.reply(
        '⚠️ **Freeze already used today**\n\n' +
        'You\'ve already used your freeze for today.\n\n' +
        'Freezes protect your streak for one missed day. Use them strategically!',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Use the freeze
    const updateResult = await useStreakFreeze(userId, today);

    if (updateResult.rowsAffected === 0) {
      await ctx.reply(
        '❌ **Failed to use freeze**\n\n' +
        'Something went wrong. Please try again or contact support.'
      );
      return;
    }

    await ctx.reply(
      '❄️ **Freeze activated!**\n\n' +
      '✅ Your streak is now protected for today\n' +
      `📅 Date protected: ${formatDate(today)}\n\n` +
      '**What does this mean?**\n' +
      '• If you miss your check-in today, your streak won\'t break\n' +
      '• You still have time to check in if you want!\n' +
      '• This freeze has been used and won\'t be available again until next week\n\n' +
      '**Freezes reset weekly**\n' +
      `Next reset: ${formatDate(getNextResetDate(lastResetDate))}\n\n` +
      '💪 Keep building those habits!',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in freezeCommand:', error);
    await ctx.reply(
      '❌ **Error**\n\n' +
      'Failed to process freeze command. Please try again.'
    );
  }
}

/**
 * Show freeze status
 */
async function showFreezeStatus(
  ctx: Context,
  freezesAvailable: number,
  lastResetDate: string,
  freezeUsedDate: string | null
) {
  const nextReset = getNextResetDate(lastResetDate);
  const today = getTodayDate();

  let message = '❄️ **Streak Freeze Status**\n\n';

  if (freezesAvailable > 0) {
    message += `✅ **${freezesAvailable} freeze available**\n\n`;
    message += '**What are freezes?**\n';
    message += 'Freezes protect your streak when life happens.\n';
    message += 'Use `/freeze` to activate one for today.\n\n';
  } else {
    message += '❌ **No freezes available**\n\n';
    if (freezeUsedDate) {
      message += `Used on: ${formatDate(freezeUsedDate)}\n`;
    }
    message += `Next reset: ${formatDate(nextReset)}\n\n`;
  }

  message += '**How do freezes work?**\n';
  message += '• You get 1 free freeze every week\n';
  message += '• Use it to protect your streak for one day\n';
  message += '• Perfect for sick days, travel, or busy times\n';
  message += '• Freezes reset every 7 days\n\n';

  message += '**Why freezes matter:**\n';
  message += 'Research shows that harsh "all-or-nothing" penalties ';
  message += 'cause people to quit entirely. Freezes give you flexibility ';
  message += 'while maintaining accountability.\n\n';

  message += `Last reset: ${formatDate(lastResetDate)}\n`;
  message += `Next reset: ${formatDate(nextReset)}`;

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

/**
 * Get next freeze reset date (7 days after last reset)
 */
function getNextResetDate(lastResetDate: string): string {
  const date = new Date(lastResetDate);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
