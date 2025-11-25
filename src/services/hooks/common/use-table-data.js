"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Reusable hook for handling search, filter, and pagination in frontend
 *
 * @param {Array} data - Full data array from backend
 * @param {Object} config - Configuration object
 * @param {Array<string>} config.searchFields - Fields to search in (e.g., ['policy_number', 'farmer_id'])
 * @param {Object} config.defaultFilters - Default filter values
 * @param {number} config.pageSize - Default page size
 *
 * @returns {Object} - Contains filtered data, pagination, search, and filter handlers
 */
export function useTableData(data = [], config = {}) {
  const {
    searchFields = [],
    defaultFilters = {},
    pageSize: defaultPageSize = 10,
  } = config;

  // State
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  /**
   * Filter data based on search text and filters
   */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search logic - check if any search field contains the search text
      const matchesSearch =
        !searchText ||
        searchFields.some((field) => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchText.toLowerCase());
        });

      // Filter logic - check all active filters
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        // Skip if filter value is null, undefined, or empty string
        if (value === null || value === undefined || value === "") return true;

        // Handle array filters (e.g., multi-select)
        if (Array.isArray(value)) {
          return value.length === 0 || value.includes(item[key]);
        }

        // Handle object filters (e.g., date ranges)
        if (typeof value === "object" && !Array.isArray(value)) {
          // Date range filter
          if (value.from !== undefined && value.to !== undefined) {
            const itemValue = item[key];
            if (!itemValue) return false;
            return itemValue >= value.from && itemValue <= value.to;
          }
        }

        // Simple equality check
        return item[key] === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchText, searchFields, filters]);

  /**
   * Paginated data
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  /**
   * Handle search text change
   */
  const handleSearch = useCallback((value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  /**
   * Handle multiple filters change at once
   */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  /**
   * Handle form submit (for search and filters together)
   */
  const handleFormSubmit = useCallback((values) => {
    const { search, ...filterValues } = values;

    if (search !== undefined) {
      setSearchText(search || "");
    }

    // Only update filters that are provided in the form
    const newFilters = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      newFilters[key] = value || null;
    });

    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));

    setCurrentPage(1); // Reset to first page
  }, []);

  /**
   * Clear all filters and search
   */
  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, [defaultFilters]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== undefined && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  }, [pageSize]);

  /**
   * Get unique values for a field (useful for filter options)
   */
  const getUniqueValues = useCallback((field) => {
    const values = data.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)];
  }, [data]);

  /**
   * Get filter options for a specific field
   */
  const getFilterOptions = useCallback((field, labelField = null) => {
    const uniqueValues = getUniqueValues(field);
    return uniqueValues.map((value) => ({
      value,
      label: labelField ? value[labelField] : value,
    }));
  }, [getUniqueValues]);

  /**
   * Pagination config for Ant Design Table
   */
  const paginationConfig = useMemo(() => ({
    current: currentPage,
    pageSize,
    total: filteredData.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} của ${total} mục`,
    onChange: handlePageChange,
    onShowSizeChange: handlePageChange,
    pageSizeOptions: ["10", "20", "50", "100"],
  }), [currentPage, pageSize, filteredData.length, handlePageChange]);

  return {
    // Data
    filteredData,
    paginatedData,

    // State
    searchText,
    filters,
    currentPage,
    pageSize,

    // Handlers
    handleSearch,
    handleFilterChange,
    handleFiltersChange,
    handleFormSubmit,
    handleClearFilters,
    handlePageChange,

    // Utilities
    getUniqueValues,
    getFilterOptions,

    // Ant Design helpers
    paginationConfig,

    // Metadata
    totalItems: filteredData.length,
    totalPages: Math.ceil(filteredData.length / pageSize),
  };
}
