"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Card, Col, Descriptions, Space, Typography } from "antd";
import Link from "next/link";

const { Text } = Typography;

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

// Format date from epoch timestamp or ISO string
const formatDate = (timestamp) => {
  if (!timestamp) return "-";
  let date;
  if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else {
    date =
      timestamp < 5000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
  }
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

export default function ClaimDetailsCards({
  claimDetail,
  policy,
  basePolicy,
  farm,
}) {
  const hasPartnerReview =
    claimDetail.partner_review_timestamp ||
    claimDetail.partner_decision ||
    claimDetail.reviewed_by ||
    claimDetail.partner_notes;

  return (
    <>
      {/* Thông tin đơn bảo hiểm */}
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Thông Tin Đơn Bảo Hiểm</span>
            </Space>
          }
          bordered={false}
          className="shadow-sm"
          style={{ height: "100%" }}
        >
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Mã chi trả">
              <Text strong style={{ color: "#1890ff" }}>
                {claimDetail.claim_number}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đơn bảo hiểm">
              {policy ? (
                <Link
                  href={`/policy/policy-detail?id=${policy.id}&type=active`}
                >
                  <Text style={{ color: "#1890ff" }}>
                    {policy.policy_number}
                  </Text>
                </Link>
              ) : (
                <Text type="secondary">{claimDetail.registered_policy_id}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Gói bảo hiểm">
              {basePolicy ? (
                <Text strong>
                  {basePolicy.product_name ||
                    basePolicy.name ||
                    basePolicy.policy_name}
                </Text>
              ) : (
                <Text type="secondary">{claimDetail.base_policy_id}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trang trại">
              {farm ? (
                <Text>{farm.farm_name || "Trang trại"}</Text>
              ) : (
                <Text type="secondary">{claimDetail.farm_id}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức tạo">
              {claimDetail.auto_generated ? (
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
              ) : (
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#595959",
                    fontWeight: 500,
                  }}
                >
                  Thủ công
                </Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      {/* Thông tin thời gian */}
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              <span>Thông Tin Thời Gian</span>
            </Space>
          }
          bordered={false}
          className="shadow-sm"
          style={{ height: "100%" }}
        >
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Thời gian kích hoạt">
              <Text strong style={{ color: "#fa8c16" }}>
                {formatDate(claimDetail.trigger_timestamp)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDate(claimDetail.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {formatDate(claimDetail.updated_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hiện tại">
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
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      {/* Thông tin đánh giá của đối tác */}
      {hasPartnerReview && (
        <Col xs={24}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <span>Thông Tin Đánh Giá Của Đối Tác</span>
              </Space>
            }
            bordered={false}
            className="shadow-sm"
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Thời gian đánh giá" span={1}>
                {claimDetail.partner_review_timestamp ? (
                  <Text strong>
                    {formatDate(claimDetail.partner_review_timestamp)}
                  </Text>
                ) : (
                  <Text type="secondary">Chưa đánh giá</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Quyết định" span={1}>
                {claimDetail.partner_decision ? (
                  <Text>{claimDetail.partner_decision}</Text>
                ) : (
                  <Text type="secondary">Chưa có quyết định</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Người đánh giá" span={1}>
                {claimDetail.reviewed_by ? (
                  <Text>{claimDetail.reviewed_by}</Text>
                ) : (
                  <Text type="secondary">-</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú của đối tác" span={1}>
                {claimDetail.partner_notes ? (
                  <Text>{claimDetail.partner_notes}</Text>
                ) : (
                  <Text type="secondary">Không có ghi chú</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      )}
    </>
  );
}
