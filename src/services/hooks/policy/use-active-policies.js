"use client";

import axiosInstance from "@/libs/axios-instance";
import { getApprovalError } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

// Hook for active insurance policies list
export function useActivePolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(endpoints.policy.policy.list);
      if (response.data.success) {
        const allPolicies = response.data.data.policies || [];

        // Filter policies for active page:
        // Only: status === "active" + underwriting_status === "approved" (đã thanh toán, đang hoạt động)
        const activePolicies = allPolicies.filter(
          (policy) =>
            policy.status === "active" && policy.underwriting_status === "approved"
        );
        setPolicies(activePolicies);
      } else {
        throw new Error(response.data.message || "Failed to fetch policies");
      }
    } catch (error) {
      console.error("Error fetching active policies:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch policies";
      setError(errorMessage);
      message.error(getApprovalError("LOAD_LIST_FAILED"));
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Use the reusable table data hook
  const tableData = useTableData(policies, {
    searchFields: ["policy_number", "farmer_id"],
    defaultFilters: {},
    pageSize: 10,
  });

  return {
    ...tableData,
    loading,
    error,
    refetch: fetchPolicies,
    // Keep original data for calculations
    allPolicies: policies,
  };
}
