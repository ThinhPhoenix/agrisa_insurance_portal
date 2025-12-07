"use client";

import { useEffect } from "react";

export default function NotificationPermissionProvider({ children }) {
    useEffect(() => {
        const enableNotifications =
            localStorage.getItem("enableNotifications") === "true";
        if (enableNotifications && "Notification" in window) {
            Notification.requestPermission().then((permission) => {
                console.log("Notification permission:", permission);
            });
        }
    }, []);

    return children;
}
