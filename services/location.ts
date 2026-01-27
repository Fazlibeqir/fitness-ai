import * as Location from "expo-location";
import { GymLocation, LocationVerification } from "@/types";

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verify if user is at gym location
 */
export async function verifyGymLocation(
  gymLocation: GymLocation
): Promise<LocationVerification> {
  const currentLocation = await getCurrentLocation();

  if (!currentLocation) {
    return {
      verified: false,
    };
  }

  const distance = calculateDistance(
    currentLocation.coords.latitude,
    currentLocation.coords.longitude,
    gymLocation.latitude,
    gymLocation.longitude
  );

  const radius = gymLocation.radius_meters || 100; // Default 100m radius
  const verified = distance <= radius;

  return {
    verified,
    distance_meters: Math.round(distance),
    location: {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save gym location to user profile
 */
export async function saveGymLocation(
  userId: string,
  gymLocation: GymLocation
): Promise<void> {
  // This would save to Supabase profiles table
  // For now, we'll use AsyncStorage or Supabase
  // Implementation depends on your database schema
}
