"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback } from "react";

// Hook for creating cancel request
export function useCreateCancelRequest() {
  const createCancelRequest = useCallback(async (policyId, cancelData) => {
    try {
      const response = await axiosInstance.post(
        `${endpoints.cancelRequest.create}?policy_id=${policyId}`,
        {
          cancel_request_type: cancelData.cancel_request_type,
          reason: cancelData.reason,
          compensate_amount: cancelData.compensate_amount,
          evidence: cancelData.evidence || {},
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || "Không thể tạo yêu cầu hủy");
      }
    } catch (error) {
      console.error("Error creating cancel request:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gửi yêu cầu thất bại";
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    createCancelRequest,
  };
}
