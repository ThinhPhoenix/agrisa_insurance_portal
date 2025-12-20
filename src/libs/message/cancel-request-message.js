/**
 * Cancel Request Messages - Thông báo cho quy trình hủy hợp đồng bảo hiểm
 */

export const CANCEL_REQUEST_MESSAGES = {
  SUCCESS: {
    CREATED:
      "Gửi yêu cầu hủy thành công! Hợp đồng sẽ chuyển sang trạng thái 'Chờ hủy'.",
    REVIEWED: "Xem xét yêu cầu hủy thành công!",
    APPROVED: "Chấp thuận hủy hợp đồng thành công!",
    DENIED: "Từ chối yêu cầu hủy thành công!",
  },

  ERROR: {
    // 400 Bad Request errors
    INVALID_REQUEST: "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại!",
    INVALID_UUID: "Mã hợp đồng hoặc mã yêu cầu không hợp lệ!",

    // 401 Unauthorized
    UNAUTHORIZED: "Bạn cần đăng nhập để thực hiện hành động này!",

    // 500 Server errors - Backend specific error codes mapping
    CREATE_FAILED: "Không thể tạo yêu cầu hủy. Vui lòng thử lại!",
    POLICY_NOT_STARTED:
      "Hợp đồng chưa phát hành nên không thể tính bồi thường. Vui lòng liên hệ bộ phận hỗ trợ!",
    POLICY_INVALID_STATUS:
      "Hợp đồng không ở trạng thái cho phép hủy! (Chỉ có thể hủy hợp đồng đang hoạt động)",
    INVALID_POLICY_STATUS: "Trạng thái hợp đồng không hợp lệ!",
    CANCEL_REQUEST_STATUS_INVALID: "Trạng thái yêu cầu hủy không hợp lệ!",

    RETRIEVAL_FAILED: "Không thể tải thông tin yêu cầu hủy. Vui lòng thử lại!",
    REVIEW_FAILED: "Xem xét yêu cầu hủy thất bại. Vui lòng thử lại!",
    CANNOT_REVIEW_OWN_REQUEST:
      "Bạn không thể xem xét yêu cầu do chính mình gửi!",

    RESOLVE_FAILED: "Giải quyết tranh chấp thất bại. Vui lòng thử lại!",
    FINAL_DECISION_INVALID: "Quyết định cuối cùng không hợp lệ!",
    POLICY_NOT_IN_DISPUTE: "Hợp đồng không ở trạng thái tranh chấp!",

    REVOKE_FAILED: "Hủy bỏ yêu cầu thất bại. Vui lòng thử lại!",
    INVALID_REQUEST_STATUS: "Trạng thái yêu cầu không cho phép hủy bỏ!",

    // Generic server errors
    INTERNAL_SERVER_ERROR: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau!",
    NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra kết nối mạng!",
    UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định. Vui lòng thử lại!",
  },

  VALIDATION: {
    CANCEL_TYPE_REQUIRED: "Vui lòng chọn loại yêu cầu hủy!",
    REASON_REQUIRED: "Vui lòng nhập lý do hủy hợp đồng!",
    POLICY_ID_REQUIRED: "Vui lòng chọn hợp đồng cần hủy!",
    REVIEW_NOTES_REQUIRED: "Vui lòng nhập ghi chú xem xét!",
  },

  INFO: {
    CREATING: "Đang gửi yêu cầu hủy...",
    REVIEWING: "Đang xem xét yêu cầu hủy...",
    RESOLVING: "Đang giải quyết tranh chấp...",
    LOADING: "Đang tải danh sách yêu cầu hủy...",
  },

  WARNING: {
    CONFIRM_CANCEL: "Bạn có chắc chắn muốn gửi yêu cầu hủy hợp đồng này?",
    CONFIRM_APPROVE: "Bạn có chắc chắn muốn chấp thuận hủy hợp đồng này?",
    CONFIRM_DENY: "Bạn có chắc chắn muốn từ chối yêu cầu hủy?",
    CANCEL_PENDING:
      "Hợp đồng này đang chờ xem xét yêu cầu hủy. Hành động này sẽ tạo một yêu cầu mới.",
  },
};

/**
 * Helper function để map BE error codes sang thông báo tiếng Việt
 */
export const mapBackendErrorToMessage = (errorCode, errorMessage) => {
  // Nếu error code khớp với key trong CANCEL_REQUEST_MESSAGES.ERROR
  if (CANCEL_REQUEST_MESSAGES.ERROR[errorCode]) {
    return CANCEL_REQUEST_MESSAGES.ERROR[errorCode];
  }

  // Nếu error message chứa các từ khóa, map sang thông báo tương ứng
  const messageLower = errorMessage?.toLowerCase() || "";

  if (
    messageLower.includes("policy haven't started") ||
    messageLower.includes("haven't been released")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.POLICY_NOT_STARTED;
  }
  if (messageLower.includes("invalid policy status")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.INVALID_POLICY_STATUS;
  }
  if (messageLower.includes("cancel request status invalid")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.CANCEL_REQUEST_STATUS_INVALID;
  }
  if (messageLower.includes("cannot review your own request")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.CANNOT_REVIEW_OWN_REQUEST;
  }
  if (messageLower.includes("invalid request status")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.INVALID_REQUEST_STATUS;
  }
  if (messageLower.includes("policy is not in dispute")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.POLICY_NOT_IN_DISPUTE;
  }

  // Mặc định trả về thông báo lỗi chung
  return CANCEL_REQUEST_MESSAGES.ERROR.UNKNOWN_ERROR;
};

/**
 * Helper functions để dễ sử dụng
 */
export const getCancelRequestMessage = (type, key, params = {}) => {
  const category = CANCEL_REQUEST_MESSAGES[type];
  if (!category || !category[key]) {
    return `Cancel request message not found: ${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getCancelRequestSuccess = (key, params = {}) =>
  getCancelRequestMessage("SUCCESS", key, params);
export const getCancelRequestError = (key, params = {}) =>
  getCancelRequestMessage("ERROR", key, params);
export const getCancelRequestValidation = (key, params = {}) =>
  getCancelRequestMessage("VALIDATION", key, params);
export const getCancelRequestInfo = (key, params = {}) =>
  getCancelRequestMessage("INFO", key, params);
export const getCancelRequestWarning = (key, params = {}) =>
  getCancelRequestMessage("WARNING", key, params);

export default CANCEL_REQUEST_MESSAGES;
