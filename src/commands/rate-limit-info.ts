import { Context } from 'grammy';
import { rateLimiter, RATE_LIMITS } from '../utils/rate-limiter.js';

/**
 * /ratelimits command - Show user's rate limit status
 */
export async function rateLimitsCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const limits = [
    {
      name: 'AI Chat (/ask)',
      action: RATE_LIMITS.AI_ASK.action,
      max: RATE_LIMITS.AI_ASK.maxRequests,
      window: 'hour',
    },
    {
      name: 'Deep Research (/dr)',
      action: RATE_LIMITS.AI_RESEARCH.action,
      max: RATE_LIMITS.AI_RESEARCH.maxRequests,
      window: 'hour',
    },
    {
      name: 'Voice Messages',
      action: RATE_LIMITS.VOICE_MESSAGE.action,
      max: RATE_LIMITS.VOICE_MESSAGE.maxRequests,
      window: 'hour',
    },
    {
      name: 'Web Scraping',
      action: RATE_LIMITS.WEB_SCRAPE.action,
      max: RATE_LIMITS.WEB_SCRAPE.maxRequests,
      window: 'hour',
    },
    {
      name: 'Research Automation',
      action: RATE_LIMITS.RESEARCH_AUTOMATION.action,
      max: RATE_LIMITS.RESEARCH_AUTOMATION.maxRequests,
      window: 'hour',
    },
  ];

  let message = '📊 **Your Rate Limits**\n\n';

  for (const limit of limits) {
    const remaining = rateLimiter.getRemainingRequests(userId, limit.action, limit.max);
    const resetTime = rateLimiter.getResetTime(userId, limit.action);

    const percentage = (remaining / limit.max) * 100;
    let emoji = '🟢';
    if (percentage < 25) emoji = '🔴';
    else if (percentage < 50) emoji = '🟡';

    message += `${emoji} **${limit.name}**\n`;
    message += `   ${remaining}/${limit.max} remaining`;

    if (resetTime > 0) {
      const minutes = Math.ceil(resetTime / 60);
      message += ` (resets in ${minutes}m)`;
    }

    message += '\n\n';
  }

  message += '💡 *Rate limits protect against abuse and keep API costs manageable.*';

  await ctx.reply(message, { parse_mode: 'Markdown' });
}
