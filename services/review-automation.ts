import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";
import { buildWeeklyReviewPrompt } from "../prompts/weeklyReview.prompt";
import { buildMonthlyReviewPrompt } from "../prompts/monthlyReview.prompt";
import { callOpenRouter } from "./openrouter";
import { extractJson } from "../utils/json";
import { calculateFatigueIndex } from "../utils/fatigue";
import { scheduleWeeklyReviewNotification, scheduleMonthlyReviewNotification, scheduleSessionReminders } from "./notifications";

/**
 * Handle notification-triggered weekly review
 */
export async function handleWeeklyReviewNotification() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️ No user logged in for weekly review");
      return;
    }

    console.log("🔄 Auto-running weekly review...");

    // Get current week's plan
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const { data: planData } = await supabase
      .from("training_plans")
      .select("plan_json")
      .eq("user_id", user.id)
      .eq("week_start", weekStartStr)
      .single();

    if (!planData) {
      console.log("⚠️ No plan found for this week");
      return;
    }

    const plan = planData.plan_json;
    const plannedSessions = plan.weekly_plan.days.length;

    // Get session logs for this week with all details
    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", weekStartStr)
      .order("start_time", { ascending: true });

    const completedSessions = sessionLogs?.filter((s) => s.state === "COMPLETED").length || 0;
    const exerciseLogs: any[] = [];
    const sessionDetails: any[] = [];

    sessionLogs?.forEach((log) => {
      if (log.state === "COMPLETED") {
        // Collect all exercise data
        if (log.exercises && Array.isArray(log.exercises)) {
          exerciseLogs.push(...log.exercises);
        }

        // Collect session metadata
        sessionDetails.push({
          day: log.day,
          start_time: log.start_time,
          end_time: log.end_time,
          duration_minutes: log.duration_minutes,
          location_verified: log.location_verified,
          exercise_count: log.exercises?.length || 0,
          total_sets: log.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0) || 0,
          exercises: log.exercises || [],
        });
      }
    });

    // Get previous week's review for comparison
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

    const { data: previousReview } = await supabase
      .from("weekly_reviews")
      .select("review_json")
      .eq("user_id", user.id)
      .eq("week_start", lastWeekStartStr)
      .single();

    // Calculate fatigue
    const rpeTrends = exerciseLogs.map((log) => log.rpe || 5);
    const { data: profile } = await supabase
      .from("profiles")
      .select("average_sleep_hours")
      .eq("user_id", user.id)
      .single();

    const sleepHours = profile?.average_sleep_hours ? [profile.average_sleep_hours] : [7];
    const missedSessions = plannedSessions - completedSessions;

    const fatigueIndex = calculateFatigueIndex({
      rpe_trends: rpeTrends,
      sleep_hours: sleepHours,
      missed_sessions: missedSessions,
      soreness_reports: [],
    });

    // Build review prompt with previous week data and comprehensive session details
    const prompt = buildWeeklyReviewPrompt({
      plannedSessions,
      completedSessions,
      exerciseLogs,
      fatigueIndex,
      userScheduleModified: false,
      currentTrainingDays: plan.weekly_plan.days.map((d: any) => d.day),
      previousWeekReview: previousReview?.review_json || null,
      sessionDetails: sessionDetails,
    });

    const llmResponse = await callOpenRouter(prompt, undefined, 0.2);
    const reviewData = extractJson(llmResponse);

    // Save review
    await supabase.from("weekly_reviews").insert({
      user_id: user.id,
      week_start: weekStartStr,
      review_json: reviewData,
    });

    // Auto-accept and create next week's plan
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(weekStart.getDate() + 7);
    nextWeekStart.setHours(0, 0, 0, 0);

    await supabase.from("training_plans").insert({
      user_id: user.id,
      week_start: nextWeekStart.toISOString().slice(0, 10),
      plan_json: {
        weekly_plan: reviewData.next_week_plan,
      },
    });

    // Schedule notifications for next week
    const trainingDays = reviewData.next_week_plan.days.map((d: any) => d.day);
    await scheduleSessionReminders(trainingDays);
    await scheduleWeeklyReviewNotification();

    console.log("✅ Weekly review completed and next week's plan created");
  } catch (error) {
    console.error("❌ Error in auto weekly review:", error);
  }
}

/**
 * Handle notification-triggered monthly review
 */
