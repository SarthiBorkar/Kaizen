import { Context } from 'grammy';
import { getUser, getUserGroups, createCheckin } from '../db/queries.js';
import { CHECKIN_PROMPT, ALREADY_CHECKED_IN, NO_GROUPS, ERROR_NO_COMMITMENT, MULTIPLE_GROUPS_SELECT } from '../utils/messages.js';
import { checkinKeyboard, groupSelectionKeyboard } from '../utils/keyboards.js';
import { getTodayDate, calculateStreak } from '../utils/dates.js';
import { getQuoteForStreak, getQuoteAfterMiss, formatQuote } from '../utils/quotes.js';
import { checkMilestone, formatCelebration } from '../utils/celebrations.js';

export async function checkinCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;

  try {
    // Get user
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user || !user.commitment) {
      await ctx.reply(ERROR_NO_COMMITMENT);
      return;
    }

    // Get user's groups
    const groupsResult = await getUserGroups(user.id as number);

    if (groupsResult.rows.length === 0) {
      await ctx.reply(NO_GROUPS);
      return;
    }

    if (groupsResult.rows.length === 1) {
      // Single group - show check-in directly
      const group = groupsResult.rows[0];
      await showCheckinPrompt(ctx, user.commitment as string, group.id as number, group.name as string);
    } else {
      // Multiple groups - ask which one
      await ctx.reply(MULTIPLE_GROUPS_SELECT, {
        reply_markup: groupSelectionKeyboard(
          groupsResult.rows.map((g: any) => ({ id: g.id, name: g.name }))
        ),
      });
    }
  } catch (error) {
    console.error('Error in checkin command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

async function showCheckinPrompt(ctx: Context, commitment: string, groupId: number, groupName: string) {
  await ctx.reply(CHECKIN_PROMPT(commitment), {
    reply_markup: checkinKeyboard(groupId),
  });
}

// Handle check-in response
export async function handleCheckinResponse(
  ctx: Context,
  completed: boolean,
  groupId: number,
  completionType: 'crushed' | 'completed' | 'partial' | 'missed' = 'completed'
) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const today = getTodayDate();

  try {
    // Get user
    const userResult = await getUser(telegramId);
    const user = userResult.rows[0];

    if (!user) {
      await ctx.answerCallbackQuery('User not found. Please /start');
      return;
    }

    // Check if already checked in today
    const { getUserCheckins } = await import('../db/queries.js');
    const existingCheckins = await getUserCheckins(user.id as number, groupId, 1);

    if (existingCheckins.rows.length > 0 && existingCheckins.rows[0].check_date === today) {
      await ctx.answerCallbackQuery(ALREADY_CHECKED_IN);
      return;
    }

    // Get previous streak before check-in
    const previousCheckins = await getUserCheckins(user.id as number, groupId, 365);
    const previousStreak = calculateStreak(previousCheckins.rows as any);

    // Create check-in
    await createCheckin(user.id as number, groupId, today, completed);

    // Get all check-ins to calculate new streak (only if completed)
    const allCheckins = await getUserCheckins(user.id as number, groupId, 365);
    const currentStreak = completed ? calculateStreak(allCheckins.rows as any) : 0;

    // Check for milestones (only on completed check-ins)
    let milestone = null;
    if (completed) {
      milestone = checkMilestone(previousStreak, currentStreak);
    }

    // Get appropriate quote
    const quote = completed
      ? formatQuote(getQuoteForStreak(currentStreak), true)
      : formatQuote(getQuoteAfterMiss(), true);

    // Build message based on completion type
    let message = '';
    const { CHECKIN_SUCCESS, CHECKIN_MISSED } = await import('../utils/messages.js');

    switch (completionType) {
      case 'crushed':
        message = `
🌟 CRUSHED IT! 🌟

You went above and beyond today! That's how champions are made!

${currentStreak > 0 ? `🔥 Current streak: ${currentStreak} day${currentStreak > 1 ? 's' : ''}\n` : ''}
─────────
${quote}
        `.trim();
        break;

      case 'completed':
        message = CHECKIN_SUCCESS(currentStreak, quote);
        break;

      case 'partial':
        message = `
💪 Progress Made!

You showed up and did something - that's what counts!

Partial progress is still progress. Keep building momentum!

${currentStreak > 0 ? `🔥 Streak continues: ${currentStreak} day${currentStreak > 1 ? 's' : ''}\n` : ''}
─────────
${quote}
        `.trim();
        break;

      case 'missed':
        message = CHECKIN_MISSED(quote);
        break;

      default:
        message = CHECKIN_SUCCESS(currentStreak, quote);
    }

    await ctx.answerCallbackQuery('Check-in recorded!');
    await ctx.editMessageText(message);

    // Send celebration if milestone achieved
    if (milestone) {
      await ctx.reply(formatCelebration(milestone));
    }

    // Post to group chat for social accountability
    try {
      const { getGroup } = await import('../db/queries.js');
      const groupResult = await getGroup(groupId);
      const group = groupResult.rows[0];

      if (group && group.is_active && group.is_telegram_group) {
        // Get user info and rank
        const { getRankForStreak } = await import('../utils/visuals.js');
        const rank = getRankForStreak(currentStreak);
        const userName = ctx.from?.first_name || ctx.from?.username || 'Someone';

        // Build group announcement
        let groupMessage = '';

        switch (completionType) {
          case 'crushed':
            groupMessage = `🌟 **${userName} CRUSHED IT!** 🌟\n\n`;
            groupMessage += `"${user.commitment}"\n\n`;
            groupMessage += `${rank.emoji} ${rank.name} • 🔥 ${currentStreak} day streak!`;
            break;

          case 'completed':
            groupMessage = `✅ **${userName} checked in!**\n\n`;
            groupMessage += `"${user.commitment}"\n\n`;
            groupMessage += `${rank.emoji} ${rank.name} • 🔥 ${currentStreak} day${currentStreak > 1 ? 's' : ''}`;
            break;

          case 'partial':
            groupMessage = `💪 **${userName} made progress!**\n\n`;
            groupMessage += `"${user.commitment}"\n\n`;
            groupMessage += `${rank.emoji} ${rank.name} • Streak: ${currentStreak} day${currentStreak > 1 ? 's' : ''}`;
            break;

          case 'missed':
            groupMessage = `❌ ${userName} missed today\n\n`;
            groupMessage += `Tomorrow is a fresh start! 💪`;
            break;
        }

        // Post to group
        const bot = ctx.api;
        await bot.sendMessage(group.telegram_chat_id as number, groupMessage);
      }
    } catch (groupError) {
      console.error('Error posting to group:', groupError);
      // Don't fail the whole check-in if group posting fails
    }
  } catch (error) {
    console.error('Error handling checkin response:', error);
    await ctx.answerCallbackQuery('Error saving check-in. Please try again.');
  }
}
