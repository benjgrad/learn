-- AI daily usage tracking for rate limiting
CREATE TABLE ai_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE ai_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON ai_daily_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Atomic increment function: inserts or updates usage count in one operation
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO ai_daily_usage (user_id, usage_date, usage_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET usage_count = ai_daily_usage.usage_count + 1
  RETURNING usage_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for fast lookups
CREATE INDEX idx_ai_daily_usage_user_date ON ai_daily_usage(user_id, usage_date);
