import { Avatar, Button, Dropdown, Badge } from "antd";
import { Bell } from "lucide-react";

export default function AvatarSection({
  isMobile,
  notificationCount,
  notificationItems,
}) {
  return (
    <div className="flex items-center gap-2">
      <Dropdown
        menu={{ items: notificationItems }}
        placement="bottomRight"
        trigger={["click"]}
        overlayClassName="notification-dropdown"
        overlayStyle={{ width: isMobile ? "280px" : "320px" }}
      >
        <div className="cursor-pointer">
          <Badge count={2} size="small">
            <Button
              type="dashed"
              icon={<Bell size={16} />}
              className="!bg-secondary-200"
            />
          </Badge>
        </div>
      </Dropdown>
      <Avatar
        size={32}
        src="https://www.baovietnhantho.com.vn/storage/8f698cfe-2689-4637-bee7-62e592122dee/c/tap-doan-bao-viet-large.jpg"
      />
    </div>
  );
}
