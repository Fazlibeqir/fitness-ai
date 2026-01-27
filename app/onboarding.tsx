import { Input } from "@/components/ui/Input";
import { UserProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { buildWeeklyPlanPrompt } from "../prompts/weeklyPlan.prompt";
import { callWeeklyPlanner } from "../services/openrouter";
import { supabase } from "../services/supabase";
import { extractJson } from "../utils/json";

type OnboardingStep = 
  | "goals"
  | "body"
  | "experience"
  | "nutrition"
  | "lifestyle";

const steps: OnboardingStep[] = ["goals", "body", "experience", "nutrition", "lifestyle"];
const stepTitles = {
  goals: "Your Goals",
  body: "Body & Health",
  experience: "Experience & Availability",
  nutrition: "Nutrition Preferences",
  lifestyle: "Lifestyle & Recovery",
};

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>("goals");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Goals
  const [goal, setGoal] = useState("");
  const [goalTimeframe, setGoalTimeframe] = useState("");

  // Body & Health
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other">("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [injuryStatus, setInjuryStatus] = useState(false);
  const [injuryDescription, setInjuryDescription] = useState("");
  const [medicalLimitations, setMedicalLimitations] = useState("");

  // Experience & Availability
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [gymAccess, setGymAccess] = useState(true);
  const [trainingDays, setTrainingDays] = useState("3");
  const [sessionDuration, setSessionDuration] = useState("60");

  // Nutrition
  const [dietType, setDietType] = useState<"omnivore" | "vegetarian" | "vegan" | "keto" | "other">("omnivore");
  const [allergies, setAllergies] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("3");
  const [budgetSensitivity, setBudgetSensitivity] = useState<"low" | "medium" | "high">("medium");

  // Lifestyle & Recovery
  const [sleepHours, setSleepHours] = useState("7");
  const [jobActivity, setJobActivity] = useState<"sedentary" | "active">("sedentary");
  const [movementLevel, setMovementLevel] = useState<"low" | "medium" | "high">("medium");

  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
      setMsg("");
    } else {
      submit();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
      setMsg("");
    }
  };

  const submit = async () => {
    setLoading(true);
    setMsg("Saving profile...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("Not logged in");
      setLoading(false);
      return;
    }

    const profile: UserProfile = {
      age: Number(age),
      sex,
      height_cm: Number(height),
      weight_kg: Number(weight),
      goal: goal as UserProfile["goal"],
      goal_timeframe_weeks: goalTimeframe ? Number(goalTimeframe) : undefined,
      injury_status: injuryStatus,
      injury_description: injuryStatus ? injuryDescription : undefined,
      medical_limitations: medicalLimitations || undefined,
      experience_level: experienceLevel,
      gym_access: gymAccess,
      training_days_per_week: Number(trainingDays),
      session_duration_minutes: Number(sessionDuration),
      diet_type: dietType,
      allergies_restrictions: allergies || undefined,
      meals_per_day: Number(mealsPerDay),
      budget_sensitivity: budgetSensitivity,
      average_sleep_hours: Number(sleepHours),
      job_activity_level: jobActivity,
      daily_movement_level: movementLevel,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        ...profile,
      }, { onConflict: "user_id" });

    if (profileError) {
      setMsg(profileError.message);
      setLoading(false);
      return;
    }

    setMsg("Generating your personalized plan...");

    let plan: any;
    let llmResponse = "";
    try {
      const prompt = buildWeeklyPlanPrompt(profile);
      llmResponse = await callWeeklyPlanner(prompt);
      plan = extractJson(llmResponse);
    } catch (e) {
      try {
        const repairPrompt = `
The previous output was INVALID JSON.
Fix it and return ONLY valid JSON.
NO explanations. NO markdown.

INVALID OUTPUT:
${llmResponse}
`;
        const fixed = await callWeeklyPlanner(repairPrompt);
        plan = extractJson(fixed);
      } catch {
        setMsg("Failed to generate plan. Please try again.");
        setLoading(false);
        return;
      }
    }

    // Calculate week start (Sunday)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[today.getDay()];
    const weekStartName = dayNames[weekStart.getDay()];

    console.log("📅 Creating plan - Today:", today.toISOString().slice(0, 10), `(${todayName}) | Week start:`, weekStartStr, `(${weekStartName})`);

    await supabase.from("training_plans").insert({
      user_id: user.id,
      week_start: weekStartStr,
      plan_json: plan,
    });

    (router.replace as any)("/(tabs)/");
  };

  const SelectButton = ({ title, selected, onPress, icon }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: selected ? "#007AFF" : "#1a1a1a",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: selected ? "#007AFF" : "#2a2a2a",
        marginBottom: 12,
      }}
    >
      {icon && <Ionicons name={icon} size={20} color={selected ? "#fff" : "#999"} style={{ marginRight: 12 }} />}
      <Text style={{ color: selected ? "#fff" : "#999", fontSize: 16, fontWeight: selected ? "600" : "400" }}>
        {title}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: "auto" }} />}
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (step) {
      case "goals":
        return (
          <View>
            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>Primary Goal</Text>
            <View style={{ marginBottom: 24 }}>
              {["gain_muscle", "lose_weight", "fat_loss", "body_recomp", "general_fitness"].map((g) => (
                <SelectButton
                  key={g}
                  title={g.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  selected={goal === g}
                  onPress={() => setGoal(g)}
                  icon="flag"
                />
              ))}
            </View>

            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>
              Desired Timeframe (weeks)
            </Text>
            <Input
              value={goalTimeframe}
              onChangeText={setGoalTimeframe}
              placeholder="e.g., 12"
              keyboardType="numeric"
            />
          </View>
        );

      case "body":
        return (
          <View>
            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>Age</Text>
            <Input value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" />

            <Text style={{ color: "#fff", marginBottom: 12, marginTop: 24, fontSize: 16, fontWeight: "600" }}>Sex</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              {(["male", "female", "other"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSex(s)}
                  style={{
                    flex: 1,
                    backgroundColor: sex === s ? "#007AFF" : "#1a1a1a",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: sex === s ? "#007AFF" : "#2a2a2a",
                  }}
                >
                  <Text style={{ color: sex === s ? "#fff" : "#999", fontWeight: sex === s ? "600" : "400" }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>Height (cm)</Text>
            <Input value={height} onChangeText={setHeight} placeholder="Height (cm)" keyboardType="numeric" />

            <Text style={{ color: "#fff", marginBottom: 8, marginTop: 16, fontSize: 16, fontWeight: "600" }}>
              Weight (kg)
            </Text>
            <Input value={weight} onChangeText={setWeight} placeholder="Weight (kg)" keyboardType="numeric" />

            <Text style={{ color: "#fff", marginBottom: 12, marginTop: 24, fontSize: 16, fontWeight: "600" }}>
              Injury Status
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => setInjuryStatus(false)}
                style={{
                  flex: 1,
                  backgroundColor: !injuryStatus ? "#34C759" : "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: !injuryStatus ? "#34C759" : "#2a2a2a",
                }}
              >
                <Text style={{ color: !injuryStatus ? "#fff" : "#999", fontWeight: !injuryStatus ? "600" : "400" }}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInjuryStatus(true)}
                style={{
                  flex: 1,
                  backgroundColor: injuryStatus ? "#FF3B30" : "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: injuryStatus ? "#FF3B30" : "#2a2a2a",
                }}
              >
                <Text style={{ color: injuryStatus ? "#fff" : "#999", fontWeight: injuryStatus ? "600" : "400" }}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>

            {injuryStatus && (
              <>
                <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>
                  Injury Description
                </Text>
                <Input
                  value={injuryDescription}
                  onChangeText={setInjuryDescription}
                  placeholder="Describe your injury"
                  multiline
                  style={{ minHeight: 80 }}
                />
              </>
            )}

            <Text style={{ color: "#fff", marginBottom: 8, marginTop: 16, fontSize: 16, fontWeight: "600" }}>
              Medical Limitations (optional)
            </Text>
            <Input
              value={medicalLimitations}
              onChangeText={setMedicalLimitations}
              placeholder="Any medical conditions or limitations"
              multiline
              style={{ minHeight: 80 }}
            />
          </View>
        );

      case "experience":
        return (
          <View>
            <Text style={{ color: "#fff", marginBottom: 12, fontSize: 16, fontWeight: "600" }}>Training Level</Text>
            {(["beginner", "intermediate", "advanced"] as const).map((level) => (
              <SelectButton
                key={level}
                title={level.charAt(0).toUpperCase() + level.slice(1)}
                selected={experienceLevel === level}
                onPress={() => setExperienceLevel(level)}
                icon="trophy"
              />
            ))}

            <Text style={{ color: "#fff", marginBottom: 12, marginTop: 24, fontSize: 16, fontWeight: "600" }}>
              Gym Access
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => setGymAccess(true)}
                style={{
                  flex: 1,
                  backgroundColor: gymAccess ? "#34C759" : "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: gymAccess ? "#34C759" : "#2a2a2a",
                }}
              >
                <Text style={{ color: gymAccess ? "#fff" : "#999", fontWeight: gymAccess ? "600" : "400" }}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGymAccess(false)}
                style={{
                  flex: 1,
                  backgroundColor: !gymAccess ? "#FF9500" : "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: !gymAccess ? "#FF9500" : "#2a2a2a",
                }}
              >
                <Text style={{ color: !gymAccess ? "#fff" : "#999", fontWeight: !gymAccess ? "600" : "400" }}>
                  No
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>
              Training Days Per Week (1-7)
            </Text>
            <Input value={trainingDays} onChangeText={setTrainingDays} placeholder="3" keyboardType="numeric" />

            <Text style={{ color: "#fff", marginBottom: 8, marginTop: 16, fontSize: 16, fontWeight: "600" }}>
              Session Duration (minutes)
            </Text>
            <Input value={sessionDuration} onChangeText={setSessionDuration} placeholder="60" keyboardType="numeric" />
          </View>
        );

      case "nutrition":
        return (
          <View>
            <Text style={{ color: "#fff", marginBottom: 12, fontSize: 16, fontWeight: "600" }}>Diet Type</Text>
            {(["omnivore", "vegetarian", "vegan", "keto", "other"] as const).map((type) => (
              <SelectButton
                key={type}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
                selected={dietType === type}
                onPress={() => setDietType(type)}
                icon="nutrition"
              />
            ))}

            <Text style={{ color: "#fff", marginBottom: 8, marginTop: 24, fontSize: 16, fontWeight: "600" }}>
              Allergies or Restrictions (optional)
            </Text>
            <Input value={allergies} onChangeText={setAllergies} placeholder="e.g., nuts, dairy, gluten" />

            <Text style={{ color: "#fff", marginBottom: 8, marginTop: 16, fontSize: 16, fontWeight: "600" }}>
              Meals Per Day
            </Text>
            <Input value={mealsPerDay} onChangeText={setMealsPerDay} placeholder="3" keyboardType="numeric" />

            <Text style={{ color: "#fff", marginBottom: 12, marginTop: 24, fontSize: 16, fontWeight: "600" }}>
              Budget Sensitivity
            </Text>
            {(["low", "medium", "high"] as const).map((budget) => (
              <SelectButton
                key={budget}
                title={budget.charAt(0).toUpperCase() + budget.slice(1)}
                selected={budgetSensitivity === budget}
                onPress={() => setBudgetSensitivity(budget)}
                icon="cash"
              />
            ))}
          </View>
        );

      case "lifestyle":
        return (
          <View>
            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16, fontWeight: "600" }}>
              Average Sleep Hours
            </Text>
            <Input value={sleepHours} onChangeText={setSleepHours} placeholder="7" keyboardType="numeric" />

            <Text style={{ color: "#fff", marginBottom: 12, marginTop: 24, fontSize: 16, fontWeight: "600" }}>
              Job Activity Level
            </Text>
            {(["sedentary", "active"] as const).map((activity) => (
              <SelectButton
                key={activity}
                title={activity.charAt(0).toUpperCase() + activity.slice(1)}
                selected={jobActivity === activity}
                onPress={() => setJobActivity(activity)}
                icon="briefcase"
              />
            ))}

            <Text style={{ color: "#fff", marginBottom: 12, marginTop: 24, fontSize: 16, fontWeight: "600" }}>
              Daily Movement Level
            </Text>
            {(["low", "medium", "high"] as const).map((level) => (
              <SelectButton
                key={level}
                title={level.charAt(0).toUpperCase() + level.slice(1)}
                selected={movementLevel === level}
                onPress={() => setMovementLevel(level)}
                icon="walk"
              />
            ))}
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <View style={{ flex: 1 }}>
        {/* Progress Bar */}
        <View style={{ padding: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
              {stepTitles[step]}
            </Text>
            <Text style={{ color: "#999", fontSize: 14 }}>
              {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>
          <View
            style={{
              height: 4,
              backgroundColor: "#1a1a1a",
              borderRadius: 2,
              marginTop: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: "#007AFF",
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View
          style={{
            padding: 24,
            borderTopWidth: 1,
            borderTopColor: "#1a1a1a",
            backgroundColor: "#000",
          }}
        >
          {msg && (
            <View
              style={{
                backgroundColor: msg.includes("Generating") ? "#1a3a1a" : "#3a1a1a",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />}
              <Text style={{ color: msg.includes("Generating") ? "#34C759" : "#ff6b6b", flex: 1 }}>
                {msg}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 12 }}>
            {currentStepIndex > 0 && (
              <TouchableOpacity
                onPress={prevStep}
                disabled={loading}
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
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={nextStep}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: "#007AFF",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                shadowColor: "#007AFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  {currentStepIndex === steps.length - 1 ? "Complete Setup" : "Next"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
