import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const workflowTools: Tool[] = [
  {
    name: "orchestrate_workflow",
    description:
      "Orchestrate a complex workflow by chaining multiple tools together. For example: research a topic, create a document, and save it to Notion and Google Drive.",
    inputSchema: {
      type: "object",
      properties: {
        workflow_name: {
          type: "string",
          description: "A descriptive name for this workflow",
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tool: { type: "string", description: "The tool to execute" },
              arguments: { type: "object", description: "Arguments for the tool" },
              depends_on: {
                type: "array",
                items: { type: "string" },
                description: "IDs of previous steps this step depends on",
              },
            },
          },
          description: "Sequential steps to execute in the workflow",
        },
      },
      required: ["workflow_name", "steps"],
    },
  },
  {
    name: "create_automation",
    description:
      "Create a reusable automation that can be triggered on-demand or on a schedule. Examples: daily summary, weekly research digest, etc.",
    inputSchema: {
      type: "object",
      properties: {
        automation_name: {
          type: "string",
          description: "Name for this automation",
        },
        trigger: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["manual", "schedule", "event"],
              description: "How the automation is triggered",
            },
            schedule: {
              type: "string",
              description: "Cron expression for scheduled automations",
            },
          },
          description: "Trigger configuration",
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tool: { type: "string" },
              arguments: { type: "object" },
            },
          },
          description: "Actions to perform when triggered",
        },
      },
      required: ["automation_name", "trigger", "actions"],
    },
  },
];
