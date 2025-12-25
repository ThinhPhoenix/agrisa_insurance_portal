"use client";

import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tooltip, Typography } from "antd";

const { Title, Text } = Typography;

// Get status config with glassmorphism styling
const getStatusConfig = (status) => {
  switch (status) {
    case "generated":
      return {
        background: "rgba(140, 140, 140, 0.12)",
        border: "1px solid rgba(140, 140, 140, 0.3)",
        color: "#595959",
        text: "Đã tạo",
      };
    case "pending_partner_review":
      return {
        background: "rgba(250, 173, 20, 0.12)",
        border: "1px solid rgba(250, 173, 20, 0.3)",
        color: "#d46b08",
        text: "Chờ đối tác xem xét",
      };
    case "approved":
      return {
        background: "rgba(82, 196, 154, 0.12)",
        border: "1px solid rgba(82, 196, 154, 0.3)",
        color: "#18573f",
        text: "Đã phê duyệt",
      };
    case "rejected":
      return {
        background: "rgba(255, 77, 79, 0.12)",
        border: "1px solid rgba(255, 77, 79, 0.3)",
        color: "#cf1322",
        text: "Đã từ chối",
      };
    case "paid":
      return {
        background: "rgba(24, 144, 255, 0.12)",
        border: "1px solid rgba(24, 144, 255, 0.3)",
        color: "#096dd9",
        text: "Đã thanh toán",
      };
    default:
      return {
        background: "rgba(140, 140, 140, 0.12)",
        border: "1px solid rgba(140, 140, 140, 0.3)",
        color: "#595959",
        text: status,
      };
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
  // Derived values for tooltips
  const overVal = claimDetail?.over_threshold_value;
  const fix = claimDetail?.calculated_fix_payout;
  const thresh = claimDetail?.calculated_threshold_payout;
  let derivedMultiplier = null;
  if (overVal && thresh != null && overVal !== 0) {
    // avoid divide by zero; overVal may be percentage (e.g. 0.41)
    derivedMultiplier = thresh / overVal;
  }

  const claimFormulaTooltip = `Tổng tiền chi trả = Chi trả cố định + Chi trả theo ngưỡng\n(Sau đó áp các giới hạn: mức tối đa của gói bảo hiểm và mức bảo hiểm của hợp đồng)`;

  const fixTooltip = `Chi trả cố định: Khoản tiền do hệ thống tính toán dựa trên mức bảo hiểm cơ bản của gói bảo hiểm.`;

  const thresholdTooltip = derivedMultiplier
    ? `Chi trả theo ngưỡng: ${thresh} = ${overVal} × ${derivedMultiplier.toFixed(
        4
      )}\nHệ số được suy ra từ dữ liệu.`
    : `Chi trả theo ngưỡng: Khoản tiền bổ sung dựa trên giá trị vượt quá ngưỡng được phép.`;

  const overThresholdTooltip = `Giá trị chênh lệch đo được (dạng phần trăm). Ví dụ: 0.41 = 41%.\nGiá trị này dùng để tính khoản chi trả bổ sung.`;
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
            <span
              className="inline-block backdrop-blur-sm"
              style={{
                background: getStatusConfig(claimDetail.status).background,
                border: getStatusConfig(claimDetail.status).border,
                padding: "4px 12px",
                borderRadius: "8px",
                fontWeight: 500,
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Text
                style={{
                  color: getStatusConfig(claimDetail.status).color,
                  fontWeight: 500,
                  fontSize: "13px",
                }}
              >
                {getStatusConfig(claimDetail.status).text}
              </Text>
            </span>
            {claimDetail.auto_generated && (
              <Text
                style={{
                  fontSize: "13px",
                  color: "#096dd9",
                  fontWeight: 500,
                }}
              >
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Tự động
              </Text>
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
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <Card bordered={false} className="shadow-sm" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                textAlign: "center",
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  style={{
                    background: "var(--icon-blue-bg)",
                    padding: 16,
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <WalletOutlined
                    style={{ fontSize: 32, color: "var(--icon-blue-color)" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Tổng số tiền chi trả
                </Text>
                <Tooltip title={claimFormulaTooltip} placement="top">
                  <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                </Tooltip>
              </div>
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

        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <Card bordered={false} className="shadow-sm" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                textAlign: "center",
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  style={{
                    background: "var(--icon-green-bg)",
                    padding: 16,
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleOutlined
                    style={{ fontSize: 32, color: "var(--icon-green-color)" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Chi trả cố định
                </Text>
                <Tooltip title={fixTooltip} placement="top">
                  <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                </Tooltip>
              </div>
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

        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <Card bordered={false} className="shadow-sm" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                textAlign: "center",
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  style={{
                    background: "var(--icon-purple-bg)",
                    padding: 16,
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <WalletOutlined
                    style={{ fontSize: 32, color: "var(--icon-purple-color)" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Chi trả theo ngưỡng
                </Text>
                <Tooltip title={thresholdTooltip} placement="top">
                  <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                </Tooltip>
              </div>
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

        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <Card bordered={false} className="shadow-sm" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                textAlign: "center",
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  style={{
                    background: "var(--icon-orange-bg)",
                    padding: 16,
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <WarningOutlined
                    style={{ fontSize: 32, color: "var(--icon-orange-color)" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Giá trị vượt ngưỡng
                </Text>
                <Tooltip title={overThresholdTooltip} placement="top">
                  <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                </Tooltip>
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#fa8c16",
                  marginTop: "8px",
                }}
              >
                {claimDetail.over_threshold_value
                  ? `${(claimDetail.over_threshold_value * 100).toFixed(2)}`
                  : "-"}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
