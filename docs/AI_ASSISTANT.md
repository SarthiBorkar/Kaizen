# AI Assistant Features

## Overview

Kaizen Bot now includes powerful AI assistant capabilities powered by **Groq** (ultra-fast inference) and **Perplexity** (web-grounded research). You can chat with AI via text or voice messages, and get instant, intelligent responses.

## Features

### 🤖 AI Chat (Groq)
- **Fast responses** using Llama 3.3 70B model
- **Conversational memory** - AI remembers your recent conversation
- **Natural language understanding** - Ask anything naturally
- **Intent detection** - Automatically routes to the best service

### 🎙️ Voice Messages
- **Automatic transcription** using Groq's Whisper
- **Voice-to-text-to-response** - Send voice, get text reply
- **Works with any language** (auto-detected)
- **Super fast** - Transcription in seconds

### 🔬 Deep Research (Perplexity)
- **Web-grounded answers** - Real-time web search
- **Cited sources** - See where information comes from
- **Up-to-date information** - Current data, not training cutoff
- **Comprehensive responses** - Detailed, sourced explanations

## Commands

### `/ask <question>`

Ask the AI anything! General chat and questions.

**Examples:**
```
/ask what are the benefits of daily habits?
/ask how do I stay motivated?
/ask explain blockchain in simple terms
```

**How it works:**
1. Sends your question to Groq's Llama 3.3 70B
2. AI generates response based on conversation context
3. Response delivered in seconds
4. Conversation history maintained for context

### `/dr <topic>` or `/deepresearch <topic>`

Deep research with web sources and citations.

**Examples:**
```
/dr latest trends in AI
/deepresearch stablecoin regulation 2024
/dr best productivity techniques
```

**How it works:**
1. Sends query to Perplexity's online model
2. Searches the web in real-time
3. Compiles comprehensive answer
4. Includes source citations
5. Returns detailed, sourced response

### `/clearai`

Clear your conversation history with AI.

**Why use this:**
- Start a fresh conversation topic
- Reset context for unrelated questions
- Clear personal info from memory

### Voice Messages

Just send a voice message to the bot!

**How it works:**
1. Send voice message to bot
2. Bot automatically transcribes using Whisper
3. Shows transcription for verification
4. Analyzes intent (chat vs research)
5. Routes to appropriate AI service
6. Sends text response

**Supported:**
- Voice messages (any length)
- Audio files
- All languages (auto-detected)

## Natural Language in Private Chats

In private chats, you can ask questions without commands!

**Triggers:**
- Questions with `?`
- Starts with: what, how, why, when, where, who
- Phrases like "explain", "tell me", "can you"

**Examples:**
```
What are stablecoins?
→ AI responds automatically

How do I build better habits?
→ AI responds automatically

Why is consistency important?
→ AI responds automatically
```

**Note:** In groups, mention the bot: `@botname what is this?`

## Cost & Performance

### Groq (Chat & Transcription)

**Pricing:** FREE tier is very generous
- 30 requests/minute
- ~7,000 requests/day
- No credit card required

**Performance:**
- Response time: ~1-2 seconds
- Transcription: ~2-5 seconds
- Model: Llama 3.3 70B (very capable)

**Get API key:** https://console.groq.com

### Perplexity (Research)

**Pricing:** Pay-as-you-go
- $0.20 per 1M tokens (input)
- $0.20 per 1M tokens (output)
- Typical query: ~$0.002-0.01

**Performance:**
- Response time: ~5-10 seconds
- Web search included
- Real-time data

**Get API key:** https://www.perplexity.ai/settings/api

## Setup

### Quick Setup (Free)

Add to your `.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Get key at: https://console.groq.com

**This enables:**
- ✅ `/ask` command
- ✅ Voice message transcription
- ✅ Natural language queries
- ✅ AI chat

### Full Setup (With Research)

Add both keys to `.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**This enables everything:**
- ✅ All Groq features
- ✅ `/dr` deep research command
- ✅ Cited sources
- ✅ Web-grounded answers

## Usage Examples

### Example 1: Quick Question

**User:** `/ask what's the pomodoro technique?`

**AI Response:**
```
The Pomodoro Technique is a time management method where you:

1. Work for 25 minutes (one "pomodoro")
2. Take a 5-minute break
3. After 4 pomodoros, take a longer 15-30 minute break

Benefits:
• Improves focus and concentration
• Reduces mental fatigue
• Makes tasks feel less overwhelming
• Helps track how time is spent

It's named after the tomato-shaped timer its creator used!
```

