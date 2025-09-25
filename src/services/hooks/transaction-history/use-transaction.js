"use client";

import transactionData from "@/libs/mockdata/transaction_history.json";
import { useMemo, useState } from "react";

export const useTransaction = () => {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    location: "",
    dateRange: null,
    amountRange: [null, null],
  });

  // Get raw data
  const rawData = transactionData.transaction_history;

  // Extract filter options
  const filterOptions = useMemo(() => {
    const locations = [
      ...new Set(rawData.transactions.map((item) => item.location)),
    ].sort();
    const statuses = rawData.filters.status_options_vi;

    return {
      locations,
      statuses,
    };
  }, [rawData.transactions]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = rawData.transactions;

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.invoice_id.toLowerCase().includes(searchLower) ||
          transaction.recipient_name.toLowerCase().includes(searchLower) ||
          transaction.location.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(
        (transaction) => transaction.status_vi === filters.status
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(
        (transaction) => transaction.location === filters.location
      );
    }

    // Amount range filter
    if (filters.amountRange[0] !== null || filters.amountRange[1] !== null) {
      filtered = filtered.filter((transaction) => {
        const amount = transaction.amount;
        const minAmount = filters.amountRange[0] || 0;
        const maxAmount = filters.amountRange[1] || Infinity;
        return amount >= minAmount && amount <= maxAmount;
      });
    }

    return filtered;
  }, [rawData.transactions, searchText, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const completed = filteredData.filter(
      (t) => t.status === "Completed"
    ).length;
    const pending = filteredData.filter((t) => t.status === "Pending").length;
    const cancelled = filteredData.filter(
      (t) => t.status === "Cancelled"
    ).length;
    const totalAmount = filteredData.reduce((sum, t) => sum + t.amount, 0);

    return {
      total: filteredData.length,
      completed,
      pending,
      cancelled,
      totalAmount,
      totalAmountFormatted: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(totalAmount),
    };
  }, [filteredData]);

  const handleFormSubmit = (formData) => {
    setSearchText(formData.search || "");
    setFilters({
      status: formData.status || "",
      location: formData.location || "",
      dateRange: formData.dateRange || null,
      amountRange: [formData.minAmount || null, formData.maxAmount || null],
    });
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilters({
      status: "",
      location: "",
      dateRange: null,
      amountRange: [null, null],
    });
  };

  return {
    rawData,
    filteredData,
    filterOptions,
    summaryStats,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
  };
};
