# Accountability Bot: Claude Code Production PRD

## Version 2.0 - Optimized for 48-Hour Ship

**Project:** Accountability Bot 
**Platform:** Telegram  
**Developer:** Tokyo  
**Build Time:** 48 hours  
**Status:** Ready for Claude Code Implementation

---

## 🎯 Core Philosophy

Based on behavioral research:

- **Social accountability increases completion from 10% → 95%**
- **3 commands covering 94% of needs > 15 commands at 23% adoption**
- **One-tap interactions > text input**
- **Group visibility creates behavior change**

**We are NOT building:** Another solo habit tracker with gamification.  
**We ARE building:** The simplest possible group accountability mechanism.

---

## 📋 MVP Scope (48 Hours)

### What We Ship


| Feature                                  | Priority | Day |
| ---------------------------------------- | -------- | --- |
| `/start` - Onboarding + commitment setup | P0       | 1   |
| `/checkin` - One-tap daily check-in      | P0       | 1   |
| Group visibility (who checked in)        | P0       | 1   |
| Evening reminder (user-selected time)    | P0       | 2   |
| `/view` - See your streak + group status | P1       | 2   |
| `/stats` - Basic completion percentage   | P2       | 2   |


### What We Defer (v2+)

- Multiple habits per user
- Photo proof verification
- Points/badges/XP
- Leaderboards
- Web dashboard
- Payment/stakes integration
- AI coaching
- Rich analytics

---

## 🏗️ Technical Architecture

### Stack (Optimized for Solo Dev)

```
Runtime:        Node.js 20+ with TypeScript
Bot Framework:  grammy (lightweight, excellent DX)
Database:       Turso (libSQL) - edge-native, Tokyo already uses
Hosting:        Hetzner VPS + Coolify
Scheduler:      node-cron
```

### Why This Stack?


| Choice                | Reason                                                   |
| --------------------- | -------------------------------------------------------- |
| grammy over telegraf  | Smaller bundle, better TypeScript, active maintenance    |
| Turso over PostgreSQL | No separate service, edge-native, Tokyo's existing infra |
| node-cron over BullMQ | No Redis needed, sufficient for reminder scheduling      |
| No ORM                | Raw SQL is fine for 4 tables, less abstraction           |


### Project Structure (Minimal)

```
accountability-bot/
├── src/
│   ├── index.ts              # Entry point + bot setup
│   ├── config.ts             # Environment config
│   ├── db/
│   │   ├── client.ts         # Turso connection
│   │   ├── schema.sql        # Database schema
│   │   └── queries.ts        # All SQL queries
│   ├── commands/
│   │   ├── start.ts          # Onboarding flow
│   │   ├── checkin.ts        # Daily check-in
│   │   ├── view.ts           # View progress
│   │   └── stats.ts          # Statistics
│   ├── handlers/
│   │   ├── callbacks.ts      # Inline button handlers
│   │   └── reminders.ts      # Scheduled reminders
│   └── utils/
│       ├── keyboards.ts      # Inline keyboard builders
│       ├── messages.ts       # Message templates
│       └── dates.ts          # Date utilities
├── CLAUDE.md                 # Context persistence for Claude Code
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💾 Database Schema (Simplified)

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    commitment TEXT,                    -- Their one commitment
    reminder_hour INTEGER DEFAULT 20,   -- Hour for daily reminder (0-23)
    timezone TEXT DEFAULT 'Europe/Berlin',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Groups table
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_chat_id INTEGER UNIQUE NOT NULL,
    name TEXT,
    invite_code TEXT UNIQUE,            -- For invite links
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Group memberships
CREATE TABLE memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, group_id)
);

-- Daily check-ins
CREATE TABLE checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    check_date TEXT NOT NULL,           -- YYYY-MM-DD format
    completed BOOLEAN NOT NULL,         -- Did they complete?
    checked_in_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, group_id, check_date)
);

-- Indexes for common queries
CREATE INDEX idx_checkins_date ON checkins(check_date);
CREATE INDEX idx_checkins_user_date ON checkins(user_id, check_date);
CREATE INDEX idx_memberships_group ON memberships(group_id);
```

---

