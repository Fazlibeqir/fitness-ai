import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function PlanScreen() {
  const { plan } = useLocalSearchParams();

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24 }}>
        <Text style={{ color: "#fff" }}>No plan</Text>
      </View>
    );
  }

  const parsed = JSON.parse(plan as string);

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
        </View>
      ))}
    </ScrollView>
  );
}
