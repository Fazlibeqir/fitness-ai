-- ============================================
-- COMPLETE DATABASE SETUP - RUN THIS ONCE
-- ============================================
-- This script sets up EVERYTHING needed for the Fitness AI app
-- It's safe to run multiple times (idempotent)
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES TABLE - Create or Update
-- ============================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL DEFAULT 25,
  sex TEXT NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female', 'other')),
  height_cm NUMERIC NOT NULL DEFAULT 170,
  weight_kg NUMERIC NOT NULL DEFAULT 70,
  goal TEXT NOT NULL DEFAULT 'general_fitness' CHECK (goal IN ('gain_muscle', 'lose_weight', 'fat_loss', 'body_recomp', 'general_fitness')),
  goal_timeframe_weeks INTEGER,
  injury_status BOOLEAN DEFAULT FALSE,
  injury_description TEXT,
  medical_limitations TEXT,
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  gym_access BOOLEAN DEFAULT TRUE,
  training_days_per_week INTEGER NOT NULL DEFAULT 3 CHECK (training_days_per_week BETWEEN 1 AND 7),
  session_duration_minutes INTEGER NOT NULL DEFAULT 60,
  diet_type TEXT NOT NULL DEFAULT 'omnivore' CHECK (diet_type IN ('omnivore', 'vegetarian', 'vegan', 'keto', 'other')),
  allergies_restrictions TEXT,
  meals_per_day INTEGER NOT NULL DEFAULT 3,
  budget_sensitivity TEXT NOT NULL DEFAULT 'medium' CHECK (budget_sensitivity IN ('low', 'medium', 'high')),
  average_sleep_hours NUMERIC NOT NULL DEFAULT 7,
  job_activity_level TEXT NOT NULL DEFAULT 'sedentary' CHECK (job_activity_level IN ('sedentary', 'active')),
  daily_movement_level TEXT NOT NULL DEFAULT 'medium' CHECK (daily_movement_level IN ('low', 'medium', 'high')),
  gym_latitude DOUBLE PRECISION,
  gym_longitude DOUBLE PRECISION,
  gym_radius_meters INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns (safe if already exist)
DO $$
BEGIN
  -- Add columns that might be missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
    ALTER TABLE profiles ADD COLUMN age INTEGER NOT NULL DEFAULT 25;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sex') THEN
    ALTER TABLE profiles ADD COLUMN sex TEXT NOT NULL DEFAULT 'male';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'height_cm') THEN
    ALTER TABLE profiles ADD COLUMN height_cm NUMERIC NOT NULL DEFAULT 170;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weight_kg') THEN
    ALTER TABLE profiles ADD COLUMN weight_kg NUMERIC NOT NULL DEFAULT 70;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal') THEN
    ALTER TABLE profiles ADD COLUMN goal TEXT NOT NULL DEFAULT 'general_fitness';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal_timeframe_weeks') THEN
    ALTER TABLE profiles ADD COLUMN goal_timeframe_weeks INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'injury_status') THEN
    ALTER TABLE profiles ADD COLUMN injury_status BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'injury_description') THEN
    ALTER TABLE profiles ADD COLUMN injury_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'medical_limitations') THEN
    ALTER TABLE profiles ADD COLUMN medical_limitations TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience_level') THEN
    ALTER TABLE profiles ADD COLUMN experience_level TEXT NOT NULL DEFAULT 'beginner';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gym_access') THEN
    ALTER TABLE profiles ADD COLUMN gym_access BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'training_days_per_week') THEN
    ALTER TABLE profiles ADD COLUMN training_days_per_week INTEGER NOT NULL DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'session_duration_minutes') THEN
    ALTER TABLE profiles ADD COLUMN session_duration_minutes INTEGER NOT NULL DEFAULT 60;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'diet_type') THEN
    ALTER TABLE profiles ADD COLUMN diet_type TEXT NOT NULL DEFAULT 'omnivore';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allergies_restrictions') THEN
    ALTER TABLE profiles ADD COLUMN allergies_restrictions TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'meals_per_day') THEN
    ALTER TABLE profiles ADD COLUMN meals_per_day INTEGER NOT NULL DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'budget_sensitivity') THEN
    ALTER TABLE profiles ADD COLUMN budget_sensitivity TEXT NOT NULL DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'average_sleep_hours') THEN
    ALTER TABLE profiles ADD COLUMN average_sleep_hours NUMERIC NOT NULL DEFAULT 7;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_activity_level') THEN
    ALTER TABLE profiles ADD COLUMN job_activity_level TEXT NOT NULL DEFAULT 'sedentary';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'daily_movement_level') THEN
    ALTER TABLE profiles ADD COLUMN daily_movement_level TEXT NOT NULL DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gym_latitude') THEN
    ALTER TABLE profiles ADD COLUMN gym_latitude DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gym_longitude') THEN
    ALTER TABLE profiles ADD COLUMN gym_longitude DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gym_radius_meters') THEN
    ALTER TABLE profiles ADD COLUMN gym_radius_meters INTEGER DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. TRAINING PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS training_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_week_start ON training_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_training_plans_user_week ON training_plans(user_id, week_start);

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON training_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON training_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON training_plans;

