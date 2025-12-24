import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

export const useDataBillCost = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const fetchDataBillCost = useCallback(async (basePolicyId) => {
        if (!basePolicyId) {
            setError("Base policy ID is required");
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.get(
                endpoints.policy.policy.dataBillCost(basePolicyId)
            );
            setData(response.data);
            return response.data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        fetchDataBillCost,
        reset,
    };
};