export async function handleMonthlyReviewNotification() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️ No user logged in for monthly review");
      return;
    }

    console.log("🔄 Auto-running monthly review...");

    // Get profile for current weight
    const { data: profile } = await supabase
      .from("profiles")
      .select("weight_kg")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      console.log("⚠️ Profile not found");
      return;
    }

    const currentWeight = profile.weight_kg;
    const startingWeight = profile.weight_kg; // Would ideally track starting weight separately

    // Get monthly data (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: weeklyReviews } = await supabase
      .from("weekly_reviews")
      .select("review_json")
      .eq("user_id", user.id)
      .gte("week_start", fourWeeksAgo.toISOString().slice(0, 10))
      .order("week_start", { ascending: true });

    // Get previous month's review for comparison
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const { data: previousMonthReview } = await supabase
      .from("monthly_reviews")
      .select("review_json")
      .eq("user_id", user.id)
      .eq("month_start", lastMonthStart.toISOString().slice(0, 10))
      .single();

    // Calculate trends
    const adherenceTrends = weeklyReviews?.map((r) => r.review_json.weekly_summary.adherence_percent) || [];
    const fatigueTrends = weeklyReviews?.map((r) => r.review_json.weekly_summary.fatigue_index) || [];

    const avgAdherence = adherenceTrends.length > 0
      ? adherenceTrends.reduce((a, b) => a + b, 0) / adherenceTrends.length
      : 0;

    const adherenceTrend: "up" | "stable" | "down" =
      adherenceTrends.length >= 2
        ? adherenceTrends[adherenceTrends.length - 1] > adherenceTrends[0]
          ? "up"
          : adherenceTrends[adherenceTrends.length - 1] < adherenceTrends[0]
          ? "down"
          : "stable"
        : "stable";

    const fatigueTrend: "up" | "stable" | "down" =
      fatigueTrends.length >= 2
        ? fatigueTrends[fatigueTrends.length - 1] > fatigueTrends[0]
          ? "up"
          : fatigueTrends[fatigueTrends.length - 1] < fatigueTrends[0]
          ? "down"
          : "stable"
        : "stable";

    // Get all session logs for the month to analyze strength trends
    const { data: monthlySessionLogs } = await supabase
      .from("session_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("state", "COMPLETED")
      .gte("start_time", fourWeeksAgo.toISOString().slice(0, 10))
      .order("start_time", { ascending: true });

    // Calculate strength trend from exercise logs
    const allExerciseLogs: any[] = [];
    monthlySessionLogs?.forEach((log) => {
      if (log.exercises && Array.isArray(log.exercises)) {
        allExerciseLogs.push(...log.exercises);
      }
    });

    // Analyze strength progression (weight increases over time)
    const strengthTrend: "up" | "stable" | "down" = (() => {
      if (allExerciseLogs.length < 2) return "stable";
      
      // Group by exercise name and track weight progression
      const exerciseWeights: { [key: string]: number[] } = {};
      allExerciseLogs.forEach((log) => {
        if (log.exercise && log.weight_kg > 0) {
          if (!exerciseWeights[log.exercise]) {
            exerciseWeights[log.exercise] = [];
          }
          exerciseWeights[log.exercise].push(log.weight_kg);
        }
      });

      // Check if weights are generally increasing
      let increases = 0;
      let decreases = 0;
      Object.values(exerciseWeights).forEach((weights) => {
        if (weights.length >= 2) {
          const firstHalf = weights.slice(0, Math.floor(weights.length / 2));
          const secondHalf = weights.slice(Math.floor(weights.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          if (secondAvg > firstAvg * 1.05) increases++;
          else if (secondAvg < firstAvg * 0.95) decreases++;
        }
      });

      if (increases > decreases) return "up";
      if (decreases > increases) return "down";
      return "stable";
    })();

    // Collect monthly session statistics
    const monthlyStats = {
      total_sessions: monthlySessionLogs?.length || 0,
      total_duration_minutes: monthlySessionLogs?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0,
      total_exercises: allExerciseLogs.length,
      location_verified_sessions: monthlySessionLogs?.filter(s => s.location_verified).length || 0,
      exercises_by_name: {} as { [key: string]: number },
    };

    allExerciseLogs.forEach((log) => {
      if (log.exercise) {
        monthlyStats.exercises_by_name[log.exercise] = (monthlyStats.exercises_by_name[log.exercise] || 0) + 1;
      }
    });

    // Build review prompt with previous month data and comprehensive stats
    const prompt = buildMonthlyReviewPrompt({
      startingWeight,
      currentWeight,
      monthlyAdherence: avgAdherence,
      strengthTrend,
      fatigueTrend,
      adherenceTrend,
      previousMonthReview: previousMonthReview?.review_json || null,
      monthlyStats: monthlyStats,
      exerciseLogs: allExerciseLogs,
    });

    const llmResponse = await callOpenRouter(prompt, undefined, 0.2);
    const reviewData = extractJson(llmResponse);

    // Save review
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    await supabase.from("monthly_reviews").insert({
      user_id: user.id,
      month_start: monthStart.toISOString().slice(0, 10),
      review_json: reviewData,
    });

    // Update profile weight if changed
    if (reviewData.monthly_summary.weight_change_kg !== 0) {
      await supabase
        .from("profiles")
        .update({ weight_kg: currentWeight })
        .eq("user_id", user.id);
    }

    // Schedule next month's notification
    await scheduleMonthlyReviewNotification();

    console.log("✅ Monthly review completed");
  } catch (error) {
    console.error("❌ Error in auto monthly review:", error);
  }
}

/**
 * Setup notification handlers
 */
export function setupReviewNotificationHandlers() {
  // Handle notification received while app is in foreground
  Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    if (data?.type === "weekly_review") {
      handleWeeklyReviewNotification();
    } else if (data?.type === "monthly_review") {
      handleMonthlyReviewNotification();
    }
  });

  // Handle notification tapped
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === "weekly_review") {
      handleWeeklyReviewNotification();
    } else if (data?.type === "monthly_review") {
      handleMonthlyReviewNotification();
    }
  });
}
