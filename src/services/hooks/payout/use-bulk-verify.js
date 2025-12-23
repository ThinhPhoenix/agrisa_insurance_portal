import axiosInstance from "@/libs/axios-instance";
import { COMMON_MESSAGES } from "@/libs/message/common-message";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook for bulk payout verification functionality
 * Used for verifying multiple payouts at once
 */
const useBulkVerify = () => {
    // State for bulk verification
    const [bulkVerifyLoading, setBulkVerifyLoading] = useState(false);
    const [bulkVerifyError, setBulkVerifyError] = useState(null);
    const [bulkVerifyResult, setBulkVerifyResult] = useState(null);

    /**
     * Bulk verify payouts
     * @param {string[]} payoutIds - Array of payout IDs to verify
     * @returns {Promise<Object>} - Verification result
     */
    const bulkVerifyPayouts = useCallback(async (payoutIds) => {
        if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
            setBulkVerifyError("Danh sách ID chi trả không hợp lệ");
            return null;
        }

        setBulkVerifyLoading(true);
        setBulkVerifyError(null);
        setBulkVerifyResult(null);

        try {
            const response = await axiosInstance.post(
                endpoints.payment.bulkVerifyPayout,
                {
                    item_ids: payoutIds,
                }
            );

            if (response.data?.success) {
                setBulkVerifyResult(response.data);
                return response.data;
            } else {
                const errorMessage =
                    response.data?.message || "Xác minh chi trả thất bại";
                setBulkVerifyError(errorMessage);
                return null;
            }
        } catch (error) {
            let errorMessage = COMMON_MESSAGES.ERROR.GENERIC_ERROR;

            if (error.response?.status === 400) {
                errorMessage = "Dữ liệu không hợp lệ";
            } else if (error.response?.status === 401) {
                errorMessage = COMMON_MESSAGES.ERROR.UNAUTHORIZED;
            } else if (error.response?.status === 403) {
                errorMessage = COMMON_MESSAGES.ERROR.FORBIDDEN;
            } else if (error.response?.status === 404) {
                errorMessage = "Không tìm thấy một số chi trả";
            } else if (error.response?.status === 500) {
                errorMessage = COMMON_MESSAGES.ERROR.SERVER_ERROR;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setBulkVerifyError(errorMessage);
            return null;
        } finally {
            setBulkVerifyLoading(false);
        }
    }, []);

    /**
     * Reset bulk verify state
     */
    const resetBulkVerify = useCallback(() => {
        setBulkVerifyLoading(false);
        setBulkVerifyError(null);
        setBulkVerifyResult(null);
    }, []);

    return {
        // State
        bulkVerifyLoading,
        bulkVerifyError,
        bulkVerifyResult,

        // Actions
        bulkVerifyPayouts,
        resetBulkVerify,
    };
};

export default useBulkVerify;
