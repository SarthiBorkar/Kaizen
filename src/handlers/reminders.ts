import cron from 'node-cron';
import { Bot } from 'grammy';
import { db } from '../db/client.js';
import { CHECKIN_PROMPT } from '../utils/messages.js';
import { checkinKeyboard } from '../utils/keyboards.js';
import { getTodayDate } from '../utils/dates.js';
import { resetWeeklyFreezes } from '../db/queries.js';
import { sendWeeklyReports } from '../commands/report.js';

// Schedule reminders for each hour (8am, 6pm, 8pm, 10pm)
export function scheduleReminders(bot: Bot) {
  // 8:00 AM (08:00)
  cron.schedule('0 8 * * *', () => sendReminders(bot, 8));

  // 6:00 PM (18:00)
  cron.schedule('0 18 * * *', () => sendReminders(bot, 18));

  // 8:00 PM (20:00)
  cron.schedule('0 20 * * *', () => sendReminders(bot, 20));

  // 10:00 PM (22:00)
  cron.schedule('0 22 * * *', () => sendReminders(bot, 22));

  // Reset streak freezes daily at midnight (checks for 7+ day old resets)
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await resetWeeklyFreezes();
      console.log(`❄️ Reset ${result.rowsAffected} weekly streak freezes`);
    } catch (error) {
      console.error('Error resetting weekly freezes:', error);
    }
  });

  // Send weekly reports every Sunday at 8:00 PM
  cron.schedule('0 20 * * 0', async () => {
    try {
      console.log('📊 Sending weekly reports...');
      await sendWeeklyReports(bot);
    } catch (error) {
      console.error('Error sending weekly reports:', error);
    }
  });

  console.log('✅ Reminder scheduler initialized');
  console.log('✅ Streak freeze reset scheduler initialized');
  console.log('✅ Weekly report scheduler initialized (Sundays at 8 PM)');
}

