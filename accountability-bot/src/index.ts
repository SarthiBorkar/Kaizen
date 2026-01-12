import { Bot } from 'grammy';
import { config } from './config.js';
import { testConnection } from './db/client.js';
import { startCommand, handleOnboardingMessage } from './commands/start.js';
import { checkinCommand } from './commands/checkin.js';
import { viewCommand } from './commands/view.js';
import { statsCommand } from './commands/stats.js';
import { handleCallbackQuery } from './handlers/callbacks.js';
import { scheduleReminders } from './handlers/reminders.js';

// Initialize bot
const bot = new Bot(config.botToken);

console.log('🤖 Kaizen Bot starting...');

// Test database connection
const dbConnected = await testConnection();
if (!dbConnected) {
  console.error('Failed to connect to database. Exiting...');
  process.exit(1);
}

// Commands
bot.command('start', startCommand);
bot.command('checkin', checkinCommand);
bot.command('view', viewCommand);
bot.command('stats', statsCommand);

// Callback queries (inline button clicks)
bot.on('callback_query:data', handleCallbackQuery);

// Handle text messages (for onboarding flow)
bot.on('message:text', async (ctx) => {
  // Check if this is part of onboarding flow
  const handled = await handleOnboardingMessage(ctx);

  // If not handled by onboarding, ignore (or add other text handlers here)
  if (!handled) {
    // Could add a help message here if needed
  }
});

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  console.error('Error:', e);
});

// Schedule reminders
scheduleReminders(bot);

// Start bot
console.log('✅ Kaizen Bot is running!');
console.log('📝 Available commands:');
console.log('  /start - Begin onboarding');
console.log('  /checkin - Daily check-in');
console.log('  /view - View your progress');
console.log('  /stats - See your statistics');
console.log('');
console.log('⏰ Reminders scheduled for: 8am, 6pm, 8pm, 10pm');

bot.start();
