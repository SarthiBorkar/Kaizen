# Kaizen Bot 🎯

A Telegram accountability bot that helps you achieve your daily goals through group-based social accountability.

**Kaizen** (改善) means "continuous improvement" in Japanese - the philosophy of making small, consistent improvements every day.

## Why Kaizen?

Research shows that social accountability increases goal completion rates from **10% to 95%**. When you commit to a goal in front of others and check in daily, you're far more likely to follow through.

## Features

✅ **Simple Onboarding** - Set your daily commitment in seconds
📝 **Daily Check-ins** - Quick yes/no check-ins for your commitment
👥 **Group Accountability** - Join or create accountability groups
📊 **Progress Tracking** - See your streaks and success rates
⏰ **Smart Reminders** - Daily reminders at your preferred time

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

1. **Start** - `/start` to begin onboarding
2. **Set Commitment** - Choose your daily commitment
3. **Join Group** - Create or join an accountability group (coming in Checkpoint 3)
4. **Daily Check-in** - `/checkin` or wait for your reminder
5. **Track Progress** - `/view` to see your streaks, `/stats` for detailed statistics

### Available Commands

- `/start` - Begin onboarding or restart setup
- `/checkin` - Daily check-in for your commitment
- `/view` - View your recent progress (last 7 days)
- `/stats` - See detailed statistics and success rate

## Project Status

**Current:** Checkpoint 1 Complete ✅

- [x] Project foundation & setup
- [x] Database schema & queries
- [x] Onboarding flow (/start)
- [x] Check-in system (/checkin)
- [x] Progress views (/view, /stats)
- [x] Reminder scheduling
- [ ] Group creation & joining (Checkpoint 2)
- [ ] Group chat integration (Checkpoint 3)
- [ ] Advanced features (Checkpoint 4+)

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
