import basePolicySchema from "@/schemas/base-policy/base-policy-schema";
import conditionSchema from "@/schemas/base-policy/condition-schema";
import triggerSchema from "@/schemas/base-policy/trigger-schema";
import { create } from "zustand";

/**
 * Policy Store - Quản lý state toàn cục cho việc tạo Base Policy
 */

// ====================== HELPER UTILITIES ======================

/**
 * Convert camelCase/snake_case object keys to snake_case recursively
 */
export const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item));
  }

  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {});
  }

  return obj;
};

/**
 * Convert Date object to Unix epoch seconds (UTC midnight)
 *
 * This function converts a Date object to Unix timestamp (seconds since 1970-01-01 00:00:00 UTC).
 * It normalizes the date to UTC midnight to avoid timezone issues.
 *
 * Example:
 * - Input: Date("2024-01-01") in Vietnam timezone (GMT+7)
 * - Output: 1704067200 (2024-01-01 00:00:00 UTC)
 *
 * @param {Date|number|string} date - Date to convert
 * @returns {number|null} Unix timestamp in seconds (UTC), or null if invalid
 */
export const dateToEpochSeconds = (date) => {
  if (!date) return null;

  // If already a number, assume it's epoch seconds
  if (typeof date === "number") return date;

  let dateObj;

  // Convert to Date object if needed
  if (date instanceof Date) {
    dateObj = date;
  } else {
    // Try parsing string
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
  }

  // Convert to UTC midnight to avoid timezone offset issues
  // Extract year, month, day from local timezone, then create UTC date
  const utcDate = new Date(
    Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      0,
      0,
      0,
      0
    )
  );

  return Math.floor(utcDate.getTime() / 1000);
};

/**
 * UI: 'hours' | 'days' | 'weeks' | 'months' | 'years'
 */
export const mapFrequencyUnit = (uiUnit) => {
  const mapping = {
    hours: "hour",
    days: "day",
    weeks: "week",
    months: "month",
    years: "year",
    hour: "hour",
    day: "day",
    week: "week",
    month: "month",
    year: "year",
  };
  return mapping[uiUnit] || "day";
};

/**
 * Return Vietnamese label for frequency unit (BE format)
 */
export const getFrequencyUnitLabel = (unit) => {
  const labels = {
    hour: "giờ",
    day: "ngày",
    week: "tuần",
    month: "tháng",
    year: "năm",
  };
  return labels[unit] || unit;
};

/**
 * Convert File/Uint8Array/ArrayBuffer to base64 string
 */
export const bytesToBase64 = async (input) => {
  if (!input) return null;

  // If it's a File object
  if (input instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  }

  // If it's Uint8Array or ArrayBuffer
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // If already a string, assume it's base64
  if (typeof input === "string") {
    return input;
  }

  return null;
};

/**
 * Calculate condition cost: base_cost * category_multiplier * tier_multiplier
 * Returns integer VND
 */
export const calculateConditionCost = (
  baseCost,
  categoryMultiplier,
  tierMultiplier
) => {
  if (!baseCost || !categoryMultiplier || !tierMultiplier) return 0;
  return Math.round(baseCost * categoryMultiplier * tierMultiplier);
};

// ====================== INITIAL STATE ======================

const initialBasicData = {
  //  Product Info (REQUIRED)
  productName: "",
  productCode: "",
  productDescription: "",
  insuranceProviderId: "", // Auto-filled from auth-store
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
  insuranceValidFrom: null, // Date object, will be converted to epoch
  insuranceValidTo: null, // Date object, will be converted to epoch

  //  Renewal Config
  autoRenewal: false,
  renewalDiscountRate: 0,
  basePolicyInvalidDate: null,

  //  Status & Document (auto fields)
  status: "draft", // draft | active | archived
  templateDocumentUrl: null,
  documentValidationStatus: "pending", // pending | passed | passed_ai | failed | warning
  importantAdditionalInformation: "",

  //  Data Sources Table
  selectedDataSources: [], // { id, label, baseCost, category, tier, categoryMultiplier, tierMultiplier, parameterName, unit }
};

const initialConfigurationData = {
  //  Trigger Config (REQUIRED)
  logicalOperator: "AND", // AND | OR
  monitorInterval: 1,
  monitorFrequencyUnit: "day", // hour | day | week | month | year

  //  Optional Trigger Fields
  growthStage: "",
  blackoutPeriods: { periods: [] }, //  { periods: [{start: 'MM-DD', end: 'MM-DD'}] }

  //  Conditions Table (REQUIRED at least 1)
  conditions: [], // Array of condition objects
};

