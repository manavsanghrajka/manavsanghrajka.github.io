-- User Gamification Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "user_gamification" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT UNIQUE NOT NULL,
    "xp" INTEGER DEFAULT 0,
    "level" INTEGER DEFAULT 1,
    "current_streak" INTEGER DEFAULT 0,
    "last_study_date" DATE DEFAULT NULL,
    "daily_login_claimed_at" DATE DEFAULT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);

-- RPC: Increment XP with level-up logic (1.6x multiplier)
-- Formula: XP for Level N = floor(1000 * 1.6^(N-2)) for N >= 2
CREATE OR REPLACE FUNCTION increment_xp(p_user_id TEXT, p_xp_amount INT)
RETURNS JSON AS $$
DECLARE
  current_xp INT;
  current_level INT;
  new_xp INT;
  new_level INT;
  xp_for_next_level INT;
  leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get current stats
  SELECT xp, level INTO current_xp, current_level 
  FROM user_gamification WHERE user_id = p_user_id;
  
  -- If user doesn't exist, create their record
  IF NOT FOUND THEN
    INSERT INTO user_gamification (user_id, xp, level)
    VALUES (p_user_id, p_xp_amount, 1);
    RETURN json_build_object('xp', p_xp_amount, 'level', 1, 'leveled_up', FALSE, 'xp_gained', p_xp_amount);
  END IF;
  
  new_xp := current_xp + p_xp_amount;
  new_level := current_level;
  
  -- Calculate XP needed for next level: 1000 * 1.6^(level-1)
  xp_for_next_level := FLOOR(1000 * POWER(1.6, current_level - 1));
  
  -- Check if leveled up
  IF new_xp >= xp_for_next_level THEN
    new_level := current_level + 1;
    leveled_up := TRUE;
  END IF;
  
  UPDATE user_gamification 
  SET xp = new_xp, level = new_level, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'xp', new_xp, 
    'level', new_level, 
    'leveled_up', leveled_up,
    'xp_gained', p_xp_amount,
    'xp_for_next_level', FLOOR(1000 * POWER(1.6, new_level - 1))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update streak with timezone-aware logic
CREATE OR REPLACE FUNCTION update_streak(p_user_id TEXT, p_local_date DATE)
RETURNS JSON AS $$
DECLARE
  last_date DATE;
  cur_streak INT;
  new_streak INT;
  is_new_day BOOLEAN := FALSE;
BEGIN
  -- Get current stats
  SELECT last_study_date, current_streak INTO last_date, cur_streak
  FROM user_gamification WHERE user_id = p_user_id;
  
  -- If user doesn't exist, create their record
  IF NOT FOUND THEN
    INSERT INTO user_gamification (user_id, current_streak, last_study_date)
    VALUES (p_user_id, 1, p_local_date);
    RETURN json_build_object('streak', 1, 'is_new_day', TRUE);
  END IF;
  
  -- Check streak logic
  IF last_date = p_local_date THEN
    -- Same day - streak unchanged
    RETURN json_build_object('streak', cur_streak, 'is_new_day', FALSE);
  ELSIF last_date = p_local_date - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    new_streak := cur_streak + 1;
    is_new_day := TRUE;
  ELSE
    -- Gap in days - reset streak
    new_streak := 1;
    is_new_day := TRUE;
  END IF;
  
  UPDATE user_gamification 
  SET current_streak = new_streak, last_study_date = p_local_date, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
  
  RETURN json_build_object('streak', new_streak, 'is_new_day', is_new_day);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Claim daily login bonus
CREATE OR REPLACE FUNCTION claim_daily_login(p_user_id TEXT, p_local_date DATE)
RETURNS JSON AS $$
DECLARE
  last_claimed DATE;
  result JSON;
BEGIN
  -- Get last claimed date
  SELECT daily_login_claimed_at INTO last_claimed
  FROM user_gamification WHERE user_id = p_user_id;
  
  -- If user doesn't exist or hasn't claimed today
  IF NOT FOUND OR last_claimed IS NULL OR last_claimed < p_local_date THEN
    -- Update claim date
    UPDATE user_gamification 
    SET daily_login_claimed_at = p_local_date
    WHERE user_id = p_user_id;
    
    -- If no rows updated, user doesn't exist - create them
    IF NOT FOUND THEN
      INSERT INTO user_gamification (user_id, daily_login_claimed_at)
      VALUES (p_user_id, p_local_date);
    END IF;
    
    -- Award 20 XP
    SELECT increment_xp(p_user_id, 20) INTO result;
    RETURN json_build_object('claimed', TRUE, 'xp_result', result);
  END IF;
  
  -- Already claimed today
  RETURN json_build_object('claimed', FALSE, 'reason', 'already_claimed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
