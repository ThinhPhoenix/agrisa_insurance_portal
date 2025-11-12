import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

// Hook for applications list with filtering
export function useApplications() {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    cropType: null,
    region: null,
    riskLevel: null,
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
      if (response.data.success) {
        // Transform API response to match expected format
        const transformedData = Array.isArray(response.data.data)
          ? response.data.data.map((farm) => ({
              id: farm.ID,
              farmer_name: farm.OwnerID, // Will be replaced with actual farmer name if available
              farm_name: farm.FarmName,
              farm_code: farm.FarmCode,
              crop_type: farm.CropType,
              region: farm.Province,
              district: farm.District,
              commune: farm.Commune,
              address: farm.Address,
              area: farm.AreaSQM / 10000, // Convert m² to hectares
              submission_date: farm.CreatedAt,
              status: farm.Status,
              boundary: farm.Boundary,
              center_location: farm.CenterLocation,
              planting_date: farm.PlantingDate,
              expected_harvest_date: farm.ExpectedHarvestDate,
              // Additional fields
              land_certificate_number: farm.LandCertificateNumber,
              land_certificate_url: farm.LandCertificateURL,
              has_irrigation: farm.HasIrrigation,
              irrigation_type: farm.IrrigationType,
              soil_type: farm.SoilType,
              farm_photos: farm.farm_photos || [],
            }))
          : [];
        setApplications(transformedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch applications";
      setError(errorMessage);
      message.error(`Lỗi khi tải danh sách đơn đăng ký: ${errorMessage}`);
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
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.farmer_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.farm_name?.toLowerCase().includes(searchText.toLowerCase()) ||
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
  }, [applications, searchText, filters]);

  // Unique options for filters
  const filterOptions = useMemo(() => {
    const cropTypes = [
      ...new Set(applications.map((item) => item.crop_type)),
    ];
    const regions = [
      ...new Set(applications.map((item) => item.region)),
    ];
    const riskLevels = [
      ...new Set(applications.map((item) => item.risk_level).filter(Boolean)),
    ];

    return { cropTypes, regions, riskLevels };
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
      const response = await axiosInstance.get(endpoints.applications.detail(id));
      if (response.data.success) {
        const farm = response.data.data;
        // Transform API response to match expected format
        const transformedData = {
          id: farm.ID,
          farmer_name: farm.OwnerID,
          farmer_photo: null, // Not available in API
          farm_name: farm.FarmName,
          farm_code: farm.FarmCode,
          crop_type: farm.CropType,
          region: farm.Province,
          district: farm.District,
          commune: farm.Commune,
          address: farm.Address,
          area: farm.AreaSQM / 10000, // Convert m² to hectares
          submission_date: farm.CreatedAt,
          insured_amount: 0, // Not available in API
          status: farm.Status,
          boundary: farm.Boundary,
          center_location: farm.CenterLocation,
          gps_coordinates: farm.Boundary?.[0] || [], // First polygon ring
          planting_date: farm.PlantingDate,
          expected_harvest_date: farm.ExpectedHarvestDate,
          // Risk assessment (placeholder - not in API)
          risk_score: 0,
          risk_level: "Low",
          risk_summary: "Đánh giá tự động từ dữ liệu trang trại",
          // Additional fields
          land_certificate_number: farm.LandCertificateNumber,
          land_certificate_url: farm.LandCertificateURL,
          land_use_certificate_images: farm.LandCertificateURL ? [farm.LandCertificateURL] : [],
          has_irrigation: farm.HasIrrigation,
          irrigation_type: farm.IrrigationType,
          soil_type: farm.SoilType,
          farm_photos: farm.farm_photos || [],
          land_images: (farm.farm_photos || [])
            .filter((photo) => photo.photo_type === "crop" || photo.photo_type === "boundary")
            .map((photo) => photo.photo_url),
          application_documents: [], // Not available in API
          // Generate map URL from center location
          farm_location_map: farm.CenterLocation
            ? `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${farm.CenterLocation[1]},${farm.CenterLocation[0]}&zoom=15`
            : null,
        };
        setApplication(transformedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch application detail");
      }
    } catch (error) {
      console.error("Error fetching application detail:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch application detail";
      setError(errorMessage);
      message.error(`Lỗi khi tải chi tiết đơn đăng ký: ${errorMessage}`);
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
