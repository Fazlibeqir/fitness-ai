import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { setupReviewNotificationHandlers } from "../services/review-automation";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Setup automatic review handlers when app starts
    setupReviewNotificationHandlers();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth-test" options={{ title: "Sign up" }} />
        <Stack.Screen name="onboarding" options={{ title: "Onboarding" }} />
        <Stack.Screen name="calendar" options={{ title: "Calendar" }} />
        <Stack.Screen name="gym-setup" options={{ title: "Set Gym Location" }} />
        <Stack.Screen name="session" options={{ title: "Training Session" }} />
        <Stack.Screen name="weekly-review" options={{ title: "Weekly Review" }} />
        <Stack.Screen name="monthly-review" options={{ title: "Monthly Review" }} />
        <Stack.Screen name="yearly-review" options={{ title: "Yearly Review" }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
