/**
 * Policy Messages - Thông báo cho quy trình tạo và quản lý chính sách bảo hiểm
 */

export const POLICY_MESSAGES = {
  // BASE POLICY MESSAGES
  BASE_POLICY: {
    SUCCESS: {
      CREATED: "Tạo chính sách thành công!",
      UPDATED: "Cập nhật chính sách thành công!",
      DELETED: "Xóa chính sách thành công!",
      SAVED_DRAFT: "Lưu nháp chính sách thành công!",
    },

    ERROR: {
      // Backend error codes mapping - Base Policy validation (validateBasePolicy)
      INSURANCE_PROVIDER_ID_REQUIRED: "Vui lòng chọn nhà bảo hiểm!",
      PRODUCT_NAME_REQUIRED: "Vui lòng nhập tên sản phẩm!",
      PRODUCT_CODE_REQUIRED: "Vui lòng nhập mã sản phẩm!",
      CROP_TYPE_REQUIRED: "Vui lòng chọn loại cây trồng!",
      COVERAGE_CURRENCY_REQUIRED: "Vui lòng chọn đơn vị tiền tệ!",
      COVERAGE_DURATION_INVALID: "Thời hạn bảo hiểm phải lớn hơn 0 ngày!",

      // Premium validation
      FIX_PREMIUM_AMOUNT_NEGATIVE: "Phí bảo hiểm cố định không được âm!",
      PREMIUM_BASE_RATE_NEGATIVE: "Tỷ lệ phí cơ bản không được âm!",
      PREMIUM_BASE_RATE_REQUIRED:
        "Vui lòng nhập tỷ lệ phí cơ bản khi không có phí cố định!",

      // Payout validation
      FIX_PAYOUT_AMOUNT_NEGATIVE: "Số tiền chi trả cố định không được âm!",
      PAYOUT_BASE_RATE_NEGATIVE: "Tỷ lệ chi trả cơ bản không được âm!",
      PAYOUT_BASE_RATE_REQUIRED: "Vui lòng nhập tỷ lệ chi trả cơ bản!",
      OVER_THRESHOLD_MULTIPLIER_NEGATIVE:
        "Hệ số nhân vượt ngưỡng không được âm!",
      PAYOUT_CAP_NEGATIVE: "Giới hạn chi trả tối đa không được âm!",

      // Status validation
      INVALID_STATUS:
        "Trạng thái không hợp lệ! (Phải là: draft, active, hoặc archived)",
      INVALID_DOCUMENT_VALIDATION_STATUS:
        "Trạng thái xác thực tài liệu không hợp lệ! (Phải là: pending, passed, passed_ai, failed, hoặc warning)",

      // Dates validation
      ENROLLMENT_START_AFTER_END:
        "Ngày bắt đầu đăng ký phải trước ngày kết thúc!",
      INSURANCE_VALID_FROM_AFTER_TO:
        "Ngày bắt đầu hiệu lực phải trước ngày kết thúc!",
      ENROLLMENT_END_AFTER_VALID_FROM:
        "Ngày kết thúc đăng ký phải trước hoặc bằng ngày bắt đầu hiệu lực!",

      // Cancel rate validation
      CANCEL_PREMIUM_RATE_INVALID: "Tỷ lệ phí hủy phải từ 0 đến 1 (0% - 100%)!",
      RENEWAL_DISCOUNT_RATE_INVALID:
        "Tỷ lệ giảm giá gia hạn phải từ 0 đến 1 (0% - 100%)!",

      // Document validation
      POLICY_DOCUMENT_DATA_INVALID:
        "Dữ liệu tài liệu không hợp lệ! Phải là chuỗi base64.",
      POLICY_DOCUMENT_NAME_REQUIRED: "Vui lòng nhập tên tài liệu!",
      POLICY_DOCUMENT_TOO_LARGE: "Kích thước tài liệu quá lớn! (Tối đa 10MB)",

      // Server errors
      CREATION_FAILED: "Tạo chính sách thất bại. Vui lòng thử lại!",
      PRODUCT_CODE_EXISTS: "Mã sản phẩm đã tồn tại! Vui lòng sử dụng mã khác.",
      SERVER_ERROR: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau!",
      SERIALIZATION_FAILED: "Lỗi xử lý dữ liệu. Vui lòng thử lại!",

      // Field format validation
      PRODUCT_CODE_INVALID_FORMAT:
        "Mã sản phẩm chỉ chứa chữ hoa, số và dấu gạch dưới!",
      CURRENCY_INVALID: "Mã tiền tệ không hợp lệ! (VD: VND, USD, EUR)",
    },

    VALIDATION: {
      PRODUCT_NAME_MIN_LENGTH: "Tên sản phẩm phải có ít nhất 3 ký tự!",
      PRODUCT_CODE_FORMAT:
        "Mã sản phẩm chỉ được chứa chữ hoa, số và dấu gạch dưới (_)!",
      COVERAGE_DURATION_MIN: "Thời hạn bảo hiểm tối thiểu là 1 ngày!",
      IS_PER_HECTARE_REQUIRED: "Vui lòng chọn cách tính phí theo diện tích!",
      IS_PAYOUT_PER_HECTARE_REQUIRED:
        "Vui lòng chọn cách tính chi trả theo diện tích!",
      INSURANCE_VALID_FROM_REQUIRED:
        "Vui lòng chọn ngày bắt đầu hiệu lực (bắt buộc)!",
      INSURANCE_VALID_TO_REQUIRED:
        "Vui lòng chọn ngày kết thúc hiệu lực (bắt buộc)!",
    },

    INFO: {
      CREATING: "Đang tạo chính sách...",
      VALIDATING: "Đang kiểm tra dữ liệu...",
      SAVING: "Đang lưu...",
      AUTO_FILLED: "Một số trường đã được tự động điền!",
    },

    WARNING: {
      NO_DATA_SOURCE: "Chưa có nguồn dữ liệu nào được chọn!",
      MISSING_PREMIUM_RATE:
        "Cần nhập tỷ lệ phí cơ bản khi không có phí cố định!",
      PAYOUT_CAP_LOWER_THAN_FIX:
        "Giới hạn chi trả thấp hơn số tiền chi trả cố định!",
    },
  },

  // TRIGGER MESSAGES
  TRIGGER: {
    SUCCESS: {
      CREATED: "Tạo cấu hình trigger thành công!",
      UPDATED: "Cập nhật trigger thành công!",
    },

    ERROR: {
      // Backend error codes mapping - Trigger validation (validateBasePolicyTrigger)
      INVALID_LOGICAL_OPERATOR:
        "Toán tử logic không hợp lệ! (Phải là AND hoặc OR)",
      MONITOR_INTERVAL_INVALID: "Khoảng thời gian giám sát phải lớn hơn 0!",
      INVALID_MONITOR_FREQUENCY_UNIT:
        "Đơn vị thời gian không hợp lệ! (Phải là: hour, day, week, month, year)",
      BLACKOUT_PERIODS_INVALID: "Khoảng thời gian không giám sát không hợp lệ!",
      BLACKOUT_PERIODS_OVERLAP:
        "Các khoảng thời gian không giám sát không được trùng lặp!",
    },

    VALIDATION: {
      LOGICAL_OPERATOR_REQUIRED: "Vui lòng chọn toán tử logic!",
      MONITOR_INTERVAL_REQUIRED: "Vui lòng nhập khoảng thời gian giám sát!",
      MONITOR_FREQUENCY_UNIT_REQUIRED: "Vui lòng chọn đơn vị thời gian!",
      MONITOR_INTERVAL_MIN: "Khoảng thời gian giám sát tối thiểu là 1!",
    },

    INFO: {
      CONFIGURING: "Đang cấu hình trigger...",
    },
  },

  // CONDITION MESSAGES
  CONDITION: {
    SUCCESS: {
      ADDED: "Thêm điều kiện thành công!",
      UPDATED: "Cập nhật điều kiện thành công!",
      REMOVED: "Xóa điều kiện thành công!",
    },

    ERROR: {
      // Backend error codes mapping - Condition validation (validateBasePolicyTriggerCondition)
      BASE_POLICY_TRIGGER_ID_REQUIRED: "Thiếu liên kết với trigger!",
      DATA_SOURCE_ID_REQUIRED: "Vui lòng chọn nguồn dữ liệu!",
      INVALID_THRESHOLD_OPERATOR:
        "Toán tử ngưỡng không hợp lệ! (Phải là: <, >, <=, >=, ==, !=, change_gt, change_lt)",
      INVALID_AGGREGATION_FUNCTION:
        "Hàm tổng hợp không hợp lệ! (Phải là: sum, avg, min, max, change)",
      AGGREGATION_WINDOW_DAYS_INVALID: "Cửa sổ tổng hợp phải lớn hơn 0 ngày!",
      VALIDATION_WINDOW_DAYS_INVALID: "Cửa sổ kiểm tra phải lớn hơn 0 ngày!",
      BASE_COST_NEGATIVE: "Chi phí cơ sở không được âm!",
      CATEGORY_MULTIPLIER_INVALID: "Hệ số nhóm phải lớn hơn 0!",
      TIER_MULTIPLIER_INVALID: "Hệ số tier phải lớn hơn 0!",
      CALCULATED_COST_NEGATIVE: "Chi phí đã tính không được âm!",

      // Data source validation errors
      DATA_SOURCE_NOT_EXIST:
        "Nguồn dữ liệu không tồn tại hoặc chưa được kích hoạt!",
      DATA_BASE_COST_MISMATCH: "Chi phí cơ sở không khớp với nguồn dữ liệu!",
      DATA_TIER_RETRIEVE_ERROR: "Lỗi khi lấy thông tin data tier!",
      DATA_TIER_MULTIPLIER_MISMATCH: "Hệ số tier không khớp!",
      DATA_TIER_CATEGORY_RETRIEVE_ERROR: "Lỗi khi lấy thông tin danh mục tier!",
      DATA_TIER_CATEGORY_MULTIPLIER_MISMATCH: "Hệ số danh mục không khớp!",
      TOTAL_COST_MISMATCH: "Chi phí tổng không khớp với công thức tính!",

      // Condition specific validation
      DATA_SOURCE_ALREADY_USED:
        "Nguồn dữ liệu này đã được sử dụng trong điều kiện khác!",
      BASELINE_FUNCTION_REQUIRED:
        "Vui lòng chọn hàm baseline khi đã nhập cửa sổ baseline!",
      BASELINE_WINDOW_TOO_SMALL:
        "Cửa sổ baseline nên lớn hơn hoặc bằng cửa sổ tổng hợp!",
    },

    VALIDATION: {
      DATA_SOURCE_ID_REQUIRED: "Vui lòng chọn nguồn dữ liệu!",
      THRESHOLD_OPERATOR_REQUIRED: "Vui lòng chọn toán tử ngưỡng!",
      THRESHOLD_VALUE_REQUIRED: "Vui lòng nhập giá trị ngưỡng!",
      AGGREGATION_FUNCTION_REQUIRED: "Vui lòng chọn hàm tổng hợp!",
      AGGREGATION_WINDOW_DAYS_REQUIRED: "Vui lòng nhập cửa sổ tổng hợp!",
      AGGREGATION_WINDOW_DAYS_MIN: "Cửa sổ tổng hợp tối thiểu là 1 ngày!",
      EARLY_WARNING_THRESHOLD_MIN: "Ngưỡng cảnh báo sớm phải >= 0!",
      VALIDATION_WINDOW_DAYS_MIN: "Cửa sổ kiểm tra tối thiểu là 1 ngày!",
      CONDITION_ORDER_MIN: "Thứ tự điều kiện tối thiểu là 1!",
      BASELINE_WINDOW_DAYS_MIN: "Cửa sổ baseline tối thiểu là 1 ngày!",
    },

    INFO: {
      ADDING: "Đang thêm điều kiện...",
      UPDATING: "Đang cập nhật điều kiện...",
      CALCULATING_COST: "Đang tính chi phí...",
    },

    WARNING: {
      NO_CONDITIONS: "Chưa có điều kiện nào được tạo!",
      BASELINE_WITHOUT_WINDOW:
        "Đã chọn hàm baseline nhưng chưa nhập cửa sổ baseline!",
    },
  },

  // GENERAL MESSAGES
  GENERAL: {
    SUCCESS: {
      OPERATION_COMPLETE: "Thao tác hoàn tất!",
    },

    ERROR: {
      // Transaction errors
      TRANSACTION_BEGIN_FAILED: "Không thể bắt đầu giao dịch!",
      TRANSACTION_COMMIT_FAILED: "Lỗi khi hoàn tất giao dịch!",

      // Policy data validation
      POLICY_DATA_NIL: "Dữ liệu chính sách rỗng!",
      BASE_POLICY_NIL: "Thiếu thông tin cơ bản của chính sách!",
      BASE_POLICY_VALIDATION_FAILED: "Kiểm tra thông tin cơ bản thất bại!",
      TRIGGER_VALIDATION_FAILED: "Kiểm tra cấu hình trigger thất bại!",
      TRIGGER_NOT_LINKED: "Trigger chưa được liên kết với chính sách!",
      CONDITION_VALIDATION_FAILED: "Kiểm tra điều kiện thất bại!",
      CONDITION_NOT_LINKED: "Điều kiện chưa được liên kết với trigger!",

      // Repository errors
      FAILED_TO_CREATE_BASE_POLICY: "Lỗi khi tạo chính sách cơ bản!",
      FAILED_TO_CREATE_TRIGGER: "Lỗi khi tạo trigger!",
      FAILED_TO_CREATE_CONDITION: "Lỗi khi tạo điều kiện!",
      FAILED_TO_CREATE_BATCH_CONDITION: "Lỗi khi tạo hàng loạt điều kiện!",

      // Serialization errors
      BASE_POLICY_SERIALIZATION_FAILED: "Lỗi xử lý dữ liệu chính sách!",
      TRIGGER_SERIALIZATION_FAILED: "Lỗi xử lý dữ liệu trigger!",
      CONDITION_SERIALIZATION_FAILED: "Lỗi xử lý dữ liệu điều kiện!",
      CONDITION_STORAGE_FAILED: "Lỗi lưu trữ điều kiện!",
      RESPONSE_METADATA_STORAGE_FAILED: "Lỗi lưu trữ metadata phản hồi!",

      // Generic errors
      VALIDATION_ERROR: "Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại!",
      NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối!",
      UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định!",
    },

    INFO: {
      LOADING: "Đang tải...",
      PROCESSING: "Đang xử lý...",
      PLEASE_WAIT: "Vui lòng đợi...",
    },

    WARNING: {
      UNSAVED_CHANGES: "Có thay đổi chưa được lưu!",
      CONFIRM_DELETE: "Bạn có chắc chắn muốn xóa?",
    },
  },
};