## 🔄 User Flows

### Flow 1: Onboarding (`/start`)

```
User: /start

Bot: 👋 Welcome to Accountability Bot!

     I help small groups keep each other accountable.
     One commitment. Daily check-ins. Group visibility.
     
     Research shows this increases goal completion from 10% to 95%.
     
     What's your ONE commitment for this week?
     (e.g., "Exercise 30 mins daily" or "Write 500 words")

User: Exercise 30 mins daily

Bot: 💪 Great commitment: "Exercise 30 mins daily"
     
     When should I remind you to check in?
     
     [🌅 8am] [🌆 6pm] [🌙 8pm] [🌚 10pm]

User: [taps 8pm]

Bot: ⏰ Reminder set for 8pm daily.
     
     Now let's connect you with your group:
     
     [➕ Create New Group] [🔗 Join Existing Group]
```

### Flow 2: Create/Join Group

```
[User taps: Create New Group]

Bot: 📝 What's your group name?

User: Tokyo's Accountability Squad

Bot: ✅ Group created: "Tokyo's Accountability Squad"
     
     Share this link to invite others:
     t.me/YourBot?start=join_abc123
     
     Once others join, you'll see each other's daily check-ins.
     I'll send your first reminder tonight at 8pm!

---

[User taps: Join Existing Group]

Bot: 🔗 Send me the invite link or code you received.

User: join_abc123

Bot: ✅ You've joined "Tokyo's Accountability Squad"!
     
     Current members:
     • @alice - "Read 20 pages daily"
     • @bob - "No social media before noon"
     • You - "Exercise 30 mins daily"
     
     I'll send your first reminder tonight at 8pm!
```

### Flow 3: Daily Check-in (Reminder + Response)

```
[8pm - Bot sends reminder in DM]

Bot: ⏰ Check-in time!
     
     Did you complete: "Exercise 30 mins daily"?
     
     [✅ Yes] [❌ No]

User: [taps ✅ Yes]

Bot: 🎉 Logged! You're on a 3-day streak.
     
     Group status for today:
     ✅ @tokyo - Exercise 30 mins daily
     ✅ @alice - Read 20 pages daily
     ⏳ @bob - waiting...
     
     ▓▓▓▓▓▓░░░░ 67% of group checked in
```

### Flow 4: View Progress (`/view`)

```
User: /view

Bot: 📊 Your Week (Jan 13-19, 2025)
     
     Commitment: "Exercise 30 mins daily"
     
     Mon ✅ Tue ✅ Wed ✅ Thu ⏳ Fri · Sat · Sun ·
     
     Current streak: 3 days 🔥
     This week: 3/3 (100%)
     
     ─────────────────────
     
     👥 Tokyo's Accountability Squad
     
     @tokyo    ▓▓▓▓▓▓▓▓▓▓ 100% (3/3)
     @alice    ▓▓▓▓▓▓▓░░░ 67%  (2/3)
     @bob      ▓▓▓░░░░░░░ 33%  (1/3)
```

### Flow 5: Stats (`/stats`)

```
User: /stats

Bot: 📈 Your Stats
     
     All-time:
     • Days tracked: 21
     • Completed: 17/21 (81%)
     • Longest streak: 7 days
     • Current streak: 3 days
     
     This week: 3/3 (100%) 🔥
     Last week: 5/7 (71%)
     
     💡 You're most consistent on weekdays!
```

---

## ⌨️ Inline Keyboards

### Time Selection Keyboard

```typescript
const timeKeyboard = new InlineKeyboard()
  .text("🌅 8am", "time_8")
  .text("🌆 6pm", "time_18")
  .row()
  .text("🌙 8pm", "time_20")
  .text("🌚 10pm", "time_22");
```

### Group Action Keyboard

```typescript
const groupKeyboard = new InlineKeyboard()
  .text("➕ Create New Group", "group_create")
  .text("🔗 Join Existing", "group_join");
```

### Check-in Keyboard

```typescript
const checkinKeyboard = new InlineKeyboard()
  .text("✅ Yes", "checkin_yes")
  .text("❌ No", "checkin_no");
```

---

## 🔔 Reminder System

