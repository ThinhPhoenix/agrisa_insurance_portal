"use client";

import axiosInstance from "@/libs/axios-instance";
import { getApprovalError, getApprovalInfo } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

// Hook for active insurance policies list
export function useActivePolicies() {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    status: null,
  });
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(endpoints.policy.policy.list);
      if (response.data.success) {
        // Filter only active policies
        const allPolicies = response.data.data.policies || [];
        const activePolicies = allPolicies.filter(
          (policy) => policy.status === "active"
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

  const filteredData = useMemo(() => {
    return policies.filter((item) => {
      const matchesSearch =
        item?.policy_number?.toLowerCase().includes(searchText.toLowerCase()) ||
        item?.farmer_id?.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [policies, searchText]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFormSubmit = (values) => {
    setSearchText(values.search || "");
  };

  const handleClearFilters = () => {
    setSearchText("");
  };

  return {
    filteredData,
    loading,
    error,
    searchText,
    handleSearch,
    handleFormSubmit,
    handleClearFilters,
    refetch: fetchPolicies,
  };
}
