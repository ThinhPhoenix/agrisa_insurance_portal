"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCancelRequestDetail } from "@/services/hooks/policy/use-cancel-request-detail";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Layout,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../../policy.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CancelRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;

  const { cancelRequest, loading, reviewCancelRequest } =
    useCancelRequestDetail(requestId);

  const [approveForm] = Form.useForm();
  const [denyForm] = Form.useForm();

  // Related data
  const [policy, setPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [denyModalVisible, setDenyModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch policy detail when cancelRequest is loaded
  useEffect(() => {
    const fetchPolicyDetail = async () => {
      if (!cancelRequest?.registered_policy_id) return;

      setPolicyLoading(true);
      try {
        const response = await axiosInstance.get(
          endpoints.policy.policy.detail(cancelRequest.registered_policy_id)
        );
        if (response.data.success) {
          setPolicy(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching policy detail:", error);
      } finally {
        setPolicyLoading(false);
      }
    };

    fetchPolicyDetail();
  }, [cancelRequest]);

  // Get cancel request status color
  const getCancelStatusColor = (status) => {
    switch (status) {
      case "pending_review":
        return "orange";
      case "approved":
        return "green";
      case "denied":
        return "red";
      case "litigation":
        return "purple";
      default:
        return "default";
    }
  };

  // Get cancel request status text
  const getCancelStatusText = (status) => {
    switch (status) {
      case "pending_review":
        return "Chờ xem xét";
      case "approved":
        return "Đã chấp thuận";
      case "denied":
        return "Bị từ chối";
      case "litigation":
        return "Tranh chấp pháp lý";
      default:
        return status;
    }
  };

  // Get cancel request type text
  const getCancelTypeText = (type) => {
    switch (type) {
      case "contract_violation":
        return "Vi phạm hợp đồng";
      case "policyholder_request":
        return "Yêu cầu từ nông dân";
      case "non_payment":
        return "Không thanh toán";
      case "regulatory_change":
        return "Thay đổi quy định";
      case "other":
        return "Khác";
      default:
        return type;
    }
  };

  // Get policy status color
  const getPolicyStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "pending_cancel":
        return "orange";
      case "cancelled":
        return "red";
      case "dispute":
        return "red";
      default:
        return "default";
    }
  };

  // Get policy status text
  const getPolicyStatusText = (status) => {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "pending_cancel":
        return "Chờ hủy";
      case "cancelled":
        return "Đã hủy";
      case "dispute":
        return "Tranh chấp";
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

  // Handle approve
  const handleApprove = () => {
    setApproveModalVisible(true);
    approveForm.setFieldsValue({
      compensate_amount: cancelRequest?.compensate_amount || 0,
    });
  };

  // Handle deny
  const handleDeny = () => {
    setDenyModalVisible(true);
  };

  // Submit approve
  const onApproveSubmit = async (values) => {
    setSubmitting(true);
    try {
      const result = await reviewCancelRequest(
        "approved",
        values.review_notes || "Chấp thuận hủy hợp đồng",
        values.compensate_amount || 0
      );

      if (result.success) {
        setApproveModalVisible(false);
        approveForm.resetFields();
        message.success("Chấp thuận yêu cầu hủy thành công");
        router.push("/policy/cancel");
      }
    } catch (error) {
      console.error("Error approving cancel request:", error);
      message.error("Chấp thuận yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit deny
  const onDenySubmit = async (values) => {
    if (!values.review_notes?.trim()) {
      message.error("Vui lòng nhập lý do từ chối và thông tin liên lạc");
      return;
    }

    setSubmitting(true);
    try {
      const result = await reviewCancelRequest("denied", values.review_notes);

      if (result.success) {
        setDenyModalVisible(false);
        denyForm.resetFields();
        message.success(
          "Từ chối yêu cầu hủy thành công. Hợp đồng chuyển sang trạng thái tranh chấp"
        );
        router.push("/policy/cancel");
      }
    } catch (error) {
      console.error("Error denying cancel request:", error);
      message.error("Từ chối yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || policyLoading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Đang tải thông tin..." />
        </div>
      </Layout.Content>
    );
  }

  if (!cancelRequest) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Không tìm thấy yêu cầu hủy</Text>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="insurance-header mb-6">
          <div>
            <Title level={2} className="insurance-title">
              Chi Tiết Yêu Cầu Hủy Hợp Đồng
            </Title>
            <Text className="insurance-subtitle">
              Mã yêu cầu: {cancelRequest.id}
            </Text>
          </div>
          <div>
            <Space>
              <Button onClick={() => router.back()}>Quay lại</Button>
              {cancelRequest.status === "pending_review" && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleApprove}
                  >
                    Chấp thuận
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleDeny}
                  >
                    Từ chối
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {/* Cancel Request Info */}
          <Col span={24}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Thông tin yêu cầu hủy</span>
                </Space>
              }
              extra={
                <Tag
                  color={getCancelStatusColor(cancelRequest.status)}
                  style={{ fontSize: "14px", padding: "4px 12px" }}
                >
                  {getCancelStatusText(cancelRequest.status)}
                </Tag>
              }
            >
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Mã yêu cầu" span={1}>
                  {cancelRequest.id}
                </Descriptions.Item>
                <Descriptions.Item label="Loại yêu cầu" span={1}>
                  <Tag color="blue">
                    {getCancelTypeText(cancelRequest.cancel_request_type)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Mã hợp đồng" span={2}>
                  {cancelRequest.registered_policy_id}
                </Descriptions.Item>
                <Descriptions.Item label="Lý do hủy" span={2}>
                  {cancelRequest.reason}
                </Descriptions.Item>
                <Descriptions.Item label="Người yêu cầu" span={1}>
                  {cancelRequest.requested_by}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày yêu cầu" span={1}>
                  {new Date(cancelRequest.requested_at).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền bồi thường" span={1}>
                  {formatCurrency(cancelRequest.compensate_amount)}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={1}>
                  <Tag color={getCancelStatusColor(cancelRequest.status)}>
                    {getCancelStatusText(cancelRequest.status)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* Evidence */}
              {cancelRequest.evidence &&
                Object.keys(cancelRequest.evidence).length > 0 && (
                  <>
                    <Divider>Bằng chứng đính kèm</Divider>
                    <pre className="bg-gray-50 p-4 rounded">
                      {JSON.stringify(cancelRequest.evidence, null, 2)}
                    </pre>
                  </>
                )}
            </Card>
          </Col>

          {/* Review Info (if reviewed) */}
          {cancelRequest.reviewed_by && (
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <ExclamationCircleOutlined />
                    <span>Thông tin xem xét</span>
                  </Space>
                }
              >
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Người xem xét" span={1}>
                    {cancelRequest.reviewed_by}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian xem xét" span={1}>
                    {new Date(cancelRequest.reviewed_at).toLocaleString(
                      "vi-VN"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Ghi chú / Thông tin giải quyết"
                    span={2}
                  >
                    {cancelRequest.review_notes || "-"}
                  </Descriptions.Item>
                </Descriptions>

                {cancelRequest.status === "denied" && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <Space>
                      <WarningOutlined style={{ color: "#ff4d4f" }} />
                      <Text strong style={{ color: "#ff4d4f" }}>
                        Yêu cầu bị từ chối - Hợp đồng chuyển sang trạng thái
                        tranh chấp
                      </Text>
                    </Space>
                    <p className="mt-2 text-sm">
                      Hai bên cần liên lạc offline để giải quyết. Thông tin liên
                      lạc: {cancelRequest.review_notes}
                    </p>
                  </div>
                )}
              </Card>
            </Col>
          )}

          {/* Policy Info */}
          {policy && (
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>Thông tin hợp đồng</span>
                  </Space>
                }
                extra={
                  <Tag
                    color={getPolicyStatusColor(policy.status)}
                    style={{ fontSize: "14px", padding: "4px 12px" }}
                  >
                    {getPolicyStatusText(policy.status)}
                  </Tag>
                }
              >
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Số hợp đồng" span={1}>
                    {policy.policy_number}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã nông dân" span={1}>
                    {policy.farmer_id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền bảo hiểm" span={1}>
                    {formatCurrency(policy.coverage_amount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phí bảo hiểm" span={1}>
                    {formatCurrency(policy.total_farmer_premium)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày bắt đầu" span={1}>
                    {new Date(
                      policy.coverage_start_date * 1000
                    ).toLocaleDateString("vi-VN")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày kết thúc" span={1}>
                    {new Date(
                      policy.coverage_end_date * 1000
                    ).toLocaleDateString("vi-VN")}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          )}
        </Row>

        {/* Approve Modal */}
        <Modal
          title="Chấp thuận yêu cầu hủy"
          open={approveModalVisible}
          onCancel={() => setApproveModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form form={approveForm} layout="vertical" onFinish={onApproveSubmit}>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <Space>
                <WarningOutlined style={{ color: "#faad14" }} />
                <Text>
                  Sau khi chấp thuận, hợp đồng sẽ chuyển sang trạng thái "Đã
                  hủy"
                </Text>
              </Space>
            </div>

            <Form.Item
              label="Số tiền bồi thường (nếu có)"
              name="compensate_amount"
              rules={[{ required: false }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                addonAfter="VND"
              />
            </Form.Item>

            <Form.Item
              label="Ghi chú xem xét"
              name="review_notes"
              rules={[{ required: false }]}
            >
              <TextArea
                rows={4}
                placeholder="Nhập ghi chú về việc chấp thuận và thông tin bồi thường..."
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => setApproveModalVisible(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<CheckCircleOutlined />}
                >
                  Xác nhận chấp thuận
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Deny Modal */}
        <Modal
          title="Từ chối yêu cầu hủy"
          open={denyModalVisible}
          onCancel={() => setDenyModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form form={denyForm} layout="vertical" onFinish={onDenySubmit}>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <Space direction="vertical">
                <Space>
                  <WarningOutlined style={{ color: "#ff4d4f" }} />
                  <Text strong>
                    Sau khi từ chối, hợp đồng sẽ chuyển sang trạng thái "Tranh
                    chấp"
                  </Text>
                </Space>
                <Text type="secondary" className="text-sm">
                  Hai bên cần tự liên lạc offline để giải quyết. Vui lòng cung
                  cấp thông tin liên lạc trong ghi chú.
                </Text>
              </Space>
            </div>

            <Form.Item
              label="Lý do từ chối và thông tin liên lạc"
              name="review_notes"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng nhập lý do từ chối và thông tin liên lạc để giải quyết",
                },
              ]}
            >
              <TextArea
                rows={6}
                placeholder="Ví dụ: Yêu cầu hủy không hợp lệ vì hợp đồng đã vào hiệu lực hơn 1 tuần. Vui lòng liên hệ qua điện thoại: 0123-456-789 hoặc email: support@company.com để thảo luận thêm."
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => setDenyModalVisible(false)}>Hủy</Button>
                <Button
                  danger
                  htmlType="submit"
                  loading={submitting}
                  icon={<CloseCircleOutlined />}
                >
                  Xác nhận từ chối
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout.Content>
  );
}
