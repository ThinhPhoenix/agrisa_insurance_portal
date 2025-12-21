/**
 * useDictionary Hook
 *
 * Custom React hook for accessing dictionary labels in components
 * Provides convenient methods to get labels, notes, and translations
 */

import {
  createLabelGetter,
  getCommonTerm,
  getEnumLabel,
  getEnumOptions,
  getFieldInfo,
  getFieldLabel,
  getFieldNote,
  getOperatorLabel,
  getSection,
  UI_LABELS,
} from "@/libs/dictionary/dictionary-helper";
import { useMemo } from "react";

/**
 * Hook for base policy dictionary labels
 * @returns {object} Object with label getter functions for base policy
 */
export const useBasePolicyDictionary = () => {
  const labels = useMemo(() => {
    const getLabel = createLabelGetter("BasePolicy");
    const getStatusLabel = (status) => getEnumLabel("BasePolicyStatus", status);

    return {
      // Field labels
      productName: getLabel("product_name"),
      productCode: getLabel("product_code"),
      productDescription: getLabel("product_description"),
      cropType: getLabel("crop_type"),
      coverageCurrency: getLabel("coverage_currency"),
      coverageDurationDays: getLabel("coverage_duration_days"),
      fixPremiumAmount: getLabel("fix_premium_amount"),
      isPerHectare: getLabel("is_per_hectare"),
      premiumBaseRate: getLabel("premium_base_rate"),
      maxPremiumPaymentProlong: getLabel("max_premium_payment_prolong"),
      fixPayoutAmount: getLabel("fix_payout_amount"),
      isPayoutPerHectare: getLabel("is_payout_per_hectare"),
      overThresholdMultiplier: getLabel("over_threshold_multiplier"),
      payoutBaseRate: getLabel("payout_base_rate"),
      payoutCap: getLabel("payout_cap"),
      cancelPremiumRate: getLabel("cancel_premium_rate"),
      enrollmentStartDay: getLabel("enrollment_start_day"),
      enrollmentEndDay: getLabel("enrollment_end_day"),
      autoRenewal: getLabel("auto_renewal"),
      renewalDiscountRate: getLabel("renewal_discount_rate"),
      insuranceValidFromDay: getLabel("insurance_valid_from_day"),
      insuranceValidToDay: getLabel("insurance_valid_to_day"),
      templateDocumentUrl: getLabel("template_document_url"),
      documentValidationStatus: getLabel("document_validation_status"),
      documentTags: getLabel("document_tags"),
      importantAdditionalInformation: getLabel(
        "important_additional_information"
      ),
      status: getLabel("status"),
      createdAt: getLabel("created_at"),
      updatedAt: getLabel("updated_at"),
      createdBy: getLabel("created_by"),

      // Helper functions
      getLabel,
      getStatusLabel,
      getFieldNote: (field) => getFieldNote("BasePolicy", field),
      getFieldInfo: (field) => getFieldInfo("BasePolicy", field),
    };
  }, []);

  return labels;
};

/**
 * Hook for base policy trigger dictionary labels
 * @returns {object} Object with label getter functions for trigger
 */
export const useBasePolicyTriggerDictionary = () => {
  const labels = useMemo(() => {
    const getLabel = createLabelGetter("BasePolicyTrigger");

    return {
      logicalOperator: getLabel("logical_operator"),
      growthStage: getLabel("growth_stage"),
      monitorInterval: getLabel("monitor_interval"),
      monitorFrequencyUnit: getLabel("monitor_frequency_unit"),
      blackoutPeriods: getLabel("blackout_periods"),

      getLabel,
      getFieldNote: (field) => getFieldNote("BasePolicyTrigger", field),
    };
  }, []);

  return labels;
};

/**
 * Hook for base policy trigger condition dictionary labels
 * @returns {object} Object with label getter functions for trigger conditions
 */
