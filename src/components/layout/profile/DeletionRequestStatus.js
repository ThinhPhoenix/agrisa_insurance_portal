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
  // Check if user can revoke: allow revoke while request is pending (admin not finalised yet)
  const canRevoke = request.status === "pending";

  // Check if admin is processing (pending but past cancellable period)
  const adminProcessing =
    request.status === "pending" &&
    new Date() > new Date(request.cancellable_until);

  const handleRevoke = () => {
    Modal.confirm({
      title: "Xác nhận hủy yêu cầu xóa hồ sơ",
      icon: <ExclamationCircleOutlined />,
      content: (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Paragraph>
            Bạn có chắc chắn muốn hủy yêu cầu xóa hồ sơ công ty này không?
          </Paragraph>
          <Alert
            message="Sau khi hủy yêu cầu:"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Hồ sơ công ty của bạn sẽ tiếp tục hoạt động bình thường</li>
                <li>Các hợp đồng bảo hiểm vẫn được duy trì</li>
                <li>Bạn có thể tạo yêu cầu hủy hồ sơ mới nếu cần</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginTop: 12 }}
          />
        </Space>
      ),
      okText: "Xác nhận hủy yêu cầu",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      width: 600,
      onOk: async () => {
        setRevoking(true);
        const result = await revokeDeletionRequest({
          request_id: request.request_id,
          review_note: "Đối tác đã tự hủy yêu cầu xóa hồ sơ",
        });

        if (result.success) {
          message.success(
            result.message || "Đã hủy yêu cầu xóa hồ sơ thành công"
          );
          onRefresh && onRefresh();
        } else {
          message.error(result.message || "Không thể hủy yêu cầu");
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
        {request.status === "pending" && !adminProcessing && (
          <Alert
            message="Bạn có thể hủy yêu cầu này"
            description={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Paragraph style={{ marginBottom: 8 }}>
                  Yêu cầu của bạn đang chờ xử lý. Bạn có thể tự hủy yêu cầu này
                  trước khi quản trị viên xem xét.
                </Paragraph>
                <Text>
                  Thời gian còn lại để tự hủy:{" "}
                  <strong style={{ color: "#ff4d4f" }}>
                    {timeRemaining?.days} ngày {timeRemaining?.hours} giờ
                  </strong>
                </Text>
                <Progress
                  percent={Math.round(progressPercent)}
                  status="active"
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#ff4d4f",
                  }}
                />
                <Alert
                  message="Sau khi hết thời gian này, chỉ quản trị viên mới có thể xử lý yêu cầu."
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              </Space>
            }
            type="warning"
            showIcon
            icon={<ClockCircleOutlined />}
          />
        )}

        {request.status === "pending" && adminProcessing && (
          <Alert
            message="Quản trị viên đang xử lý"
            description={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text>
                  Thời gian tự hủy yêu cầu đã hết. Yêu cầu của bạn hiện đang
                  được quản trị viên xem xét và xử lý.
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Quản trị viên sẽ kiểm tra các điều kiện sau trước khi phê
                  duyệt:
                </Text>
                <ul style={{ marginBottom: 0, paddingLeft: 20, fontSize: 12 }}>
                  <li>Không còn hợp đồng nào đang hoạt động</li>
                  <li>Tất cả nghĩa vụ tài chính đã được hoàn thành</li>
                  <li>Các hợp đồng đã được chuyển giao hoặc hủy thành công</li>
                </ul>
              </Space>
            }
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
        {request.status === "pending" && (
          <Card
            style={{
              backgroundColor: "#fff7e6",
              border: "2px solid #ffa940",
              borderRadius: "8px",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <RollbackOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                    Bạn muốn hủy yêu cầu này?
                  </Title>
                  <Text type="secondary">
                    Nhấn nút bên dưới để hủy yêu cầu xóa hồ sơ. Công ty của bạn
                    sẽ tiếp tục hoạt động bình thường.
                  </Text>
                </div>
              </div>
              <Row justify="end">
                <Col>
                  <Button
                    type="primary"
                    danger
                    size="large"
                    icon={<RollbackOutlined />}
                    onClick={handleRevoke}
                    loading={revoking || isLoading}
                  >
                    Hủy yêu cầu xóa hồ sơ
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
}
