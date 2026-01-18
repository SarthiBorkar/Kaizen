import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const googleCalendarTools: Tool[] = [
  {
    name: "create_calendar_event",
    description:
      "Create a new event in Google Calendar. Can be used for appointments, reminders, or any scheduled activity.",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "The title/summary of the event",
        },
        description: {
          type: "string",
          description: "Optional detailed description of the event",
        },
        start_time: {
          type: "string",
          description: "Start time in ISO 8601 format (e.g., '2024-03-20T10:00:00-07:00')",
        },
        end_time: {
          type: "string",
          description: "End time in ISO 8601 format",
        },
        location: {
          type: "string",
          description: "Optional location of the event",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of attendee email addresses",
        },
        reminders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              method: { type: "string", enum: ["email", "popup"] },
              minutes: { type: "number" },
            },
          },
          description: "Optional reminders for the event",
        },
      },
      required: ["summary", "start_time", "end_time"],
    },
  },
  {
    name: "list_calendar_events",
    description:
      "List upcoming events from Google Calendar within a specified time range.",
    inputSchema: {
      type: "object",
      properties: {
        time_min: {
          type: "string",
          description: "Start of time range in ISO 8601 format (defaults to now)",
        },
        time_max: {
          type: "string",
          description: "End of time range in ISO 8601 format (defaults to 7 days from now)",
        },
        max_results: {
          type: "number",
          description: "Maximum number of events to return (default: 10)",
          default: 10,
        },
      },
    },
  },
  {
    name: "update_calendar_event",
    description:
      "Update an existing calendar event.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: "The ID of the event to update",
        },
        updates: {
          type: "object",
          properties: {
            summary: { type: "string" },
            description: { type: "string" },
            start_time: { type: "string" },
            end_time: { type: "string" },
            location: { type: "string" },
          },
          description: "Fields to update",
        },
      },
      required: ["event_id", "updates"],
    },
  },
];
