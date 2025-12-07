import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import { useCallback, useState } from "react";

export const useSubscribe = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    const subscribe = useCallback(
        async (subscription) => {
            if (!user?.user_id) {
                setError("User not authenticated");
                return { success: false, message: "User not authenticated" };
            }

            setLoading(true);
            setError(null);

            try {
                const data = {
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys?.p256dh,
                    auth: subscription.keys?.auth,
                };

                await axiosInstance.post(endpoints.noti.subscribe, data);

                setLoading(false);
                return { success: true };
            } catch (err) {
                const errorMessage =
                    err.response?.data?.message || "Subscription failed";
                setError(errorMessage);
                setLoading(false);
                return { success: false, message: errorMessage };
            }
        },
        [user?.user_id]
    );

    return {
        subscribe,
        loading,
        error,
    };
};
