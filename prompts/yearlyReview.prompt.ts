import { MASTER_META_PROMPT } from "./master.prompt";
import { YearlyReviewInputs } from "@/types";
import { YEARLY_REVIEW_PROMPT_VERSION } from "./versions";

export function buildYearlyReviewPrompt(inputs: YearlyReviewInputs) {
  const weightChange = inputs.currentWeight - inputs.startWeight;
  const activeWeeks = Math.max(inputs.totalActiveWeeks, 1);
  const avgAdherence = Math.round(inputs.averageAdherence);

  return `${MASTER_META_PROMPT}

PROMPT_VERSION: ${YEARLY_REVIEW_PROMPT_VERSION}

You are now in PHASE 6 — YEARLY REVIEW & LONG-TERM TRENDS.

Your task is to OUTPUT VALID JSON ONLY.

ABSOLUTE RULES:
- Output MUST start with { and end with }
- NO markdown
- NO comments
- NO explanations
- NO trailing text

REQUIRED JSON SCHEMA (MUST MATCH EXACTLY):

{
  "yearly_summary": {
    "total_sessions_completed": number,
    "total_active_weeks": number,
    "average_adherence": number,
    "weight_change_kg": number,
    "strength_trend": "up" | "stable" | "down",
    "fatigue_trend": "up" | "stable" | "down",
    "best_months": string[],
    "weakest_months": string[],
    "fitness_fact": string
  },
  "next_year_plan": {
    "focus": string,
    "priorities": string[],
    "training_days_per_week": number,
    "nutrition_direction": string
  }
}

YEARLY DATA:

Total Sessions Completed: ${inputs.totalSessionsCompleted}
Total Active Weeks: ${activeWeeks}
Average Adherence: ${avgAdherence}%
Weight Change: ${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}kg
Strength Trend: ${inputs.strengthTrend}
Fatigue Trend: ${inputs.fatigueTrend}
Best Months: ${inputs.bestMonths.join(", ") || "None yet"}
Weakest Months: ${inputs.weakestMonths.join(", ") || "None yet"}

Recent Monthly Reviews:
${inputs.monthlyReviews.map((review) => `
- ${review.monthly_summary?.fitness_fact || "Monthly review"} | Strength: ${review.monthly_summary?.strength_trend || "stable"} | Adherence: ${review.monthly_summary?.adherence_trend || "stable"} | Fatigue: ${review.monthly_summary?.fatigue_trend || "stable"}
`).join("")}

Recent Weekly Reviews:
${inputs.weeklyReviews.slice(-12).map((review, index) => `
- Week ${index + 1}: Adherence ${review.weekly_summary?.adherence_percent || 0}% | Fatigue ${review.weekly_summary?.fatigue_index || 0}
`).join("")}

RULES:
- Summarize long-term consistency and trend direction.
- Recommend one clear focus for the next year.
- Prioritize safe progression and sustainable nutrition.
- Include one educational fitness fact that matches the user's long-term progress.

RETURN JSON ONLY.`;
}
