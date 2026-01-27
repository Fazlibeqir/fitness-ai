-- ============================================
-- FIX: Column typos and missing columns in profiles table
-- ============================================
-- Run this in Supabase SQL Editor to fix column issues
-- ============================================

DO $$
BEGIN
  -- Fix average_sleep_hours typo
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'average_seleep_hours'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN average_seleep_hours TO average_sleep_hours;
    RAISE NOTICE 'Fixed: Renamed average_seleep_hours to average_sleep_hours';
  END IF;
  
  -- Ensure average_sleep_hours exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'average_sleep_hours'
  ) THEN
    ALTER TABLE profiles ADD COLUMN average_sleep_hours NUMERIC NOT NULL DEFAULT 7;
    RAISE NOTICE 'Added: average_sleep_hours column';
  END IF;

  -- Ensure budget_sensitivity exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'budget_sensitivity'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN budget_sensitivity TEXT NOT NULL DEFAULT 'medium' 
    CHECK (budget_sensitivity IN ('low', 'medium', 'high'));
    RAISE NOTICE 'Added: budget_sensitivity column';
  END IF;

  -- Ensure all other required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_latitude DOUBLE PRECISION;
    RAISE NOTICE 'Added: gym_latitude column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_longitude DOUBLE PRECISION;
    RAISE NOTICE 'Added: gym_longitude column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_radius_meters'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_radius_meters INTEGER DEFAULT 100;
    RAISE NOTICE 'Added: gym_radius_meters column';
  END IF;

  -- Ensure daily_movement_level exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_movement_level'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN daily_movement_level TEXT NOT NULL DEFAULT 'medium' 
    CHECK (daily_movement_level IN ('low', 'medium', 'high'));
    RAISE NOTICE 'Added: daily_movement_level column';
  END IF;

  -- Ensure job_activity_level exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'job_activity_level'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN job_activity_level TEXT NOT NULL DEFAULT 'sedentary' 
    CHECK (job_activity_level IN ('sedentary', 'active'));
    RAISE NOTICE 'Added: job_activity_level column';
  END IF;

END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'average_sleep_hours',
  'budget_sensitivity',
  'gym_latitude',
  'gym_longitude',
  'gym_radius_meters',
  'daily_movement_level',
  'job_activity_level'
)
ORDER BY column_name;
