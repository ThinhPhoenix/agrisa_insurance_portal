"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

// Hook for cancel requests - list, detail, create, review, and dispute operations
export function useCancelPolicy(requestId = null) {
  const [cancelRequests, setCancelRequests] = useState([]);
  const [cancelRequest, setCancelRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all cancel requests
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

        // If requestId is provided, also set the specific request
        if (requestId) {
          const request = requests.find((r) => r.id === requestId);
          if (request) {
            setCancelRequest(request);
          }
        }
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
  }, [requestId]);

  useEffect(() => {
    fetchCancelRequests();
  }, [fetchCancelRequests]);

  // Use the reusable table data hook for list view
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
    (id) => {
      return cancelRequests.find((r) => r.id === id) || null;
    },
    [cancelRequests]
  );

  // Create cancel request
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

  // Review cancel request (approve/deny)
  const reviewCancelRequest = useCallback(
    async (id, approved, reviewNotes, compensateAmount = 0) => {
      const targetId = id || requestId;
      if (!targetId) return { success: false };

      try {
        const response = await axiosInstance.put(
          endpoints.cancelRequest.review(targetId),
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
    [requestId, fetchCancelRequests]
  );

  // Resolve dispute - giải quyết tranh chấp
  const resolveDispute = useCallback(
    async (id, approved, resolutionNotes) => {
      const targetId = id || requestId;
      if (!targetId) return { success: false };

      try {
        const response = await axiosInstance.put(
          endpoints.cancelRequest.review(targetId),
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
    [requestId, fetchCancelRequests]
  );

  return {
    // List operations
    paginatedData,
    allCancelRequests: cancelRequests,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,

    // Detail operations
    cancelRequest,

    // Common
    loading,
    error,
    refetch: fetchCancelRequests,

    // CRUD operations
    getCancelRequestById,
    createCancelRequest,
    reviewCancelRequest,
    resolveDispute,
  };
}
