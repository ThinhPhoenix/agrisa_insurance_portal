/**
 * Profile & Partner Deletion Request Messages
 * Vietnamese error and success messages for profile and deletion request operations
 */

// Partner Deletion Request - Success Messages
export const DELETION_REQUEST_SUCCESS = {
  CREATE_SUCCESS: "Yêu cầu hủy hồ sơ đã được gửi thành công",
  REVOKE_SUCCESS: "Đã hủy yêu cầu xóa hồ sơ thành công",
  FETCH_SUCCESS: "Tải danh sách yêu cầu thành công",
};

// Partner Deletion Request - Error Messages
export const DELETION_REQUEST_ERROR = {
  // Create Deletion Request Errors
  INVALID_PAYLOAD:
    "Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin",
  USER_NOT_FOUND: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại",
  NOT_PARTNER_ADMIN:
    "Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên đối tác mới có thể yêu cầu hủy hồ sơ",
  PENDING_REQUEST_EXISTS:
    "Đã có một yêu cầu hủy hồ sơ đang chờ xử lý. Vui lòng hủy yêu cầu cũ hoặc đợi quản trị viên xử lý",
  CREATE_FAILED: "Không thể tạo yêu cầu hủy hồ sơ. Vui lòng thử lại sau",

  // Revoke Deletion Request Errors
  REQUEST_ID_REQUIRED: "Mã yêu cầu là bắt buộc",
  REQUEST_ID_INVALID: "Mã yêu cầu không hợp lệ",
  NO_PERMISSION_TO_REVOKE:
    "Bạn không có quyền hủy yêu cầu này. Chỉ người tạo yêu cầu mới có thể hủy",
  REQUEST_NOT_FOUND:
    "Không tìm thấy yêu cầu hủy hồ sơ. Yêu cầu có thể đã bị xóa hoặc không tồn tại",
  ONLY_PENDING_CAN_REVOKE:
    "Chỉ có thể hủy các yêu cầu đang chờ xử lý. Yêu cầu này đã được xử lý hoặc đã hủy",
  REVOKE_TIME_EXPIRED:
    "Đã hết thời gian hủy yêu cầu. Yêu cầu của bạn đang được quản trị viên xem xét",
  REVOKE_FAILED: "Không thể hủy yêu cầu. Vui lòng thử lại sau",

  // Get Deletion Requests Errors
  FETCH_FAILED: "Không thể tải danh sách yêu cầu hủy hồ sơ",
  NO_REQUESTS_FOUND: "Không tìm thấy yêu cầu hủy hồ sơ nào",

  // General Errors
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet",
  SERVER_ERROR:
    "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên",
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định. Vui lòng thử lại",
};

// Partner Deletion Request - Validation Messages
export const DELETION_REQUEST_VALIDATION = {
  EXPLANATION_TOO_LONG: "Lý do phải có độ dài từ 1 đến 1000 ký tự",
  EXPLANATION_INVALID: "Lý do không hợp lệ",
  REQUEST_ID_FORMAT_INVALID: "Định dạng mã yêu cầu không hợp lệ",
};

/**
 * Get deletion request success message by key
 * @param {string} key - Message key from DELETION_REQUEST_SUCCESS
 * @returns {string} Vietnamese success message
 */
export const getDeletionRequestSuccess = (key) => {
  return DELETION_REQUEST_SUCCESS[key] || "Thao tác thành công";
};

/**
 * Get deletion request error message by key
 * @param {string} key - Message key from DELETION_REQUEST_ERROR
 * @returns {string} Vietnamese error message
 */
export const getDeletionRequestError = (key) => {
  return DELETION_REQUEST_ERROR[key] || DELETION_REQUEST_ERROR.UNKNOWN_ERROR;
};

/**
 * Get deletion request validation message by key
 * @param {string} key - Message key from DELETION_REQUEST_VALIDATION
 * @returns {string} Vietnamese validation message
 */
export const getDeletionRequestValidation = (key) => {
  return (
    DELETION_REQUEST_VALIDATION[key] ||
    "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại"
  );
};

/**
 * Map backend error to Vietnamese message
 * @param {object} error - Axios error object
 * @returns {string} Vietnamese error message
 */
export const mapDeletionRequestError = (error) => {
  // Network errors
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return DELETION_REQUEST_ERROR.NETWORK_ERROR;
    }
    return DELETION_REQUEST_ERROR.NETWORK_ERROR;
  }

  const status = error.response?.status;
  const errorCode = error.response?.data?.error_code;
  const message = error.response?.data?.message;

  // Map by HTTP status code
  switch (status) {
    case 400:
      // Bad Request - check specific messages
      if (message?.includes("RequestID")) {
        return DELETION_REQUEST_ERROR.REQUEST_ID_REQUIRED;
      }
      if (message?.includes("payload")) {
        return DELETION_REQUEST_ERROR.INVALID_PAYLOAD;
      }
      if (message?.includes("Lý do")) {
        return DELETION_REQUEST_VALIDATION.EXPLANATION_TOO_LONG;
      }
      return DELETION_REQUEST_ERROR.INVALID_PAYLOAD;

    case 401:
      return DELETION_REQUEST_ERROR.UNAUTHORIZED;

    case 403:
      // Forbidden - check specific messages
      if (message?.includes("không có quyền hủy")) {
        return DELETION_REQUEST_ERROR.NO_PERMISSION_TO_REVOKE;
      }
      if (message?.includes("insurance partner")) {
        return DELETION_REQUEST_ERROR.NOT_PARTNER_ADMIN;
      }
      return DELETION_REQUEST_ERROR.FORBIDDEN;

    case 404:
      return DELETION_REQUEST_ERROR.REQUEST_NOT_FOUND;

    case 409:
      // Conflict - check specific messages
      if (message?.includes("pending deletion request already exists")) {
        return DELETION_REQUEST_ERROR.PENDING_REQUEST_EXISTS;
      }
      if (message?.includes("đang chờ xử lý mới có thể bị hủy")) {
        return DELETION_REQUEST_ERROR.ONLY_PENDING_CAN_REVOKE;
      }
      return DELETION_REQUEST_ERROR.PENDING_REQUEST_EXISTS;

    case 422:
      // Unprocessable Entity - time-based errors
      if (message?.includes("sau thời gian có thể hủy")) {
        return DELETION_REQUEST_ERROR.REVOKE_TIME_EXPIRED;
      }
      return DELETION_REQUEST_ERROR.REVOKE_TIME_EXPIRED;

    case 500:
      return DELETION_REQUEST_ERROR.SERVER_ERROR;

    default:
      return DELETION_REQUEST_ERROR.UNKNOWN_ERROR;
  }
};
