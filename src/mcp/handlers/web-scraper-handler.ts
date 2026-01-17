import axios from "axios";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export async function scrapeWeb(args: {
  url: string;
  selectors?: {
    title?: string;
    content?: string;
    images?: string;
  };
  extract_links?: boolean;
}): Promise<{
  success: boolean;
  data: {
    title?: string;
    content?: string;
    images?: string[];
    links?: string[];
    url: string;
  };
}> {
  const { url, selectors, extract_links = false } = args;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    const data: any = { url };

    // Extract title
    if (selectors?.title) {
      data.title = $(selectors.title).first().text().trim();
    } else {
      data.title = $("title").text().trim() || $("h1").first().text().trim();
    }

    // Extract content
    if (selectors?.content) {
      data.content = $(selectors.content).text().trim();
    } else {
      // Try to find main content
      const contentSelectors = ["article", "main", ".content", "#content", ".post"];
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length) {
          data.content = element.text().trim();
          break;
        }
      }
      if (!data.content) {
        data.content = $("body").text().trim();
      }
    }

    // Extract images
    if (selectors?.images) {
      data.images = $(selectors.images)
        .map((_, el) => $(el).attr("src"))
        .get()
        .filter((src: string) => src);
    } else {
      data.images = $("img")
        .map((_, el) => $(el).attr("src"))
        .get()
        .filter((src: string) => src)
        .slice(0, 10); // Limit to first 10 images
    }

    // Extract links if requested
    if (extract_links) {
      data.links = $("a")
        .map((_, el) => $(el).attr("href"))
        .get()
        .filter((href: string) => href && (href.startsWith("http") || href.startsWith("/")))
        .slice(0, 50); // Limit to first 50 links
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    throw new Error(
      `Failed to scrape web page: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function extractContent(args: {
  url: string;
  format?: "text" | "markdown" | "html";
}): Promise<{
  success: boolean;
  content: string;
  title: string;
  url: string;
}> {
  const { url, format = "markdown" } = args;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $(
      "script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, .comments"
    ).remove();

    const title = $("title").text().trim() || $("h1").first().text().trim();

    let content = "";

    // Try to find main content
    const contentSelectors = ["article", "main", '[role="main"]', ".content", "#content"];
    let mainElement = $("body");

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length) {
        mainElement = element;
        break;
      }
    }

    if (format === "html") {
      content = mainElement.html() || "";
    } else if (format === "markdown") {
      const html = mainElement.html() || "";
      content = turndownService.turndown(html);
    } else {
      content = mainElement.text().trim();
      // Clean up excessive whitespace
      content = content.replace(/\n\s*\n\s*\n/g, "\n\n");
    }

    return {
      success: true,
      content,
      title,
      url,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
