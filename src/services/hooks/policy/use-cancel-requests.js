"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

// Hook for cancel requests list and detail operations
export function useCancelRequests() {
  const [cancelRequests, setCancelRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCancelRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        endpoints.cancelRequest.listPartner
      );
      if (response.data.success) {
        const requests = response.data.data.claims || [];
        setCancelRequests(requests);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch cancel requests"
        );
      }
    } catch (error) {
      console.error("Error fetching cancel requests:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch cancel requests";
      setError(errorMessage);
      message.error("Không thể tải danh sách yêu cầu hủy");
      setCancelRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCancelRequests();
  }, [fetchCancelRequests]);

  // Use the reusable table data hook
  const {
    paginatedData,
    filteredData,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
  } = useTableData(cancelRequests, {
    searchFields: ["id", "registered_policy_id", "reason", "requested_by"],
  });

  // Get cancel request by ID
  const getCancelRequestById = useCallback(
    (requestId) => {
      return cancelRequests.find((r) => r.id === requestId) || null;
    },
    [cancelRequests]
  );

  // Review cancel request (approve/deny)
  const reviewCancelRequest = useCallback(
    async (requestId, approved, reviewNotes, compensateAmount = 0) => {
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
          await fetchCancelRequests(); // Refresh data
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
    [fetchCancelRequests]
  );

  // Resolve dispute - giải quyết tranh chấp
  const resolveDispute = useCallback(
    async (requestId, approved, resolutionNotes) => {
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
          await fetchCancelRequests(); // Refresh data
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
    [fetchCancelRequests]
  );

  return {
    paginatedData,
    allCancelRequests: cancelRequests,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    loading,
    error,
    refetch: fetchCancelRequests,
    getCancelRequestById,
    reviewCancelRequest,
    resolveDispute,
  };
}
