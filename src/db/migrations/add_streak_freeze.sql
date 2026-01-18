-- Migration: Add streak freeze columns
-- Created: 2025-01-18
-- Purpose: Allow users to "freeze" their streak once per week to prevent streak loss

-- Add streak freeze columns to users table
ALTER TABLE users ADD COLUMN streak_freezes_available INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN last_freeze_reset_date TEXT DEFAULT (date('now'));
ALTER TABLE users ADD COLUMN freeze_used_on_date TEXT DEFAULT NULL;

-- Index for checking freeze reset dates
CREATE INDEX IF NOT EXISTS idx_users_freeze_reset ON users(last_freeze_reset_date);
