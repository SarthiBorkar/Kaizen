import { Context } from 'grammy';
import { getUser, getUserGroups, getUserCheckins } from '../db/queries.js';
import { NO_GROUPS, NO_CHECKINS_YET, ERROR_NO_COMMITMENT } from '../utils/messages.js';
import { calculateStreak } from '../utils/dates.js';
import {
  generateMonthlyCalendar,
  generateWeeklyStreak,
  formatStreakDisplay,
  getRankForStreak,
  getSeasonForStreak,
} from '../utils/visuals.js';

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

    // Get all check-ins for the month
    const checkinsResult = await getUserCheckins(user.id, group.id, 90);

    if (checkinsResult.rows.length === 0) {
      await ctx.reply(NO_CHECKINS_YET);
      return;
    }

    // Calculate streak
    const streak = calculateStreak(checkinsResult.rows as any);
    const rank = getRankForStreak(streak);
    const season = getSeasonForStreak(streak);

    // Generate visual calendar
    const calendar = generateMonthlyCalendar(checkinsResult.rows as any);

    // Generate weekly streak (last 14 days)
    const weeklyStreak = generateWeeklyStreak(checkinsResult.rows as any, 14);

    // Build message
    let message = `${rank.emoji} Your Progress - ${group.name} ${rank.emoji}\n\n`;
    message += `${season.emoji} Current Season: ${season.name} (${season.kanji})\n`;
    message += `${formatStreakDisplay(streak)}\n\n`;
    message += `${calendar}\n\n`;
    message += `${weeklyStreak}\n`;
    message += `💡 Use /stats for detailed statistics`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in view command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