CREATE POLICY "Users can view own plans"
  ON training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON training_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. SESSION LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS session_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('PLANNED', 'PREPARING', 'IN_SESSION', 'COMPLETED', 'MISSED')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  exercises JSONB NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  is_freestyle BOOLEAN DEFAULT FALSE,
  freestyle_type TEXT CHECK (freestyle_type IN ('walking', 'running', 'cycling', 'home_workout', 'unstructured')),
  distance_km NUMERIC,
  estimated_calories NUMERIC,
  location_verified BOOLEAN,
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_logs' AND column_name = 'location_verified') THEN
    ALTER TABLE session_logs ADD COLUMN location_verified BOOLEAN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'session_logs' AND column_name = 'location_data') THEN
    ALTER TABLE session_logs ADD COLUMN location_data JSONB;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_start_time ON session_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_session_logs_state ON session_logs(state);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_date ON session_logs(user_id, start_time);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON session_logs;
DROP POLICY IF EXISTS "Users can insert own sessions" ON session_logs;
DROP POLICY IF EXISTS "Users can update own sessions" ON session_logs;

CREATE POLICY "Users can view own sessions"
  ON session_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON session_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON session_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. WEEKLY REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  review_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week_start ON weekly_reviews(week_start);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weekly reviews" ON weekly_reviews;
DROP POLICY IF EXISTS "Users can insert own weekly reviews" ON weekly_reviews;

CREATE POLICY "Users can view own weekly reviews"
  ON weekly_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reviews"
  ON weekly_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. MONTHLY REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  review_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_start)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reviews_user_id ON monthly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_month_start ON monthly_reviews(month_start);

ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own monthly reviews" ON monthly_reviews;
DROP POLICY IF EXISTS "Users can insert own monthly reviews" ON monthly_reviews;

CREATE POLICY "Users can view own monthly reviews"
  ON monthly_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly reviews"
  ON monthly_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. PROGRESS ENTRIES TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS progress_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  body_fat_percent NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_progress_entries_user_id ON progress_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_date ON progress_entries(date);

ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON progress_entries;
DROP POLICY IF EXISTS "Users can insert own progress" ON progress_entries;
DROP POLICY IF EXISTS "Users can update own progress" ON progress_entries;

CREATE POLICY "Users can view own progress"
  ON progress_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON progress_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. AUTO-UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;
CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION - Show what was created
-- ============================================

SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'training_plans', 'session_logs', 'weekly_reviews', 'monthly_reviews', 'progress_entries')
ORDER BY table_name;

SELECT 'Profiles table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'RLS enabled:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'training_plans', 'session_logs', 'weekly_reviews', 'monthly_reviews', 'progress_entries');

SELECT 'Setup complete! ✅' as status;
