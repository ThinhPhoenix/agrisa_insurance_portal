const { default: z } = require("zod");
const {
  getSignInValidation,
} = require("../libs/message");

const signInRequestSchema = z.object({
  email: z
    .string()
    .min(1, getSignInValidation("IDENTIFIER_REQUIRED"))
    .refine((val) => {
      // Check if it's email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    }, {
      message: getSignInValidation("EMAIL_INVALID"),
    }),
  password: z
    .string()
    .min(1, getSignInValidation("PASSWORD_REQUIRED"))
    .min(6, getSignInValidation("PASSWORD_TOO_SHORT")),
});

module.exports = signInRequestSchema;
