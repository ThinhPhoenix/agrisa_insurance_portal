export const sidebarMenuItems = [
  {
    key: "base-policy",
    label: "Quản lý gói bảo hiểm",
  },
  {
    key: "policy",
    label: "Quản lý đơn bảo hiểm",
    children: [
      { key: "policy/pending", label: "Duyệt đơn đăng ký" },
      { key: "policy/active", label: "Đơn đang hoạt động" },
      {
        key: "policy/policy-detail",
        label: "Chi tiết đơn bảo hiểm",
        hideInMenu: true,
        disableBreadcrumbLink: true,
      },
    ],
  },
  {
    key: "claim",
    label: "Quản lý bồi thường",
    children: [
      { key: "claim", label: "Danh sách bồi thường" },
      { key: "claim/rejection", label: "Danh sách từ chối" },
      {
        key: "claim/detail",
        label: "Chi tiết bồi thường",
        hideInMenu: true,
        disableBreadcrumbLink: true,
      },
    ],
  },
  {
    key: "beneficiary",
    label: "Quản lý người thụ hưởng",
  },
  {
    key: "transaction-history",
    label: "Lịch sử giao dịch",
  },
  // {
  //   key: "payment",
  //   label: "Quản lý thanh toán",
  // },
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
export const labelTranslations = {
  Create: "Tạo mới",
  Edit: "Chỉnh sửa",
  Profile: "Hồ sơ",
  BasePolicy: "Chính sách bảo hiểm",
};
