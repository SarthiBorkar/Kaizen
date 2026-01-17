/**
 * MCP Client for Telegram Bot
 *
 * This client provides a simple interface for the Telegram bot to interact
 * with MCP tools without needing to manage the MCP protocol directly.
 */

import { createDocument, createPDF, researchTopic } from "./handlers/document-handler.js";
import { scrapeWeb, extractContent } from "./handlers/web-scraper-handler.js";
import { createNotionPage, appendNotionContent } from "./handlers/notion-handler.js";
import { uploadToDrive, createDriveFolder } from "./handlers/google-drive-handler.js";
import { createObsidianNote, updateObsidianNote } from "./handlers/obsidian-handler.js";
import {
  createCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from "./handlers/google-calendar-handler.js";
import { orchestrateWorkflow, createAutomation } from "./handlers/workflow-handler.js";

export class MCPClient {
  // Document Tools
  async createDocument(args: {
    title: string;
    content: string;
    format?: "markdown" | "txt" | "html";
  }) {
    return createDocument(args);
  }

  async createPDF(args: {
    title: string;
    content: string;
    metadata?: { author?: string; subject?: string; keywords?: string };
  }) {
    return createPDF(args);
  }

  async researchTopic(args: {
    topic: string;
    depth?: "brief" | "moderate" | "comprehensive";
    output_format?: "markdown" | "pdf";
    include_sources?: boolean;
  }) {
    return researchTopic(args);
  }

  // Web Scraping Tools
  async scrapeWeb(args: {
    url: string;
    selectors?: {
      title?: string;
      content?: string;
      images?: string;
    };
    extract_links?: boolean;
  }) {
    return scrapeWeb(args);
  }

  async extractContent(args: { url: string; format?: "text" | "markdown" | "html" }) {
    return extractContent(args);
  }

  // Notion Tools
  async createNotionPage(args: {
    parent_page_id: string;
    title: string;
    content: string;
    properties?: any;
  }) {
    return createNotionPage(args);
  }

  async appendNotionContent(args: { page_id: string; content: string }) {
    return appendNotionContent(args);
  }

  // Google Drive Tools
  async uploadToDrive(args: {
    file_name: string;
    content: string;
    mime_type: string;
    folder_id?: string;
  }) {
    return uploadToDrive(args);
  }

  async createDriveFolder(args: { folder_name: string; parent_folder_id?: string }) {
    return createDriveFolder(args);
  }

  // Obsidian Tools
  async createObsidianNote(args: {
    vault_path: string;
    note_path: string;
    content: string;
    frontmatter?: any;
  }) {
    return createObsidianNote(args);
  }

  async updateObsidianNote(args: {
    vault_path: string;
    note_path: string;
    content: string;
    mode?: "append" | "prepend" | "replace";
  }) {
    return updateObsidianNote(args);
  }

  // Google Calendar Tools
  async createCalendarEvent(args: {
    summary: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    attendees?: string[];
    reminders?: Array<{ method: "email" | "popup"; minutes: number }>;
  }) {
    return createCalendarEvent(args);
  }

  async listCalendarEvents(args: {
    time_min?: string;
    time_max?: string;
    max_results?: number;
  }) {
    return listCalendarEvents(args);
  }

  async updateCalendarEvent(args: {
    event_id: string;
    updates: {
      summary?: string;
      description?: string;
      start_time?: string;
      end_time?: string;
      location?: string;
    };
  }) {
    return updateCalendarEvent(args);
  }

  // Workflow Tools
  async orchestrateWorkflow(args: {
    workflow_name: string;
    steps: Array<{
      tool: string;
      arguments: any;
      depends_on?: string[];
    }>;
  }) {
    return orchestrateWorkflow(args);
  }

  async createAutomation(args: {
    automation_name: string;
    trigger: {
      type: "manual" | "schedule" | "event";
      schedule?: string;
    };
    actions: Array<{
      tool: string;
      arguments: any;
    }>;
  }) {
    return createAutomation(args);
  }

  // Convenience methods for common workflows

  /**
   * Research a topic and save it to multiple destinations
   */
  async researchAndSave(args: {
    topic: string;
    depth?: "brief" | "moderate" | "comprehensive";
    destinations: Array<"notion" | "drive" | "obsidian">;
    notion_parent_id?: string;
    drive_folder_id?: string;
    obsidian_vault_path?: string;
  }) {
    // First, research the topic
    const research = await this.researchTopic({
      topic: args.topic,
      depth: args.depth,
      output_format: "markdown",
    });

    const results: any = {
      research,
      saved_to: [],
    };

    // Save to Notion if requested
    if (args.destinations.includes("notion") && args.notion_parent_id) {
      try {
        const notionResult = await this.createNotionPage({
          parent_page_id: args.notion_parent_id,
          title: `Research: ${args.topic}`,
          content: research.content,
        });
        results.saved_to.push({ platform: "notion", result: notionResult });
      } catch (error) {
        results.saved_to.push({
          platform: "notion",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Save to Google Drive if requested
    if (args.destinations.includes("drive")) {
      try {
        const driveResult = await this.uploadToDrive({
          file_name: `research_${args.topic.replace(/\s+/g, "_")}.md`,
          content: research.content,
          mime_type: "text/markdown",
          folder_id: args.drive_folder_id,
        });
        results.saved_to.push({ platform: "drive", result: driveResult });
      } catch (error) {
        results.saved_to.push({
          platform: "drive",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Save to Obsidian if requested
    if (args.destinations.includes("obsidian") && args.obsidian_vault_path) {
      try {
        const obsidianResult = await this.createObsidianNote({
          vault_path: args.obsidian_vault_path,
          note_path: `Research/${args.topic}.md`,
          content: research.content,
          frontmatter: {
            tags: ["research", args.topic.toLowerCase()],
            created: new Date().toISOString(),
          },
        });
        results.saved_to.push({ platform: "obsidian", result: obsidianResult });
      } catch (error) {
        results.saved_to.push({
          platform: "obsidian",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Scrape a web page and save it to a destination
   */
  async scrapeAndSave(args: {
    url: string;
    destination: "notion" | "drive" | "obsidian";
    notion_parent_id?: string;
    drive_folder_id?: string;
    obsidian_vault_path?: string;
  }) {
    // Extract content from the URL
    const extracted = await this.extractContent({
      url: args.url,
      format: "markdown",
    });

    let result;

    switch (args.destination) {
      case "notion":
        if (!args.notion_parent_id) {
          throw new Error("notion_parent_id is required for Notion destination");
        }
        result = await this.createNotionPage({
          parent_page_id: args.notion_parent_id,
          title: extracted.title,
          content: extracted.content,
        });
        break;

      case "drive":
        result = await this.uploadToDrive({
          file_name: `${extracted.title.replace(/[^a-z0-9]/gi, "_")}.md`,
          content: extracted.content,
          mime_type: "text/markdown",
          folder_id: args.drive_folder_id,
        });
        break;

      case "obsidian":
        if (!args.obsidian_vault_path) {
          throw new Error("obsidian_vault_path is required for Obsidian destination");
        }
        result = await this.createObsidianNote({
          vault_path: args.obsidian_vault_path,
          note_path: `Web Clips/${extracted.title}.md`,
          content: extracted.content,
          frontmatter: {
            source: args.url,
            clipped: new Date().toISOString(),
          },
        });
        break;
    }

    return {
      extracted,
      saved: result,
    };
  }
}

// Export a singleton instance
export const mcpClient = new MCPClient();
