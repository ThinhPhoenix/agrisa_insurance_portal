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
    REVOKED: "Đã hủy yêu cầu hủy hợp đồng thành công!",
  },

  ERROR: {
    // 400 Bad Request errors
    INVALID_REQUEST: "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại!",
    INVALID_UUID: "Mã hợp đồng hoặc mã yêu cầu không hợp lệ!",

    // 401 Unauthorized
    UNAUTHORIZED: "Bạn cần đăng nhập để thực hiện hành động này!",
    USER_ID_REQUIRED: "Bạn cần đăng nhập để thực hiện hành động này!",

    // Create / Review errors
    CREATE_FAILED: "Không thể tạo yêu cầu hủy. Vui lòng thử lại!",
    POLICY_NOT_STARTED:
      "Hợp đồng chưa phát hành nên không thể tính bồi thường. Vui lòng liên hệ bộ phận hỗ trợ!",
    POLICY_INVALID_STATUS:
      "Hợp đồng không ở trạng thái cho phép hủy! (Chỉ có thể hủy hợp đồng đang hoạt động)",
    INVALID_POLICY_STATUS: "Trạng thái hợp đồng không hợp lệ!",
    CANCEL_REQUEST_STATUS_INVALID:
      "Yêu cầu hủy không ở trạng thái cho phép xem xét!",

    RETRIEVAL_FAILED: "Không thể tải thông tin yêu cầu hủy. Vui lòng thử lại!",
    RETRIEVE_PARTNER_FAILED:
      "Không thể tải thông tin công ty. Vui lòng thử lại sau!",
    RETRIEVE_POLICY_FAILED:
      "Không thể tải thông tin hợp đồng. Vui lòng thử lại sau!",

    REVIEW_FAILED: "Xem xét yêu cầu hủy thất bại. Vui lòng thử lại!",
    CANNOT_REVIEW_OWN_REQUEST:
      "Bạn không thể xem xét yêu cầu do chính mình gửi!",
    REVIEWER_MISMATCH:
      "Chỉ người đã xem xét lần đầu mới có thể giải quyết tranh chấp!",

    // Resolve dispute errors
    RESOLVE_FAILED: "Giải quyết tranh chấp thất bại. Vui lòng thử lại!",
    RESOLVE_DISPUTE_FAILED: "Giải quyết tranh chấp thất bại. Vui lòng thử lại!",
    FINAL_DECISION_INVALID:
      "Quyết định cuối cùng không hợp lệ! Chỉ chấp nhận 'approved' hoặc từ chối 'denied'!",
    FINAL_DECISION_STATUS_INVALID:
      "Quyết định cuối cùng không hợp lệ! Chỉ chấp nhận 'approved' hoặc từ chối 'denied'!",
    CANNOT_RESOLVE_REQUEST:
      "Bạn không thể giải quyết yêu cầu này. Chỉ người đã xem xét ban đầu mới có thể giải quyết!",
    POLICY_NOT_IN_DISPUTE:
      "Hợp đồng không ở trạng thái tranh chấp nên không thể giải quyết!",
    NOT_IN_LITIGATION:
      "Yêu cầu hủy không ở trạng thái tranh chấp (litigation)!",

    // Transaction / Database errors
    TRANSACTION_BEGIN_FAILED: "Lỗi xử lý giao dịch. Vui lòng thử lại sau!",
    TRANSACTION_COMMIT_FAILED: "Lỗi lưu dữ liệu. Vui lòng thử lại sau!",
    DATABASE_UPDATE_FAILED: "Lỗi cập nhật dữ liệu. Vui lòng thử lại sau!",

    // Revoke errors
    REVOKE_FAILED: "Hủy bỏ yêu cầu thất bại. Vui lòng thử lại!",
    INVALID_REQUEST_STATUS: "Trạng thái yêu cầu không cho phép hủy bỏ!",

    // Image upload errors
    IMAGE_UPLOAD_FAILED: "Không thể tải hình ảnh lên. Vui lòng thử lại!",
    IMAGE_UPLOAD_TIMEOUT: "Tải hình ảnh bị quá thời gian. Vui lòng thử lại!",
    INVALID_IMAGE_FORMAT: "Định dạng hình ảnh không hợp lệ!",

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
    UPLOADING_IMAGES: "Đang tải hình ảnh lên...",
  },

  WARNING: {
    CONFIRM_CANCEL: "Bạn có chắc chắn muốn gửi yêu cầu hủy hợp đồng này?",
    CONFIRM_APPROVE: "Bạn có chắc chắn muốn chấp thuận hủy hợp đồng này?",
    CONFIRM_DENY: "Bạn có chắc chắn muốn từ chối yêu cầu hủy?",
    CANCEL_PENDING:
      "Hợp đồng này đang chờ xem xét yêu cầu hủy. Hành động này sẽ tạo một yêu cầu mới.",
    CONFIRM_REVOKE:
      "Bạn có chắc chắn muốn hủy yêu cầu hủy hợp đồng này?\n\nLưu ý: Sau khi hủy yêu cầu, mọi tranh chấp, mâu thuẫn hoặc hệ quả phát sinh giữa hai bên sẽ phải tự giải quyết.\nNền tảng sẽ không chịu trách nhiệm về bất kỳ hành vi, thiệt hại hoặc nghĩa vụ nào phát sinh từ quyết định này.",
  },
};

