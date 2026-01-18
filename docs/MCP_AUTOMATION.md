# MCP Workflow Automation Guide

## Overview

Kaizen Bot now includes powerful MCP (Model Context Protocol) integration that enables workflow automation and integration with various productivity tools. This allows you to orchestrate complex tasks like research, document creation, web scraping, and integration with services like Notion, Google Drive, Obsidian, and Google Calendar.

## Features

### 🤖 Workflow Automation

- **Research Topics**: Automatically research topics and generate comprehensive documents
- **Web Scraping**: Extract content from web pages and save to various destinations
- **Document Creation**: Create documents and PDFs with structured content
- **Calendar Management**: Create and manage Google Calendar events
- **Multi-Platform Integration**: Save content to Notion, Google Drive, or Obsidian
- **Custom Workflows**: Chain multiple tools together for complex automation

## Commands

### `/automate`

Opens the automation hub with quick access to all automation features.

**Available Actions:**
- 📝 Research Topic
- 🌐 Scrape Web Page
- 📅 Create Calendar Event
- 📄 Create Document
- 🔄 View Workflows

### `/research <topic>`

Research a topic and create a comprehensive document.

**Example:**
```
/research stablecoins
```

**Workflow:**
1. Bot asks for research depth (brief, moderate, comprehensive)
2. Generates structured research document
3. Saves to local file system
4. Optionally save to Notion, Google Drive, or Obsidian

### `/scrape <url>`

Extract content from a web page and save it.

**Example:**
```
/scrape https://example.com/article
```

**Workflow:**
1. Bot extracts main content from the URL
2. Cleans and formats the content
3. Saves as markdown document
4. Optionally save to your preferred destination

### `/calendar`

Manage your Google Calendar.

**Available Actions:**
- ➕ Create Event
- 📋 List Events

**Create Event Workflow:**
1. Enter event title
2. Specify date and time
3. Bot creates the calendar event
4. Returns event link

## Integration Setup

### Notion Integration

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Get your integration token
3. Add to `.env`:
   ```
   NOTION_API_KEY=your_notion_api_key
   ```
4. Share your Notion pages with the integration

### Google Services (Calendar & Drive)

1. Create a Google Cloud project
2. Enable Google Calendar API and Google Drive API
3. Create OAuth 2.0 credentials
4. Download credentials and add to `.env`:
   ```
   GOOGLE_CREDENTIALS='{"access_token":"...","refresh_token":"...","scope":"...","token_type":"Bearer","expiry_date":...}'
   ```

### Obsidian Integration

1. Specify your Obsidian vault path when using Obsidian commands
2. Example vault path: `/Users/username/Documents/ObsidianVault`
3. No API key needed (uses local file system)

## MCP Tools

### Document Tools

#### `create_document`
Create a text document (markdown, txt, or html).

**Parameters:**
- `title`: Document title
- `content`: Document content
- `format`: "markdown" | "txt" | "html"

#### `create_pdf`
Create a PDF document.

**Parameters:**
- `title`: PDF title
- `content`: PDF content
- `metadata`: Optional metadata (author, subject, keywords)

#### `research_topic`
Research a topic and create a document.

**Parameters:**
- `topic`: Topic to research
- `depth`: "brief" | "moderate" | "comprehensive"
- `output_format`: "markdown" | "pdf"
- `include_sources`: Include citations

### Web Scraping Tools

#### `scrape_web`
Scrape content from a web page.

**Parameters:**
- `url`: URL to scrape
- `selectors`: Optional CSS selectors
- `extract_links`: Extract all links

#### `extract_content`
Extract and clean main content from a web page.

**Parameters:**
- `url`: URL to extract from
- `format`: "text" | "markdown" | "html"

### Notion Tools

#### `create_notion_page`
Create a new page in Notion.

**Parameters:**
- `parent_page_id`: Parent page ID
- `title`: Page title
- `content`: Page content (markdown)
- `properties`: Database properties

#### `append_notion_content`
Append content to an existing Notion page.

**Parameters:**
- `page_id`: Page ID
- `content`: Content to append

### Google Drive Tools

#### `upload_to_drive`
Upload a file to Google Drive.

**Parameters:**
- `file_name`: File name
- `content`: File content
- `mime_type`: MIME type
- `folder_id`: Optional folder ID

#### `create_drive_folder`
Create a folder in Google Drive.

**Parameters:**
- `folder_name`: Folder name
- `parent_folder_id`: Optional parent folder ID

### Obsidian Tools

#### `create_obsidian_note`
Create a note in Obsidian.

**Parameters:**
- `vault_path`: Path to Obsidian vault
- `note_path`: Path within vault
- `content`: Note content
- `frontmatter`: YAML frontmatter

