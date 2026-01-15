-- Migration: Add tasks and task_completions tables
-- Created: 2025-01-15

-- Tasks table - stores user's daily tasks/commitments
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Task completions - tracks which tasks were completed on which days
CREATE TABLE IF NOT EXISTS task_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    checkin_id INTEGER NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(task_id, checkin_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(user_id, active);
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_checkin ON task_completions(checkin_id);

-- Note: The 'commitment' field in users table is now legacy
-- We'll keep it for backward compatibility but new users will use tasks table
