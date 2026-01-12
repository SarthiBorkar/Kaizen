import { db } from './client.js';

// User queries
export async function createUser(telegramId: number, username: string | undefined, firstName: string | undefined) {
  return await db.execute({
    sql: `INSERT INTO users (telegram_id, username, first_name)
          VALUES (?, ?, ?)
          ON CONFLICT(telegram_id) DO UPDATE SET
          username = excluded.username,
          first_name = excluded.first_name,
          updated_at = datetime('now')
          RETURNING *`,
    args: [telegramId, username || null, firstName || null],
  });
}

export async function getUser(telegramId: number) {
  return await db.execute({
    sql: 'SELECT * FROM users WHERE telegram_id = ?',
    args: [telegramId],
  });
}

export async function updateUserCommitment(telegramId: number, commitment: string) {
  return await db.execute({
    sql: `UPDATE users SET commitment = ?, updated_at = datetime('now')
          WHERE telegram_id = ?`,
    args: [commitment, telegramId],
  });
}

export async function updateReminderTime(telegramId: number, hour: number) {
  return await db.execute({
    sql: `UPDATE users SET reminder_hour = ?, updated_at = datetime('now')
          WHERE telegram_id = ?`,
    args: [hour, telegramId],
  });
}

// Group queries
export async function createGroup(chatId: number, name: string, createdBy: number, inviteCode: string) {
  return await db.execute({
    sql: `INSERT INTO groups (telegram_chat_id, name, created_by, invite_code)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [chatId, name, createdBy, inviteCode],
  });
}

export async function getGroup(chatId: number) {
  return await db.execute({
    sql: 'SELECT * FROM groups WHERE telegram_chat_id = ?',
    args: [chatId],
  });
}

export async function getGroupByInviteCode(inviteCode: string) {
  return await db.execute({
    sql: 'SELECT * FROM groups WHERE invite_code = ?',
    args: [inviteCode],
  });
}

// Membership queries
export async function addMembership(userId: number, groupId: number) {
  return await db.execute({
    sql: `INSERT INTO memberships (user_id, group_id)
          VALUES (?, ?)
          ON CONFLICT(user_id, group_id) DO NOTHING
          RETURNING *`,
    args: [userId, groupId],
  });
}

export async function getUserGroups(userId: number) {
  return await db.execute({
    sql: `SELECT g.* FROM groups g
          JOIN memberships m ON g.id = m.group_id
          WHERE m.user_id = ?`,
    args: [userId],
  });
}

export async function getGroupMembers(groupId: number) {
  return await db.execute({
    sql: `SELECT u.* FROM users u
          JOIN memberships m ON u.id = m.user_id
          WHERE m.group_id = ?`,
    args: [groupId],
  });
}

// Check-in queries
export async function createCheckin(userId: number, groupId: number, checkDate: string, completed: boolean) {
  return await db.execute({
    sql: `INSERT INTO checkins (user_id, group_id, check_date, completed)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, group_id, check_date) DO UPDATE SET
          completed = excluded.completed,
          checked_in_at = datetime('now')
          RETURNING *`,
    args: [userId, groupId, checkDate, completed],
  });
}

export async function getUserCheckins(userId: number, groupId: number, days: number = 7) {
  return await db.execute({
    sql: `SELECT * FROM checkins
          WHERE user_id = ? AND group_id = ?
          AND check_date >= date('now', '-' || ? || ' days')
          ORDER BY check_date DESC`,
    args: [userId, groupId, days],
  });
}

export async function getGroupCheckinsToday(groupId: number) {
  return await db.execute({
    sql: `SELECT c.*, u.first_name, u.username
          FROM checkins c
          JOIN users u ON c.user_id = u.id
          WHERE c.group_id = ? AND c.check_date = date('now')
          ORDER BY c.checked_in_at DESC`,
    args: [groupId],
  });
}

export async function getUserStats(userId: number, groupId: number) {
  const result = await db.execute({
    sql: `SELECT
            COUNT(*) as total_days,
            SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_days,
            MAX(check_date) as last_checkin
          FROM checkins
          WHERE user_id = ? AND group_id = ?`,
    args: [userId, groupId],
  });

  return result.rows[0];
}
