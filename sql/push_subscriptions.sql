-- Run in Supabase SQL Editor to create push subscription storage

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, endpoint)
);

-- Index for looking up subscriptions by player
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_player
ON push_subscriptions (player_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Players can manage their own subscriptions
CREATE POLICY "Players can insert own subscriptions"
ON push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

CREATE POLICY "Players can view own subscriptions"
ON push_subscriptions FOR SELECT
USING (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

CREATE POLICY "Players can delete own subscriptions"
ON push_subscriptions FOR DELETE
USING (auth.uid() = (SELECT user_id FROM players WHERE id = player_id));

-- Service role can read all (for sending push from edge function)
CREATE POLICY "Service role can read all subscriptions"
ON push_subscriptions FOR SELECT
USING (auth.role() = 'service_role');
