"use client";

import { SecurityScanOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import "../insurance-configuration.css";

const { Title, Text } = Typography;

export default function FraudDetectionPage() {
  return (
    <div className="fraud-detection-container">
      <Card
        title={
          <Space>
            <SecurityScanOutlined />
            <span>Phát hiện Gian lận</span>
          </Space>
        }
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <SecurityScanOutlined
            style={{ fontSize: "64px", color: "#1890ff", marginBottom: "16px" }}
          />
          <Title level={3}>Trang đang được phát triển</Title>
          <Text type="secondary">
            Nội dung phát hiện gian lận sẽ được cập nhật sớm.
          </Text>
        </div>
      </Card>
    </div>
  );
}
