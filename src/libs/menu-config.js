export const sidebarMenuItems = [
  {
    key: "dashboard",
    label: "Báo cáo tổng quan",
  },
  {
    key: "base-policy",
    label: "Quản lý gói bảo hiểm",
  },
  {
    key: "policy",
    label: "Quản lý hợp đồng",
    children: [
      { key: "policy/pending", label: "Duyệt hợp đồng đăng ký" },
      { key: "policy/active", label: "Hợp đồng đang hoạt động" },
      { key: "policy/cancel", label: "Yêu cầu hủy" },
      {
        key: "policy/policy-detail",
        label: "Chi tiết hợp đồng",
        hideInMenu: true,
        disableBreadcrumbLink: true,
      },
    ],
  },
  {
    key: "claim",
    label: "Yêu cầu chi trả",
    children: [
      { key: "claim", label: "Danh sách yêu cầu" },
      { key: "claim/rejection", label: "Danh sách từ chối" },
      {
        key: "claim/detail",
        label: "Chi tiết chi trả bảo hiểm",
        hideInMenu: true,
        disableBreadcrumbLink: true,
      },
    ],
  },
  {
    key: "payout",
    label: "Đơn chi trả",
  },
  // {
  //   key: "beneficiary",
  //   label: "Quản lý người thụ hưởng",
  // },
  {
    key: "transaction-history",
    label: "Lịch sử giao dịch",
  },
  {
    key: "general-settings",
    label: "Cài đặt chung",
  },
  // {
  //   key: "payment",
  //   label: "Quản lý thanh toán",
  // },
  // {
  //   key: "configuration",
  //   label: "Cấu hình",
  //   children: [
  //     { key: "configuration/overal", label: "Tổng quan" },
  //     {
  //       key: "configuration/approval",
  //       label: "Phê duyệt",
  //       children: [
  //         {
  //           key: "configuration/approval/claims-automation",
  //           label: "Tự động hóa khiếu nại",
  //         },
  //         {
  //           key: "configuration/approval/crop-assessment",
  //           label: "Đánh giá cây trồng",
  //         },
  //       ],
  //     },
  //     { key: "configuration/fraud-detection", label: "Phát hiện gian lận" },
  //     { key: "configuration/partners", label: "Đối tác" },
  //     { key: "configuration/quality-compliance", label: "Tuân thủ chất lượng" },
  //     { key: "configuration/satellite", label: "Vệ tinh" },
  //   ],
  // },
];
export const labelTranslations = {
  Create: "Tạo mới",
  Edit: "Chỉnh sửa",
  Profile: "Hồ sơ",
  BasePolicy: "Gói bảo hiểm",
};
