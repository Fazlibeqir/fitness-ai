import { UserProfile, UserProgress } from "@/types";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, Button, ActivityIndicator } from "react-native";
import { supabase } from "../services/supabase";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth-test");
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData as UserProfile);

      // Load progress data
      const { data: sessionLogs } = await supabase
        .from("session_logs")
        .select("start_time, exercises")
        .eq("user_id", user.id)
        .eq("state", "COMPLETED");

      const { data: weeklyReviews } = await supabase
        .from("weekly_reviews")
        .select("review_json")
        .eq("user_id", user.id);

      // Calculate progress
      const totalSessions = sessionLogs?.length || 0;
      const uniqueWeeks = new Set(
        sessionLogs?.map((s) => {
          const date = new Date(s.start_time);
          return `${date.getFullYear()}-W${getWeekNumber(date)}`;
        }) || []
      ).size;

      const adherenceValues =
        weeklyReviews?.map((r) => r.review_json.weekly_summary.adherence_percent) || [];
      const avgAdherence =
        adherenceValues.length > 0
          ? adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length
          : 0;

      const startingWeight = profileData.weight_kg;
      const currentWeight = profileData.weight_kg; // Would get from latest progress entry
      const weightChange = currentWeight - startingWeight;
      const weightChangePercent = startingWeight > 0 ? (weightChange / startingWeight) * 100 : 0;

      setProgress({
        starting_weight: startingWeight,
        current_weight: currentWeight,
        weight_change_kg: weightChange,
        weight_change_percent: weightChangePercent,
        progress_entries: [],
        total_sessions_completed: totalSessions,
        total_weeks_active: uniqueWeeks,
        average_adherence: avgAdherence,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24, justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 18, marginBottom: 16 }}>
          No profile found. Please complete onboarding.
        </Text>
        <Button title="Go to Onboarding" onPress={() => router.push("/onboarding")} />
      </View>
    );
  }

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
        Your Profile
      </Text>

      {/* Basic Info */}
      <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Body Stats
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>Age: {profile.age}</Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Height: {profile.height_cm} cm ({Math.round(profile.height_cm / 2.54)} in)
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Weight: {profile.weight_kg} kg ({Math.round(profile.weight_kg * 2.20462)} lbs)
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          BMI: {(profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)}
        </Text>
        <Text style={{ color: "#ddd" }}>Sex: {profile.sex}</Text>
      </View>

      {/* Goals */}
      <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Goals
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Primary Goal: {profile.goal.replace("_", " ").toUpperCase()}
        </Text>
        {profile.goal_timeframe_weeks && (
          <Text style={{ color: "#ddd" }}>
            Timeframe: {profile.goal_timeframe_weeks} weeks
          </Text>
        )}
      </View>

      {/* Experience */}
      <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Training Info
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Level: {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Training Days: {profile.training_days_per_week} per week
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Session Duration: {profile.session_duration_minutes} minutes
        </Text>
        <Text style={{ color: "#ddd" }}>
          Gym Access: {profile.gym_access ? "Yes" : "No"}
        </Text>
      </View>

      {/* Progress Stats */}
      {progress && (
        <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
            Progress
          </Text>
          <Text style={{ color: "#ddd", marginBottom: 4 }}>
            Weight Change: {progress.weight_change_kg > 0 ? "+" : ""}
            {progress.weight_change_kg.toFixed(1)} kg ({progress.weight_change_percent > 0 ? "+" : ""}
            {progress.weight_change_percent.toFixed(1)}%)
          </Text>
          <Text style={{ color: "#ddd", marginBottom: 4 }}>
            Sessions Completed: {progress.total_sessions_completed}
          </Text>
          <Text style={{ color: "#ddd", marginBottom: 4 }}>
            Weeks Active: {progress.total_weeks_active}
          </Text>
          <Text style={{ color: "#ddd" }}>
            Average Adherence: {progress.average_adherence.toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Nutrition */}
      <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Nutrition
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Diet Type: {profile.diet_type.charAt(0).toUpperCase() + profile.diet_type.slice(1)}
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Meals Per Day: {profile.meals_per_day}
        </Text>
        {profile.allergies_restrictions && (
          <Text style={{ color: "#ddd" }}>
            Restrictions: {profile.allergies_restrictions}
          </Text>
        )}
      </View>

      {/* Lifestyle */}
      <View style={{ marginBottom: 24, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Lifestyle
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Sleep: {profile.average_sleep_hours} hours/night
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 4 }}>
          Job Activity: {profile.job_activity_level.charAt(0).toUpperCase() + profile.job_activity_level.slice(1)}
        </Text>
        <Text style={{ color: "#ddd" }}>
          Daily Movement: {profile.daily_movement_level.charAt(0).toUpperCase() + profile.daily_movement_level.slice(1)}
        </Text>
      </View>

      <View style={{ gap: 12, marginTop: 16 }}>
        <Button
          title="Edit Profile"
          onPress={() => router.push("/onboarding")}
          color="#007AFF"
        />
        <Button
          title="Set Gym Location"
          onPress={() => router.push("/gym-setup")}
          color="#34C759"
        />
        <Button
          title="Yearly Review"
          onPress={() => router.push("/yearly-review")}
          color="#af52de"
        />
      </View>
    </ScrollView>
  );
}