async function sendReminders(bot: Bot, hour: number) {
  const today = getTodayDate();

  try {
    // Get users with groups who haven't checked in
    const usersWithGroups = await db.execute({
      sql: `SELECT DISTINCT u.telegram_id, u.id as user_id, u.first_name
            FROM users u
            JOIN memberships m ON u.id = m.user_id
            WHERE u.reminder_hour = ?`,
      args: [hour],
    });

    console.log(`⏰ Sending ${usersWithGroups.rows.length} reminders for ${hour}:00`);

    // Send reminder to each user with their groups
    for (const userRow of usersWithGroups.rows) {
      try {
        const userId = userRow.user_id as number;
        const telegramId = userRow.telegram_id as number;
        const firstName = userRow.first_name as string;

        // Get user's tasks
        const { getUserTasks } = await import('../db/queries.js');
        const tasksResult = await getUserTasks(userId);

        if (tasksResult.rows.length === 0) {
          // No tasks, skip
          continue;
        }

        // Get groups where user hasn't checked in today
        const groupsResult = await db.execute({
          sql: `SELECT g.id, g.name, g.telegram_chat_id
                FROM groups g
                JOIN memberships m ON g.id = m.group_id
                WHERE m.user_id = ?
                AND NOT EXISTS (
                  SELECT 1 FROM checkins c
                  WHERE c.user_id = ?
                  AND c.group_id = g.id
                  AND c.check_date = ?
                )`,
          args: [userId, userId, today],
        });

        if (groupsResult.rows.length === 0) {
          // Already checked in everywhere
          continue;
        }

        // Create task list
        const taskList = tasksResult.rows
          .map((task: any, idx: number) => `${idx + 1}. ${task.task_name}`)
          .join('\n');

        // Send reminder with first group's keyboard (user can select group during checkin)
        const firstGroup = groupsResult.rows[0];

        await bot.api.sendMessage(
          telegramId,
          `⏰ **Daily Check-in Reminder**\n\n` +
          `Hey ${firstName}! Time for your daily check-in.\n\n` +
          `**Your tasks:**\n${taskList}\n\n` +
          `Have you completed your tasks today?`,
          {
            parse_mode: 'Markdown',
            reply_markup: checkinKeyboard(firstGroup.id as number),
          }
        );
      } catch (error) {
        console.error(`Failed to send reminder to user ${userRow.telegram_id}:`, error);
      }
    }

    // Also send reminders to users without groups (they still need to be reminded)
    const usersWithoutGroups = await db.execute({
      sql: `SELECT u.telegram_id, u.id as user_id, u.first_name
            FROM users u
            WHERE u.reminder_hour = ?
            AND NOT EXISTS (
              SELECT 1 FROM memberships m WHERE m.user_id = u.id
            )`,
      args: [hour],
    });

    console.log(`⏰ Sending ${usersWithoutGroups.rows.length} reminders to users without groups`);

    for (const userRow of usersWithoutGroups.rows) {
      try {
        const userId = userRow.user_id as number;
        const telegramId = userRow.telegram_id as number;
        const firstName = userRow.first_name as string;

        // Get user's tasks
        const { getUserTasks } = await import('../db/queries.js');
        const tasksResult = await getUserTasks(userId);

        if (tasksResult.rows.length === 0) {
          continue;
        }

        const taskList = tasksResult.rows
          .map((task: any, idx: number) => `${idx + 1}. ${task.task_name}`)
          .join('\n');

        await bot.api.sendMessage(
          telegramId,
          `⏰ **Daily Check-in Reminder**\n\n` +
          `Hey ${firstName}! Time for your daily tasks.\n\n` +
          `**Your tasks:**\n${taskList}\n\n` +
          `💡 *Tip: Add me to a Telegram group with friends for accountability!*\n` +
          `Use /checkin to track your progress.`,
          {
            parse_mode: 'Markdown',
          }
        );
      } catch (error) {
        console.error(`Failed to send reminder to user ${userRow.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}

// Immediate reminder for testing
export async function sendTestReminder(bot: any, telegramId: number) {
  try {
    // Get user info
    const userResult = await db.execute({
      sql: `SELECT u.id, u.first_name FROM users WHERE u.telegram_id = ?`,
      args: [telegramId],
    });

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const userId = user.id as number;
    const firstName = user.first_name as string;

    // Get user's tasks
    const { getUserTasks } = await import('../db/queries.js');
    const tasksResult = await getUserTasks(userId);

    if (tasksResult.rows.length === 0) {
      throw new Error('No tasks found');
    }

    const taskList = tasksResult.rows
      .map((task: any, idx: number) => `${idx + 1}. ${task.task_name}`)
      .join('\n');

    // Check if user has groups
    const groupsResult = await db.execute({
      sql: `SELECT g.id FROM groups g
            JOIN memberships m ON g.id = m.group_id
            WHERE m.user_id = ?
            LIMIT 1`,
      args: [userId],
    });

    if (groupsResult.rows.length > 0) {
      // User has groups
      const groupId = groupsResult.rows[0].id as number;
      await bot.sendMessage(
        telegramId,
        `⏰ **Test Reminder**\n\n` +
        `Hey ${firstName}! This is a test of your daily reminder.\n\n` +
        `**Your tasks:**\n${taskList}\n\n` +
        `Have you completed your tasks today?`,
        {
          parse_mode: 'Markdown',
          reply_markup: checkinKeyboard(groupId),
        }
      );
    } else {
      // User without groups
      await bot.sendMessage(
        telegramId,
        `⏰ **Test Reminder**\n\n` +
        `Hey ${firstName}! This is a test of your daily reminder.\n\n` +
        `**Your tasks:**\n${taskList}\n\n` +
        `💡 *Tip: Add me to a Telegram group with friends for accountability!*\n` +
        `Use /checkin to track your progress.`,
        {
          parse_mode: 'Markdown',
        }
      );
    }

    console.log(`📬 Test reminder sent to ${telegramId}`);
  } catch (error) {
    console.error('Error sending test reminder:', error);
    throw error;
  }
}
