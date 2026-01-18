import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const googleDriveTools: Tool[] = [
  {
    name: "upload_to_drive",
    description:
      "Upload a file to Google Drive. Can upload documents, PDFs, images, or any other file type.",
    inputSchema: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "The name of the file to upload",
        },
        content: {
          type: "string",
          description: "The content of the file (for text files) or base64 encoded content (for binary files)",
        },
        mime_type: {
          type: "string",
          description: "The MIME type of the file (e.g., 'application/pdf', 'text/plain')",
        },
        folder_id: {
          type: "string",
          description: "Optional: The ID of the folder to upload to. If not specified, uploads to root.",
        },
      },
      required: ["file_name", "content", "mime_type"],
    },
  },
  {
    name: "create_drive_folder",
    description:
      "Create a new folder in Google Drive to organize your files.",
    inputSchema: {
      type: "object",
      properties: {
        folder_name: {
          type: "string",
          description: "The name of the folder to create",
        },
        parent_folder_id: {
          type: "string",
          description: "Optional: The ID of the parent folder. If not specified, creates in root.",
        },
      },
      required: ["folder_name"],
    },
  },
];
