import fs from "fs";
import path from "path";
import yaml from "js-yaml";

function ensureDirectoryExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function formatFrontmatter(frontmatter: any): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return "";
  }
  return `---\n${yaml.dump(frontmatter)}---\n\n`;
}

export async function createObsidianNote(args: {
  vault_path: string;
  note_path: string;
  content: string;
  frontmatter?: any;
}): Promise<{
  success: boolean;
  file_path: string;
  message: string;
}> {
  const { vault_path, note_path, content, frontmatter } = args;

  try {
    // Validate vault path exists
    if (!fs.existsSync(vault_path)) {
      throw new Error(`Vault path does not exist: ${vault_path}`);
    }

    const fullPath = path.join(vault_path, note_path);

    // Check if file already exists
    if (fs.existsSync(fullPath)) {
      throw new Error(`Note already exists: ${note_path}`);
    }

    // Ensure directory exists
    ensureDirectoryExists(fullPath);

    // Create note content with frontmatter
    const frontmatterString = formatFrontmatter(frontmatter);
    const noteContent = `${frontmatterString}${content}`;

    // Write the file
    fs.writeFileSync(fullPath, noteContent, "utf-8");

    return {
      success: true,
      file_path: fullPath,
      message: `Obsidian note created successfully: ${note_path}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to create Obsidian note: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateObsidianNote(args: {
  vault_path: string;
  note_path: string;
  content: string;
  mode?: "append" | "prepend" | "replace";
}): Promise<{
  success: boolean;
  file_path: string;
  message: string;
}> {
  const { vault_path, note_path, content, mode = "append" } = args;

  try {
    // Validate vault path exists
    if (!fs.existsSync(vault_path)) {
      throw new Error(`Vault path does not exist: ${vault_path}`);
    }

    const fullPath = path.join(vault_path, note_path);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Note does not exist: ${note_path}`);
    }

    let existingContent = fs.readFileSync(fullPath, "utf-8");
    let newContent = "";

    // Handle frontmatter if it exists
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---\n\n/);
    let frontmatter = "";
    let bodyContent = existingContent;

    if (frontmatterMatch) {
      frontmatter = frontmatterMatch[0];
      bodyContent = existingContent.slice(frontmatterMatch[0].length);
    }

    // Apply the update based on mode
    switch (mode) {
      case "append":
        newContent = frontmatter + bodyContent + "\n\n" + content;
        break;
      case "prepend":
        newContent = frontmatter + content + "\n\n" + bodyContent;
        break;
      case "replace":
        newContent = frontmatter + content;
        break;
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }

    // Write the updated content
    fs.writeFileSync(fullPath, newContent, "utf-8");

    return {
      success: true,
      file_path: fullPath,
      message: `Obsidian note updated successfully: ${note_path}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to update Obsidian note: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
