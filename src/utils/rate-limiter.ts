/**
 * Rate Limiter for protecting API endpoints from abuse
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.limits = new Map();

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if user has exceeded rate limit
   * @param userId - User's Telegram ID
   * @param action - Action being rate limited (e.g., 'ai_ask', 'voice', 'research')
   * @param maxRequests - Maximum requests allowed in window
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded
   */
  isRateLimited(
    userId: number,
    action: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || entry.resetAt < now) {
      // No entry or expired - create new
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return false;
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return true;
    }

    // Increment count
    entry.count++;
    return false;
  }

  /**
   * Get remaining requests for user
   */
  getRemainingRequests(
    userId: number,
    action: string,
    maxRequests: number
  ): number {
    const key = `${userId}:${action}`;
    const entry = this.limits.get(key);

    if (!entry || entry.resetAt < Date.now()) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(userId: number, action: string): number {
    const key = `${userId}:${action}`;
    const entry = this.limits.get(key);

    if (!entry || entry.resetAt < Date.now()) {
      return 0;
    }

    return Math.ceil((entry.resetAt - Date.now()) / 1000);
  }

  /**
   * Reset rate limit for a user/action
   */
  reset(userId: number, action: string): void {
    const key = `${userId}:${action}`;
    this.limits.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Stop cleanup interval (call when shutting down)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Rate limit configurations
export const RATE_LIMITS = {
  // AI Commands
  AI_ASK: {
    maxRequests: 20, // 20 requests
    windowMs: 60 * 60 * 1000, // per hour
    action: 'ai_ask',
  },

  AI_RESEARCH: {
    maxRequests: 10, // 10 requests (Perplexity costs money)
    windowMs: 60 * 60 * 1000, // per hour
    action: 'ai_research',
  },

  VOICE_MESSAGE: {
    maxRequests: 15, // 15 voice messages
    windowMs: 60 * 60 * 1000, // per hour
    action: 'voice',
  },

  // MCP Automation
  WEB_SCRAPE: {
    maxRequests: 30, // 30 scrapes
    windowMs: 60 * 60 * 1000, // per hour
    action: 'web_scrape',
  },

  RESEARCH_AUTOMATION: {
    maxRequests: 10, // 10 automated research
    windowMs: 60 * 60 * 1000, // per hour
    action: 'research_automation',
  },

  CALENDAR_CREATE: {
    maxRequests: 20, // 20 calendar events
    windowMs: 60 * 60 * 1000, // per hour
    action: 'calendar_create',
  },

  DOCUMENT_CREATE: {
    maxRequests: 50, // 50 documents
    windowMs: 60 * 60 * 1000, // per hour
    action: 'document_create',
  },

  // General check-in (should be generous)
  CHECKIN: {
    maxRequests: 10, // 10 check-ins
    windowMs: 60 * 60 * 1000, // per hour
    action: 'checkin',
  },
};

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Helper function to format rate limit error message
 */
export function getRateLimitMessage(
  action: string,
  resetTimeSeconds: number
): string {
  const minutes = Math.ceil(resetTimeSeconds / 60);

  const actionNames: Record<string, string> = {
    ai_ask: 'AI chat',
    ai_research: 'deep research',
    voice: 'voice messages',
    web_scrape: 'web scraping',
    research_automation: 'automated research',
    calendar_create: 'calendar events',
    document_create: 'document creation',
    checkin: 'check-ins',
  };

  const actionName = actionNames[action] || action;

  return (
    `⏱️ **Rate Limit Exceeded**\n\n` +
    `You've used too many ${actionName} requests.\n\n` +
    `Please wait **${minutes} minute${minutes !== 1 ? 's' : ''}** before trying again.\n\n` +
    `💡 *Tip: Rate limits help prevent abuse and keep costs manageable.*`
  );
}
