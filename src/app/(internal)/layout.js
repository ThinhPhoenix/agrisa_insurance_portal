"use client";
import Assets from "@/assets";
import CustomHeader from "@/components/custom-header";
import CustomSidebar from "@/components/custom-sidebar";
import { Grid } from "antd";
import { useEffect, useState } from "react";

const { useBreakpoint } = Grid;

export default function InternalLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Auto collapse sidebar on mobile and set initial states
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileDrawerVisible(false);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  return (
    <div className="flex h-screen relative">
      {/* Mobile Overlay */}
      {isMobile && mobileDrawerVisible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setMobileDrawerVisible(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile or shown as drawer */}
      {!isMobile && (
        <CustomSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 ${
          mobileDrawerVisible ? 'transform-none' : '-translate-x-full'
        }`}>
          <CustomSidebar
            collapsed={false}
            setCollapsed={() => {}}
            onMenuClick={() => setMobileDrawerVisible(false)}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div
          className={`fixed top-0 z-10 bg-white border-b transition-all duration-300 ${
            isMobile 
              ? "left-0 right-0" 
              : sidebarCollapsed 
                ? "left-16" 
                : "left-64"
          }`}
          style={{ right: 0 }}
        >
          {/* Mobile-responsive header */}
          <CustomHeader
            companyName={isMobile ? "AGR" : "Agrisa's IPP"}
            companyLogo={Assets.Agrisa.src}
            companyAvatar="https://www.baovietnhantho.com.vn/storage/8f698cfe-2689-4637-bee7-62e592122dee/c/tap-doan-bao-viet-large.jpg"
            companyShortName="AGR"
            notificationCount={2}
            showBackButton={!isMobile}
            showHomeButton={false} // Hide on mobile for space
            showDashboardButton={!isMobile}
            showNotifications={true}
            showCompanyInfo={true}
            showPortalButton={!isMobile}
            showLogo={isMobile || sidebarCollapsed} // Always show logo on mobile
            onMenuClick={() => setMobileDrawerVisible(true)} // Add menu trigger for mobile
            isMobile={isMobile}
            customNotifications={[
              {
                key: "system-notif1",
                label: (
                  <div className="flex flex-col p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm text-gray-800">
                      Thông báo hệ thống
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Hệ thống đã được cập nhật
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      5 phút trước
                    </div>
                  </div>
                ),
              },
              {
                key: "system-notif2",
                label: (
                  <div className="flex flex-col p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm text-gray-800">
                      Bảo trì định kỳ
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Hệ thống sẽ bảo trì lúc 23:00 hôm nay
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      2 giờ trước
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Content */}
        <main className={`flex-1 overflow-auto ${
          isMobile ? "pt-14" : "pt-16"
        } ${isMobile ? "px-0" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
