"use client";
import Assets from "@/assets";
import { Menu } from "antd";
import { AppWindow, Mail, PanelLeft, Settings } from "lucide-react";
const items = [
  {
    key: "sub1",
    label: "Navigation One",
    icon: <Mail size={16} />,
    children: [
      {
        key: "g1",
        label: "Item 1",
        type: "group",
        children: [
          { key: "1", label: "Option 1" },
          { key: "2", label: "Option 2" },
        ],
      },
      {
        key: "g2",
        label: "Item 2",
        type: "group",
        children: [
          { key: "3", label: "Option 3" },
          { key: "4", label: "Option 4" },
        ],
      },
    ],
  },
  {
    key: "sub2",
    label: "Navigation Two",
    icon: <AppWindow size={16} />,
    children: [
      { key: "5", label: "Option 5" },
      { key: "6", label: "Option 6" },
      {
        key: "sub3",
        label: "Submenu",
        children: [
          { key: "7", label: "Option 7" },
          { key: "8", label: "Option 8" },
        ],
      },
    ],
  },
  {
    type: "divider",
  },
  {
    key: "sub4",
    label: "Navigation Three",
    icon: <Settings size={16} />,
    children: [
      { key: "9", label: "Option 9" },
      { key: "10", label: "Option 10" },
      { key: "11", label: "Option 11" },
      { key: "12", label: "Option 12" },
    ],
  },
  {
    key: "grp",
    label: "Group",
    type: "group",
    children: [
      { key: "13", label: "Option 13" },
      { key: "14", label: "Option 14" },
    ],
  },
];
const CustomSidebar = ({ collapsed, setCollapsed }) => {
  const onClick = (e) => {
    console.log("click ", e);
  };
  return (
    <section
      className={`h-screen overflow-y-auto bg-secondary-100 border-r overflow-x-hidden transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center py-2 pl-5 pr-4">
        <button
          className={`toggle ${
            collapsed ? "p-1" : "p-2"
          } hover:bg-black/10 rounded-lg cursor-pointer transition-colors`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <PanelLeft size={16} />
        </button>
        <div className="flex items-center gap-1">
          <img
            src={Assets.Agrisa.src}
            className={`w-8 h-8 ${collapsed ? "hidden" : ""} transition-none`}
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
      <Menu
        onClick={onClick}
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        items={items}
        inlineCollapsed={collapsed}
        className={`${
          collapsed ? "w-16 custom-menu-collapsed" : "w-64"
        } !border-none transition-all duration-300`}
      />
    </section>
  );
};
export default CustomSidebar;
