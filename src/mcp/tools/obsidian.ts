import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const obsidianTools: Tool[] = [
  {
    name: "create_obsidian_note",
    description:
      "Create a new note in your Obsidian vault. Useful for saving research, ideas, or any markdown content to your Obsidian knowledge base.",
    inputSchema: {
      type: "object",
      properties: {
        vault_path: {
          type: "string",
          description: "The path to your Obsidian vault",
        },
        note_path: {
          type: "string",
          description: "The path within the vault for the new note (e.g., 'Research/Stablecoins.md')",
        },
        content: {
          type: "string",
          description: "The content of the note in markdown format",
        },
        frontmatter: {
          type: "object",
          description: "Optional YAML frontmatter for the note (tags, aliases, etc.)",
        },
      },
      required: ["vault_path", "note_path", "content"],
    },
  },
  {
    name: "update_obsidian_note",
    description:
      "Update an existing note in your Obsidian vault by appending or replacing content.",
    inputSchema: {
      type: "object",
      properties: {
        vault_path: {
          type: "string",
          description: "The path to your Obsidian vault",
        },
        note_path: {
          type: "string",
          description: "The path to the note within the vault",
        },
        content: {
          type: "string",
          description: "The content to add or replace",
        },
        mode: {
          type: "string",
          enum: ["append", "prepend", "replace"],
          description: "How to update the note",
          default: "append",
        },
      },
      required: ["vault_path", "note_path", "content"],
    },
  },
];
