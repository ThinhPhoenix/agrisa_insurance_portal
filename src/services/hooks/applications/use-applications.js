import mockData from "@/libs/mockdata/insurance_partner_mock.json";
import { useMemo, useState } from "react";

// Hook for applications list with filtering
export function useApplications() {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    cropType: null,
    region: null,
    riskLevel: null,
  });

  const pendingApplications =
    mockData.data.underwriting_workflows.pending_applications;

  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    return pendingApplications.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.farmer_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.crop_type.toLowerCase().includes(searchText.toLowerCase());

      const matchesCropType =
        !filters.cropType || item.crop_type === filters.cropType;
      const matchesRegion = !filters.region || item.region === filters.region;
      const matchesRiskLevel =
        !filters.riskLevel || item.risk_level === filters.riskLevel;

      return (
        matchesSearch && matchesCropType && matchesRegion && matchesRiskLevel
      );
    });
  }, [pendingApplications, searchText, filters]);

  // Unique options for filters
  const filterOptions = useMemo(() => {
    const cropTypes = [
      ...new Set(pendingApplications.map((item) => item.crop_type)),
    ];
    const regions = [
      ...new Set(pendingApplications.map((item) => item.region)),
    ];
    const riskLevels = [
      ...new Set(pendingApplications.map((item) => item.risk_level)),
    ];

    return { cropTypes, regions, riskLevels };
  }, [pendingApplications]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = (values) => {
    setSearchText(values.search || "");
    setFilters({
      cropType: values.cropType || null,
      region: values.region || null,
      riskLevel: values.riskLevel || null,
    });
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilters({
      cropType: null,
      region: null,
      riskLevel: null,
    });
  };

  return {
    filteredData,
    filterOptions,
    searchText,
    filters,
    handleSearch,
    handleFilterChange,
    handleFormSubmit,
    handleClearFilters,
  };
}

// Hook for application detail
export function useApplicationDetail(id) {
  const application = useMemo(() => {
    if (!id) return null;
    return mockData.data.underwriting_workflows.pending_applications.find(
      (item) => item.id === id
    );
  }, [id]);

  const satelliteData = useMemo(() => {
    if (!id) return null;
    return mockData.data.underwriting_workflows.satellite_evidence_assessment.find(
      (item) => item.application_id === id
    );
  }, [id]);

  const farmAnalysis = useMemo(() => {
    if (!id) return null;
    return mockData.data.underwriting_workflows.detailed_farm_analysis.find(
      (item) => item.application_id === id
    );
  }, [id]);

  return {
    application,
    satelliteData,
    farmAnalysis,
  };
}
