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
    //  Product Info (REQUIRED)
    productName: "",
    productCode: "",
    productDescription: "",
    insuranceProviderId: "",
    cropType: "",
    coverageCurrency: "VND",
    coverageDurationDays: 120,

    //  Premium Config (REQUIRED)
    isPerHectare: true,
    premiumBaseRate: 0,
    fixPremiumAmount: null,
    maxPremiumPaymentProlong: null,
    cancelPremiumRate: null,

    //  Payout Config (moved from ConfigurationTab - per BE spec)
    isPayoutPerHectare: true,
    payoutBaseRate: 0.75,
    fixPayoutAmount: null,
    payoutCap: null,
    overThresholdMultiplier: 1.0,

    //  Enrollment & Validity Dates
    enrollmentStartDay: null,
    enrollmentEndDay: null,
    insuranceValidFrom: null,
    insuranceValidTo: null,

    //  Renewal Config
    autoRenewal: false,
    renewalDiscountRate: 0,
    basePolicyInvalidDate: null,

    //  Status & Document (auto fields)
    status: "draft",
    templateDocumentUrl: null,
    documentValidationStatus: "pending",
    importantAdditionalInformation: "",

    //  Data Sources Table
    selectedDataSources: [], // Array of selected data sources
  });

  const [configurationData, setConfigurationData] = useState({
    //  Trigger Config (REQUIRED)
    logicalOperator: "AND",
    monitorInterval: 1,
    monitorFrequencyUnit: "day",

    //  Optional Trigger Fields
    growthStage: "",
    blackoutPeriods: {}, //  Object, not array - per BE spec

    //  Conditions Table (REQUIRED at least 1)
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

  // State cho policies list
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState(null);

  // State cho active policies list
  const [activePolicies, setActivePolicies] = useState([]);
  const [activePoliciesLoading, setActivePoliciesLoading] = useState(false);
  const [activePoliciesError, setActivePoliciesError] = useState(null);

  // State cho policy counts
  const [policyCounts, setPolicyCounts] = useState({
    total: 0,
    draft: 0,
    active: 0,
    archived: 0,
  });
  const [policyCountsLoading, setPolicyCountsLoading] = useState(false);
  const [policyCountsError, setPolicyCountsError] = useState(null);

  // State cho policy detail
  const [policyDetail, setPolicyDetail] = useState(null);
  const [policyDetailLoading, setPolicyDetailLoading] = useState(false);
  const [policyDetailError, setPolicyDetailError] = useState(null);

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
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.tier.get_by_category(categoryId)
      );

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
      const response = await axiosInstance.get(
        endpoints.policy.data_tier.tier.get_data_sources(tierId)
      );

      if (response.data.success) {
        // Transform API response to match expected format
        const transformedDataSources = response.data.data.map((source) => ({
          id:
            source.id ||
            source.data_source_id ||
            `${source.data_source}_${source.parameter_name}`, //  Use real UUID from API first
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
      const errorMessage =
        error.response?.data?.message || "Failed to fetch data sources";
      setDataSourcesError(errorMessage);
      message.error(`Lỗi khi tải nguồn dữ liệu: ${errorMessage}`);
      setDataSources([]);
    } finally {
      setDataSourcesLoading(false);
    }
  }, []);

  // Fetch policies by provider
  const fetchPoliciesByProvider = useCallback(async (providerId) => {
    if (!providerId) {
      return;
    }

    setPoliciesLoading(true);
    setPoliciesError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.policy.base_policy.get_draft_by_provider(providerId, false),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data?.policies) {
        const draftPoliciesData = response.data.data.policies;

        // Filter by user_id from /me as fallback if BE filter doesn't work
        const meData = localStorage.getItem("me");
        if (meData) {
          try {
            const userData = JSON.parse(meData);
            const userId = userData?.user_id;

            if (userId) {
              // Filter policies to only show ones belonging to current user
              const filteredPolicies = draftPoliciesData.filter(
                (policy) => policy.base_policy?.insurance_provider_id === userId
              );

              setPolicies(filteredPolicies);
            } else {
              // No user_id found, use all policies
              setPolicies(draftPoliciesData);
            }
          } catch (error) {
            // On error, use all policies
            setPolicies(draftPoliciesData);
          }
        } else {
          // No /me data, use all policies
          setPolicies(draftPoliciesData);
        }
      } else {
        setPolicies([]);
      }
    } catch (error) {
      setPoliciesError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch policies"
      );
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  // Fetch policies - Automatically get user_id from localStorage
  const fetchPolicies = useCallback(() => {
    const meData = localStorage.getItem("me");
    if (meData) {
      try {
        const userData = JSON.parse(meData);
        // Use user_id for draft policies (fallback to partner_id if user_id not available)
        const userId = userData?.user_id || userData?.partner_id;
        if (userId) {
          fetchPoliciesByProvider(userId);
        } else {
          setPoliciesError("User ID not found in user data");
        }
      } catch (error) {
        setPoliciesError("Failed to parse user data");
      }
    } else {
      setPoliciesError("User data not found");
    }
  }, [fetchPoliciesByProvider]);

  // Fetch active policies by provider
  const fetchActivePoliciesByProvider = useCallback(async (providerId) => {
    if (!providerId) {
      return;
    }

    setActivePoliciesLoading(true);
    setActivePoliciesError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.policy.base_policy.get_active(providerId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Active policies API returns array directly under data, not data.policies
      if (response.data?.success && response.data?.data) {
        const activePoliciesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        // Filter by user_id from /me as fallback if BE filter doesn't work
        const meData = localStorage.getItem("me");
        if (meData) {
          try {
            const userData = JSON.parse(meData);
            const userId = userData?.user_id;

            if (userId) {
              // Filter policies to only show ones belonging to current user
              const filteredPolicies = activePoliciesData.filter(
                (policy) => policy.insurance_provider_id === userId
              );

              // Transform to match expected format with base_policy wrapper
              const transformedPolicies = filteredPolicies.map((policy) => ({
                base_policy: policy,
              }));

              setActivePolicies(transformedPolicies);
            } else {
              // No user_id found, use all policies
              const transformedPolicies = activePoliciesData.map((policy) => ({
                base_policy: policy,
              }));
              setActivePolicies(transformedPolicies);
            }
          } catch (error) {
            // On error, use all policies
            const transformedPolicies = activePoliciesData.map((policy) => ({
              base_policy: policy,
            }));
            setActivePolicies(transformedPolicies);
          }
        } else {
          // No /me data, use all policies
          const transformedPolicies = activePoliciesData.map((policy) => ({
            base_policy: policy,
          }));
          setActivePolicies(transformedPolicies);
        }
      } else {
        setActivePolicies([]);
      }
    } catch (error) {
      setActivePoliciesError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch active policies"
      );
      setActivePolicies([]);
    } finally {
      setActivePoliciesLoading(false);
    }
  }, []);

  // Fetch active policies - Automatically get user_id from localStorage
  const fetchActivePolicies = useCallback(() => {
    const meData = localStorage.getItem("me");
    if (meData) {
      try {
        const userData = JSON.parse(meData);
        // Use user_id for active policies instead of partner_id
        const userId = userData?.user_id;
        if (userId) {
          fetchActivePoliciesByProvider(userId);
        } else {
          setActivePoliciesError("User ID not found in user data");
        }
      } catch (error) {
        setActivePoliciesError("Failed to parse user data");
      }
    } else {
      setActivePoliciesError("User data not found");
    }
  }, [fetchActivePoliciesByProvider]);

  // Fetch policy counts
  const fetchPolicyCounts = useCallback(async () => {
    setPolicyCountsLoading(true);
    setPolicyCountsError(null);

    const token = localStorage.getItem("token");

    try {
      // Fetch all counts in parallel
      const [totalResponse, draftResponse, activeResponse, archivedResponse] =
        await Promise.all([
          axiosInstance.get(endpoints.policy.base_policy.get_count, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get(
            endpoints.policy.base_policy.get_count_by_status("draft"),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axiosInstance.get(
            endpoints.policy.base_policy.get_count_by_status("active"),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axiosInstance.get(
            endpoints.policy.base_policy.get_count_by_status("archived"),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

      setPolicyCounts({
        total: totalResponse.data?.data?.total_count || 0,
        draft: draftResponse.data?.data?.count || 0,
        active: activeResponse.data?.data?.count || 0,
        archived: archivedResponse.data?.data?.count || 0,
      });
    } catch (error) {
      setPolicyCountsError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch policy counts"
      );
    } finally {
      setPolicyCountsLoading(false);
    }
  }, []);

  // Fetch policy detail by provider and policy ID
  const fetchPolicyDetailByProvider = useCallback(
    async (providerId, basePolicyId) => {
      if (!providerId || !basePolicyId) {
        return null;
      }

      setPolicyDetailLoading(true);
      setPolicyDetailError(null);

      const token = localStorage.getItem("token");

      try {
        const response = await axiosInstance.get(
          endpoints.policy.base_policy.get_draft_detail(
            providerId,
            basePolicyId,
            false
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.data?.success &&
          response.data?.data?.policies &&
          response.data.data.policies.length > 0
        ) {
          const policyData = response.data.data.policies[0];

          // Security fallback: Verify policy belongs to current user
          const meData = localStorage.getItem("me");
          if (meData) {
            try {
              const userData = JSON.parse(meData);
              const userId = userData?.user_id;

              if (userId) {
                const policyProviderId =
                  policyData.base_policy?.insurance_provider_id;

                // Check if policy belongs to the current user
                if (policyProviderId !== userId) {
                  setPolicyDetail(null);
                  setPolicyDetailError(
                    "You do not have permission to access this policy"
                  );
                  return null;
                }
              }
            } catch (error) {
              // Continue even if security check fails (but log it)
            }
          }

          setPolicyDetail(policyData);
          return policyData;
        } else {
          setPolicyDetail(null);
          setPolicyDetailError("Policy not found");
          return null;
        }
      } catch (error) {
        setPolicyDetailError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch policy detail"
        );
        setPolicyDetail(null);
        return null;
      } finally {
        setPolicyDetailLoading(false);
      }
    },
    []
  );

  // Fetch policy detail - Automatically get partner_id from localStorage
  const fetchPolicyDetail = useCallback(
    async (basePolicyId) => {
      const meData = localStorage.getItem("me");
      if (meData) {
        try {
          const userData = JSON.parse(meData);
          const providerId = userData?.partner_id;
          if (providerId) {
            return await fetchPolicyDetailByProvider(providerId, basePolicyId);
          } else {
            setPolicyDetailError("Partner ID not found in user data");
            return null;
          }
        } catch (error) {
          setPolicyDetailError("Failed to parse user data");
          return null;
        }
      } else {
        setPolicyDetailError("User data not found");
        return null;
      }
    },
    [fetchPolicyDetailByProvider]
  );

  // Fetch active policy detail by ID (for active policies)
  const fetchActivePolicyDetail = useCallback(
    async (basePolicyId, includePdf = true) => {
      if (!basePolicyId) {
        return null;
      }

      setPolicyDetailLoading(true);
      setPolicyDetailError(null);

      const token = localStorage.getItem("token");

      try {
        const response = await axiosInstance.get(
          endpoints.policy.base_policy.get_active_detail(
            basePolicyId,
            includePdf
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success && response.data?.data) {
          const policyData = response.data.data;

          // Security fallback: Verify policy belongs to current user
          const meData = localStorage.getItem("me");
          if (meData) {
            try {
              const userData = JSON.parse(meData);
              const userId = userData?.user_id;

              if (userId) {
                const policyProviderId =
                  policyData.base_policy?.insurance_provider_id;

                // Check if policy belongs to the current user
                if (policyProviderId !== userId) {
                  setPolicyDetail(null);
                  setPolicyDetailError(
                    "You do not have permission to access this policy"
                  );
                  return null;
                }
              }
            } catch (error) {
              // Continue even if security check fails (but log it)
            }
          }

          // Transform the new API response format to match the old format
          // The new format has triggers as an array, we need to adapt it
          const transformedData = {
            base_policy: policyData.base_policy,
            trigger: policyData.triggers?.[0] || null, // Take first trigger
            conditions: policyData.triggers?.[0]?.conditions || [],
            document: policyData.document,
            metadata: policyData.metadata,
          };

          setPolicyDetail(transformedData);
          return transformedData;
        } else {
          setPolicyDetail(null);
          setPolicyDetailError("Active policy not found");
          return null;
        }
      } catch (error) {
        setPolicyDetailError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch active policy detail"
        );
        setPolicyDetail(null);
        return null;
      } finally {
        setPolicyDetailLoading(false);
      }
    },
    []
  );

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch policies on mount
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Fetch active policies on mount
  useEffect(() => {
    fetchActivePolicies();
  }, [fetchActivePolicies]);

  // Fetch policy counts on mount
  useEffect(() => {
    fetchPolicyCounts();
  }, [fetchPolicyCounts]);

  //  AUTO-VALIDATE: Run validation whenever data changes
  // This ensures validationStatus is always up-to-date

  // Validate basic tab - Only check REQUIRED fields per BE spec
  const validateBasicTab = useCallback(() => {
    //  REQUIRED fields per BE spec
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

    //  Check table: selectedDataSources must have at least 1 item
    const hasDataSources =
      basicData.selectedDataSources && basicData.selectedDataSources.length > 0;

    const isValid = allRequiredFilled && hasDataSources;

    setValidationStatus((prev) => ({ ...prev, basic: isValid }));
    return isValid;
  }, [basicData]);

  // Validate configuration tab - Only check REQUIRED fields per BE spec
  const validateConfigurationTab = useCallback(() => {
    //  REQUIRED trigger fields per BE spec
    const requiredTriggerFields = [
      "logicalOperator",
      "monitorInterval",
      "monitorFrequencyUnit",
    ];

    const allTriggerFieldsFilled = requiredTriggerFields.every((field) => {
      const value = configurationData[field];
      return value !== undefined && value !== null && value !== "";
    });

    //  Check table: conditions must have at least 1 item
    const hasConditions =
      configurationData.conditions && configurationData.conditions.length > 0;

    //  Each condition must have REQUIRED fields
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
          //  KEEP original UUID from API - DO NOT override!
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
    //  Support both object and function updater
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

  // Handle add tag
  const handleAddTag = useCallback((tag) => {
    setTagsData((prev) => {
      const newTags = [
        ...prev.tags,
        {
          ...tag,
          //  Preserve tag ID if already exists (from PlaceholderMappingPanel)
          // Only generate new ID if tag doesn't have one
          id: tag.id || `tag_${Date.now()}`,
        },
      ];

      return {
        ...prev,
        tags: newTags,
      };
    });
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
      //  Product Info (REQUIRED)
      productName: "",
      productCode: "",
      productDescription: "",
      insuranceProviderId: "",
      cropType: "",
      coverageCurrency: "VND",
      coverageDurationDays: 120,

      //  Premium Config (REQUIRED)
      isPerHectare: true,
      premiumBaseRate: 0,
      fixPremiumAmount: null,
      maxPremiumPaymentProlong: null,
      cancelPremiumRate: null,

      //  Payout Config (moved from ConfigurationTab - per BE spec)
      isPayoutPerHectare: true,
      payoutBaseRate: 0.75,
      fixPayoutAmount: null,
      payoutCap: null,
      overThresholdMultiplier: 1.0,

      //  Enrollment & Validity Dates
      enrollmentStartDay: null,
      enrollmentEndDay: null,
      insuranceValidFrom: null,
      insuranceValidTo: null,

      //  Renewal Config
      autoRenewal: false,
      renewalDiscountRate: 0,
      basePolicyInvalidDate: null,

      //  Status & Document (auto fields)
      status: "draft",
      templateDocumentUrl: null,
      documentValidationStatus: "pending",
      importantAdditionalInformation: "",

      //  Data Sources Table
      selectedDataSources: [],
    });
    setConfigurationData({
      //  Trigger Config (REQUIRED)
      logicalOperator: "AND",
      monitorInterval: 1,
      monitorFrequencyUnit: "day",

      //  Optional Trigger Fields
      growthStage: "",
      blackoutPeriods: [],

      //  Conditions Table (REQUIRED at least 1)
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
        // Try to get user_id from localStorage /me response
        try {
          const meData = localStorage.getItem("me");
          if (meData) {
            const parsed = JSON.parse(meData);
            insuranceProviderId = parsed.user_id || "temp_id";
          }
        } catch (e) {}

        // Final fallback to hardcoded user_id
        if (!insuranceProviderId) {
          insuranceProviderId = "temp_id";
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
        return false;
      }

      // Build backend payload
      const { payload, warnings } = await policyStore.buildBackendPayload();

      // Show warnings to user
      if (warnings && warnings.length > 0) {
        warnings.forEach((warning) => {
          message.warning(warning, 10); // Show for 10 seconds
        });
      }

      // Call API with application/json Content-Type (matching Postman CURL)
      const response = await axiosInstance.post(
        endpoints.policy.base_policy.create_complete(24),
        payload //  Send object directly, axios will stringify and set Content-Type: application/json
      );

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
    policies,
    policiesLoading,
    policiesError,
    activePolicies,
    activePoliciesLoading,
    activePoliciesError,
    policyCounts,
    policyCountsLoading,
    policyCountsError,
    policyDetail,
    policyDetailLoading,
    policyDetailError,

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
    fetchPoliciesByProvider,
    fetchPolicies,
    fetchActivePoliciesByProvider,
    fetchActivePolicies,
    fetchPolicyCounts,
    fetchPolicyDetailByProvider,
    fetchPolicyDetail,
    fetchActivePolicyDetail,

    // Utilities
    getAvailableDataSources,
    getAvailableDataSourcesForTrigger,
    validateBasicTab,
    validateConfigurationTab,
    validateReviewTab,
  };
};

export default usePolicy;
