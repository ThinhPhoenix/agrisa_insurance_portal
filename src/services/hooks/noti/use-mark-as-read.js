import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook để đánh dấu thông báo đã đọc
 * @returns {object} { markAsRead, loading, error }
 */
export const useMarkAsRead = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const markAsRead = useCallback(async (receiverIds) => {
        if (
            !receiverIds ||
            !Array.isArray(receiverIds) ||
            receiverIds.length === 0
        ) {
            setError("Receiver IDs are required");
            return { success: false, message: "Receiver IDs are required" };
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await axiosInstance.post(
                endpoints.noti.mark_as_read,
                {
                    receiverIds,
                }
            );

            setLoading(false);
            return { success: true, data };
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || "Failed to mark as read";
            setError(errorMessage);
            setLoading(false);
            return { success: false, message: errorMessage };
        }
    }, []);

    return {
        markAsRead,
        loading,
        error,
    };
};
