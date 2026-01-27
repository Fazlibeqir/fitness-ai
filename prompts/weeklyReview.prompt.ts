import { MASTER_META_PROMPT } from "./master.prompt";

export interface WeeklyReviewInputs {
  plannedSessions: number;
  completedSessions: number;
  exerciseLogs: Array<{
    exercise: string;
    weight_kg: number;
    sets: number[];
    target_sets: number;
    target_reps: string;
    rpe: number;
    pain_flag?: boolean;
    pain_description?: string;
  }>;
  fatigueIndex: number;
  userScheduleModified: boolean;
  currentTrainingDays: string[];
  previousWeekReview?: any | null;
  sessionDetails?: Array<{
    day: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    location_verified: boolean;
    exercise_count: number;
    total_sets: number;
    exercises: any[];
  }>;
}

export function buildWeeklyReviewPrompt(inputs: WeeklyReviewInputs) {
  const adherencePercent = Math.round((inputs.completedSessions / inputs.plannedSessions) * 100);

  return `${MASTER_META_PROMPT}

You are now in PHASE 4 — WEEKLY REVIEW.

Your task is to OUTPUT VALID JSON ONLY.

ABSOLUTE RULES:
- Output MUST start with { and end with }
- NO markdown
- NO comments
- NO explanations
- NO trailing text

REQUIRED JSON SCHEMA (MUST MATCH EXACTLY):

{
  "weekly_summary": {
    "adherence_percent": number,
    "fatigue_index": number,
    "key_progress": string[],
    "issues_detected": string[],
    "fitness_fact": string
  },
  "schedule_decision": {
    "schedule_source": "user_modified" | "reused_previous",
    "training_days": string[]
  },
  "next_week_plan": {
    "days": [
      {
        "day": "Monday",
        "focus": string,
        "exercises": [
          {
            "name": string,
            "sets": number,
            "reps": string,
            "rest_seconds": number
          }
        ]
      }
    ]
  }
}

WEEKLY DATA:

Adherence: ${adherencePercent}% (${inputs.completedSessions}/${inputs.plannedSessions} sessions completed)
Fatigue Index: ${inputs.fatigueIndex}/100
User Modified Schedule: ${inputs.userScheduleModified ? "Yes" : "No"}
Current Training Days: ${inputs.currentTrainingDays.join(", ")}

Exercise Performance:
${inputs.exerciseLogs.map((log) => `
- ${log.exercise}: ${log.sets.length}/${log.target_sets} sets, reps: ${log.sets.join(", ")}, target: ${log.target_reps}, RPE: ${log.rpe}, weight: ${log.weight_kg}kg${log.pain_flag ? `, ⚠️ PAIN FLAGGED${log.pain_description ? ` (${log.pain_description})` : ""}` : ""}
`).join("")}

${inputs.sessionDetails && inputs.sessionDetails.length > 0 ? `
SESSION DETAILS:
${inputs.sessionDetails.map((session) => `
- ${session.day}: ${session.duration_minutes || "N/A"} minutes, ${session.exercise_count} exercises, ${session.total_sets} total sets, Location verified: ${session.location_verified ? "Yes" : "No"}
`).join("")}

Total Training Time: ${inputs.sessionDetails.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)} minutes
Average Session Duration: ${Math.round(inputs.sessionDetails.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / inputs.sessionDetails.length)} minutes
Location Verification Rate: ${Math.round((inputs.sessionDetails.filter(s => s.location_verified).length / inputs.sessionDetails.length) * 100)}%
` : ""}

${inputs.previousWeekReview ? `
PREVIOUS WEEK COMPARISON:
Previous Adherence: ${inputs.previousWeekReview.weekly_summary?.adherence_percent || "N/A"}%
Previous Fatigue: ${inputs.previousWeekReview.weekly_summary?.fatigue_index || "N/A"}/100
Previous Key Progress: ${inputs.previousWeekReview.weekly_summary?.key_progress?.join(", ") || "None"}

Compare current week to previous week and note improvements or regressions.
` : ""}

RULES:

Schedule Decision:
${inputs.userScheduleModified
    ? "- User manually rearranged days → keep them (schedule_source: 'user_modified')"
    : "- Reuse previous schedule (schedule_source: 'reused_previous')"}

Fatigue Rules:
${inputs.fatigueIndex >= 85
    ? "- Fatigue ≥85 → MANDATORY deload week (reduce volume by 30-40%)"
    : inputs.fatigueIndex >= 70
    ? "- Fatigue 70-85 → reduce volume by ~20%"
    : "- Fatigue <70 → normal progression allowed"}

Progressive Overload:
- All target reps + RPE ≤ 8 → increase weight next week
- RPE ≥ 9 → maintain load
- Missed reps or pain → reduce volume
- Never increase weight and volume in the same week

Key Progress: Identify improvements in strength, consistency, or form. Compare to previous week if available.
Issues Detected: Identify problems like missed sessions, high fatigue, or form issues.

Fitness Fact: Include ONE interesting, relevant fact about fitness, body adaptation, or training science that relates to the user's progress this week. Make it educational and motivating. Examples: "Muscle protein synthesis peaks 24-48 hours after resistance training", "Sleep quality directly impacts recovery and strength gains", "Progressive overload triggers muscle adaptation within 2-3 weeks".

RETURN JSON ONLY.`;

}
