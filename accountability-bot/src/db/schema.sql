-- Users table: stores user profile and preferences
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    commitment TEXT,
    reminder_hour INTEGER DEFAULT 20,
    timezone TEXT DEFAULT 'Europe/Berlin',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Groups table: stores accountability groups
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_chat_id INTEGER UNIQUE NOT NULL,
    name TEXT,
    invite_code TEXT UNIQUE,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Memberships table: tracks which users belong to which groups
CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, group_id)
);

-- Check-ins table: stores daily check-in records
CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    check_date TEXT NOT NULL,
    completed BOOLEAN NOT NULL,
    checked_in_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, group_id, check_date)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(check_date);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, check_date);
CREATE INDEX IF NOT EXISTS idx_memberships_group ON memberships(group_id);
