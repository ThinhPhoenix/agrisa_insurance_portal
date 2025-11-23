"use client";
import Assets from "@/assets";
import { sidebarMenuItems } from "@/libs/menu-config";
import { Menu } from "antd";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  CreditCard,
  FileText,
  History,
  PanelLeft,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Map central menu config to AntD menu items and attach icons
const items = sidebarMenuItems.map((item) => ({
  ...item,
  icon: getIconForKey(item.key),
}));

const CustomSidebar = ({ collapsed, setCollapsed }) => {
  const router = useRouter();
  const pathname = usePathname();
  // store a key for which icon to show: 'panel' | 'right' | 'left'
  const [hoverIcon, setHoverIcon] = useState("panel");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  // Update selected keys based on current pathname
  useEffect(() => {
    if (pathname) {
      // Remove leading slash for comparison
      const currentPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

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
            const result = findOpenKeys(item.children, path, [...parents, item.key]);
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
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
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
