-- ============================================================
-- NMJL Scoring + Locations Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- === LOCATIONS TABLE ===
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('club', 'home', 'other')),
  club_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert locations" ON locations FOR INSERT WITH CHECK (true);

-- === ADD NMJL SCORING COLUMNS TO MATCHES ===
ALTER TABLE matches ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS win_method TEXT; -- 'self_pick' or 'discard'
ALTER TABLE matches ADD COLUMN IF NOT EXISTS thrower_id UUID;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS hand_section TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS hand_line INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS hand_points INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_is_logger BOOLEAN DEFAULT false;
-- jokerless and exposures already added in badges migration
