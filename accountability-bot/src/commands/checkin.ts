import { Context } from 'grammy';
import { getUser, getUserGroups, createCheckin } from '../db/queries.js';
import { CHECKIN_PROMPT, ALREADY_CHECKED_IN, NO_GROUPS, ERROR_NO_COMMITMENT, MULTIPLE_GROUPS_SELECT } from '../utils/messages.js';
import { checkinKeyboard, groupSelectionKeyboard } from '../utils/keyboards.js';
import { getTodayDate } from '../utils/dates.js';

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
    const groupsResult = await getUserGroups(user.id);

    if (groupsResult.rows.length === 0) {
      await ctx.reply(NO_GROUPS);
      return;
    }

    if (groupsResult.rows.length === 1) {
      // Single group - show check-in directly
      const group = groupsResult.rows[0];
      await showCheckinPrompt(ctx, user.commitment, group.id, group.name);
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
export async function handleCheckinResponse(ctx: Context, completed: boolean, groupId: number) {
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
    const existingCheckins = await getUserCheckins(user.id, groupId, 1);

    if (existingCheckins.rows.length > 0 && existingCheckins.rows[0].check_date === today) {
      await ctx.answerCallbackQuery(ALREADY_CHECKED_IN);
      return;
    }

    // Create check-in
    await createCheckin(user.id, groupId, today, completed);

    // Send feedback
    const { CHECKIN_SUCCESS, CHECKIN_MISSED } = await import('../utils/messages.js');
    const message = completed ? CHECKIN_SUCCESS : CHECKIN_MISSED;

    await ctx.answerCallbackQuery('Check-in recorded!');
    await ctx.editMessageText(message);

    // TODO: Post to group chat (implement in next checkpoint)
  } catch (error) {
    console.error('Error handling checkin response:', error);
    await ctx.answerCallbackQuery('Error saving check-in. Please try again.');
  }
}
