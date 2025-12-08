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
      // Fetch từ list endpoint vì không có detail endpoint riêng
      const response = await axiosInstance.get(
        endpoints.cancelRequest.listPartner
      );
      if (response.data.success) {
        const requests = response.data.data.claims || [];
        const request = requests.find((r) => r.id === requestId);
        if (request) {
          setCancelRequest(request);
        } else {
          throw new Error("Không tìm thấy yêu cầu hủy");
        }
      } else {
        throw new Error(
          response.data.message || "Failed to fetch cancel request detail"
        );
      }
    } catch (error) {
      console.error("Error fetching cancel request detail:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể tải chi tiết yêu cầu hủy";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchCancelRequestDetail();
  }, [fetchCancelRequestDetail]);

  // Review cancel request (approve/deny)
  const reviewCancelRequest = useCallback(
    async (approved, reviewNotes, compensateAmount = 0) => {
      if (!requestId) return { success: false };

      try {
        const response = await axiosInstance.put(
          endpoints.cancelRequest.review(requestId),
          {
            approved,
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

  // Resolve dispute - giải quyết tranh chấp
  const resolveDispute = useCallback(
    async (approved, resolutionNotes) => {
      if (!requestId) return { success: false };

      try {
        const response = await axiosInstance.put(
          endpoints.cancelRequest.review(requestId),
          {
            approved,
            review_notes: resolutionNotes,
          }
        );

        if (response.data.success) {
          message.success(
            approved
              ? "Đã giải quyết tranh chấp và hủy hợp đồng"
              : "Đã giải quyết tranh chấp và giữ hợp đồng"
          );
          await fetchCancelRequestDetail(); // Refresh data
          return { success: true };
        } else {
          throw new Error(response.data.message || "Failed to resolve dispute");
        }
      } catch (error) {
        console.error("Error resolving dispute:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to resolve dispute";
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
    resolveDispute,
  };
}
