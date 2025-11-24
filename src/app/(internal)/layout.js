"use client";
import CustomHeader from "@/components/custom-header";
import CustomSidebar from "@/components/custom-sidebar";
import { getErrorMessage } from "@/libs/message/common-message";
import { useAuthStore } from "@/stores/auth-store";
import { message } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InternalLayoutFlexbox({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to the whole user object to avoid creating a new selector object each render
  const user = useAuthStore((s) => s.user);
  const isManualLogout = useAuthStore((s) => s.isManualLogout);

  useEffect(() => {
    // Prevent redirect loop when already on sign-in page
    if (!pathname || pathname.startsWith("/sign-in")) return;

    // Consider token from store OR persisted token in localStorage
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const hasToken = Boolean(user?.token) || Boolean(storedToken);
    const hasRoles = Array.isArray(user?.roles) && user.roles.length > 0;

    // If there's no token and no roles, treat as unauthenticated and redirect
    const isAuthenticated = hasToken || hasRoles;

    // Only redirect if we're not already on the sign-in page and not authenticated
    if (!isAuthenticated && pathname && pathname !== "/sign-in") {
      // Show Vietnamese error message for session expiration only once
      // BUT NOT if user manually logged out
      if (!hasShownError && !isManualLogout) {
        message.error(getErrorMessage("SESSION_EXPIRED"));
        setHasShownError(true);
      }

      // Prevent trying to push the same route repeatedly
      try {
        router.push("/sign-in");
      } catch (e) {
        // swallow navigation errors to avoid breaking the app
        // (some Next versions may throw when pushing the current route)
        // eslint-disable-next-line no-console
        console.warn("Navigation to /sign-in failed:", e);
      }
    }
  }, [user, pathname, router, hasShownError, isManualLogout]);

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
