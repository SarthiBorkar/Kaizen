# CLAUDE.md - Accountability Bot Context

## Project Status
**Current Checkpoint:** 2.5 (Japanese Themes + Group Features - COMPLETED ✅)
**Last Updated:** 2025-01-12
**Build Status:** Full group accountability system with command menu

## Project Overview

Building a Telegram accountability bot with group-based social accountability. Research shows this increases goal completion from 10% to 95%.

**Core Philosophy:** Simple group accountability > feature-rich solo tracking

**Tech Stack:**
- Runtime: Node.js 20+ with TypeScript
- Bot Framework: grammy
- Database: Turso (libSQL)
- Hosting: Hetzner VPS + Coolify
- Scheduler: node-cron

## What's Completed
- [x] PRD finalized
- [x] Checkpoint 1: Foundation (ALL CORE FEATURES IMPLEMENTED!)
  - [x] Project structure created
  - [x] TypeScript setup with grammy
  - [x] Turso database integration
  - [x] Complete onboarding flow (/start)
  - [x] Check-in system (/checkin)
  - [x] Progress tracking (/view, /stats)
  - [x] Automated reminders (4 time slots)
  - [x] Inline keyboards and callbacks
  - [x] Database queries and schema
  - [x] README documentation
- [x] Checkpoint 2: Japanese Themes & Visual Enhancements (COMPLETED ✅)
  - [x] Daily Japanese quotes system (15+ kotowaza)
  - [x] Better visual progress displays (ASCII calendar, emoji-rich)
  - [x] Celebration animations for milestones
  - [x] Enhanced check-in flow (4 options: Crushed/Completed/Partial/Missed)
- [x] Checkpoint 2.5: Group Features & Command Menu (COMPLETED ✅)
  - [x] Telegram command menu (type "/" to see all commands)
  - [x] Interactive button menu (/menu command)
  - [x] Add bot to existing Telegram groups (hybrid approach!)
  - [x] Social check-in announcements posted to groups
  - [x] /today command (today's group check-ins)
  - [x] /leaderboard command (group rankings)
  - [x] /groups command (list user's groups)
  - [x] /help command (context-aware help)
  - [x] Group detection & auto-registration
  - [x] Database support for group types
- [ ] Checkpoint 3: Bot-Created Private Groups (/creategroup, /joingroup)
- [ ] Checkpoint 4: Group Enhancements & Polish
- [ ] Checkpoint 5: AI-Powered Features (ROADMAP 🗺️)
  - Multi-task parsing (e.g., "exercise and meditate" → 2 tasks)
  - Custom time extraction from natural language
  - Smart user context understanding
- [ ] Checkpoint 6: Polish & Deploy

## Files to Create

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
├── CLAUDE.md                 # This file
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables Needed

```bash
BOT_TOKEN=           # Get from @BotFather on Telegram
TURSO_DATABASE_URL=  # Get from Turso dashboard
TURSO_AUTH_TOKEN=    # Get from Turso dashboard
```

## What's Next

**Immediate next step:** Test and setup environment

### To Start Testing:

1. **Create Turso Database** (user needs to do this manually):
   ```bash
   turso db create kaizen-bot
   turso db show kaizen-bot  # Get URL
   turso db tokens create kaizen-bot  # Get token
   ```

2. **Create Telegram Bot** (user needs to do this manually):
   - Message @BotFather on Telegram
   - Send `/newbot` and follow prompts
   - Save bot token

3. **Set up environment**:
   ```bash
   cd accountability-bot
   cp .env.example .env
   # Edit .env with your BOT_TOKEN, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
   ```

4. **Push database schema**:
   ```bash
   npm run db:push
   ```

5. **Run the bot**:
   ```bash
   npm run dev
   ```

### Next Checkpoint (2): Group Management
Once testing is complete, implement:
- `/creategroup` command
- `/joingroup <code>` command
- Group invite code system
- Multiple group support

## Key Commands

```bash
# Create project
mkdir accountability-bot && cd accountability-bot

# Initialize
npm init -y
npm install grammy @libsql/client node-cron dotenv
npm install -D typescript tsx @types/node @types/node-cron

# Create tsconfig
npx tsc --init

# Create Turso database
turso db create accountability-bot
turso db show accountability-bot  # Get URL
turso db tokens create accountability-bot  # Get token

# Run in development
npm run dev

# Push schema to database
npm run db:push
```

## Database Schema (for reference)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    commitment TEXT,
    reminder_hour INTEGER DEFAULT 20,
    timezone TEXT DEFAULT 'Europe/Berlin',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_chat_id INTEGER UNIQUE NOT NULL,
    name TEXT,
    invite_code TEXT UNIQUE,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, group_id)
);

CREATE TABLE checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    check_date TEXT NOT NULL,
    completed BOOLEAN NOT NULL,
    checked_in_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, group_id, check_date)
);

