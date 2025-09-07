"use client";
import React from "react";
import { Mail, AppWindow, Settings, PanelLeft } from "lucide-react";
import { Menu } from "antd";
import Assets from "@/assets";
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
const CustomSidebar = () => {
  const onClick = (e) => {
    console.log("click ", e);
  };
  return (
    <section className="h-screen overflow-y-auto bg-secondary-100 border-r-1">
      <div className="flex items-center gap-2 py-2">
        <button>
          <PanelLeft size={16} />
        </button>
        <img src={Assets.Agrisa.src} className="w-8 h-8" />
        <h1>Agrisa</h1>
      </div>
      <Menu
        onClick={onClick}
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        items={items}
        className="w-[256px]"
      />
    </section>
  );
};
export default CustomSidebar;
