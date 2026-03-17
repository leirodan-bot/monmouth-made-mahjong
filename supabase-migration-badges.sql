-- ============================================================
-- Badge / Award System Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Table to store earned badges
CREATE TABLE IF NOT EXISTS player_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, badge_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_player_badges_player ON player_badges(player_id);

-- Add best_streak to players if not exists
ALTER TABLE players ADD COLUMN IF NOT EXISTS best_streak INT DEFAULT 0;

-- RLS policies
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON player_badges
  FOR SELECT USING (true);

CREATE POLICY "Service can insert badges" ON player_badges
  FOR INSERT WITH CHECK (true);
