/**
 * Claim Error Messages Mapping
 * Map các mã lỗi từ backend API sang thông báo tiếng Việt cho người dùng
 * Tài liệu tham khảo: CLAIM_API_DOCUMENTATION.md
 */

export const CLAIM_ERROR_MESSAGES = {
  // Authentication & Authorization Errors (401, 403)
  UNAUTHORIZED: "Bạn cần đăng nhập để thực hiện thao tác này",
  FORBIDDEN: "Bạn không có quyền truy cập tài nguyên này",

  // Validation Errors (400)
  INVALID_UUID: "Định dạng ID không hợp lệ",
  INVALID_STATUS: "Trạng thái yêu cầu bồi thường không hợp lệ",
  INVALID_PAYOUT_AMOUNT: "Số tiền chi trả không hợp lệ",
  BAD_REQUEST: "Dữ liệu gửi lên không đúng định dạng",

  // Not Found Errors (404)
  NOT_FOUND: "Không tìm thấy thông tin yêu cầu bồi thường",
  POLICY_NOT_FOUND: "Không tìm thấy thông tin hợp đồng bảo hiểm",
  FARM_NOT_FOUND: "Không tìm thấy thông tin nông trại",

  // Server Errors (500)
  RETRIEVAL_FAILED: "Lỗi khi tải dữ liệu từ hệ thống",
  DELETE_FAILED: "Lỗi khi xóa yêu cầu bồi thường",
  UPDATE_FAILED: "Lỗi khi cập nhật yêu cầu bồi thường",
  INTERNAL_SERVER_ERROR: "Lỗi hệ thống, vui lòng thử lại sau",
  SERVER_ERROR: "Lỗi máy chủ, vui lòng thử lại sau",

  // Default fallback
  UNKNOWN_ERROR: "Có lỗi không xác định xảy ra, vui lòng thử lại",
};

/**
 * Map HTTP status code to Vietnamese error message
 * @param {number} statusCode - HTTP status code
 * @returns {string} Vietnamese error message
 */
export const getErrorMessageByStatusCode = (statusCode) => {
  const statusMessages = {
    400: "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin",
    401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
    403: "Bạn không có quyền thực hiện thao tác này",
    404: "Không tìm thấy dữ liệu yêu cầu",
    500: "Lỗi máy chủ, vui lòng thử lại sau",
    502: "Lỗi kết nối máy chủ, vui lòng thử lại sau",
    503: "Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau",
    504: "Yêu cầu quá thời gian chờ, vui lòng thử lại",
  };

  return statusMessages[statusCode] || CLAIM_ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Parse error from API response and return Vietnamese message
 * @param {Object} error - Error object from axios or API response
 * @returns {string} Vietnamese error message
 */
export const getClaimErrorMessage = (error) => {
  // Case 1: error.response.data.error.code (chuẩn API format)
  if (error?.response?.data?.error?.code) {
    const errorCode = error.response.data.error.code;
    return CLAIM_ERROR_MESSAGES[errorCode] || CLAIM_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Case 2: error.response.data.error (string message)
  if (error?.response?.data?.error && typeof error.response.data.error === "string") {
    // Nếu là tiếng Anh, map sang tiếng Việt
    const errorText = error.response.data.error.toLowerCase();
    if (errorText.includes("unauthorized")) return CLAIM_ERROR_MESSAGES.UNAUTHORIZED;
    if (errorText.includes("forbidden")) return CLAIM_ERROR_MESSAGES.FORBIDDEN;
    if (errorText.includes("not found")) return CLAIM_ERROR_MESSAGES.NOT_FOUND;
    if (errorText.includes("invalid")) return CLAIM_ERROR_MESSAGES.BAD_REQUEST;

    // Nếu là tiếng Việt, trả về luôn
    return error.response.data.error;
  }

  // Case 3: error.response.data.message
  if (error?.response?.data?.message && typeof error.response.data.message === "string") {
    const msgText = error.response.data.message.toLowerCase();
    if (msgText.includes("unauthorized")) return CLAIM_ERROR_MESSAGES.UNAUTHORIZED;
    if (msgText.includes("forbidden")) return CLAIM_ERROR_MESSAGES.FORBIDDEN;
    if (msgText.includes("not found")) return CLAIM_ERROR_MESSAGES.NOT_FOUND;

    return error.response.data.message;
  }

  // Case 4: error.response.status (HTTP status code)
  if (error?.response?.status) {
    return getErrorMessageByStatusCode(error.response.status);
  }

  // Case 5: error.message (network errors, etc.)
  if (error?.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network error")) return "Lỗi kết nối mạng, vui lòng kiểm tra kết nối internet";
    if (msg.includes("timeout")) return "Yêu cầu quá thời gian chờ, vui lòng thử lại";
  }

  // Default fallback
  return CLAIM_ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Get success message for claim operations
 */
export const CLAIM_SUCCESS_MESSAGES = {
  APPROVE: "Duyệt yêu cầu bồi thường thành công!",
  REJECT: "Từ chối yêu cầu bồi thường thành công!",
  CREATE: "Tạo yêu cầu bồi thường thành công!",
  UPDATE: "Cập nhật yêu cầu bồi thường thành công!",
  DELETE: "Xóa yêu cầu bồi thường thành công!",
};

/**
 * Rejection type labels in Vietnamese
 */
export const REJECTION_TYPE_LABELS = {
  claim_data_incorrect: "Dữ liệu không chính xác",
  trigger_not_met: "Không đạt điều kiện kích hoạt",
  policy_not_active: "Hợp đồng không còn hiệu lực",
  location_mismatch: "Vị trí không khớp",
  duplicate_claim: "Yêu cầu trùng lặp",
  suspected_fraud: "Nghi ngờ gian lận",
  other: "Lý do khác",
};
