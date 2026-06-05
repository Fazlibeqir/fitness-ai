import { UserProfile, UserProgress } from "@/types";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";

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
    <Text
      style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
      }}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const StatCard = ({ label, value, icon, color = "#007AFF" }: any) => (
  <View
    style={{
      backgroundColor: "#1a1a1a",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#2a2a2a",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <View
        style={{
          backgroundColor: `${color}20`,
          borderRadius: 8,
          padding: 8,
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ color: "#999", fontSize: 14 }}>{label}</Text>
    </View>
    <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginLeft: 52 }}>
      {value}
    </Text>
  </View>
);

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
        setLoading(false);
        return;
      }

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

      const { data: sessionLogs } = await supabase
        .from("session_logs")
        .select("start_time, exercises")
        .eq("user_id", user.id)
        .eq("state", "COMPLETED");

      const { data: weeklyReviews } = await supabase
        .from("weekly_reviews")
        .select("review_json")
        .eq("user_id", user.id);

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
      const currentWeight = profileData.weight_kg;
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
        <Text style={{ color: "#fff", fontSize: 18, marginBottom: 16, textAlign: "center" }}>
          No profile found. Please complete onboarding.
        </Text>
        <Button title="Go to Onboarding" onPress={() => router.push("/onboarding")} icon="person-add" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ padding: 24 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Your Profile
        </Text>
        <Text style={{ color: "#999", fontSize: 16, marginBottom: 24 }}>
          Track your progress and goals
        </Text>

        {/* Progress Stats */}
        {progress && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
              Progress Overview
            </Text>
            <StatCard
              label="Sessions Completed"
              value={progress.total_sessions_completed}
              icon="checkmark-circle"
              color="#34C759"
            />
            <StatCard
              label="Weeks Active"
              value={progress.total_weeks_active}
              icon="calendar"
              color="#007AFF"
            />
            <StatCard
              label="Average Adherence"
              value={`${progress.average_adherence.toFixed(0)}%`}
              icon="trending-up"
              color="#FF9500"
            />
            <StatCard
              label="Weight Change"
              value={`${progress.weight_change_kg > 0 ? "+" : ""}${progress.weight_change_kg.toFixed(1)} kg`}
              icon="scale"
              color={progress.weight_change_kg > 0 ? "#34C759" : "#FF3B30"}
            />
          </View>
        )}

        {/* Body Stats */}
        <View
          style={{
            marginBottom: 24,
            padding: 20,
            backgroundColor: "#1a1a1a",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#2a2a2a",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="body" size={24} color="#007AFF" style={{ marginRight: 12 }} />
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Body Stats</Text>
          </View>
          <View style={{ marginLeft: 36 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ color: "#999" }}>Age</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{profile.age}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ color: "#999" }}>Height</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {profile.height_cm} cm ({Math.round(profile.height_cm / 2.54)} in)
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ color: "#999" }}>Weight</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {profile.weight_kg} kg ({Math.round(profile.weight_kg * 2.20462)} lbs)
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#999" }}>BMI</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {(profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Goals & Training */}
        <View
          style={{
            marginBottom: 24,
            padding: 20,
            backgroundColor: "#1a1a1a",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#2a2a2a",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="flag" size={24} color="#FF9500" style={{ marginRight: 12 }} />
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Goals & Training</Text>
          </View>
          <View style={{ marginLeft: 36 }}>
            <Text style={{ color: "#999", marginBottom: 4 }}>Goal</Text>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              {profile.goal.replace("_", " ").toUpperCase()}
            </Text>
            <Text style={{ color: "#999", marginBottom: 4 }}>Level</Text>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
            </Text>
            <Text style={{ color: "#999", marginBottom: 4 }}>Training Days</Text>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              {profile.training_days_per_week} per week
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ marginTop: 8 }}>
          <Button
            title="Edit Profile"
            onPress={() => router.push("/onboarding")}
            icon="create"
            color="#007AFF"
          />
          <Button
            title="Set Gym Location"
            onPress={() => router.push("/gym-setup")}
            icon="location"
            color="#34C759"
          />
          <Button
            title="Yearly Review"
            onPress={() => router.push("/yearly-review")}
            icon="calendar"
            color="#af52de"
          />
        </View>
      </View>
    </ScrollView>
  );
}
