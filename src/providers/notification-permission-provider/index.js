"use client";

import { useEffect } from "react";

export default function NotificationPermissionProvider() {
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission().then((permission) => {
                console.log("Notification permission:", permission);
            });
        }
    }, []);

    return null;
}
