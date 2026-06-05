import { ExerciseLog, SessionState, TrainingDay, LocationVerification } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, Text, View, Button, TextInput, Alert, ActivityIndicator } from "react-native";
import { supabase } from "../services/supabase";
import { verifyGymLocation } from "../services/location";

export default function SessionScreen() {
  const { day, plan } = useLocalSearchParams();
  const [state, setState] = useState<SessionState>("PLANNED");
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [locationVerification, setLocationVerification] = useState<LocationVerification | null>(null);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [gymLocation, setGymLocation] = useState<{ latitude: number; longitude: number; radius_meters?: number } | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadGymLocation();
  }, []);

  const loadGymLocation = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Load gym location from profile (you'd store this in profiles table)
      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_latitude, gym_longitude, gym_radius_meters")
        .eq("user_id", user.id)
        .single();

      if (profile?.gym_latitude && profile?.gym_longitude) {
        setGymLocation({
          latitude: profile.gym_latitude,
          longitude: profile.gym_longitude,
          radius_meters: profile.gym_radius_meters || 100,
        });
      }
    } catch (error) {
      console.error("Error loading gym location:", error);
    }
  };

  if (!plan || !day) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24 }}>
        <Text style={{ color: "#fff" }}>No session data</Text>
      </View>
    );
  }

  const trainingDay: TrainingDay = JSON.parse(plan as string);
  const currentExercise = trainingDay.exercises[currentExerciseIndex];

  const initializeLogs = () => {
    const logs: ExerciseLog[] = trainingDay.exercises.map((ex) => ({
      exercise: ex.name,
      weight_kg: 0,
      sets: [],
      target_sets: ex.sets,
      target_reps: ex.reps,
      rpe: 5,
    }));
    setExerciseLogs(logs);
  };

  const verifyLocationAndStart = async () => {
    if (!gymLocation) {
      // If no gym location set, allow starting anyway (for home workouts)
      Alert.alert(
        "No Gym Location",
        "No gym location configured. You can still start the session, but location verification is disabled.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start Anyway",
            onPress: () => {
              initializeLogs();
              setSessionStartTime(new Date());
              setState("IN_SESSION");
            },
          },
        ]
      );
      return;
    }

    setVerifyingLocation(true);
    try {
      const verification = await verifyGymLocation(gymLocation);
      setLocationVerification(verification);

      if (verification.verified) {
        initializeLogs();
        setSessionStartTime(new Date());
        setState("IN_SESSION");
      } else {
        Alert.alert(
          "Location Verification Failed",
          `You are ${verification.distance_meters}m away from the gym. Please be at the gym location to start your session.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Start Anyway",
              onPress: () => {
                initializeLogs();
                setSessionStartTime(new Date());
                setState("IN_SESSION");
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify location");
    } finally {
      setVerifyingLocation(false);
    }
  };

  const startSession = () => {
    verifyLocationAndStart();
  };

  const logSet = (exerciseIndex: number, reps: number) => {
    const newLogs = [...exerciseLogs];
    newLogs[exerciseIndex].sets.push(reps);
    setExerciseLogs(newLogs);
  };

  const updateWeight = (exerciseIndex: number, weight: string) => {
    const newLogs = [...exerciseLogs];
    newLogs[exerciseIndex].weight_kg = parseFloat(weight) || 0;
    setExerciseLogs(newLogs);
  };

  const updateRPE = (exerciseIndex: number, rpe: number) => {
    const newLogs = [...exerciseLogs];
    newLogs[exerciseIndex].rpe = rpe;
    setExerciseLogs(newLogs);
  };

  const togglePain = (exerciseIndex: number) => {
    const newLogs = [...exerciseLogs];
    newLogs[exerciseIndex].pain_flag = !newLogs[exerciseIndex].pain_flag;
    setExerciseLogs(newLogs);
  };

  const completeSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    const endTime = new Date();
    const startTime = sessionStartTime || endTime; // Fallback to endTime if startTime not set
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Save session log with comprehensive data
    await supabase.from("session_logs").insert({
      user_id: user.id,
      day: day as string,
      state: "COMPLETED",
      exercises: exerciseLogs,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      location_verified: locationVerification?.verified || false,
      location_data: locationVerification || null,
    });

    console.log("✅ Session logged:", {
      day,
      exercises: exerciseLogs.length,
      duration_minutes: durationMinutes,
      location_verified: locationVerification?.verified || false,
    });

    setState("COMPLETED");
    Alert.alert("Success", "Session logged!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  if (state === "PLANNED") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 24,
          }}
        >
          {day} — {trainingDay.focus}
        </Text>

        <Text style={{ color: "#fff", marginBottom: 16, fontSize: 16 }}>
          Exercises:
        </Text>

        {trainingDay.exercises.map((ex, i) => (
          <Text key={i} style={{ color: "#ddd", marginLeft: 8, marginBottom: 8 }}>
            • {ex.name}: {ex.sets} × {ex.reps} (rest {ex.rest_seconds}s)
          </Text>
        ))}

        {verifyingLocation ? (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ color: "#fff", marginTop: 8 }}>Verifying location...</Text>
          </View>
        ) : (
          <Button title="Start Session" onPress={startSession} />
        )}

        {locationVerification && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: locationVerification.verified ? "#1a3a1a" : "#3a1a1a", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 4 }}>
              Location Status: {locationVerification.verified ? "✓ Verified" : "✗ Not at Gym"}
            </Text>
            {locationVerification.distance_meters !== undefined && (
              <Text style={{ color: "#ddd", fontSize: 12 }}>
                Distance: {locationVerification.distance_meters}m from gym
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  if (state === "IN_SESSION") {
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
          {day} — {trainingDay.focus}
        </Text>

        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          {currentExercise.name}
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 8 }}>
          Target: {currentExercise.sets} × {currentExercise.reps}
        </Text>
        <Text style={{ color: "#ddd", marginBottom: 16 }}>
          Rest: {currentExercise.rest_seconds}s
        </Text>

        {/* Weight Input */}
        <Text style={{ color: "#fff", marginBottom: 6 }}>Weight (kg)</Text>
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
          value={exerciseLogs[currentExerciseIndex]?.weight_kg.toString() || "0"}
          onChangeText={(text) => updateWeight(currentExerciseIndex, text)}
          keyboardType="numeric"
          placeholder="0"
        />

        {/* Sets Logging */}
        <Text style={{ color: "#fff", marginBottom: 8 }}>
          Sets Completed: {exerciseLogs[currentExerciseIndex]?.sets.length || 0} / {currentExercise.sets}
        </Text>

        {exerciseLogs[currentExerciseIndex]?.sets.map((reps, setIndex) => (
          <Text key={setIndex} style={{ color: "#ddd", marginLeft: 8 }}>
            Set {setIndex + 1}: {reps} reps
          </Text>
        ))}

        <View style={{ flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 16 }}>
          {[8, 9, 10, 11, 12].map((reps) => (
            <Button
              key={reps}
              title={reps.toString()}
              onPress={() => logSet(currentExerciseIndex, reps)}
            />
          ))}
        </View>

        {/* RPE */}
        <Text style={{ color: "#fff", marginBottom: 8 }}>
          RPE: {exerciseLogs[currentExerciseIndex]?.rpe || 5}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
            <Button
              key={rpe}
              title={rpe.toString()}
              onPress={() => updateRPE(currentExerciseIndex, rpe)}
              color={exerciseLogs[currentExerciseIndex]?.rpe === rpe ? "#007AFF" : "#666"}
            />
          ))}
        </View>

        {/* Pain Flag */}
        <Button
          title={exerciseLogs[currentExerciseIndex]?.pain_flag ? "Pain Reported" : "Report Pain/Injury"}
          onPress={() => togglePain(currentExerciseIndex)}
          color={exerciseLogs[currentExerciseIndex]?.pain_flag ? "#ff0000" : "#666"}
        />

        {/* Navigation */}
        <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
          {currentExerciseIndex > 0 && (
            <Button
              title="Previous"
              onPress={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
            />
          )}
          {currentExerciseIndex < trainingDay.exercises.length - 1 ? (
            <Button
              title="Next Exercise"
              onPress={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            />
          ) : (
            <Button title="Complete Session" onPress={completeSession} color="#00ff00" />
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 24 }}>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
        Session Completed!
      </Text>
    </View>
  );
}
