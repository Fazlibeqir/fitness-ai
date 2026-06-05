import { UserProfile } from "@/types";
import { MASTER_META_PROMPT } from "./master.prompt";
import { WEEKLY_PLAN_PROMPT_VERSION } from "./versions";

export function buildWeeklyPlanPrompt(profile: UserProfile) {
  return `${MASTER_META_PROMPT}

PROMPT_VERSION: ${WEEKLY_PLAN_PROMPT_VERSION}

You are now in PHASE 2 — WEEKLY TRAINING & NUTRITION PLAN.

Your task is to OUTPUT VALID JSON ONLY.

ABSOLUTE RULES:
- Output MUST start with { and end with }
- NO markdown
- NO comments
- NO explanations
- NO trailing text
- NO backticks

If you break JSON, the system will reject your output.

REQUIRED JSON SCHEMA (MUST MATCH EXACTLY):

{
  "profile_summary": {
    "age": number,
    "height_cm": number,
    "weight_kg": number,
    "goal": string,
    "experience_level": string
  },
  "weekly_plan": {
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
  },
  "nutrition_plan": {
    "daily_calories": number,
    "macros": {
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  }
}

PLANNING RULES:
- 3–5 training days (based on user's training_days_per_week: ${profile.training_days_per_week})
- Beginner-safe volume unless advanced (level: ${profile.experience_level})
- ${profile.gym_access ? "Gym-based" : "Home-based"} exercises
- No extreme calorie deficits or bulks
- Exercises must be realistic and progressive
- Session duration target: ${profile.session_duration_minutes} minutes

USER PROFILE DATA:

Goals:
- Primary goal: ${profile.goal}
- Timeframe: ${profile.goal_timeframe_weeks || "Not specified"} weeks

Body & Health:
- Age: ${profile.age}
- Sex: ${profile.sex}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Injury status: ${profile.injury_status ? `Yes - ${profile.injury_description || "Not described"}` : "No"}
${profile.medical_limitations ? `- Medical limitations: ${profile.medical_limitations}` : ""}

Experience & Availability:
- Training level: ${profile.experience_level}
- Gym access: ${profile.gym_access ? "Yes" : "No"}
- Available training days per week: ${profile.training_days_per_week}
- Session duration: ${profile.session_duration_minutes} minutes

Nutrition Preferences:
- Diet type: ${profile.diet_type}
${profile.allergies_restrictions ? `- Allergies/restrictions: ${profile.allergies_restrictions}` : ""}
- Meals per day: ${profile.meals_per_day}
- Budget sensitivity: ${profile.budget_sensitivity}

Lifestyle & Recovery:
- Average sleep: ${profile.average_sleep_hours} hours
- Job activity: ${profile.job_activity_level}
- Daily movement: ${profile.daily_movement_level}

CALCULATE NUTRITION:
- Base calories on goal: ${profile.goal}
- Protein: 1.6-2.2g per kg body weight for muscle gain/maintenance
- Adjust carbs and fats based on diet type: ${profile.diet_type}
- Ensure safe deficit/surplus (max ±500 kcal for beginners, ±750 for advanced)

RETURN JSON ONLY.
NO OTHER TEXT.`;

}
