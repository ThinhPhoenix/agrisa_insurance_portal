"use client";

import { useSubscribe } from "@/services/hooks/noti/use-subscribe";
import { useUnsubscribe } from "@/services/hooks/noti/use-unsubscribe";
import { useValidateSubscription } from "@/services/hooks/noti/use-validate";
import { Card, Divider, Space, Spin, Switch, Typography, message } from "antd";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

export default function GeneralSettingsPage() {
    const [enableNotifications, setEnableNotifications] = useState(false);
    const [validating, setValidating] = useState(true);
    const { subscribe } = useSubscribe();
    const { unsubscribe } = useUnsubscribe();
    const { validate } = useValidateSubscription();

    const urlBase64ToUint8Array = (base64String) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    // Check notification subscription status on mount
    useEffect(() => {
        const checkValidation = async () => {
            setValidating(true);
            const result = await validate();
            if (result.success && result.data) {
                setEnableNotifications(result.data.value);
            } else {
                setEnableNotifications(false);
            }
            setValidating(false);
        };
        checkValidation();
    }, []);

    const handleNotificationToggle = async (checked) => {
        console.log("=== Toggling notifications to:", checked);

        if (checked) {
            // Subscribe
            if (!"serviceWorker" in navigator) {
                console.error("Service Worker not supported");
                setEnableNotifications(false);
                message.error("Trình duyệt không hỗ trợ Service Worker");
                return;
            }

            if (!"PushManager" in window) {
                console.error("Push Manager not supported");
                setEnableNotifications(false);
                message.error("Trình duyệt không hỗ trợ Push Notifications");
                return;
            }

            try {
                // Request permission if not granted
                console.log("Current permission:", Notification.permission);
                if (Notification.permission !== "granted") {
                    console.log("Requesting notification permission...");
                    const permission = await Notification.requestPermission();
                    console.log("Permission result:", permission);
                    if (permission !== "granted") {
                        console.error("Notification permission denied");
                        setEnableNotifications(false);
                        message.error("Bạn đã từ chối quyền thông báo");
                        return;
                    }
                }

                console.log("Registering service worker...");
                const registration = await navigator.serviceWorker.register(
                    "/sw.js"
                );
                await navigator.serviceWorker.ready;
                console.log(
                    "Service worker registered and ready:",
                    registration
                );

                // Check if already subscribed
                let subscription =
                    await registration.pushManager.getSubscription();

                if (!subscription) {
                    console.log(
                        "No existing subscription, creating new one..."
                    );
                    console.log(
                        "VAPID key:",
                        process.env.NEXT_PUBLIC_VAPID_KEY
                    );

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(
                            process.env.NEXT_PUBLIC_VAPID_KEY
                        ),
                    });
                    console.log("New subscription created:", subscription);
                } else {
                    console.log("Using existing subscription:", subscription);
                }

                console.log("Subscription endpoint:", subscription.endpoint);

                // Convert ArrayBuffer keys to base64 strings
                const subscriptionData = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64(
                            subscription.getKey("p256dh")
                        ),
                        auth: arrayBufferToBase64(subscription.getKey("auth")),
                    },
                };

                console.log("Subscription data prepared:", subscriptionData);
                console.log("Calling subscribe hook...");
                const result = await subscribe(subscriptionData);
                console.log("Subscribe result:", result);

                if (result.success) {
                    setEnableNotifications(true);
                    message.success("Bật thông báo thành công");
                } else {
                    setEnableNotifications(false);
                    message.error("Lỗi khi bật thông báo");
                }
            } catch (error) {
                console.error("Subscription failed with error:", error);
                console.error("Error stack:", error.stack);
                setEnableNotifications(false);
                message.error("Lỗi khi bật thông báo");
            }
        } else {
            // Unsubscribe
            try {
                console.log("=== Unsubscribing...");
                const result = await unsubscribe();
                console.log("Unsubscribe result:", result);

                if (result.success) {
                    setEnableNotifications(false);
                    message.success("Tắt thông báo thành công");
                } else {
                    message.error("Lỗi khi tắt thông báo");
                }
            } catch (error) {
                console.error("Unsubscription failed:", error);
                message.error("Lỗi khi tắt thông báo");
            }
        }
    };

    return (
        <div style={{ padding: "24px" }}>
            <Card style={{ marginBottom: "24px" }}>
                <Title level={3}>Cài đặt chung</Title>
                <Text type="secondary">
                    Quản lý các cài đặt chung của hệ thống
                </Text>
                <Divider />

                <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="large"
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Text strong>Bật/Tắt thông báo</Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                                Cho phép nhận thông báo từ hệ thống
                            </Text>
                        </Space>
                        {validating ? (
                            <Spin size="small" />
                        ) : (
                            <Switch
                                checked={enableNotifications}
                                onChange={handleNotificationToggle}
                            />
                        )}
                    </div>
                </Space>
            </Card>
        </div>
    );
}
