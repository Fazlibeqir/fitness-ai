import { CompleteWeeklyPlan } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";

export default function PlanScreen() {
  const { plan } = useLocalSearchParams();

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24 }}>
        <Text style={{ color: "#fff" }}>No plan</Text>
      </View>
    );
  }

  const parsed: CompleteWeeklyPlan = JSON.parse(plan as string);

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
        Your Weekly Plan
      </Text>

      {/* Nutrition Plan */}
      {parsed.nutrition_plan && (
        <View style={{ marginBottom: 32, padding: 16, backgroundColor: "#1a1a1a", borderRadius: 8 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Daily Nutrition
          </Text>
          <Text style={{ color: "#ddd", marginBottom: 4 }}>
            Calories: {parsed.nutrition_plan.daily_calories} kcal
          </Text>
          <Text style={{ color: "#ddd", marginBottom: 4 }}>
            Protein: {parsed.nutrition_plan.macros.protein_g}g
          </Text>
          <Text style={{ color: "#ddd", marginBottom: 4 }}>
            Carbs: {parsed.nutrition_plan.macros.carbs_g}g
          </Text>
          <Text style={{ color: "#ddd" }}>
            Fat: {parsed.nutrition_plan.macros.fat_g}g
          </Text>
        </View>
      )}

      {/* Training Plan */}
      <Text
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 16,
        }}
      >
        Training Schedule
      </Text>

      {parsed.weekly_plan.days.map((day: any) => (
        <View key={day.day} style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 6,
            }}
          >
            {day.day} — {day.focus}
          </Text>

          {day.exercises.map((ex: any, i: number) => (
            <Text
              key={i}
              style={{
                color: "#ddd",
                marginLeft: 8,
                marginBottom: 2,
              }}
            >
              • {ex.name}: {ex.sets} × {ex.reps} (rest {ex.rest_seconds}s)
            </Text>
          ))}

          <Button
            title={`Start ${day.day} Session`}
            onPress={() => {
              (router.push as any)({
                pathname: "/session",
                params: {
                  day: day.day,
                  plan: JSON.stringify(day),
                },
              });
            }}
          />
        </View>
      ))}

      <View style={{ marginTop: 32, gap: 12 }}>
        <Button
          title="View Profile"
          onPress={() => (router.push as any)("/profile")}
          color="#007AFF"
        />
        <Button
          title="View Calendar & Export"
          onPress={() => {
            (router.push as any)({
              pathname: "/calendar",
              params: { plan },
            });
          }}
          color="#007AFF"
        />
        <Button
          title="Weekly Review"
          onPress={() => (router.push as any)("/weekly-review")}
          color="#007AFF"
        />
        <Button
          title="Monthly Review"
          onPress={() => (router.push as any)("/monthly-review")}
          color="#007AFF"
        />
      </View>
    </ScrollView>
  );
}
