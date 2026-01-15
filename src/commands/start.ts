import { Context } from 'grammy';
import { createUser, getUser } from '../db/queries.js';
import { WELCOME_MESSAGE, COMMITMENT_PROMPT, REMINDER_TIME_PROMPT, ONBOARDING_COMPLETE } from '../utils/messages.js';
import { reminderTimeKeyboard } from '../utils/keyboards.js';

// Track user conversation state
const userStates = new Map<number, string>();

export async function startCommand(ctx: Context) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;

  try {
    // Create or update user in database
    await createUser(telegramId, username, firstName);

    // Check if user already has commitment set
    const result = await getUser(telegramId);
    const user = result.rows[0];

    if (user && user.commitment) {
      await ctx.reply(`Welcome back, ${firstName}! 👋\n\nYour commitment: "${user.commitment}"\n\nUse /checkin to check in today, or /view to see your progress.`);
      return;
    }

    // Start onboarding flow
    await ctx.reply(WELCOME_MESSAGE);
    await ctx.reply(COMMITMENT_PROMPT);

    // Set user state to expect commitment
    userStates.set(telegramId, 'awaiting_commitment');
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

// Handle user messages during onboarding
export async function handleOnboardingMessage(ctx: Context) {
  if (!ctx.from || !ctx.message || !('text' in ctx.message)) return false;

  const telegramId = ctx.from.id;
  const state = userStates.get(telegramId);

  if (!state) return false;

  try {
    if (state === 'awaiting_commitment') {
      const commitment = ctx.message.text;

      // Validate commitment (not empty, reasonable length)
      if (!commitment || commitment.length < 5) {
        await ctx.reply('Please enter a more specific commitment (at least 5 characters).');
        return true;
      }

      if (commitment.length > 200) {
        await ctx.reply('Please keep your commitment under 200 characters.');
        return true;
      }

      // Save commitment temporarily
      userStates.set(telegramId, `commitment:${commitment}`);

      // Ask for reminder time
      await ctx.reply(REMINDER_TIME_PROMPT, {
        reply_markup: reminderTimeKeyboard(),
      });

      return true;
    }
  } catch (error) {
    console.error('Error handling onboarding message:', error);
    await ctx.reply('Sorry, something went wrong. Please try /start again.');
    userStates.delete(telegramId);
  }

  return false;
}

// Handle reminder time selection callback
export async function handleReminderSelection(ctx: Context, hour: number) {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const state = userStates.get(telegramId);

  if (!state || !state.startsWith('commitment:')) {
    await ctx.answerCallbackQuery('Please start with /start');
    return;
  }

  const commitment = state.replace('commitment:', '');

  try {
    // Import queries here to avoid circular dependency
    const { updateUserCommitment, updateReminderTime } = await import('../db/queries.js');

    // Save commitment and reminder time
    await updateUserCommitment(telegramId, commitment);
    await updateReminderTime(telegramId, hour);

    // Clear user state
    userStates.delete(telegramId);

    // Send completion message
    await ctx.answerCallbackQuery('All set!');
    await ctx.editMessageText(ONBOARDING_COMPLETE(commitment, hour));
  } catch (error) {
    console.error('Error saving reminder selection:', error);
    await ctx.answerCallbackQuery('Error saving settings. Please try again.');
  }
}

// Export user states for cleanup if needed
export { userStates };
