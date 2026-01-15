import { Context } from 'grammy';
import { getUser, getUserGroups } from '../db/queries.js';
import { ERROR_NO_COMMITMENT } from '../utils/messages.js';

export async function groupsCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    // Get user
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.reply(ERROR_NO_COMMITMENT);
      return;
    }

    // Get user's groups
    const groupsResult = await getUserGroups(user.id);

    if (groupsResult.rows.length === 0) {
      await ctx.reply(`
📭 **You're not in any groups yet!**

**To join a group:**

**Option 1: Add me to existing Telegram group**
1. Open or create a Telegram group with friends
2. Add @${ctx.me.username} to the group
3. I'll help everyone stay accountable!

**Option 2: Create a private group (coming soon!)**
• /creategroup - Create a new accountability group
• Share the invite code with friends

**Why groups?**
Social accountability increases success from 10% to 95%! 🚀

Need help? Use /help
      `);
      return;
    }

    // Build groups list
    let message = '👥 **Your Accountability Groups**\n\n';

    for (const group of groupsResult.rows) {
      const groupType = group.is_telegram_group ? '💬 Telegram Group' : '🔒 Private Group';
      const status = group.is_active ? '✅ Active' : '⚠️ Inactive';

      message += `**${group.name}**\n`;
      message += `${groupType} • ${status}\n`;
      if (group.invite_code) {
        message += `Invite Code: \`${group.invite_code}\`\n`;
      }
      message += '\n';
    }

    message += `**Total groups:** ${groupsResult.rows.length}\n\n`;
    message += `💡 Use /checkin to check in to any of these groups!`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in groups command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
