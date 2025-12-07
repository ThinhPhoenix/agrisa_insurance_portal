import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import { useCallback, useState } from "react";

export const useUnsubscribe = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    const unsubscribe = useCallback(async () => {
        if (!user?.user_id) {
            setError("User not authenticated");
            return { success: false, message: "User not authenticated" };
        }

        setLoading(true);
        setError(null);

        try {
            await axiosInstance.post(endpoints.noti.unsubscribe, {});

            setLoading(false);
            return { success: true };
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || "Unsubscription failed";
            setError(errorMessage);
            setLoading(false);
            return { success: false, message: errorMessage };
        }
    }, [user?.user_id]);

    return {
        unsubscribe,
        loading,
        error,
    };
};
