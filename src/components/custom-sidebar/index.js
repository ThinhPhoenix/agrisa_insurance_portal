"use client";
import Assets from "@/assets";
import { sidebarMenuItems } from "@/libs/menu-config";
import { useAuthStore } from "@/stores/auth-store";
import { Menu, Modal } from "antd";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  CreditCard,
  FileText,
  History,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Filter out items with hideInMenu flag and map to AntD menu items with icons
const filterMenuItems = (items) => {
  return items
    .filter((item) => !item.hideInMenu)
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuItems(item.children) : undefined,
    }));
};

const items = filterMenuItems(sidebarMenuItems).map((item) => ({
  ...item,
  icon: getIconForKey(item.key),
}));

const CustomSidebar = ({ collapsed, setCollapsed }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();
  // store a key for which icon to show: 'panel' | 'right' | 'left'
  const [hoverIcon, setHoverIcon] = useState("panel");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  // Update selected keys based on current pathname
  useEffect(() => {
    if (pathname) {
      // Remove leading slash for comparison
      const currentPath = pathname.startsWith("/")
        ? pathname.slice(1)
        : pathname;

      // Find the matching menu item key - prioritize exact matches and deeper matches
      const findMatchingKey = (items, path) => {
        let bestMatch = null;
        let bestMatchLength = -1;

        const searchItems = (itemsList) => {
          for (const item of itemsList) {
            // Check children first (prioritize deeper matches)
            if (item.children) {
              const childResult = searchItems(item.children);
              if (childResult) {
                // If exact match found in children, use it
                if (childResult.exact || childResult.length > bestMatchLength) {
                  bestMatch = childResult.key;
                  bestMatchLength = childResult.length;
                  if (childResult.exact) {
                    return childResult; // Return immediately for exact match
                  }
                }
              }
            }

            // Check for exact match
            if (path === item.key) {
              return { key: item.key, length: item.key.length, exact: true };
            }

            // Check if path starts with item key
            if (path.startsWith(item.key + "/")) {
              if (item.key.length > bestMatchLength) {
                bestMatch = item.key;
                bestMatchLength = item.key.length;
              }
            }
          }
          return bestMatch ? { key: bestMatch, length: bestMatchLength } : null;
        };

        const result = searchItems(items);
        return result ? result.key : null;
      };

      // Find the parent keys for opening submenus
      const findOpenKeys = (items, path, parents = []) => {
        for (const item of items) {
          // Check children first (prioritize deeper matches)
          if (item.children) {
            const result = findOpenKeys(item.children, path, [
              ...parents,
              item.key,
            ]);
            if (result.length > 0) {
              return result;
            }
          }

          // Exact match - this is a leaf item
          if (path === item.key) {
            return parents;
          }

          // Check if path starts with item key
          if (path.startsWith(item.key + "/")) {
            return [...parents, item.key];
          }
        }
        return [];
      };

      const matchedKey = findMatchingKey(sidebarMenuItems, currentPath);
      const matchedOpenKeys = findOpenKeys(sidebarMenuItems, currentPath);

      if (matchedKey) {
        setSelectedKeys([matchedKey]);
        // Set open keys for parent menus
        if (matchedOpenKeys.length > 0) {
          setOpenKeys(matchedOpenKeys);
        }
      }
    }
  }, [pathname]);

  const onClick = (e) => {
    console.log("click ", e);
    router.push(`/${e.key}`);
  };

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
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

  const handleLogout = () => {
    Modal.confirm({
      title: "Đăng xuất",
      content: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      okText: "Đăng xuất",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk() {
        logout();
        router.push("/sign-in");
      },
    });
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  return (
    <section
      className={`h-screen bg-secondary-100 border-r transition-all duration-300 flex flex-col ${
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
        className={`overflow-y-auto flex-1 ${
          collapsed ? "flex items-center justify-center" : ""
        }`}
      >
        <Menu
          onClick={onClick}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          mode="inline"
          items={items}
          inlineCollapsed={collapsed}
          className={`!border-none transition-all duration-300 w-full`}
        />
      </div>

      {/* Bottom Actions - Profile & Logout - Fixed at bottom */}
      <div className="border-t border-primary-500/20 p-2 flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={handleProfile}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg hover:bg-black/5 transition-colors text-[#1d1d1d] w-full ${
            collapsed ? "justify-center" : ""
          }`}
          title="Hồ sơ"
        >
          <User size={16} />
          {!collapsed && <span className="text-sm">Hồ sơ</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 w-full ${
            collapsed ? "justify-center" : ""
          }`}
          title="Đăng xuất"
        >
          <LogOut size={16} />
          {!collapsed && <span className="text-sm">Đăng xuất</span>}
        </button>
      </div>
    </section>
  );
};
export default CustomSidebar;

// Function to get icon based on key
function getIconForKey(key) {
  const iconMap = {
    applications: <FileText size={16} />,
    "transaction-history": <History size={16} />,
    payment: <CreditCard size={16} />,
    insurance: <Shield size={16} />,
    beneficiary: <Users size={16} />,
    policy: <FileText size={16} />,
    configuration: <Settings size={16} />,
  };

  return iconMap[key] || <FileText size={16} />;
}
