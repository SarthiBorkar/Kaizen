import { Context } from "grammy";
import { transcribeAudio, chatWithAI, analyzeIntent, extractTaskInfo } from "../services/ai.js";
import { rateLimiter, RATE_LIMITS, getRateLimitMessage } from "../utils/rate-limiter.js";
import { getUser, createTask } from "../db/queries.js";
import fs from "fs";
import path from "path";

// Create temp directory for audio files
const TEMP_DIR = path.join(process.cwd(), "temp", "audio");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Handle voice messages
 */
export async function handleVoiceMessage(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const voice = ctx.message?.voice;
  if (!voice) return;

  // Check rate limit
  if (rateLimiter.isRateLimited(userId, RATE_LIMITS.VOICE_MESSAGE.action, RATE_LIMITS.VOICE_MESSAGE.maxRequests, RATE_LIMITS.VOICE_MESSAGE.windowMs)) {
    const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.VOICE_MESSAGE.action);
    await ctx.reply(getRateLimitMessage(RATE_LIMITS.VOICE_MESSAGE.action, resetTime), {
      parse_mode: "Markdown",
    });
    return;
  }

  try {
    // Send "processing" message
    const processingMsg = await ctx.reply("🎙️ Transcribing your voice message...");

    // Get file
    const file = await ctx.getFile();
    const filePath = path.join(TEMP_DIR, `${userId}_${Date.now()}.ogg`);

    // Download the voice file
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Transcribe audio
    let transcription: string;
    try {
      transcription = await transcribeAudio(filePath);
    } catch (error) {
      // Clean up file
      fs.unlinkSync(filePath);
      throw error;
    }

    // Clean up audio file
    fs.unlinkSync(filePath);

    // Delete processing message
    await ctx.api.deleteMessage(ctx.chat!.id, processingMsg.message_id);

    // Show transcription
    await ctx.reply(`📝 *Transcription:*\n"${transcription}"`, {
      parse_mode: "Markdown",
    });

    // Analyze intent
    const { intent, confidence } = await analyzeIntent(transcription);

    // Route based on intent
    if (intent === "task" && confidence > 0.6) {
      // Handle task creation
      await ctx.reply("✅ Creating task...");

      const taskInfo = await extractTaskInfo(transcription);

      if (taskInfo.taskName) {
        const userResult = await getUser(userId);
        if (userResult.rows.length > 0) {
          const dbUserId = userResult.rows[0].id as number;
          await createTask(dbUserId, taskInfo.taskName);

          let response = `✅ *Task Created!*\n\n📝 ${taskInfo.taskName}`;

          if (taskInfo.reminderTime) {
            response += `\n⏰ Reminder set for: ${taskInfo.reminderTime}`;
          }

          response += `\n\n💡 Use /view to see all your tasks!`;

          await ctx.reply(response, { parse_mode: "Markdown" });
        }
      } else {
        await ctx.reply("❌ Sorry, I couldn't understand the task. Try saying something like: 'Add go to gym as a task'");
      }
    } else if (intent === "calendar" && confidence > 0.6) {
      // Handle reminder/calendar request
      await ctx.reply("📅 Setting up reminder...");

      const taskInfo = await extractTaskInfo(transcription);

      if (taskInfo.taskName && taskInfo.reminderTime) {
        const userResult = await getUser(userId);
        if (userResult.rows.length > 0) {
          const dbUserId = userResult.rows[0].id as number;
          await createTask(dbUserId, taskInfo.taskName);

          let response = `✅ *Reminder Set!*\n\n`;
          response += `📝 Task: ${taskInfo.taskName}\n`;
          response += `⏰ Time: ${taskInfo.reminderTime}\n\n`;
          response += `💡 *Note:* Your daily check-in reminders are set for ${taskInfo.reminderTime}. `;
          response += `You can change this with /remind command.\n\n`;
          response += `For Google Calendar integration, use /calendar command.`;

          await ctx.reply(response, { parse_mode: "Markdown" });
        }
      } else if (taskInfo.taskName) {
        // Task but no time - just create the task
        const userResult = await getUser(userId);
        if (userResult.rows.length > 0) {
          const dbUserId = userResult.rows[0].id as number;
          await createTask(dbUserId, taskInfo.taskName);

          await ctx.reply(
            `✅ *Task Created!*\n\n📝 ${taskInfo.taskName}\n\n` +
            `⏰ *Set reminder time:* Use /remind to choose when you want daily reminders.`,
            { parse_mode: "Markdown" }
          );
        }
      } else {
        await ctx.reply(
          "❌ Sorry, I couldn't understand the reminder request.\n\n" +
          "Try saying: 'Remind me to go to gym at 6pm'"
        );
      }
    } else if (intent === "research" && confidence > 0.7) {
      await ctx.reply("🔍 This looks like a research question. Let me look that up for you...");

      // Use Perplexity for research
      const { researchWithPerplexity } = await import("../services/ai.js");
      const result = await researchWithPerplexity(transcription);

      let response = `📚 *Research Results*\n\n${result.answer}`;

      if (result.sources.length > 0) {
        response += `\n\n*Sources:*\n`;
        result.sources.slice(0, 3).forEach((source, i) => {
          response += `${i + 1}. ${source}\n`;
        });
      }

      await ctx.reply(response, { parse_mode: "Markdown" });
    } else {
      // Use Groq for general chat
      await ctx.reply("💭 Processing your message...");

      const aiResponse = await chatWithAI(userId, transcription);

      await ctx.reply(aiResponse);
    }
  } catch (error) {
    console.error("Error handling voice message:", error);

    const errorMsg =
      error instanceof Error && error.message.includes("GROQ_API_KEY")
        ? "Voice messages require GROQ_API_KEY to be configured. Please contact the bot administrator."
        : "Sorry, I couldn't process your voice message. Please try again or send a text message.";

    await ctx.reply(`❌ ${errorMsg}`);
  }
}

/**
 * Handle audio messages (similar to voice)
 */
export async function handleAudioMessage(ctx: Context) {
  // Audio messages are handled the same way as voice messages
  await handleVoiceMessage(ctx);
}
