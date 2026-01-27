import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserAndProfile();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth-test");
      } else if (!hasProfile) {
        // New user - needs onboarding
        router.replace("/onboarding");
      } else {
        // Existing user with profile - go to home
        (router.replace as any)("/(tabs)");
      }
    }
  }, [loading, user, hasProfile, router]);

  const checkUserAndProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (user) {
      // Check if user has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();
      
      setHasProfile(!!profile);
    }
    
    setUser(user);
    setLoading(false);
  };

  return null;
}
