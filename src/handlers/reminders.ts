import cron from 'node-cron';
import { Bot } from 'grammy';
import { db } from '../db/client.js';
import { CHECKIN_PROMPT } from '../utils/messages.js';
import { checkinKeyboard } from '../utils/keyboards.js';
import { getTodayDate } from '../utils/dates.js';

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

  console.log('✅ Reminder scheduler initialized');
}

async function sendReminders(bot: Bot, hour: number) {
  const today = getTodayDate();

  try {
    // Get all users with this reminder hour
    const result = await db.execute({
      sql: `SELECT u.telegram_id, u.commitment, m.group_id
            FROM users u
            JOIN memberships m ON u.id = m.user_id
            WHERE u.reminder_hour = ?
            AND NOT EXISTS (
              SELECT 1 FROM checkins c
              WHERE c.user_id = u.id
              AND c.group_id = m.group_id
              AND c.check_date = ?
            )`,
      args: [hour, today],
    });

    console.log(`⏰ Sending ${result.rows.length} reminders for ${hour}:00`);

    // Send reminder to each user
    for (const row of result.rows) {
      try {
        await bot.api.sendMessage(
          row.telegram_id as number,
          CHECKIN_PROMPT(row.commitment as string),
          {
            reply_markup: checkinKeyboard(row.group_id as number),
          }
        );
      } catch (error) {
        console.error(`Failed to send reminder to user ${row.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}

// Immediate reminder for testing (don't use in production)
export async function sendTestReminder(bot: Bot, telegramId: number) {
  try {
    const result = await db.execute({
      sql: `SELECT u.commitment, m.group_id
            FROM users u
            JOIN memberships m ON u.id = m.user_id
            WHERE u.telegram_id = ?
            LIMIT 1`,
      args: [telegramId],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      await bot.api.sendMessage(
        telegramId,
        CHECKIN_PROMPT(row.commitment as string),
        {
          reply_markup: checkinKeyboard(row.group_id as number),
        }
      );
      console.log(`📬 Test reminder sent to ${telegramId}`);
    }
  } catch (error) {
    console.error('Error sending test reminder:', error);
  }
}
