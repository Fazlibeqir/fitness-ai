import { FatigueInputs } from "@/types";

/**
 * Calculate fatigue index (0-100) based on multiple factors
 * Rules:
 * - 85+ → mandatory deload week
 * - 70-85 → reduce volume by ~20%
 * - <70 → normal progression allowed
 */
export function calculateFatigueIndex(inputs: FatigueInputs): number {
  let fatigue = 0;

  // RPE trends (average of last 7 sessions, higher RPE = more fatigue)
  if (inputs.rpe_trends.length > 0) {
    const avgRPE = inputs.rpe_trends.reduce((a, b) => a + b, 0) / inputs.rpe_trends.length;
    // RPE 1-10 maps to 0-50 fatigue points
    fatigue += (avgRPE / 10) * 50;
  }

  // Sleep deficit (7-9 hours optimal, less = more fatigue)
  if (inputs.sleep_hours.length > 0) {
    const avgSleep = inputs.sleep_hours.reduce((a, b) => a + b, 0) / inputs.sleep_hours.length;
    if (avgSleep < 6) {
      fatigue += 30;
    } else if (avgSleep < 7) {
      fatigue += 15;
    } else if (avgSleep >= 9) {
      fatigue += 5; // Oversleeping can indicate fatigue
    }
  }

  // Missed sessions (indicates accumulated fatigue or burnout)
  fatigue += inputs.missed_sessions * 5; // 5 points per missed session

  // Soreness reports (0-10 scale, higher = more fatigue)
  if (inputs.soreness_reports.length > 0) {
    const avgSoreness = inputs.soreness_reports.reduce((a, b) => a + b, 0) / inputs.soreness_reports.length;
    // Soreness 0-10 maps to 0-20 fatigue points
    fatigue += (avgSoreness / 10) * 20;
  }

  return Math.min(100, Math.max(0, Math.round(fatigue)));
}
