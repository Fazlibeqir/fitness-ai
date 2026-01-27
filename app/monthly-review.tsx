import { MonthlyReview } from "@/types";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildMonthlyReviewPrompt } from "../prompts/monthlyReview.prompt";
import { callOpenRouter } from "../services/openrouter";
import { supabase } from "../services/supabase";
import { extractJson } from "../utils/json";
import { scheduleMonthlyReviewNotification } from "../services/notifications";

export default function MonthlyReviewScreen() {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<MonthlyReview | null>(null);
  const [msg, setMsg] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");

  const runMonthlyReview = async () => {
    if (!currentWeight) {
      setMsg("Please enter your current weight");
      return;
    }

    setLoading(true);
    setMsg("Gathering monthly data...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("Not logged in");
      setLoading(false);
      return;
    }

    try {
      // Get starting weight from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("weight_kg")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setMsg("Profile not found");
        setLoading(false);
        return;
      }

      const startingWeight = profile.weight_kg;
      const currentWeightNum = parseFloat(currentWeight);

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

      // Calculate trends (simplified - would need more data)
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

      setMsg("Generating monthly review...");

      const prompt = buildMonthlyReviewPrompt({
        startingWeight,
        currentWeight: currentWeightNum,
        monthlyAdherence: avgAdherence,
        strengthTrend,
        fatigueTrend,
        adherenceTrend,
        previousMonthReview: previousMonthReview?.review_json || null,
        monthlyStats: monthlyStats,
        exerciseLogs: allExerciseLogs,
      });

      const llmResponse = await callOpenRouter(prompt, undefined, 0.2);
      const reviewData: MonthlyReview = extractJson(llmResponse);

      setReview(reviewData);
      setMsg("");

      // Save review
      const monthStart = new Date();
      monthStart.setDate(1); // First day of month
      await supabase.from("monthly_reviews").insert({
        user_id: user.id,
        month_start: monthStart.toISOString().slice(0, 10),
        review_json: reviewData,
      });

      // Update profile weight
      await supabase
        .from("profiles")
        .update({ weight_kg: currentWeightNum })
        .eq("user_id", user.id);
    } catch (error: any) {
      setMsg(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustments = async () => {
    if (!review) return;

    // Schedule next month's notification
    await scheduleMonthlyReviewNotification();

    Alert.alert(
      "Adjustments Applied",
      `Calories: ${review.recommended_adjustments.calories_percent_change > 0 ? "+" : ""}${review.recommended_adjustments.calories_percent_change}%\nTraining Volume: ${review.recommended_adjustments.training_volume_percent_change > 0 ? "+" : ""}${review.recommended_adjustments.training_volume_percent_change}%`,
      [
        {
          text: "OK",
          onPress: () => (router.replace as any)("/(tabs)/plan"),
        },
      ]
    );
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
        Monthly Review
      </Text>

      <Text style={{ color: "#fff", marginBottom: 6 }}>Current Weight (kg)</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          backgroundColor: "#fff",
          color: "#000",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 16,
        }}
        value={currentWeight}
        onChangeText={setCurrentWeight}
        keyboardType="numeric"
        placeholder="Enter current weight"
      />

        <Button title="Run Monthly Review" onPress={runMonthlyReview} icon="analytics" disabled={loading} />

      {loading && <Text style={{ color: "#bbb", marginTop: 16 }}>{msg}</Text>}

      {review && (
        <>
          <View style={{ marginTop: 24, marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              Monthly Summary
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Weight Change: {review.monthly_summary.weight_change_kg > 0 ? "+" : ""}
              {review.monthly_summary.weight_change_kg.toFixed(1)}kg ({review.monthly_summary.weight_change_percent > 0 ? "+" : ""}
              {review.monthly_summary.weight_change_percent.toFixed(1)}%)
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Strength Trend: {review.monthly_summary.strength_trend}
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Adherence Trend: {review.monthly_summary.adherence_trend}
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Fatigue Trend: {review.monthly_summary.fatigue_trend}
            </Text>

            {review.monthly_summary.fitness_fact && (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: "#007AFF20", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#007AFF" }}>
                <Text style={{ color: "#007AFF", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>💡 FITNESS FACT</Text>
                <Text style={{ color: "#fff", fontSize: 14 }}>{review.monthly_summary.fitness_fact}</Text>
              </View>
            )}
          </View>

          <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
              Recommended Adjustments
            </Text>
            <Text style={{ color: "#ddd", marginBottom: 4 }}>
              Calories: {review.recommended_adjustments.calories_percent_change > 0 ? "+" : ""}
              {review.recommended_adjustments.calories_percent_change}%
            </Text>
            <Text style={{ color: "#ddd" }}>
              Training Volume: {review.recommended_adjustments.training_volume_percent_change > 0 ? "+" : ""}
              {review.recommended_adjustments.training_volume_percent_change}%
            </Text>
          </View>

          <Button title="Apply Adjustments" onPress={applyAdjustments} icon="checkmark-circle" color="#34C759" />
        </>
      )}

      {msg && !loading && <Text style={{ color: "#bbb", marginTop: 16 }}>{msg}</Text>}
    </ScrollView>
  );
}
