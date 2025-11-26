"use client";
import AuthLoading from "@/components/auth-loading";
import CustomHeader from "@/components/custom-header";
import CustomSidebar from "@/components/custom-sidebar";
import axiosInstance from "@/libs/axios-instance";
import { getErrorMessage } from "@/libs/message/common-message";
import { endpoints } from "@/services/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import { message } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function InternalLayoutFlexbox({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const isVerifying = useRef(false);
  const hasShownErrorRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to auth store
  const isManualLogout = useAuthStore((s) => s.isManualLogout);
  const setUser = useAuthStore((s) => s.setUser);

  // DEBUG MODE: Set to false to COMPLETELY skip /me API call on layout mount
  // (useful when BE /me is broken and you need to bypass token verification entirely)
  const DEBUG_ENABLE_ME_CHECK = false;

  useEffect(() => {
    // Prevent redirect loop when already on sign-in page
    if (!pathname || pathname.startsWith("/sign-in")) {
      setIsAuthChecking(false);
      return;
    }

    // Prevent multiple simultaneous verification calls
    if (isVerifying.current) return;

    const verifyAuth = async () => {
      // Consider token from store OR persisted token in localStorage
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // If no token at all, redirect immediately
      if (!storedToken) {
        if (!hasShownErrorRef.current && !isManualLogout) {
          message.error(getErrorMessage("SESSION_EXPIRED"));
          hasShownErrorRef.current = true;
        }
        router.push("/sign-in");
        return;
      }

      // ALWAYS verify token with /me API
      // DEBUG_ENABLE_ME_CHECK controls whether to block on error or not
      isVerifying.current = true;
      try {
        const response = await axiosInstance.get(endpoints.auth.auth_me);

        if (response.data.success) {
          // Token is valid, update user store if needed
          const profile = response.data.data || {};
          const existingToken = localStorage.getItem("token") || null;
          const existingRefresh = localStorage.getItem("refresh_token") || null;

          const userData = {
            user_id: profile.user_id || null,
            profile_id: profile.profile_id || null,
            roles: profile.role_id ? [profile.role_id] : [],
            token: existingToken,
            refresh_token: existingRefresh,
            expires_at: null,
            session_id: null,
            profile,
            user: {
              id: profile.user_id || null,
              email: profile.email || null,
              full_name: profile.full_name || null,
              display_name: profile.display_name || null,
              primary_phone: profile.primary_phone || null,
              partner_id: profile.partner_id || null,
              role_id: profile.role_id || null,
            },
          };

          setUser(userData);
          // Token verified, allow rendering
          setIsAuthChecking(false);
        } else {
          throw new Error("Invalid token");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);

        // DEBUG MODE: If false, bypass /me error and allow access
        if (!DEBUG_ENABLE_ME_CHECK) {
          console.warn("🔧 DEBUG: /me failed but bypassing error. Allowing access with existing token.");
          setIsAuthChecking(false);
          isVerifying.current = false;
          return;
        }

        // PRODUCTION MODE: Block access on /me error
        console.error("❌ /me failed. Blocking access and redirecting to sign-in.");

        // Clear token to prevent infinite redirect loop
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("me");

        // Clear user store
        const { clearUser } = useAuthStore.getState();
        clearUser();

        // Show error message only once and only if not manual logout
        if (!hasShownErrorRef.current && !isManualLogout) {
          message.error(getErrorMessage("SESSION_EXPIRED"));
          hasShownErrorRef.current = true;
        }

        router.push("/sign-in");
      } finally {
        isVerifying.current = false;
      }
    };

    verifyAuth();
  }, [pathname, router, isManualLogout, setUser]);

  // Show loading screen while checking authentication to prevent data leakage
  if (isAuthChecking) {
    return <AuthLoading />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden !important;
          margin: 0;
          padding: 0;
        }
      `}</style>

      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <CustomSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-10">
          <CustomHeader />
        </div>

        {/* Content */}
        <main className="flex-1 p-4 overflow-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
