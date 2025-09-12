/**
 * Authentication Messages - enhanced and comprehensive messages for authentication flows
 * Mapping with backend server responses
 */

export const AUTH_MESSAGES = {
  // REGISTER MESSAGES
  REGISTER: {
    SUCCESS: {
      REGISTER_SUCCESS: "🎉 Đăng ký tài khoản thành công!",
      ACCOUNT_CREATED: "✅ Tài khoản đã được tạo thành công!",
      VERIFICATION_SENT:
        "📧 Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư!",
    },

    ERROR: {
      // Backend error codes mapping
      USER_ALREADY_EXISTS:
        "👤 Số điện thoại này đã được đăng ký. Vui lòng sử dụng số khác!",
      EMAIL_ALREADY_EXISTS:
        "📧 Email này đã được đăng ký. Vui lòng sử dụng email khác!",
      PHONE_ALREADY_EXISTS:
        "📱 Số điện thoại này đã được đăng ký. Vui lòng sử dụng số khác!",

      // Validation errors
      VALIDATION_ERROR: "❌ Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại!",
      FULL_NAME_REQUIRED: "👤 Vui lòng nhập họ và tên!",
      PHONE_REQUIRED: "📱 Vui lòng nhập số điện thoại!",
      EMAIL_REQUIRED: "📧 Vui lòng nhập email!",
      PASSWORD_REQUIRED: "🔑 Vui lòng nhập mật khẩu!",
      DATE_OF_BIRTH_REQUIRED: "📅 Vui lòng nhập ngày sinh!",
      GENDER_REQUIRED: "⚧ Vui lòng chọn giới tính!",
      ADDRESS_REQUIRED: "🏠 Vui lòng nhập địa chỉ!",

      // Format validation
      EMAIL_INVALID: "❌ Email không hợp lệ!",
      PHONE_INVALID:
        "❌ Số điện thoại không hợp lệ! (VD: 0987654321 hoặc +84987654321)",
      PASSWORD_TOO_SHORT: "📏 Mật khẩu phải có ít nhất 8 ký tự!",
      PASSWORD_TOO_WEAK:
        "⚠️ Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn!",
      DATE_OF_BIRTH_INVALID: "📅 Ngày sinh không hợp lệ!",

      // Server errors
      REGISTRATION_FAILED: "❌ Đăng ký thất bại. Vui lòng thử lại!",
      SERVER_ERROR: "🔧 Máy chủ đang gặp sự cố. Vui lòng thử lại sau!",
    },

    VALIDATION: {
      FULL_NAME_REQUIRED: "👤 Vui lòng nhập họ và tên đầy đủ!",
      PHONE_REQUIRED: "📱 Vui lòng nhập số điện thoại!",
      EMAIL_REQUIRED: "📧 Vui lòng nhập địa chỉ email!",
      PASSWORD_REQUIRED: "🔑 Vui lòng nhập mật khẩu!",
      PASSWORD_CONFIRM_REQUIRED: "🔑 Vui lòng xác nhận mật khẩu!",
      PASSWORD_MISMATCH: "❌ Mật khẩu xác nhận không khớp!",
      DATE_OF_BIRTH_REQUIRED: "📅 Vui lòng nhập ngày sinh!",
      GENDER_REQUIRED: "⚧ Vui lòng chọn giới tính!",
      ADDRESS_REQUIRED: "🏠 Vui lòng nhập địa chỉ!",
      TERMS_REQUIRED: "📋 Vui lòng đồng ý với điều khoản sử dụng!",

      EMAIL_INVALID: "❌ Định dạng email không hợp lệ!",
      PHONE_INVALID:
        "❌ Số điện thoại không hợp lệ! (VD: 0987654321 hoặc +84987654321)",
      PASSWORD_TOO_SHORT: "📏 Mật khẩu phải có ít nhất 8 ký tự!",
      PASSWORD_TOO_WEAK:
        "⚠️ Mật khẩu quá yếu. Phải chứa chữ hoa, chữ thường và số!",
      DATE_OF_BIRTH_INVALID: "📅 Ngày sinh không hợp lệ!",
      FULL_NAME_INVALID: "👤 Họ và tên chỉ được chứa chữ cái và khoảng trắng!",
    },

    INFO: {
      REGISTERING: "⏳ Đang tạo tài khoản...",
      VERIFICATION_SENT: "📧 Email xác thực đã được gửi đến hộp thư của bạn!",
      SMS_VERIFICATION_SENT:
        "📱 SMS xác thực đã được gửi đến số điện thoại của bạn!",
      ACCOUNT_PENDING_VERIFICATION:
        "⏳ Tài khoản đang chờ xác thực. Vui lòng kiểm tra email/SMS!",
    },

    WARNING: {
      WEAK_PASSWORD:
        "⚠️ Mật khẩu của bạn khá yếu. Khuyến nghị sử dụng mật khẩu mạnh hơn!",
      ACCOUNT_EXISTS_DIFFERENT_PROVIDER:
        "⚠️ Tài khoản đã tồn tại với phương thức đăng nhập khác!",
    },
  },

  // SIGNIN MESSAGES
  SIGNIN: {
    SUCCESS: {
      LOGIN_SUCCESS: "✅ Đăng nhập thành công!",
      LOGOUT_SUCCESS: "👋 Đăng xuất thành công!",
      ACCOUNT_VERIFIED: "✔️ Tài khoản đã được xác thực thành công!",
      PASSWORD_CHANGED: "🔑 Mật khẩu đã được thay đổi thành công!",
      SESSION_EXTENDED: "🔄 Phiên đăng nhập đã được gia hạn!",
    },

    ERROR: {
      // Backend error codes mapping
      INVALID_CREDENTIALS: "❌ Email/số điện thoại hoặc mật khẩu không đúng!",
      ACCOUNT_NOT_VERIFIED:
        "⚠️ Tài khoản chưa được xác thực. Vui lòng xác thực tài khoản trước!",
      ACCOUNT_LOCKED:
        "🔒 Tài khoản tạm thời bị khóa do nhiều lần đăng nhập thất bại!",
      ACCOUNT_SUSPENDED:
        "🚫 Tài khoản đã bị tạm ngừng. Vui lòng liên hệ hỗ trợ!",
      ACCOUNT_EXPIRED: "⏰ Tài khoản đã hết hạn. Vui lòng gia hạn!",
      ACCOUNT_DISABLED: "🚫 Tài khoản đã bị vô hiệu hóa!",

      // Login attempt errors
      TOO_MANY_FAILED_ATTEMPTS:
        "🚦 Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau {minutes} phút!",
      ACCOUNT_BLOCKED_TEMPORARILY:
        "⏳ Tài khoản bị khóa tạm thời. Vui lòng thử lại sau!",
      IP_BLOCKED: "🌐 IP của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ!",

      // Token specific errors
      REFRESH_TOKEN_EXPIRED:
        "🔄 Token làm mới đã hết hạn. Vui lòng đăng nhập lại!",
      REFRESH_TOKEN_INVALID:
        "🎫 Token làm mới không hợp lệ. Vui lòng đăng nhập lại!",
      SESSION_EXPIRED: "⏰ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
      TOKEN_INVALID: "🎫 Token không hợp lệ. Vui lòng đăng nhập lại!",

      // Social login errors
      SOCIAL_LOGIN_FAILED:
        "🔗 Đăng nhập bằng {provider} thất bại. Vui lòng thử lại!",
      SOCIAL_ACCOUNT_NOT_LINKED: "👤 Tài khoản {provider} chưa được liên kết!",
      SOCIAL_EMAIL_MISMATCH:
        "📧 Email từ {provider} không khớp với tài khoản hiện tại!",
    },

    VALIDATION: {
      IDENTIFIER_REQUIRED: "❓ Vui lòng nhập email hoặc số điện thoại!",
      EMAIL_REQUIRED: "📧 Vui lòng nhập email!",
      PHONE_REQUIRED: "📱 Vui lòng nhập số điện thoại!",
      PASSWORD_REQUIRED: "🔑 Vui lòng nhập mật khẩu!",
      EMAIL_INVALID: "❌ Email không hợp lệ!",
      PHONE_INVALID:
        "❌ Số điện thoại không hợp lệ! (VD: 0987654321 hoặc +84987654321)",
      PASSWORD_TOO_SHORT: "📏 Mật khẩu phải có ít nhất 8 ký tự!",
      PASSWORD_TOO_WEAK:
        "⚠️ Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn!",
      USERNAME_INVALID: "👤 Tên đăng nhập không hợp lệ!",
      IDENTIFIER_MISSING: "❓ Vui lòng nhập email hoặc số điện thoại!",
    },

    INFO: {
      LOGGING_IN: "⏳ Đang đăng nhập...",
      LOGOUT_CONFIRM: "❓ Bạn có chắc chắn muốn đăng xuất?",
      SESSION_REMAINING:
        "⏱️ Phiên đăng nhập còn {minutes} phút nữa sẽ hết hạn!",
      PASSWORD_EXPIRING:
        "⚠️ Mật khẩu sẽ hết hạn trong {days} ngày. Vui lòng đổi mật khẩu!",
      ACCOUNT_LOCK_WARNING:
        "🚨 Cảnh báo: Tài khoản sẽ bị khóa sau {attempts} lần đăng nhập thất bại nữa!",
      EMAIL_VERIFICATION_SENT:
        "📧 Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư!",
      SMS_VERIFICATION_SENT:
        "📱 SMS xác thực đã được gửi đến số điện thoại của bạn!",
    },

    WARNING: {
      PASSWORD_WILL_EXPIRE: "⏰ Mật khẩu sẽ hết hạn trong {days} ngày!",
      ACCOUNT_INACTIVE: "🚫 Tài khoản chưa được kích hoạt!",
      EMAIL_NOT_VERIFIED: "📧 Email chưa được xác thực!",
      PHONE_NOT_VERIFIED: "📱 Số điện thoại chưa được xác thực!",
      WEAK_PASSWORD:
        "⚠️ Mật khẩu của bạn khá yếu. Khuyến nghị đổi mật khẩu mạnh hơn!",
      OLD_PASSWORD_DETECTED:
        "🔄 Bạn đang sử dụng mật khẩu cũ. Vui lòng đổi mật khẩu mới!",
      SESSION_EXPIRING: "⏳ Phiên đăng nhập sẽ hết hạn trong {minutes} phút!",
    },
  },
};

