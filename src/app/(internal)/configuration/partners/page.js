"use client";

import { TeamOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import "../insurance-configuration.css";

const { Title, Text } = Typography;

export default function PartnersPage() {
  return (
    <div className="partners-container">
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Tích hợp Đối tác</span>
          </Space>
        }
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <TeamOutlined
            style={{ fontSize: "64px", color: "#1890ff", marginBottom: "16px" }}
          />
          <Title level={3}>Trang đang được phát triển</Title>
          <Text type="secondary">
            Nội dung tích hợp đối tác sẽ được cập nhật sớm.
          </Text>
        </div>
      </Card>
    </div>
  );
}
