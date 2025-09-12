const { default: z } = require("zod");
const {
  getValidationMessage,
  getSignInValidation,
} = require("../libs/message");

export const userSchema = z.object({
  username: z
    .string()
    .min(1, getValidationMessage("REQUIRED_FIELD"))
    .min(3, getValidationMessage("USERNAME_TOO_SHORT", { minLength: 3 })),
  email: z
    .string()
    .min(1, getValidationMessage("EMAIL_INVALID"))
    .email(getValidationMessage("EMAIL_INVALID")),
});
