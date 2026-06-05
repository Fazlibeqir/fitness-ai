import { YearlyReview } from "@/types";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { buildYearlyReviewPrompt } from "../prompts/yearlyReview.prompt";
import { YEARLY_REVIEW_PROMPT_VERSION } from "../prompts/versions";
import { callStructuredOpenRouter } from "../services/openrouter";
import { supabase } from "../services/supabase";
import { extractJson } from "../utils/json";
import { validateYearlyReview } from "../utils/ai-validation";
import { recordAIReviewSnapshot, recordBodyMetricsSnapshot } from "../services/history";
import { scheduleYearlyReviewNotification } from "../services/notifications";
import { ActionCard, EmptyState, LoadingState, MetricCard, ScreenCard, SectionTitle, StatusBadge } from "@/components/ui/fitness";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function YearlyReviewScreen() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [review, setReview] = useState<YearlyReview | null>(null);
  const [message, setMessage] = useState("Loading yearly progress...");
  const [stats, setStats] = useState<any>(null);

  const yearStart = useMemo(() => {
    const date = new Date();
    return new Date(date.getFullYear(), 0, 1);
  }, []);

  const loadYearlyData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view your yearly review.");
        setLoading(false);
        return;
      }

      const [{ data: profile }, { data: weeklyReviews }, { data: monthlyReviews }, { data: sessions }] =
        await Promise.all([
          supabase.from("profiles").select("weight_kg").eq("user_id", user.id).single(),
          supabase.from("weekly_reviews").select("week_start, review_json").eq("user_id", user.id).gte("week_start", yearStart.toISOString().slice(0, 10)).order("week_start", { ascending: true }),
          supabase.from("monthly_reviews").select("month_start, review_json").eq("user_id", user.id).gte("month_start", yearStart.toISOString().slice(0, 10)).order("month_start", { ascending: true }),
          supabase.from("session_logs").select("start_time, state, duration_minutes").eq("user_id", user.id).gte("start_time", yearStart.toISOString()).order("start_time", { ascending: true }),
        ]);

      const completedSessions = (sessions || []).filter((session) => session.state === "COMPLETED");
      const activeWeeks = new Set(
        completedSessions.map((session) => {
          const date = new Date(session.start_time || "");
          const week = new Date(date);
          week.setDate(date.getDate() - date.getDay());
          week.setHours(0, 0, 0, 0);
          return week.toISOString().slice(0, 10);
        })
      ).size;

      const weeklyAdherence = (weeklyReviews || []).map((review) => review.review_json?.weekly_summary?.adherence_percent || 0);
      const averageAdherence = weeklyAdherence.length
        ? weeklyAdherence.reduce((sum, value) => sum + value, 0) / weeklyAdherence.length
        : 0;

      const monthlyStrengths = (monthlyReviews || []).map((review) => review.review_json?.monthly_summary?.strength_trend || "stable");
      const monthlyFatigue = (monthlyReviews || []).map((review) => review.review_json?.monthly_summary?.fatigue_trend || "stable");
      const strengthTrend = deriveTrend(monthlyStrengths);
      const fatigueTrend = deriveTrend(monthlyFatigue);

      const sortedMonths = (monthlyReviews || []).map((entry) => ({
        month: new Date(`${entry.month_start}T00:00:00`),
        review: entry.review_json,
      }));

      const bestMonths = sortedMonths
        .filter((entry) => entry.review?.monthly_summary?.adherence_trend === "up")
        .map((entry) => monthNames[entry.month.getMonth()]);
      const weakestMonths = sortedMonths
        .filter((entry) => entry.review?.monthly_summary?.fatigue_trend === "up" || entry.review?.monthly_summary?.adherence_trend === "down")
        .map((entry) => monthNames[entry.month.getMonth()]);

      setStats({
        startWeight: profile?.weight_kg || 0,
        currentWeight: profile?.weight_kg || 0,
        totalSessionsCompleted: completedSessions.length,
        totalActiveWeeks: activeWeeks,
        averageAdherence,
        strengthTrend,
        fatigueTrend,
        bestMonths: bestMonths.length ? bestMonths : monthNames.slice(0, 1),
        weakestMonths: weakestMonths.length ? weakestMonths : monthNames.slice(0, 1),
        weeklyReviews: weeklyReviews || [],
        monthlyReviews: monthlyReviews || [],
      });

      setMessage("Your yearly summary is ready.");
    } catch (error: any) {
      setMessage(error.message || "Failed to load yearly data.");
    } finally {
      setLoading(false);
    }
  }, [yearStart]);

  useEffect(() => {
    loadYearlyData();
  }, [loadYearlyData]);

  const runYearlyReview = async () => {
    if (!stats) return;
    setRunning(true);
    setMessage("Generating your yearly plan...");

    try {
      const prompt = buildYearlyReviewPrompt({
        startWeight: stats.startWeight,
        currentWeight: stats.currentWeight,
        totalSessionsCompleted: stats.totalSessionsCompleted,
        totalActiveWeeks: stats.totalActiveWeeks,
        averageAdherence: stats.averageAdherence,
        strengthTrend: stats.strengthTrend,
        fatigueTrend: stats.fatigueTrend,
        bestMonths: stats.bestMonths,
        weakestMonths: stats.weakestMonths,
        monthlyReviews: stats.monthlyReviews.map((entry: any) => entry.review_json),
        weeklyReviews: stats.weeklyReviews.map((entry: any) => entry.review_json),
      });

      const llmResponse = await callStructuredOpenRouter(prompt, undefined, 0.2);
      const reviewData = validateYearlyReview(extractJson(llmResponse));
      setReview(reviewData);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const year = new Date().getFullYear();
        await supabase.from("yearly_reviews").upsert(
          {
            user_id: user.id,
            year_start: `${year}-01-01`,
            review_json: reviewData,
          },
          { onConflict: "user_id,year_start" }
        );

        await recordAIReviewSnapshot({
          user_id: user.id,
          review_type: "yearly",
          period_start: `${year}-01-01`,
          prompt_version: YEARLY_REVIEW_PROMPT_VERSION,
          review_json: reviewData,
        });

        await recordBodyMetricsSnapshot({
          user_id: user.id,
          weight_kg: stats.currentWeight,
          source: "system",
        });
      }

      await scheduleYearlyReviewNotification();
      setMessage("");
    } catch (error: any) {
      setMessage(error.message || "Failed to generate yearly review.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <LoadingState label="Preparing your yearly review..." />;
  }

  if (!stats) {
    return (
      <EmptyState
        title="No yearly data yet"
        description="Keep training and logging sessions to unlock your yearly progress summary."
        actionLabel="Go to Plan"
        onAction={() => (router.replace as any)("/(tabs)/plan")}
      />
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <View style={{ marginBottom: 18 }}>
        <StatusBadge label="Yearly review" color="#af52de" />
        <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 12 }}>
          Long-term progress
        </Text>
        <Text style={{ color: "#9ca3af", marginTop: 8, lineHeight: 22 }}>
          See your year in training, identify the strongest months, and shape the next year.
        </Text>
      </View>

      <SectionTitle title="Year at a glance" subtitle="Core numbers from your training history" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        <MetricCard label="Sessions" value={stats.totalSessionsCompleted} icon="barbell" tint="#34C759" />
        <MetricCard label="Active weeks" value={stats.totalActiveWeeks} icon="calendar" tint="#007AFF" />
        <MetricCard label="Adherence" value={`${stats.averageAdherence.toFixed(0)}%`} icon="trending-up" tint="#FF9500" />
        <MetricCard label="Trend" value={stats.strengthTrend.toUpperCase()} icon="analytics" tint="#af52de" />
      </View>

      <ScreenCard>
        <SectionTitle title="AI yearly summary" subtitle="Generate a long-term coaching snapshot" />
        {review ? (
          <>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              {review.yearly_summary.fitness_fact || "Your plan stayed consistent and adaptable this year."}
            </Text>
            <Text style={{ color: "#9ca3af", lineHeight: 22, marginBottom: 12 }}>
              {review.next_year_plan.focus}
            </Text>
            <Text style={{ color: "#fff", fontWeight: "700", marginBottom: 8 }}>Priorities</Text>
            {review.next_year_plan.priorities.map((priority) => (
              <Text key={priority} style={{ color: "#d1d5db", marginBottom: 6 }}>
                • {priority}
              </Text>
            ))}
            <Text style={{ color: "#fff", fontWeight: "700", marginTop: 14, marginBottom: 8 }}>
              Nutrition direction
            </Text>
            <Text style={{ color: "#d1d5db" }}>{review.next_year_plan.nutrition_direction}</Text>
          </>
        ) : (
          <ActionCard
            title="Generate yearly review"
            description="Ask the AI to turn the full year into a realistic next-year plan."
            icon="sparkles"
            tint="#af52de"
            onPress={runYearlyReview}
          />
        )}
      </ScreenCard>

      <SectionTitle title="Best and hardest months" subtitle="Patterns worth repeating or fixing" />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <ScreenCard style={{ flex: 1 }}>
          <Text style={{ color: "#34C759", fontWeight: "700", marginBottom: 8 }}>Best months</Text>
          <Text style={{ color: "#d1d5db", lineHeight: 22 }}>{stats.bestMonths.join(", ")}</Text>
        </ScreenCard>
        <ScreenCard style={{ flex: 1 }}>
          <Text style={{ color: "#fb7185", fontWeight: "700", marginBottom: 8 }}>Hardest months</Text>
          <Text style={{ color: "#d1d5db", lineHeight: 22 }}>{stats.weakestMonths.join(", ")}</Text>
        </ScreenCard>
      </View>

      <ScreenCard>
        <SectionTitle title="Review controls" subtitle="Commit the yearly summary and keep reminders active" />
        <TouchableOpacity
          onPress={runYearlyReview}
          disabled={running}
          style={{
            backgroundColor: running ? "#374151" : "#af52de",
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {running ? "Generating..." : review ? "Regenerate yearly review" : "Generate yearly review"}
          </Text>
        </TouchableOpacity>
      </ScreenCard>

      {!!message && <Text style={{ color: "#9ca3af", marginTop: 6 }}>{message}</Text>}
    </ScrollView>
  );
}

function deriveTrend(values: string[]) {
  const up = values.filter((value) => value === "up").length;
  const down = values.filter((value) => value === "down").length;
  if (up > down) return "up";
  if (down > up) return "down";
  return "stable";
}
