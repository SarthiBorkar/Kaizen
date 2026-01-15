import { Context } from 'grammy';
import { mainMenuKeyboard } from '../utils/keyboards.js';

export async function helpCommand(ctx: Context) {
  const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';

  if (isGroup) {
    // Help message for group chats
    await ctx.reply(`
🎌 **Kaizen Bot - Group Commands**

**For Everyone:**
• /today - See who checked in today
• /leaderboard - Group rankings

**Personal (use in private chat with bot):**
• /start - Set your commitment
• /checkin - Daily check-in
• /view - Your progress calendar
• /stats - Your detailed statistics
• /quote - Daily Japanese wisdom

💡 **Tip:** Check in privately with the bot, and I'll post your progress here for everyone to see!

Start by messaging me privately: @KaizenBot
    `);
  } else {
    // Help message for private chats
    await ctx.reply(`
🎌 **Kaizen Bot - Your Accountability Partner**

**Getting Started:**
• /start - Set up your daily commitment

**Daily Practice:**
• /checkin - Check in (4 levels!)
  - 🎉 Crushed it!
  - ✅ Completed
  - 💪 Partial
  - ❌ Missed

**Track Progress:**
• /view - Monthly calendar + 14-day streak
• /stats - Rank card & detailed statistics
• /groups - See all your groups

**Inspiration:**
• /quote - Daily Japanese wisdom (kotowaza)

**Group Features:**
• Add me to a group to enable social accountability
• Your check-ins will be shared with the group
• See group leaderboards and today's check-ins

**🥋 Rank System:**
🤍 White → 🟡 Yellow → 🟠 Orange → 🟢 Green → 🔵 Blue → 🟤 Brown → ⚫ Black Belt

**🌸 Seasonal Progress:**
春 Spring → 夏 Summer → 秋 Autumn → 冬 Winter

Need help? Just ask! 💪

改善 (Kaizen) = Continuous Improvement
    `, {
      reply_markup: mainMenuKeyboard(),
    });
  }
}

// Command for showing main menu
export async function menuCommand(ctx: Context) {
  await ctx.reply('Choose an option:', {
    reply_markup: mainMenuKeyboard(),
  });
}