```typescript
// src/handlers/reminders.ts
import cron from 'node-cron';

// Run every hour, check which users need reminders
cron.schedule('0 * * * *', async () => {
  const currentHour = new Date().getHours();
  
  // Get users whose reminder_hour matches current hour
  // AND haven't checked in today
  const usersToRemind = await db.execute(`
    SELECT u.telegram_id, u.commitment, u.first_name
    FROM users u
    WHERE u.reminder_hour = ?
    AND NOT EXISTS (
      SELECT 1 FROM checkins c 
      WHERE c.user_id = u.id 
      AND c.check_date = date('now')
    )
  `, [currentHour]);
  
  for (const user of usersToRemind.rows) {
    await bot.api.sendMessage(user.telegram_id, 
      `⏰ Check-in time!\n\nDid you complete: "${user.commitment}"?`,
      { reply_markup: checkinKeyboard }
    );
  }
});
```

---

## 🛠️ Implementation Checkpoints

### Checkpoint 1: Foundation (Day 1, Hours 1-4)

**Goal:** Bot responds to /start, database connected

- Initialize project with `npm init`, TypeScript config
- Install dependencies: `grammy`, `@libsql/client`, `node-cron`, `dotenv`
- Create Turso database, run schema
- Bot connects to Telegram, responds to /start with welcome message
- Basic error handling and logging

**Verify:** Send /start, bot responds with welcome message.

---

### Checkpoint 2: Onboarding Flow (Day 1, Hours 5-8)

**Goal:** User can set commitment and reminder time

- Conversation state management (awaiting_commitment, awaiting_time)
- Save commitment to database
- Time selection inline keyboard
- Save reminder preference
- Confirmation message

**Verify:** Complete onboarding, check database has user with commitment.

---

### Checkpoint 3: Group System (Day 1, Hours 9-12)

**Goal:** Users can create/join groups

- Create group with unique invite code
- Generate shareable invite link
- Parse invite code from /start deep link
- Join existing group
- Show group members after joining

**Verify:** Create group, share link, second user joins, both see each other.

---

### Checkpoint 4: Check-in System (Day 2, Hours 1-4)

**Goal:** Manual check-in works

- /checkin command shows inline keyboard
- Handle ✅/❌ button callbacks
- Save check-in to database
- Show group status after check-in
- Prevent duplicate check-ins same day

**Verify:** Check in, see it reflected in database and group status.

---

### Checkpoint 5: Automated Reminders (Day 2, Hours 5-8)

**Goal:** Bot sends reminders at user's preferred time

- Cron job running hourly
- Query users needing reminders
- Send personalized reminder with check-in keyboard
- Skip users who already checked in today

**Verify:** Set reminder time to current hour, receive reminder within minute.

---

### Checkpoint 6: View & Stats (Day 2, Hours 9-10)

**Goal:** Users can see their progress

- /view shows current week calendar
- Show streak count
- Show group member progress bars
- /stats shows all-time statistics

**Verify:** After several check-ins, /view and /stats show accurate data.

---

### Checkpoint 7: Polish & Deploy (Day 2, Hours 11-12)

**Goal:** Production-ready

- Error messages are friendly
- Edge cases handled (no group yet, first day, etc.)
- Deploy to Hetzner via Coolify
- Environment variables configured
- Test full flow with real users

**Verify:** Fresh user can complete entire flow without errors.

---

## 📝 CLAUDE.md Template

Create this file in the project root. Update after each checkpoint.

```markdown
# CLAUDE.md - Accountability Bot Context

## Project Status
**Current Checkpoint:** [1-7]
**Last Updated:** [timestamp]
**Build Status:** [in-progress/deployed]

## What's Completed
- [ ] Checkpoint 1: Foundation
- [ ] Checkpoint 2: Onboarding Flow
- [ ] Checkpoint 3: Group System
- [ ] Checkpoint 4: Check-in System
- [ ] Checkpoint 5: Automated Reminders
- [ ] Checkpoint 6: View & Stats
- [ ] Checkpoint 7: Polish & Deploy

## Current State

### Files Created
- `src/index.ts` - [status: complete/in-progress/not-started]
- `src/config.ts` - [status]
- `src/db/client.ts` - [status]
- `src/db/schema.sql` - [status]
- `src/db/queries.ts` - [status]
- `src/commands/start.ts` - [status]
- `src/commands/checkin.ts` - [status]
- `src/commands/view.ts` - [status]
- `src/commands/stats.ts` - [status]
- `src/handlers/callbacks.ts` - [status]
- `src/handlers/reminders.ts` - [status]
- `src/utils/keyboards.ts` - [status]
- `src/utils/messages.ts` - [status]
- `src/utils/dates.ts` - [status]

### Environment Variables Needed
```

