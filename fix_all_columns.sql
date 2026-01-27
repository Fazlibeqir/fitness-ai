-- ============================================
-- COMPREHENSIVE FIX: Add all missing columns to profiles table
-- ============================================
-- Run this if you're getting multiple column errors
-- This ensures all required columns exist with correct types
-- ============================================

-- Add missing columns (only if they don't exist)
DO $$
BEGIN
  -- average_sleep_hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'average_sleep_hours'
  ) THEN
    ALTER TABLE profiles ADD COLUMN average_sleep_hours NUMERIC NOT NULL DEFAULT 7;
    RAISE NOTICE 'Added: average_sleep_hours';
  END IF;

  -- budget_sensitivity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'budget_sensitivity'
  ) THEN
    ALTER TABLE profiles ADD COLUMN budget_sensitivity TEXT NOT NULL DEFAULT 'medium';
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_budget_sensitivity_check'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_budget_sensitivity_check 
      CHECK (budget_sensitivity IN ('low', 'medium', 'high'));
    END IF;
    RAISE NOTICE 'Added: budget_sensitivity';
  END IF;

  -- gym_latitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_latitude DOUBLE PRECISION;
    RAISE NOTICE 'Added: gym_latitude';
  END IF;

  -- gym_longitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_longitude DOUBLE PRECISION;
    RAISE NOTICE 'Added: gym_longitude';
  END IF;

  -- gym_radius_meters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_radius_meters'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_radius_meters INTEGER DEFAULT 100;
    RAISE NOTICE 'Added: gym_radius_meters';
  END IF;

  -- daily_movement_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_movement_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_movement_level TEXT NOT NULL DEFAULT 'medium';
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_daily_movement_level_check'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_daily_movement_level_check 
      CHECK (daily_movement_level IN ('low', 'medium', 'high'));
    END IF;
    RAISE NOTICE 'Added: daily_movement_level';
  END IF;

  -- job_activity_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'job_activity_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_activity_level TEXT NOT NULL DEFAULT 'sedentary';
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_job_activity_level_check'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_job_activity_level_check 
      CHECK (job_activity_level IN ('sedentary', 'active'));
    END IF;
    RAISE NOTICE 'Added: job_activity_level';
  END IF;

  RAISE NOTICE 'All columns checked!';
END $$;

-- Show all profile columns (verify they exist)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Show check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'c';
