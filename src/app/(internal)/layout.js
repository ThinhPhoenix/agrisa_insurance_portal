"use client";
import AuthLoading from "@/components/auth-loading";
import CustomHeader from "@/components/custom-header";
import CustomSidebar from "@/components/custom-sidebar";
import { useAuthStore } from "@/stores/auth-store";
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
  const DEBUG_ENABLE_ME_CHECK = true;

  useEffect(() => {
    // Prevent redirect loop when already on sign-in page
    if (!pathname || pathname.startsWith("/sign-in")) {
      setIsAuthChecking(false);
      return;
    }

    // Prevent multiple simultaneous verification calls
    if (isVerifying.current) return;

    const verifyAuth = async () => {
      // STEP 1: Check localStorage for token and /me - redirect immediately if missing
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const storedMe =
        typeof window !== "undefined" ? localStorage.getItem("me") : null;

      // If no token or no /me data, redirect immediately without message
      if (!storedToken || !storedMe) {
        console.warn("⚠️ Missing token or /me data - redirecting to sign-in");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("me");
        const { clearUser } = useAuthStore.getState();
        clearUser();
        router.push("/sign-in");
        return;
      }

      // STEP 2: Validate /me data from localStorage
      try {
        const meData = JSON.parse(storedMe);

        // Check if role_id is system_admin - FORBIDDEN
        if (meData.role_id === "system_admin") {
          console.warn("⚠️ Access denied: system_admin role detected");
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("me");
          const { clearUser } = useAuthStore.getState();
          clearUser();
          router.push("/sign-in");
          return;
        }

        // Check if partner_id is null, empty, or string "null" - FORBIDDEN
        if (
          !meData.partner_id ||
          meData.partner_id.trim() === "" ||
          meData.partner_id === "null" ||
          meData.partner_id === "undefined"
        ) {
          console.warn("⚠️ Access denied: missing or invalid partner_id");
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("me");
          const { clearUser } = useAuthStore.getState();
          clearUser();
          router.push("/sign-in");
          return;
        }

        // STEP 3: Data looks valid, update store and allow access
        const existingToken = localStorage.getItem("token") || null;
        const existingRefresh = localStorage.getItem("refresh_token") || null;

        const userData = {
          user_id: meData.user_id || null,
          profile_id: meData.profile_id || null,
          roles: meData.role_id ? [meData.role_id] : [],
          token: existingToken,
          refresh_token: existingRefresh,
          expires_at: null,
          session_id: null,
          profile: meData,
          user: {
            id: meData.user_id || null,
            email: meData.email || null,
            full_name: meData.full_name || null,
            display_name: meData.display_name || null,
            primary_phone: meData.primary_phone || null,
            partner_id: meData.partner_id || null,
            role_id: meData.role_id || null,
          },
        };

        setUser(userData);
        setIsAuthChecking(false);
      } catch (parseError) {
        // /me data is corrupted, redirect to sign-in
        console.warn("⚠️ Corrupted /me data - redirecting to sign-in");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("me");
        const { clearUser } = useAuthStore.getState();
        clearUser();
        router.push("/sign-in");
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
