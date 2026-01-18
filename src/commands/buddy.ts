import { Context } from 'grammy';
import {
  getUser,
  getUserBuddy,
  getPendingBuddyRequest,
  createBuddyRequest,
  cancelBuddyRequest,
  findAvailableBuddy,
  createBuddyMatch,
  markBuddyRequestsMatched,
  endBuddyMatch,
} from '../db/queries.js';

/**
 * /buddy command - Find and manage accountability partners
 *
 * Usage:
 * /buddy        - Find a buddy or show current buddy
 * /buddy status - Check buddy status
 * /buddy end    - End current buddy partnership
 */
export async function buddyCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Get user
    const userResult = await getUser(userId);
    if (userResult.rows.length === 0) {
      await ctx.reply(
        '❌ **User not found**\n\n' +
        'Please use /start to set up your account first.'
      );
      return;
    }

    const user = userResult.rows[0];
    const userDbId = user.id as number;
    const firstName = user.first_name as string || 'there';

    // Get command argument
    const message = ctx.message?.text || '';
    const args = message.split(' ').slice(1);
    const command = args[0]?.toLowerCase();

    // Handle "status" command
    if (command === 'status') {
      await showBuddyStatus(ctx, userDbId, firstName);
      return;
    }

    // Handle "end" command
    if (command === 'end') {
      await endBuddyPartnership(ctx, userDbId);
      return;
    }

    // Check if user already has a buddy
    const buddyResult = await getUserBuddy(userDbId);
    if (buddyResult.rows.length > 0) {
      const buddy = buddyResult.rows[0];
      const buddyName = buddy.buddy_first_name as string;
      const buddyUsername = buddy.buddy_username as string | null;

      await ctx.reply(
        `👥 **Your Accountability Buddy**\n\n` +
        `You're already paired with **${buddyName}**!\n` +
        (buddyUsername ? `@${buddyUsername}\n\n` : '\n') +
        `**How to use your buddy:**\n` +
        `• Share your check-ins and progress\n` +
        `• Encourage each other during tough times\n` +
        `• Celebrate wins together\n` +
        `• Keep each other accountable\n\n` +
        `Use /buddy status to see your buddy's info.\n` +
        `Use /buddy end to end this partnership.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Check if user has a pending request
    const pendingRequest = await getPendingBuddyRequest(userDbId);
    if (pendingRequest.rows.length > 0) {
      await ctx.reply(
        '⏳ **Buddy Request Pending**\n\n' +
        'You\'re currently in the queue waiting for a buddy match.\n\n' +
        'We\'ll notify you as soon as someone else requests a buddy!\n\n' +
        'Use `/buddy cancel` to cancel your request.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Handle "cancel" command
    if (command === 'cancel') {
      const cancelResult = await cancelBuddyRequest(userDbId);
      if (cancelResult.rowsAffected > 0) {
        await ctx.reply('✅ Buddy request cancelled.');
      } else {
        await ctx.reply('ℹ️ No pending buddy request to cancel.');
      }
      return;
    }

    // Try to find an available buddy
    const availableBuddy = await findAvailableBuddy(userDbId);

    if (availableBuddy.rows.length > 0) {
      // Match found! Create the buddy match
      const matchedUser = availableBuddy.rows[0];
      const matchedUserId = matchedUser.user_id as number;
      const matchedUserTelegramId = matchedUser.telegram_id as number;
      const matchedUserName = matchedUser.first_name as string;
      const matchedUsername = matchedUser.username as string | null;

      // Create buddy match
      await createBuddyMatch(userDbId, matchedUserId);
      await markBuddyRequestsMatched(userDbId, matchedUserId);

      // Notify both users
      await ctx.reply(
        `🎉 **Buddy Match Found!**\n\n` +
        `You've been matched with **${matchedUserName}**!\n` +
        (matchedUsername ? `@${matchedUsername}\n\n` : '\n') +
        `**Getting Started:**\n` +
        `• Introduce yourself to your buddy\n` +
        `• Share your goals and commitments\n` +
        `• Decide how you'll check in with each other\n` +
        `• Support each other's journey!\n\n` +
        `💡 *Research shows: Having an accountability partner increases success rates by 65%!*`,
        { parse_mode: 'Markdown' }
      );

      // Notify the matched user
      try {
        await ctx.api.sendMessage(
          matchedUserTelegramId,
          `🎉 **Buddy Match Found!**\n\n` +
          `You've been matched with **${firstName}**!\n` +
          (user.username ? `@${user.username}\n\n` : '\n') +
          `**Getting Started:**\n` +
          `• Introduce yourself to your buddy\n` +
          `• Share your goals and commitments\n` +
          `• Decide how you'll check in with each other\n` +
          `• Support each other's journey!\n\n` +
          `💡 *Research shows: Having an accountability partner increases success rates by 65%!*`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to notify matched buddy:', error);
      }
    } else {
      // No buddy available, create a request
      await createBuddyRequest(userDbId);

      await ctx.reply(
        `👥 **Looking for a Buddy...**\n\n` +
        `You've been added to the buddy matching queue!\n\n` +
        `**What happens next?**\n` +
        `• When someone else requests a buddy, you'll be matched\n` +
        `• We'll notify you immediately when matched\n` +
        `• You can then start supporting each other!\n\n` +
        `**While you wait:**\n` +
        `• Keep up with your daily check-ins\n` +
        `• Share Kaizen with friends (instant match!)\n` +
        `• Focus on building your streak\n\n` +
        `Use /buddy cancel to cancel your request.`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Error in buddyCommand:', error);
    await ctx.reply(
      '❌ **Error**\n\n' +
      'Failed to process buddy request. Please try again.'
    );
  }
}

/**
 * Show buddy status
 */
async function showBuddyStatus(ctx: Context, userDbId: number, firstName: string) {
  // Check for active buddy
  const buddyResult = await getUserBuddy(userDbId);

  if (buddyResult.rows.length > 0) {
    const buddy = buddyResult.rows[0];
    const buddyName = buddy.buddy_first_name as string;
    const buddyUsername = buddy.buddy_username as string | null;
    const matchedAt = new Date(buddy.matched_at as string);

    const daysSinceMatch = Math.floor(
      (Date.now() - matchedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    await ctx.reply(
      `👥 **Buddy Status**\n\n` +
      `✅ **You have an active buddy!**\n\n` +
      `**Buddy:** ${buddyName}\n` +
      (buddyUsername ? `**Username:** @${buddyUsername}\n` : '') +
      `**Matched:** ${daysSinceMatch} days ago\n\n` +
      `**Tips for Success:**\n` +
      `• Check in with each other regularly\n` +
      `• Share your wins and challenges\n` +
      `• Be honest and supportive\n` +
      `• Celebrate milestones together\n\n` +
      `Use /buddy end if you want to end this partnership.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Check for pending request
  const pendingRequest = await getPendingBuddyRequest(userDbId);

  if (pendingRequest.rows.length > 0) {
    const request = pendingRequest.rows[0];
    const createdAt = new Date(request.created_at as string);
    const minutesWaiting = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));

    await ctx.reply(
      `⏳ **Buddy Status**\n\n` +
      `**Status:** Waiting for match\n` +
      `**Time waiting:** ${minutesWaiting} minutes\n\n` +
      `We'll notify you as soon as someone else requests a buddy!\n\n` +
      `Use /buddy cancel to cancel your request.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // No buddy and no pending request
  await ctx.reply(
    `👥 **Buddy Status**\n\n` +
    `**Status:** No buddy\n\n` +
    `You don't currently have an accountability buddy.\n\n` +
    `**Benefits of having a buddy:**\n` +
    `• 65% higher success rate\n` +
    `• Extra motivation on tough days\n` +
    `• Someone to celebrate wins with\n` +
    `• Mutual accountability\n\n` +
    `Use /buddy to find a buddy!`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * End buddy partnership
 */
async function endBuddyPartnership(ctx: Context, userDbId: number) {
  const buddyResult = await getUserBuddy(userDbId);

  if (buddyResult.rows.length === 0) {
    await ctx.reply(
      'ℹ️ You don\'t currently have an active buddy partnership to end.'
    );
    return;
  }

  const buddy = buddyResult.rows[0];
  const buddyName = buddy.buddy_first_name as string;
  const buddyTelegramId = buddy.buddy_telegram_id as number;

  // End the match
  await endBuddyMatch(userDbId);

  await ctx.reply(
    `✅ **Buddy Partnership Ended**\n\n` +
    `Your partnership with ${buddyName} has been ended.\n\n` +
    `You can find a new buddy anytime with /buddy.\n\n` +
    `Keep up the great work on your personal journey! 💪`,
    { parse_mode: 'Markdown' }
  );

  // Notify the other buddy
  try {
    await ctx.api.sendMessage(
      buddyTelegramId,
      `ℹ️ **Buddy Partnership Update**\n\n` +
      `Your buddy partnership has been ended.\n\n` +
      `You can find a new buddy anytime with /buddy.\n\n` +
      `Keep building those habits! 💪`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Failed to notify buddy of partnership end:', error);
  }
}
