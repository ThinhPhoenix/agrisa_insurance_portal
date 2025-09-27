"use client";

import beneficiaryData from "@/libs/mockdata/beneficiary.json";
import { useMemo, useState } from "react";

export const useBeneficiary = () => {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
    cropType: "",
    province: "",
    coverageAmountRange: [null, null],
  });

  // Get raw data
  const rawData = beneficiaryData.insurance_beneficiaries;

  // Extract filter options
  const filterOptions = useMemo(() => {
    const provinces = [
      ...new Set(rawData.beneficiaries.map((item) => item.address.province)),
    ].sort();
    const cropTypes = [
      ...new Set(rawData.beneficiaries.map((item) => item.farm_info.crop_type)),
    ].sort();
    const statuses = [
      ...new Set(rawData.beneficiaries.map((item) => item.status)),
    ];
    const paymentStatuses = [
      ...new Set(rawData.beneficiaries.map((item) => item.payment_status)),
    ];

    return {
      provinces,
      cropTypes,
      statuses,
      paymentStatuses,
    };
  }, [rawData.beneficiaries]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = rawData.beneficiaries;

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (beneficiary) =>
          beneficiary.beneficiary_id.toLowerCase().includes(searchLower) ||
          beneficiary.full_name.toLowerCase().includes(searchLower) ||
          beneficiary.citizen_id.toLowerCase().includes(searchLower) ||
          beneficiary.phone.toLowerCase().includes(searchLower) ||
          beneficiary.farm_info.crop_type.toLowerCase().includes(searchLower) ||
          beneficiary.address.province.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(
        (beneficiary) => beneficiary.status === filters.status
      );
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filtered = filtered.filter(
        (beneficiary) => beneficiary.payment_status === filters.paymentStatus
      );
    }

    // Crop type filter
    if (filters.cropType) {
      filtered = filtered.filter(
        (beneficiary) => beneficiary.farm_info.crop_type === filters.cropType
      );
    }

    // Province filter
    if (filters.province) {
      filtered = filtered.filter(
        (beneficiary) => beneficiary.address.province === filters.province
      );
    }

    // Coverage amount range filter
    if (
      filters.coverageAmountRange[0] !== null ||
      filters.coverageAmountRange[1] !== null
    ) {
      filtered = filtered.filter((beneficiary) => {
        const amount = beneficiary.insurance_package.coverage_amount;
        const minAmount = filters.coverageAmountRange[0] || 0;
        const maxAmount = filters.coverageAmountRange[1] || Infinity;
        return amount >= minAmount && amount <= maxAmount;
      });
    }

    return filtered;
  }, [rawData.beneficiaries, searchText, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const active = filteredData.filter(
      (b) => b.status === "Đã kích hoạt"
    ).length;
    const totalCoverage = filteredData.reduce(
      (sum, b) => sum + b.insurance_package.coverage_amount,
      0
    );
    const totalPremium = filteredData.reduce(
      (sum, b) => sum + b.insurance_package.premium,
      0
    );
    const paidCount = filteredData.filter(
      (b) => b.payment_status === "Đã thanh toán"
    ).length;

    return {
      total: filteredData.length,
      active,
      totalCoverage,
      totalCoverageFormatted: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(totalCoverage),
      totalPremium,
      totalPremiumFormatted: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(totalPremium),
      paidCount,
    };
  }, [filteredData]);

  const handleFormSubmit = (formData) => {
    setSearchText(formData.search || "");
    setFilters({
      status: formData.status || "",
      paymentStatus: formData.paymentStatus || "",
      cropType: formData.cropType || "",
      province: formData.province || "",
      coverageAmountRange: [
        formData.minCoverage || null,
        formData.maxCoverage || null,
      ],
    });
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilters({
      status: "",
      paymentStatus: "",
      cropType: "",
      province: "",
      coverageAmountRange: [null, null],
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
