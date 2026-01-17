import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const documentTools: Tool[] = [
  {
    name: "create_document",
    description:
      "Create a text document with the specified content. Can be used for research notes, reports, or any text-based content.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the document",
        },
        content: {
          type: "string",
          description: "The content of the document in markdown format",
        },
        format: {
          type: "string",
          enum: ["markdown", "txt", "html"],
          description: "The format of the document",
          default: "markdown",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "create_pdf",
    description:
      "Create a PDF document from the provided content. Useful for creating formatted reports, research documents, or any content that needs to be shared in PDF format.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the PDF document",
        },
        content: {
          type: "string",
          description: "The content to include in the PDF (supports markdown)",
        },
        metadata: {
          type: "object",
          properties: {
            author: { type: "string" },
            subject: { type: "string" },
            keywords: { type: "string" },
          },
          description: "Optional metadata for the PDF",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "research_topic",
    description:
      "Research a topic and create a comprehensive document with findings. This will gather information, organize it, and create a structured document.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The topic to research (e.g., 'stablecoins', 'DeFi protocols')",
        },
        depth: {
          type: "string",
          enum: ["brief", "moderate", "comprehensive"],
          description: "How detailed the research should be",
          default: "moderate",
        },
        output_format: {
          type: "string",
          enum: ["markdown", "pdf"],
          description: "The format for the research document",
          default: "markdown",
        },
        include_sources: {
          type: "boolean",
          description: "Whether to include source citations",
          default: true,
        },
      },
      required: ["topic"],
    },
  },
];
