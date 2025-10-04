"use client";

import { ThunderboltOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import "../../insurance-configuration.css";

const { Title, Text } = Typography;

export default function ClaimsAutomationPage() {
  return (
    <div className="claims-automation-container">
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Tự động hóa Khiếu nại</span>
          </Space>
        }
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <ThunderboltOutlined
            style={{ fontSize: "64px", color: "#1890ff", marginBottom: "16px" }}
          />
          <Title level={3}>Trang đang được phát triển</Title>
          <Text type="secondary">
            Nội dung tự động hóa khiếu nại sẽ được cập nhật sớm.
          </Text>
        </div>
      </Card>
    </div>
  );
}
