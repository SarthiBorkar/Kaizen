import { Context } from 'grammy';
import { getUser, getUserGroups, getUserCheckins, getTaskCompletionStats } from '../db/queries.js';
import { calculateStreak, getWeekStart, getDaysAgo } from '../utils/dates.js';
import { db } from '../db/client.js';

/**
 * /report command - Generate weekly progress report
 */
export async function reportCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    await ctx.reply('📊 Generating your weekly report...');

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
    const userDbId = user.id as number;
    const firstName = user.first_name as string || 'there';

    // Get user's groups
    const groupsResult = await getUserGroups(userDbId);
    if (groupsResult.rows.length === 0) {
      await ctx.reply(
        '❌ **No groups found**\n\n' +
        'You need to be in an accountability group to see reports.\n' +
        'Add the bot to a Telegram group to get started!'
      );
      return;
    }

    // For MVP, use first group
    const group = groupsResult.rows[0];
    const groupId = group.id as number;
    const groupName = group.name as string;

    // Get check-ins for the past 7 days (this week)
    const thisWeekCheckins = await getUserCheckins(userDbId, groupId, 7);
    const thisWeekData = thisWeekCheckins.rows as any;

    // Get check-ins for previous 7 days (last week)
    const lastWeekStart = getDaysAgo(14);
    const lastWeekEnd = getDaysAgo(7);
    const lastWeekCheckinsResult = await db.execute({
      sql: `SELECT check_date, completed
            FROM checkins
            WHERE user_id = ? AND group_id = ?
            AND check_date >= ? AND check_date < ?
            ORDER BY check_date DESC`,
      args: [userDbId, groupId, lastWeekStart, lastWeekEnd],
    });
    const lastWeekData = lastWeekCheckinsResult.rows as any;

    // Calculate stats for this week
    const thisWeekTotal = thisWeekData.length;
    const thisWeekCompleted = thisWeekData.filter((c: any) => c.completed).length;
    const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;

    // Calculate stats for last week
    const lastWeekTotal = lastWeekData.length;
    const lastWeekCompleted = lastWeekData.filter((c: any) => c.completed).length;
    const lastWeekRate = lastWeekTotal > 0 ? Math.round((lastWeekCompleted / lastWeekTotal) * 100) : 0;

    // Get current streak
    const allCheckins = await getUserCheckins(userDbId, groupId, 365);
    const currentStreak = calculateStreak(allCheckins.rows as any);

    // Get task completion stats
    const taskStats = await getTaskCompletionStats(userDbId, 7);
    const tasks = taskStats.rows as any;

    // Build report message
    let report = `📊 **Weekly Progress Report**\n`;
    report += `Hey ${firstName}! Here's your weekly summary.\n\n`;

    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📅 **This Week**\n`;
    report += `Group: ${groupName}\n\n`;

    report += `✅ Check-ins: ${thisWeekCompleted}/${thisWeekTotal}\n`;
    report += `📈 Completion rate: ${thisWeekRate}%\n`;
    report += `🔥 Current streak: ${currentStreak} days\n\n`;

    // Task breakdown
    if (tasks.length > 0) {
      report += `**Task Performance:**\n`;
      for (const task of tasks) {
        const taskRate = task.total_checkins > 0
          ? Math.round((Number(task.completed_count) / Number(task.total_checkins)) * 100)
          : 0;
        const statusEmoji = taskRate >= 80 ? '🟢' : taskRate >= 50 ? '🟡' : '🔴';
        report += `${statusEmoji} ${task.task_name}: ${taskRate}%\n`;
      }
      report += `\n`;
    }

    // Comparison with last week
    if (lastWeekTotal > 0) {
      report += `━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `📊 **Last Week Comparison**\n\n`;

      const rateDiff = thisWeekRate - lastWeekRate;
      const trendEmoji = rateDiff > 0 ? '📈' : rateDiff < 0 ? '📉' : '➡️';
      const trendText = rateDiff > 0 ? 'up' : rateDiff < 0 ? 'down' : 'same';

      report += `Last week: ${lastWeekCompleted}/${lastWeekTotal} (${lastWeekRate}%)\n`;
      report += `${trendEmoji} You're ${Math.abs(rateDiff)}% ${trendText} from last week\n\n`;
    }

    // Motivational message
    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `💪 **Keep Going!**\n\n`;

    if (thisWeekRate >= 80) {
      report += `Excellent work! You're crushing it this week. 🎉\n`;
      report += `Your consistency is building real momentum.`;
    } else if (thisWeekRate >= 50) {
      report += `Good progress! You're on the right track. 💪\n`;
      report += `Keep pushing - consistency is key.`;
    } else {
      report += `This week was tough, but that's okay! 🌱\n`;
      report += `Remember: Progress isn't always linear.\n`;
      report += `Tomorrow is a new opportunity to build momentum.`;
    }

    report += `\n\n🔔 Use /remind to never miss a check-in!`;

    await ctx.reply(report, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in reportCommand:', error);
    await ctx.reply(
      '❌ **Error**\n\n' +
      'Failed to generate your weekly report. Please try again.'
    );
  }
}

