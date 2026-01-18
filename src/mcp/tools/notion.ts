import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const notionTools: Tool[] = [
  {
    name: "create_notion_page",
    description:
      "Create a new page in Notion with the specified content. Can be used to save research, notes, or any documents to your Notion workspace.",
    inputSchema: {
      type: "object",
      properties: {
        parent_page_id: {
          type: "string",
          description: "The ID of the parent page or database where this page will be created",
        },
        title: {
          type: "string",
          description: "The title of the new page",
        },
        content: {
          type: "string",
          description: "The content to add to the page (markdown format)",
        },
        properties: {
          type: "object",
          description: "Optional database properties if creating in a database",
        },
      },
      required: ["parent_page_id", "title", "content"],
    },
  },
  {
    name: "append_notion_content",
    description:
      "Append content to an existing Notion page. Useful for adding information to ongoing research or notes.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to append content to",
        },
        content: {
          type: "string",
          description: "The content to append (markdown format)",
        },
      },
      required: ["page_id", "content"],
    },
  },
];
