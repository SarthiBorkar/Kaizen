import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import { Readable } from "stream";

let driveClient: any = null;

function getGoogleDriveClient() {
  if (!driveClient) {
    const credentials = process.env.GOOGLE_CREDENTIALS;
    if (!credentials) {
      throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
    }

    const auth = new OAuth2Client();
    auth.setCredentials(JSON.parse(credentials));

    driveClient = google.drive({ version: "v3", auth });
  }
  return driveClient;
}

export async function uploadToDrive(args: {
  file_name: string;
  content: string;
  mime_type: string;
  folder_id?: string;
}): Promise<{
  success: boolean;
  file_id: string;
  file_url: string;
  message: string;
}> {
  const { file_name, content, mime_type, folder_id } = args;

  try {
    const drive = getGoogleDriveClient();

    const fileMetadata: any = {
      name: file_name,
    };

    if (folder_id) {
      fileMetadata.parents = [folder_id];
    }

    // Create a readable stream from the content
    const media = {
      mimeType: mime_type,
      body: Readable.from([content]),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    return {
      success: true,
      file_id: response.data.id,
      file_url: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}`,
      message: `File uploaded to Google Drive successfully: ${file_name}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload to Google Drive: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function createDriveFolder(args: {
  folder_name: string;
  parent_folder_id?: string;
}): Promise<{
  success: boolean;
  folder_id: string;
  folder_url: string;
  message: string;
}> {
  const { folder_name, parent_folder_id } = args;

  try {
    const drive = getGoogleDriveClient();

    const fileMetadata: any = {
      name: folder_name,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parent_folder_id) {
      fileMetadata.parents = [parent_folder_id];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, webViewLink",
    });

    return {
      success: true,
      folder_id: response.data.id,
      folder_url: response.data.webViewLink || `https://drive.google.com/drive/folders/${response.data.id}`,
      message: `Folder created in Google Drive successfully: ${folder_name}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to create Google Drive folder: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
