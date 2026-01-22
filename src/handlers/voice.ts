import { Context } from "grammy";
import { transcribeAudio, chatWithAI, analyzeIntent, extractTaskInfo } from "../services/ai.js";
import { rateLimiter, RATE_LIMITS, getRateLimitMessage } from "../utils/rate-limiter.js";
import { getUser, createTask, createReminder } from "../db/queries.js";
import { mcpClient } from "../mcp/client.js";
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
      const taskInfo = await extractTaskInfo(transcription);

      if (taskInfo.taskName && taskInfo.reminderTime) {
        const userResult = await getUser(userId);
        if (userResult.rows.length > 0) {
          const dbUserId = userResult.rows[0].id as number;

          try {
            // Parse the reminder time
            const reminderDateTime = parseReminderTime(taskInfo.reminderTime);

            if (!reminderDateTime) {
              await ctx.reply(
                `❌ Sorry, I couldn't parse the time "${taskInfo.reminderTime}".\n\n` +
                `Try formats like:\n` +
                `• "at 9:30am" or "at 6pm"\n` +
                `• "tomorrow at 3pm"\n` +
                `• "18:00" (24-hour format)`
              );
              return;
            }

            // Check if time is in the past
            if (reminderDateTime <= new Date()) {
              await ctx.reply(
                `❌ That time has already passed.\n\n` +
                `Please set a reminder for a future time.`
              );
              return;
            }

            await ctx.reply("📅 Creating your reminder...");

            let calendarEventId: string | undefined;
            let calendarSynced = false;

            // Try to create Google Calendar event
            try {
              const endTime = new Date(reminderDateTime.getTime() + 30 * 60 * 1000); // 30 min duration
              const calendarResult = await mcpClient.createCalendarEvent({
                summary: taskInfo.taskName,
                start_time: reminderDateTime.toISOString(),
                end_time: endTime.toISOString(),
                reminders: [{ method: "popup", minutes: 0 }],
              });
              calendarEventId = calendarResult.event_id;
              calendarSynced = true;
            } catch (calError) {
              console.error("Calendar sync skipped:", calError);
              // Silent fail - calendar is optional
            }

            // Create reminder in database
            await createReminder(
              dbUserId,
              userId,
              taskInfo.taskName,
              reminderDateTime.toISOString(),
              `Voice reminder: ${transcription.substring(0, 100)}`,
              calendarEventId
            );

            let response = `✅ *Reminder Created!*\n\n`;
            response += `📝 ${taskInfo.taskName}\n`;
            response += `⏰ ${reminderDateTime.toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}\n`;

            if (calendarSynced) {
              response += `\n📅 ✓ Synced to Google Calendar`;
            }

            response += `\n\n💡 I'll send you a message at the scheduled time!`;

            await ctx.reply(response, { parse_mode: "Markdown" });
          } catch (error) {
            console.error("Error creating reminder:", error);
            await ctx.reply(
              `❌ Failed to create reminder.\n\n` +
              `Error: ${error instanceof Error ? error.message : "Unknown error"}\n\n` +
              `Try using /remind command instead.`
            );
          }
        }
      } else if (taskInfo.taskName) {
        // Task but no time - just create the task
        const userResult = await getUser(userId);
        if (userResult.rows.length > 0) {
          const dbUserId = userResult.rows[0].id as number;
          await createTask(dbUserId, taskInfo.taskName);

          await ctx.reply(
            `✅ *Task Added!*\n\n` +
            `📝 ${taskInfo.taskName}\n\n` +
            `Use /view to see all your tasks!`,
            { parse_mode: "Markdown" }
          );
        }
      } else {
        await ctx.reply(
          `❌ I couldn't understand that reminder.\n\n` +
          `Try saying:\n` +
          `• "Remind me to call John at 6pm"\n` +
          `• "Set a reminder at 9:30am to exercise"`
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

/**
 * Parse reminder time from natural language
 * Supports formats like: "6pm", "9:30am", "18:00", "tomorrow at 3pm", etc.
 */
function parseReminderTime(timeStr: string): Date | null {
  try {
    const now = new Date();
    timeStr = timeStr.toLowerCase().trim();

    // Handle "tomorrow" prefix
    let targetDate = new Date(now);
    if (timeStr.includes("tomorrow")) {
      targetDate.setDate(targetDate.getDate() + 1);
      timeStr = timeStr.replace("tomorrow", "").trim();
    }

    // Remove "at" prefix if present
    timeStr = timeStr.replace(/^at\s+/, "");

    // Parse time formats
    // Format: "9:30am", "9:30 am", "9:30", "9am", "9 am", "18:00", "18"
    const timeMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);

    if (!timeMatch) {
      return null;
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3];

    // Convert to 24-hour format
    if (ampm) {
      if (ampm.toLowerCase() === "pm" && hours !== 12) {
        hours += 12;
      } else if (ampm.toLowerCase() === "am" && hours === 12) {
        hours = 0;
      }
    }

    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // Set the time
    targetDate.setHours(hours, minutes, 0, 0);

    // If time is in the past and no "tomorrow" was specified, assume next day
    if (targetDate <= now && !timeStr.includes("tomorrow")) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    return targetDate;
  } catch (error) {
    console.error("Error parsing reminder time:", error);
    return null;
  }
}
