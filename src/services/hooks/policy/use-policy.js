import mockData from "@/app/(internal)/policy/mock..json";
import { message } from "antd";
import { useCallback, useMemo, useState } from "react";

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
    productName: "",
    productCode: "",
    insuranceProviderId: "",
    cropType: "",
    premiumBaseRate: 0,
    coverageDurationDays: 0,
    selectedDataSources: [], // Array of selected data sources
  });

  const [configurationData, setConfigurationData] = useState({
    logicalOperator: "AND",
    payoutPercentage: 100,
    conditions: [], // Array of trigger conditions
  });

  const [tagsData, setTagsData] = useState({
    tags: [], // Array of key-value pairs with data types
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

  // Tính toán chi phí ước tính theo thời gian thực
  const estimatedCosts = useMemo(() => {
    let monthlyDataCost = 0;
    let dataComplexityScore = 0;

    // Tính chi phí dữ liệu
    basicData.selectedDataSources.forEach((source) => {
      const category = mockData.dataTierCategories.find(
        (cat) => cat.value === source.category
      );
      const tier = mockData.dataTiers.find((t) => t.value === source.tier);

      if (category && tier) {
        const cost =
          source.baseCost * category.categoryMultiplier * tier.tierMultiplier;
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
  }, [basicData.selectedDataSources, basicData.premiumBaseRate]);

  // Validate basic tab
  const validateBasicTab = useCallback(() => {
    const required = [
      "productName",
      "productCode",
      "insuranceProviderId",
      "cropType",
    ];
    const isValid =
      required.every((field) => basicData[field]) &&
      basicData.premiumBaseRate > 0 &&
      basicData.coverageDurationDays > 0 &&
      basicData.selectedDataSources.length > 0;

    setValidationStatus((prev) => ({ ...prev, basic: isValid }));
    return isValid;
  }, [basicData]);

  // Validate configuration tab
  const validateConfigurationTab = useCallback(() => {
    const isValid =
      configurationData.conditions.length > 0 &&
      configurationData.conditions.every(
        (condition) =>
          condition.dataSourceId &&
          condition.aggregationFunction &&
          condition.thresholdOperator &&
          condition.thresholdValue !== undefined &&
          condition.aggregationWindowDays > 0
      );

    setValidationStatus((prev) => ({ ...prev, configuration: isValid }));
    return isValid;
  }, [configurationData]);

  // Validate review tab
  const validateReviewTab = useCallback(() => {
    const isValid = validationStatus.basic && validationStatus.configuration;
    setValidationStatus((prev) => ({ ...prev, review: isValid }));
    return isValid;
  }, [validationStatus.basic, validationStatus.configuration]);

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
          id: `${dataSource.category}_${dataSource.tier}_${
            dataSource.parameterName
          }_${Date.now()}`,
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
    setConfigurationData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          ...condition,
          id: `condition_${Date.now()}`,
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
      conditions: prev.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...updates } : condition
      ),
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
    }));
  }, [basicData.selectedDataSources]);

  // Handle create policy
  const handleCreatePolicy = useCallback(async () => {
    if (!validateReviewTab()) {
      message.error("Vui lòng hoàn thành tất cả thông tin bắt buộc");
      return false;
    }

    setLoading(true);
    try {
      // Simulate API call
      const policyData = {
        ...basicData,
        ...configurationData,
        ...tagsData,
        estimatedCosts,
        status: "draft",
        createdAt: new Date().toISOString(),
      };

      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      message.success("Policy đã được tạo thành công!");
      console.log("Policy created:", policyData);

      return true;
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo policy");
      console.error("Error creating policy:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    basicData,
    configurationData,
    tagsData,
    estimatedCosts,
    validateReviewTab,
  ]);

  // Reset form
  const handleReset = useCallback(() => {
    setBasicData({
      productName: "",
      productCode: "",
      insuranceProviderId: "",
      cropType: "",
      premiumBaseRate: 0,
      coverageDurationDays: 0,
      selectedDataSources: [],
    });
    setConfigurationData({
      logicalOperator: "AND",
      payoutPercentage: 100,
      conditions: [],
    });
    setTagsData({ tags: [] });
    setCurrentTab(TABS.BASIC);
    setValidationStatus({
      basic: false,
      configuration: false,
      tags: true,
      review: false,
    });
  }, []);

  return {
    // State
    currentTab,
    basicData,
    configurationData,
    tagsData,
    validationStatus,
    loading,
    estimatedCosts,

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

    // Utilities
    getAvailableDataSources,
    getAvailableDataSourcesForTrigger,
    validateBasicTab,
    validateConfigurationTab,
    validateReviewTab,
  };
};

export default usePolicy;
