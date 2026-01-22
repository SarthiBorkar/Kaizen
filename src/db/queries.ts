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

// Task queries
export async function createTask(userId: number, taskName: string) {
  return await db.execute({
    sql: `INSERT INTO tasks (user_id, task_name, active)
          VALUES (?, ?, true)
          RETURNING *`,
    args: [userId, taskName],
  });
}

export async function getUserTasks(userId: number, activeOnly: boolean = true) {
  return await db.execute({
    sql: activeOnly
      ? 'SELECT * FROM tasks WHERE user_id = ? AND active = true ORDER BY created_at ASC'
      : 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at ASC',
    args: [userId],
  });
}

export async function getTask(taskId: number) {
  return await db.execute({
    sql: 'SELECT * FROM tasks WHERE id = ?',
    args: [taskId],
  });
}

export async function deactivateTask(taskId: number) {
  return await db.execute({
    sql: `UPDATE tasks SET active = false WHERE id = ?`,
    args: [taskId],
  });
}

export async function deleteTask(taskId: number) {
  return await db.execute({
    sql: 'DELETE FROM tasks WHERE id = ?',
    args: [taskId],
  });
}

export async function createTaskCompletion(taskId: number, checkinId: number, completed: boolean) {
  return await db.execute({
    sql: `INSERT INTO task_completions (task_id, checkin_id, completed)
          VALUES (?, ?, ?)
          ON CONFLICT(task_id, checkin_id) DO UPDATE SET
          completed = excluded.completed
          RETURNING *`,
    args: [taskId, checkinId, completed],
  });
}

export async function getTaskCompletions(checkinId: number) {
  return await db.execute({
    sql: `SELECT tc.*, t.task_name
          FROM task_completions tc
          JOIN tasks t ON tc.task_id = t.id
          WHERE tc.checkin_id = ?`,
    args: [checkinId],
  });
}

export async function getTaskCompletionStats(userId: number, days: number = 30) {
  return await db.execute({
    sql: `SELECT
            t.id,
            t.task_name,
            COUNT(tc.id) as total_checkins,
            SUM(CASE WHEN tc.completed THEN 1 ELSE 0 END) as completed_count
          FROM tasks t
          LEFT JOIN task_completions tc ON t.id = tc.task_id
          LEFT JOIN checkins c ON tc.checkin_id = c.id
          WHERE t.user_id = ? AND t.active = true
          AND (c.check_date IS NULL OR c.check_date >= date('now', '-' || ? || ' days'))
          GROUP BY t.id, t.task_name
          ORDER BY t.created_at ASC`,
    args: [userId, days],
  });
}

// Streak freeze queries
export async function getStreakFreezeStatus(telegramId: number) {
  return await db.execute({
    sql: `SELECT
            streak_freezes_available,
            last_freeze_reset_date,
            freeze_used_on_date
          FROM users
          WHERE telegram_id = ?`,
    args: [telegramId],
  });
}

export async function useStreakFreeze(telegramId: number, freezeDate: string) {
  return await db.execute({
    sql: `UPDATE users
          SET streak_freezes_available = streak_freezes_available - 1,
              freeze_used_on_date = ?,
              updated_at = datetime('now')
          WHERE telegram_id = ?
          AND streak_freezes_available > 0`,
    args: [freezeDate, telegramId],
  });
}

export async function resetWeeklyFreezes() {
  // Reset freezes for users whose last reset was more than 7 days ago
  return await db.execute({
    sql: `UPDATE users
          SET streak_freezes_available = 1,
              last_freeze_reset_date = date('now'),
              freeze_used_on_date = NULL,
              updated_at = datetime('now')
          WHERE date(last_freeze_reset_date) <= date('now', '-7 days')`,
    args: [],
  });
}

// Buddy system queries
export async function createBuddyRequest(userId: number) {
  return await db.execute({
    sql: `INSERT INTO buddy_requests (user_id, status)
          VALUES (?, 'pending')
          RETURNING *`,
    args: [userId],
  });
}

export async function getPendingBuddyRequest(userId: number) {
  return await db.execute({
    sql: `SELECT * FROM buddy_requests
          WHERE user_id = ? AND status = 'pending'
          ORDER BY created_at DESC
          LIMIT 1`,
    args: [userId],
  });
}

