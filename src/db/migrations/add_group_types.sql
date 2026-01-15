-- Migration: Add group type support
-- Run this after initial schema

-- Add new columns to groups table
ALTER TABLE groups ADD COLUMN is_telegram_group BOOLEAN DEFAULT TRUE;
ALTER TABLE groups ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Update existing groups (if any) to be telegram groups
UPDATE groups SET is_telegram_group = TRUE WHERE is_telegram_group IS NULL;
UPDATE groups SET is_active = TRUE WHERE is_active IS NULL;
