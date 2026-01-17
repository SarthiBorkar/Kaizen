# Claude Desktop Integration Guide

## Overview

This guide shows you how to connect your Kaizen Telegram bot to Claude Desktop, so Claude can handle all the automation workflows using your local plugins and integrations.

## Architecture

```
┌─────────────────┐
│  Telegram Bot   │  (You chat here)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude API     │  (Processes requests)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claude Desktop  │  (Your local machine)
│   MCP Servers   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬────────────┐
    ▼         ▼          ▼            ▼
┌──────┐  ┌──────┐  ┌────────┐  ┌──────┐
│Notion│  │Drive │  │Calendar│  │Files │
└──────┘  └──────┘  └────────┘  └──────┘
```

**Benefits:**
- ✅ No API keys in the bot (secure!)
- ✅ You control which plugins to enable
- ✅ Claude manages the orchestration
- ✅ Works with any MCP server
- ✅ Your data stays local

## Setup Steps

### 1. Install Claude Desktop

Download from: https://claude.ai/download

### 2. Configure MCP Servers

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Example configuration:**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Documents",
        "/Users/username/Documents/ObsidianVault"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key"
      }
    },
    "fetch": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ]
    }
  }
}
```

### 3. Enable Integrations You Want

#### For Web Scraping (Built-in, No Setup Needed)
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

#### For File/Obsidian Access
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/obsidian/vault"
      ]
    }
  }
}
```

#### For Web Search/Research
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"]
      "env": {
        "BRAVE_API_KEY": "your_api_key"
      }
    }
  }
}
```

#### For Notion Integration
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/client-mcp"]
      "env": {
        "NOTION_API_KEY": "your_notion_api_key"
      }
    }
  }
}
```

#### For Google Drive/Calendar
```json
{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-drive"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id",
        "GOOGLE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### 4. Configure the Bot

Add to your `.env`:

```env
# Required
BOT_TOKEN=your_telegram_bot_token
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token

# For Claude API Integration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your Anthropic API key from: https://console.anthropic.com/

### 5. Restart Everything

1. Restart Claude Desktop (to load MCP servers)
2. Restart your bot: `npm run dev`

## How to Use

### Basic Workflow (No Setup Needed)

**Web Scraping:**
```
/scrape https://example.com/article
```

Claude will:
1. Fetch the page
2. Extract content
3. Save as markdown

**Document Creation:**
```
/automate → Create Document
```

### Advanced Workflows (Requires Setup)

**Research with Search:**
```
/research stablecoins
```

Claude will:
1. Search the web (if brave-search enabled)
2. Compile information
3. Create structured document
4. Save to your filesystem/Obsidian

**Save to Notion:**
```
/scrape https://article.com
→ Bot: "Save to Notion?"
→ You: "Yes"
```

Claude will:
1. Scrape content
2. Create Notion page (if notion MCP enabled)
3. Return link

**Calendar Integration:**
```
/calendar
→ Create Event
→ Enter: "Team meeting tomorrow 2pm"
```

Claude will:
1. Parse natural language
2. Create Google Calendar event (if enabled)
3. Send confirmation

## Available MCP Servers

### Official Servers

| Server | Purpose | Setup Required |
|--------|---------|----------------|
| `@modelcontextprotocol/server-fetch` | Web scraping | No |
| `@modelcontextprotocol/server-filesystem` | File access | Path config |
| `@modelcontextprotocol/server-brave-search` | Web search | API key |
| `@modelcontextprotocol/server-google-drive` | Google Drive | OAuth |
| `@modelcontextprotocol/server-github` | GitHub ops | Token |
| `@modelcontextprotocol/server-slack` | Slack integration | Token |

### Community Servers

Find more at: https://github.com/modelcontextprotocol/servers

## Security Best Practices

1. **Never share your API keys** in Telegram or commit them to git
2. **Use environment variables** for sensitive data
3. **Limit filesystem access** to specific directories
4. **Review MCP server permissions** before enabling
5. **Keep Claude Desktop updated** for security patches

## Troubleshooting

### Bot says "Claude integration not configured"

**Solution:** Add `ANTHROPIC_API_KEY` to your `.env` file

### Claude can't access Notion/Drive/etc.

**Solution:**
1. Check `claude_desktop_config.json` has the server
2. Restart Claude Desktop
3. Check API keys are valid
4. Verify permissions in Notion/Google Console

### Web scraping not working

**Solution:**
1. Add `fetch` server to config
2. Some sites block scrapers - try different URLs
3. Check firewall/proxy settings

### File access denied

**Solution:**
1. Check paths in `filesystem` server config
2. Ensure paths exist and are readable
3. On macOS, grant Claude Desktop full disk access

## Example Workflows

### Daily Research Workflow

```json
// In claude_desktop_config.json
{
  "mcpServers": {
    "brave-search": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-brave-search"] },
    "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/Research"] }
  }
}
```

**In Telegram:**
```
/research AI agents
```

**Claude will:**
1. Search the web
2. Compile findings
3. Create markdown file in ~/Research
4. Send you the summary

### Content Archival Workflow

```json
{
  "mcpServers": {
    "fetch": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-fetch"] },
    "notion": { "command": "npx", "args": ["-y", "@notionhq/client-mcp"] }
  }
}
```

**In Telegram:**
```
/scrape https://interesting-article.com
```

**Claude will:**
1. Extract article content
2. Clean formatting
3. Save to Notion database
4. Return Notion page link

## Cost Considerations

**Claude API Pricing:**
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

**Typical usage:**
- Simple scrape: $0.01-0.05
- Research task: $0.10-0.50
- Complex workflow: $0.50-2.00

**Tips to reduce costs:**
- Use caching for repeated tasks
- Limit research depth
- Enable only needed MCP servers

## Privacy & Data

**What Claude sees:**
- Your Telegram messages to the bot
- Data from enabled MCP servers
- Your API usage patterns

**What Claude doesn't see:**
- Your API keys (stored locally)
- Files outside configured paths
- Services you haven't enabled

**Data retention:**
- Anthropic stores API requests for 30 days
- You can request deletion
- See: https://www.anthropic.com/privacy

## Next Steps

1. ✅ Set up basic config (fetch server)
2. ✅ Test with `/scrape`
3. ✅ Add filesystem for Obsidian
4. ✅ Test with `/research`
5. ✅ Add other integrations as needed

## Support

**Issues with MCP:**
- MCP Docs: https://modelcontextprotocol.io
- MCP GitHub: https://github.com/modelcontextprotocol

**Issues with the bot:**
- Check main README.md
- Open issue on GitHub

**Issues with Claude:**
- Claude support: https://support.anthropic.com
