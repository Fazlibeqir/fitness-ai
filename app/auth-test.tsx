import { Input } from "@/components/ui/Input";
import { router } from "expo-router";
import { useState } from "react";
import {
    Button,
    KeyboardAvoidingView,
    Platform,
    Text,
    View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function AuthTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

 const signUp = async () => {
  setMsg("Signing up...");

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setMsg(error.message);
    return;
  }

  // 👇 SIGN IN EXPLICITLY
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    setMsg(signInError.message);
    return;
  }

  setMsg("Signup successful");
  router.replace({ pathname: "/onboarding" });
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        style={{
          padding: 24,
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 24,
          }}
        >
          Create account
        </Text>

        <Text style={{ color: "#fff", marginBottom: 6 }}>Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="email@example.com"
        />

        <Text style={{ color: "#fff", marginBottom: 6 }}>Password</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Button title="Sign up" onPress={signUp} />

        {msg ? (
          <Text style={{ marginTop: 16, color: "#bbb" }}>{msg}</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
