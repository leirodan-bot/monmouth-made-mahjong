-- ============================================================
-- Monmouth Made Mah Jongg™ — Elo System Migration
-- Run this in Supabase SQL Editor
-- Based on MMM_Elo_Spec.docx v1.0
-- ============================================================

-- ── 1. Add new columns to players table ──
-- (Only adds if they don't exist — safe to run multiple times)

-- All-time Elo (never resets between seasons)
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_all_time FLOAT DEFAULT 800.0;

-- Provisional flag (true until 5 verified games)
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_provisional BOOLEAN DEFAULT true;

-- Cached rank tier for display
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_rank_tier TEXT DEFAULT 'Beginner';

-- Peak Elo ever achieved
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_peak FLOAT DEFAULT 800.0;

-- Last game date for inactivity detection
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_game_date DATE;

-- Wall game count
ALTER TABLE players ADD COLUMN IF NOT EXISTS wall_games INTEGER DEFAULT 0;

-- Ensure existing columns have correct defaults
-- (These should already exist but let's make sure the defaults are right)
ALTER TABLE players ALTER COLUMN elo SET DEFAULT 800.0;
ALTER TABLE players ALTER COLUMN games_played SET DEFAULT 0;
ALTER TABLE players ALTER COLUMN wins SET DEFAULT 0;
ALTER TABLE players ALTER COLUMN losses SET DEFAULT 0;
ALTER TABLE players ALTER COLUMN current_streak SET DEFAULT 0;

-- ── 2. Create elo_history table ──
CREATE TABLE IF NOT EXISTS elo_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID,
  rating_before FLOAT NOT NULL,
  rating_after FLOAT NOT NULL,
  rating_change FLOAT NOT NULL,
  k_factor FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by player (sparkline charts, profile history)
CREATE INDEX IF NOT EXISTS idx_elo_history_player ON elo_history(player_id, created_at DESC);

-- Index for game-based lookups
CREATE INDEX IF NOT EXISTS idx_elo_history_game ON elo_history(game_id);

-- ── 3. Add new columns to matches table ──
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_wall_game BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player_ids UUID[] DEFAULT '{}';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS elo_updates JSONB DEFAULT '[]';

-- ── 4. Enable RLS on elo_history ──
ALTER TABLE elo_history ENABLE ROW LEVEL SECURITY;

-- Everyone can read elo_history
DROP POLICY IF EXISTS "elo_history_select" ON elo_history;
CREATE POLICY "elo_history_select" ON elo_history
  FOR SELECT USING (true);

-- Only authenticated users can insert (via the app)
DROP POLICY IF EXISTS "elo_history_insert" ON elo_history;
CREATE POLICY "elo_history_insert" ON elo_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── 5. Update existing players to have correct defaults ──
-- Set elo_all_time to current elo for any existing players
UPDATE players SET elo_all_time = elo WHERE elo_all_time IS NULL OR elo_all_time = 800.0;
UPDATE players SET elo_peak = elo WHERE elo_peak IS NULL OR elo_peak < elo;
UPDATE players SET elo_provisional = (games_played < 5) WHERE elo_provisional IS NULL;
UPDATE players SET elo_rank_tier = CASE
  WHEN elo < 750 THEN 'Novice'
  WHEN elo < 850 THEN 'Beginner'
  WHEN elo < 950 THEN 'Skilled'
  WHEN elo < 1050 THEN 'Expert'
  WHEN elo < 1150 THEN 'Master'
  ELSE 'Grandmaster'
END;

-- ============================================================
-- Done! Your database is now ready for the Elo system.
-- ============================================================