/**
 * Send weekly reports to all users
 * This function is called by the weekly cron job
 */
export async function sendWeeklyReports(bot: any) {
  try {
    // Get all users with groups
    const usersResult = await db.execute({
      sql: `SELECT DISTINCT u.telegram_id, u.id as user_id, u.first_name
            FROM users u
            JOIN memberships m ON u.id = m.user_id
            WHERE u.reminder_hour IS NOT NULL AND u.reminder_hour != -1`,
      args: [],
    });

    console.log(`📊 Sending weekly reports to ${usersResult.rows.length} users`);

    for (const userRow of usersResult.rows) {
      try {
        const telegramId = userRow.telegram_id as number;
        const userDbId = userRow.user_id as number;
        const firstName = userRow.first_name as string || 'there';

        // Get user's first group
        const groupsResult = await getUserGroups(userDbId);
        if (groupsResult.rows.length === 0) continue;

        const group = groupsResult.rows[0];
        const groupId = group.id as number;
        const groupName = group.name as string;

        // Get this week's check-ins
        const thisWeekCheckins = await getUserCheckins(userDbId, groupId, 7);
        const thisWeekData = thisWeekCheckins.rows as any;

        // Calculate stats
        const thisWeekTotal = thisWeekData.length;
        const thisWeekCompleted = thisWeekData.filter((c: any) => c.completed).length;
        const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;

        // Get current streak
        const allCheckins = await getUserCheckins(userDbId, groupId, 365);
        const currentStreak = calculateStreak(allCheckins.rows as any);

        // Build simplified report for automated send
        let report = `📊 **Your Weekly Summary**\n\n`;
        report += `Hey ${firstName}! Here's how you did this week:\n\n`;
        report += `✅ Check-ins: ${thisWeekCompleted}/${thisWeekTotal}\n`;
        report += `📈 Success rate: ${thisWeekRate}%\n`;
        report += `🔥 Current streak: ${currentStreak} days\n\n`;

        if (thisWeekRate >= 80) {
          report += `🎉 Amazing work! You're building incredible momentum.\n\n`;
        } else if (thisWeekRate >= 50) {
          report += `💪 Good job! Keep the consistency going.\n\n`;
        } else {
          report += `🌱 New week, new opportunities. You've got this!\n\n`;
        }

        report += `Use /report for detailed stats.\n`;
        report += `Use /remind to set your check-in time.`;

        await bot.api.sendMessage(telegramId, report, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Failed to send weekly report to user ${userRow.telegram_id}:`, error);
      }
    }

    console.log('✅ Weekly reports sent successfully');
  } catch (error) {
    console.error('Error sending weekly reports:', error);
  }
}
