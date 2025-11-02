export const sidebarMenuItems = [
  {
    key: "applications",
    label: "Đơn đăng ký đang chờ",
  },
  {
    key: "transaction-history",
    label: "Lịch sử giao dịch",
  },
  {
    key: "payment",
    label: "Quản lý thanh toán",
  },
  {
    key: "insurance",
    label: "Quản lý bảo hiểm",
    children: [
      { key: "insurance/list", label: "Danh sách bảo hiểm" },
      { key: "insurance/approval", label: "Duyệt đơn đăng ký" },
    ],
  },
  {
    key: "beneficiary",
    label: "Quản lý người thụ hưởng",
  },
  {
    key: "policy",
    label: "Quản lý điều khoản bảo hiểm",
  },
  {
    key: "configuration",
    label: "Cấu hình",
    children: [
      { key: "configuration/overal", label: "Tổng quan" },
      {
        key: "configuration/approval",
        label: "Phê duyệt",
        children: [
          {
            key: "configuration/approval/claims-automation",
            label: "Tự động hóa khiếu nại",
          },
          {
            key: "configuration/approval/crop-assessment",
            label: "Đánh giá cây trồng",
          },
        ],
      },
      { key: "configuration/fraud-detection", label: "Phát hiện gian lận" },
      { key: "configuration/partners", label: "Đối tác" },
      { key: "configuration/quality-compliance", label: "Tuân thủ chất lượng" },
      { key: "configuration/satellite", label: "Vệ tinh" },
    ],
  },
];