import { Bot } from 'grammy';
import { config } from './config.js';
import { testConnection } from './db/client.js';
import { startCommand, handleOnboardingMessage } from './commands/start.js';
import { checkinCommand } from './commands/checkin.js';
import { viewCommand } from './commands/view.js';
import { statsCommand } from './commands/stats.js';
import { quoteCommand } from './commands/quote.js';
import { helpCommand, menuCommand } from './commands/help.js';
import { groupsCommand } from './commands/groups.js';
import { todayCommand } from './commands/today.js';
import { leaderboardCommand } from './commands/leaderboard.js';
import { handleCallbackQuery } from './handlers/callbacks.js';
import { scheduleReminders } from './handlers/reminders.js';
import { handleGroupAdd } from './handlers/groups.js';

// Initialize bot
const bot = new Bot(config.botToken);

console.log('🤖 Kaizen Bot starting...');

// Test database connection
const dbConnected = await testConnection();
if (!dbConnected) {
  console.error('Failed to connect to database. Exiting...');
  process.exit(1);
}

// Set up bot commands (shows in Telegram menu)
await bot.api.setMyCommands([
  { command: 'start', description: 'Begin your Kaizen journey' },
  { command: 'checkin', description: 'Daily check-in (4 levels)' },
  { command: 'view', description: 'Monthly calendar & streaks' },
  { command: 'stats', description: 'Your rank & statistics' },
  { command: 'groups', description: 'See your accountability groups' },
  { command: 'quote', description: 'Daily Japanese wisdom' },
  { command: 'menu', description: 'Show main menu' },
  { command: 'help', description: 'Show all commands' },
]);

console.log('✅ Bot commands registered');

// Commands
bot.command('start', startCommand);
bot.command('checkin', checkinCommand);
bot.command('view', viewCommand);
bot.command('stats', statsCommand);
bot.command('quote', quoteCommand);
bot.command('help', helpCommand);
bot.command('menu', menuCommand);
bot.command('groups', groupsCommand);
bot.command('today', todayCommand);
bot.command('leaderboard', leaderboardCommand);

// Callback queries (inline button clicks)
bot.on('callback_query:data', handleCallbackQuery);

// Group management - when bot is added/removed from group
bot.on('my_chat_member', handleGroupAdd);

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
console.log('  /checkin - Daily check-in (4 levels)');
console.log('  /view - Monthly calendar & streaks');
console.log('  /stats - Rank card & statistics');
console.log('  /quote - Daily Japanese wisdom 🌸');
console.log('  /menu - Show main menu buttons');
console.log('  /help - Show help message');
console.log('');
console.log('⏰ Reminders scheduled for: 8am, 6pm, 8pm, 10pm');

bot.start();
