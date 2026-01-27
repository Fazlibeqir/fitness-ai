import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View, Button, TextInput, Alert } from "react-native";
import { getCurrentLocation, requestLocationPermission } from "../services/location";
import { supabase } from "../services/supabase";

export default function GymSetupScreen() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [loading, setLoading] = useState(false);

  const getCurrentLocationPress = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Location permission is required to set gym location.");
        setLoading(false);
        return;
      }

      const location = await getCurrentLocation();
      if (location) {
        setLatitude(location.coords.latitude.toString());
        setLongitude(location.coords.longitude.toString());
        Alert.alert("Success", "Current location captured!");
      } else {
        Alert.alert("Error", "Failed to get current location");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  const saveGymLocation = async () => {
    if (!latitude || !longitude) {
      Alert.alert("Error", "Please enter or capture gym location");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Not logged in");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          gym_latitude: parseFloat(latitude),
          gym_longitude: parseFloat(longitude),
          gym_radius_meters: radius ? parseInt(radius) : 100,
        })
        .eq("user_id", user.id);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Gym location saved!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

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
        Set Gym Location
      </Text>

      <Text style={{ color: "#fff", marginBottom: 8, fontSize: 14 }}>
        Setting your gym location allows the app to verify you're at the gym before starting training sessions. This helps ensure accurate progress tracking.
      </Text>

      <View style={{ marginTop: 24, marginBottom: 16 }}>
        <Button
          title="Use Current Location"
          onPress={getCurrentLocationPress}
          disabled={loading}
          color="#007AFF"
        />
      </View>

      <Text style={{ color: "#fff", marginBottom: 6, marginTop: 16 }}>Latitude</Text>
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
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        placeholder="e.g., 40.7128"
      />

      <Text style={{ color: "#fff", marginBottom: 6 }}>Longitude</Text>
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
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        placeholder="e.g., -74.0060"
      />

      <Text style={{ color: "#fff", marginBottom: 6 }}>Verification Radius (meters)</Text>
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
        value={radius}
        onChangeText={setRadius}
        keyboardType="numeric"
        placeholder="100"
      />

      <Text style={{ color: "#999", fontSize: 12, marginBottom: 24 }}>
        Default: 100 meters. You must be within this radius to start a session.
      </Text>

      <Button
        title="Save Gym Location"
        onPress={saveGymLocation}
        disabled={loading || !latitude || !longitude}
        color="#34C759"
      />
    </ScrollView>
  );
}
