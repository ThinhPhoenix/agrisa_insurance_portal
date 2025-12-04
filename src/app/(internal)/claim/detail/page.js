"use client";

import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import useClaim from "@/services/hooks/claim/use-claim";
import usePayout from "@/services/hooks/payout/use-payout";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Collapse,
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
    fetchRejectionByClaim,
  } = useClaim();

  const { payoutsByPolicy, payoutsByPolicyLoading, fetchPayoutsByPolicy } =
    usePayout();

  // States for related data
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [basePolicy, setBasePolicy] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Rejection state
  const [rejection, setRejection] = useState(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrData, setQrData] = useState(null);

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

        // Fetch rejection if status is rejected
        if (claimDetail.status === "rejected") {
          console.log(
            "Claim status is rejected, fetching rejection details..."
          );
          setRejectionLoading(true);
          try {
            const rejectionResult = await fetchRejectionByClaim(claimDetail.id);
            console.log("Rejection fetch result:", rejectionResult);
            if (rejectionResult.success) {
              setRejection(rejectionResult.data);
              console.log("Rejection data set:", rejectionResult.data);
            } else {
              console.error(
                "Failed to fetch rejection:",
                rejectionResult.error
              );
            }
          } catch (error) {
            console.error("Error fetching rejection:", error);
          } finally {
            setRejectionLoading(false);
          }
        } else {
          console.log("Claim status is NOT rejected:", claimDetail.status);
        }

        // Fetch payouts if status is approved or paid
        if (
          claimDetail.status === "approved" ||
          claimDetail.status === "paid"
        ) {
          console.log("Claim is approved/paid, fetching payouts...");
          if (claimDetail.registered_policy_id) {
            await fetchPayoutsByPolicy(claimDetail.registered_policy_id);
          }
        }
      } finally {
        setAllDataLoaded(true);
      }
    };

    fetchRelatedData();
  }, [claimDetail, fetchRejectionByClaim, fetchPayoutsByPolicy]);

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

  // Get rejection type text
  const getRejectionTypeText = (type) => {
    switch (type) {
      case "claim_data_incorrect":
        return "Dữ liệu không chính xác";
      case "trigger_not_met":
        return "Không đạt điều kiện kích hoạt";
      case "policy_not_active":
        return "Hợp đồng không còn hiệu lực";
      case "location_mismatch":
        return "Vị trí không khớp";
      case "duplicate_claim":
        return "Yêu cầu trùng lặp";
      case "suspected_fraud":
        return "Nghi ngờ gian lận";
      case "policy_exclusion":
        return "Nằm trong điều khoản loại trừ";
      case "other":
        return "Lý do khác";
      default:
        return type;
    }
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
        status: "approved",
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
        status: "rejected",
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

  // Handle payment initiation
  const handlePayment = async (payout) => {
    setSelectedPayout(payout);
    setPaymentLoading(true);
    setPaymentModalVisible(true);

    try {
      // Call create payout API
      const response = await axiosInstance.post("/payment/public/payout", {
        amount: payout.payout_amount,
        bank_code: "970415", // Vietinbank - You may need to get this from user/config
        account_number: "123456789", // You may need to get this from user/config
        user_id: claimDetail.farmer_id || claimDetail.registered_policy_id,
        description: `Chi trả bảo hiểm claim ${claimDetail.claim_number}`,
      });

      if (response.data.success) {
        // Response structure: data.data contains the actual payout data
        const payoutData = response.data.data?.data || response.data.data;
        setQrData(payoutData);
        message.success("Đã tạo mã QR thanh toán");
      } else {
        message.error("Không thể tạo mã QR thanh toán");
        setPaymentModalVisible(false);
      }
    } catch (error) {
      console.error("Error creating payout:", error);
      message.error("Có lỗi xảy ra khi tạo thanh toán");
      setPaymentModalVisible(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle payment verification
  const handleVerifyPayment = async () => {
    if (!qrData || !qrData.verify_hook) {
      message.error("Không tìm thấy thông tin xác thực");
      return;
    }

    setPaymentLoading(true);
    try {
      // Call verify endpoint
      const response = await axiosInstance.get(qrData.verify_hook);

      if (response.data.success) {
        message.success("Xác nhận thanh toán thành công!");
        setPaymentModalVisible(false);
        setQrData(null);
        setSelectedPayout(null);
        // Refresh payout list
        if (claimDetail.registered_policy_id) {
          await fetchPayoutsByPolicy(claimDetail.registered_policy_id);
        }
      } else {
        message.error("Xác nhận thanh toán thất bại");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      message.error("Có lỗi xảy ra khi xác nhận thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle close payment modal
  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setQrData(null);
    setSelectedPayout(null);
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
          {/* Thông tin chi trả - Only show when status is approved or paid */}
          {(claimDetail.status === "approved" ||
            claimDetail.status === "paid") && (
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <WalletOutlined style={{ color: "#52c41a" }} />
                    <span>Thông Tin Chi Trả</span>
                  </Space>
                }
                bordered={false}
                className="shadow-sm"
                style={{ borderLeft: "4px solid #52c41a" }}
              >
                {payoutsByPolicyLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Spin size="large" tip="Đang tải thông tin chi trả..." />
                  </div>
                ) : payoutsByPolicy && payoutsByPolicy.length > 0 ? (
                  <div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "13px",
                        display: "block",
                        marginBottom: "16px",
                      }}
                    >
                      Tìm thấy {payoutsByPolicy.length} khoản chi trả cho đơn
                      bảo hiểm này
                    </Text>
                    <Table
                      dataSource={payoutsByPolicy.filter(
                        (payout) => payout.claim_id === claimDetail.id
                      )}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      bordered
                      columns={[
                        {
                          title: "Mã chi trả",
                          dataIndex: "id",
                          key: "id",
                          width: 280,
                          render: (id) => (
                            <Link href={`/payout/detail?id=${id}`}>
                              <Text
                                style={{
                                  color: "#1890ff",
                                  fontSize: "12px",
                                  fontFamily: "monospace",
                                }}
                              >
                                {id}
                              </Text>
                            </Link>
                          ),
                        },
                        {
                          title: "Số tiền",
                          dataIndex: "payout_amount",
                          key: "payout_amount",
                          width: 150,
                          render: (amount, record) => (
                            <Text
                              strong
                              style={{ color: "#52c41a", fontSize: "14px" }}
                            >
                              {formatCurrency(amount)}
                            </Text>
                          ),
                        },
                        {
                          title: "Loại tiền",
                          dataIndex: "currency",
                          key: "currency",
                          width: 80,
                          render: (currency) => (
                            <Tag color="blue">{currency || "VND"}</Tag>
                          ),
                        },
                        {
                          title: "Trạng thái",
                          dataIndex: "status",
                          key: "status",
                          width: 130,
                          render: (status) => {
                            const statusConfig = {
                              pending: {
                                color: "default",
                                text: "Chờ xử lý",
                                icon: <ClockCircleOutlined />,
                              },
                              processing: {
                                color: "orange",
                                text: "Đang xử lý",
                                icon: <ClockCircleOutlined />,
                              },
                              completed: {
                                color: "green",
                                text: "Hoàn tất",
                                icon: <CheckCircleOutlined />,
                              },
                              failed: {
                                color: "red",
                                text: "Thất bại",
                                icon: <CloseCircleOutlined />,
                              },
                            };
                            const config =
                              statusConfig[status] || statusConfig.pending;
                            return (
                              <Tag color={config.color} icon={config.icon}>
                                {config.text}
                              </Tag>
                            );
                          },
                        },
                        {
                          title: "Thời gian khởi tạo",
                          dataIndex: "initiated_at",
                          key: "initiated_at",
                          width: 150,
                          render: (timestamp) => (
                            <Text style={{ fontSize: "12px" }}>
                              {formatDate(timestamp)}
                            </Text>
                          ),
                        },
                        {
                          title: "Thời gian hoàn tất",
                          dataIndex: "completed_at",
                          key: "completed_at",
                          width: 150,
                          render: (timestamp) => (
                            <Text style={{ fontSize: "12px" }}>
                              {formatDate(timestamp)}
                            </Text>
                          ),
                        },
                        {
                          title: "Xác nhận nông dân",
                          dataIndex: "farmer_confirmed",
                          key: "farmer_confirmed",
                          width: 130,
                          align: "center",
                          render: (confirmed) => (
                            <Tag
                              color={confirmed ? "green" : "default"}
                              icon={
                                confirmed ? (
                                  <CheckCircleOutlined />
                                ) : (
                                  <ClockCircleOutlined />
                                )
                              }
                            >
                              {confirmed ? "Đã xác nhận" : "Chưa xác nhận"}
                            </Tag>
                          ),
                        },
                        {
                          title: "Hành động",
                          key: "action",
                          width: 150,
                          align: "center",
                          fixed: "right",
                          render: (_, record) => (
                            <Space>
                              <Button
                                type="primary"
                                icon={<WalletOutlined />}
                                size="small"
                                onClick={() => handlePayment(record)}
                                disabled={record.status === "completed"}
                              >
                                Thanh toán
                              </Button>
                              <Link href={`/payout/detail?id=${record.id}`}>
                                <Button
                                  type="link"
                                  icon={<EyeOutlined />}
                                  size="small"
                                >
                                  Xem
                                </Button>
                              </Link>
                            </Space>
                          ),
                        },
                      ]}
                      scroll={{ x: 1200 }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <WalletOutlined
                      style={{
                        fontSize: 48,
                        color: "#d9d9d9",
                        marginBottom: "16px",
                      }}
                    />
                    <Text
                      type="secondary"
                      style={{ display: "block", marginBottom: "8px" }}
                    >
                      Chưa có khoản chi trả nào cho yêu cầu bồi thường này
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Khoản chi trả sẽ được tạo sau khi yêu cầu được xử lý
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          )}

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

          {/* Thông tin từ chối - Only show when status is rejected */}
          {claimDetail.status === "rejected" && (
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    <span>Chi Tiết Lý Do Từ Chối</span>
                  </Space>
                }
                bordered={false}
                className="shadow-sm"
                style={{ borderLeft: "4px solid #ff4d4f" }}
              >
                {rejectionLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Spin size="large" tip="Đang tải thông tin từ chối..." />
                  </div>
                ) : rejection ? (
                  <>
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="Loại từ chối" span={2}>
                        <Tag color="red" style={{ fontSize: "14px" }}>
                          {getRejectionTypeText(rejection.claim_rejection_type)}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Lý do từ chối" span={2}>
                        <Text strong>{rejection.reason}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Người đánh giá" span={1}>
                        <Text>{rejection.validated_by}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian đánh giá" span={1}>
                        <Text strong style={{ color: "#ff4d4f" }}>
                          {formatDate(rejection.validation_timestamp)}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ghi chú chi tiết" span={2}>
                        <Text>{rejection.validation_notes}</Text>
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Bằng chứng chi tiết - Only show if exists */}
                    {rejection.reason_evidence &&
                      Object.keys(rejection.reason_evidence).length > 0 && (
                        <div style={{ marginTop: "16px" }}>
                          <Collapse
                            size="small"
                            items={[
                              {
                                key: "1",
                                label: (
                                  <Text strong style={{ fontSize: "14px" }}>
                                    Bằng chứng chi tiết
                                  </Text>
                                ),
                                children: (
                                  <div className="space-y-3">
                                    {rejection.reason_evidence.event_date && (
                                      <div>
                                        <Text strong>Ngày sự kiện: </Text>
                                        <Text>
                                          {rejection.reason_evidence.event_date}
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .policy_clause && (
                                      <div>
                                        <Text strong>
                                          Điều khoản chính sách:{" "}
                                        </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .policy_clause
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .claimed_value && (
                                      <div>
                                        <Text strong>Giá trị yêu cầu: </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .claimed_value
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .measured_value && (
                                      <div>
                                        <Text strong>Giá trị đo được: </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .measured_value
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .threshold_value && (
                                      <div>
                                        <Text strong>Ngưỡng kích hoạt: </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .threshold_value
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .blackout_period_start && (
                                      <div>
                                        <Text strong>
                                          Bắt đầu giai đoạn loại trừ:{" "}
                                        </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .blackout_period_start
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .blackout_period_end && (
                                      <div>
                                        <Text strong>
                                          Kết thúc giai đoạn loại trừ:{" "}
                                        </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .blackout_period_end
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .discrepancy_percent && (
                                      <div>
                                        <Text strong>
                                          Phần trăm chênh lệch:{" "}
                                        </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .discrepancy_percent
                                          }
                                          %
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence.data_source && (
                                      <div>
                                        <Text strong>Nguồn dữ liệu: </Text>
                                        <Text>
                                          {
                                            rejection.reason_evidence
                                              .data_source
                                          }
                                        </Text>
                                      </div>
                                    )}
                                    {rejection.reason_evidence
                                      .evidence_documents &&
                                      rejection.reason_evidence
                                        .evidence_documents.length > 0 && (
                                        <div>
                                          <Text strong>
                                            Tài liệu bằng chứng:{" "}
                                          </Text>
                                          <ul className="ml-4 mt-1">
                                            {rejection.reason_evidence.evidence_documents.map(
                                              (doc, idx) => (
                                                <li key={idx}>
                                                  <Text>{doc}</Text>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>
                      )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Text type="secondary">
                      Không tìm thấy thông tin chi tiết về lý do từ chối
                    </Text>
                  </div>
                )}
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

      {/* Payment QR Modal */}
      <Modal
        title={
          <Space>
            <WalletOutlined style={{ color: "#52c41a" }} />
            <span>Thanh toán Chi trả</span>
          </Space>
        }
        open={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        width={500}
        footer={null}
        centered
      >
        {paymentLoading && !qrData ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip="Đang tạo mã QR..." />
          </div>
        ) : qrData ? (
          <div className="space-y-4">
            {/* Payout Info */}
            <Card size="small" className="bg-blue-50">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Số tiền chi trả">
                  <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                    {formatCurrency(selectedPayout?.payout_amount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mã chi trả">
                  <Text style={{ fontSize: "12px", fontFamily: "monospace" }}>
                    {selectedPayout?.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả">
                  <Text type="secondary">
                    Chi trả bảo hiểm claim {claimDetail.claim_number}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* QR Code */}
            <div className="flex justify-center py-6">
              <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                <img
                  src={qrData.qr}
                  alt="QR Code"
                  style={{ width: "280px", height: "280px" }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <Text style={{ fontSize: "13px", display: "block" }}>
                <InfoCircleOutlined
                  style={{ color: "#faad14", marginRight: "8px" }}
                />
                <strong>Hướng dẫn:</strong>
              </Text>
              <ul className="ml-6 mt-2 space-y-1" style={{ fontSize: "12px" }}>
                <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                <li>Quét mã QR trên để chuyển khoản</li>
                <li>Xác nhận giao dịch trong ứng dụng ngân hàng</li>
                <li>
                  Sau khi chuyển khoản thành công, nhấn "Xác nhận thanh toán"
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                size="large"
                onClick={handleClosePaymentModal}
                disabled={paymentLoading}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleVerifyPayment}
                loading={paymentLoading}
              >
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Text type="danger">Không thể tạo mã QR thanh toán</Text>
          </div>
        )}
      </Modal>

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
