const { default: z } = require("zod");
const {
  getRegisterValidation,
  getValidationMessage,
} = require("../libs/message");

const signUpRequestSchema = z
  .object({
    username: z
      .string()
      .min(1, getRegisterValidation("FULL_NAME_REQUIRED"))
      .min(3, getValidationMessage("USERNAME_TOO_SHORT", { minLength: 3 }))
      .regex(/^[a-zA-Z\s]+$/, getRegisterValidation("FULL_NAME_INVALID")),
    email: z
      .string()
      .min(1, getRegisterValidation("EMAIL_REQUIRED"))
      .email(getRegisterValidation("EMAIL_INVALID")),
    phone: z
      .string()
      .min(1, getRegisterValidation("PHONE_REQUIRED"))
      .regex(
        /^(\+84|0)[3|5|7|8|9][0-9]{8}$/,
        getRegisterValidation("PHONE_INVALID")
      ),
    password: z
      .string()
      .min(1, getRegisterValidation("PASSWORD_REQUIRED"))
      .min(8, getRegisterValidation("PASSWORD_TOO_SHORT"))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        getRegisterValidation("PASSWORD_TOO_WEAK")
      ),
    confirmPassword: z
      .string()
      .min(1, getRegisterValidation("PASSWORD_CONFIRM_REQUIRED")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: getRegisterValidation("PASSWORD_MISMATCH"),
    path: ["confirmPassword"],
  });

module.exports = signUpRequestSchema;
