import { Context } from 'grammy';
import { getUser, getUserGroups, getUserCheckins, getTaskCompletionStats } from '../db/queries.js';
import { calculateStreak } from '../utils/dates.js';
import { chatWithAI } from '../services/ai.js';
import { rateLimiter, RATE_LIMITS, getRateLimitMessage } from '../utils/rate-limiter.js';

/**
 * /insights command - Get AI-powered insights about your habits
 */
export async function insightsCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check rate limit
  if (rateLimiter.isRateLimited(
    userId,
    RATE_LIMITS.AI_INSIGHTS?.action || 'ai_insights',
    RATE_LIMITS.AI_INSIGHTS?.maxRequests || 5,
    RATE_LIMITS.AI_INSIGHTS?.windowMs || 3600000
  )) {
    const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.AI_INSIGHTS?.action || 'ai_insights');
    await ctx.reply(getRateLimitMessage('AI Insights', resetTime), {
      parse_mode: 'Markdown',
    });
    return;
  }

  try {
    await ctx.reply('🤖 Analyzing your habits and generating insights...');

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
        '❌ **No data available**\n\n' +
        'You need to join a group and complete some check-ins before I can provide insights.\n\n' +
        'Add the bot to a Telegram group to get started!'
      );
      return;
    }

    // For MVP, use first group
    const group = groupsResult.rows[0];
    const groupId = group.id as number;

    // Get check-ins for the past 30 days
    const checkinsResult = await getUserCheckins(userDbId, groupId, 30);
    const checkins = checkinsResult.rows as any;

    if (checkins.length === 0) {
      await ctx.reply(
        '❌ **Not enough data**\n\n' +
        'You need at least a few check-ins before I can provide meaningful insights.\n\n' +
        'Use /checkin to start tracking your progress!'
      );
      return;
    }

    // Get task completion stats
    const taskStatsResult = await getTaskCompletionStats(userDbId, 30);
    const taskStats = taskStatsResult.rows as any;

    // Calculate current streak
    const currentStreak = calculateStreak(checkins);

    // Calculate completion rate
    const totalCheckins = checkins.length;
    const completedCheckins = checkins.filter((c: any) => c.completed).length;
    const completionRate = Math.round((completedCheckins / totalCheckins) * 100);

    // Analyze weekly trends
    const lastWeek = checkins.slice(0, 7);
    const previousWeek = checkins.slice(7, 14);
    const lastWeekRate = lastWeek.length > 0
      ? Math.round((lastWeek.filter((c: any) => c.completed).length / lastWeek.length) * 100)
      : 0;
    const previousWeekRate = previousWeek.length > 0
      ? Math.round((previousWeek.filter((c: any) => c.completed).length / previousWeek.length) * 100)
      : 0;

    // Build data summary for AI
    const dataContext = `
User: ${firstName}
Current Streak: ${currentStreak} days
Total Check-ins (30 days): ${totalCheckins}
Completed: ${completedCheckins}
Overall Completion Rate: ${completionRate}%

Recent Trends:
- Last 7 days: ${lastWeekRate}% completion rate
- Previous 7 days: ${previousWeekRate}% completion rate
- Trend: ${lastWeekRate > previousWeekRate ? 'Improving' : lastWeekRate < previousWeekRate ? 'Declining' : 'Stable'}

Task Performance:
${taskStats.map((task: any) => {
  const taskRate = task.total_checkins > 0
    ? Math.round((Number(task.completed_count) / Number(task.total_checkins)) * 100)
    : 0;
  return `- ${task.task_name}: ${taskRate}% (${task.completed_count}/${task.total_checkins})`;
}).join('\n')}

Recent Check-in Dates:
${checkins.slice(0, 10).map((c: any) => `${c.check_date}: ${c.completed ? 'Completed' : 'Missed'}`).join('\n')}
`;

    const insightPrompt = `You are Kaizen, an AI accountability coach. Based on the following user data, provide personalized insights and recommendations.

${dataContext}

Provide:
1. A brief analysis of their habits (2-3 sentences)
2. Specific patterns you notice (good and areas for improvement)
3. 2-3 actionable recommendations to improve consistency
4. One motivational message based on their current performance

Keep your response under 400 words. Be encouraging but honest. Focus on actionable advice.`;

    // Generate insights using AI
    const insights = await chatWithAI(userId, insightPrompt);

    // Build response
    let response = `🔮 **AI Insights for ${firstName}**\n\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `📊 **Your Data Summary**\n\n`;
    response += `Current Streak: 🔥 ${currentStreak} days\n`;
    response += `30-Day Completion: ${completionRate}%\n`;
    response += `Check-ins: ${completedCheckins}/${totalCheckins}\n\n`;

    if (lastWeekRate !== previousWeekRate) {
      const change = lastWeekRate - previousWeekRate;
      const emoji = change > 0 ? '📈' : '📉';
      response += `Weekly Trend: ${emoji} ${Math.abs(change)}% ${change > 0 ? 'up' : 'down'}\n\n`;
    }

    response += `━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `🤖 **AI Analysis**\n\n`;
    response += insights;

    response += `\n\n━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `💡 *Use /report for detailed stats*\n`;
    response += `🔄 *Insights refresh with new check-ins*`;

    await ctx.reply(response);
  } catch (error) {
    console.error('Error in insightsCommand:', error);

    const errorMsg = error instanceof Error && error.message.includes('GROQ_API_KEY')
      ? '❌ AI insights require GROQ_API_KEY to be configured. Please contact the bot administrator.'
      : '❌ Failed to generate insights. Please try again.';

    await ctx.reply(errorMsg);
  }
}
