-- ============================================================
-- 48-Hour Auto-Confirm Function
-- Run this in Supabase SQL Editor
-- ============================================================

-- Function to auto-verify games older than 48 hours
CREATE OR REPLACE FUNCTION auto_verify_old_games()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER := 0;
BEGIN
  UPDATE matches
  SET status = 'auto-verified',
      confirmed_at = now()
  WHERE status = 'pending'
    AND played_at < now() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run this automatically, set up a Supabase cron job:
-- Go to Supabase Dashboard → Database → Extensions → enable pg_cron
-- Then run:
-- SELECT cron.schedule(
--   'auto-verify-games',
--   '0 */6 * * *',  -- every 6 hours
--   $$SELECT auto_verify_old_games()$$
-- );

-- You can also call it manually anytime:
-- SELECT auto_verify_old_games();
