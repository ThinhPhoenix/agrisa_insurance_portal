"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import useClaim from "@/services/hooks/claim/use-claim";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Layout,
  message,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "../../policy/policy.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function ClaimDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const {
    claimDetail,
    claimDetailLoading,
    claimDetailError,
    fetchClaimDetail,
    validateClaim,
    createClaimRejection,
  } = useClaim();

  // States for related data
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [basePolicy, setBasePolicy] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!claimId) return;

      try {
        // 1. Fetch claim detail first
        await fetchClaimDetail(claimId);
      } catch (error) {
        console.error("Error fetching claim detail:", error);
      }
    };

    fetchAllData();
  }, [claimId, fetchClaimDetail]);

  // Fetch related data when claimDetail is loaded
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!claimDetail) return;

      setAllDataLoaded(false);

      try {
        // Fetch all related data in parallel
        const promises = [];

        // Fetch policy detail
        if (claimDetail.registered_policy_id) {
          promises.push(
            axiosInstance
              .get(
                endpoints.policy.policy.detail(claimDetail.registered_policy_id)
              )
              .then((response) => {
                if (response.data.success) {
                  setPolicy(response.data.data);
                  return response.data.data;
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching policy:", error);
                return null;
              })
          );
        }

        // Fetch farm detail
        if (claimDetail.farm_id) {
          promises.push(
            axiosInstance
              .get(endpoints.applications.detail(claimDetail.farm_id))
              .then((response) => {
                if (response.data.success) {
                  setFarm(response.data.data);
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching farm:", error);
                return null;
              })
          );
        }

        // Wait for policy to get insurance_provider_id
        const results = await Promise.all(promises);
        const policyData = results[0];

        // Fetch base policy detail after we have policy data
        if (claimDetail.base_policy_id && policyData?.insurance_provider_id) {
          try {
            const basePolicyUrl = endpoints.policy.base_policy.get_detail(
              claimDetail.base_policy_id,
              {
                provider_id: policyData.insurance_provider_id,
              }
            );
            const basePolicyResponse = await axiosInstance.get(basePolicyUrl);
            if (basePolicyResponse.data.success) {
              setBasePolicy(basePolicyResponse.data.data.base_policy);
            }
          } catch (error) {
            console.error("Error fetching base policy:", error);
          }
        }
      } finally {
        setAllDataLoaded(true);
      }
    };

    fetchRelatedData();
  }, [claimDetail]);

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

  // Format date from epoch timestamp or ISO string
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let date;
    if (typeof timestamp === "string") {
      // ISO string format
      date = new Date(timestamp);
    } else {
      // Unix timestamp
      date =
        timestamp < 5000000000
          ? new Date(timestamp * 1000)
          : new Date(timestamp);
    }
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Rejection types with Vietnamese labels (MUST match API enum exactly)
  const rejectionTypes = [
    {
      value: "claim_data_incorrect",
      label: "Dữ liệu không chính xác",
      desc: "Dữ liệu người nông dân báo cáo khác với vệ tinh/thời tiết",
    },
    {
      value: "trigger_not_met",
      label: "Không đạt điều kiện kích hoạt",
      desc: "Điều kiện trigger không thực sự được thỏa mãn (ngưỡng chưa vượt)",
    },
    {
      value: "policy_not_active",
      label: "Hợp đồng không còn hiệu lực",
      desc: "Hợp đồng đã hủy, hết hạn hoặc chưa active",
    },
    {
      value: "location_mismatch",
      label: "Vị trí không khớp",
      desc: "Vị trí claim nằm ngoài vùng bảo hiểm",
    },
    {
      value: "duplicate_claim",
      label: "Yêu cầu trùng lặp",
      desc: "Đã có claim được duyệt cho cùng sự kiện này",
    },
    {
      value: "suspected_fraud",
      label: "Nghi ngờ gian lận",
      desc: "Phát hiện các pattern bất thường cần điều tra",
    },
    {
      value: "other",
      label: "Lý do khác",
      desc: "Trường hợp không thuộc các loại trên (bắt buộc giải thích chi tiết)",
    },
  ];

  // Handle approve claim
  const handleApprove = () => {
    setApproveModalVisible(true);
  };

  // Handle reject claim
  const handleReject = () => {
    setRejectModalVisible(true);
  };

  // Submit approve form
  const onApproveSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        registered_policy_id: claimDetail.registered_policy_id,
        status: "APPROVED",
        partner_decision: values.partner_decision,
        partner_notes: values.partner_notes,
      };

      const result = await validateClaim(claimDetail.id, payload);

      if (result.success) {
        message.success("Duyệt bồi thường thành công!");
        setApproveModalVisible(false);
        approveForm.resetFields();
        // Reload claim detail
        await fetchClaimDetail(claimId);
      } else {
        message.error(result.error || "Có lỗi xảy ra khi duyệt bồi thường");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi duyệt bồi thường");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reject form
  const onRejectSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Build reason_evidence từ các fields cụ thể
      let reasonEvidence = {};

      // Common fields with proper date formatting
      if (values.event_date) {
        // Convert DatePicker date to YYYY-MM-DD format
        reasonEvidence.event_date = values.event_date.format("YYYY-MM-DD");
      }
      if (values.policy_clause)
        reasonEvidence.policy_clause = values.policy_clause;
      if (values.evidence_documents) {
        // Parse danh sách documents (comma separated) thành array
        reasonEvidence.evidence_documents = values.evidence_documents
          .split(",")
          .map((doc) => doc.trim())
          .filter((doc) => doc);
      }

      // Fields cho blackout period (date fields)
      if (values.blackout_period_start) {
        // Convert DatePicker date to YYYY-MM-DD format
        reasonEvidence.blackout_period_start =
          values.blackout_period_start.format("YYYY-MM-DD");
      }
      if (values.blackout_period_end) {
        // Convert DatePicker date to YYYY-MM-DD format
        reasonEvidence.blackout_period_end =
          values.blackout_period_end.format("YYYY-MM-DD");
      }

      // Parse data từ form để gửi cho cả 2 APIs
      const validatePayload = {
        registered_policy_id: claimDetail.registered_policy_id,
        status: "REJECTED",
        partner_decision: values.reason, // Dùng lý do từ chối làm partner decision
        partner_notes: values.validation_notes, // Dùng ghi chú chi tiết
      };

      const rejectionPayload = {
        claim_id: claimDetail.id,
        validation_timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
        claim_rejection_type: values.claim_rejection_type,
        reason: values.reason,
        validated_by: values.validated_by,
        validation_notes: values.validation_notes,
      };

      // Thêm reason_evidence nếu có ít nhất 1 field (theo API spec)
      if (Object.keys(reasonEvidence).length > 0) {
        rejectionPayload.reason_evidence = reasonEvidence;
      }

      // Gọi 2 APIs song song cùng lúc
      const [validateResult, rejectionResult] = await Promise.all([
        validateClaim(claimDetail.id, validatePayload),
        createClaimRejection(rejectionPayload),
      ]);

      // Kiểm tra kết quả
      if (validateResult.success && rejectionResult.success) {
        message.success("Từ chối bồi thường thành công!");
        setRejectModalVisible(false);
        rejectForm.resetFields();
        // Reload claim detail
        await fetchClaimDetail(claimId);
      } else if (validateResult.success && !rejectionResult.success) {
        message.warning(
          "Đã cập nhật trạng thái từ chối nhưng chưa lưu chi tiết lý do"
        );
        setRejectModalVisible(false);
        rejectForm.resetFields();
        await fetchClaimDetail(claimId);
      } else if (!validateResult.success && rejectionResult.success) {
        message.warning(
          "Đã lưu chi tiết lý do nhưng chưa cập nhật trạng thái từ chối"
        );
      } else {
        message.error("Có lỗi xảy ra khi từ chối bồi thường");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi từ chối bồi thường");
    } finally {
      setSubmitting(false);
    }
  };

  if (claimDetailLoading || !allDataLoaded) {
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="insurance-title !mb-0">
              Chi Tiết Bồi Thường
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
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
            >
              Quay lại
            </Button>
            {claimDetail.status === "pending_partner_review" && (
              <>
                <Button
                  danger
                  size="large"
                  onClick={handleReject}
                  loading={submitting}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleApprove}
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
                    <WalletOutlined
                      style={{ fontSize: 32, color: "#1890ff" }}
                    />
                  </div>
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Tổng số tiền bồi thường
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
                  Bồi thường cố định
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
                    <WalletOutlined
                      style={{ fontSize: 32, color: "#722ed1" }}
                    />
                  </div>
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Bồi thường theo ngưỡng
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
                    <WarningOutlined
                      style={{ fontSize: 32, color: "#fa8c16" }}
                    />
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

        <Row gutter={[16, 16]}>
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
                <Descriptions.Item label="Mã bồi thường">
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
                    <Text type="secondary">
                      {claimDetail.registered_policy_id}
                    </Text>
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
                    <Tag color="blue" icon={<InfoCircleOutlined />}>
                      Tự động
                    </Tag>
                  ) : (
                    <Tag>Thủ công</Tag>
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
                  <Tag
                    color={getStatusColor(claimDetail.status)}
                    style={{ fontSize: "13px" }}
                  >
                    {getStatusText(claimDetail.status)}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin đánh giá của đối tác */}
          {(claimDetail.partner_review_timestamp ||
            claimDetail.partner_decision ||
            claimDetail.reviewed_by ||
            claimDetail.partner_notes) && (
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
                      <Tag
                        color={
                          claimDetail.partner_decision === "approved"
                            ? "green"
                            : "red"
                        }
                        style={{ fontSize: "13px" }}
                      >
                        {claimDetail.partner_decision === "approved"
                          ? "Chấp thuận"
                          : "Từ chối"}
                      </Tag>
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

          {/* Bằng chứng */}
          {claimDetail.evidence_summary && (
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <WarningOutlined style={{ color: "#fa8c16" }} />
                    <span>Bằng Chứng Kích Hoạt Bồi Thường</span>
                  </Space>
                }
                bordered={false}
                className="shadow-sm"
              >
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {/* Summary Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <InfoCircleOutlined
                        style={{ fontSize: 24, color: "#1890ff" }}
                      />
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", display: "block" }}
                        >
                          Phương thức tạo
                        </Text>
                        <Tag
                          color={
                            claimDetail.evidence_summary.generation_method ===
                            "automatic"
                              ? "blue"
                              : "default"
                          }
                          style={{ marginTop: "4px" }}
                        >
                          {claimDetail.evidence_summary.generation_method ===
                          "automatic"
                            ? "Tự động"
                            : "Thủ công"}
                        </Tag>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircleOutlined
                        style={{ fontSize: 24, color: "#52c41a" }}
                      />
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", display: "block" }}
                        >
                          Số điều kiện kích hoạt
                        </Text>
                        <Text
                          strong
                          style={{ fontSize: "20px", color: "#52c41a" }}
                        >
                          {claimDetail.evidence_summary.conditions_count || 0}
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <ClockCircleOutlined
                        style={{ fontSize: 24, color: "#fa8c16" }}
                      />
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", display: "block" }}
                        >
                          Thời điểm kích hoạt
                        </Text>
                        <Text
                          strong
                          style={{ fontSize: "14px", color: "#fa8c16" }}
                        >
                          {formatDate(
                            claimDetail.evidence_summary.triggered_at
                          )}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Conditions Table */}
                  {claimDetail.evidence_summary.conditions &&
                    claimDetail.evidence_summary.conditions.length > 0 && (
                      <div>
                        <div className="mb-3 pb-2 border-b">
                          <Text
                            strong
                            style={{ fontSize: "15px", color: "#262626" }}
                          >
                            Chi tiết các điều kiện kích hoạt
                          </Text>
                        </div>
                        <Table
                          dataSource={claimDetail.evidence_summary.conditions}
                          rowKey={(record, index) =>
                            record.condition_id || index
                          }
                          pagination={false}
                          size="small"
                          bordered
                          scroll={{ x: 1000 }}
                          columns={[
                            {
                              title: "Tham số",
                              dataIndex: "parameter",
                              key: "parameter",
                              width: 100,
                              fixed: "left",
                              render: (text) => (
                                <Tag
                                  color="blue"
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {text?.toUpperCase()}
                                </Tag>
                              ),
                            },
                            {
                              title: "Điều kiện",
                              key: "condition",
                              width: 200,
                              render: (_, record) => (
                                <div>
                                  <Text style={{ fontSize: "13px" }}>
                                    Giá trị đo được{" "}
                                    <Text strong style={{ color: "#fa8c16" }}>
                                      {record.operator}
                                    </Text>{" "}
                                    {record.threshold_value}%
                                  </Text>
                                </div>
                              ),
                            },
                            {
                              title: "Giá trị baseline",
                              dataIndex: "baseline_value",
                              key: "baseline_value",
                              width: 130,
                              render: (val) => (
                                <Text
                                  style={{
                                    fontSize: "13px",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {val ? val.toFixed(4) : "-"}
                                </Text>
                              ),
                            },
                            {
                              title: "Giá trị đo được",
                              dataIndex: "measured_value",
                              key: "measured_value",
                              width: 130,
                              render: (val) => (
                                <Text
                                  strong
                                  style={{
                                    fontSize: "13px",
                                    color: "#1890ff",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {val ? val.toFixed(4) : "-"}
                                </Text>
                              ),
                            },
                            {
                              title: "Ngưỡng cảnh báo",
                              dataIndex: "early_warning_threshold",
                              key: "early_warning_threshold",
                              width: 130,
                              render: (val) => (
                                <Text style={{ fontSize: "13px" }}>
                                  {val ? `${val}%` : "-"}
                                </Text>
                              ),
                            },
                            {
                              title: "Cảnh báo sớm",
                              dataIndex: "is_early_warning",
                              key: "is_early_warning",
                              width: 120,
                              align: "center",
                              render: (val) => (
                                <Tag
                                  color={val ? "orange" : "green"}
                                  style={{ fontSize: "12px" }}
                                >
                                  {val ? "Có" : "Không"}
                                </Tag>
                              ),
                            },
                            {
                              title: "Thời điểm đo",
                              dataIndex: "timestamp",
                              key: "timestamp",
                              width: 150,
                              render: (timestamp) => (
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  {formatDate(timestamp)}
                                </Text>
                              ),
                            },
                          ]}
                        />
                      </div>
                    )}
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </div>

      {/* Approve Modal */}
      <Modal
        title="Xác nhận duyệt bồi thường"
        open={approveModalVisible}
        onCancel={() => {
          setApproveModalVisible(false);
          approveForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={approveForm} layout="vertical" onFinish={onApproveSubmit}>
          <Form.Item
            name="partner_decision"
            label="Quyết định"
            rules={[
              { required: true, message: "Vui lòng nhập quyết định" },
              { max: 500, message: "Tối đa 500 ký tự" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Ví dụ: Yêu cầu bồi thường đáp ứng đầy đủ các điều kiện. Đã xác minh tài liệu vào ngày..."
            />
          </Form.Item>

          <Form.Item
            name="partner_notes"
            label="Ghi chú chi tiết"
            rules={[
              { required: true, message: "Vui lòng nhập ghi chú" },
              { max: 1000, message: "Tối đa 1000 ký tự" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập các ghi chú chi tiết về quá trình xem xét, bằng chứng đã kiểm tra..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setApproveModalVisible(false);
                  approveForm.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Xác nhận duyệt
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối Yêu Cầu Bồi Thường"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        footer={null}
        width={900}
        style={{ maxHeight: "90vh" }}
        bodyStyle={{ maxHeight: "calc(90vh - 110px)", overflowY: "auto" }}
      >
        <Form form={rejectForm} layout="vertical" onFinish={onRejectSubmit}>
          {/* Section 1: Thông tin cơ bản từ chối */}
          <Card
            type="inner"
            title={
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                Thông Tin Từ Chối
              </span>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="claim_rejection_type"
              label={
                <span>
                  Loại Từ Chối{" "}
                  <Tooltip title="Chọn loại từ chối phù hợp nhất. Hover vào từng lựa chọn để xem mô tả chi tiết.">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", cursor: "help" }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng chọn loại từ chối" },
              ]}
              style={{ marginBottom: 12 }}
              tooltip="Chỉ được chọn 1 trong 7 loại enum được định nghĩa bởi API"
            >
              <Select placeholder="Chọn loại từ chối..." size="large">
                {rejectionTypes.map((type) => (
                  <Option key={type.value} value={type.value} title={type.desc}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{type.label}</div>
                      <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                        {type.desc}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="reason"
              label="Lý Do Từ Chối"
              rules={[
                { required: true, message: "Vui lòng nhập lý do từ chối" },
                { max: 500, message: "Tối đa 500 ký tự" },
              ]}
              style={{ marginBottom: 12 }}
            >
              <TextArea
                rows={2}
                placeholder="Ví dụ: Dữ liệu lượng mưa báo cáo không khớp với dữ liệu vệ tinh..."
                maxLength={500}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="validated_by"
                  label="Người Đánh Giá"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập tên người đánh giá",
                    },
                    { max: 200, message: "Tối đa 200 ký tự" },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="Ví dụ: Nguyễn Văn A - Chuyên viên thẩm định"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="validation_notes"
                  label="Ghi Chú Chi Tiết"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập ghi chú chi tiết",
                    },
                    { max: 1000, message: "Tối đa 1000 ký tự" },
                  ]}
                  style={{ marginBottom: 0 }}
                  extra={
                    <span style={{ fontSize: "11px" }}>
                      Giải thích chi tiết lý do từ chối, bằng chứng đã xem xét
                    </span>
                  }
                >
                  <TextArea
                    rows={2}
                    placeholder="Sau khi xem xét kỹ lưỡng hình ảnh vệ tinh..."
                    maxLength={1000}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          {/* Section 2: Bằng chứng chi tiết */}
          <Card
            type="inner"
            title={
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                Bằng Chứng Chi Tiết (Tùy Chọn)
              </span>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="event_date"
                  label={
                    <span>
                      Ngày Sự Kiện{" "}
                      <Tooltip title="Ngày xảy ra sự kiện. Sẽ được chuyển sang format YYYY-MM-DD khi gửi API">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày sự kiện"
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="policy_clause"
                  label="Điều Khoản Chính Sách Không Hợp Lệ"
                  style={{ marginBottom: 12 }}
                >
                  <Input
                    placeholder="VD: Điều 2 - Mục 5: Bảo hiểm không áp dụng cho thiệt hại do lũ lụt"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="blackout_period_start"
                  label={
                    <span>
                      Khoảng Thời Gian Không Bảo Hiểm (Từ){" "}
                      <Tooltip title="Ngày bắt đầu của khoảng thời gian không được bảo hiểm. Sẽ được chuyển sang YYYY-MM-DD">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày bắt đầu"
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="blackout_period_end"
                  label={
                    <span>
                      Khoảng Thời Gian Không Bảo Hiểm (Đến){" "}
                      <Tooltip title="Ngày kết thúc của khoảng thời gian không được bảo hiểm. Sẽ được chuyển sang YYYY-MM-DD">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày kết thúc"
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="evidence_documents"
                  label={
                    <span>
                      Tên Tài Liệu Bằng Chứng{" "}
                      <Tooltip title="Nhập tên các file, cách nhau bởi dấu phẩy. Sẽ được chuyển thành array khi gửi API">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  extra="Nhập tên các file, cách nhau bởi dấu phẩy (ví dụ: file1.pdf, file2.pdf)"
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="VD: hopdong_v1.2.pdf, baocaoluongmua_2025.pdf"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          {/* Action Buttons */}
          <Form.Item className="mb-0" style={{ marginTop: 16 }}>
            <Space className="w-full justify-end" size="middle">
              <Button
                onClick={() => {
                  setRejectModalVisible(false);
                  rejectForm.resetFields();
                }}
                size="large"
              >
                Hủy
              </Button>
              <Button
                danger
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
              >
                Xác Nhận Từ Chối
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout.Content>
  );
}
