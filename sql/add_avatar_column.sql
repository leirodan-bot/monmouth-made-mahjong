-- Run in Supabase SQL Editor to add avatar customization
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar TEXT;
