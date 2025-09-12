const { default: z } = require("zod");

export const userSchema = z.object({
  username: z.string().min(3, "Tên người dùng phải có ít nhất 3 ký tự"),
  email: email("Email không hợp lệ"),
});