export const useBasePolicyTriggerConditionDictionary = () => {
  const labels = useMemo(() => {
    const getLabel = createLabelGetter("BasePolicyTriggerCondition");

    return {
      dataSourceId: getLabel("data_source_id"),
      thresholdOperator: getLabel("threshold_operator"),
      thresholdValue: getLabel("threshold_value"),
      earlyWarningThreshold: getLabel("early_warning_threshold"),
      aggregationFunction: getLabel("aggregation_function"),
      aggregationWindowDays: getLabel("aggregation_window_days"),
      consecutiveRequired: getLabel("consecutive_required"),
      includeComponent: getLabel("include_component"),
      baselineWindowDays: getLabel("baseline_window_days"),
      baselineFunction: getLabel("baseline_function"),
      validationWindowDays: getLabel("validation_window_days"),
      conditionOrder: getLabel("condition_order"),
      baseCost: getLabel("base_cost"),
      categoryMultiplier: getLabel("category_multiplier"),
      tierMultiplier: getLabel("tier_multiplier"),
      calculatedCost: getLabel("calculated_cost"),

      getLabel,
      getFieldNote: (field) =>
        getFieldNote("BasePolicyTriggerCondition", field),
    };
  }, []);

  return labels;
};

/**
 * Hook for data source dictionary labels
 * @returns {object} Object with label getter functions for data sources
 */
export const useDataSourceDictionary = () => {
  const labels = useMemo(() => {
    const getLabel = createLabelGetter("DataSource");

    return {
      dataSource: getLabel("data_source"),
      parameterName: getLabel("parameter_name"),
      parameterType: getLabel("parameter_type"),
      unit: getLabel("unit"),
      displayNameVi: getLabel("display_name_vi"),
      descriptionVi: getLabel("description_vi"),
      updateFrequency: getLabel("update_frequency"),
      baseCost: getLabel("base_cost"),

      getLabel,
      getFieldNote: (field) => getFieldNote("DataSource", field),
    };
  }, []);

  return labels;
};

/**
 * Hook for operators and functions dictionary
 * @returns {object} Object with label getter functions for operators
 */
export const useOperatorsDictionary = () => {
  const labels = useMemo(
    () => ({
      // Threshold operators
      getThresholdOperatorLabel: (op) =>
        getOperatorLabel("ThresholdOperator", op),
      thresholdOperatorOptions: getEnumOptions("ThresholdOperator"),

      // Logical operators
      getLogicalOperatorLabel: (op) => getOperatorLabel("LogicalOperator", op),
      logicalOperatorOptions: getEnumOptions("LogicalOperator"),

      // Aggregation functions
      getAggregationFunctionLabel: (fn) =>
        getOperatorLabel("AggregationFunction", fn),
      aggregationFunctionOptions: getEnumOptions("AggregationFunction"),

      // Monitor frequency
      getMonitorFrequencyLabel: (freq) =>
        getEnumLabel("MonitorFrequency", freq),
      monitorFrequencyOptions: getEnumOptions("MonitorFrequency"),
    }),
    []
  );

  return labels;
};

/**
 * Main dictionary hook - combines all dictionary sections
 * @returns {object} Combined dictionary utilities
 */
const useDictionary = () => {
  const basePolicyLabels = useBasePolicyDictionary();
  const triggerLabels = useBasePolicyTriggerDictionary();
  const conditionLabels = useBasePolicyTriggerConditionDictionary();
  const dataSourceLabels = useDataSourceDictionary();
  const operatorLabels = useOperatorsDictionary();

  return useMemo(
    () => ({
      // Section-specific labels
      basePolicy: basePolicyLabels,
      trigger: triggerLabels,
      condition: conditionLabels,
      dataSource: dataSourceLabels,
      operators: operatorLabels,

      // General utilities
      getFieldLabel,
      getFieldNote,
      getFieldInfo,
      getSection,
      getEnumLabel,
      getEnumOptions,
      getCommonTerm,
      getOperatorLabel,

      // UI labels
      ui: UI_LABELS,

      // Common terms
      common: {
        premium: getCommonTerm("Premium"),
        payout: getCommonTerm("Payout"),
        coverage: getCommonTerm("Coverage"),
        underwriting: getCommonTerm("Underwriting"),
        policy: getCommonTerm("Policy"),
        trigger: getCommonTerm("Trigger"),
        threshold: getCommonTerm("Threshold"),
        enrollment: getCommonTerm("Enrollment"),
        evidence: getCommonTerm("Evidence"),
        claim: getCommonTerm("Claim"),
        dispute: getCommonTerm("Dispute"),
      },
    }),
    [
      basePolicyLabels,
      triggerLabels,
      conditionLabels,
      dataSourceLabels,
      operatorLabels,
    ]
  );
};

export default useDictionary;
