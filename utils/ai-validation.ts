import { CompleteWeeklyPlan, MonthlyReview, WeeklyReview, YearlyReview } from "@/types";

function assertObject(value: any, label: string) {
  if (!value || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
}

function assertStringArray(value: any, label: string) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`${label} must be a string array`);
  }
}

export function validateWeeklyPlan(value: any): CompleteWeeklyPlan {
  assertObject(value, "Weekly plan");
  assertObject(value.weekly_plan, "Weekly plan.weekly_plan");
  assertObject(value.nutrition_plan, "Weekly plan.nutrition_plan");
  assertObject(value.profile_summary, "Weekly plan.profile_summary");
  if (!Array.isArray(value.weekly_plan.days)) throw new Error("Weekly plan days missing");
  return value as CompleteWeeklyPlan;
}

export function validateWeeklyReview(value: any): WeeklyReview {
  assertObject(value, "Weekly review");
  assertObject(value.weekly_summary, "Weekly review.weekly_summary");
  assertObject(value.schedule_decision, "Weekly review.schedule_decision");
  assertObject(value.next_week_plan, "Weekly review.next_week_plan");
  if (!Array.isArray(value.weekly_summary.key_progress)) throw new Error("Weekly review key progress missing");
  if (!Array.isArray(value.weekly_summary.issues_detected)) throw new Error("Weekly review issues missing");
  if (!Array.isArray(value.schedule_decision.training_days)) throw new Error("Weekly review training days missing");
  if (!Array.isArray(value.next_week_plan.days)) throw new Error("Weekly review next week plan missing");
  return value as WeeklyReview;
}

export function validateMonthlyReview(value: any): MonthlyReview {
  assertObject(value, "Monthly review");
  assertObject(value.monthly_summary, "Monthly review.monthly_summary");
  assertObject(value.recommended_adjustments, "Monthly review.recommended_adjustments");
  return value as MonthlyReview;
}

export function validateYearlyReview(value: any): YearlyReview {
  assertObject(value, "Yearly review");
  assertObject(value.yearly_summary, "Yearly review.yearly_summary");
  assertObject(value.next_year_plan, "Yearly review.next_year_plan");
  assertStringArray(value.yearly_summary.best_months, "Yearly review best months");
  assertStringArray(value.yearly_summary.weakest_months, "Yearly review weakest months");
  assertStringArray(value.next_year_plan.priorities, "Yearly review priorities");
  return value as YearlyReview;
}
