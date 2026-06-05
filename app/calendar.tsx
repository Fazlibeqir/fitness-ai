import { CompleteWeeklyPlan, TrainingDay } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, Text, View, Button, Alert, Linking } from "react-native";
import * as Calendar from "expo-calendar";
import { createWeeklyPlanEvents, generateICalFile, generateGoogleCalendarUrl } from "../services/calendar";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function CalendarScreen() {
  const { plan } = useLocalSearchParams();
  const [hasPermission, setHasPermission] = useState(false);
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      setHasPermission(status === "granted");

      if (status === "granted") {
        const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        setCalendars(cals.filter((cal) => cal.allowsModifications));
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setHasPermission(status === "granted");
      if (status === "granted") {
        const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        setCalendars(cals.filter((cal) => cal.allowsModifications));
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      Alert.alert("Error", "Failed to request calendar permission");
    }
  };

  const addToDeviceCalendar = async () => {
    if (!plan) {
      Alert.alert("Error", "No plan data");
      return;
    }

    setLoading(true);
    try {
      const parsed: CompleteWeeklyPlan = JSON.parse(plan as string);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

      const eventIds = await createWeeklyPlanEvents(parsed.weekly_plan.days, weekStart);
      Alert.alert("Success", `Added ${eventIds.length} training sessions to your calendar!`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add to calendar");
    } finally {
      setLoading(false);
    }
  };

  const exportToGoogleCalendar = async () => {
    if (!plan) {
      Alert.alert("Error", "No plan data");
      return;
    }

    try {
      const parsed: CompleteWeeklyPlan = JSON.parse(plan as string);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      // For simplicity, create URL for first day
      // In production, you'd create multiple URLs or use batch
      const url = generateGoogleCalendarUrl(parsed.weekly_plan.days, weekStart);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open Google Calendar");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to export");
    }
  };

  const exportToICal = async () => {
    if (!plan) {
      Alert.alert("Error", "No plan data");
      return;
    }

    try {
      const parsed: CompleteWeeklyPlan = JSON.parse(plan as string);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const icalContent = generateICalFile(parsed.weekly_plan.days, weekStart);
      // Use a temporary file path - FileSystem methods are available but types may differ
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '/tmp/';
      const fileUri = `${cacheDir}training-plan-${Date.now()}.ics`;

      await FileSystem.writeAsStringAsync(fileUri, icalContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/calendar",
          dialogTitle: "Export Training Plan",
        });
      } else {
        Alert.alert("Error", "Sharing not available on this device");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to export");
    }
  };

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", padding: 24, justifyContent: "center" }}>
        <Text style={{ color: "#fff" }}>No plan data</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const parsed: CompleteWeeklyPlan = JSON.parse(plan as string);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

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
        Calendar Export
      </Text>
      <Text style={{ color: "#9ca3af", marginBottom: 24 }}>
        Writable calendars: {calendars.length || 0}
      </Text>

      {/* Weekly Schedule View */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          This Week&apos;s Schedule
        </Text>
        {parsed.weekly_plan.days.map((day: TrainingDay) => {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayIndex = dayNames.indexOf(day.day);
          const eventDate = new Date(weekStart);
          eventDate.setDate(weekStart.getDate() + dayIndex);

          return (
            <View
              key={day.day}
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: "#1a1a1a",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", marginBottom: 4 }}>
                {day.day} - {eventDate.toLocaleDateString()}
              </Text>
              <Text style={{ color: "#ddd", marginBottom: 4 }}>{day.focus}</Text>
              <Text style={{ color: "#999", fontSize: 12 }}>
                {day.exercises.length} exercises
              </Text>
            </View>
          );
        })}
      </View>

      {/* Export Options */}
      <View style={{ gap: 12 }}>
        {!hasPermission && (
          <>
            <Text style={{ color: "#fff", marginBottom: 8 }}>
              Grant calendar permission to add events directly to your device calendar.
            </Text>
            <Button title="Grant Calendar Permission" onPress={requestPermission} />
          </>
        )}

        {hasPermission && (
          <Button
            title="Add to Device Calendar"
            onPress={addToDeviceCalendar}
            disabled={loading}
            color="#007AFF"
          />
        )}

        <Button
          title="Export to Google Calendar"
          onPress={exportToGoogleCalendar}
          color="#4285F4"
        />

        <Button
          title="Export as iCal File"
          onPress={exportToICal}
          color="#34C759"
        />
      </View>

      <Text style={{ color: "#999", fontSize: 12, marginTop: 24, fontStyle: "italic" }}>
        Note: iCal files can be imported into Google Calendar, Microsoft Outlook, Apple Calendar, and most other calendar apps.
      </Text>
    </ScrollView>
  );
}
