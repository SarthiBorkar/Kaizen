import { createDocument, createPDF, researchTopic } from "./document-handler.js";
import { scrapeWeb, extractContent } from "./web-scraper-handler.js";
import { createNotionPage, appendNotionContent } from "./notion-handler.js";
import { uploadToDrive, createDriveFolder } from "./google-drive-handler.js";
import { createObsidianNote, updateObsidianNote } from "./obsidian-handler.js";
import {
  createCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from "./google-calendar-handler.js";

interface WorkflowStep {
  tool: string;
  arguments: any;
  depends_on?: string[];
}

interface WorkflowResult {
  step_id: string;
  tool: string;
  success: boolean;
  result: any;
  error?: string;
}

const toolHandlers: { [key: string]: Function } = {
  create_document: createDocument,
  create_pdf: createPDF,
  research_topic: researchTopic,
  scrape_web: scrapeWeb,
  extract_content: extractContent,
  create_notion_page: createNotionPage,
  append_notion_content: appendNotionContent,
  upload_to_drive: uploadToDrive,
  create_drive_folder: createDriveFolder,
  create_obsidian_note: createObsidianNote,
  update_obsidian_note: updateObsidianNote,
  create_calendar_event: createCalendarEvent,
  list_calendar_events: listCalendarEvents,
  update_calendar_event: updateCalendarEvent,
};

export async function orchestrateWorkflow(args: {
  workflow_name: string;
  steps: WorkflowStep[];
}): Promise<{
  success: boolean;
  workflow_name: string;
  results: WorkflowResult[];
  message: string;
}> {
  const { workflow_name, steps } = args;
  const results: WorkflowResult[] = [];
  const stepOutputs = new Map<string, any>();

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepId = `step_${i + 1}`;

      try {
        // Check dependencies
        if (step.depends_on && step.depends_on.length > 0) {
          for (const depId of step.depends_on) {
            if (!stepOutputs.has(depId)) {
              throw new Error(`Dependency ${depId} not found or failed`);
            }
          }
        }

        // Get the tool handler
        const handler = toolHandlers[step.tool];
        if (!handler) {
          throw new Error(`Unknown tool: ${step.tool}`);
        }

        // Replace placeholders in arguments with previous step outputs
        const processedArgs = processArguments(step.arguments, stepOutputs);

        // Execute the tool
        const result = await handler(processedArgs);

        // Store the result
        stepOutputs.set(stepId, result);

        results.push({
          step_id: stepId,
          tool: step.tool,
          success: true,
          result,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        results.push({
          step_id: stepId,
          tool: step.tool,
          success: false,
          result: null,
          error: errorMessage,
        });

        // Stop workflow on error
        throw new Error(`Workflow failed at ${stepId}: ${errorMessage}`);
      }
    }

    return {
      success: true,
      workflow_name,
      results,
      message: `Workflow "${workflow_name}" completed successfully with ${steps.length} steps`,
    };
  } catch (error) {
    return {
      success: false,
      workflow_name,
      results,
      message: `Workflow "${workflow_name}" failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function processArguments(args: any, stepOutputs: Map<string, any>): any {
  if (typeof args !== "object" || args === null) {
    return args;
  }

  if (Array.isArray(args)) {
    return args.map((item) => processArguments(item, stepOutputs));
  }

  const processed: any = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
      // This is a placeholder like {{step_1.file_path}}
      const path = value.slice(2, -2).split(".");
      const stepId = path[0];
      const stepOutput = stepOutputs.get(stepId);

      if (stepOutput) {
        let result = stepOutput;
        for (let i = 1; i < path.length; i++) {
          result = result[path[i]];
        }
        processed[key] = result;
      } else {
        processed[key] = value;
      }
    } else if (typeof value === "object") {
      processed[key] = processArguments(value, stepOutputs);
    } else {
      processed[key] = value;
    }
  }

  return processed;
}

interface Automation {
  automation_name: string;
  trigger: {
    type: "manual" | "schedule" | "event";
    schedule?: string;
  };
  actions: Array<{
    tool: string;
    arguments: any;
  }>;
}

const automations = new Map<string, Automation>();

export async function createAutomation(args: Automation): Promise<{
  success: boolean;
  automation_id: string;
  message: string;
}> {
  const { automation_name, trigger, actions } = args;

  try {
    const automationId = `automation_${Date.now()}`;

    // Store the automation
    automations.set(automationId, {
      automation_name,
      trigger,
      actions,
    });

    // If it's a scheduled automation, you would set up a cron job here
    // For now, we'll just store it and allow manual triggering

    return {
      success: true,
      automation_id: automationId,
      message: `Automation "${automation_name}" created successfully. ID: ${automationId}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to create automation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function runAutomation(automationId: string): Promise<{
  success: boolean;
  results: any[];
  message: string;
}> {
  const automation = automations.get(automationId);

  if (!automation) {
    throw new Error(`Automation not found: ${automationId}`);
  }

  const results = [];

  for (const action of automation.actions) {
    const handler = toolHandlers[action.tool];
    if (!handler) {
      throw new Error(`Unknown tool in automation: ${action.tool}`);
    }

    try {
      const result = await handler(action.arguments);
      results.push({ tool: action.tool, success: true, result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ tool: action.tool, success: false, error: errorMessage });
    }
  }

  return {
    success: true,
    results,
    message: `Automation "${automation.automation_name}" executed successfully`,
  };
}