BOT_TOKEN=           # From @BotFather
TURSO_DATABASE_URL=  # From Turso dashboard
TURSO_AUTH_TOKEN=    # From Turso dashboard

```

### Database State
- Schema applied: [yes/no]
- Tables created: users, groups, memberships, checkins
- Test data: [describe any test records]

## What's Next
[Describe the immediate next task]

## Known Issues
- [List any bugs or issues discovered]

## Key Decisions Made
- [Document any architectural decisions]

## Commands to Resume

```bash
# Navigate to project
cd accountability-bot

# Install dependencies (if fresh clone)
npm install

# Run in development
npm run dev

# Check database
turso db shell accountability-bot
```

## Context for Claude Code

When resuming this project:

1. Read this CLAUDE.md first
2. Check which checkpoint we're on
3. Review "What's Next" section
4. Look at "Known Issues" before making changes
5. Update this file after completing each checkpoint

## Performance Notes

If context usage exceeds 90%:

1. Save current progress to this file
2. Commit all changes with descriptive message
3. Note exact stopping point in "What's Next"
4. New session: Read CLAUDE.md, continue from noted point

```

---

## 📦 Package.json

```json
{
  "name": "accountability-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "turso db shell accountability-bot < src/db/schema.sql"
  },
  "dependencies": {
    "grammy": "^1.21.1",
    "@libsql/client": "^0.5.6",
    "node-cron": "^3.0.3",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/node-cron": "^3.0.11",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 🚀 Deployment (Coolify on Hetzner)

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/index.js"]
```

### Environment Variables in Coolify

```
BOT_TOKEN=your_telegram_bot_token
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_turso_token
TZ=Europe/Berlin
```

---

## ✅ Success Metrics (Week 1)


| Metric                      | Target     |
| --------------------------- | ---------- |
| Bot deployed                | ✅          |
| Tokyo's group active        | 5+ members |
| Daily check-in rate         | >70%       |
| Users completing onboarding | >90%       |
| Crash/error rate            | <1%        |


---

## 🔮 v2 Features (Post-Launch)

After validating core loop works:

1. **Photo proof** - Optional image upload with check-in
2. **Weekly summaries** - Sunday recap message
3. **Streak recovery** - "Freeze" days for emergencies
4. **Multiple commitments** - 2-3 habits per user
5. **Group chat integration** - Bot works in group chats, not just DMs
6. **CommitPool integration** - Stake USDC on commitments

---

## 🎯 Claude Code Instructions

When building this bot:

1. **Start with Checkpoint 1** - Get the foundation working before anything else
2. **Test each checkpoint** - Don't move on until verify step passes
3. **Keep code simple** - No premature abstraction, optimize later
4. **Update CLAUDE.md** - After each checkpoint, document progress in Session Log
5. **Save frequently** - Document state in CLAUDE.md before context fills up

### Optimization Mindset

Before implementing any feature, ask:

- Is there a simpler way to achieve this?
- Can I use Telegram's native features instead of custom code?
- Does this add complexity without proportional user value?

### When Context Usage Hits 90%

1. Stop current task at a clean breakpoint
2. Update CLAUDE.md with exact status:
  - Which checkpoint you're on
  - Which files are complete/in-progress
  - What the immediate next step is
  - Any errors or blockers encountered
3. Document in Session Log section of CLAUDE.md
4. New session starts by reading CLAUDE.md

**Note:** No git write access - all context preserved locally in CLAUDE.md

---

**END OF PRD**

*Ready for Claude Code: "Build this Telegram bot following the checkpoints in this PRD"*