import { WeeklyReview } from "@/types";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildWeeklyReviewPrompt } from "../prompts/weeklyReview.prompt";
import { WEEKLY_REVIEW_PROMPT_VERSION } from "../prompts/versions";
import { callOpenRouter } from "../services/openrouter";
import { recordAIReviewSnapshot } from "../services/history";
import { supabase } from "../services/supabase";
import { extractJson } from "../utils/json";
import { calculateFatigueIndex } from "../utils/fatigue";
import { scheduleWeeklyReviewNotification, scheduleSessionReminders } from "../services/notifications";
import { validateWeeklyReview } from "../utils/ai-validation";

export default function WeeklyReviewScreen() {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [msg, setMsg] = useState("");

  const runWeeklyReview = async () => {
    setLoading(true);
    setMsg("Calculating fatigue and gathering data...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("Not logged in");
      setLoading(false);
      return;
    }

    try {
      // Get current week's plan
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().slice(0, 10);

      const { data: planData } = await supabase
        .from("training_plans")
        .select("plan_json")
        .eq("user_id", user.id)
        .eq("week_start", weekStartStr)
        .single();

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

      if (!planData) {
        setMsg("No plan found for this week");
        setLoading(false);
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
        soreness_reports: [], // Would need user input for this
      });

      setMsg("Generating weekly review...");

      // Build review prompt with previous week data and comprehensive session details
      const prompt = buildWeeklyReviewPrompt({
        plannedSessions,
        completedSessions,
        exerciseLogs,
        fatigueIndex,
        userScheduleModified: false, // Would need to track this
        currentTrainingDays: plan.weekly_plan.days.map((d: any) => d.day),
        previousWeekReview: previousReview?.review_json || null,
        sessionDetails: sessionDetails,
      });

      const llmResponse = await callOpenRouter(prompt, undefined, 0.2);
      const reviewData: WeeklyReview = validateWeeklyReview(extractJson(llmResponse));

      setReview(reviewData);
      setMsg("");

      // Save review
      await supabase.from("weekly_reviews").insert({
        user_id: user.id,
        week_start: weekStartStr,
        review_json: reviewData,
      });

      await recordAIReviewSnapshot({
        user_id: user.id,
        review_type: "weekly",
        period_start: weekStartStr,
        prompt_version: WEEKLY_REVIEW_PROMPT_VERSION,
        review_json: reviewData,
      });
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const acceptNextWeekPlan = async () => {
    if (!review) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + (7 - nextWeekStart.getDay()));

    await supabase.from("training_plans").insert({
      user_id: user.id,
      week_start: nextWeekStart.toISOString().slice(0, 10),
      plan_json: {
        weekly_plan: review.next_week_plan,
      },
    });

    // Schedule notifications for next week
    const trainingDays = review.next_week_plan.days.map((d: any) => d.day);
    await scheduleSessionReminders(trainingDays);
    await scheduleWeeklyReviewNotification();

    Alert.alert("Success", "Next week's plan saved! Notifications scheduled.", [
      {
        text: "OK",
        onPress: () => (router.replace as any)("/(tabs)/plan"),
      },
    ]);
  };

  const Button = ({ title, onPress, icon, color = "#007AFF" }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: color,
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {icon && <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{title}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    runWeeklyReview();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000", padding: 24 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#fff",
          marginBottom: 24,
        }}
      >
        Weekly Review
      </Text>

      {loading && <Text style={{ color: "#bbb" }}>{msg}</Text>}

      {review && (
        <>
          <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              Summary
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Adherence: {review.weekly_summary.adherence_percent}%
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Fatigue Index: {review.weekly_summary.fatigue_index}/100
            </Text>

            {review.weekly_summary.key_progress.length > 0 && (
              <>
                <Text style={{ color: "#fff", marginTop: 12, marginBottom: 8 }}>Key Progress:</Text>
                {review.weekly_summary.key_progress.map((item, i) => (
                  <Text key={i} style={{ color: "#ddd", marginLeft: 8 }}>
                    • {item}
                  </Text>
                ))}
              </>
            )}

            {review.weekly_summary.issues_detected.length > 0 && (
              <>
                <Text style={{ color: "#fff", marginTop: 12, marginBottom: 8 }}>Issues Detected:</Text>
                {review.weekly_summary.issues_detected.map((item, i) => (
                  <Text key={i} style={{ color: "#ff6b6b", marginLeft: 8 }}>
                    • {item}
                  </Text>
                ))}
              </>
            )}

            {review.weekly_summary.fitness_fact && (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: "#007AFF20", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#007AFF" }}>
                <Text style={{ color: "#007AFF", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>💡 FITNESS FACT</Text>
                <Text style={{ color: "#fff", fontSize: 14 }}>{review.weekly_summary.fitness_fact}</Text>
              </View>
            )}
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              Next Week Plan
            </Text>
            {review.next_week_plan.days.map((day) => (
              <View key={day.day} style={{ marginBottom: 16 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
                  {day.day} — {day.focus}
                </Text>
                {day.exercises.map((ex, i) => (
                  <Text key={i} style={{ color: "#ddd", marginLeft: 8, marginBottom: 2 }}>
                    • {ex.name}: {ex.sets} × {ex.reps}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          <Button title="Accept Next Week Plan" onPress={acceptNextWeekPlan} icon="checkmark-circle" color="#34C759" />
        </>
      )}

      {msg && !loading && <Text style={{ color: "#bbb", marginTop: 16 }}>{msg}</Text>}
    </ScrollView>
  );
}