### Example 2: Voice Message

**User:** *[Sends voice message saying "What are the best ways to stay consistent with daily habits?"]*

**Bot Response:**
```
🎙️ Transcribing your voice message...

📝 Transcription:
"What are the best ways to stay consistent with daily habits?"

💭 Processing your message...

Here are proven strategies for habit consistency:

1. Start Small - Begin with 2-minute versions of habits
2. Stack Habits - Link new habits to existing routines
3. Track Progress - Use a calendar or app to mark completions
4. Accountability - Share goals with others (like using this bot!)
5. Environment Design - Make good habits easy, bad habits hard
6. Identity-Based - Focus on becoming the type of person who does X

The key is making it so easy you can't say no, then building momentum!
```

### Example 3: Deep Research

**User:** `/dr latest developments in quantum computing 2024`

**Bot Response:**
```
🔍 Researching... This may take a moment.

📚 Research: latest developments in quantum computing 2024

Significant progress has been made in quantum computing in 2024:

**Hardware Advances:**
IBM unveiled its 1,121-qubit Condor processor and 433-qubit Osprey chip, representing major scaling achievements. Google claimed quantum supremacy with improved error correction, reducing error rates by 800x.

**Error Correction:**
Microsoft and Atom Computing demonstrated logical qubits with 20 physical qubits, showing viable paths to fault-tolerant quantum computing. Error rates have improved from ~1% to 0.001%.

**Applications:**
- Drug discovery: Simulating molecular interactions
- Cryptography: Developing quantum-resistant algorithms
- Optimization: Solving complex logistics problems
- Climate modeling: Improved weather prediction

**Challenges:**
Decoherence remains the primary obstacle. Most systems require near-absolute zero temperatures, limiting practical deployment.

Sources:
1. https://www.nature.com/articles/quantum-2024-advances
2. https://www.ibm.com/quantum/blog/2024-roadmap
3. https://www.scientificamerican.com/quantum-computing-2024
```

### Example 4: Natural Language

**User:** `how do i get better at waking up early?`

**Bot Response:**
```
💭 Thinking...

Here's how to become an early riser:

**Before Bed:**
• Set a consistent bedtime (8hrs before wake time)
• No screens 1hr before sleep
• Keep bedroom cool (65-68°F)
• No caffeine after 2pm

**Morning Strategy:**
• Place alarm across the room (forces you to stand)
• Expose yourself to bright light immediately
• Drink water first thing
• Have something to look forward to

**Consistency is Key:**
• Same wake time every day (even weekends!)
• Takes 21-30 days to form habit
• Don't hit snooze - destroys sleep quality

**Pro tip:** Wake 15min earlier each week until you reach your goal time, rather than jumping to 5am immediately.
```

## Tips & Best Practices

### Getting Better Responses

**Be specific:**
❌ "tell me about crypto"
✅ "explain how stablecoins maintain their peg"

**Provide context:**
❌ "how do i fix this?"
✅ "i'm trying to build a daily exercise habit but keep skipping days, what should i do?"

**Use the right tool:**
- `/ask` - Quick questions, chat, advice
- `/dr` - Need sources, current events, research

### Managing Conversation History

**When to clear:**
- Switching to unrelated topic
- AI seems confused about context
- Want fresh perspective
- After sharing personal info

**Command:** `/clearai`

### Voice Message Tips

**For best transcription:**
- Speak clearly at normal pace
- Minimize background noise
- Hold phone close to mouth
- Avoid interruptions

**Languages:**
Whisper auto-detects language, but English works best. Supports 50+ languages.

## Privacy & Data

### What's Stored:

**Locally (in bot):**
- Last 10 messages per user (in-memory)
- Cleared when bot restarts
- Cleared with `/clearai`

**Groq/Perplexity:**
- Requests logged for 30 days
- Used for service improvement
- Not used for model training
- You can request deletion

**What's NOT stored:**
- Voice recordings (deleted after transcription)
- Personal identifying information
- Conversation content permanently

### Security:

- All API calls use HTTPS
- API keys stored in environment variables
- No data shared between users
- Transcripts deleted after processing

## Troubleshooting

### "AI assistant requires GROQ_API_KEY"

**Problem:** Groq API key not configured

**Solution:**
1. Get key at https://console.groq.com
2. Add to `.env`: `GROQ_API_KEY=your_key`
3. Restart bot: `npm run dev`

