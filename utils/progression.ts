import { ExerciseLog } from "@/types";

/**
 * Progressive Overload Rules (STRICT):
 * - All target reps + RPE ≤ 8 → increase weight next week
 * - RPE ≥ 9 → maintain load
 * - Missed reps or pain → reduce volume
 * - Never increase weight and volume in the same week
 */
export interface ProgressionDecision {
  action: "increase_weight" | "maintain" | "reduce_volume";
  reason: string;
  suggested_weight_change_kg?: number;
  suggested_volume_change_percent?: number;
}

export function calculateProgression(exerciseLog: ExerciseLog): ProgressionDecision {
  const { sets, target_reps, rpe, pain_flag } = exerciseLog;

  // Safety first: pain or injury
  if (pain_flag) {
    return {
      action: "reduce_volume",
      reason: "Pain or injury detected - reduce volume for safety",
      suggested_volume_change_percent: -20,
    };
  }

  // Parse target reps (could be "8-10" or "8")
  const targetRepsNum = parseInt(target_reps.split("-")[0] || target_reps);

  // Check if all sets hit target reps
  const allSetsHitTarget = sets.every((reps) => reps >= targetRepsNum);

  // High RPE (≥9) = maintain load
  if (rpe >= 9) {
    return {
      action: "maintain",
      reason: `High RPE (${rpe}) - maintain current load to prevent overreaching`,
    };
  }

  // All sets hit target + low RPE (≤8) = increase weight
  if (allSetsHitTarget && rpe <= 8) {
    // Calculate weight increase (conservative: 2.5-5kg for compound, 1-2.5kg for isolation)
    const isCompound = ["squat", "deadlift", "bench", "press", "row", "pull"].some((word) =>
      exerciseLog.exercise.toLowerCase().includes(word)
    );
    const weightIncrease = isCompound ? 2.5 : 1.25;

    return {
      action: "increase_weight",
      reason: `All sets completed with RPE ${rpe} - ready for progressive overload`,
      suggested_weight_change_kg: weightIncrease,
    };
  }

  // Missed reps = reduce volume
  if (!allSetsHitTarget) {
    return {
      action: "reduce_volume",
      reason: `Missed target reps - reduce volume to build back up`,
      suggested_volume_change_percent: -10,
    };
  }

  // Default: maintain
  return {
    action: "maintain",
    reason: "Continue current load",
  };
}
