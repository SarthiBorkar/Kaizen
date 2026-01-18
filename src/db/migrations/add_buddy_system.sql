-- Migration: Add buddy/partner system
-- Created: 2025-01-18
-- Purpose: Allow users to be matched with accountability partners

-- Buddy matches table - stores 1:1 accountability partnerships
CREATE TABLE IF NOT EXISTS buddy_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active', -- active, inactive, ended
    matched_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT DEFAULT NULL,
    CHECK(user1_id < user2_id) -- Ensure consistent ordering
);

-- Buddy requests table - stores pending buddy requests
CREATE TABLE IF NOT EXISTS buddy_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, matched, cancelled
    created_at TEXT DEFAULT (datetime('now')),
    matched_at TEXT DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buddy_matches_user1 ON buddy_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_user2 ON buddy_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_status ON buddy_matches(status);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_user ON buddy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_requests_status ON buddy_requests(status);
