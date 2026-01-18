import { Context } from "grammy";
import { mcpClient } from "../mcp/client.js";
import { rateLimiter, RATE_LIMITS, getRateLimitMessage } from "../utils/rate-limiter.js";

// Store user automation states
const automationStates = new Map<
  number,
  {
    step: string;
    data: any;
  }
>();

export async function automationCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const keyboard = {
    inline_keyboard: [
      [{ text: "📝 Research Topic", callback_data: "auto_research" }],
      [{ text: "🌐 Scrape Web Page", callback_data: "auto_scrape" }],
      [{ text: "📅 Create Calendar Event", callback_data: "auto_calendar" }],
      [{ text: "📄 Create Document", callback_data: "auto_document" }],
      [{ text: "🔄 View Workflows", callback_data: "auto_workflows" }],
    ],
  };

  await ctx.reply(
    "🤖 *Automation Hub*\n\n" +
      "Welcome to the Kaizen Automation System! Choose what you'd like to automate:\n\n" +
      "• Research topics and save to Notion/Drive/Obsidian\n" +
      "• Scrape web pages and convert to documents\n" +
      "• Manage your Google Calendar\n" +
      "• Create and manage documents\n" +
      "• Set up custom workflows",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

export async function researchCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check rate limit
  if (rateLimiter.isRateLimited(userId, RATE_LIMITS.RESEARCH_AUTOMATION.action, RATE_LIMITS.RESEARCH_AUTOMATION.maxRequests, RATE_LIMITS.RESEARCH_AUTOMATION.windowMs)) {
    const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.RESEARCH_AUTOMATION.action);
    await ctx.reply(getRateLimitMessage(RATE_LIMITS.RESEARCH_AUTOMATION.action, resetTime), {
      parse_mode: "Markdown",
    });
    return;
  }

  automationStates.set(userId, {
    step: "awaiting_topic",
    data: {},
  });

  await ctx.reply(
    "📚 *Research Assistant*\n\n" +
      "What topic would you like me to research?\n\n" +
      "Example: 'stablecoins', 'DeFi protocols', 'blockchain scalability'\n\n" +
      "Just type the topic and I'll create a comprehensive research document for you.",
    { parse_mode: "Markdown" }
  );
}

export async function scrapeCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check rate limit
  if (rateLimiter.isRateLimited(userId, RATE_LIMITS.WEB_SCRAPE.action, RATE_LIMITS.WEB_SCRAPE.maxRequests, RATE_LIMITS.WEB_SCRAPE.windowMs)) {
    const resetTime = rateLimiter.getResetTime(userId, RATE_LIMITS.WEB_SCRAPE.action);
    await ctx.reply(getRateLimitMessage(RATE_LIMITS.WEB_SCRAPE.action, resetTime), {
      parse_mode: "Markdown",
    });
    return;
  }

  automationStates.set(userId, {
    step: "awaiting_url",
    data: {},
  });

  await ctx.reply(
    "🌐 *Web Scraper*\n\n" +
      "Send me a URL and I'll extract the content and save it for you.\n\n" +
      "I can save it to:\n" +
      "• Notion\n" +
      "• Google Drive\n" +
      "• Obsidian\n" +
      "• Local PDF\n\n" +
      "Just send the URL:",
    { parse_mode: "Markdown" }
  );
}

