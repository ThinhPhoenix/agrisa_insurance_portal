"use client";

import { useAuthRefresh } from "@/services/hooks/auth/use-auth-refresh";

/**
 * Provider component that automatically refreshes auth token
 * Calls /me API every 3 minutes to keep token active
 */
export default function AuthRefreshProvider({ children }) {
  // Initialize the auth refresh hook
  useAuthRefresh();

  return <>{children}</>;
}
