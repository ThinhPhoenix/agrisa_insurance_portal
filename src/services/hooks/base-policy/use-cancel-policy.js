import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook for cancelling base policies
 * Handles API calls for cancelling base policies with two options:
 * - keep_registered_policy=true: Keep all registered policies active
 * - keep_registered_policy=false: Cancel registered policies with compensation
 */
const useCancelPolicy = () => {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  /**
   * Cancel a base policy
   * @param {string} basePolicyId - The ID of the base policy to cancel
   * @param {boolean} keepRegisteredPolicy - Whether to keep registered policies active
   * @returns {Promise<Object>} Response data from the API
   * @throws {Error} If the request fails
   */
  const cancelBasePolicyAPI = useCallback(
    async (basePolicyId, keepRegisteredPolicy = true) => {
      // Validation
      if (!basePolicyId || typeof basePolicyId !== "string") {
        const error = "ID chính sách không hợp lệ";
        setCancelError(error);
        throw new Error(error);
      }

      // Validate UUID format (basic check)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(basePolicyId)) {
        const error = "Định dạng ID chính sách không hợp lệ (phải là UUID)";
        setCancelError(error);
        throw new Error(error);
      }

      if (typeof keepRegisteredPolicy !== "boolean") {
        const error = "Tham số keep_registered_policy phải là boolean";
        setCancelError(error);
        throw new Error(error);
      }

      setCancelLoading(true);
      setCancelError(null);
      setCancelSuccess(false);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const error = "Vui lòng đăng nhập lại";
          setCancelError(error);
          throw new Error(error);
        }

        const url = endpoints.policy.base_policy.cancel(
          basePolicyId,
          keepRegisteredPolicy
        );

        const response = await axiosInstance.put(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success) {
          setCancelSuccess(true);
          return response.data;
        } else {
          const error = response.data?.message || "Huỷ hợp đồng thất bại";
          setCancelError(error);
          throw new Error(error);
        }
      } catch (error) {
        // Handle different error types
        let errorMessage = "Có lỗi xảy ra khi huỷ hợp đồng";

        if (error.response) {
          // Server responded with error
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 400:
              errorMessage = data?.message || "Tham số không hợp lệ";
              break;
            case 401:
              errorMessage =
                data?.message || "Bạn không có quyền thực hiện hành động này";
              break;
            case 500:
              errorMessage =
                data?.message || "Máy chủ đang gặp sự cố. Vui lòng thử lại sau";
              break;
            default:
              errorMessage = data?.message || error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        setCancelError(errorMessage);
        throw error;
      } finally {
        setCancelLoading(false);
      }
    },
    []
  );

  const resetState = useCallback(() => {
    setCancelLoading(false);
    setCancelError(null);
    setCancelSuccess(false);
  }, []);

  return {
    cancelBasePolicyAPI,
    cancelLoading,
    cancelError,
    cancelSuccess,
    resetState,
  };
};

export default useCancelPolicy;
