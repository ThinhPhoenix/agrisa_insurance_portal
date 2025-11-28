"use client";

import axiosInstance from "@/libs/axios-instance";
import { getApprovalError, getApprovalSuccess } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
import { message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

// Hook for applications list with filtering
export function useApplications() {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    cropType: null,
    province: null,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(endpoints.applications.list);
      console.log(response);

      if (response.data.success) {
        // Transform API response to match expected format
        const transformedData = Array.isArray(response.data.data)
          ? response.data.data.map((farm) => ({
              id: farm.id,
              owner_id: farm.owner_id,
              farm_name: farm.farm_name,
              farm_code: farm.farm_code,
              boundary: farm.boundary,
              center_location: farm.center_location,
              area_sqm: farm.area_sqm,
              province: farm.province,
              district: farm.district,
              commune: farm.commune,
              address: farm.address,
              crop_type: farm.crop_type,
              planting_date: farm.planting_date,
              expected_harvest_date: farm.expected_harvest_date,
              crop_type_verified: farm.crop_type_verified || false,
              land_certificate_number: farm.land_certificate_number,
              land_ownership_verified: farm.land_ownership_verified || false,
              has_irrigation: farm.has_irrigation,
              irrigation_type: farm.irrigation_type,
              soil_type: farm.soil_type,
              status: farm.status,
              created_at: farm.created_at,
              updated_at: farm.updated_at,
              farm_photos: farm.farm_photos,
            }))
          : [];
        setApplications(transformedData);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch applications"
        );
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch applications";
      setError(errorMessage);
      message.error(getApprovalError("LOAD_LIST_FAILED"));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    return applications.filter((item) => {
      const matchesSearch =
        item?.id?.toLowerCase().includes(searchText.toLowerCase()) ||
        item?.owner_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        item?.farm_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item?.crop_type?.toLowerCase().includes(searchText.toLowerCase());

      const matchesCropType =
        !filters.cropType || item.crop_type === filters.cropType;
      const matchesProvince =
        !filters.province || item.province === filters.province;

      return matchesSearch && matchesCropType && matchesProvince;
    });
  }, [applications, searchText, filters]);

  // Unique options for filters
  const filterOptions = useMemo(() => {
    const cropTypes = [...new Set(applications.map((item) => item.crop_type))];
    const provinces = [...new Set(applications.map((item) => item.province))];

    return { cropTypes, provinces };
  }, [applications]);

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
      province: values.province || null,
    });
  };

  const handleClearFilters = () => {
    setSearchText("");
    setFilters({
      cropType: null,
      province: null,
    });
  };

  return {
    filteredData,
    filterOptions,
    searchText,
    filters,
    loading,
    error,
    handleSearch,
    handleFilterChange,
    handleFormSubmit,
    handleClearFilters,
    refetch: fetchApplications,
  };
}