CREATE INDEX idx_checkins_date ON checkins(check_date);
CREATE INDEX idx_checkins_user_date ON checkins(user_id, check_date);
CREATE INDEX idx_memberships_group ON memberships(group_id);
```

## Known Issues
- Group creation/joining not yet implemented (coming in Checkpoint 2)
- For testing, users need to manually insert a group in the database
- No settings command to change commitment or reminder time (can add if needed)

## Key Decisions Made
- Using grammy over telegraf (smaller bundle, better TS support)
- Using Turso over PostgreSQL (no separate service, edge-native)
- Single commitment per user for MVP (research: focus > variety)
- Group-first design (social accountability is the differentiator)
- 4 reminder time options only (8am, 6pm, 8pm, 10pm) to keep UX simple

## Optimization Notes

Before implementing anything, ask:
1. Is there a simpler way?
2. Can Telegram's native features handle this?
3. Does this add user value proportional to complexity?

## Context Management

**When context usage exceeds 90%:**

1. Stop at a clean breakpoint (end of a function, end of a file)
2. Update this CLAUDE.md with:
   - Current checkpoint status
   - Which files are complete/in-progress
   - Exact next step to take
   - Any errors encountered
   - Last working state
3. Save a summary in the "Session Log" section below
4. In new session:
   - Read this CLAUDE.md first
   - Check "Session Log" for where we left off
   - Review "What's Next" section
   - Continue from noted point

**NO GIT WRITE ACCESS** - All context preserved in this file locally.

## Session Log

### Session 1 (2025-01-12) - Checkpoint 1 COMPLETED ✅
- Created complete project structure
- Implemented all core bot functionality:
  - Full onboarding flow with commitment and reminder time selection
  - Daily check-in system with yes/no responses
  - Progress viewing (last 7 days)
  - Detailed statistics with success rate and streaks
  - Automated reminder scheduling (8am, 6pm, 8pm, 10pm)
- Set up database schema and queries
- Created comprehensive README
- Bot name: **Kaizen** (continuous improvement)

**Files Created:**
- `package.json`, `tsconfig.json`, `.env.example`
- `src/index.ts` - Main bot entry point
- `src/config.ts` - Environment config
- `src/db/client.ts`, `schema.sql`, `queries.ts`, `push-schema.ts`
- `src/commands/start.ts`, `checkin.ts`, `view.ts`, `stats.ts`
- `src/handlers/callbacks.ts`, `reminders.ts`
- `src/utils/keyboards.ts`, `messages.ts`, `dates.ts`
- `README.md` - Complete documentation

**Ready for:** User to set up environment variables and test!

### Session 2 (2025-01-12) - Checkpoint 2 COMPLETED ✅
- Added Japanese-inspired theme and visual enhancements
- Implemented 4 major feature groups:
  1. **Daily Japanese Quotes** - 15+ kotowaza (proverbs) with categories
  2. **Better Visual Progress** - ASCII calendar, emoji grids, rank cards
  3. **Celebration Animations** - Milestone achievements
  4. **Enhanced Check-ins** - 4 levels (Crushed/Completed/Partial/Missed)

**New Features:**
- 🥋 Rank/Belt progression (7 ranks: White → Black Belt)
- 🌸 Seasonal system (Spring/Summer/Autumn/Winter with kanji)
- 📅 Monthly ASCII calendar in /view
- 🔥 14-day streak visualization
- 📊 Comprehensive rank cards in /stats
- 💬 /quote command for daily wisdom
- 🎊 Animated celebrations at milestones (1, 3, 7, 21, 30, 50, 100, 200, 365+ days)

**Files Created:**
- `src/utils/quotes.ts` - Japanese proverbs system
- `src/utils/visuals.ts` - Visual displays, ranks, seasons
- `src/utils/celebrations.ts` - Milestone celebration system
- `src/commands/quote.ts` - Quote command
- `.cursor/mcp.json` - Cursor MCP config
- `.cursorrules` - Cursor AI context

**Files Updated:**
- Enhanced `checkin.ts`, `view.ts`, `stats.ts`
- Updated keyboards, messages, callbacks
- Documented in README and CLAUDE.md

**Ready for:** Checkpoint 3 - Group Creation & Management

### Session 3 (2025-01-12) - Checkpoint 2.5 COMPLETED ✅
- Implemented hybrid group system (user's idea - better than original!)
- Added comprehensive command menu and help system
- Built complete group accountability features

**Core Achievement: SOCIAL ACCOUNTABILITY ENGINE 🚀**

**New Commands:**
- `/help` - Context-aware (different for groups vs private)
- `/menu` - Interactive button menu
- `/groups` - List all user's accountability groups
- `/today` - Today's group check-ins (group command)
- `/leaderboard` - Group rankings with streaks (group command)

**Key Features:**
1. **Command Menu** - Type "/" in Telegram to see all commands with descriptions
2. **Add to Existing Groups** - Bot detects when added, auto-registers, sends welcome
3. **Social Check-ins** - Private check-in → Public group announcement
4. **Today's Report** - See who checked in, who's remaining
5. **Leaderboards** - Friendly competition with ranks and streaks
6. **Interactive Menus** - Button-based navigation for easier access

**Group Announcements (The Magic!):**
```
🌟 Sarthi CRUSHED IT! 🌟

"Exercise for 30 minutes"

🟡 Yellow Belt • 🔥 7 day streak!
```

**Files Created:**
- `src/commands/help.ts` - Help system
- `src/commands/groups.ts` - List user groups
- `src/commands/today.ts` - Today's group check-ins
- `src/commands/leaderboard.ts` - Group rankings
- `src/handlers/groups.ts` - Group detection handler
- `src/db/migrations/add_group_types.sql` - Database migration

**Files Enhanced:**
- `src/commands/checkin.ts` - Added group posting logic
- `src/utils/keyboards.ts` - Updated main menu
- `src/handlers/callbacks.ts` - Menu button handlers
- `src/index.ts` - Registered all new commands & events
- `src/db/schema.sql` - Added group type fields

**Database Changes:**
- Added `is_telegram_group` field (TRUE = existing group, FALSE = bot-created)
- Added `is_active` field (FALSE when bot removed)

**Why User's Idea Was Better:**
✅ Uses existing friend groups
✅ No migration friction
✅ Natural social dynamics
✅ Stronger accountability
✅ Simpler UX

**Ready for:** Testing complete group accountability flow!

---

*Update this file after each checkpoint or significant progress*
