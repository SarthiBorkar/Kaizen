import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

let calendarClient: any = null;

function getGoogleCalendarClient() {
  if (!calendarClient) {
    const credentials = process.env.GOOGLE_CREDENTIALS;
    if (!credentials) {
      throw new Error("GOOGLE_CREDENTIALS environment variable is not set");
    }

    const auth = new OAuth2Client();
    auth.setCredentials(JSON.parse(credentials));

    calendarClient = google.calendar({ version: "v3", auth });
  }
  return calendarClient;
}

export async function createCalendarEvent(args: {
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  reminders?: Array<{ method: "email" | "popup"; minutes: number }>;
}): Promise<{
  success: boolean;
  event_id: string;
  event_link: string;
  message: string;
}> {
  const { summary, description, start_time, end_time, location, attendees, reminders } = args;

  try {
    const calendar = getGoogleCalendarClient();

    const event: any = {
      summary,
      description,
      start: {
        dateTime: start_time,
        timeZone: "UTC",
      },
      end: {
        dateTime: end_time,
        timeZone: "UTC",
      },
    };

    if (location) {
      event.location = location;
    }

    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map((email) => ({ email }));
    }

    if (reminders && reminders.length > 0) {
      event.reminders = {
        useDefault: false,
        overrides: reminders,
      };
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return {
      success: true,
      event_id: response.data.id,
      event_link: response.data.htmlLink || "",
      message: `Calendar event created successfully: ${summary}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to create calendar event: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function listCalendarEvents(args: {
  time_min?: string;
  time_max?: string;
  max_results?: number;
}): Promise<{
  success: boolean;
  events: Array<{
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    description?: string;
  }>;
}> {
  const { time_min, time_max, max_results = 10 } = args;

  try {
    const calendar = getGoogleCalendarClient();

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: time_min || new Date().toISOString(),
      timeMax:
        time_max ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      maxResults: max_results,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items?.map((event: any) => ({
      id: event.id,
      summary: event.summary || "No title",
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      description: event.description,
    })) || [];

    return {
      success: true,
      events,
    };
  } catch (error) {
    throw new Error(
      `Failed to list calendar events: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateCalendarEvent(args: {
  event_id: string;
  updates: {
    summary?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
  };
}): Promise<{
  success: boolean;
  message: string;
}> {
  const { event_id, updates } = args;

  try {
    const calendar = getGoogleCalendarClient();

    // First, get the existing event
    const existingEvent = await calendar.events.get({
      calendarId: "primary",
      eventId: event_id,
    });

    const updatedEvent: any = {
      ...existingEvent.data,
    };

    if (updates.summary) updatedEvent.summary = updates.summary;
    if (updates.description) updatedEvent.description = updates.description;
    if (updates.location) updatedEvent.location = updates.location;
    if (updates.start_time) {
      updatedEvent.start = {
        dateTime: updates.start_time,
        timeZone: "UTC",
      };
    }
    if (updates.end_time) {
      updatedEvent.end = {
        dateTime: updates.end_time,
        timeZone: "UTC",
      };
    }

    await calendar.events.update({
      calendarId: "primary",
      eventId: event_id,
      requestBody: updatedEvent,
    });

    return {
      success: true,
      message: "Calendar event updated successfully",
    };
  } catch (error) {
    throw new Error(
      `Failed to update calendar event: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
