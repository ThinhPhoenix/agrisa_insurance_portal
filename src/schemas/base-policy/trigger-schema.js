const { z } = require("zod");
const { getTriggerValidation, getTriggerError } = require("../../libs/message");

/**
 * Trigger Schema - Validation cho cấu hình trigger
 * Mapping theo base_policy_json_spec_vi.md
 */

// Enum cho Logical Operator
const LogicalOperator = z.enum(["AND", "OR"], {
  errorMap: () => ({ message: getTriggerError("INVALID_LOGICAL_OPERATOR") }),
});

// Enum cho Monitor Frequency Unit
const MonitorFrequencyUnit = z.enum(["hour", "day", "week", "month", "year"], {
  errorMap: () => ({
    message: getTriggerError("INVALID_MONITOR_FREQUENCY_UNIT"),
  }),
});

// Schema cho trigger
export const triggerSchema = z.object({
  logicalOperator: LogicalOperator,

  monitorInterval: z
    .number({
      required_error: getTriggerValidation("MONITOR_INTERVAL_REQUIRED"),
      invalid_type_error: getTriggerValidation("MONITOR_INTERVAL_REQUIRED"),
    })
    .int()
    .min(1, getTriggerValidation("MONITOR_INTERVAL_MIN")),

  monitorFrequencyUnit: z
    .string({
      required_error: getTriggerValidation("MONITOR_FREQUENCY_UNIT_REQUIRED"),
    })
    .refine((val) => ["hour", "day", "week", "month", "year"].includes(val), {
      message: getTriggerError("INVALID_MONITOR_FREQUENCY_UNIT"),
    }),

  // Optional fields
  growthStage: z.string().max(500).optional().nullable(),

  // blackoutPeriods: Object rỗng {} nếu không có, không cần validate
  blackoutPeriods: z.any().optional().default({}),

  conditions: z.array(z.any()).optional().default([]),
});

export default triggerSchema;