/**
 * Helper functions để dễ sử dụng
 */

// REGISTER helpers
export const getRegisterMessage = (type, key, params = {}) => {
  const category = AUTH_MESSAGES.REGISTER[type];
  if (!category || !category[key]) {
    return `Register message not found: REGISTER.${type}.${key}`;
  }

  let message = category[key];

  // Replace parameters
  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getRegisterSuccess = (key, params = {}) =>
  getRegisterMessage("SUCCESS", key, params);
export const getRegisterError = (key, params = {}) =>
  getRegisterMessage("ERROR", key, params);
export const getRegisterValidation = (key, params = {}) =>
  getRegisterMessage("VALIDATION", key, params);
export const getRegisterInfo = (key, params = {}) =>
  getRegisterMessage("INFO", key, params);
export const getRegisterWarning = (key, params = {}) =>
  getRegisterMessage("WARNING", key, params);

// SIGNIN helpers
export const getSignInMessage = (type, key, params = {}) => {
  const category = AUTH_MESSAGES.SIGNIN[type];
  if (!category || !category[key]) {
    return `SignIn message not found: SIGNIN.${type}.${key}`;
  }

  let message = category[key];

  // Replace parameters
  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getSignInSuccess = (key, params = {}) =>
  getSignInMessage("SUCCESS", key, params);
export const getSignInError = (key, params = {}) =>
  getSignInMessage("ERROR", key, params);
export const getSignInValidation = (key, params = {}) =>
  getSignInMessage("VALIDATION", key, params);
export const getSignInInfo = (key, params = {}) =>
  getSignInMessage("INFO", key, params);
export const getSignInWarning = (key, params = {}) =>
  getSignInMessage("WARNING", key, params);

// Helper để lấy icon từ message (lấy ký tự đầu tiên nếu là emoji)
export const getAuthMessageIcon = (section, type, key) => {
  const category = AUTH_MESSAGES[section]?.[type];
  if (!category || !category[key]) {
    return "❓";
  }

  const message = category[key];
  // Lấy emoji đầu tiên trong message
  const emojiMatch = message.match(
    /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  );
  return emojiMatch ? emojiMatch[0] : "❓";
};

// Helper để lấy type dựa trên category
export const getAuthMessageType = (section, type, key) => {
  // Map category sang type
  const typeMapping = {
    SUCCESS: "success",
    ERROR: "error",
    WARNING: "warning",
    INFO: "info",
    VALIDATION: "error", // validation errors thường là error type
  };

  return typeMapping[type] || "info";
};

// Helper để tách riêng icon và text
export const splitAuthMessage = (section, type, key) => {
  const message =
    section === "REGISTER"
      ? getRegisterMessage(type, key)
      : getSignInMessage(type, key);
  const icon = getAuthMessageIcon(section, type, key);
  const text = message.replace(icon, "").trim();

  return {
    icon,
    text,
    fullMessage: message,
    type: getAuthMessageType(section, type, key),
  };
};

// Backward compatibility - giữ nguyên các function cũ
export const getSignInMessageIcon = (type, key) =>
  getAuthMessageIcon("SIGNIN", type, key);
export const getSignInMessageType = (type, key) =>
  getAuthMessageType("SIGNIN", type, key);
export const splitSignInMessage = (type, key) =>
  splitAuthMessage("SIGNIN", type, key);

// Default exports
export default AUTH_MESSAGES;
