-- ============================================
-- FITNESS AI - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this entire file in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other')),
  height_cm NUMERIC NOT NULL,
  weight_kg NUMERIC NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('gain_muscle', 'lose_weight', 'fat_loss', 'body_recomp', 'general_fitness')),
  goal_timeframe_weeks INTEGER,
  injury_status BOOLEAN DEFAULT FALSE,
  injury_description TEXT,
  medical_limitations TEXT,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  gym_access BOOLEAN DEFAULT TRUE,
  training_days_per_week INTEGER NOT NULL CHECK (training_days_per_week BETWEEN 1 AND 7),
  session_duration_minutes INTEGER NOT NULL,
  diet_type TEXT NOT NULL CHECK (diet_type IN ('omnivore', 'vegetarian', 'vegan', 'keto', 'other')),
  allergies_restrictions TEXT,
  meals_per_day INTEGER NOT NULL,
  budget_sensitivity TEXT NOT NULL CHECK (budget_sensitivity IN ('low', 'medium', 'high')),
  average_sleep_hours NUMERIC NOT NULL,
  job_activity_level TEXT NOT NULL CHECK (job_activity_level IN ('sedentary', 'active')),
  daily_movement_level TEXT NOT NULL CHECK (daily_movement_level IN ('low', 'medium', 'high')),
  gym_latitude DOUBLE PRECISION,
  gym_longitude DOUBLE PRECISION,
  gym_radius_meters INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policies
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own plans" ON training_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON training_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON training_plans;

-- Create policies
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

CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_start_time ON session_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_session_logs_state ON session_logs(state);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_date ON session_logs(user_id, start_time);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON session_logs;
DROP POLICY IF EXISTS "Users can insert own sessions" ON session_logs;
DROP POLICY IF EXISTS "Users can update own sessions" ON session_logs;

-- Create policies
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own weekly reviews" ON weekly_reviews;
DROP POLICY IF EXISTS "Users can insert own weekly reviews" ON weekly_reviews;

-- Create policies
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own monthly reviews" ON monthly_reviews;
DROP POLICY IF EXISTS "Users can insert own monthly reviews" ON monthly_reviews;

-- Create policies
CREATE POLICY "Users can view own monthly reviews"
  ON monthly_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly reviews"
  ON monthly_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. OPTIONAL: PROGRESS ENTRIES TABLE
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own progress" ON progress_entries;
DROP POLICY IF EXISTS "Users can insert own progress" ON progress_entries;
DROP POLICY IF EXISTS "Users can update own progress" ON progress_entries;

-- Create policies
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
-- 7. AUTO-UPDATE TRIGGERS (OPTIONAL)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything was created correctly:

-- Check all tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('profiles', 'training_plans', 'session_logs', 'weekly_reviews', 'monthly_reviews', 'progress_entries');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'training_plans', 'session_logs', 'weekly_reviews', 'monthly_reviews');

-- Check policies exist
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public';
