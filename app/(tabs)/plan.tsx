import { CompleteWeeklyPlan } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";

const Button = ({ title, onPress, icon, variant = "primary", color = "#007AFF" }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor: variant === "primary" ? color : "#1a1a1a",
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: variant === "secondary" ? 1 : 0,
      borderColor: "#2a2a2a",
      shadowColor: variant === "primary" ? color : "transparent",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: variant === "primary" ? 4 : 0,
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

// Helper function to get week start (Sunday)
const getWeekStart = (date: Date = new Date()): Date => {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

// Helper function to get week end (Saturday)
const getWeekEnd = (date: Date = new Date()): Date => {
  const weekEnd = new Date(date);
  weekEnd.setDate(date.getDate() + (6 - date.getDay()));
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

export default function PlanScreen() {
  const [plan, setPlan] = useState<CompleteWeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [planWeekStart, setPlanWeekStart] = useState<Date | null>(null);

  // Calculate current week dates once
  const currentWeekStart = useMemo(() => {
    const weekStart = getWeekStart();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    console.log("📅 Current week calculation - Today:", new Date().toISOString().slice(0, 10), 
                `(${dayNames[new Date().getDay()]}) | Week start:`, 
                weekStart.toISOString().slice(0, 10), `(${dayNames[weekStart.getDay()]})`);
    return weekStart;
  }, []);
  const currentWeekEnd = useMemo(() => getWeekEnd(), []);

  const loadPlan = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Try to get current week's plan first
      const weekStartStr = currentWeekStart.toISOString().slice(0, 10);

      let { data, error } = await supabase
        .from("training_plans")
        .select("plan_json, week_start")
        .eq("user_id", user.id)
        .eq("week_start", weekStartStr)
        .single();

      // If no plan for current week, get the most recent plan
      if (!data || error) {
        const { data: recentPlan, error: recentError } = await supabase
          .from("training_plans")
          .select("plan_json, week_start")
          .eq("user_id", user.id)
          .order("week_start", { ascending: false })
          .limit(1)
          .single();

        if (recentPlan && !recentError) {
          data = recentPlan;
        }
      }

      if (data) {
        setPlan(data.plan_json);
        
        // Store the plan's week start date
        let correctedPlanWeekStart: Date;
        if (data.week_start) {
          // Parse the date string and ensure it's treated as local date (not UTC)
          const dateStr = data.week_start;
          const [year, month, day] = dateStr.split('-').map(Number);
          const planDate = new Date(year, month - 1, day); // month is 0-indexed
          
          // If the stored date is not a Sunday, calculate the Sunday of that week
          const dayOfWeek = planDate.getDay();
          if (dayOfWeek !== 0) {
            // Not a Sunday, calculate the Sunday of that week
            planDate.setDate(planDate.getDate() - dayOfWeek);
          }
          
          planDate.setHours(0, 0, 0, 0);
          correctedPlanWeekStart = planDate;
          setPlanWeekStart(planDate);
          
          const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][planDate.getDay()];
          console.log("📅 Plan loaded - week_start from DB:", data.week_start, `| Corrected to Sunday:`, planDate.toISOString().slice(0, 10), `(${dayName})`);
        } else {
          correctedPlanWeekStart = currentWeekStart;
          setPlanWeekStart(currentWeekStart);
          console.log("⚠️ Plan has no week_start, using current week:", currentWeekStart.toISOString().slice(0, 10));
        }

        // Load completed sessions for the plan's week
        // Use the corrected planWeekStart
        const planWeekStartDate = correctedPlanWeekStart;
        const planWeekEndDate = new Date(planWeekStartDate);
        planWeekEndDate.setDate(planWeekStartDate.getDate() + 6);
        planWeekEndDate.setHours(23, 59, 59, 999);

        const { data: sessions, error: sessionError } = await supabase
          .from("session_logs")
          .select("id, day")
          .eq("user_id", user.id)
          .eq("state", "COMPLETED")
          .gte("start_time", planWeekStartDate.toISOString())
          .lte("start_time", planWeekEndDate.toISOString());

        if (!sessionError && sessions) {
          // Count unique days to avoid double counting
          const uniqueDays = new Set(sessions.map(s => s.day));
          setCompletedSessions(uniqueDays.size);
        } else {
          setCompletedSessions(0);
        }
      } else {
        setPlan(null);
        setCompletedSessions(0);
        setPlanWeekStart(null);
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      setPlan(null);
      setCompletedSessions(0);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  }, [loadPlan]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: "#fff", marginTop: 16 }}>Loading your plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24, justifyContent: "center" }}>
        <Ionicons name="calendar-outline" size={64} color="#666" style={{ alignSelf: "center", marginBottom: 16 }} />
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
          No Plan Found
        </Text>
        <Text style={{ color: "#999", fontSize: 16, textAlign: "center", marginBottom: 24 }}>
          Complete onboarding to generate your training plan
        </Text>
        <Button
          title="Refresh"
          onPress={loadPlan}
          icon="refresh"
          color="#007AFF"
        />
        <Button
          title="Go to Onboarding"
          onPress={() => router.push("/onboarding")}
          icon="person-add"
        />
      </View>
    );
  }

  const totalDays = plan.weekly_plan.days.length;
  const adherencePercent = totalDays > 0 ? Math.min(100, Math.round((completedSessions / totalDays) * 100)) : 0;
  
  // Use plan's week start or current week start for calendar
  const displayWeekStart = planWeekStart || currentWeekStart;
  const isCurrentWeek = displayWeekStart.toDateString() === currentWeekStart.toDateString();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View
        style={{
          backgroundColor: "#1a1a1a",
          paddingTop: 24,
          paddingBottom: 32,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#fff",
                marginBottom: 4,
              }}
            >
              Your Plan
            </Text>
            <Text style={{ color: "#999", fontSize: 14 }}>
              {isCurrentWeek ? "This Week" : "Week of"} {displayWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {!isCurrentWeek && (
                <Text style={{ color: "#666", fontSize: 12 }}> (not current)</Text>
              )}
            </Text>
            <Text style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
              Plan Date: {displayWeekStart.toISOString().slice(0, 10)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/calendar",
                params: { plan: JSON.stringify(plan) },
              } as any);
            }}
            style={{
              backgroundColor: "#007AFF20",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#2a2a2a",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#34C75930",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="barbell" size={20} color="#34C759" style={{ marginRight: 8 }} />
              <Text style={{ color: "#999", fontSize: 12 }}>Training Days</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>{totalDays}</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#2a2a2a",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#007AFF30",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={{ color: "#999", fontSize: 12 }}>Completed</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
              {completedSessions}/{totalDays}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#2a2a2a",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FF950030",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="trending-up" size={20} color="#FF9500" style={{ marginRight: 8 }} />
              <Text style={{ color: "#999", fontSize: 12 }}>Adherence</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>{adherencePercent}%</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 24 }}>
        {/* Weekly Calendar View */}
        <View
          style={{
            marginBottom: 24,
            backgroundColor: "#1a1a1a",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: "#2a2a2a",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "#007AFF20",
                  borderRadius: 12,
                  padding: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons name="calendar" size={24} color="#007AFF" />
              </View>
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                >
                  {isCurrentWeek ? "This Week" : "Plan Week"}
                </Text>
                <Text style={{ color: "#999", fontSize: 12 }}>
                  {plan.weekly_plan.days.length} training days
                </Text>
              </View>
            </View>
          </View>

          {/* Calendar Grid */}
          <View>
            {/* Day Headers */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: "#666", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {(() => {
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const trainingDaysMap = new Map(
                  plan.weekly_plan.days.map((d: any) => [d.day, d])
                );

                return Array.from({ length: 7 }, (_, i) => {
                  const currentDate = new Date(displayWeekStart);
                  currentDate.setDate(displayWeekStart.getDate() + i);
                  const dayName = dayNames[i];
                  const trainingDay = trainingDaysMap.get(dayName);
                  const isToday =
                    currentDate.toDateString() === new Date().toDateString();
                  
                  // Verify the date matches the expected day of week
                  const actualDayOfWeek = currentDate.getDay();
                  const expectedDayOfWeek = i; // 0=Sunday, 1=Monday, etc.
                  if (actualDayOfWeek !== expectedDayOfWeek) {
                    console.warn(`⚠️ Calendar date mismatch: Date ${currentDate.toISOString().slice(0, 10)} is ${dayNames[actualDayOfWeek]}, expected ${dayNames[expectedDayOfWeek]}`);
                  }

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        if (trainingDay) {
                          router.push({
                            pathname: "/session",
                            params: {
                              day: trainingDay.day,
                              plan: JSON.stringify(trainingDay),
                            },
                          } as any);
                        }
                      }}
                      style={{
                        width: "14.28%",
                        aspectRatio: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          width: "85%",
                          aspectRatio: 1,
                          borderRadius: 12,
                          backgroundColor: trainingDay
                            ? "#34C759"
                            : "#2a2a2a",
                          borderWidth: isToday ? 3 : trainingDay ? 2 : 0,
                          borderColor: isToday ? "#007AFF" : trainingDay ? "#34C75980" : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          shadowColor: trainingDay ? "#34C759" : "transparent",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: trainingDay ? 2 : 0,
                        }}
                      >
                        <Text
                          style={{
                            color: trainingDay ? "#fff" : "#666",
                            fontSize: 15,
                            fontWeight: isToday ? "bold" : trainingDay ? "600" : "400",
                          }}
                        >
                          {currentDate.getDate()}
                        </Text>
                        {trainingDay && (
                          <View
                            style={{
                              position: "absolute",
                              bottom: 4,
                              width: 5,
                              height: 5,
                              borderRadius: 2.5,
                              backgroundColor: "#fff",
                            }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            {/* Legend */}
            <View style={{ flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#2a2a2a", justifyContent: "center", gap: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#34C759",
                    marginRight: 6,
                  }}
                />
                <Text style={{ color: "#999", fontSize: 11 }}>Training</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#2a2a2a",
                    marginRight: 6,
                    borderWidth: 1,
                    borderColor: "#666",
                  }}
                />
                <Text style={{ color: "#999", fontSize: 11 }}>Rest</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nutrition Plan */}
        {plan.nutrition_plan && (
          <View
            style={{
              marginBottom: 24,
              backgroundColor: "#1a1a1a",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: "#FF950020",
                  borderRadius: 12,
                  padding: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons name="nutrition" size={24} color="#FF9500" />
              </View>
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: "bold",
                  }}
                >
                  Daily Nutrition
                </Text>
                <Text style={{ color: "#999", fontSize: 12 }}>Target macros</Text>
              </View>
            </View>

            {/* Macro Cards */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 11, marginBottom: 4 }}>CALORIES</Text>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                  {plan.nutrition_plan.daily_calories}
                </Text>
                <Text style={{ color: "#666", fontSize: 10 }}>kcal</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 11, marginBottom: 4 }}>PROTEIN</Text>
                <Text style={{ color: "#34C759", fontSize: 20, fontWeight: "bold" }}>
                  {plan.nutrition_plan.macros.protein_g}
                </Text>
                <Text style={{ color: "#666", fontSize: 10 }}>grams</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 11, marginBottom: 4 }}>CARBS</Text>
                <Text style={{ color: "#FF9500", fontSize: 20, fontWeight: "bold" }}>
                  {plan.nutrition_plan.macros.carbs_g}
                </Text>
                <Text style={{ color: "#666", fontSize: 10 }}>grams</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 11, marginBottom: 4 }}>FAT</Text>
                <Text style={{ color: "#AF52DE", fontSize: 20, fontWeight: "bold" }}>
                  {plan.nutrition_plan.macros.fat_g}
                </Text>
                <Text style={{ color: "#666", fontSize: 10 }}>grams</Text>
              </View>
            </View>
          </View>
        )}

        {/* Training Days */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: "bold",
              }}
            >
              Training Days
            </Text>
            <Text style={{ color: "#666", fontSize: 14 }}>
              {plan.weekly_plan.days.length} sessions
            </Text>
          </View>
        </View>

        {plan.weekly_plan.days.map((day: any, index: number) => {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayIndex = dayNames.indexOf(day.day);
          const eventDate = new Date(displayWeekStart);
          eventDate.setDate(displayWeekStart.getDate() + dayIndex);
          const isToday = eventDate.toDateString() === new Date().toDateString();
          const isPast = eventDate < new Date() && !isToday;

          return (
            <TouchableOpacity
              key={day.day}
              onPress={() => {
                router.push({
                  pathname: "/session",
                  params: {
                    day: day.day,
                    plan: JSON.stringify(day),
                  },
                } as any);
              }}
              style={{
                marginBottom: 16,
                backgroundColor: "#1a1a1a",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: isToday ? "#007AFF40" : isPast ? "#66640" : "#2a2a2a",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
                opacity: isPast ? 0.7 : 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: "#34C75920",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Ionicons name="barbell" size={24} color="#34C759" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginRight: 8,
                      }}
                    >
                      {day.day}
                    </Text>
                    {isToday && (
                      <View
                        style={{
                          backgroundColor: "#007AFF",
                          borderRadius: 4,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>TODAY</Text>
                      </View>
                    )}
                    {isPast && (
                      <View
                        style={{
                          backgroundColor: "#666",
                          borderRadius: 4,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>PAST</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: "#999", fontSize: 14 }}>{day.focus}</Text>
                  <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                    {day.exercises.length} exercises • {eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>

              {/* Exercise Preview */}
              <View style={{ marginLeft: 66, marginTop: 12 }}>
                {day.exercises.slice(0, 3).map((ex: any, i: number) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      paddingBottom: 8,
                      borderBottomWidth: i < Math.min(day.exercises.length, 3) - 1 ? 1 : 0,
                      borderBottomColor: "#2a2a2a",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, flex: 1 }}>{ex.name}</Text>
                    <Text style={{ color: "#999", fontSize: 13 }}>
                      {ex.sets} × {ex.reps}
                    </Text>
                  </View>
                ))}
                {day.exercises.length > 3 && (
                  <Text style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                    +{day.exercises.length - 3} more exercises
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/session",
                    params: {
                      day: day.day,
                      plan: JSON.stringify(day),
                    },
                  } as any);
                }}
                style={{
                  marginTop: 16,
                  backgroundColor: isPast ? "#666" : "#34C759",
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: isPast ? "transparent" : "#34C759",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: isPast ? 0 : 4,
                }}
              >
                <Ionicons name={isPast ? "checkmark" : "play"} size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                  {isPast ? "View Session" : `Start ${day.day} Session`}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Quick Actions */}
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/calendar",
                  params: { plan: JSON.stringify(plan) },
                } as any);
              }}
              style={{
                flex: 1,
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#2a2a2a",
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#007AFF" style={{ marginBottom: 8 }} />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/weekly-review")}
              style={{
                flex: 1,
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#2a2a2a",
              }}
            >
              <Ionicons name="stats-chart-outline" size={24} color="#FF9500" style={{ marginBottom: 8 }} />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/monthly-review")}
              style={{
                flex: 1,
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#2a2a2a",
              }}
            >
              <Ionicons name="trending-up-outline" size={24} color="#AF52DE" style={{ marginBottom: 8 }} />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Monthly</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
