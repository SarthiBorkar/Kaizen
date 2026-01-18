import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory if it doesn't exist
const OUTPUT_DIR = path.join(process.cwd(), "output", "documents");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export async function createDocument(args: {
  title: string;
  content: string;
  format?: "markdown" | "txt" | "html";
}): Promise<{ success: boolean; file_path: string; message: string }> {
  const { title, content, format = "markdown" } = args;
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const extension = format === "html" ? "html" : format === "txt" ? "txt" : "md";
  const fileName = `${sanitizedTitle}_${Date.now()}.${extension}`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    let fileContent = content;

    if (format === "html") {
      fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content.split("\n").map((line) => `<p>${line}</p>`).join("\n")}
</body>
</html>`;
    } else if (format === "markdown") {
      fileContent = `# ${title}\n\n${content}`;
    }

    fs.writeFileSync(filePath, fileContent, "utf-8");

    return {
      success: true,
      file_path: filePath,
      message: `Document created successfully: ${fileName}`,
    };
  } catch (error) {
    throw new Error(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createPDF(args: {
  title: string;
  content: string;
  metadata?: { author?: string; subject?: string; keywords?: string };
}): Promise<{ success: boolean; file_path: string; message: string }> {
  const { title, content, metadata } = args;
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const fileName = `${sanitizedTitle}_${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        info: {
          Title: title,
          Author: metadata?.author || "Kaizen Bot",
          Subject: metadata?.subject,
          Keywords: metadata?.keywords,
        },
      });

      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Add title
      doc.fontSize(24).text(title, { align: "center" });
      doc.moveDown();

      // Add content
      doc.fontSize(12).text(content, {
        align: "left",
        lineGap: 5,
      });

      doc.end();

      stream.on("finish", () => {
        resolve({
          success: true,
          file_path: filePath,
          message: `PDF created successfully: ${fileName}`,
        });
      });

      stream.on("error", (error) => {
        reject(new Error(`Failed to create PDF: ${error.message}`));
      });
    } catch (error) {
      reject(
        new Error(`Failed to create PDF: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  });
}

export async function researchTopic(args: {
  topic: string;
  depth?: "brief" | "moderate" | "comprehensive";
  output_format?: "markdown" | "pdf";
  include_sources?: boolean;
}): Promise<{ success: boolean; file_path: string; content: string; message: string }> {
  const { topic, depth = "moderate", output_format = "markdown", include_sources = true } = args;

  // This is a placeholder implementation. In a real scenario, this would:
  // 1. Use web scraping to gather information
  // 2. Use AI to summarize and organize the information
  // 3. Create a structured document

  const sections = {
    brief: ["Overview", "Key Points"],
    moderate: ["Overview", "Key Points", "Details", "Examples"],
    comprehensive: ["Overview", "Background", "Key Points", "Detailed Analysis", "Examples", "Future Outlook"],
  };

  const sectionList = sections[depth];

  let content = `# Research: ${topic}\n\n`;
  content += `*Research Level: ${depth}*\n`;
  content += `*Generated: ${new Date().toISOString()}*\n\n`;

  content += `---\n\n`;

  for (const section of sectionList) {
    content += `## ${section}\n\n`;
    content += `[This section would contain researched information about ${topic} related to ${section.toLowerCase()}]\n\n`;
  }

  if (include_sources) {
    content += `## Sources\n\n`;
    content += `1. [Example source would be listed here]\n`;
    content += `2. [Additional sources would be added]\n\n`;
  }

  content += `---\n\n`;
  content += `*Note: This is a structured research template. In production, this would be populated with actual researched content.*\n`;

  let result;

  if (output_format === "pdf") {
    result = await createPDF({ title: `Research: ${topic}`, content });
  } else {
    result = await createDocument({ title: `Research: ${topic}`, content, format: "markdown" });
  }

  return {
    ...result,
    content,
  };
}
