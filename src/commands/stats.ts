import { Context } from 'grammy';
import { getUser, getUserGroups, getUserStats, getUserCheckins } from '../db/queries.js';
import { NO_GROUPS, NO_CHECKINS_YET, ERROR_NO_COMMITMENT } from '../utils/messages.js';
import { calculateStreak } from '../utils/dates.js';
import { generateRankCard, formatStreakDisplay } from '../utils/visuals.js';

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

    // Generate rank card
    const rankCard = generateRankCard(currentStreak, totalDays, completedDays);

    // Build comprehensive stats message
    let message = `📊 Your Statistics - ${group.name}\n\n`;
    message += rankCard;
    message += `\n\n━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 Detailed Stats:\n\n`;
    message += `Total check-ins: ${totalDays}\n`;
    message += `Completed: ${completedDays}\n`;
    message += `Missed: ${totalDays - completedDays}\n`;
    message += `${formatStreakDisplay(currentStreak)}\n\n`;
    message += `💪 Keep pushing forward! Every day counts.`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in stats command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
