-- ============================================================
-- Notification Bell Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add match_id to link notifications to specific matches
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS match_id UUID;

-- Add read flag
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Add created_at if not exists
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Index for fast lookup by player
CREATE INDEX IF NOT EXISTS idx_notifications_player ON notifications(player_id, read, created_at DESC);
