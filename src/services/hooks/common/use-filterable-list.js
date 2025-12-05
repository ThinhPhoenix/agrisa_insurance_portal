"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Advanced hook for managing filterable, searchable, and paginated lists
 * Combines search, filter, pagination, sorting, and column visibility
 *
 * @param {Array} data - Source data array
 * @param {Object} config - Configuration
 * @param {Array<string>} config.searchFields - Fields to search in
 * @param {Object} config.defaultFilters - Initial filter values
 * @param {Array<string>} config.defaultVisibleColumns - Default visible columns
 * @param {number} config.defaultPageSize - Default items per page
 * @param {Object} config.filterHandlers - Custom filter functions
 * @param {string} config.defaultSortField - Default sort field
 * @param {string} config.defaultSortOrder - Default sort order ('ascend' | 'descend')
 *
 * @returns {Object} State and handlers for list management
 */
export function useFilterableList(data = [], config = {}) {
  const {
    searchFields = [],
    defaultFilters = {},
    defaultVisibleColumns = [],
    defaultPageSize = 10,
    filterHandlers = {},
    defaultSortField = null,
    defaultSortOrder = "ascend",
  } = config;

  // State management
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  /**
   * Get nested value from object using dot notation
   */
  const getNestedValue = useCallback((obj, path) => {
    if (!path) return obj;
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  }, []);

  /**
   * Apply search filter
   */
  const applySearch = useCallback(
    (item) => {
      if (!searchText) return true;

      return searchFields.some((field) => {
        const value = getNestedValue(item, field);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchText.toLowerCase());
      });
    },
    [searchText, searchFields, getNestedValue]
  );

  /**
   * Apply filters
   */
  const applyFilters = useCallback(
    (item) => {
      return Object.entries(filters).every(([key, value]) => {
        // Skip empty filters
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === "all"
        ) {
          return true;
        }

        // Use custom filter handler if provided
        if (filterHandlers[key]) {
          console.log(
            `[useFilterableList] Calling filter handler for ${key}:`,
            value
          );
          return filterHandlers[key](item, value);
        }

        const itemValue = getNestedValue(item, key);

        // Array filters (multi-select)
        if (Array.isArray(value)) {
          return value.length === 0 || value.includes(itemValue);
        }

        // Object filters (ranges)
        if (typeof value === "object" && !Array.isArray(value)) {
          // Range with from-to
          if (value.from !== undefined && value.to !== undefined) {
            if (!itemValue) return false;

            // Parse range string format "min-max"
            if (typeof value.from === "string" && value.from.includes("-")) {
              const [min, max] = value.from.split("-").map(Number);
              return itemValue >= min && itemValue <= max;
            }

            return itemValue >= value.from && itemValue <= value.to;
          }

          // Separate min/max
          if (value.min !== undefined && itemValue < value.min) return false;
          if (value.max !== undefined && itemValue > value.max) return false;

          return true;
        }

        // String range format "min-max" (e.g., "0-0.05")
        if (typeof value === "string" && value.includes("-")) {
          const [min, max] = value.split("-").map(Number);
          if (!isNaN(min) && !isNaN(max) && typeof itemValue === "number") {
            return itemValue >= min && itemValue <= max;
          }
        }

        // Simple equality
        return itemValue === value;
      });
    },
    [filters, filterHandlers, getNestedValue]
  );

  /**
   * Apply sorting
   */
  const applySorting = useCallback(
    (a, b) => {
      if (!sortField) return 0;

      const aValue = getNestedValue(a, sortField);
      const bValue = getNestedValue(b, sortField);

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === "ascend" ? 1 : -1;
      if (bValue == null) return sortOrder === "ascend" ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortOrder === "ascend" ? comparison : -comparison;
    },
    [sortField, sortOrder, getNestedValue]
  );

  /**
   * Filtered and sorted data
   */
  const filteredData = useMemo(() => {
    console.log(
      "[useFilterableList] Filtering data, total items:",
      data.length
    );
    console.log("[useFilterableList] Current filters:", filters);
    const result = data
      .filter((item) => applySearch(item) && applyFilters(item))
      .sort(applySorting);
    console.log("[useFilterableList] Filtered result:", result.length, "items");
    return result;
  }, [data, applySearch, applyFilters, applySorting, filters]);

  /**
   * Paginated data
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  /**
   * Handle search
   */
  const handleSearch = useCallback((value) => {
    setSearchText(value);
    setCurrentPage(1);
  }, []);

  /**
   * Handle single filter change
   */
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  /**
   * Handle multiple filters change
   */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  /**
   * Handle form submit (search + filters)
   */
  const handleFormSubmit = useCallback((values) => {
    console.log("[useFilterableList] Form submitted with values:", values);
    const { search, searchButton, clearButton, ...filterValues } = values;

    if (search !== undefined) {
      setSearchText(search || "");
    }

    // Clean up filter values - remove undefined and button fields
    const cleanedFilters = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      // Skip button fields and undefined values
      if (!key.includes("Button") && value !== undefined) {
        cleanedFilters[key] = value;
      }
    });

    console.log("[useFilterableList] Setting filters:", cleanedFilters);
    setFilters((prev) => {
      const newFilters = { ...prev, ...cleanedFilters };
      console.log("[useFilterableList] New filters state:", newFilters);
      return newFilters;
    });
    setCurrentPage(1);
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
  const handlePageChange = useCallback(
    (page, newPageSize) => {
      setCurrentPage(page);
      if (newPageSize && newPageSize !== pageSize) {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
      }
    },
    [pageSize]
  );

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((field, order) => {
    setSortField(field);
    setSortOrder(order || "ascend");
  }, []);

  /**
   * Handle table change (pagination + sorting)
   */
  const handleTableChange = useCallback(
    (pagination, filters, sorter) => {
      // Handle pagination
      if (pagination) {
        handlePageChange(pagination.current, pagination.pageSize);
      }

      // Handle sorting
      if (sorter && sorter.field) {
        handleSortChange(sorter.field, sorter.order);
      }
    },
    [handlePageChange, handleSortChange]
  );

  /**
   * Toggle column visibility
   */
  const toggleColumn = useCallback((columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  }, []);

  /**
   * Set visible columns
   */
  const setColumns = useCallback((columns) => {
    setVisibleColumns(columns);
  }, []);

  /**
   * Get unique values for a field
   */
  const getUniqueValues = useCallback(
    (field) => {
      const values = data
        .map((item) => getNestedValue(item, field))
        .filter((v) => v !== null && v !== undefined);
      return [...new Set(values)];
    },
    [data, getNestedValue]
  );

  /**
   * Get filter options for select/combobox
   */
  const getFilterOptions = useCallback(
    (field, labelFormatter = null) => {
      const uniqueValues = getUniqueValues(field);
      return uniqueValues.map((value) => ({
        value,
        label: labelFormatter ? labelFormatter(value) : String(value),
      }));
    },
    [getUniqueValues]
  );

  /**
   * Calculate summary statistics
   */
  const getSummaryStats = useCallback(
    (statsConfig = {}) => {
      const stats = {};

      Object.entries(statsConfig).forEach(([key, config]) => {
        const { field, type, filterFn } = config;

        switch (type) {
          case "count":
            stats[key] = filterFn ? data.filter(filterFn).length : data.length;
            break;

          case "sum":
            stats[key] = data.reduce((sum, item) => {
              const value = getNestedValue(item, field);
              return sum + (value || 0);
            }, 0);
            break;

          case "avg":
            const values = data
              .map((item) => getNestedValue(item, field))
              .filter((v) => v != null);
            stats[key] =
              values.length > 0
                ? values.reduce((sum, v) => sum + v, 0) / values.length
                : 0;
            break;

          case "min":
            const minValues = data
              .map((item) => getNestedValue(item, field))
              .filter((v) => v != null);
            stats[key] = minValues.length > 0 ? Math.min(...minValues) : 0;
            break;

          case "max":
            const maxValues = data
              .map((item) => getNestedValue(item, field))
              .filter((v) => v != null);
            stats[key] = maxValues.length > 0 ? Math.max(...maxValues) : 0;
            break;

          default:
            stats[key] = 0;
        }
      });

      return stats;
    },
    [data, getNestedValue]
  );

  /**
   * Ant Design pagination config
   */
  const paginationConfig = useMemo(
    () => ({
      current: currentPage,
      pageSize,
      total: filteredData.length,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
      onChange: handlePageChange,
      onShowSizeChange: handlePageChange,
      pageSizeOptions: ["10", "20", "50", "100"],
    }),
    [currentPage, pageSize, filteredData.length, handlePageChange]
  );

  return {
    // Data
    data,
    filteredData,
    paginatedData,

    // State
    searchText,
    filters,
    visibleColumns,
    currentPage,
    pageSize,
    sortField,
    sortOrder,

    // Handlers
    handleSearch,
    handleFilterChange,
    handleFiltersChange,
    handleFormSubmit,
    handleClearFilters,
    handlePageChange,
    handleSortChange,
    handleTableChange,

    // Column management
    toggleColumn,
    setColumns,

    // Utilities
    getUniqueValues,
    getFilterOptions,
    getSummaryStats,

    // Ant Design helpers
    paginationConfig,

    // Metadata
    totalItems: filteredData.length,
    totalPages: Math.ceil(filteredData.length / pageSize),
    hasFilters: Object.values(filters).some(
      (v) => v !== null && v !== undefined && v !== "" && v !== "all"
    ),
    hasSearch: searchText.length > 0,
  };
}