// Hook for application detail
export function useApplicationDetail(id) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch application detail from API
  const fetchApplicationDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        endpoints.applications.detail(id)
      );
      if (response.data.success) {
        const farm = response.data.data;
        // Transform API response to match expected format
        const transformedData = {
          id: farm.id,
          owner_id: farm.owner_id,
          farm_name: farm.farm_name,
          farm_code: farm.farm_code,
          boundary: farm.boundary,
          center_location: farm.center_location,
          area_sqm: farm.area_sqm,
          province: farm.province,
          district: farm.district,
          commune: farm.commune,
          address: farm.address,
          crop_type: farm.crop_type,
          planting_date: farm.planting_date,
          expected_harvest_date: farm.expected_harvest_date,
          crop_type_verified: farm.crop_type_verified || false,
          land_certificate_number: farm.land_certificate_number,
          land_ownership_verified: farm.land_ownership_verified || false,
          has_irrigation: farm.has_irrigation,
          irrigation_type: farm.irrigation_type,
          soil_type: farm.soil_type,
          status: farm.status,
          created_at: farm.created_at,
          updated_at: farm.updated_at,
          farm_photos: farm.farm_photos,
        };
        setApplication(transformedData);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch application detail"
        );
      }
    } catch (error) {
      console.error("Error fetching application detail:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch application detail";
      setError(errorMessage);
      message.error(getApprovalError("LOAD_FAILED"));
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch on mount or when id changes
  useEffect(() => {
    fetchApplicationDetail();
  }, [fetchApplicationDetail]);

  // Mock satellite data and farm analysis (not available in API)
  const satelliteData = useMemo(() => {
    if (!application) return null;
    return {
      ndvi_index: 0.7,
      crop_health_status: "good",
      actual_area: application.area,
    };
  }, [application]);

  const farmAnalysis = useMemo(() => {
    if (!application) return null;
    return {
      crop_health: {
        average_ndvi: 0.7,
        coverage_rate: 85,
        growth_stage: "Sinh trưởng",
      },
      soil_conditions: {
        soil_type: application.soil_type || "Không rõ",
        moisture: "Trung bình",
        ph_level: "6.5-7.0",
      },
      weather_model: {
        average_temperature: 28,
        humidity: 75,
        rainfall_30days: 150,
      },
    };
  }, [application]);

  return {
    application,
    satelliteData,
    farmAnalysis,
    loading,
    error,
    refetch: fetchApplicationDetail,
  };
}

// Hook for insurance policies list
export function useInsurancePolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(endpoints.policy.policy.list);
      if (response.data.success) {
        const allPolicies = response.data.data.policies || [];

        // Filter policies for approval page:
        // 1. status === "pending_review" (chờ partner duyệt)
        // 2. status === "pending_payment" (đã duyệt, chờ farmer thanh toán)
        const approvalPolicies = allPolicies.filter(
          (policy) =>
            policy.status === "pending_review" ||
            policy.status === "pending_payment"
        );
        setPolicies(approvalPolicies);
      } else {
        throw new Error(response.data.message || "Failed to fetch policies");
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch policies";
      setError(errorMessage);
      message.error(getApprovalError("LOAD_LIST_FAILED"));
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Use the reusable table data hook
  const tableData = useTableData(policies, {
    searchFields: ["policy_number", "farmer_id"],
    defaultFilters: {},
    pageSize: 10,
  });

  return {
    ...tableData,
    loading,
    error,
    refetch: fetchPolicies,
    // Keep original data for calculations
    allPolicies: policies,
  };
}

// Hook for insurance policy detail
export function useInsurancePolicyDetail(id) {
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading = true
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchPolicyDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      // Get user profile from localStorage
      let userProfile = null;
      try {
        const meData = localStorage.getItem("me");
        if (meData) {
          userProfile = JSON.parse(meData);
        }
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }

      // 1. Fetch Policy Detail
      const policyResponse = await axiosInstance.get(
        endpoints.policy.policy.detail(id)
      );

      if (policyResponse.data.success) {
        const policyData = policyResponse.data.data;

        // 2. Validate access: check if insurance_provider_id matches user's partner_id OR user_id
        const hasAccess =
          (userProfile?.partner_id &&
            policyData.insurance_provider_id === userProfile.partner_id) ||
          (userProfile?.user_id &&
            policyData.insurance_provider_id === userProfile.user_id);

        if (userProfile && !hasAccess) {
          setAccessDenied(true);
          setError(getApprovalError("UNAUTHORIZED_ACCESS"));
          setPolicy(null);
          setFarm(null);
          setLoading(false);
          return;
        }

        setPolicy(policyData);

        // 3. Fetch Farm Detail if farm_id exists
        if (policyData.farm_id) {
          const farmResponse = await axiosInstance.get(
            endpoints.applications.detail(policyData.farm_id)
          );
          if (farmResponse.data.success) {
            setFarm(farmResponse.data.data);
          }
        }
      } else {
        throw new Error(
          policyResponse.data.message || "Failed to fetch policy detail"
        );
      }
    } catch (error) {
      console.error("Error fetching policy detail:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch policy detail";
      setError(errorMessage);
      setPolicy(null);
      setFarm(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPolicyDetail();
  }, [fetchPolicyDetail]);

  // Reuse mock satellite/analysis logic for the farm
  const satelliteData = useMemo(() => {
    if (!farm) return null;
    return {
      ndvi_index: 0.7,
      crop_health_status: "good",
      actual_area: farm.area_sqm ? farm.area_sqm / 10000 : 0,
    };
  }, [farm]);

  const farmAnalysis = useMemo(() => {
    if (!farm) return null;
    return {
      crop_health: {
        average_ndvi: 0.7,
        coverage_rate: 85,
        growth_stage: "Sinh trưởng",
      },
      soil_conditions: {
        soil_type: farm.soil_type || "Không rõ",
        moisture: "Trung bình",
        ph_level: "6.5-7.0",
      },
      weather_model: {
        average_temperature: 28,
        humidity: 75,
        rainfall_30days: 150,
      },
    };
  }, [farm]);

  // Underwriting function (approve/reject)
  const submitUnderwriting = useCallback(
    async (underwritingData) => {
      if (!id) return { success: false, message: "Policy ID is required" };

      try {
        const response = await axiosInstance.post(
          endpoints.policy.policy.underwriting(id),
          underwritingData
        );

        if (response.data.success) {
          const successMessage =
            underwritingData.underwriting_status === "approved"
              ? getApprovalSuccess("APPROVED")
              : getApprovalSuccess("REJECTED");
          message.success(successMessage);
          return { success: true, message: successMessage };
        } else {
          throw new Error(
            response.data.message || "Failed to submit underwriting"
          );
        }
      } catch (error) {
        console.error("Error submitting underwriting:", error);
        const errorMessage =
          underwritingData.underwriting_status === "approved"
            ? getApprovalError("APPROVE_FAILED")
            : getApprovalError("REJECT_FAILED");
        message.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    },
    [id]
  );

  return {
    policy,
    farm,
    satelliteData,
    farmAnalysis,
    loading,
    error,
    accessDenied,
    submitUnderwriting,
    refetch: fetchPolicyDetail,
  };
}
