export const sidebarMenuItems = [
  {
    key: "policy",
    label: "Quản lý bảo hiểm",
    children: [
      { key: "policy", label: "Danh sách bảo hiểm" },
      { key: "policy/approval", label: "Duyệt đơn đăng ký" },
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
};
