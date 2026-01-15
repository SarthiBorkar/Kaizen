# Kaizen 改善

**Your daily accountability partner on Telegram.**

Turn your goals into unstoppable streaks with the power of group accountability.

---

## Why Kaizen?

Research shows that **accountability increases goal completion from 10% to 95%**. Kaizen makes accountability effortless:

- ✅ Set your daily commitment (30 seconds)
- 📱 Check in daily via Telegram
- 👥 Your progress is shared with your accountability group
- 🔥 Build streaks, earn ranks, achieve your goals

**Kaizen** (改善) = Continuous improvement, one day at a time.

---

## Features

🎯 **Group Accountability** - Add bot to existing Telegram groups, check-ins post automatically
🥋 **Rank System** - White Belt → Black Belt (Sensei) as you build consistency
🔥 **Streak Tracking** - Visual progress & milestone celebrations
🌸 **Japanese Wisdom** - Daily kotowaza (proverbs) for inspiration
📊 **Leaderboards** - Friendly competition with your group
⏰ **Smart Reminders** - Never miss a day

---

## Quick Start

### For Users

1. **Message the bot** - Find @YourBotName on Telegram
2. **Set your goal** - `/start` to set daily commitment
3. **Join a group** - Add bot to group with friends/family
4. **Check in daily** - `/checkin` privately, bot announces to group
5. **Track progress** - `/view`, `/stats`, `/leaderboard`

### For Developers

```bash
# Clone repo
git clone https://github.com/yourusername/kaizen.git
cd kaizen

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add: BOT_TOKEN, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN

# Initialize database
npm run db:push

# Run
npm run dev
```

**Requirements:** Node.js 20+, Telegram bot token, Turso database

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** grammy (Telegram bot)
- **Database:** Turso (libSQL)
- **Deploy:** Railway / Any Node.js host

---

## Commands

**Private Chat:**
- `/start` - Begin your journey
- `/checkin` - Daily check-in (Crushed/Completed/Partial/Missed)
- `/view` - Progress calendar & streaks
- `/stats` - Your rank & detailed stats
- `/quote` - Japanese wisdom

**Group Chat:**
- `/today` - Who checked in today
- `/leaderboard` - Group rankings

---

## Philosophy

> "When you share your goal with someone and have regular check-ins, your chances of success increase to 95%."

Kaizen turns this research into a simple, frictionless Telegram experience.

---

## License

MIT - Built with ☕ and continuous improvement in mind.

---

**Start building your streak today.** 改善
