import { useSignOut } from "@/services/hooks/auth/use-auth";
import { useMarkAsRead } from "@/services/hooks/noti/use-mark-as-read";
import { useNotificationsInfinite } from "@/services/hooks/noti/use-pagination";
import { useGetPartnerProfile } from "@/services/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth-store";
import {
    App,
    Avatar,
    Badge,
    Button,
    Dropdown,
    Empty,
    Spin,
    Typography,
} from "antd";
import { Bell, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const { Text } = Typography;

export default function AvatarSection({ isMobile }) {
    const router = useRouter();
    const { message } = App.useApp();
    const { signOut, isLoading: isLoggingOut } = useSignOut();
    const dropdownRef = useRef(null);
    const { user } = useAuthStore();
    const { getPartnerProfile, data: partnerData } = useGetPartnerProfile();

    // Fetch partner profile on mount
    useEffect(() => {
        if (user?.user?.partner_id) {
            getPartnerProfile(user.user.partner_id);
        }
    }, [user?.user?.partner_id, getPartnerProfile]);

    // Notification hooks
    const {
        data: notifications,
        loading,
        error,
        hasNextPage,
        loadMore,
        unreadCount,
        refresh,
    } = useNotificationsInfinite(10);
    const { markAsRead } = useMarkAsRead();

    // Local state for tracking read status
    const [readNotifications, setReadNotifications] = useState(new Set());

    const handleDropdownOpenChange = useCallback(
        (open) => {
            if (open) {
                // Add scroll listener when dropdown opens
                setTimeout(() => {
                    const dropdownMenu =
                        document.querySelector(".ant-dropdown-menu");
                    if (dropdownMenu) {
                        const handleScroll = (e) => {
                            const { scrollTop, scrollHeight, clientHeight } =
                                e.target;
                            if (
                                scrollHeight - scrollTop <= clientHeight + 50 &&
                                hasNextPage &&
                                !loading
                            ) {
                                loadMore();
                            }
                        };
                        dropdownMenu.addEventListener("scroll", handleScroll);

                        // Store the listener for cleanup
                        dropdownMenu._scrollListener = handleScroll;
                    }
                }, 100);
            } else {
                // Remove scroll listener when dropdown closes
                const dropdownMenu =
                    document.querySelector(".ant-dropdown-menu");
                if (dropdownMenu && dropdownMenu._scrollListener) {
                    dropdownMenu.removeEventListener(
                        "scroll",
                        dropdownMenu._scrollListener
                    );
                    delete dropdownMenu._scrollListener;
                }
            }
        },
        [hasNextPage, loading, loadMore]
    );

    const handleMarkAsRead = useCallback(
        async (notificationId) => {
            try {
                // Mark locally first for immediate UI feedback
                setReadNotifications(
                    (prev) => new Set([...prev, notificationId])
                );

                // Call API to mark as read
                const result = await markAsRead([notificationId]);
                if (!result.success) {
                    // Revert on error
                    setReadNotifications((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(notificationId);
                        return newSet;
                    });
                    message.error("Không thể đánh dấu đã đọc");
                } else {
                    // Refresh to update unread count
                    refresh();
                }
            } catch (error) {
                // Revert on error
                setReadNotifications((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(notificationId);
                    return newSet;
                });
                message.error("Lỗi khi đánh dấu đã đọc");
            }
        },
        [markAsRead, refresh]
    );

    const handleMarkAllAsRead = useCallback(async () => {
        const unreadIds = notifications
            .filter((n) => !readNotifications.has(n.id) && n.status !== "read")
            .map((n) => n.id);

        if (unreadIds.length === 0) return;

        try {
            // Mark locally first
            setReadNotifications((prev) => new Set([...prev, ...unreadIds]));

            // Call API
            const result = await markAsRead(unreadIds);
            if (!result.success) {
                // Revert on error
                setReadNotifications((prev) => {
                    const newSet = new Set(prev);
                    unreadIds.forEach((id) => newSet.delete(id));
                    return newSet;
                });
                message.error("Không thể đánh dấu tất cả đã đọc");
            } else {
                // Refresh to update unread count
                refresh();
            }
        } catch (error) {
            // Revert on error
            setReadNotifications((prev) => {
                const newSet = new Set(prev);
                unreadIds.forEach((id) => newSet.delete(id));
                return newSet;
            });
            message.error("Lỗi khi đánh dấu tất cả đã đọc");
        }
    }, [notifications, readNotifications, markAsRead, refresh]);

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

    const notificationItems =
        notifications.length === 0 && !loading
            ? []
            : [
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
                                  backgroundColor:
                                      readNotifications.has(item.id) ||
                                      item.status === "read"
                                          ? "transparent"
                                          : getTypeColor(
                                                item.platform || "default"
                                            ),
                                  borderLeft:
                                      readNotifications.has(item.id) ||
                                      item.status === "read"
                                          ? "none"
                                          : `3px solid ${getTypeBorderColor(
                                                item.platform || "default"
                                            )}`,
                                  borderRadius: "4px",
                                  marginBottom: "4px",
                                  transition: "all 0.2s",
                              }}
                          >
                              <div
                                  style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: 4,
                                  }}
                              >
                                  <Text strong style={{ fontSize: 13 }}>
                                      {item.title}
                                  </Text>
                                  {!readNotifications.has(item.id) &&
                                      item.status !== "read" && (
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
                              <Text
                                  style={{
                                      fontSize: 12,
                                      color: "#8c8c8c",
                                      display: "block",
                                      marginBottom: 4,
                                  }}
                              >
                                  {item.body}
                              </Text>
                              <Text style={{ fontSize: 11, color: "#bfbfbf" }}>
                                  {formatTimestamp(item.createdAt)}
                              </Text>
                          </div>
                      ),
                  })),
                  // Loading indicator for infinite scroll
                  ...(hasNextPage
                      ? [
                            {
                                key: "loading",
                                label: (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "8px",
                                        }}
                                    >
                                        <Spin size="small" />
                                        <div style={{ marginTop: 4 }}>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: "#bfbfbf",
                                                }}
                                            >
                                                Đang tải thêm...
                                            </Text>
                                        </div>
                                    </div>
                                ),
                            },
                        ]
                      : []),
              ];

    const handleLogout = async () => {
        try {
            const result = await signOut();
            if (result.success) {
                message.success(result.message);
                router.push("/sign-in");
            }
        } catch (error) {
            message.error("Đăng xuất thất bại. Vui lòng thử lại!");
        }
    };

    const avatarMenuItems = [
        {
            key: "profile",
            label: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={16} />
                    <span>Xem hồ sơ</span>
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
            disabled: isLoggingOut,
            danger: true,
        },
    ];

    return (
        <div className="flex items-center gap-2">
            <Dropdown
                menu={{
                    items:
                        loading && notifications.length === 0
                            ? [
                                  {
                                      key: "loading",
                                      label: (
                                          <div
                                              style={{
                                                  padding: "20px",
                                                  textAlign: "center",
                                              }}
                                          >
                                              <Spin size="small" />
                                              <div style={{ marginTop: 8 }}>
                                                  <Text
                                                      style={{
                                                          fontSize: 12,
                                                          color: "#bfbfbf",
                                                      }}
                                                  >
                                                      Đang tải thông báo...
                                                  </Text>
                                              </div>
                                          </div>
                                      ),
                                  },
                              ]
                            : error
                            ? [
                                  {
                                      key: "error",
                                      label: (
                                          <div
                                              style={{
                                                  padding: "20px",
                                                  textAlign: "center",
                                              }}
                                          >
                                              <Empty
                                                  description="Không thể tải thông báo"
                                                  image={
                                                      Empty.PRESENTED_IMAGE_SIMPLE
                                                  }
                                              />
                                              <Button
                                                  size="small"
                                                  onClick={() =>
                                                      window.location.reload()
                                                  }
                                                  style={{ marginTop: 8 }}
                                              >
                                                  Thử lại
                                              </Button>
                                          </div>
                                      ),
                                  },
                              ]
                            : notifications.length === 0
                            ? [
                                  {
                                      key: "empty",
                                      label: (
                                          <div
                                              style={{
                                                  padding: "20px",
                                                  textAlign: "center",
                                              }}
                                          >
                                              <Empty
                                                  description="Không có thông báo"
                                                  image={
                                                      Empty.PRESENTED_IMAGE_SIMPLE
                                                  }
                                              />
                                          </div>
                                      ),
                                  },
                              ]
                            : notificationItems,
                }}
                placement="bottomRight"
                trigger={["click"]}
                onOpenChange={handleDropdownOpenChange}
                overlayStyle={{
                    width: isMobile ? "280px" : "360px",
                }}
                dropdownRender={(menu) => (
                    <div
                        ref={dropdownRef}
                        style={{
                            maxHeight: "480px",
                            overflow: "auto",
                        }}
                    >
                        {menu}
                    </div>
                )}
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
            <Dropdown
                menu={{ items: avatarMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
            >
                <Avatar
                    size={32}
                    src={partnerData?.partner_logo_url}
                    alt={
                        partnerData?.partner_display_name ||
                        user?.user?.full_name
                    }
                    style={{ cursor: "pointer" }}
                >
                    {partnerData?.partner_display_name
                        ? partnerData.partner_display_name
                              .charAt(0)
                              .toUpperCase()
                        : user?.user?.full_name
                        ? user.user.full_name.charAt(0).toUpperCase()
                        : "U"}
                </Avatar>
            </Dropdown>
        </div>
    );
}
