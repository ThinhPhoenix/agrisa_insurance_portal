self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || "/agrisa.png",
            badge: data.badge || "/agrisa.png",
            image: data.image,
            data: data.data,
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false,
            actions: data.actions || [],
            tag: data.tag,
            renotify: data.renotify || false,
            timestamp: data.timestamp || Date.now(),
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const notificationData = event.notification.data;

    if (event.action) {
        console.log("Action clicked:", event.action);
    } else {
        event.waitUntil(clients.openWindow(notificationData?.url || "/"));
    }
});

self.addEventListener("notificationclose", function (event) {
    console.log("Notification closed", event.notification);
});

self.addEventListener("install", function (event) {
    console.log("Service Worker installing.", event);
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    console.log("Service Worker activating.", event);
    event.waitUntil(self.clients.claim());
});
