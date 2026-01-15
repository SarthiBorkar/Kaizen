import { Context } from 'grammy';
import { getDailyQuote, getRandomQuote, formatQuote } from '../utils/quotes.js';

export async function quoteCommand(ctx: Context) {
  try {
    // Get daily quote (same for everyone on the same day)
    const quote = getDailyQuote();
    const formattedQuote = formatQuote(quote, true);

    await ctx.reply(
      `🌸 Today's Wisdom 🌸\n\n${formattedQuote}\n\n─────────\n💭 Need more inspiration? Just type /quote again!`
    );
  } catch (error) {
    console.error('Error in quote command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

// Random quote command (for variety)
export async function randomQuoteCommand(ctx: Context) {
  try {
    const quote = getRandomQuote();
    const formattedQuote = formatQuote(quote, true);

    await ctx.reply(`🎲 Random Wisdom 🎲\n\n${formattedQuote}`);
  } catch (error) {
    console.error('Error in random quote command:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}
