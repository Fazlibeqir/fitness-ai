import { Input } from "@/components/ui/Input";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabase";

export default function AuthTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  const signUp = async () => {
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      setMsg("Error: Missing Supabase configuration. Please check your .env file.");
      return;
    }

    if (!email || !password) {
      setMsg("Please enter email and password");
      return;
    }

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // Sign in explicitly
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setMsg(signInError.message);
        setLoading(false);
        return;
      }

      // Will redirect to onboarding via index.tsx
      (router.replace as any)("/");
    } catch (error: any) {
      if (error.message?.includes("Network request failed")) {
        setMsg("Network error: Check your internet connection and Supabase URL");
      } else {
        setMsg(error.message || "An error occurred");
      }
      setLoading(false);
    }
  };

  const signIn = async () => {
    if (!email || !password) {
      setMsg("Please enter email and password");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // Will redirect based on profile status via index.tsx
      (router.replace as any)("/");
    } catch (error: any) {
      if (error.message?.includes("Network request failed")) {
        setMsg("Network error: Check your internet connection and Supabase URL");
      } else {
        setMsg(error.message || "An error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <View
        style={{
          padding: 24,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              backgroundColor: "#007AFF",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <Ionicons name="barbell" size={48} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Fitness AI
          </Text>
          <Text style={{ color: "#999", fontSize: 16 }}>
            Your personal fitness coach
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", marginBottom: 16, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 4 }}>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(true);
                setMsg("");
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: isSignUp ? "#007AFF" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: isSignUp ? "#fff" : "#999", fontWeight: "600" }}>
                Sign Up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(false);
                setMsg("");
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: !isSignUp ? "#007AFF" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: !isSignUp ? "#fff" : "#999", fontWeight: "600" }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="email@example.com"
            editable={!loading}
          />

          <Text style={{ color: "#fff", marginBottom: 8, marginTop: 16, fontSize: 16 }}>
            Password
          </Text>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={isSignUp ? signUp : signIn}
          disabled={loading}
          style={{
            backgroundColor: "#007AFF",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginBottom: 16,
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
              {isSignUp ? "Create Account" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        {msg ? (
          <View
            style={{
              backgroundColor: msg.includes("successful") ? "#1a3a1a" : "#3a1a1a",
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: msg.includes("successful") ? "#34C759" : "#ff6b6b",
                textAlign: "center",
              }}
            >
              {msg}
            </Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
