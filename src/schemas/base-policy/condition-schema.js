const { z } = require("zod");
const {
  getConditionValidation,
  getConditionError,
} = require("../../libs/message");

/**
 * Condition Schema - Validation cho điều kiện kích hoạt
 * Mapping theo base_policy_json_spec_vi.md
 */

// Enum cho Threshold Operator
const ThresholdOperator = z.enum(
  ["<", ">", "<=", ">=", "==", "!=", "change_gt", "change_lt"],
  {
    errorMap: () => ({
      message: getConditionError("INVALID_THRESHOLD_OPERATOR"),
    }),
  }
);

// Enum cho Aggregation Function
const AggregationFunction = z.enum(["sum", "avg", "min", "max", "change"], {
  errorMap: () => ({
    message: getConditionError("INVALID_AGGREGATION_FUNCTION"),
  }),
});

// Enum cho Baseline Function
const BaselineFunction = z.enum(["avg", "sum", "min", "max"], {
  errorMap: () => ({
    message: getConditionError("INVALID_AGGREGATION_FUNCTION"),
  }),
});

// Schema cho condition
export const conditionSchema = z
  .object({
    // Required fields
    dataSourceId: z
      .string({
        required_error: getConditionValidation("DATA_SOURCE_ID_REQUIRED"),
      })
      .min(1, getConditionValidation("DATA_SOURCE_ID_REQUIRED")),

    thresholdOperator: z
      .string({
        required_error: getConditionValidation("THRESHOLD_OPERATOR_REQUIRED"),
      })
      .refine(
        (val) =>
          ["<", ">", "<=", ">=", "==", "!=", "change_gt", "change_lt"].includes(
            val
          ),
        {
          message: getConditionError("INVALID_THRESHOLD_OPERATOR"),
        }
      ),

    thresholdValue: z.number({
      required_error: getConditionValidation("THRESHOLD_VALUE_REQUIRED"),
      invalid_type_error: getConditionValidation("THRESHOLD_VALUE_REQUIRED"),
    }),

    aggregationFunction: z
      .string({
        required_error: getConditionValidation("AGGREGATION_FUNCTION_REQUIRED"),
      })
      .refine((val) => ["sum", "avg", "min", "max", "change"].includes(val), {
        message: getConditionError("INVALID_AGGREGATION_FUNCTION"),
      }),

    aggregationWindowDays: z
      .number({
        required_error: getConditionValidation(
          "AGGREGATION_WINDOW_DAYS_REQUIRED"
        ),
        invalid_type_error: getConditionValidation(
          "AGGREGATION_WINDOW_DAYS_REQUIRED"
        ),
      })
      .int()
      .min(1, getConditionValidation("AGGREGATION_WINDOW_DAYS_MIN")),

    // Optional fields
    earlyWarningThreshold: z
      .number()
      .min(0, getConditionValidation("EARLY_WARNING_THRESHOLD_MIN"))
      .optional()
      .nullable(),

    consecutiveRequired: z.boolean().optional().nullable().default(false),

    includeComponent: z.boolean().optional().nullable().default(false),

    baselineWindowDays: z
      .number()
      .int()
      .min(1, getConditionValidation("BASELINE_WINDOW_DAYS_MIN"))
      .optional()
      .nullable(),

    baselineFunction: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return ["avg", "sum", "min", "max"].includes(val);
        },
        {
          message: getConditionError("INVALID_AGGREGATION_FUNCTION"),
        }
      ),

    validationWindowDays: z
      .number()
      .int()
      .min(1, getConditionValidation("VALIDATION_WINDOW_DAYS_MIN"))
      .optional()
      .nullable(),

    conditionOrder: z
      .number()
      .int()
      .min(1, getConditionValidation("CONDITION_ORDER_MIN"))
      .optional()
      .nullable(),

    baseCost: z
      .number()
      .min(0, getConditionError("BASE_COST_NEGATIVE"))
      .optional()
      .nullable(),

    categoryMultiplier: z
      .number()
      .refine(
        (val) => val === null || val === undefined || val > 0,
        {
          message: getConditionError("CATEGORY_MULTIPLIER_MUST_POSITIVE"),
        }
      )
      .optional()
      .nullable(),

    tierMultiplier: z
      .number()
      .refine(
        (val) => val === null || val === undefined || val > 0,
        {
          message: getConditionError("TIER_MULTIPLIER_MUST_POSITIVE"),
        }
      )
      .optional()
      .nullable(),

    calculatedCost: z
      .number()
      .min(0, getConditionError("CALCULATED_COST_NEGATIVE"))
      .optional()
      .nullable(),

    // Display fields (for UI)
    id: z.string().optional(),
    dataSourceLabel: z.string().optional(),
    parameterName: z.string().optional(),
    unit: z.string().optional(),
    aggregationFunctionLabel: z.string().optional(),
    thresholdOperatorLabel: z.string().optional(),
  })
  .refine(
    (data) => {
      // If baselineWindowDays is provided, baselineFunction must be provided
      if (data.baselineWindowDays && !data.baselineFunction) {
        return false;
      }
      return true;
    },
    {
      message: getConditionError("BASELINE_FUNCTION_REQUIRED"),
      path: ["baselineFunction"],
    }
  )
  .refine(
    (data) => {
      // baselineWindowDays should be >= aggregationWindowDays (recommended)
      if (
        data.baselineWindowDays &&
        data.aggregationWindowDays &&
        data.baselineWindowDays < data.aggregationWindowDays
      ) {
        return false;
      }
      return true;
    },
    {
      message: getConditionError("BASELINE_WINDOW_TOO_SMALL"),
      path: ["baselineWindowDays"],
    }
  );

export default conditionSchema;
