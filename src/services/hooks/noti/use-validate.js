import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook để validate subscription cho platform web
 * @returns {object} { validate, loading, error }
 */
export const useValidateSubscription = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const validate = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axiosInstance.get(endpoints.noti.validate);

            setLoading(false);
            return { success: true, data };
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || "Validation failed";
            setError(errorMessage);
            setLoading(false);
            return { success: false, message: errorMessage };
        }
    }, []);

    return {
        validate,
        loading,
        error,
    };
};
