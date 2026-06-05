// User Profile Types
export interface UserProfile {
  age: number;
  sex: "male" | "female" | "other";
  height_cm: number;
  weight_kg: number;
  goal: "gain_muscle" | "lose_weight" | "fat_loss" | "body_recomp" | "general_fitness";
  goal_timeframe_weeks?: number;
  injury_status: boolean;
  injury_description?: string;
  medical_limitations?: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  gym_access: boolean;
  training_days_per_week: number;
  session_duration_minutes: number;
  diet_type: "omnivore" | "vegetarian" | "vegan" | "keto" | "other";
  allergies_restrictions?: string;
  meals_per_day: number;
  budget_sensitivity: "low" | "medium" | "high";
  average_sleep_hours: number;
  job_activity_level: "sedentary" | "active";
  daily_movement_level: "low" | "medium" | "high";
}

// Weekly Plan Types
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
}

export interface TrainingDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface WeeklyPlan {
  days: TrainingDay[];
}

export interface NutritionPlan {
  daily_calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface ProfileSummary {
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: string;
  experience_level: string;
}

export interface CompleteWeeklyPlan {
  profile_summary: ProfileSummary;
  weekly_plan: WeeklyPlan;
  nutrition_plan: NutritionPlan;
}

// Session Types
export type SessionState = "PLANNED" | "PREPARING" | "IN_SESSION" | "COMPLETED" | "MISSED";

export interface ExerciseLog {
  exercise: string;
  weight_kg: number;
  sets: number[];
  target_sets: number;
  target_reps: string;
  rpe: number;
  pain_flag?: boolean;
  pain_description?: string;
}

export interface SessionLog {
  session_id: string;
  day: string;
  state: SessionState;
  start_time?: string;
  end_time?: string;
  exercises: ExerciseLog[];
  duration_minutes?: number;
  notes?: string;
  is_freestyle?: boolean;
  freestyle_type?: "walking" | "running" | "cycling" | "home_workout" | "unstructured";
  distance_km?: number;
  estimated_calories?: number;
  location_verified?: boolean;
  location_data?: LocationVerification;
}

// Weekly Review Types
export interface WeeklySummary {
  adherence_percent: number;
  fatigue_index: number;
  key_progress: string[];
  issues_detected: string[];
  fitness_fact?: string;
}

export interface ScheduleDecision {
  schedule_source: "user_modified" | "reused_previous";
  training_days: string[];
}

export interface WeeklyReview {
  weekly_summary: WeeklySummary;
  schedule_decision: ScheduleDecision;
  next_week_plan: WeeklyPlan;
}

// Monthly Review Types
export type Trend = "up" | "stable" | "down";

export interface MonthlySummary {
  weight_change_kg: number;
  weight_change_percent: number;
  strength_trend: Trend;
  adherence_trend: Trend;
  fatigue_trend: Trend;
  fitness_fact?: string;
}

export interface RecommendedAdjustments {
  calories_percent_change: number;
  training_volume_percent_change: number;
}

export interface MonthlyReview {
  monthly_summary: MonthlySummary;
  recommended_adjustments: RecommendedAdjustments;
}

// Yearly Review Types
export interface YearlySummary {
  total_sessions_completed: number;
  total_active_weeks: number;
  average_adherence: number;
  weight_change_kg: number;
  strength_trend: Trend;
  fatigue_trend: Trend;
  best_months: string[];
  weakest_months: string[];
  fitness_fact?: string;
}

export interface YearlyPlan {
  focus: string;
  priorities: string[];
  training_days_per_week: number;
  nutrition_direction: string;
}

export interface YearlyReview {
  yearly_summary: YearlySummary;
  next_year_plan: YearlyPlan;
}

export interface YearlyReviewInputs {
  startWeight: number;
  currentWeight: number;
  totalSessionsCompleted: number;
  totalActiveWeeks: number;
  averageAdherence: number;
  strengthTrend: Trend;
  fatigueTrend: Trend;
  bestMonths: string[];
  weakestMonths: string[];
  monthlyReviews: MonthlyReview[];
  weeklyReviews: WeeklyReview[];
}

export interface BodyMetricsSnapshot {
  user_id: string;
  weight_kg: number;
  height_cm?: number;
  body_fat_percent?: number;
  muscle_mass_kg?: number;
  notes?: string;
  source?: "onboarding" | "manual" | "monthly_review" | "system";
  recorded_at?: string;
}

export interface NutritionLog {
  user_id: string;
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
}

export interface AIReviewSnapshot {
  user_id: string;
  review_type: "weekly" | "monthly" | "yearly";
  period_start: string;
  period_end?: string;
  prompt_version: string;
  review_json: WeeklyReview | MonthlyReview | YearlyReview;
}

// Fatigue Calculation
export interface FatigueInputs {
  rpe_trends: number[];
  sleep_hours: number[];
  missed_sessions: number;
  soreness_reports: number[]; // 0-10 scale
}

// Progress Tracking
export interface ProgressEntry {
  date: string;
  weight_kg: number;
  body_fat_percent?: number;
  notes?: string;
}

export interface UserProgress {
  starting_weight: number;
  current_weight: number;
  weight_change_kg: number;
  weight_change_percent: number;
  progress_entries: ProgressEntry[];
  total_sessions_completed: number;
  total_weeks_active: number;
  average_adherence: number;
}

// Location Types
export interface GymLocation {
  latitude: number;
  longitude: number;
  name?: string;
  radius_meters?: number; // Default 100m
}

export interface LocationVerification {
  verified: boolean;
  distance_meters?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: string;
}
