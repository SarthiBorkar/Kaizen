# Kaizen Bot 🎯

A Telegram accountability bot that helps you achieve your daily goals through group-based social accountability.

**Kaizen** (改善) means "continuous improvement" in Japanese - the philosophy of making small, consistent improvements every day.

## Why Kaizen?

Research shows that social accountability increases goal completion rates from **10% to 95%**. When you commit to a goal in front of others and check in daily, you're far more likely to follow through.

## Features

### Core Functionality
✅ **Simple Onboarding** - Set your daily commitment in seconds
📝 **Enhanced Check-ins** - 4 levels: Crushed it!, Completed, Partial, Missed
👥 **Hybrid Group System** - Add bot to existing Telegram groups OR create new ones
⏰ **Smart Reminders** - Daily reminders at your preferred time (8am, 6pm, 8pm, 10pm)
📋 **Command Menu** - Type "/" to see all available commands
🔘 **Interactive Menu** - Button-based navigation with /menu

### Group Accountability 🎯
📢 **Social Check-ins** - Your progress is posted to the group
📊 **Today's Report** - See who checked in today (`/today`)
🏆 **Leaderboards** - Group rankings with streaks (`/leaderboard`)
👥 **Real Groups** - Add bot to existing friend/family groups
🎮 **Gamification** - Friendly competition drives results

### Japanese-Inspired Progress System 🎌
🥋 **Rank/Belt System** - Progress from White Belt → Black Belt (Sensei)
🌸 **Seasonal Progression** - Spring (春) → Summer (夏) → Autumn (秋) → Winter (冬)
💬 **Daily Japanese Quotes** - Inspirational kotowaza (proverbs) with each check-in
🎊 **Milestone Celebrations** - Animated achievements at 1, 7, 21, 50, 100, 200, 365+ days

### Visual Progress 📊
📅 **Monthly Calendar** - ASCII art calendar showing your month at a glance
🔥 **Streak Visualization** - Visual representation of your last 14 days
📈 **Rank Cards** - Beautiful progress cards showing your current season, belt, and progress to next rank
✨ **Progress Bars** - See how close you are to your next achievement

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript
- **Bot Framework:** grammy
- **Database:** Turso (libSQL)
- **Scheduler:** node-cron

## Setup

### Prerequisites

- Node.js 20 or higher
- npm or pnpm
- A Telegram account
- Turso account (free tier works great)

### 1. Clone and Install

```bash
cd accountability-bot
npm install
```

### 2. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Save your bot token

### 3. Create Turso Database