### "Deep research requires PERPLEXITY_API_KEY"

**Problem:** Perplexity not configured (optional)

**Solution:**
- Use `/ask` instead (works without Perplexity)
- Or get key at https://www.perplexity.ai/settings/api

### Voice transcription fails

**Possible causes:**
- API key not set
- Audio format not supported
- File too large (>20MB)
- Network issues

**Solution:**
- Check `GROQ_API_KEY` is set
- Send as voice message (not video)
- Keep under 1 minute for best results

### AI gives incorrect information

**Remember:**
- AI can make mistakes
- For critical info, verify with `/dr` (cites sources)
- Not a replacement for professional advice
- Training data has cutoff dates

### Slow responses

**Groq (usually fast):**
- If slow, check your internet
- Free tier has rate limits

**Perplexity (slower):**
- Searches web in real-time
- 5-10 seconds is normal
- Complex queries take longer

## Advanced Features

### Intent Detection

Bot automatically detects what you want:

```
"what is bitcoin?" → Research (uses Perplexity if available)
"hi how are you?" → Chat (uses Groq)
"remind me tomorrow" → Calendar (routes to calendar command)
```

### Context Awareness

AI remembers recent conversation:

```
You: what are stablecoins?
AI: [explains stablecoins]

You: how are they different from regular crypto?
AI: [understands "they" refers to stablecoins]
```

### Multi-turn Conversations

Have natural back-and-forth:

```
You: explain habit formation
AI: [explains]

You: can you give examples?
AI: [provides examples]

You: which one works best?
AI: [recommends based on previous context]
```

## Integration with Other Features

### With Task Tracking

```
You: how do i stay consistent with my tasks?
AI: [gives advice]
You: /addtask Exercise 30min
Bot: [adds task]
You: /checkin
Bot: [check in with new task]
```

### With Research Automation

```
You: /dr topic
Bot: [researches]
AI: create a document about this
Bot: /automate → Create Document
```

### With Calendar

```
You: schedule time to work on this tomorrow
AI: [suggests time]
You: /calendar
Bot: [creates event]
```

## Comparison: Groq vs Perplexity

| Feature | Groq | Perplexity |
|---------|------|------------|
| **Speed** | ~1-2s | ~5-10s |
| **Cost** | Free (generous) | $~0.01/query |
| **Data Source** | Training data | Real-time web |
| **Citations** | No | Yes |
| **Best For** | Chat, quick Q&A | Research, current events |
| **Commands** | `/ask`, voice | `/dr` |

**Pro tip:** Use both!
- `/ask` for quick questions
- `/dr` when you need sources

## Future Enhancements

Coming soon:
- [ ] Image analysis (send photos, get descriptions)
- [ ] Long-term memory (remember user preferences)
- [ ] Custom personalities (adjust AI tone)
- [ ] Multi-language responses
- [ ] Voice responses (text-to-speech)
- [ ] Group chat AI (@mention in groups)

## FAQ

**Q: Is my data used to train AI models?**
A: No. Groq and Perplexity don't use user data for model training.

**Q: Can AI access my tasks/calendar?**
A: No. AI can't access your personal bot data unless you explicitly share it in conversation.

**Q: How accurate is voice transcription?**
A: Very accurate for clear audio. Whisper achieves ~95% accuracy in good conditions.

**Q: Does AI cost money?**
A: Groq is free. Perplexity is pay-per-use (~$0.01/query) but optional.

**Q: Can I use this in group chats?**
A: Yes! Mention the bot: `@botname your question`

**Q: What languages are supported?**
A: Whisper supports 50+ languages. Chat works best in English.

**Q: Is there a message limit?**
A: Groq free tier: 30/min, ~7000/day. More than enough for personal use.

**Q: Can AI remember things long-term?**
A: Currently only last 10 messages. Long-term memory coming soon.

## Support

**Issues with AI:**
- Check API keys are set correctly
- Verify keys are valid at provider dashboards
- Check rate limits (Groq: 30/min)
- Restart bot after changing `.env`

**Getting Help:**
- Check this documentation
- Review error messages
- Contact bot administrator
- Open GitHub issue

## Credits

**Powered by:**
- 🚀 Groq - Ultra-fast LLM inference
- 🔬 Perplexity - Web-grounded research
- 🎙️ Whisper - Voice transcription
- 🧠 Llama 3.3 70B - Language model

---

**Start chatting with AI today!** Just send `/ask how can you help me?` 🤖
