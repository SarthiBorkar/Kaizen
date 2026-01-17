import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import MCP tools
import { documentTools } from "./tools/documents.js";
import { webScraperTools } from "./tools/web-scraper.js";
import { notionTools } from "./tools/notion.js";
import { googleDriveTools } from "./tools/google-drive.js";
import { obsidianTools } from "./tools/obsidian.js";
import { googleCalendarTools } from "./tools/google-calendar.js";
import { workflowTools } from "./tools/workflows.js";

export class MCPServer {
  private server: Server;
  private tools: Map<string, Tool>;

  constructor() {
    this.server = new Server(
      {
        name: "kaizen-automation-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = new Map();
    this.registerTools();
    this.setupHandlers();
  }

  private registerTools() {
    // Register all tools from different modules
    const allTools = [
      ...documentTools,
      ...webScraperTools,
      ...notionTools,
      ...googleDriveTools,
      ...obsidianTools,
      ...googleCalendarTools,
      ...workflowTools,
    ];

    allTools.forEach((tool) => {
      this.tools.set(tool.name, tool);
    });
  }

  private setupHandlers() {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Handle tool execution request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = this.tools.get(toolName);

      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      // Execute the tool based on its name
      try {
        const result = await this.executeTool(toolName, request.params.arguments);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    // Import and execute tool handlers
    switch (toolName) {
      // Document tools
      case "create_document":
        const { createDocument } = await import("./handlers/document-handler.js");
        return createDocument(args);
      case "create_pdf":
        const { createPDF } = await import("./handlers/document-handler.js");
        return createPDF(args);
      case "research_topic":
        const { researchTopic } = await import("./handlers/document-handler.js");
        return researchTopic(args);

      // Web scraper tools
      case "scrape_web":
        const { scrapeWeb } = await import("./handlers/web-scraper-handler.js");
        return scrapeWeb(args);
      case "extract_content":
        const { extractContent } = await import("./handlers/web-scraper-handler.js");
        return extractContent(args);

      // Notion tools
      case "create_notion_page":
        const { createNotionPage } = await import("./handlers/notion-handler.js");
        return createNotionPage(args);
      case "append_notion_content":
        const { appendNotionContent } = await import("./handlers/notion-handler.js");
        return appendNotionContent(args);

      // Google Drive tools
      case "upload_to_drive":
        const { uploadToDrive } = await import("./handlers/google-drive-handler.js");
        return uploadToDrive(args);
      case "create_drive_folder":
        const { createDriveFolder } = await import("./handlers/google-drive-handler.js");
        return createDriveFolder(args);

      // Obsidian tools
      case "create_obsidian_note":
        const { createObsidianNote } = await import("./handlers/obsidian-handler.js");
        return createObsidianNote(args);
      case "update_obsidian_note":
        const { updateObsidianNote } = await import("./handlers/obsidian-handler.js");
        return updateObsidianNote(args);

      // Google Calendar tools
      case "create_calendar_event":
        const { createCalendarEvent } = await import("./handlers/google-calendar-handler.js");
        return createCalendarEvent(args);
      case "list_calendar_events":
        const { listCalendarEvents } = await import("./handlers/google-calendar-handler.js");
        return listCalendarEvents(args);
      case "update_calendar_event":
        const { updateCalendarEvent } = await import("./handlers/google-calendar-handler.js");
        return updateCalendarEvent(args);

      // Workflow tools
      case "orchestrate_workflow":
        const { orchestrateWorkflow } = await import("./handlers/workflow-handler.js");
        return orchestrateWorkflow(args);
      case "create_automation":
        const { createAutomation } = await import("./handlers/workflow-handler.js");
        return createAutomation(args);

      default:
        throw new Error(`No handler found for tool: ${toolName}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("MCP Server started successfully");
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MCPServer();
  server.start().catch(console.error);
}
