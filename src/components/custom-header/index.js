"use client";
import Assets from "@/assets";
import { Badge, Button, Card, Dropdown, Image } from "antd";
import {
  ArrowLeft,
  Bell,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

const CustomHeader = ({
  companyName = "Agrisa's IPP",
  companyLogo = Assets.Agrisa.src,
  companyAvatar = "https://static.vecteezy.com/system/resources/previews/015/887/591/non_2x/anonymous-group-icon-outline-style-vector.jpg",
  companyShortName = "VIC",
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

  // Handle navigation
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleHome = () => {
    router.push("/");
  };

  const handleDashboard = () => {
    router.push("/#");
  };

  const handlePortal = () => {
    router.push("/#");
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
                onClick={() => router.push("/#")}
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
        onClick: () => router.push("/#"),
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
        onClick: () => router.push("/#"),
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
        onClick: () => router.push("/#"),
      },
      {
        type: "divider",
      },
      {
        key: "viewAll",
        label: (
          <div className="text-center py-2">
            <Button type="link" size="small" onClick={() => router.push("/#")}>
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
      onClick: () => router.push("/profile"),
    },
    {
      key: "settings",
      icon: <Settings size={16} />,
      label: "Cài đặt",
      onClick: () => router.push("/settings"),
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
    <Card className={`fixed-header ${className}`}>
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
        {/* Left side - Logo, Brand and Breadcrumb */}
        <div className="flex items-center space-x-4">
          {showLogo && (
            <div className="flex items-center space-x-3">
              <img src={companyLogo} alt="Company Logo" className="w-10 h-10" />
              <span className="text-xl font-semibold text-primary-500">
                {companyName}
              </span>
            </div>
          )}

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
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
                      onClick={() => router.push(item.path)}
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
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <Button
              type="text"
              icon={<ArrowLeft size={18} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handleBack}
              title="Quay lại"
            >
              Quay lại
            </Button>
          )}

          {showPortalButton && (
            <Button
              type="text"
              icon={<Home size={18} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handlePortal}
              title="Về trang chủ"
            >
              Portal
            </Button>
          )}

          {showHomeButton && (
            <Button
              type="text"
              icon={<Home size={18} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handleHome}
              title="Trang chủ"
            >
              Trang chủ
            </Button>
          )}

          {showDashboardButton && (
            <Button
              type="text"
              icon={<LayoutDashboard size={18} />}
              className="text-secondary-600 hover:text-primary-600"
              onClick={handleDashboard}
              title="Dashboard"
            >
              Dashboard
            </Button>
          )}

          {showNotifications && (
            <Dropdown
              menu={{ items: notificationItems }}
              placement="bottomRight"
              trigger={["click"]}
              overlayClassName="notification-dropdown"
              overlayStyle={{ width: "320px" }}
            >
              <div className="cursor-pointer">
                <Badge count={notificationCount} size="small">
                  <Button
                    type="text"
                    icon={<Bell size={18} />}
                    className="text-secondary-600 hover:text-primary-600"
                    title="Thông báo"
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
              <div className="flex items-center ml-4 cursor-pointer hover:bg-secondary-50 p-2 rounded-lg transition-colors">
                <div className="h-8 w-8 mr-2 overflow-hidden rounded-full">
                  <Image
                    src={companyAvatar}
                    alt="Company Avatar"
                    preview={false}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <span className="text-primary-700 font-medium">
                  {companyShortName}
                </span>
              </div>
            </Dropdown>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CustomHeader;
