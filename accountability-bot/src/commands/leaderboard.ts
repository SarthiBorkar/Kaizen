import { Context } from 'grammy';
import { getGroup, getGroupMembers, getUserCheckins } from '../db/queries.js';
import { calculateStreak } from '../utils/dates.js';
import { getRankForStreak } from '../utils/visuals.js';

export async function leaderboardCommand(ctx: Context) {
  const chat = ctx.chat;

  // Only works in groups
  if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
    await ctx.reply('This command only works in group chats!');
    return;
  }

  try {
    // Get group from database
    const groupResult = await getGroup(chat.id);
    const group = groupResult.rows[0];

    if (!group) {
      await ctx.reply(`
⚠️ This group isn't registered yet!

Someone needs to add me to enable group features.
      `);
      return;
    }

    // Get all group members
    const membersResult = await getGroupMembers(group.id);
    const members = membersResult.rows;

    if (members.length === 0) {
      await ctx.reply(`
📭 No members yet!

Group members: Message @${ctx.me.username} privately and use /start to join!
      `);
      return;
    }

    // Calculate streaks for each member
    const memberStats = await Promise.all(
      members.map(async (member: any) => {
        const checkinsResult = await getUserCheckins(member.id, group.id, 365);
        const streak = calculateStreak(checkinsResult.rows as any);
        const rank = getRankForStreak(streak);
        const name = member.first_name || member.username || 'User';

        return {
          name,
          streak,
          rank: rank.emoji,
          rankName: rank.name,
        };
      })
    );

    // Sort by streak (highest first)
    memberStats.sort((a, b) => b.streak - a.streak);

    // Build leaderboard
    let message = `🏆 **Leaderboard - ${group.name}**\n\n`;

    memberStats.forEach((member, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

      message += `${medal} **${member.name}**\n`;
      message += `   ${member.rank} ${member.rankName} • 🔥 ${member.streak} day${member.streak !== 1 ? 's' : ''}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👥 Total members: ${members.length}\n`;
    message += `💪 Keep pushing forward together!`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in leaderboard command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