export async function calendarCommand(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const keyboard = {
    inline_keyboard: [
      [{ text: "➕ Create Event", callback_data: "cal_create" }],
      [{ text: "📋 List Events", callback_data: "cal_list" }],
    ],
  };

  await ctx.reply(
    "📅 *Google Calendar Manager*\n\n" +
      "What would you like to do with your calendar?",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

// Handle automation callbacks
export async function handleAutomationCallback(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;

  if (!userId || !callbackData) return;

  await ctx.answerCallbackQuery();

  switch (callbackData) {
    case "auto_research":
      await researchCommand(ctx);
      break;

    case "auto_scrape":
      await scrapeCommand(ctx);
      break;

    case "auto_calendar":
      await calendarCommand(ctx);
      break;

    case "auto_document":
      automationStates.set(userId, {
        step: "awaiting_doc_title",
        data: {},
      });
      await ctx.reply(
        "📄 *Document Creator*\n\n" +
          "What should be the title of your document?",
        { parse_mode: "Markdown" }
      );
      break;

    case "cal_create":
      automationStates.set(userId, {
        step: "awaiting_event_summary",
        data: {},
      });
      await ctx.reply(
        "📅 *Create Calendar Event*\n\n" +
          "What's the event title/summary?",
        { parse_mode: "Markdown" }
      );
      break;

    case "cal_list":
      await ctx.reply("📋 Loading your upcoming events...");
      try {
        const events = await mcpClient.listCalendarEvents({
          max_results: 10,
        });

        if (!events.success || events.events.length === 0) {
          await ctx.reply("No upcoming events found.");
          return;
        }

        let message = "📅 *Upcoming Events*\n\n";
        for (const event of events.events) {
          const startDate = new Date(event.start).toLocaleString();
          message += `• *${event.summary}*\n`;
          message += `  ${startDate}\n`;
          if (event.location) message += `  📍 ${event.location}\n`;
          message += "\n";
        }

        await ctx.reply(message, { parse_mode: "Markdown" });
      } catch (error) {
        await ctx.reply(
          `❌ Failed to load events: ${error instanceof Error ? error.message : String(error)}\n\n` +
            "Make sure GOOGLE_CREDENTIALS is configured."
        );
      }
      break;
  }
}

// Handle text messages for automation workflows
export async function handleAutomationMessage(ctx: Context) {
  const userId = ctx.from?.id;
  const messageText = ctx.message?.text;

  if (!userId || !messageText) return;

  const state = automationStates.get(userId);
  if (!state) return;

  try {
    switch (state.step) {
      case "awaiting_topic":
        await handleResearchTopic(ctx, userId, messageText, state);
        break;

      case "awaiting_url":
        await handleScrapeUrl(ctx, userId, messageText, state);
        break;

      case "awaiting_doc_title":
        state.data.title = messageText;
        state.step = "awaiting_doc_content";
        await ctx.reply("Great! Now send me the content for the document:");
        break;

      case "awaiting_doc_content":
        await handleCreateDocument(ctx, userId, messageText, state);
        break;

      case "awaiting_event_summary":
        state.data.summary = messageText;
        state.step = "awaiting_event_datetime";
        await ctx.reply(
          "When should this event start?\n\n" +
            "Format: YYYY-MM-DD HH:MM\n" +
            "Example: 2024-03-20 14:30"
        );
        break;

      case "awaiting_event_datetime":
        await handleCreateEvent(ctx, userId, messageText, state);
        break;
    }
  } catch (error) {
    await ctx.reply(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`
    );
    automationStates.delete(userId);
  }
}

async function handleResearchTopic(
  ctx: Context,
  userId: number,
  topic: string,
  state: any
) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "Brief", callback_data: "depth_brief" },
        { text: "Moderate", callback_data: "depth_moderate" },
        { text: "Comprehensive", callback_data: "depth_comprehensive" },
      ],
    ],
  };

  state.data.topic = topic;
  state.step = "awaiting_research_depth";

  await ctx.reply(
    `📚 Researching: *${topic}*\n\n` +
      "How detailed should the research be?",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

async function handleScrapeUrl(
  ctx: Context,
  userId: number,
  url: string,
  state: any
) {
  // Validate URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    await ctx.reply("Please provide a valid URL starting with http:// or https://");
    return;
  }

  await ctx.reply("🌐 Scraping the web page... This may take a moment.");

  try {
    const result = await mcpClient.extractContent({
      url,
      format: "markdown",
    });

    // Create a local document
    const doc = await mcpClient.createDocument({
      title: result.title,
      content: result.content,
      format: "markdown",
    });

    await ctx.reply(
      `✅ *Content Extracted Successfully!*\n\n` +
        `📄 Title: ${result.title}\n` +
        `💾 Saved to: ${doc.file_path}\n\n` +
        `Would you like to save this to Notion, Google Drive, or Obsidian as well?`,
      { parse_mode: "Markdown" }
    );

    automationStates.delete(userId);
  } catch (error) {
    await ctx.reply(
      `❌ Failed to scrape: ${error instanceof Error ? error.message : String(error)}`
    );
    automationStates.delete(userId);
  }
}

async function handleCreateDocument(
  ctx: Context,
  userId: number,
  content: string,
  state: any
) {
  await ctx.reply("📝 Creating your document...");

  try {
    const result = await mcpClient.createDocument({
      title: state.data.title,
      content,
      format: "markdown",
    });

    await ctx.reply(
      `✅ *Document Created!*\n\n` +
        `📄 Title: ${state.data.title}\n` +
        `💾 Saved to: ${result.file_path}`,
      { parse_mode: "Markdown" }
    );

    automationStates.delete(userId);
  } catch (error) {
    await ctx.reply(
      `❌ Failed to create document: ${error instanceof Error ? error.message : String(error)}`
    );
    automationStates.delete(userId);
  }
}

async function handleCreateEvent(
  ctx: Context,
  userId: number,
  datetime: string,
  state: any
) {
  try {
    // Parse the datetime
    const startTime = new Date(datetime);
    if (isNaN(startTime.getTime())) {
      await ctx.reply("Invalid date format. Please use: YYYY-MM-DD HH:MM");
      return;
    }

    // Default 1 hour duration
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    await ctx.reply("📅 Creating calendar event...");

    const result = await mcpClient.createCalendarEvent({
      summary: state.data.summary,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    await ctx.reply(
      `✅ *Event Created!*\n\n` +
        `📅 ${state.data.summary}\n` +
        `🕐 ${startTime.toLocaleString()}\n` +
        `🔗 ${result.event_link}`,
      { parse_mode: "Markdown" }
    );

    automationStates.delete(userId);
  } catch (error) {
    await ctx.reply(
      `❌ Failed to create event: ${error instanceof Error ? error.message : String(error)}\n\n` +
        "Make sure GOOGLE_CREDENTIALS is configured."
    );
    automationStates.delete(userId);
  }
}

// Handle research depth selection
export async function handleResearchDepthCallback(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;
  const userId = ctx.from?.id;

  if (!userId || !callbackData || !callbackData.startsWith("depth_")) return;

  await ctx.answerCallbackQuery();

  const state = automationStates.get(userId);
  if (!state || !state.data.topic) return;

  const depth = callbackData.replace("depth_", "") as "brief" | "moderate" | "comprehensive";

  await ctx.reply(`📚 Starting ${depth} research on "${state.data.topic}"...`);

  try {
    const result = await mcpClient.researchTopic({
      topic: state.data.topic,
      depth,
      output_format: "markdown",
    });

    await ctx.reply(
      `✅ *Research Complete!*\n\n` +
        `📚 Topic: ${state.data.topic}\n` +
        `📊 Level: ${depth}\n` +
        `💾 Saved to: ${result.file_path}\n\n` +
        `The research document has been created and saved locally.`,
      { parse_mode: "Markdown" }
    );

    automationStates.delete(userId);
  } catch (error) {
    await ctx.reply(
      `❌ Research failed: ${error instanceof Error ? error.message : String(error)}`
    );
    automationStates.delete(userId);
  }
}

export { automationStates };
