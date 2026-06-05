import { MASTER_META_PROMPT } from "./master.prompt";
import { MONTHLY_REVIEW_PROMPT_VERSION } from "./versions";

export interface MonthlyReviewInputs {
  startingWeight: number;
  currentWeight: number;
  monthlyAdherence: number;
  strengthTrend: "up" | "stable" | "down";
  fatigueTrend: "up" | "stable" | "down";
  adherenceTrend: "up" | "stable" | "down";
  previousMonthReview?: any | null;
  monthlyStats?: {
    total_sessions: number;
    total_duration_minutes: number;
    total_exercises: number;
    location_verified_sessions: number;
    exercises_by_name: { [key: string]: number };
  };
  exerciseLogs?: Array<{
    exercise: string;
    weight_kg: number;
    sets: number[];
    target_sets: number;
    target_reps: string;
    rpe: number;
    pain_flag?: boolean;
  }>;
}

export function buildMonthlyReviewPrompt(inputs: MonthlyReviewInputs) {
  const weightChange = inputs.currentWeight - inputs.startingWeight;
  const weightChangePercent = ((weightChange / inputs.startingWeight) * 100).toFixed(1);

  return `${MASTER_META_PROMPT}

PROMPT_VERSION: ${MONTHLY_REVIEW_PROMPT_VERSION}

You are now in PHASE 5 — MONTHLY REVIEW & BODY TRENDS.

Your task is to OUTPUT VALID JSON ONLY.

ABSOLUTE RULES:
- Output MUST start with { and end with }
- NO markdown
- NO comments
- NO explanations
- NO trailing text

REQUIRED JSON SCHEMA (MUST MATCH EXACTLY):

{
  "monthly_summary": {
    "weight_change_kg": number,
    "weight_change_percent": number,
    "strength_trend": "up" | "stable" | "down",
    "adherence_trend": "up" | "stable" | "down",
    "fatigue_trend": "up" | "stable" | "down",
    "fitness_fact": string
  },
  "recommended_adjustments": {
    "calories_percent_change": number,
    "training_volume_percent_change": number
  }
}

MONTHLY DATA:

Weight: ${inputs.startingWeight}kg → ${inputs.currentWeight}kg (change: ${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}kg, ${weightChangePercent}%)
Monthly Adherence: ${inputs.monthlyAdherence}%
Strength Trend: ${inputs.strengthTrend}
Adherence Trend: ${inputs.adherenceTrend}
Fatigue Trend: ${inputs.fatigueTrend}

${inputs.monthlyStats ? `
MONTHLY TRAINING STATISTICS:
Total Sessions: ${inputs.monthlyStats.total_sessions}
Total Training Time: ${inputs.monthlyStats.total_duration_minutes} minutes (${Math.round(inputs.monthlyStats.total_duration_minutes / 60)} hours)
Total Exercises Completed: ${inputs.monthlyStats.total_exercises}
Location Verified Sessions: ${inputs.monthlyStats.location_verified_sessions}/${inputs.monthlyStats.total_sessions} (${Math.round((inputs.monthlyStats.location_verified_sessions / inputs.monthlyStats.total_sessions) * 100)}%)
Average Session Duration: ${inputs.monthlyStats.total_sessions > 0 ? Math.round(inputs.monthlyStats.total_duration_minutes / inputs.monthlyStats.total_sessions) : 0} minutes

Most Performed Exercises:
${Object.entries(inputs.monthlyStats.exercises_by_name)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, count]) => `- ${name}: ${count} times`)
  .join("\n")}
` : ""}

${inputs.exerciseLogs && inputs.exerciseLogs.length > 0 ? `
EXERCISE PROGRESSION DATA:
${inputs.exerciseLogs.slice(0, 20).map((log) => `
- ${log.exercise}: ${log.weight_kg}kg, ${log.sets.length} sets, RPE: ${log.rpe}${log.pain_flag ? ", ⚠️ PAIN" : ""}
`).join("")}
${inputs.exerciseLogs.length > 20 ? `... and ${inputs.exerciseLogs.length - 20} more exercise logs` : ""}
` : ""}

${inputs.previousMonthReview ? `
PREVIOUS MONTH COMPARISON:
Previous Weight Change: ${inputs.previousMonthReview.monthly_summary?.weight_change_kg || "N/A"}kg
Previous Adherence Trend: ${inputs.previousMonthReview.monthly_summary?.adherence_trend || "N/A"}
Previous Strength Trend: ${inputs.previousMonthReview.monthly_summary?.strength_trend || "N/A"}

Compare current month to previous month and note improvements or regressions.
` : ""}

INTERPRETATION RULES:

Weight Changes:
- ±0.5kg → normal fluctuation (no adjustment needed)
- Weight + strength ↑ → lean gain (good, maintain or slight surplus)
- Weight ↓ + strength ↓ → excessive deficit (increase calories, reduce volume)
- Strength ↑ + weight stable → recomposition (ideal, maintain)
- Weight ↑ + strength stable → may need calorie adjustment
- Weight ↓ + strength ↑ → aggressive cut (may need to slow down)

Adjustment Guidelines:
- Calories: ±5-10% max per month
- Training Volume: ±10-20% max per month
- Always prioritize safety and sustainability

Fitness Fact: Include ONE interesting, relevant fact about fitness, body adaptation, or training science that relates to the user's monthly progress. Make it educational and motivating. Examples: "Muscle memory allows faster strength regain after detraining", "Body composition changes become visible after 4-6 weeks of consistent training", "Metabolic adaptation occurs after 2-3 months of calorie restriction", "Strength gains can continue for 2-3 years in beginners".

RETURN JSON ONLY.`;

}
