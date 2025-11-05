import mockData from "@/app/(internal)/policy/mock..json";
import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { calculateConditionCost, usePolicyStore } from "@/stores/policy-store";
import { message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

const TABS = {
  BASIC: "basic",
  CONFIGURATION: "configuration",
  TAGS: "tags",
  REVIEW: "review",
};

const usePolicy = () => {
  // State cho active tab
  const [currentTab, setCurrentTab] = useState(TABS.BASIC);

  // State cho form data của từng tab
  const [basicData, setBasicData] = useState({
    // ✅ Product Info (REQUIRED)
    productName: "",
    productCode: "",
    productDescription: "",
    insuranceProviderId: "",
    cropType: "",
    coverageCurrency: "VND",
    coverageDurationDays: 120,

    // ✅ Premium Config (REQUIRED)
    isPerHectare: true,
    premiumBaseRate: 0,
    fixPremiumAmount: null,
    maxPremiumPaymentProlong: null,
    cancelPremiumRate: null,

    // ✅ Payout Config (moved from ConfigurationTab - per BE spec)
    isPayoutPerHectare: true,
    payoutBaseRate: 0.75,
    fixPayoutAmount: null,
    payoutCap: null,
    overThresholdMultiplier: 1.0,

    // ✅ Enrollment & Validity Dates
    enrollmentStartDay: null,
    enrollmentEndDay: null,
    insuranceValidFrom: null,
    insuranceValidTo: null,

    // ✅ Renewal Config
    autoRenewal: false,
    renewalDiscountRate: 0,
    basePolicyInvalidDate: null,

    // ✅ Status & Document (auto fields)
    status: "draft",
    templateDocumentUrl: null,
    documentValidationStatus: "pending",
    importantAdditionalInformation: "",

    // ✅ Data Sources Table
    selectedDataSources: [], // Array of selected data sources
  });

  const [configurationData, setConfigurationData] = useState({
    // ✅ Trigger Config (REQUIRED)
    logicalOperator: "AND",
    monitorInterval: 1,
    monitorFrequencyUnit: "day",

    // ✅ Optional Trigger Fields
    growthStage: "",
    blackoutPeriods: {}, // ✅ Object, not array - per BE spec

    // ✅ Conditions Table (REQUIRED at least 1)
    conditions: [], // Array of trigger conditions
  });

  const [tagsData, setTagsData] = useState({
    tags: [], // Array of key-value pairs with data types
    uploadedFile: null,
    modifiedPdfBytes: null,
    documentTagsObject: {},
  });

  // State cho validation
  const [validationStatus, setValidationStatus] = useState({
    basic: false,
    configuration: false,
    tags: true, // Tags is optional
    review: false,
  });

  // State cho loading
  const [loading, setLoading] = useState(false);

  // State cho categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // State cho tiers
  const [tiers, setTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [tiersError, setTiersError] = useState(null);

  // State cho data sources
  const [dataSources, setDataSources] = useState([]);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(false);
  const [dataSourcesError, setDataSourcesError] = useState(null);

  // Tính toán chi phí ước tính theo thời gian thực
  const estimatedCosts = useMemo(() => {
    let monthlyDataCost = 0;
    let dataComplexityScore = 0;

    // Tính chi phí dữ liệu
    basicData.selectedDataSources.forEach((source) => {
      const category = categories.find(
        (cat) => cat.category_name === source.category
      );
      const tier = tiers.find((t) => t.value === source.tier);

      if (category && tier) {
        const cost =
          source.baseCost *
          category.category_cost_multiplier *
          tier.data_tier_multiplier;
        monthlyDataCost += cost;
      }
    });

    // Tính data complexity score
    const uniqueDataSources = new Set(
      basicData.selectedDataSources.map((s) => s.parameterName)
    );
    dataComplexityScore = uniqueDataSources.size;

    return {
      monthlyDataCost: monthlyDataCost.toFixed(2),
      dataComplexityScore,
      premiumBaseRate: basicData.premiumBaseRate,
      totalEstimatedCost: monthlyDataCost.toFixed(2),
    };
  }, [
    basicData.selectedDataSources,
    basicData.premiumBaseRate,
    categories,
    tiers,
  ]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    const token = localStorage.getItem("token");
    console.log("🔑 Current token:", token);

    try {
      console.log(
        "🚀 Calling API:",
        endpoints.policy.data_tier.category.get_all
      );
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.category.get_all
      );

      console.log("📥 Response:", response.data);

      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      console.error("❌ Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch categories";
      setCategoriesError(errorMessage);
      message.error(`Lỗi khi tải danh mục: ${errorMessage}`);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch tiers by category
  const fetchTiersByCategory = useCallback(async (categoryId) => {
    if (!categoryId) {
      setTiers([]);
      return;
    }

    setTiersLoading(true);
    setTiersError(null);

    try {
      console.log(
        "🚀 Calling API:",
        endpoints.policy.data_tier.tier.get_by_category(categoryId)
      );
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.tier.get_by_category(categoryId)
      );

      console.log("📥 Tiers Response:", response.data);

      if (response.data.success) {
        // Transform API response to match expected format
        const transformedTiers = response.data.data.map((tier) => ({
          id: tier.id, // Use the actual UUID id from API
          value: tier.tier_name.toLowerCase(), // Use tier_name lowercase as value
          label: tier.tier_name, // Display name
          description: `${tier.tier_name} Tier`,
          tierMultiplier: tier.data_tier_multiplier,
          data_tier_category_id: tier.data_tier_category_id,
          tier_level: tier.tier_level,
          tier_name: tier.tier_name,
          data_tier_multiplier: tier.data_tier_multiplier,
        }));
        setTiers(transformedTiers);
      } else {
        throw new Error(response.data.message || "Failed to fetch tiers");
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      console.error("❌ Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch tiers";
      setTiersError(errorMessage);
      message.error(`Lỗi khi tải gói dịch vụ: ${errorMessage}`);
      setTiers([]);
    } finally {
      setTiersLoading(false);
    }
  }, []);

  // Fetch data sources by tier
  const fetchDataSourcesByTier = useCallback(async (tierId) => {
    if (!tierId) {
      setDataSources([]);
      return;
    }

    setDataSourcesLoading(true);
    setDataSourcesError(null);

    try {
      console.log(
        "🚀 Calling API:",
        endpoints.policy.data_tier.tier.get_data_sources(tierId)
      );
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.tier.get_data_sources(tierId)
      );

      console.log("📥 Data Sources Response:", response.data);

      if (response.data.success) {
        // Transform API response to match expected format
        const transformedDataSources = response.data.data.map((source) => ({
          id:
            source.id ||
            source.data_source_id ||
            `${source.data_source}_${source.parameter_name}`, // ✅ Use real UUID from API first
          label: source.display_name_vi || source.parameter_name, // Use Vietnamese name if available
          parameterName: source.parameter_name,
          unit: source.unit,
          description: source.description_vi || source.parameter_name,
          baseCost: source.base_cost,
          data_tier_id: source.data_tier_id,
          data_provider: source.data_provider,
          parameter_type: source.parameter_type,
          min_value: source.min_value,
          max_value: source.max_value,
          update_frequency: source.update_frequency,
          spatial_resolution: source.spatial_resolution,
          accuracy_rating: source.accuracy_rating,
          api_endpoint: source.api_endpoint,
          // Keep original fields for reference
          ...source,
        }));
        setDataSources(transformedDataSources);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch data sources"
        );
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      console.error("❌ Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch data sources";
      setDataSourcesError(errorMessage);
      message.error(`Lỗi khi tải nguồn dữ liệu: ${errorMessage}`);
      setDataSources([]);
    } finally {
      setDataSourcesLoading(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ✅ AUTO-VALIDATE: Run validation whenever data changes
  // This ensures validationStatus is always up-to-date

  // Validate basic tab - Only check REQUIRED fields per BE spec
  const validateBasicTab = useCallback(() => {
    // ✅ REQUIRED fields per BE spec
    const requiredFields = [
      "productName",
      "productCode",
      "coverageCurrency",
      "coverageDurationDays",
      "isPerHectare",
      "premiumBaseRate", // REQUIRED if no fix_premium_amount
      "isPayoutPerHectare",
      "insuranceValidFrom",
      "insuranceValidTo",
    ];

    // Check all REQUIRED fields are filled
    const allRequiredFilled = requiredFields.every((field) => {
      const value = basicData[field];
      // For boolean fields, check explicitly (false is valid)
      if (field === "isPerHectare" || field === "isPayoutPerHectare") {
        return value !== undefined && value !== null;
      }
      // For other fields, check truthy value
      return value !== undefined && value !== null && value !== "";
    });

    // ✅ Check table: selectedDataSources must have at least 1 item
    const hasDataSources =
      basicData.selectedDataSources && basicData.selectedDataSources.length > 0;

    const isValid = allRequiredFilled && hasDataSources;

    if (!isValid) {
      console.warn("❌ BasicTab validation failed:", {
        allRequiredFilled,
        hasDataSources,
        basicData,
      });
    }

    setValidationStatus((prev) => ({ ...prev, basic: isValid }));
    return isValid;
  }, [basicData]);

  // Validate configuration tab - Only check REQUIRED fields per BE spec
  const validateConfigurationTab = useCallback(() => {
    // ✅ REQUIRED trigger fields per BE spec
    const requiredTriggerFields = [
      "logicalOperator",
      "monitorInterval",
      "monitorFrequencyUnit",
    ];

    const allTriggerFieldsFilled = requiredTriggerFields.every((field) => {
      const value = configurationData[field];
      return value !== undefined && value !== null && value !== "";
    });

    // ✅ Check table: conditions must have at least 1 item
    const hasConditions =
      configurationData.conditions && configurationData.conditions.length > 0;

    // ✅ Each condition must have REQUIRED fields
    const allConditionsValid =
      hasConditions &&
      configurationData.conditions.every(
        (condition) =>
          condition.dataSourceId &&
          condition.thresholdOperator &&
          condition.thresholdValue !== undefined &&
          condition.aggregationFunction &&
          condition.aggregationWindowDays > 0
      );

    const isValid =
      allTriggerFieldsFilled && hasConditions && allConditionsValid;

    if (!isValid) {
      console.warn("❌ ConfigurationTab validation failed:", {
        allTriggerFieldsFilled,
        hasConditions,
        allConditionsValid,
        configurationData,
      });
    }

    setValidationStatus((prev) => ({ ...prev, configuration: isValid }));
    return isValid;
  }, [configurationData]);

  // Validate review tab
  const validateReviewTab = useCallback(() => {
    const isValid = validationStatus.basic && validationStatus.configuration;
    setValidationStatus((prev) => ({ ...prev, review: isValid }));
    return isValid;
  }, [validationStatus.basic, validationStatus.configuration]);

  // 🔥 AUTO-VALIDATE: Validate BasicTab whenever basicData changes
  useEffect(() => {
    validateBasicTab();
  }, [validateBasicTab]);

  // 🔥 AUTO-VALIDATE: Validate ConfigurationTab whenever configurationData changes
  useEffect(() => {
    validateConfigurationTab();
  }, [validateConfigurationTab]);

  // 🔥 AUTO-VALIDATE: Validate ReviewTab whenever basic/configuration validation changes
  useEffect(() => {
    validateReviewTab();
  }, [validateReviewTab]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setCurrentTab(tab);
    return true;
  }, []);

  // Handle next tab
  const handleNext = useCallback(() => {
    const tabs = Object.values(TABS);
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      return handleTabChange(tabs[currentIndex + 1]);
    }
    return false;
  }, [currentTab, handleTabChange]);

  // Handle previous tab
  const handlePrevious = useCallback(() => {
    const tabs = Object.values(TABS);
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
      return true;
    }
    return false;
  }, [currentTab]);

  // Handle basic data change
  const handleBasicDataChange = useCallback((newData) => {
    setBasicData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Handle add data source
  const handleAddDataSource = useCallback((dataSource) => {
    setBasicData((prev) => ({
      ...prev,
      selectedDataSources: [
        ...prev.selectedDataSources,
        {
          ...dataSource,
          // ✅ KEEP original UUID from API - DO NOT override!
          // dataSource.id already contains the real UUID from backend
        },
      ],
    }));
  }, []);

  // Handle remove data source
  const handleRemoveDataSource = useCallback((id) => {
    setBasicData((prev) => ({
      ...prev,
      selectedDataSources: prev.selectedDataSources.filter(
        (source) => source.id !== id
      ),
    }));
  }, []);

  // Handle configuration data change
  const handleConfigurationDataChange = useCallback((newData) => {
    setConfigurationData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Handle add trigger condition
  const handleAddTriggerCondition = useCallback((condition) => {
    // Calculate condition cost automatically
    const calculatedCost = calculateConditionCost(
      condition.baseCost,
      condition.categoryMultiplier,
      condition.tierMultiplier
    );

    setConfigurationData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          ...condition,
          id: `condition_${Date.now()}`,
          calculatedCost,
        },
      ],
    }));
  }, []);

  // Handle remove trigger condition
  const handleRemoveTriggerCondition = useCallback((id) => {
    setConfigurationData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((condition) => condition.id !== id),
    }));
  }, []);

  // Handle update trigger condition
  const handleUpdateTriggerCondition = useCallback((id, updates) => {
    setConfigurationData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) => {
        if (condition.id === id) {
          const updatedCondition = { ...condition, ...updates };

          // Recalculate cost if any related field changed
          if (
            updates.baseCost !== undefined ||
            updates.categoryMultiplier !== undefined ||
            updates.tierMultiplier !== undefined
          ) {
            updatedCondition.calculatedCost = calculateConditionCost(
              updatedCondition.baseCost,
              updatedCondition.categoryMultiplier,
              updatedCondition.tierMultiplier
            );
          }

          return updatedCondition;
        }
        return condition;
      }),
    }));
  }, []);

  // Handle tags data change
  const handleTagsDataChange = useCallback((newData) => {
    setTagsData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Handle add tag
  const handleAddTag = useCallback((tag) => {
    setTagsData((prev) => ({
      ...prev,
      tags: [
        ...prev.tags,
        {
          ...tag,
          id: `tag_${Date.now()}`,
        },
      ],
    }));
  }, []);

  // Handle remove tag
  const handleRemoveTag = useCallback((id) => {
    setTagsData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== id),
    }));
  }, []);

  // Handle update tag
  const handleUpdateTag = useCallback((id, updates) => {
    setTagsData((prev) => ({
      ...prev,
      tags: prev.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }));
  }, []);

  // Get available data sources for current selections
  const getAvailableDataSources = useCallback((category, tier) => {
    if (!category || !tier) return [];

    const sources = mockData.dataSources[category]?.[tier] || [];
    return sources;
  }, []);

  // Get available data sources for trigger conditions
  const getAvailableDataSourcesForTrigger = useCallback(() => {
    return basicData.selectedDataSources.map((source) => ({
      value: source.id,
      label: `${source.label} (${source.category}/${source.tier})`,
      parameterName: source.parameterName,
      unit: source.unit,
      // Pass cost-related fields for condition calculation
      baseCost: source.baseCost,
      categoryMultiplier: source.categoryMultiplier || 1,
      tierMultiplier: source.tierMultiplier || 1,
    }));
  }, [basicData.selectedDataSources]);

  // Reset form
  const handleReset = useCallback(() => {
    setBasicData({
      // ✅ Product Info (REQUIRED)
      productName: "",
      productCode: "",
      productDescription: "",
      insuranceProviderId: "",
      cropType: "",
      coverageCurrency: "VND",
      coverageDurationDays: 120,

      // ✅ Premium Config (REQUIRED)
      isPerHectare: true,
      premiumBaseRate: 0,
      fixPremiumAmount: null,
      maxPremiumPaymentProlong: null,
      cancelPremiumRate: null,

      // ✅ Payout Config (moved from ConfigurationTab - per BE spec)
      isPayoutPerHectare: true,
      payoutBaseRate: 0.75,
      fixPayoutAmount: null,
      payoutCap: null,
      overThresholdMultiplier: 1.0,

      // ✅ Enrollment & Validity Dates
      enrollmentStartDay: null,
      enrollmentEndDay: null,
      insuranceValidFrom: null,
      insuranceValidTo: null,

      // ✅ Renewal Config
      autoRenewal: false,
      renewalDiscountRate: 0,
      basePolicyInvalidDate: null,

      // ✅ Status & Document (auto fields)
      status: "draft",
      templateDocumentUrl: null,
      documentValidationStatus: "pending",
      importantAdditionalInformation: "",

      // ✅ Data Sources Table
      selectedDataSources: [],
    });
    setConfigurationData({
      // ✅ Trigger Config (REQUIRED)
      logicalOperator: "AND",
      monitorInterval: 1,
      monitorFrequencyUnit: "day",

      // ✅ Optional Trigger Fields
      growthStage: "",
      blackoutPeriods: [],

      // ✅ Conditions Table (REQUIRED at least 1)
      conditions: [],
    });
    setTagsData({
      tags: [],
      uploadedFile: null,
      modifiedPdfBytes: null,
      documentTagsObject: {},
    });
    setCurrentTab(TABS.BASIC);
    setValidationStatus({
      basic: false,
      configuration: false,
      tags: true,
      review: false,
    });
  }, []);

  // Handle create policy
  const handleCreatePolicy = useCallback(async () => {
    if (!validateReviewTab()) {
      message.error("Vui lòng hoàn thành tất cả thông tin bắt buộc");
      return false;
    }

    setLoading(true);
    try {
      // Get insurance provider ID from auth store or localStorage
      let insuranceProviderId = basicData.insuranceProviderId;

      if (!insuranceProviderId) {
        // Try to get from localStorage /me response
        try {
          const meData = localStorage.getItem("me");
          if (meData) {
            const parsed = JSON.parse(meData);
            insuranceProviderId =
              parsed.partner_id || parsed.partnerId || "fallback_partner_id";
          }
        } catch (e) {
          console.warn("Could not parse /me from localStorage:", e);
        }

        // Final fallback
        if (!insuranceProviderId) {
          insuranceProviderId = "fallback_partner_id";
        }
      }

      // Update basicData with insurance provider ID
      const updatedBasicData = {
        ...basicData,
        insuranceProviderId,
      };

      // Sync data to policy store for building payload
      const policyStore = usePolicyStore.getState();
      policyStore.setBasicData(updatedBasicData);
      policyStore.setConfigurationData(configurationData);
      policyStore.setTagsData(tagsData);

      // Validate payload
      const validation = policyStore.validatePayload();
      if (!validation.isValid) {
        message.error(`Validation failed: ${validation.errors.join(", ")}`);
        console.error("Validation errors:", validation.errors);
        return false;
      }

      // Build backend payload
      const payload = await policyStore.buildBackendPayload();

      console.log("📤 Sending payload to BE:", payload);

      // Call API
      const response = await axiosInstance.post(
        endpoints.policy.base_policy.create_complete(24),
        payload
      );

      console.log("📥 API Response:", response.data);

      if (response.data.success) {
        message.success("Base Policy đã được tạo thành công!");

        // Reset form after success
        handleReset();
        policyStore.resetPolicyData();

        return true;
      } else {
        throw new Error(response.data.message || "Failed to create policy");
      }
    } catch (error) {
      console.error("❌ Error creating policy:", error);
      console.error("❌ Error response:", error.response?.data);

      // Parse error messages
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Có lỗi xảy ra khi tạo policy";

      // Show field-level errors if available
      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors;
        Object.keys(fieldErrors).forEach((field) => {
          message.error(`${field}: ${fieldErrors[field]}`);
        });
      } else {
        message.error(errorMessage);
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [basicData, configurationData, tagsData, validateReviewTab, handleReset]);

  return {
    // State
    currentTab,
    basicData,
    configurationData,
    tagsData,
    validationStatus,
    loading,
    estimatedCosts,
    categories,
    categoriesLoading,
    categoriesError,
    tiers,
    tiersLoading,
    tiersError,
    dataSources,
    dataSourcesLoading,
    dataSourcesError,

    // Constants
    TABS,
    mockData,

    // Actions
    handleTabChange,
    handleNext,
    handlePrevious,
    handleBasicDataChange,
    handleAddDataSource,
    handleRemoveDataSource,
    handleConfigurationDataChange,
    handleAddTriggerCondition,
    handleRemoveTriggerCondition,
    handleUpdateTriggerCondition,
    handleTagsDataChange,
    handleAddTag,
    handleRemoveTag,
    handleUpdateTag,
    handleCreatePolicy,
    handleReset,
    fetchCategories,
    fetchTiersByCategory,
    fetchDataSourcesByTier,

    // Utilities
    getAvailableDataSources,
    getAvailableDataSourcesForTrigger,
    validateBasicTab,
    validateConfigurationTab,
    validateReviewTab,
  };
};

export default usePolicy;
