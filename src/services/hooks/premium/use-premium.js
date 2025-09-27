import insuranceData from "@/libs/mockdata/insurance.json";
import { useMemo, useState } from "react";

// Fallback data in case JSON import fails
const fallbackData = {
  insurance_packages_management: {
    company_info: {
      name: "Công ty Bảo hiểm Nông nghiệp Việt Nam",
    },
    packages: [],
  },
};

export const usePremium = () => {
  const [filters, setFilters] = useState({
    package_name: "",
    category: "",
    status: "",
    effective_date: "",
    coverage_range: "",
  });

  // Raw data from JSON with safe check
  const rawData = insuranceData?.insurance_packages_management ||
    fallbackData.insurance_packages_management || {
      packages: [],
    };

  // Filter options for dropdowns
  const filterOptions = useMemo(() => {
    const packages = rawData?.packages || [];

    return {
      categories: [
        ...new Set(packages.map((pkg) => pkg.category).filter(Boolean)),
      ].map((cat) => ({
        label: cat,
        value: cat,
      })),
      statuses: [
        ...new Set(packages.map((pkg) => pkg.status).filter(Boolean)),
      ].map((status) => ({
        label: status,
        value: status,
      })),
      coverageRanges: [
        { label: "Dưới 100M", value: "under_100m" },
        { label: "100M - 300M", value: "100m_300m" },
        { label: "300M - 500M", value: "300m_500m" },
        { label: "Trên 500M", value: "over_500m" },
      ],
    };
  }, [rawData?.packages]);

  // Apply filters to packages
  const filteredData = useMemo(() => {
    const packages = rawData?.packages || [];

    return packages.filter((pkg) => {
      // Package name filter
      if (
        filters.package_name &&
        !pkg.package_name
          .toLowerCase()
          .includes(filters.package_name.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (filters.category && pkg.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && pkg.status !== filters.status) {
        return false;
      }

      // Effective date filter (year)
      if (filters.effective_date) {
        const effectiveYear = new Date(
          pkg.effective_date.split("/").reverse().join("-")
        ).getFullYear();
        if (effectiveYear.toString() !== filters.effective_date) {
          return false;
        }
      }

      // Coverage range filter
      if (filters.coverage_range) {
        const maxCoverage = pkg.coverage_details.max_coverage;
        switch (filters.coverage_range) {
          case "under_100m":
            if (maxCoverage >= 100000000) return false;
            break;
          case "100m_300m":
            if (maxCoverage < 100000000 || maxCoverage > 300000000)
              return false;
            break;
          case "300m_500m":
            if (maxCoverage < 300000000 || maxCoverage > 500000000)
              return false;
            break;
          case "over_500m":
            if (maxCoverage <= 500000000) return false;
            break;
        }
      }

      return true;
    });
  }, [rawData?.packages, filters]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const packages = rawData?.packages || [];
    const active = packages.filter((pkg) => pkg.status === "Đang phát hành");

    const totalPolicies = packages.reduce(
      (sum, pkg) => sum + (pkg.statistics?.total_policies || 0),
      0
    );
    const activePolicies = packages.reduce(
      (sum, pkg) => sum + (pkg.statistics?.active_policies || 0),
      0
    );

    const avgSatisfaction =
      packages.length > 0
        ? packages.reduce((sum, pkg) => {
            const rate = parseInt(pkg.statistics?.satisfaction_rate || "0");
            return sum + rate;
          }, 0) / packages.length
        : 0;

    return {
      totalPackages: packages.length,
      activePackages: active.length,
      totalPolicies,
      activePolicies,
      avgSatisfaction: Math.round(avgSatisfaction),
    };
  }, [rawData?.packages]);

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      package_name: "",
      category: "",
      status: "",
      effective_date: "",
      coverage_range: "",
    });
  };

  return {
    rawData,
    filteredData,
    filters,
    filterOptions,
    summaryStats,
    updateFilters,
    clearFilters,
    loading: false,
  };
};
