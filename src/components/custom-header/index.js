import Assets from "@/assets";
import { Breadcrumb } from "antd";
import AvatarSection from "./avatar-section";

export default function CustomHeader() {
  const breadcrumbItems = [
    {
      title: (
        <img
          src={Assets.Agrisa.src}
          alt="Agrisa Logo"
          className="w-5 h-5 aspect-square"
        />
      ),
      href: "/",
    },
    { title: "Bảng điều khiển", href: "/dashboard" },
    { title: "Đơn hàng", href: "/orders" },
    { title: "Chi tiết đơn hàng", href: "/orders/123" },
  ];

  return (
    <div className="bg-secondary-100 p-4 border-b flex items-center justify-between">
      <Breadcrumb items={breadcrumbItems} />
      <AvatarSection />
    </div>
  );
}
