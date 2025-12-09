"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useEffect, useState } from "react";

export const usePayout = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 1,
    next: false,
    previous: false,
  });
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    amountRange: [null, null],
  });

  // Get X-User-ID from localStorage
  const getUserId = () => {
    try {
      const me = localStorage.getItem("me");
      if (me) {
        const parsed = JSON.parse(me);
        return parsed.user_id;
      }
    } catch (e) {
      console.error("Failed to parse user ID from localStorage:", e);
    }
    return null;
  };

  // Fetch payouts
  const fetchPayouts = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        setError("Không tìm thấy ID người dùng");
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get(
        `${endpoints.payment.listPayout}?page=${page}&limit=${limit}`,
        {
          headers: {
            "x-user-id": userId,
          },
        }
      );

      // Handle response structure: response.data.data.items
      const responseData = response.data?.data || response.data;

      if (responseData && responseData.items) {
        setPayouts(responseData.items);
        setPagination({
          page: response.data.metadata.page,
          limit: response.data.metadata.limit,
          total_items: response.data.metadata.total_items,
          total_pages: response.data.metadata.total_pages,
          next: response.data.metadata.next,
          previous: response.data.metadata.previous,
        });
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách chi trả");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPayouts(pagination.page, pagination.limit);
  }, []);

  // Filter and search data
  const filteredData = payouts.filter((payout) => {
    let match = true;

    // Search filter - search in id, description, account_number, bank_code
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      match =
        match &&
        (payout.id?.toLowerCase().includes(searchLower) ||
          payout.description?.toLowerCase().includes(searchLower) ||
          payout.account_number?.toLowerCase().includes(searchLower) ||
          payout.bank_code?.toLowerCase().includes(searchLower));
    }

    // Status filter
    if (filters.status) {
      match = match && payout.status?.code === filters.status;
    }

    // Amount range filter
    if (filters.amountRange[0] !== null || filters.amountRange[1] !== null) {
      const minAmount = filters.amountRange[0] || 0;
      const maxAmount = filters.amountRange[1] || Infinity;
      match = match && payout.amount >= minAmount && payout.amount <= maxAmount;
    }

    return match;
  });

  // Calculate summary statistics
  const summaryStats = {
    total: pagination.total_items,
    totalAmount: payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalAmountFormatted: new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(payouts.reduce((sum, p) => sum + (p.amount || 0), 0)),
    completed: payouts.filter((p) => p.status?.code === "completed").length,
    pending: payouts.filter((p) => p.status?.code === "pending").length,
    cancelled: payouts.filter((p) => p.status?.code === "cancelled").length,
  };

  // Get unique filter options
  const filterOptions = {
    statuses: [
      { label: "Đã chi trả", value: "completed" },
      { label: "Đang xử lý", value: "pending" },
      { label: "Đã hủy", value: "cancelled" },
    ],
  };

  const handleFormSubmit = (formData) => {
    setSearchText(formData.search || "");
    setFilters({
      status: formData.status || "",
      amountRange: [formData.minAmount || null, formData.maxAmount || null],
    });
    // Reset to page 1 when applying filters
    fetchPayouts(1, pagination.limit);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilters({
      status: "",
      amountRange: [null, null],
    });
    fetchPayouts(1, pagination.limit);
  };

  const handlePageChange = (newPage, newLimit) => {
    fetchPayouts(newPage, newLimit);
  };

  return {
    payouts,
    filteredData,
    loading,
    error,
    pagination,
    filterOptions,
    summaryStats,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
    handlePageChange,
    fetchPayouts,
  };
};
