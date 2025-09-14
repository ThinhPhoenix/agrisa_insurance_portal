"use client";
import Assets from "@/assets";
import { Menu } from "antd";
import {
  PanelLeft,
  ArrowRightToLine,
  ArrowLeftToLine,
  CreditCard,
  Users,
  Shield,
} from "lucide-react";
import { useState } from "react"; // Add this import for state

const items = [
  {
    key: "payment",
    label: "Quản lý thanh toán",
    icon: <CreditCard size={16} />,
  },
  {
    key: "insurance",
    label: "Quản lý bảo hiểm",
    icon: <Shield size={16} />,
  },
  {
    key: "beneficiary",
    label: "Quản lý người thụ hưởng",
    icon: <Users size={16} />,
  },
];

const CustomSidebar = ({ collapsed, setCollapsed }) => {
  // store a key for which icon to show: 'panel' | 'right' | 'left'
  const [hoverIcon, setHoverIcon] = useState("panel");

  const onClick = (e) => {
    console.log("click ", e);
  };

  const handleMouseEnter = () => {
    if (collapsed) {
      setHoverIcon("right");
    } else {
      setHoverIcon("left");
    }
  };

  const handleMouseLeave = () => {
    setHoverIcon("panel");
  };

  return (
    <section
      className={`h-screen overflow-y-auto bg-secondary-100 border-r transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      // allow some overflow so rounded active pills aren't clipped when collapsed
      style={{ overflowX: collapsed ? "visible" : "hidden" }}
    >
      <div className="flex items-center py-2 pl-5 pr-4">
        <button
          className={`toggle flex items-center justify-center py-2 ${
            collapsed ? "px-3" : "px-2"
          } hover:bg-black/5 rounded-lg cursor-pointer transition-colors text-[#1d1d1d]`}
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Render icon based on state key to avoid element rehydration issues */}
          {hoverIcon === "panel" && <PanelLeft size={16} />}
          {hoverIcon === "right" && <ArrowRightToLine size={16} />}
          {hoverIcon === "left" && <ArrowLeftToLine size={16} />}
        </button>
        <div className="flex items-center gap-1">
          <img
            src={Assets.Agrisa.src}
            className={`w-6 h-6 ${collapsed ? "hidden" : ""} transition-none`}
          />
          <h1
            className={`text-primary-500 text-xl whitespace-nowrap ${
              collapsed ? "hidden" : ""
            } transition-none`}
          >
            Agrisa's IPP
          </h1>
        </div>
      </div>
      <div
        className={`${
          collapsed ? "flex-1 flex items-center justify-center" : "flex-1"
        }`}
      >
        <Menu
          onClick={onClick}
          defaultSelectedKeys={["payment"]}
          mode="inline"
          items={items}
          inlineCollapsed={collapsed}
          className={`!border-none transition-all duration-300 w-full`}
        />
      </div>
    </section>
  );
};
export default CustomSidebar;