export async function cancelBuddyRequest(userId: number) {
  return await db.execute({
    sql: `UPDATE buddy_requests
          SET status = 'cancelled'
          WHERE user_id = ? AND status = 'pending'`,
    args: [userId],
  });
}

export async function findAvailableBuddy(excludeUserId: number) {
  // Find the oldest pending request from a different user
  return await db.execute({
    sql: `SELECT br.*, u.telegram_id, u.first_name, u.username
          FROM buddy_requests br
          JOIN users u ON br.user_id = u.id
          WHERE br.status = 'pending'
          AND br.user_id != ?
          ORDER BY br.created_at ASC
          LIMIT 1`,
    args: [excludeUserId],
  });
}

export async function createBuddyMatch(user1Id: number, user2Id: number) {
  // Ensure user1Id < user2Id for consistent ordering
  const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  return await db.execute({
    sql: `INSERT INTO buddy_matches (user1_id, user2_id, status)
          VALUES (?, ?, 'active')
          RETURNING *`,
    args: [smallerId, largerId],
  });
}

export async function markBuddyRequestsMatched(user1Id: number, user2Id: number) {
  return await db.execute({
    sql: `UPDATE buddy_requests
          SET status = 'matched', matched_at = datetime('now')
          WHERE user_id IN (?, ?) AND status = 'pending'`,
    args: [user1Id, user2Id],
  });
}

export async function getUserBuddy(userId: number) {
  return await db.execute({
    sql: `SELECT
            bm.*,
            CASE
              WHEN bm.user1_id = ? THEN u2.telegram_id
              ELSE u1.telegram_id
            END as buddy_telegram_id,
            CASE
              WHEN bm.user1_id = ? THEN u2.first_name
              ELSE u1.first_name
            END as buddy_first_name,
            CASE
              WHEN bm.user1_id = ? THEN u2.username
              ELSE u1.username
            END as buddy_username,
            CASE
              WHEN bm.user1_id = ? THEN u2.id
              ELSE u1.id
            END as buddy_id
          FROM buddy_matches bm
          JOIN users u1 ON bm.user1_id = u1.id
          JOIN users u2 ON bm.user2_id = u2.id
          WHERE (bm.user1_id = ? OR bm.user2_id = ?)
          AND bm.status = 'active'
          LIMIT 1`,
    args: [userId, userId, userId, userId, userId, userId],
  });
}

export async function endBuddyMatch(userId: number) {
  return await db.execute({
    sql: `UPDATE buddy_matches
          SET status = 'ended', ended_at = datetime('now')
          WHERE (user1_id = ? OR user2_id = ?)
          AND status = 'active'`,
    args: [userId, userId],
  });
}

// Reminder queries
export async function createReminder(
  userId: number,
  telegramId: number,
  title: string,
  reminderTime: string,
  description?: string,
  calendarEventId?: string
) {
  return await db.execute({
    sql: `INSERT INTO reminders (user_id, telegram_id, title, description, reminder_time, calendar_event_id)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [userId, telegramId, title, description || null, reminderTime, calendarEventId || null],
  });
}

export async function getPendingReminders(beforeTime: string) {
  return await db.execute({
    sql: `SELECT * FROM reminders
          WHERE is_sent = FALSE
          AND reminder_time <= ?
          ORDER BY reminder_time ASC`,
    args: [beforeTime],
  });
}

export async function getUserReminders(userId: number, includeCompleted: boolean = false) {
  return await db.execute({
    sql: includeCompleted
      ? `SELECT * FROM reminders WHERE user_id = ? ORDER BY reminder_time DESC LIMIT 50`
      : `SELECT * FROM reminders WHERE user_id = ? AND is_sent = FALSE ORDER BY reminder_time ASC`,
    args: [userId],
  });
}

export async function markReminderSent(reminderId: number) {
  return await db.execute({
    sql: `UPDATE reminders
          SET is_sent = TRUE, updated_at = datetime('now')
          WHERE id = ?`,
    args: [reminderId],
  });
}

export async function deleteReminder(reminderId: number) {
  return await db.execute({
    sql: 'DELETE FROM reminders WHERE id = ?',
    args: [reminderId],
  });
}
