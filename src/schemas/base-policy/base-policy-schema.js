const { z } = require("zod");
const {
    getBasePolicyValidation,
    getBasePolicyError,
} = require("../../libs/message");

/**
 * Base Policy Schema - Validation cho thông tin cơ bản của chính sách
 * Mapping theo base_policy_json_spec_vi.md
 */

// Enum cho các trạng thái
const BasePolicyStatus = z.enum(
    ["draft", "payment_due", "active", "closed", "archived"],
    {
        errorMap: () => ({ message: getBasePolicyError("INVALID_STATUS") }),
    }
);

const DocumentValidationStatus = z.enum(
    ["pending", "passed", "passed_ai", "failed", "warning"],
    {
        errorMap: () => ({
            message: getBasePolicyError("INVALID_DOCUMENT_VALIDATION_STATUS"),
        }),
    }
);

// Schema cho base policy
export const basePolicySchema = z
    .object({
        // Required fields
        insuranceProviderId: z
            .string({
                required_error: getBasePolicyError(
                    "INSURANCE_PROVIDER_ID_REQUIRED"
                ),
            })
            .min(1, getBasePolicyError("INSURANCE_PROVIDER_ID_REQUIRED")),

        productName: z
            .string({
                required_error: getBasePolicyError("PRODUCT_NAME_REQUIRED"),
            })
            .min(3, getBasePolicyValidation("PRODUCT_NAME_MIN_LENGTH")),

        productCode: z
            .string({
                required_error: getBasePolicyError("PRODUCT_CODE_REQUIRED"),
            })
            .min(1, getBasePolicyError("PRODUCT_CODE_REQUIRED"))
            .regex(
                /^[A-Z0-9_]+$/,
                getBasePolicyValidation("PRODUCT_CODE_FORMAT")
            ),

        coverageCurrency: z
            .string({
                required_error: getBasePolicyError(
                    "COVERAGE_CURRENCY_REQUIRED"
                ),
            })
            .length(3, getBasePolicyError("CURRENCY_INVALID")),

        coverageDurationDays: z
            .number({
                required_error: getBasePolicyError("COVERAGE_DURATION_INVALID"),
                invalid_type_error: getBasePolicyError(
                    "COVERAGE_DURATION_INVALID"
                ),
            })
            .int()
            .min(1, getBasePolicyValidation("COVERAGE_DURATION_MIN")),

        isPerHectare: z.boolean({
            required_error: getBasePolicyValidation("IS_PER_HECTARE_REQUIRED"),
            invalid_type_error: getBasePolicyValidation(
                "IS_PER_HECTARE_REQUIRED"
            ),
        }),

        premiumBaseRate: z
            .number({
                invalid_type_error: getBasePolicyError(
                    "PREMIUM_BASE_RATE_NEGATIVE"
                ),
            })
            .nonnegative(getBasePolicyError("PREMIUM_BASE_RATE_NEGATIVE")),

        isPayoutPerHectare: z.boolean({
            required_error: getBasePolicyValidation(
                "IS_PAYOUT_PER_HECTARE_REQUIRED"
            ),
            invalid_type_error: getBasePolicyValidation(
                "IS_PAYOUT_PER_HECTARE_REQUIRED"
            ),
        }),

        payoutBaseRate: z
            .number({
                required_error: getBasePolicyError("PAYOUT_BASE_RATE_REQUIRED"),
                invalid_type_error: getBasePolicyError(
                    "PAYOUT_BASE_RATE_NEGATIVE"
                ),
            })
            .refine((val) => val > 0, {
                message: getBasePolicyError("PAYOUT_BASE_RATE_MUST_POSITIVE"),
            }),

        insuranceValidFrom: z
            .any({
                required_error: getBasePolicyValidation(
                    "INSURANCE_VALID_FROM_REQUIRED"
                ),
            })
            .refine((val) => val !== null && val !== undefined, {
                message: getBasePolicyValidation(
                    "INSURANCE_VALID_FROM_REQUIRED"
                ),
            }),

        insuranceValidTo: z
            .any({
                required_error: getBasePolicyValidation(
                    "INSURANCE_VALID_TO_REQUIRED"
                ),
            })
            .refine((val) => val !== null && val !== undefined, {
                message: getBasePolicyValidation("INSURANCE_VALID_TO_REQUIRED"),
            }),

        status: BasePolicyStatus,

        // Optional fields
        productDescription: z.string().optional(),

        cropType: z.string().optional(),

        fixPremiumAmount: z
            .number()
            .min(0, getBasePolicyError("FIX_PREMIUM_AMOUNT_NEGATIVE"))
            .optional()
            .nullable(),

        maxPremiumPaymentProlong: z.number().int().min(0).optional().nullable(),

        fixPayoutAmount: z
            .number()
            .min(0, getBasePolicyError("FIX_PAYOUT_AMOUNT_NEGATIVE"))
            .optional()
            .nullable(),

        overThresholdMultiplier: z
            .number()
            .refine((val) => val === null || val === undefined || val > 0, {
                message: getBasePolicyError(
                    "OVER_THRESHOLD_MULTIPLIER_MUST_POSITIVE"
                ),
            })
            .optional()
            .nullable(),

        payoutCap: z
            .number()
            .min(0, getBasePolicyError("PAYOUT_CAP_NEGATIVE"))
            .optional()
            .nullable(),

        cancelPremiumRate: z
            .number()
            .min(0, getBasePolicyError("CANCEL_PREMIUM_RATE_INVALID"))
            .max(1, getBasePolicyError("CANCEL_PREMIUM_RATE_INVALID"))
            .optional()
            .nullable(),

        enrollmentStartDay: z.any().optional().nullable(),

        enrollmentEndDay: z.any().optional().nullable(),

        autoRenewal: z.boolean().optional().nullable(),

        renewalDiscountRate: z
            .number()
            .min(0, getBasePolicyError("RENEWAL_DISCOUNT_RATE_INVALID"))
            .max(1, getBasePolicyError("RENEWAL_DISCOUNT_RATE_INVALID"))
            .optional()
            .nullable(),

        basePolicyInvalidDate: z.any().optional().nullable(),

        templateDocumentUrl: z.string().url().optional().nullable(),

        documentValidationStatus:
            DocumentValidationStatus.optional().nullable(),

        documentTags: z.record(z.any()).optional().nullable(),

        importantAdditionalInformation: z.string().optional().nullable(),

        selectedDataSources: z.array(z.any()).optional().default([]),
    })
    .refine(
        (data) => {
            // If fixPremiumAmount is not provided, premiumBaseRate must be > 0
            if (!data.fixPremiumAmount || data.fixPremiumAmount === 0) {
                return data.premiumBaseRate > 0;
            }
            return true;
        },
        {
            message: getBasePolicyError("PREMIUM_BASE_RATE_MUST_POSITIVE"),
            path: ["premiumBaseRate"],
        }
    )
    .refine(
        (data) => {
            // enrollmentStartDay < enrollmentEndDay
            if (data.enrollmentStartDay && data.enrollmentEndDay) {
                const start = data.enrollmentStartDay.valueOf
                    ? data.enrollmentStartDay.valueOf()
                    : new Date(data.enrollmentStartDay).valueOf();
                const end = data.enrollmentEndDay.valueOf
                    ? data.enrollmentEndDay.valueOf()
                    : new Date(data.enrollmentEndDay).valueOf();
                return start < end;
            }
            return true;
        },
        {
            message: getBasePolicyError("ENROLLMENT_START_AFTER_END"),
            path: ["enrollmentEndDay"],
        }
    )
    .refine(
        (data) => {
            // insuranceValidFrom < insuranceValidTo
            if (data.insuranceValidFrom && data.insuranceValidTo) {
                const from = data.insuranceValidFrom.valueOf
                    ? data.insuranceValidFrom.valueOf()
                    : new Date(data.insuranceValidFrom).valueOf();
                const to = data.insuranceValidTo.valueOf
                    ? data.insuranceValidTo.valueOf()
                    : new Date(data.insuranceValidTo).valueOf();
                return from < to;
            }
            return true;
        },
        {
            message: getBasePolicyError("INSURANCE_VALID_FROM_AFTER_TO"),
            path: ["insuranceValidTo"],
        }
    )
    .refine(
        (data) => {
            // insuranceValidFrom >= enrollmentStartDay
            if (data.enrollmentStartDay && data.insuranceValidFrom) {
                const enrollStart = data.enrollmentStartDay.valueOf
                    ? data.enrollmentStartDay.valueOf()
                    : new Date(data.enrollmentStartDay).valueOf();
                const validFrom = data.insuranceValidFrom.valueOf
                    ? data.insuranceValidFrom.valueOf()
                    : new Date(data.insuranceValidFrom).valueOf();
                return validFrom >= enrollStart;
            }
            return true;
        },
        {
            message: getBasePolicyError(
                "INSURANCE_VALID_FROM_BEFORE_ENROLLMENT_START"
            ),
            path: ["insuranceValidFrom"],
        }
    )
    .refine(
        (data) => {
            // payoutCap should be >= fixPayoutAmount if both exist
            if (
                data.payoutCap &&
                data.fixPayoutAmount &&
                data.payoutCap < data.fixPayoutAmount
            ) {
                return false;
            }
            return true;
        },
        {
            message: getBasePolicyError("PAYOUT_CAP_LOWER_THAN_FIX"),
            path: ["payoutCap"],
        }
    );

export default basePolicySchema;
