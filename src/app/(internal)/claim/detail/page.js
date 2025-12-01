"use client";

import useClaim from "@/services/hooks/claim/use-claim";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Layout,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const { Title, Text } = Typography;

export default function ClaimDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");

  const { claimDetail, claimDetailLoading, claimDetailError, fetchClaimDetail } =
    useClaim();

  useEffect(() => {
    if (claimId) {
      fetchClaimDetail(claimId);
    }
  }, [claimId, fetchClaimDetail]);

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
        return "Chờ đối tác duyệt";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      case "paid":
        return "Đã thanh toán";
      default:
        return status;
    }
  };

  // Format date from epoch timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date =
      timestamp < 5000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    return date.toLocaleString("vi-VN");
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (claimDetailLoading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Đang tải thông tin bồi thường..." />
        </div>
      </Layout.Content>
    );
  }

  if (claimDetailError) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Lỗi: {claimDetailError}</Text>
        </div>
      </Layout.Content>
    );
  }

  if (!claimDetail) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="secondary">Không tìm thấy thông tin bồi thường</Text>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="insurance-header mb-6">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
            >
              Quay lại
            </Button>
            <div>
              <Title level={2} className="insurance-title !mb-0">
                Chi Tiết Bồi Thường
              </Title>
              <Text className="insurance-subtitle">
                Mã: {claimDetail.claim_number}
              </Text>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <Card className="mb-4" style={{ borderLeft: `4px solid ${getStatusColor(claimDetail.status) === 'green' ? '#52c41a' : getStatusColor(claimDetail.status) === 'orange' ? '#faad14' : getStatusColor(claimDetail.status) === 'red' ? '#f5222d' : '#1890ff'}` }}>
          <Space size="large">
            <div>
              <Text strong>Trạng thái: </Text>
              <Tag color={getStatusColor(claimDetail.status)} style={{ fontSize: '14px' }}>
                {getStatusText(claimDetail.status)}
              </Tag>
            </div>
            {claimDetail.auto_generated && (
              <Tag color="blue" icon={<InfoCircleOutlined />}>
                Tự động tạo
              </Tag>
            )}
            {claimDetail.auto_approved && (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Tự động duyệt
              </Tag>
            )}
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          {/* Thông tin cơ bản */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Thông Tin Cơ Bản</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã bồi thường">
                  <Text strong>{claimDetail.claim_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="ID Bồi thường">
                  <Text copyable style={{ fontSize: '12px' }}>{claimDetail.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="ID Đơn bảo hiểm">
                  <Text copyable style={{ fontSize: '12px' }}>
                    {claimDetail.registered_policy_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="ID Gói bảo hiểm">
                  <Text copyable style={{ fontSize: '12px' }}>
                    {claimDetail.base_policy_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="ID Trang trại">
                  <Text copyable style={{ fontSize: '12px' }}>
                    {claimDetail.farm_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="ID Trigger">
                  <Text copyable style={{ fontSize: '12px' }}>
                    {claimDetail.base_policy_trigger_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian kích hoạt">
                  {formatDate(claimDetail.trigger_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {formatDate(claimDetail.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatDate(claimDetail.updated_at)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin tài chính */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Thông Tin Tài Chính</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Tổng số tiền bồi thường">
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {formatCurrency(claimDetail.claim_amount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Bồi thường cố định">
                  {formatCurrency(claimDetail.calculated_fix_payout)}
                </Descriptions.Item>
                <Descriptions.Item label="Bồi thường theo ngưỡng">
                  {formatCurrency(claimDetail.calculated_threshold_payout)}
                </Descriptions.Item>
                <Descriptions.Item label="Giá trị vượt ngưỡng">
                  {claimDetail.over_threshold_value
                    ? claimDetail.over_threshold_value.toFixed(2)
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Thông tin tự động duyệt */}
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Thông Tin Tự Động Duyệt</span>
                </Space>
              }
              bordered={false}
              className="mt-4"
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Hạn tự động duyệt">
                  {formatDate(claimDetail.auto_approval_deadline)}
                </Descriptions.Item>
                <Descriptions.Item label="Đã tự động duyệt">
                  {claimDetail.auto_approved ? (
                    <Tag color="green">Có</Tag>
                  ) : (
                    <Tag color="default">Không</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin đánh giá của đối tác */}
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  <span>Thông Tin Đánh Giá Của Đối Tác</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Thời gian đánh giá" span={1}>
                  {formatDate(claimDetail.partner_review_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="Quyết định" span={1}>
                  {claimDetail.partner_decision ? (
                    <Tag
                      color={
                        claimDetail.partner_decision === "approved"
                          ? "green"
                          : "red"
                      }
                    >
                      {claimDetail.partner_decision === "approved"
                        ? "Chấp thuận"
                        : "Từ chối"}
                    </Tag>
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Người đánh giá" span={1}>
                  {claimDetail.reviewed_by || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú của đối tác" span={2}>
                  {claimDetail.partner_notes || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Bằng chứng */}
          {claimDetail.evidence_summary && (
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <WarningOutlined />
                    <span>Tóm Tắt Bằng Chứng</span>
                  </Space>
                }
                bordered={false}
              >
                <pre
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "4px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(claimDetail.evidence_summary, null, 2)}
                </pre>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </Layout.Content>
  );
}
