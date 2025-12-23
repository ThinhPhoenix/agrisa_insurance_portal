"use client";

import CancelDetailModals from "@/components/layout/policy/cancel/CancelDetailModals";
import axiosInstance from "@/libs/axios-instance";
import { formatUtcDate } from "@/libs/date-utils";
import {
  getCancelRequestError,
  getCancelRequestSuccess,
} from "@/libs/message/cancel-request-message";
import { endpoints } from "@/services/endpoints";
import { useCancelPolicy } from "@/services/hooks/policy/use-cancel-policy";
import { useGetPublicUser } from "@/services/hooks/profile/use-profile";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
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
import { useEffect, useRef, useState } from "react";
import "../../policy.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CancelRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;

  const {
    allCancelRequests,
    loading,
    reviewCancelRequest,
    resolveDispute,
    resolveDisputePartner,
    getCancelRequestById,
    refetch,
    revokeCancelRequest,
  } = useCancelPolicy();

  const cancelRequest = getCancelRequestById(requestId);
  const { getPublicUser } = useGetPublicUser();

  const [approveForm] = Form.useForm();
  const [denyForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const resolveDisputePartnerFormRef = useRef();

  // Related data
  const [policy, setPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [denyModalVisible, setDenyModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [
    resolveDisputePartnerModalVisible,
    setResolveDisputePartnerModalVisible,
  ] = useState(false);
  const [resolveAction, setResolveAction] = useState(null); // 'approve' or 'keep_active'
  const [submitting, setSubmitting] = useState(false);

  // Server holds newly created cancel requests for 1 hour before notifying the holder.
  // During this hold the requester may revoke the request. We track remaining hold time.
  const HOLD_DURATION_MS = 60 * 60 * 1000; // 1 hour
  const [holdRemainingMs, setHoldRemainingMs] = useState(null);

  // Update holdRemainingMs every second while there is a created_at timestamp
  useEffect(() => {
    if (!cancelRequest?.created_at) {
      setHoldRemainingMs(null);
      return;
    }

    const createdTs = new Date(cancelRequest.created_at).getTime();

    const updateRemaining = () => {
      const remaining = HOLD_DURATION_MS - (Date.now() - createdTs);
      setHoldRemainingMs(remaining > 0 ? remaining : 0);
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [cancelRequest?.created_at]);

  // User display names
  const [requestedByName, setRequestedByName] = useState("");
  const [reviewedByName, setReviewedByName] = useState("");

  // Check if current user is the requester
  const [isMyRequest, setIsMyRequest] = useState(false);
  const [currentPartnerId, setCurrentPartnerId] = useState(null);

  // Get current user's partner_id from localStorage
  useEffect(() => {
    try {
      const meData = localStorage.getItem("me");
      if (meData) {
        const me = JSON.parse(meData);
        setCurrentPartnerId(me.partner_id);
      }
    } catch (error) {
      console.error("Error parsing me data:", error);
    }
  }, []);

  // Check if this is the current user's request
  useEffect(() => {
    if (currentPartnerId && cancelRequest?.requested_by) {
      setIsMyRequest(currentPartnerId === cancelRequest.requested_by);
    }
  }, [currentPartnerId, cancelRequest?.requested_by]);

  // Fetch requester display name
  useEffect(() => {
    let mounted = true;
    const id = cancelRequest?.requested_by;
    if (!id) return;

    // Check if requested_by is the current user's partner (company side)
    if (currentPartnerId && id === currentPartnerId) {
      setRequestedByName("Phía công ty");
      return;
    }

    // Otherwise, fetch user display name from API
    getPublicUser(id)
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data?.display_name) {
          setRequestedByName(res.data.display_name);
        } else {
          setRequestedByName(`Người yêu cầu ${id}`);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setRequestedByName(`Người yêu cầu ${id}`);
      });

    return () => {
      mounted = false;
    };
  }, [cancelRequest?.requested_by, currentPartnerId, getPublicUser]);

  // Fetch reviewer display name
  useEffect(() => {
    let mounted = true;
    const id = cancelRequest?.reviewed_by;
    if (!id) return;

    // Check if reviewed_by is the current user's partner (company side)
    if (currentPartnerId && id === currentPartnerId) {
      setReviewedByName("Phía công ty");
      return;
    }

    // Otherwise, fetch user display name from API
    getPublicUser(id)
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data?.display_name) {
          setReviewedByName(res.data.display_name);
        } else {
          setReviewedByName(`Người xem xét ${id}`);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setReviewedByName(`Người xem xét ${id}`);
      });

    return () => {
      mounted = false;
    };
  }, [cancelRequest?.reviewed_by, currentPartnerId, getPublicUser]);

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
      case "cancelled":
        return "red";
      case "dispute":
        return "volcano";
      case "litigation":
        return "purple";
      case "payment_failed":
        return "red";
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
      case "cancelled":
        return "Đã hủy";
      case "dispute":
        return "Tranh chấp";
      case "litigation":
        return "Tranh chấp";
      case "payment_failed":
        return "Thanh toán thất bại";
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

  // Format remaining hold time into human readable string
  const formatRemaining = (ms) => {
    if (ms == null) return "";
    if (ms <= 0) return "0s";
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Parse evidence object - handles BE format: { description, images: [{ url, comment }] }
  const parseEvidenceToPairs = (evidence) => {
    if (!evidence) return [];

    // BE format: { description: string, images: [{ url: string, comment: string }] }
    if (typeof evidence === "object" && !Array.isArray(evidence)) {
      const description = evidence.description || "";
      const images = evidence.images || [];

      // Ensure images is an array and each item has url property
      const normalizedImages = Array.isArray(images)
        ? images.map((img) => {
            if (typeof img === "string") {
              return { url: img, comment: "" };
            }
            if (typeof img === "object" && img !== null) {
              return {
                url: img.url || "",
                comment: img.comment || "",
              };
            }
            return { url: "", comment: "" };
          })
        : [];

      return [{ description, images: normalizedImages }];
    }

    return [];
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

  // Handle revoke (requester/partner can revoke during notice period)
  const handleRevoke = () => {
    Modal.confirm({
      title: "Xác nhận hủy yêu cầu hủy hợp đồng",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy yêu cầu hủy hợp đồng này?</p>
          <p>
            <strong>Lưu ý:</strong> Sau khi hủy yêu cầu, mọi tranh chấp, mâu
            thuẫn hoặc hệ quả phát sinh giữa hai bên sẽ phải tự giải quyết.
          </p>
          <p>
            Nền tảng sẽ không chịu trách nhiệm về bất kỳ hành vi, thiệt hại hoặc
            nghĩa vụ nào phát sinh từ quyết định này.
          </p>
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        setSubmitting(true);
        try {
          const result = await revokeCancelRequest(requestId);
          if (result.success) {
            message.success(getCancelRequestSuccess("REVOKED"));
            // refresh list and navigate back to list
            if (refetch) await refetch();
            router.push("/policy/cancel");
          } else {
            message.error(
              result.error || getCancelRequestError("REVOKE_FAILED")
            );
          }
        } catch (err) {
          console.error("Error revoking request:", err);
          message.error(getCancelRequestError("REVOKE_FAILED"));
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // Submit approve
  const onApproveSubmit = async (values) => {
    setSubmitting(true);
    try {
      const result = await reviewCancelRequest(
        requestId, // id
        true, // approved = true
        values.review_notes || "Chấp thuận hủy hợp đồng"
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
      const result = await reviewCancelRequest(
        requestId, // id
        false, // approved = false
        values.review_notes
      );

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

  // Handle resolve dispute
  const handleResolveDispute = (action) => {
    setResolveAction(action);
    setResolveModalVisible(true);
  };

  // Submit resolve dispute
  const onResolveSubmit = async (values) => {
    if (!values.resolution_notes?.trim()) {
      message.error("Vui lòng nhập thông tin giải quyết");
      return;
    }

    setSubmitting(true);
    try {
      const approved = resolveAction === "approve";
      const result = await resolveDispute(
        requestId, // id
        approved,
        values.resolution_notes
      );

      if (result.success) {
        setResolveModalVisible(false);
        resolveForm.resetFields();
        router.push("/policy/cancel");
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
      message.error("Giải quyết tranh chấp thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle resolve dispute partner - Xử lý tranh chấp từ phía công ty yêu cầu
  const onResolveDisputePartnerSubmit = async (values) => {
    setSubmitting(true);
    try {
      const result = await resolveDisputePartner(
        requestId,
        values.final_decision, // 'approved' or 'denied'
        values.review_notes
      );

      if (result.success) {
        setResolveDisputePartnerModalVisible(false);
        resolveDisputePartnerFormRef.current?.resetFields();
        message.success("Xử lý tranh chấp thành công");
        router.push("/policy/cancel");
      } else {
        // result.error đã được map sang tiếng Việt từ mapBackendErrorToMessage()
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error resolving dispute (partner):", error);
      message.error("Xử lý tranh chấp thất bại");
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
            <Space>
              <Text className="insurance-subtitle">
                Mã yêu cầu: {cancelRequest.id}
              </Text>
              {isMyRequest && (
                <Tag icon={<UserOutlined />} color="blue">
                  Yêu cầu của tôi
                </Tag>
              )}
            </Space>
          </div>
          <div>
            <Space>
              <Button onClick={() => router.back()}>Quay lại</Button>
              {isMyRequest &&
                cancelRequest?.status === "pending_review" &&
                !cancelRequest?.during_notice_period && (
                  <Button danger onClick={handleRevoke} loading={submitting}>
                    Hủy yêu cầu hủy hợp đồng
                  </Button>
                )}
              {!isMyRequest && cancelRequest.status === "pending_review" && (
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
              {!isMyRequest &&
                (cancelRequest.status === "denied" ||
                  cancelRequest.status === "dispute") && (
                  <>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleResolveDispute("approve")}
                    >
                      Giải quyết - Hủy hợp đồng
                    </Button>
                    <Button
                      icon={<ExclamationCircleOutlined />}
                      onClick={() => handleResolveDispute("keep_active")}
                    >
                      Giải quyết - Giữ hợp đồng
                    </Button>
                  </>
                )}
              {isMyRequest &&
                cancelRequest.status === "litigation" &&
                cancelRequest.requested_by !== currentPartnerId && (
                  <Button
                    type="primary"
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => setResolveDisputePartnerModalVisible(true)}
                  >
                    Xử lý Tranh chấp
                  </Button>
                )}
            </Space>
          </div>
        </div>

        {/* Countdown / informational banner moved out of header so buttons don't shift */}
        {cancelRequest?.status === "pending_review" &&
          !cancelRequest?.during_notice_period && (
            <div className="mb-4">
              {holdRemainingMs > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message={
                    isMyRequest
                      ? `Yêu cầu của bạn đang được giữ trên hệ thống trong ${formatRemaining(
                          holdRemainingMs
                        )} trước khi người nhận có thể nhìn thấy và xem xét yêu cầu. Bạn có thể cân nhắc HỦY YÊU CẦU trong thời gian này.`
                      : `Yêu cầu vừa tạo đang ở giai đoạn giữ ${formatRemaining(
                          holdRemainingMs
                        )} trước khi gửi cho người nhận.`
                  }
                />
              ) : holdRemainingMs === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message={"Yêu cầu đã được hệ thống gửi đến người nhận"}
                />
              ) : null}
            </div>
          )}

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
                <Descriptions.Item label="Lý do hủy" span={2}>
                  {cancelRequest.reason}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UserOutlined /> Người yêu cầu
                    </span>
                  }
                  span={1}
                >
                  <Text strong>
                    {requestedByName || cancelRequest.requested_by}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày yêu cầu" span={1}>
                  {formatUtcDate(cancelRequest.requested_at, {
                    withTime: true,
                  })}
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền bồi thường" span={1}>
                  {formatCurrency(cancelRequest.compensate_amount)}
                </Descriptions.Item>
                <Descriptions.Item label="Mã hợp đồng đăng ký" span={1}>
                  {policy ? (
                    <a
                      href="#registered-policy"
                      className="text-blue-600 hover:underline"
                    >
                      <Text strong>{policy.policy_number || policy.id}</Text>
                    </a>
                  ) : (
                    <Text strong>
                      {cancelRequest.registered_policy_id || "-"}
                    </Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trong chu kỳ thông báo" span={1}>
                  <Text
                    strong
                    style={{
                      color: cancelRequest.during_notice_period
                        ? "#389e0d"
                        : "#8c8c8c",
                    }}
                  >
                    {cancelRequest.during_notice_period ? "Có" : "Không"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={1}>
                  <Tag color={getCancelStatusColor(cancelRequest.status)}>
                    {getCancelStatusText(cancelRequest.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Đã thanh toán" span={1}>
                  <Text
                    strong
                    style={{
                      color: cancelRequest.paid ? "#389e0d" : "#cf1322",
                    }}
                  >
                    {cancelRequest.paid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời điểm thanh toán" span={1}>
                  <Text>
                    {cancelRequest.paid_at
                      ? formatUtcDate(cancelRequest.paid_at, { withTime: true })
                      : "-"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  <Text>
                    {formatUtcDate(cancelRequest.created_at, {
                      withTime: true,
                    })}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật" span={1}>
                  <Text>
                    {formatUtcDate(cancelRequest.updated_at, {
                      withTime: true,
                    })}
                  </Text>
                </Descriptions.Item>
              </Descriptions>

              {/* Evidence - render descriptions and images instead of raw JSON */}
              {cancelRequest.evidence &&
                Object.keys(cancelRequest.evidence).length > 0 && (
                  <>
                    <Divider>Bằng chứng đính kèm</Divider>
                    <div className="grid grid-cols-1 gap-4">
                      {parseEvidenceToPairs(cancelRequest.evidence).map(
                        (pair, idx) => (
                          <Card key={idx} className="p-4">
                            {pair.description && (
                              <>
                                <div className="mb-3">
                                  <strong>Mô tả:</strong>
                                </div>
                                <div className="mb-4 text-sm text-gray-700 whitespace-pre-wrap">
                                  {pair.description}
                                </div>
                              </>
                            )}

                            {pair.images && pair.images.length > 0 && (
                              <div>
                                <div className="mb-3">
                                  <strong>
                                    Hình ảnh ({pair.images.length})
                                  </strong>
                                </div>
                                <Image.PreviewGroup>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pair.images.map((imgObj, i) => {
                                      const imgUrl =
                                        typeof imgObj === "string"
                                          ? imgObj
                                          : imgObj.url;
                                      const imgComment =
                                        typeof imgObj === "object"
                                          ? imgObj.comment
                                          : "";
                                      return (
                                        <div key={i} className="flex flex-col">
                                          <Image
                                            src={imgUrl}
                                            alt={`evidence-${idx}-${i}`}
                                            width="100%"
                                            height={200}
                                            style={{
                                              objectFit: "cover",
                                              borderRadius: "4px",
                                            }}
                                            preview={{
                                              mask: "Xem",
                                            }}
                                          />
                                          {imgComment && (
                                            <div className="mt-2 text-xs text-gray-600 italic">
                                              {imgComment}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </Image.PreviewGroup>
                              </div>
                            )}
                          </Card>
                        )
                      )}
                    </div>
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
                  <Descriptions.Item
                    label={
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <UserOutlined /> Người xem xét
                      </span>
                    }
                    span={1}
                  >
                    <Text strong>
                      {reviewedByName || cancelRequest.reviewed_by}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian xem xét" span={1}>
                    {formatUtcDate(cancelRequest.reviewed_at, {
                      withTime: true,
                    })}
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
                id="registered-policy"
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>Hợp đồng đăng ký</span>
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
                  <Descriptions.Item label="Số tiền bảo hiểm" span={1}>
                    {formatCurrency(policy.coverage_amount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phí bảo hiểm nông dân" span={1}>
                    {formatCurrency(policy.total_farmer_premium)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chi phí dữ liệu" span={1}>
                    {formatCurrency(policy.total_data_cost)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hệ số diện tích" span={1}>
                    {policy.area_multiplier}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Ngày bắt đầu" span={1}>
                    {new Date(
                      policy.coverage_start_date * 1000
                    ).toLocaleDateString("vi-VN")}
                  </Descriptions.Item> */}
                  <Descriptions.Item label="Ngày kết thúc" span={1}>
                    {new Date(
                      policy.coverage_end_date * 1000
                    ).toLocaleDateString("vi-VN")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày trồng" span={1}>
                    {new Date(policy.planting_date * 1000).toLocaleDateString(
                      "vi-VN"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái thẩm định" span={1}>
                    <Tag
                      color={
                        policy.underwriting_status === "approved"
                          ? "green"
                          : "orange"
                      }
                    >
                      {policy.underwriting_status === "approved"
                        ? "Đã duyệt"
                        : policy.underwriting_status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo" span={1}>
                    {formatUtcDate(policy.created_at, { withTime: true })}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày cập nhật" span={1}>
                    {formatUtcDate(policy.updated_at, { withTime: true })}
                  </Descriptions.Item>
                  {policy.signed_policy_document_url && (
                    <Descriptions.Item label="Tài liệu hợp đồng" span={2}>
                      <a
                        href={policy.signed_policy_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <FilePdfOutlined />
                        <span>Tải xuống hợp đồng PDF</span>
                      </a>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
          )}
        </Row>

        <CancelDetailModals
          approveModalVisible={approveModalVisible}
          setApproveModalVisible={setApproveModalVisible}
          approveForm={approveForm}
          onApproveSubmit={onApproveSubmit}
          denyModalVisible={denyModalVisible}
          setDenyModalVisible={setDenyModalVisible}
          denyForm={denyForm}
          onDenySubmit={onDenySubmit}
          resolveModalVisible={resolveModalVisible}
          setResolveModalVisible={setResolveModalVisible}
          resolveForm={resolveForm}
          onResolveSubmit={onResolveSubmit}
          resolveAction={resolveAction}
          resolveDisputePartnerModalVisible={resolveDisputePartnerModalVisible}
          setResolveDisputePartnerModalVisible={
            setResolveDisputePartnerModalVisible
          }
          resolveDisputePartnerFormRef={resolveDisputePartnerFormRef}
          onResolveDisputePartnerSubmit={onResolveDisputePartnerSubmit}
          submitting={submitting}
        />
      </div>
    </Layout.Content>
  );
}
