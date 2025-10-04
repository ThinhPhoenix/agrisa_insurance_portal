"use client";

import { SafetyCertificateOutlined } from "@ant-design/icons";
import { Card, Space, Typography } from "antd";
import "../insurance-configuration.css";

const { Title, Text } = Typography;

export default function QualityCompliancePage() {
  return (
    <div className="quality-compliance-container">
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>Chất lượng & Tuân thủ</span>
          </Space>
        }
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <SafetyCertificateOutlined
            style={{ fontSize: "64px", color: "#1890ff", marginBottom: "16px" }}
          />
          <Title level={3}>Trang đang được phát triển</Title>
          <Text type="secondary">
            Nội dung chất lượng & tuân thủ sẽ được cập nhật sớm.
          </Text>
        </div>
      </Card>
    </div>
  );
}
