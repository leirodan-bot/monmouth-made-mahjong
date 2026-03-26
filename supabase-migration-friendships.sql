-- ============================================
-- MahjRank Friendships System
-- Mutual friend requests (request → accept)
-- ============================================

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Composite index for checking existing friendship in either direction
CREATE INDEX IF NOT EXISTS idx_friendships_pair ON friendships(requester_id, receiver_id);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies: players can see friendships they're part of
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    requester_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (
    requester_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Users can update friendships they received (accept) or are part of (unfriend)
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (
    requester_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Users can delete friendships they're part of (unfriend)
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (
    requester_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );
