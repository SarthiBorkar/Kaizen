import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// Validate required environment variables
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  // Telegram Bot Token from @BotFather
  botToken: getEnvVar('BOT_TOKEN'),

  // Turso Database credentials
  tursoUrl: getEnvVar('TURSO_DATABASE_URL'),
  tursoToken: getEnvVar('TURSO_AUTH_TOKEN'),

  // Bot configuration
  botName: 'Kaizen',
  defaultReminderHour: 20, // 8 PM
  defaultTimezone: 'Europe/Berlin',
} as const;
