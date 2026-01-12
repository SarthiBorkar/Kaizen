import { Context } from 'grammy';
import { getUser, getUserGroups, getUserCheckins } from '../db/queries.js';
import { NO_GROUPS, NO_CHECKINS_YET, ERROR_NO_COMMITMENT } from '../utils/messages.js';
import { formatDate, formatStreak } from '../utils/messages.js';
import { calculateStreak } from '../utils/dates.js';

export async function viewCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    // Get user
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user || !user.commitment) {
      await ctx.reply(ERROR_NO_COMMITMENT);
      return;
    }

    // Get user's groups
    const groupsResult = await getUserGroups(user.id);

    if (groupsResult.rows.length === 0) {
      await ctx.reply(NO_GROUPS);
      return;
    }

    // For MVP, show first group's progress
    // TODO: Add group selection for multiple groups
    const group = groupsResult.rows[0];

    // Get recent check-ins (last 7 days)
    const checkinsResult = await getUserCheckins(user.id, group.id, 7);

    if (checkinsResult.rows.length === 0) {
      await ctx.reply(NO_CHECKINS_YET);
      return;
    }

    // Format check-ins
    let message = `📊 Your Progress\n\nGroup: ${group.name}\n\n`;

    for (const checkin of checkinsResult.rows) {
      const emoji = checkin.completed ? '✅' : '❌';
      const status = checkin.completed ? 'Completed' : 'Missed';
      message += `${emoji} ${formatDate(checkin.check_date)} - ${status}\n`;
    }

    // Calculate streak
    const streak = calculateStreak(checkinsResult.rows as any);
    message += `\n🔥 Current streak: ${formatStreak(streak)}`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in view command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
