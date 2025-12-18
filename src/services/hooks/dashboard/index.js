import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useEffect, useState } from "react";

// Policy Status Constants (matching the API)
export const POLICY_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  PENDING_PAYMENT: "pending_payment",
  PAYOUT: "payout",
  ACTIVE: "active",
  EXPIRED: "expired",
  PENDING_CANCEL: "pending_cancel",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  DISPUTE: "dispute",
  CANCELLED_PENDING_PAYMENT: "cancelled_pending_payment",
};

// Underwriting Status Constants (matching the API)
export const UNDERWRITING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * Custom hook for Partner Dashboard Overview API
 * Fetches financial metrics, premium/payout data, and trend analytics
 */
export const usePartnerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize partner_id from localStorage on mount
  const getPartnerIdFromStorage = () => {
    try {
      const meData = localStorage.getItem("me");
      if (meData) {
        const parsed = JSON.parse(meData);
        // partner_id is at root level of /me response
        return parsed?.partner_id || null;
      }
    } catch (error) {
      console.error("Failed to get partner_id:", error);
    }
    return null;
  };

  // Default filters with partner_id from localStorage
  const [filters, setFilters] = useState(() => {
    const partnerId = getPartnerIdFromStorage();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60); // 30 ngày gần nhất

    console.log("🔧 Initializing dashboard with partner_id:", partnerId);

    return {
      partner_id: partnerId,
      start_date: thirtyDaysAgo,
      end_date: now,
    };
  });

  /**
   * Reset filters to default values (30 days)
   */
  const resetFiltersToDefault = useCallback(() => {
    const partnerId = getPartnerIdFromStorage();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    console.log("🔄 Resetting filters to default (30 days)");

    setFilters({
      partner_id: partnerId,
      start_date: thirtyDaysAgo,
      end_date: now,
    });
  }, []);

  /**
   * Fetch dashboard overview data
   */
  const fetchDashboard = useCallback(async () => {
    if (!filters.partner_id || !filters.start_date || !filters.end_date) {
      console.log("⚠️ Missing required filters:", {
        partner_id: filters.partner_id,
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
      return;
    }

    console.log("🚀 Calling Partner Dashboard API with filters:", filters);

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.post(
        endpoints.dashboard.partnerOverview,
        {
          partner_id: filters.partner_id,
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Partner Dashboard API Response:", response.data);

      // API returns { success: true, data: {...} }
      if (response.data?.success && response.data?.data) {
        setData(response.data.data);
      } else {
        setData(null);
        setError("No data available");
      }
    } catch (error) {
      console.error("❌ Partner Dashboard API Error:", error);

      // Check for 500 error or other server errors
      const isServerError = error.response?.status >= 500;

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch dashboard data";

      setError(errorMessage);
      setData(null);

      // Reset filters to default on server error to prevent repeated errors
      if (isServerError) {
        console.warn("⚠️ Server error detected, resetting filters to default");
        setTimeout(() => {
          resetFiltersToDefault();
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, resetFiltersToDefault]);

  /**
   * Update filters and trigger refetch
   * @param {object} newFilters - New filter values
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Format currency in Vietnamese format
   * @param {number} value - The value to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  }, []);

  /**
   * Format large numbers with compact notation
   * @param {number} value - The value to format
   * @returns {string} Formatted compact number string
   */
  const formatCompactNumber = useCallback((value) => {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value || 0);
  }, []);

  /**
   * Get growth indicator properties (color, icon, text)
   * @returns {object} Growth indicator properties
   */
  const getGrowthIndicator = useCallback(() => {
    if (!data?.financial_summary) {
      return {
        isPositive: null,
        color: "#8c8c8c",
        text: "0%",
      };
    }

    const profitMargin = data.financial_summary.profit_margin_percent || 0;

    return {
      isPositive: profitMargin > 0,
      color: profitMargin > 0 ? "#52c41a" : profitMargin < 0 ? "#ff4d4f" : "#8c8c8c",
      text: `${profitMargin.toFixed(2)}%`,
    };
  }, [data]);

  /**
   * Calculate net income growth
   * @returns {object} Growth metrics
   */
  const calculateNetIncomeGrowth = useCallback(() => {
    if (!data?.financial_summary) {
      return {
        value: 0,
        percentage: 0,
        isPositive: false,
      };
    }

    const netIncome = data.financial_summary.net_income || 0;
    const totalPremium = data.financial_summary.total_premium || 1;
    const percentage = (netIncome / totalPremium) * 100;

    return {
      value: netIncome,
      percentage: percentage,
      isPositive: netIncome > 0,
    };
  }, [data]);

  // Refetch when filters change
  useEffect(() => {
    console.log("📊 Dashboard filters changed:", filters);
    if (filters.partner_id && filters.start_date && filters.end_date) {
      fetchDashboard();
    } else {
      console.log("⏸️ Not fetching - missing required filters");
    }
  }, [filters, fetchDashboard]);

  return {
    // Data
    data,
    loading,
    error,

    // Filters
    filters,
    updateFilters,
    resetFiltersToDefault,

    // Actions
    refetch: fetchDashboard,

    // Helper functions
    formatCurrency,
    formatCompactNumber,
    getGrowthIndicator,
    calculateNetIncomeGrowth,
  };
};

/**
 * Legacy hook name for compatibility with existing dashboard page
 * This provides the same interface as the revenue hook used in the other dashboard
 */
export const useDashboardRevenue = () => {
  const hook = usePartnerDashboard();

  return {
    ...hook,
    // Map old property names to new ones for compatibility
    monthly_growth_rate: hook.data?.financial_summary?.profit_margin_percent,
  };
};

export default usePartnerDashboard;
