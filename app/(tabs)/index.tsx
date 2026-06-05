import { CompleteWeeklyPlan } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { requestNotificationPermissions, scheduleMonthlyReviewNotification, scheduleWeeklyReviewNotification, scheduleYearlyReviewNotification } from "../../services/notifications";
import { supabase } from "../../services/supabase";

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<CompleteWeeklyPlan | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadCurrentPlan = useCallback(async (userId?: string) => {
    if (!userId) return;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    let { data } = await supabase
      .from("training_plans")
      .select("plan_json")
      .eq("user_id", userId)
      .eq("week_start", weekStartStr)
      .single();

    if (!data) {
      const { data: recentPlan } = await supabase
        .from("training_plans")
        .select("plan_json")
        .eq("user_id", userId)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      if (recentPlan) {
        data = recentPlan;
      }
    }

    if (data) {
      setCurrentPlan(data.plan_json);
    }
  }, []);

  const loadUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      loadCurrentPlan(user.id);
    }
  }, [loadCurrentPlan]);

  const checkNotifications = useCallback(async () => {
    const hasPermission = await requestNotificationPermissions();
    setNotificationsEnabled(hasPermission);
  }, []);

  useEffect(() => {
    loadUser();
    checkNotifications();
  }, [loadUser, checkNotifications]);

  const enableNotifications = async () => {
    const enabled = await requestNotificationPermissions();
    if (enabled) {
      await scheduleWeeklyReviewNotification();
      await scheduleMonthlyReviewNotification();
      await scheduleYearlyReviewNotification();
      setNotificationsEnabled(true);
      Alert.alert("Success", "Notifications enabled! You'll get reminders for reviews and training sessions.");
    } else {
      Alert.alert("Permission Denied", "Please enable notifications in your device settings.");
    }
  };

  const Card = ({ title, description, icon, onPress, color = "#007AFF" }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#2a2a2a",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View
          style={{
            backgroundColor: `${color}20`,
            borderRadius: 8,
            padding: 10,
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", flex: 1 }}>
          {title}
        </Text>
      </View>
      <Text style={{ color: "#999", fontSize: 14, marginLeft: 52 }}>
        {description}
      </Text>
    </TouchableOpacity>
  );

  const Button = ({ title, onPress, variant = "primary" }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: variant === "primary" ? "#007AFF" : "#1a1a1a",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginBottom: 12,
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: "#2a2a2a",
      }}
    >
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

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: "#fff", fontSize: 18, marginBottom: 24, textAlign: "center" }}>
          Please sign in to continue
        </Text>
        <Button title="Sign In" onPress={() => router.push("/auth-test")} />
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
          Welcome Back
        </Text>
        <Text style={{ color: "#999", fontSize: 16, marginBottom: 32 }}>
          Train smart, recover well, and keep the streak alive
        </Text>

        {/* Quick Actions */}
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
          Quick Actions
        </Text>

        {currentPlan && (() => {
          const today = new Date();
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const todayName = dayNames[today.getDay()];
          const todayTraining = currentPlan.weekly_plan.days.find((d: any) => d.day === todayName);
          
          return todayTraining ? (
            <Card
              title="Today's Training"
              description={todayTraining.focus}
              icon="barbell"
              color="#34C759"
              onPress={() => (router.push as any)("/(tabs)/plan")}
            />
          ) : (
            <Card
              title="Your Plan"
              description={`${currentPlan.weekly_plan.days.length} training days this week`}
              icon="calendar"
              color="#007AFF"
              onPress={() => (router.push as any)("/(tabs)/plan")}
            />
          );
        })()}

        <Card
          title="Weekly Review"
          description="Review your progress and get next week's plan"
          icon="stats-chart"
          color="#FF9500"
          onPress={() => router.push("/weekly-review")}
        />

        <Card
          title="Monthly Review"
          description="See your monthly progress and trends"
          icon="trending-up"
          color="#AF52DE"
          onPress={() => router.push("/monthly-review")}
        />

        <Card
          title="Yearly Review"
          description="Look back at the full year and set the next-year focus"
          icon="calendar"
          color="#34C759"
          onPress={() => router.push("/yearly-review")}
        />

        {/* Notifications */}
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 24, marginBottom: 16 }}>
          Notifications
        </Text>

        {!notificationsEnabled ? (
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="notifications-outline" size={24} color="#FF9500" style={{ marginRight: 12 }} />
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", flex: 1 }}>
                Enable Notifications
              </Text>
            </View>
            <Text style={{ color: "#999", fontSize: 14, marginBottom: 16 }}>
              Get reminders for weekly reviews, monthly reviews, and training sessions
            </Text>
            <Button title="Enable Notifications" onPress={enableNotifications} />
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "#1a3a1a",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#34C759",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="notifications" size={24} color="#34C759" style={{ marginRight: 12 }} />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Notifications Enabled
              </Text>
            </View>
          </View>
        )}

        <Card
          title="Yearly reminder"
          description="Keep your annual review on the calendar so long-term progress stays visible."
          icon="calendar-outline"
          color="#af52de"
          onPress={() => router.push("/yearly-review")}
        />

        {/* Stats */}
        {currentPlan && (
          <>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 24, marginBottom: 16 }}>
              This Week
            </Text>
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, marginBottom: 8 }}>
                Training Days: {currentPlan.weekly_plan.days.length}
              </Text>
              <Text style={{ color: "#fff", fontSize: 16, marginBottom: 8 }}>
                Daily Calories: {currentPlan.nutrition_plan?.daily_calories || "N/A"}
              </Text>
              <Text style={{ color: "#fff", fontSize: 16 }}>
                Protein: {currentPlan.nutrition_plan?.macros.protein_g || "N/A"}g/day
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
