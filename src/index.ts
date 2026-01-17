import { Bot } from 'grammy';
import { config } from './config.js';
import { testConnection } from './db/client.js';
import { startCommand, handleOnboardingMessage } from './commands/start.js';
import { checkinCommand } from './commands/checkin-new.js';
import { addTaskCommand, removeTaskCommand, handleAddTaskMessage } from './commands/tasks.js';
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
import {
  automationCommand,
  researchCommand,
  scrapeCommand,
  calendarCommand,
  handleAutomationCallback,
  handleAutomationMessage,
  handleResearchDepthCallback
} from './commands/automation.js';
import { askCommand, deepResearchCommand, clearAICommand, handleAITextMessage } from './commands/ai.js';
import { handleVoiceMessage } from './handlers/voice.js';

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
  { command: 'checkin', description: 'Daily task check-in' },
  { command: 'view', description: 'Monthly calendar & streaks' },
  { command: 'stats', description: 'Your rank & statistics' },
  { command: 'addtask', description: 'Add a new task' },
  { command: 'removetask', description: 'Remove a task' },
  { command: 'groups', description: 'See your accountability groups' },
  { command: 'quote', description: 'Daily Japanese wisdom' },
  { command: 'ask', description: '🤖 Ask AI anything' },
  { command: 'dr', description: '🔬 Deep research with sources' },
  { command: 'automate', description: '⚙️ Automation & workflow hub' },
  { command: 'research', description: '📚 Research a topic' },
  { command: 'scrape', description: '🌐 Scrape web content' },
  { command: 'calendar', description: '📅 Manage Google Calendar' },
  { command: 'menu', description: 'Show main menu' },
  { command: 'help', description: 'Show all commands' },
]);

console.log('✅ Bot commands registered');

// Commands
bot.command('start', startCommand);
bot.command('checkin', checkinCommand);
bot.command('addtask', addTaskCommand);
bot.command('removetask', removeTaskCommand);
bot.command('view', viewCommand);
bot.command('stats', statsCommand);
bot.command('quote', quoteCommand);
bot.command('help', helpCommand);
bot.command('menu', menuCommand);
bot.command('groups', groupsCommand);
bot.command('today', todayCommand);
bot.command('leaderboard', leaderboardCommand);

// Automation commands
bot.command('automate', automationCommand);
bot.command('research', researchCommand);
bot.command('scrape', scrapeCommand);
bot.command('calendar', calendarCommand);

// AI commands
bot.command('ask', askCommand);
bot.command('deepresearch', deepResearchCommand);
bot.command('dr', deepResearchCommand); // Alias for deepresearch
bot.command('clearai', clearAICommand);

// Callback queries (inline button clicks)
bot.on('callback_query:data', handleCallbackQuery);

// Group management - when bot is added/removed from group
bot.on('my_chat_member', handleGroupAdd);

// Voice and audio messages
bot.on('message:voice', handleVoiceMessage);
bot.on('message:audio', handleVoiceMessage);

// Handle text messages (for onboarding flow & task addition & automation & AI)
bot.on('message:text', async (ctx) => {
  // Check if this is part of onboarding flow
  const onboardingHandled = await handleOnboardingMessage(ctx);
  if (onboardingHandled) return;

  // Check if this is part of task addition flow
  const taskAddHandled = await handleAddTaskMessage(ctx);
  if (taskAddHandled) return;

  // Check if this is part of automation flow
  await handleAutomationMessage(ctx);

  // Check if this should be handled by AI
  const aiHandled = await handleAITextMessage(ctx);
  if (aiHandled) return;

  // If not handled by any flow, ignore
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
console.log('  /checkin - Daily task check-in');
console.log('  /addtask - Add a new task');
console.log('  /removetask - Remove a task');
console.log('  /view - Monthly calendar & streaks');
console.log('  /stats - Rank card & statistics');
console.log('  /quote - Daily Japanese wisdom 🌸');
console.log('  /automate - 🤖 Automation & workflow hub');
console.log('  /research - 📚 Research a topic');
console.log('  /scrape - 🌐 Scrape web content');
console.log('  /calendar - 📅 Manage Google Calendar');
console.log('  /menu - Show main menu buttons');
console.log('  /help - Show help message');
console.log('');
console.log('⏰ Reminders scheduled for: 8am, 6pm, 8pm, 10pm');

bot.start();
