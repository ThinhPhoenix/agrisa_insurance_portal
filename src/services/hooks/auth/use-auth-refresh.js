import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthMe } from "./use-auth";

/**
 * Auto-refresh hook to keep token alive
 * Calls /me API every 180 seconds (3 minutes) to prevent token expiration
 * Token expires after 5 minutes of inactivity, so 3-minute refresh keeps it active
 */
export const useAuthRefresh = () => {
  const { authMe } = useAuthMe();
  const { getToken, user } = useAuthStore();
  const intervalRef = useRef(null);

  // Refresh interval: 180 seconds (3 minutes)
  const REFRESH_INTERVAL = 180 * 1000; // 180000ms = 3 minutes

  useEffect(() => {
    const token = getToken();

    // Only set up refresh if user is authenticated
    if (!token || !user?.user_id) {
      // Clear any existing interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log("🔄 Auth refresh: Starting automatic token refresh (every 3 minutes)");

    // Set up interval to refresh token
    intervalRef.current = setInterval(async () => {
      const currentToken = getToken();

      // Double-check token still exists before refreshing
      if (currentToken) {
        console.log("🔄 Auth refresh: Calling /me to keep token active");
        try {
          const result = await authMe();
          if (result.success) {
            console.log("✅ Auth refresh: Token refreshed successfully");
          } else {
            console.warn("⚠️ Auth refresh: Failed to refresh token", result.message);
          }
        } catch (error) {
          console.error("❌ Auth refresh: Error during token refresh", error);
        }
      } else {
        // Token was removed, clear the interval
        console.log("🔄 Auth refresh: Token no longer exists, stopping refresh");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, REFRESH_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        console.log("🔄 Auth refresh: Cleaning up interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.user_id, getToken, authMe]);

  return null;
};