```bash
# Install Turso CLI if you haven't
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create kaizen-bot

# Get database URL
turso db show kaizen-bot

# Create auth token
turso db tokens create kaizen-bot
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
BOT_TOKEN=your_bot_token_from_botfather
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

### 5. Push Database Schema

```bash
npm run db:push
```

### 6. Run the Bot

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Usage

### For Users

1. **Start** - Message @YourBotName privately and use `/start`
2. **Set Commitment** - Choose your daily commitment and reminder time
3. **Join Group** - Add bot to an existing Telegram group with friends/family
4. **Daily Check-in** - Use `/checkin` privately, bot posts to group!
5. **Track Progress** - `/view` (personal), `/today` (group), `/leaderboard` (rankings)
6. **Get Inspired** - `/quote` for daily Japanese wisdom

### Setting Up a Group

1. **Personal Setup First:** Message bot privately, do `/start`
2. **Add to Group:** Open existing Telegram group, add @YourBotName
3. **Members Join:** Each member messages bot privately, does `/start`
4. **Check In Daily:** Everyone checks in privately, progress posts to group!
5. **Track Together:** Use `/today` and `/leaderboard` in group chat

### Available Commands

**Private Chat (with bot):**
- `/start` - Begin your Kaizen journey
- `/checkin` - Daily check-in with 4 levels (Crushed/Completed/Partial/Missed)
- `/view` - Beautiful monthly calendar + 14-day streak visualization
- `/stats` - Comprehensive rank card with detailed statistics
- `/groups` - See all your accountability groups
- `/quote` - Get daily Japanese wisdom and inspiration 🌸
- `/menu` - Show interactive button menu
- `/help` - Show all commands

**Group Chat:**
- `/today` - See who checked in today
- `/leaderboard` - Group rankings with streaks
- `/help` - Group help message

## Project Status

**Current:** Checkpoint 2.5 Complete ✅ (Japanese Themes + Group Features)

### Completed
- [x] **Checkpoint 1:** Project foundation & setup
  - Database schema & queries
  - Onboarding flow (/start)
  - Basic check-in system
  - Progress views
  - Reminder scheduling

- [x] **Checkpoint 2:** Japanese Themes & Visual Enhancements
  - 🌸 Daily Japanese quotes system (15+ kotowaza)
  - 📊 Monthly calendar with ASCII art
  - 🔥 Visual streak displays
  - 🥋 Rank/Belt progression system (7 ranks)
  - 🌸 Seasonal progression (4 seasons)
  - 🎊 Milestone celebration animations
  - 💪 Enhanced check-in flow (4 options)
  - 📈 Beautiful rank cards

- [x] **Checkpoint 2.5:** Group Features & Command Menu
  - 📋 Telegram command menu (type "/" to see commands)
  - 🔘 Interactive button menu (/menu)
  - 👥 Add bot to existing Telegram groups
  - 📢 Social check-in announcements to groups
  - 📊 /today - See today's group check-ins
  - 🏆 /leaderboard - Group rankings
  - 📝 /groups - List all your groups
  - ❓ /help - Context-aware help system
  - 🗄️ Database support for group types

### Upcoming
- [ ] **Checkpoint 3:** Bot-created private groups (/creategroup, /joingroup)
- [ ] **Checkpoint 4:** AI-powered features (multi-task parsing, custom time extraction)
- [ ] **Checkpoint 5:** Polish & deploy

## Architecture

```
src/
├── index.ts              # Bot initialization & main loop
├── config.ts             # Environment configuration
├── db/
│   ├── client.ts         # Turso database client
│   ├── schema.sql        # Database schema
│   ├── queries.ts        # All database queries
│   └── push-schema.ts    # Schema deployment script
├── commands/
│   ├── start.ts          # Onboarding flow
│   ├── checkin.ts        # Daily check-in
│   ├── view.ts           # Progress viewing
│   └── stats.ts          # Statistics
├── handlers/
│   ├── callbacks.ts      # Inline button handlers
│   └── reminders.ts      # Scheduled reminders
└── utils/
    ├── keyboards.ts      # Inline keyboard builders
    ├── messages.ts       # Message templates
    └── dates.ts          # Date utilities
```

## Database Schema

- **users** - User profiles and preferences
- **groups** - Accountability groups
- **memberships** - User-group relationships
- **checkins** - Daily check-in records

## Development

### Adding New Commands

1. Create command handler in `src/commands/`
2. Register command in `src/index.ts`
3. Add keyboard/messages if needed
4. Update this README

### Testing Reminders

Use the `sendTestReminder()` function in `src/handlers/reminders.ts` to test reminder messages without waiting for scheduled time.

## Deployment

The bot is designed to run on any Node.js hosting:

- **Recommended:** Hetzner VPS + Coolify (as per PRD)
- **Alternatives:** Railway, Render, Fly.io
- **Requirements:** Node.js 20+, persistent process manager (PM2)

## Contributing

This is a personal project following the PRD in `accountability-bot-prd.md`. The development is checkpoint-based for learning purposes.

## Philosophy

> "When you write down your goal, you have a 42% chance of achieving it. When you share that goal with someone, the likelihood goes up to 78%. When you have regular progress check-ins with an accountability partner, your chances of success increase to 95%."

Kaizen Bot implements this research into a simple, frictionless Telegram experience.

## License

MIT

---

Built with ☕ and continuous improvement in mind.
