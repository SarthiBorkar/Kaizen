# Rate Limiting Guide

## Overview

Kaizen Bot implements rate limiting to protect API keys from abuse and manage costs. Rate limits are applied per user per time window.

## Rate Limit Configuration

### AI Features

| Feature | Limit | Window | Command |
|---------|-------|--------|---------|
| AI Chat | 20 requests | 1 hour | `/ask` |
| Deep Research | 10 requests | 1 hour | `/dr`, `/deepresearch` |
| Voice Messages | 15 messages | 1 hour | Voice/audio messages |

### MCP Automation

| Feature | Limit | Window | Command |
|---------|-------|--------|---------|
| Web Scraping | 30 requests | 1 hour | `/scrape` |
| Research Automation | 10 requests | 1 hour | `/research` |
| Calendar Events | 20 events | 1 hour | `/calendar` |
| Document Creation | 50 documents | 1 hour | Document tools |

### General Features

| Feature | Limit | Window | Command |
|---------|-------|--------|---------|
| Check-ins | 10 requests | 1 hour | `/checkin` |

## How It Works

1. **Per-User Tracking**: Each user has their own rate limit counters
2. **Time Windows**: Limits reset after the time window expires (e.g., 1 hour)
3. **Action-Based**: Different actions have different limits
4. **Automatic Reset**: Counters automatically reset after the window

## Rate Limit Response

When you hit a rate limit, you'll see:

```
⏱️ Rate Limit Exceeded

You've used too many [feature] requests.

Please wait X minutes before trying again.

💡 Tip: Rate limits help prevent abuse and keep costs manageable.
```

## Checking Your Limits

Use `/ratelimits` to see your current usage:

```
📊 Your Rate Limits

🟢 AI Chat (/ask)
   18/20 remaining

🟡 Deep Research (/dr)
   4/10 remaining (resets in 23m)

🔴 Voice Messages
   0/15 remaining (resets in 45m)

💡 Rate limits protect against abuse and keep API costs manageable.
```

### Status Indicators

- 🟢 **Green**: >50% remaining
- 🟡 **Yellow**: 25-50% remaining
- 🔴 **Red**: <25% remaining

## Why Rate Limits?

### Cost Protection

AI APIs cost money per request:
- **Groq**: Free but has rate limits (30 req/min)
- **Perplexity**: ~$0.002-0.01 per query
- **MCP Services**: Depend on the service

Without rate limits, a single user could rack up significant costs.

### Abuse Prevention

Rate limits prevent:
- Spam and bot attacks
- Accidental infinite loops
- Malicious usage
- Service degradation

### Fair Usage

Ensures all users get fair access to the bot's features.

## Adjusting Limits

If you're self-hosting and want to adjust limits, edit:

`src/utils/rate-limiter.ts`

```typescript
export const RATE_LIMITS = {
  AI_ASK: {
    maxRequests: 20,    // Change this
    windowMs: 60 * 60 * 1000,  // 1 hour
    action: 'ai_ask',
  },
  // ... other limits
};
```

## Implementation Details

### Rate Limiter

- **In-Memory Storage**: Uses Map for fast lookups
- **Automatic Cleanup**: Expired entries cleaned every 5 minutes
- **Per-User Per-Action**: Tracks `userId:action` combinations
- **Time-Based Windows**: Sliding window implementation

### Code Location

- **Rate Limiter**: `src/utils/rate-limiter.ts`
- **Applied In**:
  - `src/commands/ai.ts` - AI commands
  - `src/handlers/voice.ts` - Voice messages
  - `src/commands/automation.ts` - MCP automation
  - `src/commands/rate-limit-info.ts` - Status display

## API Reference

### Check Rate Limit

```typescript
import { rateLimiter, RATE_LIMITS } from './utils/rate-limiter.js';

if (rateLimiter.isRateLimited(
  userId,
  RATE_LIMITS.AI_ASK.action,
  RATE_LIMITS.AI_ASK.maxRequests,
  RATE_LIMITS.AI_ASK.windowMs
)) {
  // User is rate limited
  const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.AI_ASK.action);
  // Show error message
}
```

### Get Remaining Requests

```typescript
const remaining = rateLimiter.getRemainingRequests(
  userId,
  RATE_LIMITS.AI_ASK.action,
  RATE_LIMITS.AI_ASK.maxRequests
);
```

### Reset Limit Manually

```typescript
rateLimiter.reset(userId, RATE_LIMITS.AI_ASK.action);
```

## Best Practices

### For Users

1. **Check limits regularly** with `/ratelimits`
2. **Plan research queries** to stay within limits
3. **Use `/ask` for quick questions**, save `/dr` for important research
4. **Batch operations** when possible

### For Developers

1. **Monitor costs** regularly
2. **Adjust limits** based on usage patterns
3. **Log rate limit hits** for analysis
4. **Consider tiered limits** for premium users

## Troubleshooting

### "Rate Limit Exceeded" but I didn't use it

**Cause**: Rate limits are per hour. Previous requests count toward current window.

**Solution**: Wait for the window to reset, or check `/ratelimits` for details.

### Need Higher Limits

**Self-Hosted**: Edit `src/utils/rate-limiter.ts`

**Hosted Service**: Contact administrator

### Testing Rate Limits

To test rate limiting in development:

```typescript
// Temporarily reduce limits for testing
AI_ASK: {
  maxRequests: 3,  // Very low for testing
  windowMs: 60 * 1000,  // 1 minute
  action: 'ai_ask',
}
```

## Future Enhancements

- [ ] Database-backed rate limiting (survives restarts)
- [ ] Per-user custom limits
- [ ] Admin override commands
- [ ] Usage analytics dashboard
- [ ] Tiered pricing based on usage
- [ ] Warning at 75% usage

## Security

- **No bypass**: Rate limits enforced server-side
- **Per-user isolation**: Users can't affect each other's limits
- **Automatic cleanup**: Prevents memory leaks
- **Configurable**: Easy to adjust for your needs

---

**Rate limiting helps keep Kaizen Bot sustainable and fair for everyone!** 🎉
