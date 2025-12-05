/**
 * Filter utility helpers
 * Common filter functions for use with useFilterableList hook
 */

/**
 * Range filter - checks if value is within min-max range
 */
export const rangeFilter = (item, value, field) => {
  const itemValue = typeof field === "function" ? field(item) : item[field];

  if (!itemValue) return false;

  // Handle string format "min-max"
  if (typeof value === "string" && value.includes("-")) {
    const [min, max] = value.split("-").map(Number);
    return itemValue >= min && itemValue <= max;
  }

  // Handle object format { min, max } or { from, to }
  if (typeof value === "object") {
    const min = value.min ?? value.from;
    const max = value.max ?? value.to;

    if (min !== undefined && itemValue < min) return false;
    if (max !== undefined && itemValue > max) return false;
  }

  return true;
};

/**
 * Date range filter
 */
export const dateRangeFilter = (item, value, field) => {
  const itemValue = typeof field === "function" ? field(item) : item[field];

  if (!itemValue) return false;

  const itemDate = new Date(itemValue);

  if (value.from && itemDate < new Date(value.from)) return false;
  if (value.to && itemDate > new Date(value.to)) return false;

  return true;
};

/**
 * Multi-select filter
 */
export const multiSelectFilter = (item, value, field) => {
  if (!Array.isArray(value) || value.length === 0) return true;

  const itemValue = typeof field === "function" ? field(item) : item[field];
  return value.includes(itemValue);
};

/**
 * Contains filter (case-insensitive)
 */
export const containsFilter = (item, value, field) => {
  if (!value) return true;

  const itemValue = typeof field === "function" ? field(item) : item[field];
  if (itemValue === null || itemValue === undefined) return false;

  return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
};

/**
 * Starts with filter
 */
export const startsWithFilter = (item, value, field) => {
  if (!value) return true;

  const itemValue = typeof field === "function" ? field(item) : item[field];
  if (itemValue === null || itemValue === undefined) return false;

  return String(itemValue)
    .toLowerCase()
    .startsWith(String(value).toLowerCase());
};

/**
 * Ends with filter
 */
export const endsWithFilter = (item, value, field) => {
  if (!value) return true;

  const itemValue = typeof field === "function" ? field(item) : item[field];
  if (itemValue === null || itemValue === undefined) return false;

  return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
};

/**
 * Boolean filter
 */
export const booleanFilter = (item, value, field) => {
  if (value === null || value === undefined || value === "") return true;

  const itemValue = typeof field === "function" ? field(item) : item[field];

  // Handle string "true"/"false"
  if (typeof value === "string") {
    return itemValue === (value === "true");
  }

  return itemValue === value;
};

/**
 * Status filter with "all" support
 */
export const statusFilter = (item, value, field) => {
  if (!value || value === "all") return true;

  const itemValue = typeof field === "function" ? field(item) : item[field];
  return itemValue === value;
};

/**
 * Premium range filter (percentage)
 */
export const premiumRangeFilter = (item, rangeString) => {
  if (!rangeString) return true;

  const [min, max] = rangeString.split("-").map(Number);
  const premium = item.premiumBaseRate || item.premium_base_rate || 0;

  return premium >= min && premium <= max;
};

/**
 * Duration range filter (days)
 */
export const durationRangeFilter = (item, rangeString) => {
  if (!rangeString) return true;

  const [min, max] = rangeString.split("-").map(Number);
  const duration =
    item.coverageDurationDays || item.coverage_duration_days || 0;

  return duration >= min && duration <= max;
};

/**
 * Crop type filter
 */
export const cropTypeFilter = (item, value) => {
  if (!value) return true;
  return item.cropType === value || item.crop_type === value;
};

/**
 * Currency amount range filter
 */
export const amountRangeFilter = (item, value, field) => {
  const itemValue = typeof field === "function" ? field(item) : item[field];

  if (!itemValue) return false;

  if (typeof value === "string" && value.includes("-")) {
    const [min, max] = value.split("-").map((v) => parseFloat(v));
    return itemValue >= min && itemValue <= max;
  }

  if (typeof value === "object") {
    if (value.min !== undefined && itemValue < value.min) return false;
    if (value.max !== undefined && itemValue > value.max) return false;
  }

  return true;
};

/**
 * Create custom filter handler
 */
export const createFilterHandler = (filterFn) => {
  return (item, value) => filterFn(item, value);
};

/**
 * Combine multiple filters with AND logic
 */
export const combineFilters = (...filterFns) => {
  return (item, value) => {
    return filterFns.every((fn) => fn(item, value));
  };
};

/**
 * Combine multiple filters with OR logic
 */
export const combineFiltersOr = (...filterFns) => {
  return (item, value) => {
    return filterFns.some((fn) => fn(item, value));
  };
};

/**
 * Get nested value from object using dot notation
 */
export const getNestedValue = (obj, path) => {
  if (!path) return obj;
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

/**
 * Format filter value for display
 */
export const formatFilterValue = (value, type = "text") => {
  if (value === null || value === undefined || value === "") return "-";

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);

    case "percentage":
      return `${(value * 100).toFixed(2)}%`;

    case "date":
      return new Date(value).toLocaleDateString("vi-VN");

    case "boolean":
      return value ? "Có" : "Không";

    default:
      return String(value);
  }
};
