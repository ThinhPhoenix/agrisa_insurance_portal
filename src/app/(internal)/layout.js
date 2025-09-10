"use client";
import Assets from "@/assets";
import CustomHeader from "@/components/custom-header";
import CustomSidebar from "@/components/custom-sidebar";
import { useState } from "react";

export default function InternalLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <CustomSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content area với header */}
      <div className="flex-1 flex flex-col">
        {/* Header - chỉ chiếm phần bên phải, bên cạnh sidebar */}
        <div
          className={`fixed top-0 z-10 bg-white border-b transition-all duration-300 ${
            sidebarCollapsed ? "left-16" : "left-64"
          }`}
          style={{ right: 0 }}
        >
          <CustomHeader
            companyName="Agrisa's IPP"
            companyLogo={Assets.Agrisa.src}
            companyAvatar="https://www.baovietnhantho.com.vn/storage/8f698cfe-2689-4637-bee7-62e592122dee/c/tap-doan-bao-viet-large.jpg"
            companyShortName="AGR"
            notificationCount={2}
            showBackButton={true}
            showHomeButton={true}
            showDashboardButton={true}
            showNotifications={true}
            showCompanyInfo={true}
            showPortalButton={true}
            showLogo={sidebarCollapsed} // Hiện logo khi sidebar đóng, ẩn khi sidebar mở
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
        <main className="flex-1 overflow-auto pt-16">{children}</main>
      </div>
    </div>
  );
}
