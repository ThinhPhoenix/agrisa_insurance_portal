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
      CANCELLED_KEEP_POLICIES:
        "Huỷ chính sách thành công! Các hợp đồng đã ký sẽ được giữ nguyên.",
      CANCELLED_WITH_COMPENSATION:
        "Huỷ chính sách thành công! Thông báo bồi thường đã được gửi đến nông dân.",
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
      FIX_PREMIUM_AMOUNT_REQUIRED: "Vui lòng nhập phí bảo hiểm cố định!",
      FIX_PREMIUM_AMOUNT_NEGATIVE: "Phí bảo hiểm cố định không được âm!",
      PREMIUM_BASE_RATE_NEGATIVE: "Tỷ lệ phí cơ bản không được âm!",
      PREMIUM_BASE_RATE_MUST_POSITIVE: "Tỷ lệ phí cơ bản phải lớn hơn 0!",
      PREMIUM_BASE_RATE_REQUIRED:
        "Vui lòng nhập tỷ lệ phí cơ bản khi không có phí cố định!",

      // Payout validation
      FIX_PAYOUT_AMOUNT_REQUIRED: "Vui lòng nhập số tiền bồi thường cố định!",
      FIX_PAYOUT_AMOUNT_NEGATIVE: "Số tiền chi trả cố định không được âm!",
      PAYOUT_BASE_RATE_NEGATIVE: "Tỷ lệ chi trả cơ bản không được âm!",
      PAYOUT_BASE_RATE_MUST_POSITIVE: "Tỷ lệ chi trả cơ bản phải lớn hơn 0!",
      PAYOUT_BASE_RATE_REQUIRED: "Vui lòng nhập tỷ lệ chi trả cơ bản!",
      OVER_THRESHOLD_MULTIPLIER_NEGATIVE:
        "Hệ số nhân vượt ngưỡng không được âm!",
      OVER_THRESHOLD_MULTIPLIER_MUST_POSITIVE:
        "Hệ số nhân vượt ngưỡng phải lớn hơn 0!",
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

      // Cancel policy errors
      CANCEL_INVALID_ID: "ID chính sách không hợp lệ!",
      CANCEL_INVALID_UUID_FORMAT:
        "Định dạng ID chính sách không hợp lệ (phải là UUID)!",
      CANCEL_INVALID_PARAMETER:
        "Tham số keep_registered_policy không hợp lệ (phải là true hoặc false)!",
      CANCEL_UNAUTHORIZED: "Bạn không có quyền huỷ chính sách này!",
      CANCEL_FAILED: "Huỷ chính sách thất bại. Vui lòng thử lại!",
      CANCEL_POLICY_NOT_ACTIVE:
        "Chỉ có thể huỷ chính sách đang hoạt động (active)!",

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
      CANCELLING: "Đang huỷ chính sách...",
    },

    WARNING: {
      NO_DATA_SOURCE: "Chưa có nguồn dữ liệu nào được chọn!",
      MISSING_PREMIUM_RATE:
        "Cần nhập tỷ lệ phí cơ bản khi không có phí cố định!",
      PAYOUT_CAP_LOWER_THAN_FIX:
        "Giới hạn chi trả thấp hơn số tiền chi trả cố định!",
      CANCEL_CONFIRM: "Huỷ chính sách này sẽ không thể hoàn tác. Tiếp tục?",
      CANCEL_KEEP_POLICIES_CONFIRM:
        "Huỷ chính sách nhưng giữ nguyên các hợp đồng đã ký cho nông dân. Tiếp tục?",
      CANCEL_WITH_COMPENSATION_CONFIRM:
        "Huỷ chính sách và huỷ các hợp đồng đã ký với bồi thường. Nông dân sẽ nhận được thông báo bồi thường. Tiếp tục?",
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
      CATEGORY_MULTIPLIER_MUST_POSITIVE: "Hệ số nhóm phải lớn hơn 0!",
      TIER_MULTIPLIER_INVALID: "Hệ số tier phải lớn hơn 0!",
      TIER_MULTIPLIER_MUST_POSITIVE: "Hệ số tier phải lớn hơn 0!",
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

  // PDF & DOCUMENT MESSAGES
  PDF: {
    SUCCESS: {
      UPLOADED: "Tải tài liệu PDF thành công!",
      ANALYZED: "Phân tích tài liệu PDF thành công!",
      PLACEHOLDER_DETECTED: "Phát hiện {count} vị trí cần điền trong PDF!",
      FILLABLE_CREATED: "Tạo PDF có thể điền thành công!",
      APPLIED_TO_PDF: "Áp dụng thay đổi vào PDF thành công!",
      DOWNLOADED: "Tải xuống PDF thành công!",
      REMOVED: "Xóa tài liệu thành công!",
      REBUILT: "Rebuild PDF thành công!",
    },

    ERROR: {
      UPLOAD_FAILED: "Tải lên PDF thất bại. Vui lòng thử lại!",
      FILE_TOO_LARGE:
        "File PDF quá lớn! Vui lòng chọn file nhỏ hơn {maxSize}MB.",
      INVALID_FILE_TYPE: "Chỉ chấp nhận file PDF!",
      FILE_CORRUPTED: "File PDF bị lỗi hoặc không đọc được!",
      ANALYSIS_FAILED: "Phân tích PDF thất bại. Vui lòng kiểm tra file!",
      NO_PLACEHOLDER_FOUND: "Không tìm thấy vị trí cần điền trong PDF!",
      FILLABLE_CREATION_FAILED: "Không thể tạo PDF có thể điền!",
      APPLY_FAILED: "Áp dụng thay đổi vào PDF thất bại!",
      FONT_LOAD_FAILED: "Không thể tải font tiếng Việt cho PDF!",
      REBUILD_FAILED: "Tải lai PDF thất bại!",
      FILE_NOT_FOUND: "Không tìm thấy file PDF!",
      PREVIEW_UNAVAILABLE: "Chức năng xem trước chưa sẵn sàng!",
    },

    VALIDATION: {
      FILE_REQUIRED: "Vui lòng chọn file PDF!",
      POSITION_REQUIRED: "Vui lòng chọn vị trí trên PDF!",
      POSITION_DUPLICATE: "Vị trí này đã tồn tại!",
    },

    INFO: {
      UPLOADING: "Đang tải lên PDF...",
      ANALYZING: "Đang phân tích PDF...",
      CREATING_FILLABLE: "Đang tạo PDF có thể điền...",
      APPLYING: "Đang áp dụng thay đổi...",
      REBUILDING: "Đang rebuild PDF...",
      PROCESSING: "Đang xử lý PDF...",
    },

    WARNING: {
      SIZE_WARNING:
        "PDF sau chỉnh sửa có kích thước lớn ({size} MB). Có thể gây lỗi khi gửi!",
      COMPRESS_RECOMMENDED: "Nên nén PDF gốc trước khi upload!",
      NO_FILE: "Chưa có file PDF nào được tải lên!",
      MODIFIED_PDF_LARGE: "PDF đã chỉnh sửa có kích thước lớn hơn bình thường!",
    },
  },

  // TAGS & PLACEHOLDERS MESSAGES
  TAGS: {
    SUCCESS: {
      ADDED: "Thêm trường thông tin thành công!",
      UPDATED: "Cập nhật trường thông tin thành công!",
      REMOVED: "Xóa trường thông tin thành công!",
      MAPPED: "Map trường thông tin thành công!",
      BATCH_CREATED: "Tạo {count} trường thông tin thành công!",
      APPLIED: "Áp dụng {count} trường thành công!",
    },

    ERROR: {
      KEY_REQUIRED: "Vui lòng nhập tên trường (key)!",
      KEY_DUPLICATE: "Tên trường này đã tồn tại!",
      KEY_INVALID_FORMAT:
        "Tên trường chỉ chứa chữ, số và dấu gạch dưới, bắt đầu bằng chữ!",
      DATA_TYPE_REQUIRED: "Vui lòng chọn loại dữ liệu!",
      VALUE_INVALID: "Giá trị không hợp lệ cho loại dữ liệu này!",
      SELECT_OPTIONS_REQUIRED: "Phải có ít nhất 2 tùy chọn cho loại select!",
      TAG_NOT_FOUND: "Không tìm thấy trường thông tin!",
      CREATION_FAILED: "Tạo trường thông tin thất bại!",
    },

    VALIDATION: {
      KEY_MIN_LENGTH: "Tên trường phải có ít nhất 2 ký tự!",
      KEY_MAX_LENGTH: "Tên trường không được vượt quá 50 ký tự!",
      KEY_FORMAT: "Tên trường chỉ chứa chữ thường, số và dấu gạch dưới!",
      VALUE_REQUIRED: "Vui lòng nhập giá trị!",
      INTEGER_REQUIRED: "Giá trị phải là số nguyên!",
      DECIMAL_REQUIRED: "Giá trị phải là số thực!",
      DATE_REQUIRED: "Vui lòng chọn ngày!",
    },

    INFO: {
      ADDING: "Đang thêm trường thông tin...",
      UPDATING: "Đang cập nhật...",
      MAPPING: "Đang map với vị trí PDF...",
      TOTAL_TAGS: "Tổng số trường: {count}",
    },

    WARNING: {
      NO_TAGS: "Chưa có trường thông tin nào được tạo!",
      NO_MAPPING: "Chưa có mapping nào để áp dụng!",
      UNMAPPED_PLACEHOLDERS: "Còn {count} vị trí chưa được map!",
    },
  },

  // PLACEHOLDER MESSAGES
  PLACEHOLDER: {
    SUCCESS: {
      CREATED: "Tạo vị trí placeholder thành công!",
      DELETED: "Xóa vị trí placeholder thành công!",
      MAPPED: "Map placeholder với tag thành công!",
      APPLIED_TO_PDF: "Áp dụng vào PDF thành công!",
    },

    ERROR: {
      POSITION_REQUIRED: "Vui lòng nhập số vị trí!",
      POSITION_INVALID: "Số vị trí không hợp lệ!",
      POSITION_DUPLICATE: "Vị trí ({position}) đã tồn tại!",
      NO_SELECTION: "Vui lòng chọn vùng trên PDF!",
      MAPPING_FAILED: "Map placeholder thất bại!",
      DELETE_FAILED: "Xóa placeholder thất bại!",
      NO_PLACEHOLDER_SELECTED: "Vui lòng chọn ít nhất một vị trí!",
    },

    VALIDATION: {
      POSITION_MIN: "Số vị trí phải lớn hơn 0!",
      POSITION_FORMAT: "Vui lòng nhập số nguyên dương!",
      AREA_REQUIRED: "Vui lòng kéo thả để chọn vùng trên PDF!",
    },

    INFO: {
      DRAG_TO_SELECT: "Kéo thả trên PDF để chọn vùng placeholder...",
      ENTER_POSITION: "Nhập số vị trí cho placeholder...",
      CREATING: "Đang tạo placeholder...",
      DELETING: "Đang xóa placeholder...",
      TOTAL_MAPPED: "{mapped}/{total} vị trí đã được map",
      TOTAL_APPLIED: "{applied}/{total} vị trí đã được áp dụng",
    },

    WARNING: {
      WILL_REBUILD_PDF: "Xóa vị trí này sẽ rebuild PDF. Bạn có chắc không?",
      ALREADY_APPLIED: "Vị trí này đã được áp dụng vào PDF!",
      NO_TAG_MAPPED: "Vị trí này chưa được map với tag nào!",
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

  // APPROVAL & UNDERWRITING MESSAGES
  APPROVAL: {
    SUCCESS: {
      APPROVED: "Chấp thuận đơn bảo hiểm thành công!",
      REJECTED: "Từ chối đơn bảo hiểm thành công!",
      POLICY_LOADED: "Tải thông tin đơn bảo hiểm thành công!",
    },

    ERROR: {
      LOAD_FAILED: "Không thể tải thông tin đơn bảo hiểm!",
      LOAD_LIST_FAILED: "Không thể tải danh sách đơn bảo hiểm!",
      APPROVE_FAILED: "Chấp thuận đơn bảo hiểm thất bại!",
      REJECT_FAILED: "Từ chối đơn bảo hiểm thất bại!",
      UNAUTHORIZED_ACCESS: "Truy cập bị từ chối!",
      UNAUTHORIZED_APPROVE:
        "Bạn không có quyền duyệt đơn này. Vi phạm bảo mật!",
      POLICY_NOT_FOUND: "Không tìm thấy đơn bảo hiểm!",
      FARM_NOT_FOUND: "Không tìm thấy thông tin trang trại!",
      INVALID_STATUS: "Trạng thái đơn bảo hiểm không hợp lệ!",
      REASON_REQUIRED: "Vui lòng nhập lý do từ chối!",
      USER_DATA_PARSE_FAILED: "Lỗi xác thực người dùng",
      USER_DATA_NOT_FOUND: "Không tìm thấy thông tin người dùng",
    },

    INFO: {
      LOADING_POLICY: "Đang tải thông tin đơn bảo hiểm...",
      LOADING_LIST: "Đang tải danh sách đơn bảo hiểm...",
      PROCESSING_APPROVAL: "Đang xử lý chấp thuận...",
      PROCESSING_REJECTION: "Đang xử lý từ chối...",
    },

    WARNING: {
      CONFIRM_APPROVE: "Bạn có chắc chắn muốn chấp thuận đơn bảo hiểm này?",
      CONFIRM_REJECT: "Bạn có chắc chắn muốn từ chối đơn bảo hiểm này?",
      NO_RISK_ANALYSIS:
        "Không thể thực hiện quyết định khi chưa có đánh giá rủi ro. Vui lòng tạo ít nhất một bản đánh giá rủi ro trước.",
      DECISION_REQUIRES_RISK_ANALYSIS:
        "Cần có ít nhất một bản đánh giá rủi ro để thực hiện quyết định",
    },
  },

  // RISK ANALYSIS MESSAGES
  RISK_ANALYSIS: {
    SUCCESS: {
      CREATED: "Tạo đánh giá rủi ro thành công!",
      UPDATED: "Cập nhật đánh giá rủi ro thành công!",
      LOADED: "Tải đánh giá rủi ro thành công!",
    },

    ERROR: {
      LOAD_FAILED: "Không thể tải đánh giá rủi ro!",
      CREATE_FAILED: "Tạo đánh giá rủi ro thất bại!",
      UPDATE_FAILED: "Cập nhật đánh giá rủi ro thất bại!",
      NOT_FOUND: "Không tìm thấy đánh giá rủi ro!",
      REGISTERED_POLICY_ID_REQUIRED: "Thiếu mã hợp đồng đã đăng ký!",
      ANALYSIS_STATUS_REQUIRED: "Vui lòng chọn trạng thái phân tích!",
      ANALYSIS_TYPE_REQUIRED: "Vui lòng chọn loại phân tích!",
      INVALID_RISK_SCORE:
        "Điểm số rủi ro không hợp lệ (phải từ 0-1 hoặc 0-100)!",
    },

    INFO: {
      LOADING: "Đang tải đánh giá rủi ro...",
      CREATING: "Đang tạo đánh giá rủi ro...",
      PROCESSING: "Đang xử lý đánh giá rủi ro...",
    },

    WARNING: {
      NO_RISK_ANALYSIS: "Chưa có đánh giá rủi ro",
      NO_RISK_ANALYSIS_DESCRIPTION:
        "Đơn bảo hiểm này chưa có bản đánh giá rủi ro nào. Bạn cần phải có ít nhất một bản đánh giá rủi ro trước khi có thể thực hiện quyết định (chấp thuận hoặc từ chối).",
      AUTO_OR_MANUAL:
        "Hệ thống sẽ tự động tạo đánh giá rủi ro bằng AI, hoặc bạn có thể tạo đánh giá rủi ro thủ công ngay bây giờ.",
      CONFIRM_CREATE: "Bạn có chắc chắn muốn tạo đánh giá rủi ro thủ công?",
      CREATE_BUTTON: "Tạo đánh giá rủi ro thủ công",
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

// PDF helpers
export const getPdfMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.PDF[type];
  if (!category || !category[key]) {
    return `PDF message not found: PDF.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getPdfSuccess = (key, params = {}) =>
  getPdfMessage("SUCCESS", key, params);
export const getPdfError = (key, params = {}) =>
  getPdfMessage("ERROR", key, params);
export const getPdfValidation = (key, params = {}) =>
  getPdfMessage("VALIDATION", key, params);
export const getPdfInfo = (key, params = {}) =>
  getPdfMessage("INFO", key, params);
export const getPdfWarning = (key, params = {}) =>
  getPdfMessage("WARNING", key, params);

// Tags helpers
export const getTagsMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.TAGS[type];
  if (!category || !category[key]) {
    return `Tags message not found: TAGS.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getTagsSuccess = (key, params = {}) =>
  getTagsMessage("SUCCESS", key, params);
export const getTagsError = (key, params = {}) =>
  getTagsMessage("ERROR", key, params);
export const getTagsValidation = (key, params = {}) =>
  getTagsMessage("VALIDATION", key, params);
export const getTagsInfo = (key, params = {}) =>
  getTagsMessage("INFO", key, params);
export const getTagsWarning = (key, params = {}) =>
  getTagsMessage("WARNING", key, params);

// Placeholder helpers
export const getPlaceholderMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.PLACEHOLDER[type];
  if (!category || !category[key]) {
    return `Placeholder message not found: PLACEHOLDER.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getPlaceholderSuccess = (key, params = {}) =>
  getPlaceholderMessage("SUCCESS", key, params);
export const getPlaceholderError = (key, params = {}) =>
  getPlaceholderMessage("ERROR", key, params);
export const getPlaceholderValidation = (key, params = {}) =>
  getPlaceholderMessage("VALIDATION", key, params);
export const getPlaceholderInfo = (key, params = {}) =>
  getPlaceholderMessage("INFO", key, params);
export const getPlaceholderWarning = (key, params = {}) =>
  getPlaceholderMessage("WARNING", key, params);

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

// Approval helpers
export const getApprovalMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.APPROVAL[type];
  if (!category || !category[key]) {
    return `Approval message not found: APPROVAL.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getApprovalSuccess = (key, params = {}) =>
  getApprovalMessage("SUCCESS", key, params);
export const getApprovalError = (key, params = {}) =>
  getApprovalMessage("ERROR", key, params);
export const getApprovalInfo = (key, params = {}) =>
  getApprovalMessage("INFO", key, params);
export const getApprovalWarning = (key, params = {}) =>
  getApprovalMessage("WARNING", key, params);

// Risk Analysis helpers
export const getRiskAnalysisMessage = (type, key, params = {}) => {
  const category = POLICY_MESSAGES.RISK_ANALYSIS[type];
  if (!category || !category[key]) {
    return `Risk Analysis message not found: RISK_ANALYSIS.${type}.${key}`;
  }

  let message = category[key];

  Object.keys(params).forEach((param) => {
    message = message.replace(new RegExp(`{${param}}`, "g"), params[param]);
  });

  return message;
};

export const getRiskAnalysisSuccess = (key, params = {}) =>
  getRiskAnalysisMessage("SUCCESS", key, params);
export const getRiskAnalysisError = (key, params = {}) =>
  getRiskAnalysisMessage("ERROR", key, params);
export const getRiskAnalysisInfo = (key, params = {}) =>
  getRiskAnalysisMessage("INFO", key, params);
export const getRiskAnalysisWarning = (key, params = {}) =>
  getRiskAnalysisMessage("WARNING", key, params);

// Default export
export default POLICY_MESSAGES;
