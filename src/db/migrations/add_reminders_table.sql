-- Reminders table: stores one-time reminders with custom times
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    telegram_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    reminder_time TEXT NOT NULL, -- ISO datetime string
    is_sent BOOLEAN DEFAULT FALSE,
    calendar_event_id TEXT, -- Google Calendar event ID if synced
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for efficient querying of pending reminders
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time, is_sent);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
