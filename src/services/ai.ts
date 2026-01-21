import Groq from "groq-sdk";
import axios from "axios";

// Initialize Groq client
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Conversation history storage (in-memory for now)
const conversationHistory = new Map<number, Array<{ role: string; content: string }>>();

const MAX_HISTORY = 10; // Keep last 10 messages per user

/**
 * Chat with Groq AI
 */
export async function chatWithAI(
  userId: number,
  message: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const groq = getGroqClient();

    // Get or initialize conversation history
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }

    const history = conversationHistory.get(userId)!;

    // Add user message to history
    history.push({ role: "user", content: message });

    // Keep only recent messages
    if (history.length > MAX_HISTORY * 2) {
      history.splice(0, history.length - MAX_HISTORY * 2);
    }

    // Prepare messages
    const messages: any[] = [
      {
        role: "system",
        content:
          systemPrompt ||
          `You are Kaizen, a helpful AI assistant integrated into a productivity and accountability Telegram bot.
You help users with:
- Daily accountability and habit tracking
- Research and information gathering
- Document creation and organization
- Calendar and task management
- General questions and advice

Be concise, friendly, and actionable. Use emojis sparingly. Keep responses under 500 words unless detailed explanation is needed.`,
      },
      ...history,
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile", // Fast and capable
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    // Add AI response to history
    history.push({ role: "assistant", content: aiResponse });

    return aiResponse;
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    throw new Error(`AI chat failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Transcribe voice message using Groq Whisper
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const groq = getGroqClient();
    const fs = await import("fs");

    // Transcribe using Groq's Whisper implementation
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3",
      language: "en", // Can be auto-detected
      response_format: "text",
    });

    return transcription as unknown as string;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error(
      `Audio transcription failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Research using Perplexity AI
 */
export async function researchWithPerplexity(query: string): Promise<{
  answer: string;
  sources: string[];
}> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY environment variable is not set");
    }

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant. Provide accurate, well-sourced information. Be concise but comprehensive. Include key facts and statistics when relevant.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = response.data.choices[0]?.message?.content || "No answer found.";
    const citations = response.data.citations || [];

    return {
      answer,
      sources: citations,
    };
  } catch (error) {
    console.error("Error with Perplexity research:", error);
    throw new Error(
      `Perplexity research failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clear conversation history for a user
 */
export function clearConversationHistory(userId: number): void {
  conversationHistory.delete(userId);
}

/**
 * Analyze text and determine intent
 */
export async function analyzeIntent(
  text: string
): Promise<{
  intent: "research" | "chat" | "task" | "calendar" | "document";
  confidence: number;
}> {
  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Analyze the user's message and determine their intent. Respond with ONLY a JSON object:
{
  "intent": "research" | "chat" | "task" | "calendar" | "document",
  "confidence": 0.0-1.0
}

Intent definitions:
- research: User wants to learn about a topic, needs information, asks "what is", "how does", "explain"
- chat: General conversation, greetings, small talk, questions about the bot
- task: Creating, managing, or checking tasks and todos
- calendar: Scheduling, events, reminders, appointments
- document: Creating documents, PDFs, notes, saving content

Examples:
"what are stablecoins?" -> {"intent": "research", "confidence": 0.95}
"hi how are you?" -> {"intent": "chat", "confidence": 0.9}
"remind me to call John tomorrow" -> {"intent": "calendar", "confidence": 0.85}
"create a document about my ideas" -> {"intent": "document", "confidence": 0.8}`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(response);

    return {
      intent: parsed.intent || "chat",
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error("Error analyzing intent:", error);
    // Default to chat on error
    return { intent: "chat", confidence: 0.5 };
  }
}

/**
 * Extract task information from text
 */
export async function extractTaskInfo(
  text: string
): Promise<{
  taskName: string | null;
  reminderTime: string | null;
}> {
  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Extract task information from the user's message. Respond with ONLY a JSON object:
{
  "taskName": "the task description" | null,
  "reminderTime": "6pm" | "18:00" | "6 PM" | null
}

Instructions:
- taskName: Extract the main task/activity the user wants to do or be reminded about
- reminderTime: Extract the time if mentioned (keep it in natural format like "6pm", "18:00", "tomorrow at 3pm")
- If no task is found, return null for taskName
- If no time is mentioned, return null for reminderTime

Examples:
"remind me to go to gym at 6pm" -> {"taskName": "go to gym", "reminderTime": "6pm"}
"add workout as a task" -> {"taskName": "workout", "reminderTime": null}
"call mom tomorrow at 3pm" -> {"taskName": "call mom", "reminderTime": "tomorrow at 3pm"}
"meeting with John" -> {"taskName": "meeting with John", "reminderTime": null}`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(response);

    return {
      taskName: parsed.taskName || null,
      reminderTime: parsed.reminderTime || null,
    };
  } catch (error) {
    console.error("Error extracting task info:", error);
    return { taskName: null, reminderTime: null };
  }
}