#### `update_obsidian_note`
Update an existing Obsidian note.

**Parameters:**
- `vault_path`: Path to Obsidian vault
- `note_path`: Path to note
- `content`: Content to add/replace
- `mode`: "append" | "prepend" | "replace"

### Google Calendar Tools

#### `create_calendar_event`
Create a calendar event.

**Parameters:**
- `summary`: Event title
- `description`: Event description
- `start_time`: Start time (ISO 8601)
- `end_time`: End time (ISO 8601)
- `location`: Optional location
- `attendees`: Optional attendee emails
- `reminders`: Optional reminders

#### `list_calendar_events`
List upcoming calendar events.

**Parameters:**
- `time_min`: Start of time range
- `time_max`: End of time range
- `max_results`: Maximum events to return

### Workflow Tools

#### `orchestrate_workflow`
Chain multiple tools together.

**Parameters:**
- `workflow_name`: Workflow name
- `steps`: Array of tool executions with dependencies

**Example:**
```javascript
{
  workflow_name: "Research and Save",
  steps: [
    {
      tool: "research_topic",
      arguments: { topic: "DeFi", depth: "moderate" }
    },
    {
      tool: "create_notion_page",
      arguments: {
        parent_page_id: "xxx",
        title: "{{step_1.title}}",
        content: "{{step_1.content}}"
      },
      depends_on: ["step_1"]
    }
  ]
}
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
BOT_TOKEN=your_telegram_bot_token
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Optional - For MCP Integrations
NOTION_API_KEY=your_notion_api_key
GOOGLE_CREDENTIALS='{"access_token":"...","refresh_token":"...","scope":"...","token_type":"Bearer","expiry_date":...}'
```

## Use Cases

### 1. Daily Research Workflow

**Scenario**: Research a topic every morning and save to Notion

**Steps:**
1. Use `/research <topic>`
2. Select research depth
3. Bot generates research document
4. Saves to Notion workspace

### 2. Web Content Archival

**Scenario**: Save important articles to Obsidian vault

**Steps:**
1. Use `/scrape <url>`
2. Bot extracts content
3. Saves to Obsidian with metadata
4. Organized in "Web Clips" folder

### 3. Meeting Automation

**Scenario**: Create calendar events from messages

**Steps:**
1. Use `/calendar`
2. Select "Create Event"
3. Enter event details
4. Bot creates Google Calendar event

### 4. Multi-Platform Backup

**Scenario**: Save research to multiple platforms

**Steps:**
1. Research topic
2. Bot saves to:
   - Local file system
   - Notion
   - Google Drive
   - Obsidian vault

## Architecture

```
┌─────────────────┐
│  Telegram Bot   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MCP Client    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MCP Tools     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬────────────┬──────────┐
    ▼         ▼          ▼            ▼          ▼
┌──────┐  ┌──────┐  ┌────────┐  ┌────────┐  ┌──────┐
│Notion│  │Drive │  │Calendar│  │Obsidian│  │ Web  │
└──────┘  └──────┘  └────────┘  └────────┘  └──────┘
```

## Troubleshooting

### Notion Integration Issues

**Problem**: "NOTION_API_KEY environment variable is not set"

**Solution**:
1. Check `.env` file has `NOTION_API_KEY`
2. Restart the bot after adding the key
3. Ensure the integration has access to your pages

### Google Services Issues

**Problem**: "GOOGLE_CREDENTIALS environment variable is not set"

**Solution**:
1. Set up OAuth 2.0 credentials in Google Cloud Console
2. Add credentials to `.env` as JSON string
3. Ensure Calendar and Drive APIs are enabled

### Obsidian Issues

**Problem**: "Vault path does not exist"

**Solution**:
1. Provide absolute path to Obsidian vault
2. Ensure the vault is accessible from the bot
3. Check file system permissions

## Security Considerations

1. **API Keys**: Never commit `.env` files to version control
2. **Credentials**: Use environment variables for all sensitive data
3. **Permissions**: Only grant necessary permissions to integrations
4. **Validation**: Bot validates all user inputs
5. **Rate Limiting**: Respect API rate limits for external services

## Future Enhancements

- [ ] Scheduled automations (cron-based triggers)
- [ ] More integration options (Slack, Discord, etc.)
- [ ] Advanced workflow templates
- [ ] AI-powered content generation
- [ ] Analytics and insights dashboard
- [ ] Custom automation builder UI

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review environment variable configuration
3. Check API credentials and permissions
4. Consult the main README.md for general bot setup

## License

MIT License - Same as Kaizen Bot
