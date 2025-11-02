import Assets from "@/assets";
import { Breadcrumb } from "antd";
import { usePathname } from "next/navigation";
import { sidebarMenuItems } from "@/libs/menu-config";
import AvatarSection from "./avatar-section";

export default function CustomHeader() {
  const pathname = usePathname();

  const generateBreadcrumbItems = (path) => {
    const segments = path.split("/").filter(Boolean);
    const items = [
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
    ];

    // Remove 'internal' from segments
    const filteredSegments = segments.filter(
      (segment) => segment !== "internal"
    );

    // Build breadcrumb path
    let currentPath = "/internal";
    let foundItems = [];

    for (let i = 0; i < filteredSegments.length; i++) {
      const segment = filteredSegments[i];
      currentPath += `/${segment}`;

      // Find matching menu item
      const menuItem = findMenuItem(sidebarMenuItems, segment, foundItems);

      if (menuItem) {
        foundItems.push(menuItem);
        const href =
          i === filteredSegments.length - 1 ? undefined : currentPath;
        items.push({
          title: menuItem.label,
          href,
        });
      } else if (/^\[.*\]$/.test(segment) || /^\d+$/.test(segment)) {
        // Handle dynamic routes
        items.push({
          title: "Chi tiết",
        });
      } else {
        // Fallback for unmapped routes
        items.push({
          title: segment.charAt(0).toUpperCase() + segment.slice(1),
          href: currentPath,
        });
      }
    }

    return items;
  };

  // Helper function to find menu item by key
  const findMenuItem = (menuItems, key, previousItems) => {
    // First check direct children of previous items
    for (const prevItem of previousItems) {
      if (prevItem.children) {
        const found = prevItem.children.find(
          (child) => child.key === `${prevItem.key}/${key}` || child.key === key
        );
        if (found) return found;
      }
    }

    // Then check top level
    const topLevel = menuItems.find((item) => item.key === key);
    if (topLevel) return topLevel;

    // Check nested items
    for (const item of menuItems) {
      if (item.children) {
        const found = item.children.find(
          (child) => child.key === key || child.key === `${item.key}/${key}`
        );
        if (found) return found;
      }
    }

    return null;
  };

  const breadcrumbItems = generateBreadcrumbItems(pathname);

  return (
    <div className="bg-secondary-100 p-4 border-b flex items-center justify-between">
      <Breadcrumb items={breadcrumbItems} />
      <AvatarSection />
    </div>
  );
}
