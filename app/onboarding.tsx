import { Input } from "@/components/ui/Input";
import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, View } from "react-native";
import { buildWeeklyPlanPrompt } from "../prompts/weeklyPlan.prompt";
import { callWeeklyPlanner } from "../services/openrouter";
import { supabase } from "../services/supabase";
import { extractJson } from "../utils/json";



export default function Onboarding() {
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [goal, setGoal] = useState("");
    const [msg, setMsg] = useState("");

    const submit = async () => {
        setMsg("Saving profile...");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setMsg("Not logged in");
            return;
        }

        const profileData = {
            age: Number(age),
            height_cm: Number(height),
            weight_kg: Number(weight),
            goal,
        };

        const { error } = await supabase
            .from("profiles")
            .update(profileData)
            .eq("user_id", user.id);

        if (error) {
            setMsg(error.message);
            return;
        }

        setMsg("Generating plan...");


        let plan: any;
        let llmResponse= "";
        try {
            const prompt = buildWeeklyPlanPrompt(profileData);
            llmResponse = await callWeeklyPlanner(prompt);
            plan = extractJson(llmResponse);
        } catch (e) {
            console.warn("First parse failed, retrying...", llmResponse);

            try {
                // Retry with a stricter repair instruction
                const repairPrompt = `
The previous output was INVALID JSON.

Fix it and return ONLY valid JSON.
NO explanations.
NO markdown.

INVALID OUTPUT:
${llmResponse}
`;
                const fixed = await callWeeklyPlanner(repairPrompt);
                plan = extractJson(fixed);
            } catch {
                setMsg("LLM failed to generate a valid plan. Try again.");
                return;
            }
        }

        // save plan
        await supabase.from("training_plans").insert({
            user_id: user.id,
            week_start: new Date().toISOString().slice(0, 10),
            plan_json: plan,
        });

        router.replace({
            pathname: "/plan",
            params: { plan: JSON.stringify(plan) },
        });
    };


    return (
        <View style={{ padding: 24, backgroundColor: "#000", flex: 1 }}>
            <Text
                style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: 24,
                }}
            >
                Tell us about you
            </Text>

            <Text style={{ color: "#fff", marginBottom: 6 }}>Age</Text>
            <Input value={age} onChangeText={setAge} placeholder="Age" />

            <Text style={{ color: "#fff", marginBottom: 6 }}>Height (cm)</Text>
            <Input value={height} onChangeText={setHeight} placeholder="Height (cm)" />

            <Text style={{ color: "#fff", marginBottom: 6 }}>Weight (kg)</Text>
            <Input value={weight} onChangeText={setWeight} placeholder="Weight (kg)" />

            <Text style={{ color: "#fff", marginBottom: 6 }}>Goal</Text>
            <Input value={goal} onChangeText={setGoal} placeholder="Gain muscle / Lose fat" />

            <Button title="Continue" onPress={submit} />

            {msg ? (
                <Text style={{ marginTop: 16, color: "#bbb" }}>{msg}</Text>
            ) : null}
        </View>
    );
}
