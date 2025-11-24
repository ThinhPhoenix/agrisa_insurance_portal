import mockData from "@/app/(internal)/policy/mock..json";
import axiosInstance from "@/libs/axios-instance";
import { getErrorMessage } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { calculateConditionCost, usePolicyStore } from "@/stores/policy-store";
import { message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TABS = {
  FAQ: "faq",
  BASIC: "basic",
  CONFIGURATION: "configuration",
  TAGS: "tags",
  REVIEW: "review",
};

/**
 * Debounce utility for expensive operations
 */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for policy creation functionality
 * Used in: /policy/create page for creating new policies
 */
const useCreatePolicy = () => {
  const [currentTab, setCurrentTab] = useState(TABS.FAQ);
  const validationTimeoutRef = useRef(null);

  const [basicData, setBasicData] = useState({
    productName: "",
    productCode: "",
    productDescription: "",
    insuranceProviderId: "",
    cropType: "",
    coverageCurrency: "VND",
    coverageDurationDays: 120,
    isPerHectare: true,
    premiumBaseRate: 0,
    fixPremiumAmount: null,
    maxPremiumPaymentProlong: null,
    cancelPremiumRate: null,
    isPayoutPerHectare: true,
    payoutBaseRate: 0.75,
    fixPayoutAmount: null,
    payoutCap: null,
    overThresholdMultiplier: 1.0,
    enrollmentStartDay: null,
    enrollmentEndDay: null,
    insuranceValidFrom: null,
    insuranceValidTo: null,
    autoRenewal: false,
    renewalDiscountRate: 0,
    basePolicyInvalidDate: null,
    status: "draft",
    templateDocumentUrl: null,
    documentValidationStatus: "pending",
    importantAdditionalInformation: "",
    selectedDataSources: [],
  });

  const [configurationData, setConfigurationData] = useState({
    logicalOperator: "AND",
    monitorInterval: 1,
    monitorFrequencyUnit: "day",
    growthStage: "",
    blackoutPeriods: {},
    conditions: [],
  });

  const [tagsData, setTagsData] = useState({
    tags: [],
    uploadedFile: null,
    modifiedPdfBytes: null,
    documentTagsObject: {},
    placeholders: [], // 🆕 Store placeholders
    mappings: {}, // 🆕 Store mappings
  });

  const [validationStatus, setValidationStatus] = useState({
    basic: false,
    configuration: false,
    tags: true,
    review: false,
  });

  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [tiers, setTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [tiersError, setTiersError] = useState(null);

  const [dataSources, setDataSources] = useState([]);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(false);
  const [dataSourcesError, setDataSourcesError] = useState(null);

  // ✅ OPTIMIZATION: Memoize expensive cost calculations
  // Only recalculate when dependencies actually change
  const estimatedCosts = useMemo(() => {
    let monthlyDataCost = 0;
    let dataComplexityScore = 0;

    // Skip calculation if no data sources
    if (
      !basicData.selectedDataSources ||
      basicData.selectedDataSources.length === 0
    ) {
      return {
        monthlyDataCost: "0.00",
        dataComplexityScore: 0,
        premiumBaseRate: basicData.premiumBaseRate || 0,
        totalEstimatedCost: "0.00",
      };
    }

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

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.category.get_all
      );

      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch categories");
      }
    } catch (error) {
      // Log English error to console for debugging
      console.error("[fetchCategories] Error:", error);

      // Show Vietnamese error to user
      let vietnameseError = "Lỗi khi tải danh mục dữ liệu";

      if (error.response?.status === 401) {
        vietnameseError = getErrorMessage("SESSION_EXPIRED");
      } else if (error.response?.status === 403) {
        vietnameseError = getErrorMessage("FORBIDDEN");
      } else if (error.response?.status === 404) {
        vietnameseError = getErrorMessage("NOT_FOUND");
      } else if (error.response?.status >= 500) {
        vietnameseError = getErrorMessage("SERVER_ERROR");
      } else if (!error.response) {
        vietnameseError = getErrorMessage("NETWORK_ERROR");
      }

      setCategoriesError(vietnameseError);
      message.error(vietnameseError);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchTiersByCategory = useCallback(async (categoryId) => {
    if (!categoryId) {
      setTiers([]);
      return;
    }

    setTiersLoading(true);
    setTiersError(null);

    try {
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.tier.get_by_category(categoryId)
      );

      if (response.data.success) {
        const transformedTiers = response.data.data.map((tier) => ({
          id: tier.id,
          value: tier.tier_name.toLowerCase(),
          label: tier.tier_name,
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
      // Log English error to console for debugging
      console.error("[fetchTiersByCategory] Error:", error);

      // Show Vietnamese error to user
      let vietnameseError = "Lỗi khi tải gói dịch vụ";

      if (error.response?.status === 401) {
        vietnameseError = getErrorMessage("SESSION_EXPIRED");
      } else if (error.response?.status === 403) {
        vietnameseError = getErrorMessage("FORBIDDEN");
      } else if (error.response?.status === 404) {
        vietnameseError = getErrorMessage("NOT_FOUND");
      } else if (error.response?.status >= 500) {
        vietnameseError = getErrorMessage("SERVER_ERROR");
      } else if (!error.response) {
        vietnameseError = getErrorMessage("NETWORK_ERROR");
      }

      setTiersError(vietnameseError);
      message.error(vietnameseError);
      setTiers([]);
    } finally {
      setTiersLoading(false);
    }
  }, []);

  const fetchDataSourcesByTier = useCallback(async (tierId) => {
    if (!tierId) {
      setDataSources([]);
      return;
    }

    setDataSourcesLoading(true);
    setDataSourcesError(null);

    try {
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.tier.get_data_sources(tierId)
      );

      if (response.data.success) {
        const transformedDataSources = response.data.data.map((source) => ({
          id:
            source.id ||
            source.data_source_id ||
            `${source.data_source}_${source.parameter_name}`,
          label: source.display_name_vi || source.parameter_name,
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
          ...source,
        }));
        setDataSources(transformedDataSources);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch data sources"
        );
      }
    } catch (error) {
      // Log English error to console for debugging
      console.error("[fetchDataSourcesByTier] Error:", error);

      // Show Vietnamese error to user
      let vietnameseError = "Lỗi khi tải nguồn dữ liệu";

      if (error.response?.status === 401) {
        vietnameseError = getErrorMessage("SESSION_EXPIRED");
      } else if (error.response?.status === 403) {
        vietnameseError = getErrorMessage("FORBIDDEN");
      } else if (error.response?.status === 404) {
        vietnameseError = getErrorMessage("NOT_FOUND");
      } else if (error.response?.status >= 500) {
        vietnameseError = getErrorMessage("SERVER_ERROR");
      } else if (!error.response) {
        vietnameseError = getErrorMessage("NETWORK_ERROR");
      }

      setDataSourcesError(vietnameseError);
      message.error(vietnameseError);
      setDataSources([]);
    } finally {
      setDataSourcesLoading(false);
    }
  }, []);

  const validateBasicTab = useCallback(() => {
    const requiredFields = [
      "productName",
      "productCode",
      "coverageCurrency",
      "coverageDurationDays",
      "isPerHectare",
      "premiumBaseRate",
      "isPayoutPerHectare",
      "insuranceValidFrom",
      "insuranceValidTo",
    ];

    const allRequiredFilled = requiredFields.every((field) => {
      const value = basicData[field];
      if (field === "isPerHectare" || field === "isPayoutPerHectare") {
        return value !== undefined && value !== null;
      }
      return value !== undefined && value !== null && value !== "";
    });

    const hasDataSources =
      basicData.selectedDataSources && basicData.selectedDataSources.length > 0;

    const isValid = allRequiredFilled && hasDataSources;

    setValidationStatus((prev) => ({ ...prev, basic: isValid }));
    return isValid;
  }, [basicData]);

  const validateConfigurationTab = useCallback(() => {
    const requiredTriggerFields = [
      "logicalOperator",
      "monitorInterval",
      "monitorFrequencyUnit",
    ];

    const allTriggerFieldsFilled = requiredTriggerFields.every((field) => {
      const value = configurationData[field];
      return value !== undefined && value !== null && value !== "";
    });

    const hasConditions =
      configurationData.conditions && configurationData.conditions.length > 0;

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

    setValidationStatus((prev) => ({ ...prev, configuration: isValid }));
    return isValid;
  }, [configurationData]);

  const validateReviewTab = useCallback(() => {
    const isValid = validationStatus.basic && validationStatus.configuration;
    setValidationStatus((prev) => ({ ...prev, review: isValid }));
    return isValid;
  }, [validationStatus.basic, validationStatus.configuration]);

  useEffect(() => {
    validateBasicTab();
  }, [validateBasicTab]);

  useEffect(() => {
    validateConfigurationTab();
  }, [validateConfigurationTab]);

  useEffect(() => {
    validateReviewTab();
  }, [validateReviewTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleTabChange = useCallback((tab) => {
    setCurrentTab(tab);
    return true;
  }, []);

  const handleNext = useCallback(() => {
    const tabs = Object.values(TABS);
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex < tabs.length - 1) {
      return handleTabChange(tabs[currentIndex + 1]);
    }
    return false;
  }, [currentTab, handleTabChange]);

  const handlePrevious = useCallback(() => {
    const tabs = Object.values(TABS);
    const currentIndex = tabs.indexOf(currentTab);
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
      return true;
    }
    return false;
  }, [currentTab]);

  const handleBasicDataChange = useCallback((newData) => {
    setBasicData((prev) => ({ ...prev, ...newData }));
  }, []);

  const handleAddDataSource = useCallback((dataSource) => {
    setBasicData((prev) => ({
      ...prev,
      selectedDataSources: [
        ...prev.selectedDataSources,
        {
          ...dataSource,
        },
      ],
    }));
  }, []);

  const handleRemoveDataSource = useCallback((id) => {
    setBasicData((prev) => ({
      ...prev,
      selectedDataSources: prev.selectedDataSources.filter(
        (source) => source.id !== id
      ),
    }));
  }, []);

  const handleConfigurationDataChange = useCallback((newData) => {
    setConfigurationData((prev) => ({ ...prev, ...newData }));
  }, []);

  const handleAddTriggerCondition = useCallback((condition) => {
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

  const handleRemoveTriggerCondition = useCallback((id) => {
    setConfigurationData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((condition) => condition.id !== id),
    }));
  }, []);

  const handleUpdateTriggerCondition = useCallback((id, updates) => {
    setConfigurationData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) => {
        if (condition.id === id) {
          const updatedCondition = { ...condition, ...updates };

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

  const handleTagsDataChange = useCallback((newData) => {
    if (typeof newData === "function") {
      setTagsData((prev) => {
        const result = newData(prev);
        return result;
      });
    } else {
      setTagsData((prev) => {
        const result = { ...prev, ...newData };
        return result;
      });
    }
  }, []);

  const handleAddTag = useCallback((tag) => {
    setTagsData((prev) => {
      const newTags = [
        ...prev.tags,
        {
          ...tag,
          id: tag.id || `tag_${Date.now()}`,
        },
      ];

      return {
        ...prev,
        tags: newTags,
      };
    });
  }, []);

  const handleRemoveTag = useCallback((id) => {
    setTagsData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== id),
    }));
  }, []);

  const handleUpdateTag = useCallback((id, updates) => {
    setTagsData((prev) => ({
      ...prev,
      tags: prev.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }));
  }, []);

  const getAvailableDataSourcesForTrigger = useCallback(() => {
    return basicData.selectedDataSources.map((source) => ({
      value: source.id,
      label: `${source.label} (${source.category}/${source.tier})`,
      parameterName: source.parameterName,
      unit: source.unit,
      baseCost: source.baseCost,
      categoryMultiplier: source.categoryMultiplier || 1,
      tierMultiplier: source.tierMultiplier || 1,
    }));
  }, [basicData.selectedDataSources]);

  const handleReset = useCallback(() => {
    setBasicData({
      productName: "",
      productCode: "",
      productDescription: "",
      insuranceProviderId: "",
      cropType: "",
      coverageCurrency: "VND",
      coverageDurationDays: 120,
      isPerHectare: true,
      premiumBaseRate: 0,
      fixPremiumAmount: null,
      maxPremiumPaymentProlong: null,
      cancelPremiumRate: null,
      isPayoutPerHectare: true,
      payoutBaseRate: 0.75,
      fixPayoutAmount: null,
      payoutCap: null,
      overThresholdMultiplier: 1.0,
      enrollmentStartDay: null,
      enrollmentEndDay: null,
      insuranceValidFrom: null,
      insuranceValidTo: null,
      autoRenewal: false,
      renewalDiscountRate: 0,
      basePolicyInvalidDate: null,
      status: "draft",
      templateDocumentUrl: null,
      documentValidationStatus: "pending",
      importantAdditionalInformation: "",
      selectedDataSources: [],
    });
    setConfigurationData({
      logicalOperator: "AND",
      monitorInterval: 1,
      monitorFrequencyUnit: "day",
      growthStage: "",
      blackoutPeriods: [],
      conditions: [],
    });
    setTagsData({
      tags: [],
      uploadedFile: null,
      modifiedPdfBytes: null,
      documentTagsObject: {},
      placeholders: [],
      mappings: {},
    });
    setCurrentTab(TABS.BASIC);
    setValidationStatus({
      basic: false,
      configuration: false,
      tags: true,
      review: false,
    });
  }, []);

  const handleCreatePolicy = useCallback(async () => {
    if (!validateReviewTab()) {
      message.error("Vui lòng hoàn thành tất cả thông tin bắt buộc");
      return false;
    }

    setLoading(true);
    try {
      let insuranceProviderId = basicData.insuranceProviderId;

      if (!insuranceProviderId) {
        try {
          const meData = localStorage.getItem("me");
          if (meData) {
            const parsed = JSON.parse(meData);
            insuranceProviderId = parsed.user_id || "temp_id";
          }
        } catch (e) {}

        if (!insuranceProviderId) {
          insuranceProviderId = "temp_id";
        }
      }

      const updatedBasicData = {
        ...basicData,
        insuranceProviderId,
      };

      const policyStore = usePolicyStore.getState();
      policyStore.setBasicData(updatedBasicData);
      policyStore.setConfigurationData(configurationData);
      policyStore.setTagsData(tagsData);

      const validation = policyStore.validatePayload();
      if (!validation.isValid) {
        message.error(validation.errors.join(", "));
        return false;
      }

      const { payload, warnings } = await policyStore.buildBackendPayload();

      if (warnings && warnings.length > 0) {
        warnings.forEach((warning) => {
          message.warning(warning, 10);
        });
      }

      const response = await axiosInstance.post(
        endpoints.policy.base_policy.create_complete(24),
        payload
      );

      if (response.data.success) {
        message.success("Base Policy đã được tạo thành công!");

        // Reset store data but don't reset UI state yet to allow redirect to complete
        policyStore.resetPolicyData();

        return true;
      } else {
        throw new Error(response.data.message || "Failed to create policy");
      }
    } catch (error) {
      // Log English error to console for debugging
      console.error("[handleCreatePolicy] Error:", error);

      // Show Vietnamese error to user
      let vietnameseError = "Có lỗi xảy ra khi tạo policy";

      if (error.response?.status === 401) {
        vietnameseError = getErrorMessage("SESSION_EXPIRED");
      } else if (error.response?.status === 403) {
        vietnameseError = getErrorMessage("FORBIDDEN");
      } else if (error.response?.status === 404) {
        vietnameseError = getErrorMessage("NOT_FOUND");
      } else if (error.response?.status === 413) {
        vietnameseError = getErrorMessage("REQUEST_TOO_LARGE");
      } else if (error.response?.status === 422) {
        vietnameseError = getErrorMessage("DATA_INVALID");
      } else if (error.response?.status >= 500) {
        vietnameseError = getErrorMessage("SERVER_ERROR");
      } else if (!error.response) {
        vietnameseError = getErrorMessage("NETWORK_ERROR");
      }

      message.error(vietnameseError);

      return false;
    } finally {
      setLoading(false);
    }
  }, [basicData, configurationData, tagsData, validateReviewTab, handleReset]);

  return {
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
    TABS,
    mockData,
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
    getAvailableDataSourcesForTrigger,
    validateBasicTab,
    validateConfigurationTab,
    validateReviewTab,
  };
};

export default useCreatePolicy;