/**
 * Helper functions để dễ sử dụng
 */

// Base Policy helpers
export const getBasePolicyMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.BASE_POLICY[type];
  if (!category || !category[key]) {
    return `Base policy message not found: BASE_POLICY.${type}.${key}`;
  }

  let message = category[key];

  // Replace parameters
  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getBasePolicySuccess = (key, params = {}) =>
  getBasePolicyMessage("SUCCESS", key, params);
export const getBasePolicyError = (key, params = {}) =>
  getBasePolicyMessage("ERROR", key, params);
export const getBasePolicyValidation = (key, params = {}) =>
  getBasePolicyMessage("VALIDATION", key, params);
export const getBasePolicyInfo = (key, params = {}) =>
  getBasePolicyMessage("INFO", key, params);
export const getBasePolicyWarning = (key, params = {}) =>
  getBasePolicyMessage("WARNING", key, params);

// Trigger helpers
export const getTriggerMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.TRIGGER[type];
  if (!category || !category[key]) {
    return `Trigger message not found: TRIGGER.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getTriggerSuccess = (key, params = {}) =>
  getTriggerMessage("SUCCESS", key, params);
export const getTriggerError = (key, params = {}) =>
  getTriggerMessage("ERROR", key, params);
export const getTriggerValidation = (key, params = {}) =>
  getTriggerMessage("VALIDATION", key, params);
export const getTriggerInfo = (key, params = {}) =>
  getTriggerMessage("INFO", key, params);

// Condition helpers
export const getConditionMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.CONDITION[type];
  if (!category || !category[key]) {
    return `Condition message not found: CONDITION.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getConditionSuccess = (key, params = {}) =>
  getConditionMessage("SUCCESS", key, params);
export const getConditionError = (key, params = {}) =>
  getConditionMessage("ERROR", key, params);
export const getConditionValidation = (key, params = {}) =>
  getConditionMessage("VALIDATION", key, params);
export const getConditionInfo = (key, params = {}) =>
  getConditionMessage("INFO", key, params);
export const getConditionWarning = (key, params = {}) =>
  getConditionMessage("WARNING", key, params);

// General helpers
export const getGeneralMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.GENERAL[type];
  if (!category || !category[key]) {
    return `General message not found: GENERAL.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getGeneralSuccess = (key, params = {}) =>
  getGeneralMessage("SUCCESS", key, params);
export const getGeneralError = (key, params = {}) =>
  getGeneralMessage("ERROR", key, params);
export const getGeneralInfo = (key, params = {}) =>
  getGeneralMessage("INFO", key, params);
export const getGeneralWarning = (key, params = {}) =>
  getGeneralMessage("WARNING", key, params);

// Default export
export default POLICY_MESSAGES;
