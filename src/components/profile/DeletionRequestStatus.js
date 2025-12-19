import { useRevokeDeletionRequest } from "@/services/hooks/profile/use-partner-deletion";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  RollbackOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useState } from "react";

const { Text, Title, Paragraph } = Typography;

const STATUS_CONFIG = {
  pending: {
    label: "Đang chờ xử lý",
    color: "warning",
    icon: <ClockCircleOutlined />,
  },
  approved: {
    label: "Được chấp thuận",
    color: "error",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "Bị từ chối",
    color: "default",
    icon: <CloseCircleOutlined />,
  },
  cancelled: {
    label: "Đã hủy",
    color: "default",
    icon: <StopOutlined />,
  },
  completed: {
    label: "Hoàn thành",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
};

export default function DeletionRequestStatus({ request, onRefresh }) {
  const { revokeDeletionRequest, isLoading } = useRevokeDeletionRequest();
  const [revoking, setRevoking] = useState(false);

  if (!request) return null;

  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const canRevoke =
    request.status === "pending" &&
    new Date() <= new Date(request.cancellable_until);

  const handleRevoke = () => {
    Modal.confirm({
      title: "Xác nhận hủy yêu cầu",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn hủy yêu cầu xóa hồ sơ công ty này không?",
      okText: "Hủy yêu cầu",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      onOk: async () => {
        setRevoking(true);
        const result = await revokeDeletionRequest({
          request_id: request.request_id,
          review_note: "Partner revoked the deletion request",
        });

        if (result.success) {
          message.success(result.message);
          onRefresh && onRefresh();
        } else {
          message.error(result.message);
        }
        setRevoking(false);
      },
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const cancellableDate = new Date(request.cancellable_until);
    const diffMs = cancellableDate - now;

    if (diffMs <= 0) return null;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    return { days, hours, totalMs: diffMs };
  };

  const timeRemaining = getTimeRemaining();
  const totalCancellationPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const progressPercent = timeRemaining
    ? Math.max(0, 100 - (timeRemaining.totalMs / totalCancellationPeriod) * 100)
    : 100;

  return (
    <Card
      style={{
        borderRadius: "8px",
        border: "2px solid #ff4d4f",
        marginBottom: 24,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <DeleteOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
              <Title level={4} style={{ margin: 0 }}>
                Yêu cầu hủy hồ sơ công ty
              </Title>
            </Space>
          </Col>
          <Col>
            <Tag
              color={statusConfig.color}
              icon={statusConfig.icon}
              style={{ fontSize: 14, padding: "4px 12px" }}
            >
              {statusConfig.label}
            </Tag>
          </Col>
        </Row>

        {/* Status-specific alerts */}
        {request.status === "pending" && canRevoke && (
          <Alert
            message="Thời gian hủy yêu cầu"
            description={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text>
                  Bạn còn{" "}
                  <strong>
                    {timeRemaining?.days} ngày {timeRemaining?.hours} giờ
                  </strong>{" "}
                  để có thể hủy yêu cầu này.
                </Text>
                <Progress
                  percent={Math.round(progressPercent)}
                  status="active"
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#ff4d4f",
                  }}
                />
              </Space>
            }
            type="warning"
            showIcon
            icon={<ClockCircleOutlined />}
          />
        )}

        {request.status === "pending" && !canRevoke && (
          <Alert
            message="Đang chờ quản trị viên xử lý"
            description="Thời gian hủy yêu cầu đã hết. Yêu cầu của bạn đang được quản trị viên xem xét."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        )}

        {request.status === "approved" && (
          <Alert
            message="Yêu cầu đã được chấp thuận"
            description="Hồ sơ công ty của bạn sẽ ngưng hoạt động trong vòng 30 ngày. Vui lòng hoàn thành các nghĩa vụ tài chính còn lại."
            type="error"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        {request.status === "rejected" && (
          <Alert
            message="Yêu cầu đã bị từ chối"
            description={
              request.review_note ||
              "Yêu cầu hủy hồ sơ của bạn đã bị từ chối bởi quản trị viên."
            }
            type="info"
            showIcon
            icon={<CloseCircleOutlined />}
          />
        )}

        {request.status === "cancelled" && (
          <Alert
            message="Yêu cầu đã được hủy"
            description="Bạn đã hủy yêu cầu xóa hồ sơ công ty."
            type="default"
            showIcon
            icon={<StopOutlined />}
          />
        )}

        {/* Request Details */}
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã yêu cầu" span={2}>
            <Text code copyable>
              {request.request_id}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Người yêu cầu">
            {request.requested_by_name || request.requested_by}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày yêu cầu">
            {new Date(request.requested_at).toLocaleString("vi-VN")}
          </Descriptions.Item>

          <Descriptions.Item label="Hạn hủy yêu cầu" span={2}>
            {new Date(request.cancellable_until).toLocaleString("vi-VN")}
          </Descriptions.Item>

          {request.detailed_explanation && (
            <Descriptions.Item label="Lý do" span={2}>
              <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                {request.detailed_explanation}
              </Paragraph>
            </Descriptions.Item>
          )}

          {request.reviewed_by_name && (
            <>
              <Descriptions.Item label="Người xử lý">
                {request.reviewed_by_name}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày xử lý">
                {request.reviewed_at
                  ? new Date(request.reviewed_at).toLocaleString("vi-VN")
                  : "—"}
              </Descriptions.Item>

              {request.review_note && (
                <Descriptions.Item label="Ghi chú xử lý" span={2}>
                  <Paragraph
                    style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
                  >
                    {request.review_note}
                  </Paragraph>
                </Descriptions.Item>
              )}
            </>
          )}
        </Descriptions>

        {/* Timeline */}
        <div>
          <Title level={5}>Tiến trình</Title>
          <Timeline
            items={[
              {
                color: "green",
                children: (
                  <>
                    <Text strong>Tạo yêu cầu</Text>
                    <br />
                    <Text type="secondary">
                      {new Date(request.requested_at).toLocaleString("vi-VN")}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Bởi: {request.requested_by_name}
                    </Text>
                  </>
                ),
              },
              ...(request.status === "pending"
                ? [
                    {
                      color: canRevoke ? "blue" : "gray",
                      children: (
                        <>
                          <Text strong>
                            {canRevoke
                              ? "Thời gian hủy yêu cầu"
                              : "Chờ quản trị viên xử lý"}
                          </Text>
                          <br />
                          <Text type="secondary">
                            {canRevoke
                              ? `Còn ${timeRemaining?.days} ngày ${timeRemaining?.hours} giờ`
                              : "Đang chờ xử lý"}
                          </Text>
                        </>
                      ),
                    },
                  ]
                : []),
              ...(request.status === "approved" ||
              request.status === "rejected" ||
              request.status === "cancelled"
                ? [
                    {
                      color:
                        request.status === "approved"
                          ? "red"
                          : request.status === "rejected"
                          ? "orange"
                          : "gray",
                      children: (
                        <>
                          <Text strong>{statusConfig.label}</Text>
                          <br />
                          {request.reviewed_at && (
                            <>
                              <Text type="secondary">
                                {new Date(request.reviewed_at).toLocaleString(
                                  "vi-VN"
                                )}
                              </Text>
                              <br />
                            </>
                          )}
                          {request.reviewed_by_name && (
                            <Text type="secondary">
                              Bởi: {request.reviewed_by_name}
                            </Text>
                          )}
                        </>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* Actions */}
        {canRevoke && (
          <Row justify="end">
            <Col>
              <Button
                type="primary"
                danger
                icon={<RollbackOutlined />}
                onClick={handleRevoke}
                loading={revoking || isLoading}
              >
                Hủy yêu cầu xóa hồ sơ
              </Button>
            </Col>
          </Row>
        )}
      </Space>
    </Card>
  );
}