const initialTagsData = {
  tags: [], // { id, key, value, dataType }
  uploadedFile: null, // File object
  modifiedPdfBytes: null, // Uint8Array after replacements
  documentTagsObject: {}, // Final tags for BE: { "key": "dataType" }
  placeholders: [], // ✅ Placeholders for auto-conversion
  mappings: {}, // ✅ Mappings { placeholderId: tagId } for auto-conversion
};

// ====================== ZUSTAND STORE ======================

export const usePolicyStore = create((set, get) => ({
  // State
  basicData: initialBasicData,
  configurationData: initialConfigurationData,
  tagsData: initialTagsData,

  // Actions
  setBasicData: (data) => set({ basicData: { ...get().basicData, ...data } }),
  setConfigurationData: (data) =>
    set({ configurationData: { ...get().configurationData, ...data } }),
  setTagsData: (data) => set({ tagsData: { ...get().tagsData, ...data } }),

  resetPolicyData: () =>
    set({
      basicData: initialBasicData,
      configurationData: initialConfigurationData,
      tagsData: initialTagsData,
    }),

  // ====================== BUILD BACKEND PAYLOAD ======================
  /**
   * Chuyển đổi frontend state sang BE payload format
   * Theo spec: BE_create_base_policy_json_spec_vi.md
   *
   * @returns {Promise<{payload: Object, warnings: string[]}>} - Payload và warnings
   */
  buildBackendPayload: async () => {
    const { basicData, configurationData, tagsData } = get();
    const warnings = []; // Collect warnings to show user

    // ✅ Monitor Frequency Cost Multipliers
    const MONITOR_FREQUENCY_COST = {
      hour: 2.0,
      day: 1.5,
      week: 1.0,
      month: 0.8,
      year: 0.5,
    };

    // Calculate monitor frequency cost multiplier
    const monitorFrequencyMultiplier =
      MONITOR_FREQUENCY_COST[configurationData.monitorFrequencyUnit] ||
      MONITOR_FREQUENCY_COST.day;
    const monitorFrequencyCost =
      (configurationData.monitorInterval || 1) * monitorFrequencyMultiplier;

    console.log("📊 Monitor Frequency Cost:", {
      monitorInterval: configurationData.monitorInterval,
      monitorFrequencyUnit: configurationData.monitorFrequencyUnit,
      monitorFrequencyMultiplier,
      monitorFrequencyCost,
    });

    // Build document_tags object (will be included in base_policy)
    // ✅ CRITICAL: Validate and sanitize documentTagsObject to ensure only "key": "dataType" format
    const rawDocumentTags = tagsData.documentTagsObject || {};
    const document_tags = {};

    Object.entries(rawDocumentTags).forEach(([key, value]) => {
      // If value is an object (wrong format), extract dataType
      if (typeof value === "object" && value !== null) {
        console.warn(
          `⚠️ Fixing invalid document_tags format for "${key}":`,
          value
        );
        document_tags[key] = value.dataType || "string";
      } else if (typeof value === "string") {
        // Correct format - already a string
        document_tags[key] = value;
      } else {
        console.warn(
          `⚠️ Skipping invalid document_tags value for "${key}":`,
          value
        );
      }
    });

    // Build base_policy object
    const base_policy = {
      //  Provider & Product Info
      insurance_provider_id: basicData.insuranceProviderId, // Must be partner_id, validated before calling this
      product_name: basicData.productName,
      product_code: basicData.productCode,
      product_description: basicData.productDescription || "",
      crop_type: basicData.cropType || "",

      //  Coverage Config
      coverage_currency: basicData.coverageCurrency,
      coverage_duration_days: basicData.coverageDurationDays,

      //  Premium Config
      fix_premium_amount: basicData.fixPremiumAmount || null,
      is_per_hectare: basicData.isPerHectare,
      premium_base_rate: basicData.premiumBaseRate,
      max_premium_payment_prolong: basicData.maxPremiumPaymentProlong || null,

      //  Payout Config (NOW from basicData - per BE spec)
      fix_payout_amount: basicData.fixPayoutAmount || null,
      is_payout_per_hectare: basicData.isPayoutPerHectare,
      over_threshold_multiplier: basicData.overThresholdMultiplier,
      payout_base_rate: basicData.payoutBaseRate,
      payout_cap: basicData.payoutCap || null,

      //  Cancellation & Enrollment
      cancel_premium_rate: basicData.cancelPremiumRate || null,
      enrollment_start_day: dateToEpochSeconds(basicData.enrollmentStartDay),
      enrollment_end_day: dateToEpochSeconds(basicData.enrollmentEndDay),

      //  Renewal Config
      auto_renewal: basicData.autoRenewal,
      renewal_discount_rate: basicData.renewalDiscountRate,
      base_policy_invalid_date: basicData.basePolicyInvalidDate
        ? dateToEpochSeconds(basicData.basePolicyInvalidDate)
        : null, //  Return null if empty (matching Postman)

      //  Insurance Validity Dates (REQUIRED)
      insurance_valid_from_day: dateToEpochSeconds(
        basicData.insuranceValidFrom
      ),
      insurance_valid_to_day: dateToEpochSeconds(basicData.insuranceValidTo),

      //  Status & Document
      status: basicData.status,
      template_document_url: basicData.templateDocumentUrl || null,
      document_validation_status: basicData.documentValidationStatus,
      document_tags: document_tags,
      important_additional_information:
        basicData.importantAdditionalInformation || "",
    };

    // Build trigger object
    const trigger = {
      logical_operator: configurationData.logicalOperator,
      growth_stage: configurationData.growthStage || "",
      monitor_interval: configurationData.monitorInterval,
      monitor_frequency_unit: mapFrequencyUnit(
        configurationData.monitorFrequencyUnit
      ),
      //  Blackout periods: {periods: [{start: 'MM-DD', end: 'MM-DD'}]}
      blackout_periods: (() => {
        const bp = configurationData.blackoutPeriods;
        if (!bp || !bp.periods || bp.periods.length === 0) {
          return { periods: [] }; //  Return empty periods array
        }
        // Validate and format periods
        const validPeriods = bp.periods
          .filter((p) => p.start && p.end)
          .map((p) => ({
            start: p.start, // MM-DD format
            end: p.end, // MM-DD format
          }));
        return { periods: validPeriods };
      })(),
    };

    // Build conditions array
    const conditions = configurationData.conditions.map((condition) => {
      // Compute base calculated cost: base_cost × tier_multiplier × category_multiplier
      const baseCalculatedCost =
        condition.calculatedCost ||
        calculateConditionCost(
          condition.baseCost,
          condition.categoryMultiplier,
          condition.tierMultiplier
        );

      // ✅ Backend formula: calculated_cost = (base × tier × category) + (interval × frequency)
      // This matches backend validation at base_policy_service.go:360-392
      const monitorFrequencyCostAddition =
        configurationData.monitorInterval * monitorFrequencyMultiplier;
      const calculatedCost = Math.round(
        baseCalculatedCost + monitorFrequencyCostAddition
      );

      console.log("💰 Condition cost calculation:", {
        basePart: baseCalculatedCost,
        monitorInterval: configurationData.monitorInterval,
        monitorFrequencyMultiplier,
        frequencyPart: monitorFrequencyCostAddition,
        calculatedCost,
      });

      //  Build condition object, include REQUIRED and OPTIONAL fields with defaults
      const mappedCondition = {
        // REQUIRED fields
        data_source_id: condition.dataSourceId,
        threshold_operator: condition.thresholdOperator,
        threshold_value: condition.thresholdValue,
        aggregation_function: condition.aggregationFunction,
        aggregation_window_days: condition.aggregationWindowDays,
        consecutive_required: condition.consecutiveRequired ?? false,
        include_component: condition.includeComponent ?? false,
        base_cost: condition.baseCost || 0,
        category_multiplier: condition.categoryMultiplier || 1,
        tier_multiplier: condition.tierMultiplier || 1,
        calculated_cost: calculatedCost,

        // OPTIONAL fields with conditional defaults
        early_warning_threshold: condition.earlyWarningThreshold || 60.0,
        // Baseline fields: only include if threshold_operator is change_gt or change_lt
        baseline_window_days:
          condition.thresholdOperator === "change_gt" ||
          condition.thresholdOperator === "change_lt"
            ? condition.baselineWindowDays || null
            : null,
        baseline_function:
          condition.thresholdOperator === "change_gt" ||
          condition.thresholdOperator === "change_lt"
            ? condition.baselineFunction || null
            : null,
        validation_window_days: condition.validationWindowDays || 3,
        condition_order: condition.conditionOrder || 1,
        data_quality: condition.dataQuality || "good", // good | acceptable | poor
      };

      console.log("🔍 Mapped condition:", mappedCondition);
      return mappedCondition;
    });

    // Build policy_document object (convert file to base64)
    let policy_document;
    if (tagsData.modifiedPdfBytes || tagsData.uploadedFile) {
      const fileToConvert = tagsData.modifiedPdfBytes || tagsData.uploadedFile;

      //  Check file size (warn if > 5MB)
      const fileSizeBytes = fileToConvert.size || fileToConvert.byteLength || 0;
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
      console.log(`📄 Policy document size: ${fileSizeMB} MB`);

      const base64Data = await bytesToBase64(fileToConvert);

      //  Check base64 string size
      const base64SizeBytes = base64Data ? base64Data.length : 0;
      const base64SizeMB = (base64SizeBytes / (1024 * 1024)).toFixed(2);
      console.log(
        `📄 Base64 string size: ${base64SizeMB} MB (${base64SizeBytes.toLocaleString()} chars)`
      );

      // ⚠️ Check file size - warn if large but always send to meet BE requirements
      // Base64 increases size by ~33%, so 10MB base64 = ~7.5MB original
      const RECOMMENDED_BASE64_SIZE_MB = 10;

      const fileName =
        tagsData.uploadedFile?.name ||
        tagsData.modifiedPdfBytes?.name ||
        "policy_document.pdf";

      if (base64SizeBytes > RECOMMENDED_BASE64_SIZE_MB * 1024 * 1024) {
        const warningMsg = `PDF file lớn (${base64SizeMB} MB base64). Có thể gây lỗi 413 nếu server limit thấp. Hãy compress PDF trước khi upload để giảm size.`;
        console.warn(`⚠️ ${warningMsg}`);
        warnings.push(warningMsg);
      }

      //  Always send policy_document as required by BE
      policy_document = {
        name: fileName,
        data: base64Data,
      };
    }

    // Final payload (document_tags đã được add vào base_policy ở trên)
    //  Only include policy_document if file was uploaded
    const payload = {
      base_policy,
      trigger,
      conditions,
      ...(policy_document && { policy_document }), // Include only if defined
      is_archive: false,
    };

    //  Check total payload size
    const payloadStr = JSON.stringify(payload);
    const payloadSizeBytes = new Blob([payloadStr]).size;
    const payloadSizeMB = (payloadSizeBytes / (1024 * 1024)).toFixed(2);

    console.log("📦 Final Backend Payload size:", payloadSizeMB, "MB");
    if (policy_document) {
      const isMock =
        policy_document.data === "PLACEHOLDER_PDF_WILL_UPLOAD_LATER";
      console.log(
        "📄 Policy Document:",
        `${policy_document.name} ${
          isMock ? "(MOCK DATA - upload sau)" : "(included)"
        }`
      );
    } else {
      console.log("📄 Policy Document: null");
    }
    console.log("🏷️ Document Tags:", document_tags);
    console.log("🔍 Document Tags format validation:");
    Object.entries(document_tags).forEach(([key, value]) => {
      console.log(`  - "${key}": ${typeof value} = "${value}"`);
      if (typeof value !== "string") {
        console.error(
          `  ❌ INVALID FORMAT! Expected string, got ${typeof value}`
        );
      }
    });
    console.log("📋 Conditions count:", conditions.length);

    if (warnings.length > 0) {
      console.warn("⚠️ Warnings:", warnings);
    }

    return { payload, warnings };
  },

  // ====================== VALIDATION ======================
  /**
   * Validate payload before sending to BE using Zod schemas
   */
  validatePayload: () => {
    const { basicData, configurationData, tagsData } = get();
    const errors = [];

    //  Validate Basic Policy data using Zod schema
    const basicValidation = basePolicySchema.safeParse(basicData);
    if (!basicValidation.success) {
      basicValidation.error.issues.forEach((issue) => {
        errors.push(`${issue.message}`);
      });
    }

    //  Validate Trigger configuration using Zod schema
    const triggerValidation = triggerSchema.safeParse(configurationData);
    if (!triggerValidation.success) {
      triggerValidation.error.issues.forEach((issue) => {
        errors.push(`${issue.message}`);
      });
    }

    //  Validate each condition using Zod schema
    configurationData.conditions.forEach((condition, index) => {
      const conditionValidation = conditionSchema.safeParse(condition);
      if (!conditionValidation.success) {
        conditionValidation.error.issues.forEach((issue) => {
          errors.push(`${issue.message}`);
        });
      }
    });

    //  Check table: conditions must have at least 1 item
    if (
      !configurationData.conditions ||
      configurationData.conditions.length === 0
    ) {
      errors.push("At least one condition is required (conditions table)");
    }

    // Tags validation
    // If uploadedFile exists, should have documentTagsObject with mappings
    if (tagsData.uploadedFile) {
      const hasMappings =
        tagsData.documentTagsObject &&
        Object.keys(tagsData.documentTagsObject).length > 0;

      if (!hasMappings) {
        errors.push(
          "PDF template uploaded but no field mappings defined. Please map placeholders to data fields."
        );
      }

      // ⚠️ Warning (not error) if user hasn't clicked "Apply" button yet
      if (!tagsData.modifiedPdfBytes && hasMappings) {
        console.warn(
          "⚠️ User has mappings but hasn't applied to PDF yet. Recommend clicking 'Apply' button first."
        );
        warnings.push(
          "Bạn đã map các trường nhưng chưa bấm nút 'Áp dụng'. Hãy bấm 'Áp dụng' để tạo fillable PDF trước khi submit."
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
}));
