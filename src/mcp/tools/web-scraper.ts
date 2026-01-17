import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const webScraperTools: Tool[] = [
  {
    name: "scrape_web",
    description:
      "Scrape content from a web page. Extracts text, links, images, and other content from the specified URL.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to scrape",
        },
        selectors: {
          type: "object",
          properties: {
            title: { type: "string", description: "CSS selector for title" },
            content: { type: "string", description: "CSS selector for main content" },
            images: { type: "string", description: "CSS selector for images" },
          },
          description: "Optional CSS selectors to target specific content",
        },
        extract_links: {
          type: "boolean",
          description: "Whether to extract all links from the page",
          default: false,
        },
      },
      required: ["url"],
    },
  },
  {
    name: "extract_content",
    description:
      "Extract and clean main content from a web page, removing ads, navigation, and other clutter. Returns clean, readable text.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to extract content from",
        },
        format: {
          type: "string",
          enum: ["text", "markdown", "html"],
          description: "The format to return the content in",
          default: "markdown",
        },
      },
      required: ["url"],
    },
  },
];
