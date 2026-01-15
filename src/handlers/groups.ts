import { Context } from 'grammy';
import { generateInviteCode } from '../utils/dates.js';

// Handle when bot is added to a group
export async function handleGroupAdd(ctx: Context) {
  if (!ctx.myChatMember) return;

  const newStatus = ctx.myChatMember.new_chat_member.status;
  const oldStatus = ctx.myChatMember.old_chat_member.status;

  // Bot was just added to the group
  if ((newStatus === 'member' || newStatus === 'administrator') && oldStatus === 'left') {
    const chat = ctx.chat;
    if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) return;

    const groupId = chat.id;
    const groupName = chat.title || 'Unnamed Group';
    const addedBy = ctx.from?.id;

    if (!addedBy) return;

    try {
      // Register group in database
      const { createGroup, getUser } = await import('../db/queries.js');

      // Get user who added the bot
      const userResult = await getUser(addedBy);
      const user = userResult.rows[0];

      if (!user) {
        await ctx.reply(`
👋 Thanks for adding Kaizen!

⚠️ The person who added me needs to set up first!

Please message me privately at @${ctx.me.username} and use /start to set your commitment.

Then I can help your group with accountability! 🎌
        `);
        return;
      }

      // Create group with generated invite code
      const inviteCode = generateInviteCode();
      await createGroup(groupId, groupName, user.id as number, inviteCode);

      // Welcome message
      await ctx.reply(`
🎌 **Welcome to Kaizen!**

I'll help your group stay accountable to your daily goals!

**How it works:**
1️⃣ Each member: Message me privately (@${ctx.me.username})
2️⃣ Use /start to set your daily commitment
3️⃣ Check in daily - I'll post your progress here!
4️⃣ See each other's streaks and celebrate together

**Group Commands:**
• /today - See who checked in today
• /leaderboard - Group rankings
• /help - Show all commands

**Social Accountability = 95% Success Rate! 🔥**

Let's build consistency together! 改善
      `);

      console.log(`✅ Bot added to group: ${groupName} (${groupId})`);
    } catch (error) {
      console.error('Error registering group:', error);
      await ctx.reply('Sorry, something went wrong while setting up. Please try re-adding me.');
    }
  }

  // Bot was removed from the group
  if (newStatus === 'left' && (oldStatus === 'member' || oldStatus === 'administrator')) {
    console.log(`❌ Bot removed from group: ${ctx.chat?.id}`);
    // TODO: Maybe mark group as inactive in database
  }
}
