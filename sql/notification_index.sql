-- Run in Supabase SQL Editor to improve notification query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications (player_id, read, created_at DESC)
WHERE read = false;
