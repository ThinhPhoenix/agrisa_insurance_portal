"use client";

import { useTableData } from "@/services/hooks/common/use-table-data";
import usePolicy from "@/services/hooks/policy/use-policy";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Hook for base policy list page with search, filter, and pagination
 * Combines draft and active policies from different APIs
 */
export function useBasePolicyList() {
  // Fetch policies from both APIs
  const {
    policies,
    policiesLoading,
    policiesError,
    activePolicies,
    activePoliciesLoading,
    activePoliciesError,
    policyCounts,
    policyCountsLoading,
    fetchPoliciesByProvider,
    fetchActivePoliciesByProvider,
    fetchPolicyCounts,
  } = usePolicy();

  const [statusFilter, setStatusFilter] = useState("all");

  // Transform API data to table format
  const transformPolicy = useCallback((item) => ({
    id: item.base_policy.id,
    productName: item.base_policy.product_name,
    productCode: item.base_policy.product_code,
    productDescription: item.base_policy.product_description,
    insuranceProviderId: item.base_policy.insurance_provider_id,
    cropType: item.base_policy.crop_type,
    coverageCurrency: item.base_policy.coverage_currency,
    coverageDurationDays: item.base_policy.coverage_duration_days,
    premiumBaseRate: item.base_policy.premium_base_rate,
    status: item.base_policy.status,
  }), []);

  // Get policies based on status filter
  const policiesByStatus = useMemo(() => {
    switch (statusFilter) {
      case "draft":
        return policies.map(transformPolicy);
      case "active":
        return activePolicies.map(transformPolicy);
      case "all":
      default:
        return [
          ...policies.map(transformPolicy),
          ...activePolicies.map(transformPolicy),
        ];
    }
  }, [statusFilter, policies, activePolicies, transformPolicy]);

  // Use the reusable table data hook
  const tableData = useTableData(policiesByStatus, {
    searchFields: ["productName", "productCode", "insuranceProviderId"],
    defaultFilters: {
      cropType: null,
      premiumRange: null,
      durationRange: null,
    },
    pageSize: 10,
  });

  // Override the filteredData to handle range filters
  const filteredDataWithRanges = useMemo(() => {
    let filtered = [...tableData.filteredData];

    // Premium range filter
    if (tableData.filters.premiumRange) {
      const [min, max] = tableData.filters.premiumRange.split("-").map(Number);
      filtered = filtered.filter((item) => {
        const premium = item.premiumBaseRate || 0;
        return premium >= min && premium <= max;
      });
    }

    // Duration range filter
    if (tableData.filters.durationRange) {
      const [min, max] = tableData.filters.durationRange.split("-").map(Number);
      filtered = filtered.filter((item) => {
        const duration = item.coverageDurationDays || 0;
        return duration >= min && duration <= max;
      });
    }

    return filtered;
  }, [tableData.filteredData, tableData.filters]);

  // Paginated data with range filters applied
  const paginatedDataWithRanges = useMemo(() => {
    const startIndex = (tableData.currentPage - 1) * tableData.pageSize;
    const endIndex = startIndex + tableData.pageSize;
    return filteredDataWithRanges.slice(startIndex, endIndex);
  }, [filteredDataWithRanges, tableData.currentPage, tableData.pageSize]);

  // Update pagination config with correct total
  const paginationConfig = useMemo(() => ({
    ...tableData.paginationConfig,
    total: filteredDataWithRanges.length,
  }), [tableData.paginationConfig, filteredDataWithRanges.length]);

  // Custom form submit handler
  const handleFormSubmit = useCallback((values) => {
    // Handle status filter separately
    if (values.policyStatus !== undefined) {
      setStatusFilter(values.policyStatus || "all");
    }

    // Pass other filters to tableData
    tableData.handleFormSubmit(values);
  }, [tableData]);

  // Custom clear filters handler
  const handleClearFilters = useCallback(() => {
    setStatusFilter("all");
    tableData.handleClearFilters();
  }, [tableData]);

  // Loading state - show loading if any API is loading
  const loading =
    policiesLoading || activePoliciesLoading || policyCountsLoading;

  // Error state - combine errors
  const error = policiesError || activePoliciesError;

  return {
    ...tableData,
    filteredData: filteredDataWithRanges,
    paginatedData: paginatedDataWithRanges,
    paginationConfig,
    statusFilter,
    loading,
    error,
    policyCounts,
    allPolicies: policiesByStatus,
    draftPolicies: policies.map(transformPolicy),
    activePoliciesData: activePolicies.map(transformPolicy),
    handleFormSubmit,
    handleClearFilters,
    refetchDraft: fetchPoliciesByProvider,
    refetchActive: fetchActivePoliciesByProvider,
    refetchCounts: fetchPolicyCounts,
  };
}