/**
 * Helper function để map BE error codes sang thông báo tiếng Việt
 * Xử lý các error từ tất cả cancel request APIs:
 * - POST /cancel_request (create)
 * - PUT /cancel_request/review/:id (approve/deny)
 * - PUT /cancel_request/resolve-dispute/:id (resolve dispute)
 */
export const mapBackendErrorToMessage = (errorCode, errorMessage) => {
  // Nếu error code khớp với key trong CANCEL_REQUEST_MESSAGES.ERROR
  if (CANCEL_REQUEST_MESSAGES.ERROR[errorCode]) {
    return CANCEL_REQUEST_MESSAGES.ERROR[errorCode];
  }

  // Nếu error message chứa các từ khóa, map sang thông báo tương ứng
  const messageLower = errorMessage?.toLowerCase() || "";

  // Create request errors
  if (
    messageLower.includes("policy haven't started") ||
    messageLower.includes("haven't been released")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.POLICY_NOT_STARTED;
  }
  if (messageLower.includes("invalid policy status")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.INVALID_POLICY_STATUS;
  }

  // Review errors
  if (messageLower.includes("cancel request status invalid")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.CANCEL_REQUEST_STATUS_INVALID;
  }
  if (
    messageLower.includes("cannot review your own request") ||
    messageLower.includes("cannot review own request")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.CANNOT_REVIEW_OWN_REQUEST;
  }

  // Resolve dispute errors
  if (
    messageLower.includes("final decision status invalid") ||
    messageLower.includes("final_decision") ||
    messageLower.includes("invalid final decision")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.FINAL_DECISION_STATUS_INVALID;
  }
  if (
    messageLower.includes("you can not resolve this request") ||
    messageLower.includes("can not resolve") ||
    messageLower.includes("cannot resolve this request")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.REVIEWER_MISMATCH;
  }
  if (
    messageLower.includes("cancel request status invalid") ||
    messageLower.includes("not in litigation") ||
    messageLower.includes("not in.*litigation") ||
    messageLower.includes("status.*invalid")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.NOT_IN_LITIGATION;
  }

  // Retrieval errors
  if (messageLower.includes("failed to retrieve insurance partner")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.RETRIEVE_PARTNER_FAILED;
  }
  if (messageLower.includes("failed to retrieve partner id")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.RETRIEVE_PARTNER_FAILED;
  }
  if (
    messageLower.includes("failed to retrieve") ||
    messageLower.includes("retrieval_failed")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.RETRIEVAL_FAILED;
  }
  if (
    messageLower.includes("error retriving policy") ||
    messageLower.includes("error retrieving policy") ||
    messageLower.includes("policy.*not.*found")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.RETRIEVE_POLICY_FAILED;
  }

  // Transaction errors
  if (
    messageLower.includes("error beginning transaction") ||
    messageLower.includes("begin transaction")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.TRANSACTION_BEGIN_FAILED;
  }
  if (
    messageLower.includes("error commiting transaction") ||
    messageLower.includes("error committing transaction") ||
    messageLower.includes("commit transaction")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.TRANSACTION_COMMIT_FAILED;
  }

  // Database update errors
  if (
    messageLower.includes("update.*error") ||
    messageLower.includes("error.*update")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.DATABASE_UPDATE_FAILED;
  }

  // Invalid request format
  if (
    messageLower.includes("invalid request") ||
    messageLower.includes("invalid_request")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.INVALID_REQUEST;
  }

  // Invalid UUID format
  if (
    messageLower.includes("invalid uuid") ||
    messageLower.includes("invalid.*uuid") ||
    messageLower.includes("uuid.*invalid")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.INVALID_UUID;
  }

  // Unauthorized / missing header
  if (
    messageLower.includes("unauthorized") ||
    messageLower.includes("user id required") ||
    messageLower.includes("missing") ||
    messageLower.includes("x-user-id")
  ) {
    return CANCEL_REQUEST_MESSAGES.ERROR.UNAUTHORIZED;
  }

  // Generic retrieval failure (catch-all for 500 RETRIEVAL_FAILED)
  if (messageLower.includes("failed to reviewing cancel request")) {
    return CANCEL_REQUEST_MESSAGES.ERROR.REVIEW_FAILED;
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
