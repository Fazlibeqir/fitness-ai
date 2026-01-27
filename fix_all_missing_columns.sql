-- ============================================
-- COMPREHENSIVE FIX: Add ALL missing columns to profiles table
-- ============================================
-- Run this ONCE to add all missing columns from the schema
-- This prevents having to fix columns one by one
-- ============================================

DO $$
BEGIN
  -- average_sleep_hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'average_sleep_hours'
  ) THEN
    ALTER TABLE profiles ADD COLUMN average_sleep_hours NUMERIC NOT NULL DEFAULT 7;
    RAISE NOTICE '✓ Added: average_sleep_hours';
  END IF;

  -- budget_sensitivity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'budget_sensitivity'
  ) THEN
    ALTER TABLE profiles ADD COLUMN budget_sensitivity TEXT NOT NULL DEFAULT 'medium';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'profiles_budget_sensitivity_check'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_budget_sensitivity_check 
      CHECK (budget_sensitivity IN ('low', 'medium', 'high'));
    END IF;
    RAISE NOTICE '✓ Added: budget_sensitivity';
  END IF;

  -- daily_movement_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_movement_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_movement_level TEXT NOT NULL DEFAULT 'medium';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'profiles_daily_movement_level_check'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_daily_movement_level_check 
      CHECK (daily_movement_level IN ('low', 'medium', 'high'));
    END IF;
    RAISE NOTICE '✓ Added: daily_movement_level';
  END IF;

  -- job_activity_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'job_activity_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_activity_level TEXT NOT NULL DEFAULT 'sedentary';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'profiles_job_activity_level_check'
    ) THEN
      ALTER TABLE profiles ADD CONSTRAINT profiles_job_activity_level_check 
      CHECK (job_activity_level IN ('sedentary', 'active'));
    END IF;
    RAISE NOTICE '✓ Added: job_activity_level';
  END IF;

  -- gym_latitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_latitude DOUBLE PRECISION;
    RAISE NOTICE '✓ Added: gym_latitude';
  END IF;

  -- gym_longitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_longitude DOUBLE PRECISION;
    RAISE NOTICE '✓ Added: gym_longitude';
  END IF;

  -- gym_radius_meters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gym_radius_meters'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gym_radius_meters INTEGER DEFAULT 100;
    RAISE NOTICE '✓ Added: gym_radius_meters';
  END IF;

  -- Check for other potentially missing columns
  -- age
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age INTEGER NOT NULL DEFAULT 25;
    RAISE NOTICE '✓ Added: age';
  END IF;

  -- sex
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'sex'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sex TEXT NOT NULL DEFAULT 'male';
    RAISE NOTICE '✓ Added: sex';
  END IF;

  -- height_cm
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE profiles ADD COLUMN height_cm NUMERIC NOT NULL DEFAULT 170;
    RAISE NOTICE '✓ Added: height_cm';
  END IF;

  -- weight_kg
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'weight_kg'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weight_kg NUMERIC NOT NULL DEFAULT 70;
    RAISE NOTICE '✓ Added: weight_kg';
  END IF;

  -- goal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'goal'
  ) THEN
    ALTER TABLE profiles ADD COLUMN goal TEXT NOT NULL DEFAULT 'general_fitness';
    RAISE NOTICE '✓ Added: goal';
  END IF;

  -- experience_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience_level TEXT NOT NULL DEFAULT 'beginner';
    RAISE NOTICE '✓ Added: experience_level';
  END IF;

  -- training_days_per_week
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'training_days_per_week'
  ) THEN
    ALTER TABLE profiles ADD COLUMN training_days_per_week INTEGER NOT NULL DEFAULT 3;
    RAISE NOTICE '✓ Added: training_days_per_week';
  END IF;

  -- session_duration_minutes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'session_duration_minutes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN session_duration_minutes INTEGER NOT NULL DEFAULT 60;
    RAISE NOTICE '✓ Added: session_duration_minutes';
  END IF;

  -- diet_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'diet_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN diet_type TEXT NOT NULL DEFAULT 'omnivore';
    RAISE NOTICE '✓ Added: diet_type';
  END IF;

  -- meals_per_day
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'meals_per_day'
  ) THEN
    ALTER TABLE profiles ADD COLUMN meals_per_day INTEGER NOT NULL DEFAULT 3;
    RAISE NOTICE '✓ Added: meals_per_day';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'All columns checked and added if needed!';
  RAISE NOTICE '========================================';
END $$;

-- Show summary of all columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
