"use client";

import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";

const { Title, Text } = Typography;

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case "generated":
      return "default";
    case "pending_partner_review":
      return "orange";
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "paid":
      return "blue";
    default:
      return "default";
  }
};

// Get status text (tiếng Việt)
const getStatusText = (status) => {
  switch (status) {
    case "generated":
      return "Đã tạo";
    case "pending_partner_review":
      return "Chờ đối tác xem xét";
    case "approved":
      return "Đã phê duyệt";
    case "rejected":
      return "Đã từ chối";
    case "paid":
      return "Đã thanh toán";
    default:
      return status;
  }
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function ClaimHeader({
  claimDetail,
  onBack,
  onApprove,
  onReject,
  submitting,
}) {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="insurance-title !mb-0">
            Chi Trả Bảo Hiểm
          </Title>
          <Space className="insurance-subtitle">
            <Text>Mã: {claimDetail.claim_number}</Text>
            <Text>|</Text>
            <Text>Trạng thái:</Text>
            <Tag
              color={getStatusColor(claimDetail.status)}
              style={{ fontSize: "13px" }}
            >
              {getStatusText(claimDetail.status)}
            </Tag>
            {claimDetail.auto_generated && (
              <Tag color="blue" icon={<InfoCircleOutlined />}>
                Tự động
              </Tag>
            )}
          </Space>
        </div>

        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="large">
            Quay lại
          </Button>
          {claimDetail.status === "pending_partner_review" && (
            <>
              <Button
                danger
                size="large"
                onClick={onReject}
                loading={submitting}
              >
                Từ chối
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={onApprove}
                loading={submitting}
              >
                Chấp nhận
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-blue-100 p-4 rounded-full">
                  <WalletOutlined style={{ fontSize: 32, color: "#1890ff" }} />
                </div>
              </div>
              <Text
                type="secondary"
                style={{ fontSize: "13px", display: "block" }}
              >
                Tổng số tiền chi trả
              </Text>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1890ff",
                  marginTop: "8px",
                }}
              >
                {formatCurrency(claimDetail.claim_amount)}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircleOutlined
                    style={{ fontSize: 32, color: "#52c41a" }}
                  />
                </div>
              </div>
              <Text
                type="secondary"
                style={{ fontSize: "13px", display: "block" }}
              >
                Chi trả cố định
              </Text>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#52c41a",
                  marginTop: "8px",
                }}
              >
                {formatCurrency(claimDetail.calculated_fix_payout)}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-purple-100 p-4 rounded-full">
                  <WalletOutlined style={{ fontSize: 32, color: "#722ed1" }} />
                </div>
              </div>
              <Text
                type="secondary"
                style={{ fontSize: "13px", display: "block" }}
              >
                Chi trả theo ngưỡng
              </Text>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#722ed1",
                  marginTop: "8px",
                }}
              >
                {formatCurrency(claimDetail.calculated_threshold_payout)}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-orange-100 p-4 rounded-full">
                  <WarningOutlined style={{ fontSize: 32, color: "#fa8c16" }} />
                </div>
              </div>
              <Text
                type="secondary"
                style={{ fontSize: "13px", display: "block" }}
              >
                Giá trị vượt ngưỡng
              </Text>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#fa8c16",
                  marginTop: "8px",
                }}
              >
                {claimDetail.over_threshold_value
                  ? `${claimDetail.over_threshold_value.toFixed(2)}%`
                  : "-"}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
