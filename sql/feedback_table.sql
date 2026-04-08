-- Run in Supabase SQL Editor to create the in-app feedback table.
-- Powers the "Support & Feedback" bubble on the Home screen.

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT,
  player_email TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'recommendation', 'question', 'other')),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 4000),
  app_version TEXT,
  platform TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'wontfix'))
);

-- Index for triage views in the dashboard
CREATE INDEX IF NOT EXISTS idx_feedback_status_created
ON feedback (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_player
ON feedback (player_id);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit feedback (insert only).
-- Anonymous inserts are also allowed so the form still works if the
-- session expires mid-submit; the row will simply have a null player_id.
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
CREATE POLICY "Anyone can submit feedback"
ON feedback FOR INSERT
WITH CHECK (true);

-- Players can read back their own submissions (for a future "my reports"
-- list). Service role / dashboard can read everything.
DROP POLICY IF EXISTS "Players can view own feedback" ON feedback;
CREATE POLICY "Players can view own feedback"
ON feedback FOR SELECT
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service role can read all feedback" ON feedback;
CREATE POLICY "Service role can read all feedback"
ON feedback FOR SELECT
USING (auth.role() = 'service_role');
