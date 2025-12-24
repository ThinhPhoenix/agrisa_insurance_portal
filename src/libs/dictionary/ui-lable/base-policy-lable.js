/**
 * Base Policy UI Labels
 *
 * Centralized labels for Base Policy creation and management pages
 * Including: Create Policy, FAQ, Configuration, Basic Info, Review, Tags
 */

export const BASE_POLICY_UI_LABELS = {
  // Common actions
  view: "Xem",
  edit: "Chỉnh sửa",
  delete: "Xóa",
  cancel: "Hủy",
  save: "Lưu",
  confirm: "Xác nhận",
  back: "Quay lại",
  submit: "Gửi",
  search: "Tìm kiếm",
  filter: "Lọc",
  export: "Xuất",
  import: "Nhập",
  create: "Tạo mới",
  clearFilters: "Xóa bộ lọc",
  reset: "Đặt lại",
  next: "Tiếp theo",
  previous: "Quay lại",
  creating: "Đang tạo...",

  // Common messages
  loading: "Đang tải...",
  loadingData: "Đang tải dữ liệu...",
  saving: "Đang lưu...",
  noData: "Không có dữ liệu",
  error: "Có lỗi xảy ra",
  success: "Thành công",

  // Common labels
  status: "Trạng thái",
  createdAt: "Ngày tạo",
  updatedAt: "Ngày cập nhật",
  actions: "Hành động",

  // Page specific - Base Policy List
  totalPolicies: "Tổng số gói bảo hiểm",
  activePoliciesCount: "Đang hoạt động",
  draftPolicies: "Chờ duyệt",
  avgPremiumRate: "Phí bảo hiểm trung bình",
  manageBasePolicies: "Quản lý gói bảo hiểm",
  managePoliciesDescription: "Quản lý các gói bảo hiểm nông nghiệp",
  filterSearchLabel: "Bộ lọc tìm kiếm",

  // Create Policy Page
  createBasePolicyTitle: "Tạo gói bảo hiểm Bảo hiểm Nông nghiệp Mới",
  createBasePolicySubtitle:
    "Tạo gói bảo hiểm bảo hiểm tham số được hỗ trợ bởi vệ tinh",

  // Tab labels
  tabFAQ: "FAQ/Hướng dẫn",
  tabBasicInfo: "Thông tin Cơ bản",
  tabConfiguration: "Cấu hình nâng cao",
  tabDocumentTags: "Hợp đồng và thẻ tài liệu",
  tabReview: "Xem lại & Tạo",

  // Tooltips
  tooltipFAQ: "FAQ/Hướng dẫn",
  tooltipBasicInfo: "Thông tin Cơ bản",
  tooltipConfiguration: "Cấu hình nâng cao",
  tooltipDocumentTags: "Hợp đồng và thẻ tài liệu",
  tooltipReview: "Xem lại & Tạo",

  // Validation messages
  validationBasicIncomplete:
    "Vui lòng hoàn thành thông tin cơ bản và thêm ít nhất một nguồn dữ liệu",
  validationBasicComplete: "Thông tin cơ bản đã hoàn thành",
  validationConfigurationIncomplete:
    "Vui lòng thêm ít nhất một điều kiện kích hoạt",
  validationConfigurationComplete: "Cấu hình điều kiện đã hoàn thành",
  validationTagsInfo: "Tags là tùy chọn, bạn có thể bỏ qua hoặc thêm metadata",
  validationReviewIncomplete:
    "Vui lòng hoàn thành các tab trước để có thể tạo policy",
  validationReviewComplete: "Policy đã sẵn sàng để tạo",

  // Button labels
  btnCancel: "Hủy bỏ",
  btnReset: "Đặt lại",
  btnPrevious: "Quay lại",
  btnNext: "Tiếp theo",
  btnCreatePolicy: "Tạo Gói Bảo hiểm",
  btnCreating: "Đang tạo...",

  // Messages
  msgCreatingAllFields: "Đang tạo tất cả thẻ tài liệu...",
  msgBatchCreateSuccess: "Đã tạo thành công {count} thẻ tài liệu!",
  msgBatchCreateError: "Lỗi khi tạo thẻ: {error}",
  msgDuplicateFieldNames: "Tên trường trùng lặp: {names}",
  msgFieldAlreadyExists: "Tên trường đã tồn tại: {names}",
  msgIncompleteFields: "Có {count} trường chưa điền đầy đủ thông tin",
  msgPDFNotFound: "Không tìm thấy file PDF",

  // Other UI
  moreInfo: "Thêm",

  // Archive toggle
  isArchive: "Lưu trữ",
  isArchiveTooltip: "Đánh dấu gói bảo hiểm này là đã lưu trữ",

  // BasicTab sections
  sectionBasicInfo: "Thông tin Cơ bản",
  sectionPremiumSettings: "Cài đặt Phí Bảo hiểm",
  sectionPayoutSettings: "Cài đặt Chi trả",
  sectionCancellationSettings: "Cài đặt Hủy hợp đồng",
  sectionEnrollmentPeriod: "Thời gian đăng ký",
  sectionInsurancePeriod: "Thời gian bảo hiểm",
  sectionRenewalSettings: "Cài đặt gia hạn & Trạng thái",
  sectionDocumentInfo: "Tài liệu & Thông tin bổ sung",
  sectionDataSources: "Nguồn dữ liệu",

  // Data source table
  dataSourceName: "Tên nguồn dữ liệu",
  category: "Danh mục",
  tier: "Gói",
  baseCost: "Chi phí cơ sở",

  // Messages
  msgDataSourceAlreadyAdded: "Nguồn dữ liệu này đã được thêm",
  msgDeleteDataSource: "Xóa nguồn dữ liệu",
  msgConfirmDeleteDataSource: "Bạn có chắc chắn muốn xóa nguồn dữ liệu này?",

  // ConfigurationTab
  sectionMonitoringAlerts: "Giám sát & Cảnh báo",
  sectionTriggerConfig: "Cấu hình kích hoạt",
  titleTriggerGrowthStage: "Cấu hình kích hoạt & Giai đoạn sinh trưởng",
  sectionTriggerConditions: "Điều kiện Kích hoạt",
  editCondition: "Chỉnh sửa Điều kiện",
  addNewCondition: "Thêm Điều kiện Mới",
  updateCondition: "Cập nhật Điều kiện",
  addCondition: "Thêm Điều kiện",
  condition: "Điều kiện",

  // ConfigurationTab - Field labels
  monitorFrequency: "Tần suất giám sát",
  monitorFrequencyUnit: "Đơn vị tần suất",
  dataSource: "Nguồn dữ liệu",
  aggregationFunction: "Hàm tổng hợp",
  aggregationMethod: "Phương pháp tổng hợp",
  aggregationWindow: "Chu kỳ tổng hợp (ngày)",
  thresholdOperator: "Toán tử so sánh ngưỡng",
  thresholdValue: "Giá trị ngưỡng",
  earlyWarningThreshold: "Ngưỡng cảnh báo sớm",
  consecutiveRequired: "Yêu cầu điều kiện liên tục",
  includeComponent: "Bao gồm thành phần con",
  validationWindow: "Chu kỳ xác thực dữ liệu (ngày)",
  dataQuality: "Chất lượng dữ liệu",
  baselineWindow: "Chu kỳ tham chiếu (ngày)",
  baselineFunction: "Hàm tính tham chiếu",
  calculatedCost: "Chi phí tính toán",
  logicalOperatorBetweenConditions: "Toán tử Logic giữa các điều kiện",
  logicalOperator: "Toán tử Logic",
  growthStage: "Giai đoạn sinh trưởng",

  // ConfigurationTab - Blackout periods
  sectionBlackoutPeriods: "Giai đoạn Không Kích hoạt",
  addNewPeriod: "Thêm Giai đoạn Mới",
  startDate: "Ngày bắt đầu",
  endDate: "Ngày kết thúc",

  // ConfigurationTab - Placeholders
  selectDataSource: "Chọn nguồn dữ liệu",
  selectAggregationFunction: "Chọn hàm tổng hợp",
  selectOperator: "Chọn toán tử",
  selectUnit: "Chọn đơn vị",
  selectQuality: "Chọn chất lượng dữ liệu",
  selectBaselineFunction: "Chọn hàm tính tham chiếu",
  selectStartDate: "Chọn ngày bắt đầu",
  selectEndDate: "Chọn ngày kết thúc",

  // ConfigurationTab - Options
  optionNo: "Không",
  optionYes: "Có",
  optionGood: "Tốt (Good)",
  optionAcceptable: "Chấp nhận được (Acceptable)",
  optionPoor: "Kém (Poor)",

  // ConfigurationTab - Messages & Alerts
  msgNoDataSource: "Chưa có nguồn dữ liệu",
  msgAddDataSourceFirst:
    "Vui lòng thêm nguồn dữ liệu ở tab 'Thông tin Cơ bản' trước khi tạo điều kiện",
  msgAllDataSourcesUsed: "Đã sử dụng hết nguồn dữ liệu",
  msgAllDataSourcesUsedDetail:
    "Tất cả nguồn dữ liệu đã được thêm vào điều kiện. Vui lòng thêm nguồn dữ liệu mới ở tab 'Thông tin Cơ bản' hoặc chỉnh sửa điều kiện hiện có.",
  msgNoConditionsYet: "Chưa có điều kiện nào được tạo",
  msgAddConditionToContiune:
    "Vui lòng thêm ít nhất một điều kiện kích hoạt để tiếp tục",
  msgNoInsurancePeriod: "Chưa xác định khoảng thời gian bảo hiểm",
  msgFillInsurancePeriodFirst:
    "Vui lòng điền 'Bảo hiểm có hiệu lực từ' và 'Bảo hiểm có hiệu lực đến' ở tab 'Thông tin Cơ bản' trước khi thiết lập giai đoạn không kích hoạt.",
  msgBlackoutPeriodsInfo: "Giai đoạn Không Kích hoạt (Blackout Periods)",
  msgBlackoutPeriodsDesc:
    "Đây là các giai đoạn trong chu kỳ bảo hiểm mà hệ thống KHÔNG được phép kích hoạt chi trả, dù các điều kiện đều thỏa mãn. Ví dụ: giai đoạn gieo hạt, giai đoạn nảy mầm sớm, hoặc giai đoạn thu hoạch.",
  msgStartMustBeforeEnd: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc!",
  msgPeriodOutsideRange:
    "Giai đoạn phải nằm trong khoảng hiệu lực bảo hiểm ({from} - {to})!",
  msgPeriodOverlap:
    "Giai đoạn này trùng lặp với giai đoạn đã có. Vui lòng chọn khoảng thời gian khác!",
  msgPeriodAddedSuccess: "Đã thêm giai đoạn không kích hoạt thành công!",
  msgDeletePeriod: "Xóa giai đoạn",
  msgConfirmDeletePeriod: "Bạn có chắc chắn muốn xóa giai đoạn này?",
  msgPeriodDeletedSuccess: "Đã xóa giai đoạn!",
  msgDeleteCondition: "Xóa điều kiện",
  msgConfirmDeleteCondition: "Bạn có chắc chắn muốn xóa điều kiện này?",
  msgNeedInsurancePeriodFirst: "Cần nhập thời gian hiệu lực trước",

  // ConfigurationTab - Tooltips
  tooltipMonitorFrequency: "Số lần kiểm tra (VD: 1 ngày = kiểm tra mỗi ngày)",
  tooltipMonitorUnit: "Đơn vị thời gian (giờ, ngày, tuần, tháng, năm)",
  tooltipLogicalOperator:
    "AND = tất cả điều kiện phải đúng | OR = 1 điều kiện đúng là đủ",
  tooltipGrowthStage:
    "Mô tả giai đoạn sinh trưởng (không bắt buộc, tối đa 50 ký tự)",
  tooltipDataSource:
    "Nguồn dữ liệu để tính điều kiện (trạm khí tượng, vệ tinh, v.v.). Mỗi nguồn chỉ được sử dụng một lần",
  tooltipAggregationFunction:
    "Phương pháp tổng hợp (Aggregation Function): Cách thức tính toán một giá trị duy nhất từ dữ liệu thu thập trong một chu kỳ. Ví dụ: SUM để tính tổng lượng mưa, AVG để tính nhiệt độ trung bình",
  tooltipAggregationWindow:
    "Chu kỳ tổng hợp (Aggregation Window): Khoảng thời gian (tính bằng ngày) mà dữ liệu được gom lại để tính toán. Ví dụ: 30 ngày nghĩa là sẽ tính tổng/trung bình dữ liệu của 30 ngày gần nhất",
  tooltipThresholdOperator:
    "Toán tử so sánh ngưỡng (Threshold Operator): Phép toán logic (ví dụ: >, <, =) dùng để so sánh giá trị dữ liệu thực tế với giá trị ngưỡng đã định",
  tooltipThresholdValue:
    "Giá trị ngưỡng (Threshold Value): Mốc giá trị cụ thể để xác định một sự kiện bảo hiểm. Đơn vị của ngưỡng phụ thuộc vào nguồn dữ liệu",
  tooltipEarlyWarning:
    "Ngưỡng cảnh báo sớm (Early Warning Threshold): Một mốc phụ, khi bị vi phạm sẽ gửi cảnh báo cho người dùng biết rủi ro sắp xảy ra, trước khi đạt đến ngưỡng kích hoạt chi trả chính",
  tooltipConsecutive:
    "Yêu cầu điều kiện liên tục (Consecutive Required): Nếu bật, sự kiện bảo hiểm chỉ xảy ra khi điều kiện được thỏa mãn trong nhiều chu kỳ giám sát liên tiếp nhau. Ví dụ: Hạn hán xảy ra nếu không có mưa trong 3 chu kỳ liên tiếp",
  tooltipIncludeComponent:
    "Bao gồm thành phần con (Include Component): Cho phép tính toán dựa trên các thành phần con của một loại dữ liệu, nếu có. Ví dụ: Dữ liệu thời tiết có thể bao gồm các thành phần như 'lượng mưa' và 'độ ẩm'",
  tooltipValidationWindow:
    "Chu kỳ xác thực (Validation Window): Số ngày tối thiểu mà dữ liệu từ một nguồn phải có sẵn và hợp lệ trước khi hệ thống sử dụng nó để tính toán, nhằm đảm bảo tính chính xác",
  tooltipDataQuality:
    "Chất lượng dữ liệu (Data Quality): Mức độ tin cậy và chính xác của nguồn dữ liệu được sử dụng. Tốt (good): dữ liệu chất lượng cao, Chấp nhận được (acceptable): dữ liệu đủ dùng, Kém (poor): dữ liệu chất lượng thấp",
  tooltipBaselineWindow:
    "Chu kỳ tham chiếu (Baseline Window): Khoảng thời gian trong quá khứ (tính bằng ngày) được dùng để tạo ra một giá trị 'nền' hoặc 'bình thường'. BẮT BUỘC khi sử dụng toán tử thay đổi (change_gt/change_lt). Ví dụ: 365 ngày để tính giá trị trung bình hàng năm làm mốc so sánh.",
  tooltipBaselineFunction:
    "Hàm tính tham chiếu (Baseline Function): Phương pháp tính toán giá trị 'nền' từ dữ liệu lịch sử. BẮT BUỘC khi sử dụng toán tử thay đổi (change_gt/change_lt). Ví dụ: AVG để tính giá trị trung bình trong chu kỳ tham chiếu làm mốc so sánh với giá trị hiện tại.",
  tooltipStartDate:
    "Ngày bắt đầu giai đoạn không kích hoạt (chỉ chọn được trong khoảng thời gian bảo hiểm có hiệu lực)",
  tooltipEndDate:
    "Ngày kết thúc giai đoạn không kích hoạt (phải sau ngày bắt đầu và trong khoảng thời gian bảo hiểm có hiệu lực)",

  // ConfigurationTab - Descriptions
  descSelectLogicalOperator:
    "Chọn toán tử logic để kết hợp các điều kiện, mô tả giai đoạn sinh trưởng.",
  descLogicalOperatorAND: "AND - Tất cả điều kiện phải đúng",
  descLogicalOperatorOR: "OR - Một trong các điều kiện đúng",
  descGrowthStageExample: "Ví dụ: Toàn chu kỳ sinh trưởng lúa",
  descGrowthStageMaxLength: "Giai đoạn sinh trưởng tối đa 50 ký tự",
};

export default BASE_POLICY_UI_LABELS;
