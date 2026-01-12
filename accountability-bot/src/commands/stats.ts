import { Context } from 'grammy';
import { getUser, getUserGroups, getUserStats, getUserCheckins } from '../db/queries.js';
import { NO_GROUPS, NO_CHECKINS_YET, ERROR_NO_COMMITMENT, STATS_MESSAGE } from '../utils/messages.js';
import { calculateStreak, formatDate as formatDateUtil } from '../utils/dates.js';
import { formatDate } from '../utils/messages.js';

export async function statsCommand(ctx: Context) {
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

    // For MVP, show first group's stats
    const group = groupsResult.rows[0];

    // Get stats
    const stats = await getUserStats(user.id, group.id);

    if (!stats || stats.total_days === 0) {
      await ctx.reply(NO_CHECKINS_YET);
      return;
    }

    // Get all check-ins to calculate streak
    const checkinsResult = await getUserCheckins(user.id, group.id, 365); // Get all for accurate streak
    const currentStreak = calculateStreak(checkinsResult.rows as any);

    // Calculate success rate
    const totalDays = Number(stats.total_days);
    const completedDays = Number(stats.completed_days);
    const successRate = Math.round((completedDays / totalDays) * 100);

    // Format last check-in date
    const lastCheckin = stats.last_checkin ? formatDate(stats.last_checkin as string) : 'Never';

    await ctx.reply(
      STATS_MESSAGE({
        totalDays,
        completedDays,
        successRate,
        currentStreak,
        lastCheckin,
      })
    );
  } catch (error) {
    console.error('Error in stats command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
