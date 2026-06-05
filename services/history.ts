import {
  AIReviewSnapshot,
  BodyMetricsSnapshot,
  NutritionLog,
  MonthlyReview,
  WeeklyReview,
  YearlyReview,
} from "@/types";
import { supabase } from "./supabase";

export async function recordBodyMetricsSnapshot(snapshot: BodyMetricsSnapshot) {
  await supabase.from("body_metrics_history").insert({
    user_id: snapshot.user_id,
    weight_kg: snapshot.weight_kg,
    height_cm: snapshot.height_cm ?? null,
    body_fat_percent: snapshot.body_fat_percent ?? null,
    muscle_mass_kg: snapshot.muscle_mass_kg ?? null,
    notes: snapshot.notes ?? null,
    source: snapshot.source ?? "system",
    recorded_at: snapshot.recorded_at ?? new Date().toISOString(),
  });
}

export async function recordNutritionLog(log: NutritionLog) {
  await supabase.from("nutrition_logs").insert({
    user_id: log.user_id,
    date: log.date,
    calories: log.calories,
    protein_g: log.protein_g,
    carbs_g: log.carbs_g,
    fat_g: log.fat_g,
    notes: log.notes ?? null,
  });
}

export async function recordAIReviewSnapshot(
  snapshot: AIReviewSnapshot
) {
  await supabase.from("ai_review_snapshots").insert({
    user_id: snapshot.user_id,
    review_type: snapshot.review_type,
    period_start: snapshot.period_start,
    period_end: snapshot.period_end ?? null,
    prompt_version: snapshot.prompt_version,
    review_json: snapshot.review_json,
  });
}

export function getReviewPeriod(reviewType: AIReviewSnapshot["review_type"]) {
  const now = new Date();
  if (reviewType === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (reviewType === "monthly") {
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export type SavedReview = WeeklyReview | MonthlyReview | YearlyReview;
