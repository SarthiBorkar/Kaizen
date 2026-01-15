import { Context } from 'grammy';
import { getGroup, getGroupCheckinsToday, getGroupMembers } from '../db/queries.js';
import { formatStreakDisplay } from '../utils/visuals.js';

export async function todayCommand(ctx: Context) {
  const chat = ctx.chat;

  // Only works in groups
  if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
    await ctx.reply('This command only works in group chats! Use /checkin in private chat with me.');
    return;
  }

  try {
    // Get group from database
    const groupResult = await getGroup(chat.id);
    const group = groupResult.rows[0];

    if (!group) {
      await ctx.reply(`
⚠️ This group isn't registered yet!

Make sure someone has:
1. Messaged me privately at @${ctx.me.username}
2. Used /start to set up
3. Then I was added to this group

After that, group features will work!
      `);
      return;
    }

    // Get today's check-ins
    const checkinsResult = await getGroupCheckinsToday(group.id as number);
    const checkins = checkinsResult.rows;

    // Get all group members
    const membersResult = await getGroupMembers(group.id as number);
    const totalMembers = membersResult.rows.length;

    if (totalMembers === 0) {
      await ctx.reply(`
📭 No members yet!

Group members: Message @${ctx.me.username} privately and use /start to join!
      `);
      return;
    }

    // Build today's report
    let message = `📅 **Today's Check-ins - ${group.name}**\n\n`;

    if (checkins.length === 0) {
      message += '⏳ No check-ins yet today!\n\n';
      message += `👥 ${totalMembers} member${totalMembers > 1 ? 's' : ''} waiting to check in...\n\n`;
      message += `💡 Use /checkin privately with @${ctx.me.username} to post your progress here!`;
    } else {
      // Separate completed and missed
      const completed = checkins.filter((c: any) => c.completed);
      const missed = checkins.filter((c: any) => !c.completed);

      if (completed.length > 0) {
        message += '✅ **Completed:**\n';
        for (const checkin of completed) {
          const name = checkin.first_name || checkin.username || 'User';
          message += `• ${name}\n`;
        }
        message += '\n';
      }

      if (missed.length > 0) {
        message += '❌ **Missed:**\n';
        for (const checkin of missed) {
          const name = checkin.first_name || checkin.username || 'User';
          message += `• ${name}\n`;
        }
        message += '\n';
      }

      const checkedInCount = checkins.length;
      const remaining = totalMembers - checkedInCount;

      message += `📊 **Progress:** ${checkedInCount}/${totalMembers} checked in\n`;
      if (remaining > 0) {
        message += `⏳ ${remaining} still to go!\n`;
      }

      const successRate = Math.round((completed.length / checkins.length) * 100);
      message += `\n🎯 Success rate: ${successRate}%`;
    }

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in today command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
