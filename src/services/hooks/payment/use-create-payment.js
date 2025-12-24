import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useState } from "react";

export const useCreatePayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createPayment = async ({ amount, description, type, items }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.post(
                endpoints.payment.createPaymentLink,
                {
                    amount,
                    description,
                    return_url: `${window.location.origin}/payment/success`,
                    cancel_url: `${window.location.origin}/payment/fail`,
                    type,
                    items,
                }
            );
            return response.data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createPayment,
        loading,
        error,
    };
};
