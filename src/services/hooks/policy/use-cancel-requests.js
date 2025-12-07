"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

// Hook for cancel requests list (from farmer to partner)
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
    allData,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
  } = useTableData({
    data: cancelRequests,
    searchableFields: ["id", "registered_policy_id", "reason", "requested_by"],
  });

  return {
    paginatedData,
    allCancelRequests: allData,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    loading,
    error,
    refetch: fetchCancelRequests,
  };
}
