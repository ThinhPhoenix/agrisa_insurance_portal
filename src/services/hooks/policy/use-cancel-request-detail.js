"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

// Hook for cancel request detail
export function useCancelRequestDetail(requestId) {
  const [cancelRequest, setCancelRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCancelRequestDetail = useCallback(async () => {
    if (!requestId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        endpoints.cancelRequest.detail(requestId)
      );
      if (response.data.success) {
        setCancelRequest(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch cancel request detail"
        );
      }
    } catch (error) {
      console.error("Error fetching cancel request detail:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch cancel request detail";
      setError(errorMessage);
      message.error("Không thể tải chi tiết yêu cầu hủy");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchCancelRequestDetail();
  }, [fetchCancelRequestDetail]);

  // Review cancel request (approve/deny/litigation)
  const reviewCancelRequest = useCallback(
    async (status, reviewNotes, compensateAmount = 0) => {
      if (!requestId) return { success: false };

      try {
        const response = await axiosInstance.put(
          endpoints.cancelRequest.review(requestId),
          {
            status,
            review_notes: reviewNotes,
            compensate_amount: compensateAmount,
          }
        );

        if (response.data.success) {
          message.success("Xem xét yêu cầu hủy thành công");
          await fetchCancelRequestDetail(); // Refresh data
          return { success: true };
        } else {
          throw new Error(
            response.data.message || "Failed to review cancel request"
          );
        }
      } catch (error) {
        console.error("Error reviewing cancel request:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to review cancel request";
        message.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [requestId, fetchCancelRequestDetail]
  );

  return {
    cancelRequest,
    loading,
    error,
    refetch: fetchCancelRequestDetail,
    reviewCancelRequest,
  };
}
