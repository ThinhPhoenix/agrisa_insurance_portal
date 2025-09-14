"use client";
import Assets from "@/assets";
import { Badge, Button, Card, Dropdown, Image } from "antd";
import {
  ArrowLeft,
  Bell,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

const CustomHeader = ({
  companyName = "Agrisa's IPP",
  companyLogo = Assets.Agrisa.src,
  companyAvatar = "https://static.vecteezy.com/system/resources/previews/015/887/591/non_2x/anonymous-group-icon-outline-style-vector.jpg",
  companyShortName = "Mock Partner",
  notificationCount = 3,
  showBackButton = true,
  showHomeButton = true,
  showDashboardButton = true,
  showNotifications = true,
  showCompanyInfo = true,
  showPortalButton = true,
  showLogo = true,
  className = "",
  customBreadcrumb = null,
  customNotifications = null,
  onMenuClick = null,
  isMobile = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Generate breadcrumb from pathname
  const generateBreadcrumb = () => {
    if (customBreadcrumb) return customBreadcrumb;

    const pathSegments = pathname.split("/").filter((segment) => segment);
    const breadcrumb = [];

    pathSegments.forEach((segment, index) => {
      const path = "/" + pathSegments.slice(0, index + 1).join("/");
      let displayName = segment;

      // Handle long IDs (truncate if longer than 10 characters)
      if (segment.length > 10) {
        displayName = segment.substring(0, 8) + "...";
      }

      // Capitalize first letter and replace underscores with spaces
      displayName = displayName
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      breadcrumb.push({
        path,
        name: displayName,
        isLast: index === pathSegments.length - 1,
      });
    });

    return breadcrumb;
  };

  const breadcrumb = generateBreadcrumb();

  // Handle navigation with force reload for cross-layout navigation
  const isAuthRoute = pathname.startsWith('/(auth)') || pathname.startsWith('/profile') || pathname.startsWith('/signin');
  const isInternalRoute = pathname.startsWith('/(internal)') || pathname.startsWith('/mockup');
  
  const forceNavigate = (url) => {
    // Force reload when navigating between different layout groups
    if ((isAuthRoute && (url.includes('mockup') || url.includes('(internal)'))) ||
        (isInternalRoute && (url.includes('profile') || url.includes('(auth)')))) {
      window.location.href = url;
    } else {
      router.push(url);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      forceNavigate("/");
    }
  };

  const handleHome = () => {
    forceNavigate("/");
  };

  const handleDashboard = () => {
    forceNavigate("/#");
  };

  const handlePortal = () => {
    forceNavigate("/#");
  };

  const handleNotification = () => {
    // Handle notification click - could open notification panel
    console.log("Notification clicked");
  };

  // Mock notification items or use custom ones
  const getNotificationItems = () => {
    if (customNotifications) {
      return [
        {
          key: "header",
          label: (
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="font-semibold text-sm text-gray-800">
                Thông báo
              </div>
            </div>
          ),
          disabled: true,
        },
        ...customNotifications,
        {
          type: "divider",
        },
        {
          key: "viewAll",
          label: (
            <div className="text-center py-2">
              <Button
                type="link"
                size="small"
                onClick={() => forceNavigate("/#")}
              >
                Xem tất cả thông báo
              </Button>
            </div>
          ),
        },
      ];
    }

    return [
      {
        key: "header",
        label: (
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="font-semibold text-sm text-gray-800">Thông báo</div>
          </div>
        ),
        disabled: true,
      },
      {
        key: "notif1",
        label: (
          <div className="flex flex-col p-3 hover:bg-gray-50 cursor-pointer">
            <div className="font-medium text-sm text-gray-800">
              Thông báo mới từ hệ thống
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Bạn có 5 yêu cầu mới cần xử lý
            </div>
            <div className="text-xs text-gray-400 mt-1">2 phút trước</div>
          </div>
        ),
        onClick: () => forceNavigate("/#"),
      },
      {
        key: "notif2",
        label: (
          <div className="flex flex-col p-3 hover:bg-gray-50 cursor-pointer">
            <div className="font-medium text-sm text-gray-800">
              Cập nhật bảo hiểm
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Chính sách bảo hiểm đã được cập nhật
            </div>
            <div className="text-xs text-gray-400 mt-1">1 giờ trước</div>
          </div>
        ),
        onClick: () => forceNavigate("/#"),
      },
      {
        key: "notif3",
        label: (
          <div className="flex flex-col p-3 hover:bg-gray-50 cursor-pointer">
            <div className="font-medium text-sm text-gray-800">
              Thông báo quan trọng
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Hệ thống sẽ bảo trì vào 22:00 tối nay
            </div>
            <div className="text-xs text-gray-400 mt-1">3 giờ trước</div>
          </div>
        ),
        onClick: () => forceNavigate("/#"),
      },
      {
        type: "divider",
      },
      {
        key: "viewAll",
        label: (
          <div className="text-center py-2">
            <Button type="link" size="small" onClick={() => forceNavigate("/#")}>
              Xem tất cả thông báo
            </Button>
          </div>
        ),
      },
    ];
  };

  const notificationItems = getNotificationItems();

  // Avatar dropdown menu items
  const avatarMenuItems = [
    {
      key: "profile",
      icon: <User size={16} />,
      label: "Thông tin cá nhân",
      onClick: () => forceNavigate("/profile"),
    },
    {
      key: "settings",
      icon: <Settings size={16} />,
      label: "Cài đặt",
      onClick: () => forceNavigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogOut size={16} />,
      label: "Đăng xuất",
      danger: true,
      onClick: () => {
        // Handle logout logic here
        console.log("Logout clicked");
        // router.push('/login');
      },
    },
  ];
  return (
    <Card
      className={`fixed-header ${className}`}
      bodyStyle={{ padding: "8px 16px" }}
    >
      <style jsx>{`
        .notification-dropdown .ant-dropdown-menu-item {
          padding: 0;
        }
        .notification-dropdown .ant-dropdown-menu-item:hover {
          background-color: transparent;
        }
        .notification-dropdown .ant-dropdown-menu-item-divider {
          margin: 0;
        }
      `}</style>
      <div className="flex items-center justify-between">
        {/* Left side - Mobile Menu + Logo/Brand + Breadcrumb */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-1">
          {/* Mobile Menu Button */}
          {isMobile && onMenuClick && (
            <Button
              type="text"
              icon={<Menu size={18} />}
              className="text-secondary-800 hover:text-primary-800"
              onClick={onMenuClick}
              title="Menu"
            />
          )}

          {showLogo && (
            <div className="flex items-center space-x-2 md:space-x-3">
              <img
                src={companyLogo}
                alt="Company Logo"
                className={`${isMobile ? "w-8 h-8" : "w-10 h-10"}`}
              />
              <span
                className={`${
                  isMobile ? "text-lg" : "text-xl"
                } font-semibold text-primary-500 ${
                  isMobile && companyName.length > 6 ? "hidden sm:block" : ""
                }`}
              >
                {companyName}
              </span>
            </div>
          )}

          {/* Breadcrumb - Hide on mobile or show simplified version */}
          {breadcrumb.length > 0 && !isMobile && (
            <div className="flex items-center space-x-2 text-secondary-600">
              <span className="text-secondary-500">/</span>
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.path}>
                  {index > 0 && <span className="text-secondary-400">/</span>}
                  {item.isLast ? (
                    <span className="text-primary-600 font-medium">
                      {item.name}
                    </span>
                  ) : (
                    <Button
                      type="text"
                      size="small"
                      className="text-secondary-900 hover:text-primary-900 p-0 h-auto"
                      onClick={() => forceNavigate(item.path)}
                    >
                      {item.name}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Right side - Navigation */}
        <div
          className={`flex items-center ${
            isMobile ? "space-x-1" : "space-x-3"
          }`}
        >
          {showBackButton && (
            <Button
              type="text"
              icon={<ArrowLeft size={16} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handleBack}
              title="Quay lại"
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && "Quay lại"}
            </Button>
          )}

          {showPortalButton && (
            <Button
              type="text"
              icon={<Home size={16} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handlePortal}
              title="Về trang chủ"
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && "Portal"}
            </Button>
          )}

          {showHomeButton && (
            <Button
              type="text"
              icon={<Home size={16} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handleHome}
              title="Trang chủ"
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && "Trang chủ"}
            </Button>
          )}

          {showDashboardButton && (
            <Button
              type="text"
              icon={<LayoutDashboard size={16} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handleDashboard}
              title="Dashboard"
              size={isMobile ? "small" : "middle"}
            >
              {!isMobile && "Dashboard"}
            </Button>
          )}

          {showNotifications && (
            <Dropdown
              menu={{ items: notificationItems }}
              placement="bottomRight"
              trigger={["click"]}
              overlayClassName="notification-dropdown"
              overlayStyle={{ width: isMobile ? "280px" : "320px" }}
            >
              <div className="cursor-pointer">
                <Badge count={notificationCount} size="small">
                  <Button
                    type="text"
                    icon={<Bell size={16} />}
                    className="text-secondary-600 hover:text-primary-600"
                    title="Thông báo"
                    size={isMobile ? "small" : "middle"}
                  />
                </Badge>
              </div>
            </Dropdown>
          )}

          {showCompanyInfo && (
            <Dropdown
              menu={{ items: avatarMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div
                className={`flex items-center ${
                  isMobile ? "ml-1" : "ml-4"
                } cursor-pointer hover:bg-secondary-50 ${
                  isMobile ? "p-1" : "p-2"
                } rounded-lg transition-colors`}
              >
                <div
                  className={`${
                    isMobile ? "h-6 w-6 mr-1" : "h-8 w-8 mr-2"
                  } overflow-hidden rounded-full`}
                >
                  <Image
                    src={companyAvatar}
                    alt="Company Avatar"
                    preview={false}
                    width={isMobile ? 24 : 32}
                    height={isMobile ? 24 : 32}
                    className="object-cover"
                  />
                </div>
                {!isMobile && (
                  <span className="text-primary-700 font-medium">
                    {companyShortName}
                  </span>
                )}
              </div>
            </Dropdown>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CustomHeader;
