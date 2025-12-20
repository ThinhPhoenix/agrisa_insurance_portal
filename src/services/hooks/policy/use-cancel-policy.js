"use client";

import axiosInstance from "@/libs/axios-instance";
import { mapBackendErrorToMessage } from "@/libs/message/cancel-request-message";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
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
      // Map BE error thành thông báo tiếng Việt
      const errorCode = error.response?.data?.error?.code;
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      const userMessage = mapBackendErrorToMessage(errorCode, errorMessage);
      return { success: false, error: userMessage };
    }
  }, []);

  // Review cancel request (approve/deny)
  const reviewCancelRequest = useCallback(
    async (id, approved, reviewNotes) => {
      const targetId = id || requestId;
      if (!targetId) return { success: false };

      try {
        const response = await axiosInstance.put(
          endpoints.cancelRequest.review(targetId),
          {
            approved,
            review_notes: reviewNotes,
          }
        );

        if (response.data.success) {
          await fetchCancelRequests(); // Refresh data
          return { success: true };
        } else {
          throw new Error(
            response.data.message || "Failed to review cancel request"
          );
        }
      } catch (error) {
        console.error("Error reviewing cancel request:", error);
        // Map BE error thành thông báo tiếng Việt
        const errorCode = error.response?.data?.error?.code;
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        const userMessage = mapBackendErrorToMessage(errorCode, errorMessage);
        return { success: false, error: userMessage };
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
          await fetchCancelRequests(); // Refresh data
          return { success: true };
        } else {
          throw new Error(response.data.message || "Failed to resolve dispute");
        }
      } catch (error) {
        console.error("Error resolving dispute:", error);
        // Map BE error thành thông báo tiếng Việt
        const errorCode = error.response?.data?.error?.code;
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        const userMessage = mapBackendErrorToMessage(errorCode, errorMessage);
        return { success: false, error: userMessage };
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
