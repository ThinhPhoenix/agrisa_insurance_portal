/**
 * Common Messages - generic messages for general use
 * Including server errors, network errors, unknown errors, etc.
 */

export const COMMON_MESSAGES = {
  // Success Messages
  SUCCESS: {
    OPERATION_SUCCESS: "✅ Thao tác thành công!",
    SAVE_SUCCESS: "💾 Lưu dữ liệu thành công!",
    UPDATE_SUCCESS: "🔄 Cập nhật thành công!",
    DELETE_SUCCESS: "🗑️ Xóa dữ liệu thành công!",
    CREATE_SUCCESS: "✨ Tạo mới thành công!",
  },

  // Error Messages - Chung
  ERROR: {
    // Network & Server Errors
    NETWORK_ERROR:
      "🌐 Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet!",
    TIMEOUT_ERROR: "⏱️ Quá thời gian chờ phản hồi. Vui lòng thử lại!",
    SERVER_ERROR: "🔧 Máy chủ đang gặp sự cố. Vui lòng thử lại sau!",
    MAINTENANCE_ERROR: "🚧 Hệ thống đang bảo trì. Vui lòng quay lại sau!",

    // Generic Errors
    GENERIC_ERROR: "❌ Có lỗi xảy ra. Vui lòng thử lại!",
    UNKNOWN_ERROR: "❓ Lỗi không xác định. Vui lòng liên hệ hỗ trợ!",
    SYSTEM_ERROR: "⚠️ Lỗi hệ thống. Vui lòng thử lại sau!",

    // Authorization Errors
    UNAUTHORIZED: "🔒 Bạn không có quyền truy cập. Vui lòng đăng nhập lại!",
    FORBIDDEN: "🚫 Truy cập bị từ chối!",
    SESSION_EXPIRED: "⏰ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
    TOKEN_INVALID: "🎫 Token không hợp lệ. Vui lòng đăng nhập lại!",

    // Data Errors
    NOT_FOUND: "🔍 Không tìm thấy dữ liệu yêu cầu!",
    ALREADY_EXISTS: "📋 Dữ liệu đã tồn tại!",
    DATA_INVALID: "📝 Dữ liệu không hợp lệ!",
    REQUIRED_FIELD: "⚠️ Trường này là bắt buộc!",

    // Request Errors
    TOO_MANY_REQUESTS: "🚦 Quá nhiều yêu cầu. Vui lòng thử lại sau!",
    REQUEST_TOO_LARGE: "📦 Dữ liệu gửi quá lớn!",
    UNSUPPORTED_FORMAT: "📄 Định dạng không được hỗ trợ!",

    // File Errors
    FILE_TOO_LARGE: "📁 File quá lớn. Vui lòng chọn file nhỏ hơn!",
    FILE_TYPE_INVALID: "📎 Loại file không được hỗ trợ!",
    UPLOAD_FAILED: "📤 Upload file thất bại. Vui lòng thử lại!",
  },

  // Warning Messages
  WARNING: {
    SESSION_EXPIRING: "⏳ Phiên đăng nhập sẽ hết hạn trong {minutes} phút!",
    DATA_OUTDATED: "🔄 Dữ liệu có thể đã cũ. Vui lòng làm mới!",
    CONFIRM_DELETE: "🗑️ Bạn có chắc chắn muốn xóa?",
    UNSAVED_CHANGES: "💾 Bạn có thay đổi chưa lưu. Bạn có muốn lưu không?",
  },

  // Info Messages
  INFO: {
    LOADING: "⏳ Đang tải...",
    PROCESSING: "⚙️ Đang xử lý...",
    SAVING: "💾 Đang lưu...",
    PLEASE_WAIT: "⏳ Vui lòng đợi...",
    NO_DATA: "📭 Không có dữ liệu để hiển thị!",
    NO_RESULTS: "🔍 Không tìm thấy kết quả nào!",
  },

  // Validation Errors - Chung
  VALIDATION: {
    VALIDATION_ERROR: "⚠️ Dữ liệu nhập không hợp lệ!",
    FORMAT_INVALID: "📝 Định dạng không hợp lệ!",
    LENGTH_INVALID: "📏 Độ dài không hợp lệ!",
    VALUE_INVALID: "🔢 Giá trị không hợp lệ!",
    REQUIRED_FIELD: "⚠️ Trường này là bắt buộc!",
    PASSWORD_TOO_SHORT: "🔒 Mật khẩu phải có ít nhất {minLength} ký tự!",
    PASSWORD_TOO_LONG: "🔒 Mật khẩu không được vượt quá {maxLength} ký tự!",
    EMAIL_INVALID: "📧 Email không hợp lệ!",
    PHONE_INVALID: "📱 Số điện thoại không hợp lệ!",
    USERNAME_TOO_SHORT: "👤 Tên đăng nhập phải có ít nhất {minLength} ký tự!",
    USERNAME_TOO_LONG:
      "👤 Tên đăng nhập không được vượt quá {maxLength} ký tự!",
    CONFIRM_PASSWORD_MISMATCH: "🔐 Mật khẩu xác nhận không khớp!",
    IDENTIFIER_MISSING: "⚠️ Vui lòng nhập email hoặc số điện thoại!",
    PASSWORD_REQUIRED: "🔒 Vui lòng nhập mật khẩu!",
  },
};

/**
 * Helper functions
 */
export const getCommonMessage = (type, key, params = {}) => {
  const category = COMMON_MESSAGES[type];
  if (!category || !category[key]) {
    return `Message not found: ${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getSuccessMessage = (key, params = {}) =>
  getCommonMessage("SUCCESS", key, params);
export const getErrorMessage = (key, params = {}) =>
  getCommonMessage("ERROR", key, params);
export const getWarningMessage = (key, params = {}) =>
  getCommonMessage("WARNING", key, params);
export const getInfoMessage = (key, params = {}) =>
  getCommonMessage("INFO", key, params);
export const getValidationMessage = (key, params = {}) =>
  getCommonMessage("VALIDATION", key, params);

export const getMessageIcon = (type, key) => {
  const category = COMMON_MESSAGES[type];
  if (!category || !category[key]) {
    return "❓";
  }

  const message = category[key];
  const emojiMatch = message.match(
    /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  );
  return emojiMatch ? emojiMatch[0] : "❓";
};

export const getMessageType = (type, key) => {
  // Map category sang type
  const typeMapping = {
    SUCCESS: "success",
    ERROR: "error",
    WARNING: "warning",
    INFO: "info",
    VALIDATION: "error",
  };

  return typeMapping[type] || "info";
};

export const splitMessage = (type, key) => {
  const message = getCommonMessage(type, key);
  const icon = getMessageIcon(type, key);
  const text = message.replace(icon, "").trim();

  return {
    icon,
    text,
    fullMessage: message,
    type: getMessageType(type, key),
  };
};

// Default exports
export default COMMON_MESSAGES;
