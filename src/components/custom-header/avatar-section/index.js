import { Avatar, Badge, Button, Dropdown, Empty, Typography } from "antd";
import { Bell, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignOut } from "@/services/hooks/auth/use-auth";
import notificationData from "../notification-mock-data.json";

const { Text } = Typography;

export default function AvatarSection({ isMobile }) {
  const router = useRouter();
  const { signOut } = useSignOut();
  const [notifications, setNotifications] = useState(notificationData);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "approval":
        return "#e6f4ff";
      case "claim":
        return "#f0f5ff";
      case "policy":
        return "#fff7e6";
      default:
        return "#f5f5f5";
    }
  };

  const getTypeBorderColor = (type) => {
    switch (type) {
      case "approval":
        return "#91caff";
      case "claim":
        return "#adc6ff";
      case "policy":
        return "#ffd591";
      default:
        return "#d9d9d9";
    }
  };

  const notificationItems = notifications.length === 0 ? [] : [
    {
      key: "header",
      type: "group",
      label: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
          }}
        >
          <Text strong>Thông báo</Text>
          {unreadCount > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: "#1677ff",
                cursor: "pointer",
              }}
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả đã đọc
            </Text>
          )}
        </div>
      ),
    },
    {
      type: "divider",
    },
    ...notifications.map((item) => ({
      key: item.id,
      label: (
        <div
          onClick={() => handleMarkAsRead(item.id)}
          style={{
            padding: "8px",
            cursor: "pointer",
            backgroundColor: item.read ? "transparent" : getTypeColor(item.type),
            borderLeft: item.read ? "none" : `3px solid ${getTypeBorderColor(item.type)}`,
            borderRadius: "4px",
            marginBottom: "4px",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13 }}>
              {item.title}
            </Text>
            {!item.read && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#1677ff",
                  marginTop: 4,
                }}
              />
            )}
          </div>
          <Text style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 4 }}>
            {item.description}
          </Text>
          <Text style={{ fontSize: 11, color: "#bfbfbf" }}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </div>
      ),
    })),
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const avatarMenuItems = [
    {
      key: "profile",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <User size={16} />
          <span>Xem profile</span>
        </div>
      ),
      onClick: () => router.push("/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </div>
      ),
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        menu={{
          items:
            notifications.length === 0
              ? [
                  {
                    key: "empty",
                    label: (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <Empty
                          description="Không có thông báo"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      </div>
                    ),
                  },
                ]
              : notificationItems,
        }}
        placement="bottomRight"
        trigger={["click"]}
        overlayStyle={{
          width: isMobile ? "280px" : "360px",
          maxHeight: "480px",
          overflow: "auto",
        }}
      >
        <div className="cursor-pointer">
          <Badge count={unreadCount} size="small">
            <Button
              type="dashed"
              icon={<Bell size={16} />}
              className="!bg-secondary-200"
            />
          </Badge>
        </div>
      </Dropdown>
      <Dropdown menu={{ items: avatarMenuItems }} placement="bottomRight" trigger={["click"]}>
        <Avatar
          size={32}
          src="https://www.baovietnhantho.com.vn/storage/8f698cfe-2689-4637-bee7-62e592122dee/c/tap-doan-bao-viet-large.jpg"
          style={{ cursor: "pointer" }}
        />
      </Dropdown>
    </div>
  );
}
