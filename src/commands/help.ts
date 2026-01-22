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
    await ctx.reply(
      `🎌 *Kaizen Bot - Your Accountability Partner*\n\n` +

      `*📌 Core Features:*\n` +
      `• /start - Begin your journey\n` +
      `• /checkin - Daily check-in (4 levels)\n` +
      `• /view - Calendar & 14-day streak\n` +
      `• /addtask - Add tasks (max 5)\n` +
      `• /groups - Join accountability groups\n\n` +

      `*🤖 AI Features:*\n` +
      `• Voice messages - Natural task/reminder creation\n` +
      `• /ask - Chat with AI assistant\n` +
      `• /dr - Deep research with sources\n` +
      `• /insights - AI habit insights\n\n` +

      `*⏰ Reminders:*\n` +
      `• /remind - Set daily check-in time\n` +
      `• Voice: "Remind me to X at 9:30am" ✓\n` +
      `• Syncs to Google Calendar (if configured)\n\n` +

      `*⚙️ Automation:*\n` +
      `• /automate - Research, scraping, calendar\n` +
      `• /calendar - Manage Google Calendar\n` +
      `• Save to: Notion, Drive, Obsidian\n\n` +

      `*🔧 Setup Required (Optional):*\n` +
      `• GROQ_API_KEY - Voice & AI features\n` +
      `• GOOGLE_CREDENTIALS - Calendar sync\n` +
      `• NOTION_API_KEY - Notion integration\n\n` +

      `*💪 Pro Tips:*\n` +
      `• Send voice messages for quick tasks\n` +
      `• Add bot to groups for social accountability\n` +
      `• Use /freeze to protect your streak (1/week)\n\n` +

      `改善 (Kaizen) = Continuous Improvement`,
      {
        parse_mode: "Markdown",
        reply_markup: mainMenuKeyboard(),
      }
    );
  }
}

// Command for showing main menu
export async function menuCommand(ctx: Context) {
  await ctx.reply('Choose an option:', {
    reply_markup: mainMenuKeyboard(),
  });
}
