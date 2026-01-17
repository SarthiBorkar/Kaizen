import { Client } from "@notionhq/client";

let notionClient: Client | null = null;

function getNotionClient(): Client {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error("NOTION_API_KEY environment variable is not set");
    }
    notionClient = new Client({ auth: apiKey });
  }
  return notionClient;
}

function markdownToNotionBlocks(markdown: string): any[] {
  const blocks: any[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
    }
    // Heading 2
    else if (line.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: line.slice(3) } }],
        },
      });
    }
    // Heading 3
    else if (line.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: line.slice(4) } }],
        },
      });
    }
    // Bullet list
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: line.replace(/^\d+\.\s/, "") } }],
        },
      });
    }
    // Regular paragraph
    else {
      // Split text into chunks of 2000 characters (Notion's limit)
      const chunks = line.match(/.{1,2000}/g) || [];
      for (const chunk of chunks) {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: chunk } }],
          },
        });
      }
    }
  }

  return blocks;
}

export async function createNotionPage(args: {
  parent_page_id: string;
  title: string;
  content: string;
  properties?: any;
}): Promise<{
  success: boolean;
  page_id: string;
  page_url: string;
  message: string;
}> {
  const { parent_page_id, title, content, properties } = args;

  try {
    const notion = getNotionClient();

    const blocks = markdownToNotionBlocks(content);

    // Create the page
    const response = await notion.pages.create({
      parent: { page_id: parent_page_id },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        ...properties,
      },
      children: blocks.slice(0, 100), // Notion limits initial children to 100
    });

    // If there are more than 100 blocks, append them
    if (blocks.length > 100) {
      const remainingBlocks = blocks.slice(100);
      for (let i = 0; i < remainingBlocks.length; i += 100) {
        await notion.blocks.children.append({
          block_id: response.id,
          children: remainingBlocks.slice(i, i + 100),
        });
      }
    }

    return {
      success: true,
      page_id: response.id,
      page_url: response.url,
      message: `Notion page created successfully: ${title}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to create Notion page: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function appendNotionContent(args: {
  page_id: string;
  content: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const { page_id, content } = args;

  try {
    const notion = getNotionClient();

    const blocks = markdownToNotionBlocks(content);

    // Append blocks in batches of 100
    for (let i = 0; i < blocks.length; i += 100) {
      await notion.blocks.children.append({
        block_id: page_id,
        children: blocks.slice(i, i + 100),
      });
    }

    return {
      success: true,
      message: "Content appended to Notion page successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to append content to Notion: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
