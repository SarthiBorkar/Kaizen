import { Context } from "grammy";
import { chatWithAI, researchWithPerplexity, clearConversationHistory, analyzeIntent } from "../services/ai.js";
import { rateLimiter, RATE_LIMITS, getRateLimitMessage } from "../utils/rate-limiter.js";

/**
 * /ask command - Ask AI anything
 */
export async function askCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const query = ctx.message?.text?.replace("/ask", "").trim();

  if (!query) {
    await ctx.reply(
      "🤖 *Ask AI Assistant*\n\n" +
        "Ask me anything! I can help with:\n" +
        "• General questions and conversation\n" +
        "• Research and explanations\n" +
        "• Advice and recommendations\n" +
        "• Quick facts and information\n\n" +
        "*Usage:* `/ask your question here`\n" +
        "*Example:* `/ask what are the benefits of daily habits?`\n\n" +
        "💡 *Tip:* You can also just send me a voice message!",
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Check rate limit
  if (rateLimiter.isRateLimited(userId, RATE_LIMITS.AI_ASK.action, RATE_LIMITS.AI_ASK.maxRequests, RATE_LIMITS.AI_ASK.windowMs)) {
    const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.AI_ASK.action);
    await ctx.reply(getRateLimitMessage(RATE_LIMITS.AI_ASK.action, resetTime), {
      parse_mode: "Markdown",
    });
    return;
  }

  try {
    await ctx.reply("🤔 Thinking...");

    const response = await chatWithAI(userId, query);

    await ctx.reply(response);
  } catch (error) {
    console.error("Error in askCommand:", error);

    const errorMsg =
      error instanceof Error && error.message.includes("GROQ_API_KEY")
        ? "AI assistant requires GROQ_API_KEY to be configured. Please contact the bot administrator."
        : "Sorry, I encountered an error. Please try again.";

    await ctx.reply(`❌ ${errorMsg}`);
  }
}

/**
 * /research command - Deep research with Perplexity
 */
export async function deepResearchCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const query = ctx.message?.text?.replace("/deepresearch", "").replace("/dr", "").trim();

  if (!query) {
    await ctx.reply(
      "🔬 *Deep Research Assistant*\n\n" +
        "Get detailed, sourced research on any topic.\n\n" +
        "*Usage:* `/deepresearch your topic`\n" +
        "*Alias:* `/dr your topic`\n\n" +
        "*Examples:*\n" +
        "• `/dr stablecoins`\n" +
        "• `/deepresearch quantum computing`\n" +
        "• `/dr climate change solutions`\n\n" +
        "I'll search the web and provide comprehensive, cited information!",
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Check rate limit
  if (rateLimiter.isRateLimited(userId, RATE_LIMITS.AI_RESEARCH.action, RATE_LIMITS.AI_RESEARCH.maxRequests, RATE_LIMITS.AI_RESEARCH.windowMs)) {
    const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.AI_RESEARCH.action);
    await ctx.reply(getRateLimitMessage(RATE_LIMITS.AI_RESEARCH.action, resetTime), {
      parse_mode: "Markdown",
    });
    return;
  }

  try {
    await ctx.reply("🔍 Researching... This may take a moment.");

    const result = await researchWithPerplexity(query);

    let response = `📚 *Research: ${query}*\n\n${result.answer}`;

    if (result.sources.length > 0) {
      response += `\n\n*Sources:*\n`;
      result.sources.slice(0, 5).forEach((source, i) => {
        response += `${i + 1}. ${source}\n`;
      });
    }

    // Split long messages if needed
    if (response.length > 4000) {
      const chunks = response.match(/.{1,4000}/gs) || [response];
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: "Markdown" });
      }
    } else {
      await ctx.reply(response, { parse_mode: "Markdown" });
    }
  } catch (error) {
    console.error("Error in deepResearchCommand:", error);

    const errorMsg =
      error instanceof Error && error.message.includes("PERPLEXITY_API_KEY")
        ? "Deep research requires PERPLEXITY_API_KEY to be configured. Try using `/ask` for general questions."
        : "Sorry, I encountered an error during research. Please try again.";

    await ctx.reply(`❌ ${errorMsg}`);
  }
}

/**
 * /clearai command - Clear conversation history
 */
export async function clearAICommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  clearConversationHistory(userId);

  await ctx.reply(
    "🧹 *Conversation Cleared*\n\n" +
      "Your AI conversation history has been reset. " +
      "Our next chat will start fresh!",
    { parse_mode: "Markdown" }
  );
}

/**
 * Handle text messages that might be AI queries
 */
export async function handleAITextMessage(ctx: Context) {
  const userId = ctx.from?.id;
  const messageText = ctx.message?.text;

  if (!userId || !messageText) return false;

  // Check rate limit for natural language queries
  if (rateLimiter.isRateLimited(userId, RATE_LIMITS.AI_ASK.action, RATE_LIMITS.AI_ASK.maxRequests, RATE_LIMITS.AI_ASK.windowMs)) {
    // Silently skip if rate limited (don't want to spam user for every message)
    return false;
  }

  // Check if message looks like a question or request to AI
  // (starts with @botname, contains question marks, or certain keywords)
  const botUsername = ctx.me.username;
  const isMentioned = botUsername && messageText.includes(`@${botUsername}`);
  const isQuestion = messageText.includes("?");
  const aiKeywords = ["what", "how", "why", "when", "where", "who", "explain", "tell me", "can you"];
  const hasAIKeyword = aiKeywords.some((keyword) =>
    messageText.toLowerCase().startsWith(keyword)
  );

  // Only handle if it's a direct mention or clear question in private chat
  const isPrivateChat = ctx.chat?.type === "private";
  const shouldHandleAsAI = isMentioned || (isPrivateChat && (isQuestion || hasAIKeyword));

  if (!shouldHandleAsAI) {
    return false;
  }

  try {
    // Remove bot mention if present
    let cleanedMessage = messageText;
    if (botUsername && isMentioned) {
      cleanedMessage = messageText.replace(`@${botUsername}`, "").trim();
    }

    // Analyze intent
    const { intent, confidence } = await analyzeIntent(cleanedMessage);

    // If it's a research question, use Perplexity
    if (intent === "research" && confidence > 0.75) {
      try {
        await ctx.reply("🔍 Let me research that for you...");

        const result = await researchWithPerplexity(cleanedMessage);

        let response = `📚 ${result.answer}`;

        if (result.sources.length > 0) {
          response += `\n\n*Sources:*\n`;
          result.sources.slice(0, 3).forEach((source, i) => {
            response += `${i + 1}. ${source}\n`;
          });
        }

        await ctx.reply(response, { parse_mode: "Markdown" });
        return true;
      } catch (error) {
        // Fall back to regular AI chat if Perplexity fails
        console.log("Perplexity failed, falling back to Groq");
      }
    }

    // Use Groq for general chat
    await ctx.reply("💭 Thinking...");

    const response = await chatWithAI(userId, cleanedMessage);

    await ctx.reply(response);
    return true;
  } catch (error) {
    console.error("Error handling AI text message:", error);
    return false;
  }
}
