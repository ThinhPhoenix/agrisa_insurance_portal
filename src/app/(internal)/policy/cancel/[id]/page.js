"use client";

import axiosInstance from "@/libs/axios-instance";
import { formatUtcDate } from "@/libs/date-utils";
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
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Image,
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

  const {
    allCancelRequests,
    loading,
    reviewCancelRequest,
    resolveDispute,
    getCancelRequestById,
  } = useCancelPolicy();

  const cancelRequest = getCancelRequestById(requestId);
  const { getPublicUser } = useGetPublicUser();

  const [approveForm] = Form.useForm();
  const [denyForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  // Related data
  const [policy, setPolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [denyModalVisible, setDenyModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveAction, setResolveAction] = useState(null); // 'approve' or 'keep_active'
  const [submitting, setSubmitting] = useState(false);

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
      case "dispute":
        return "volcano";
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
      case "dispute":
        return "Tranh chấp";
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

  // Parse evidence object into array of { description, images }
  const parseEvidenceToPairs = (evidence) => {
    if (!evidence) return [];

    // If evidence is already an array, try to normalize each entry
    if (Array.isArray(evidence)) {
      return evidence.map((item) => {
        if (!item) return { description: "", images: [] };
        if (typeof item === "string") {
          // string might be url or text
          if (item.startsWith("http") || item.startsWith("/"))
            return { description: "", images: [item] };
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed))
              return { description: "", images: parsed };
            if (typeof parsed === "object" && parsed !== null) {
              return {
                description: parsed.description || parsed.desc || "",
                images:
                  parsed.images ||
                  parsed.urls ||
                  (parsed.url ? [parsed.url] : []),
              };
            }
          } catch (e) {
            return { description: item, images: [] };
          }
        }
        if (typeof item === "object") {
          return {
            description: item.description || item.desc || "",
            images: item.images || item.urls || (item.url ? [item.url] : []),
          };
        }
        return { description: String(item), images: [] };
      });
    }

    // If evidence is an object, try to group keys into indexed pairs
    if (typeof evidence === "object") {
      // collect indexed groups: key may be like description_0, images-0, etc.
      const groups = {};
      const plain = { description: null, images: [] };

      Object.entries(evidence).forEach(([k, v]) => {
        // detect index suffix
        const m = k.match(/^(.*?)(?:[_-]?(\d+))?$/);
        if (!m) return;
        const base = m[1];
        const idx = m[2] ?? "0";

        if (!m[2]) {
          // no index - treat as plain fields (description or images)
          if (/desc|description|note|value/i.test(base)) {
            plain.description = typeof v === "string" ? v : JSON.stringify(v);
          } else if (/image|img|photo|photos|images|url|urls/i.test(base)) {
            if (Array.isArray(v)) plain.images = plain.images.concat(v);
            else if (typeof v === "string") plain.images.push(v);
            else if (typeof v === "object" && v !== null) {
              if (v.url) plain.images.push(v.url);
              else if (Array.isArray(v.urls))
                plain.images = plain.images.concat(v.urls);
            }
          } else {
            // unknown key without index - ignore or append to description
            if (!plain.description)
              plain.description = typeof v === "string" ? v : JSON.stringify(v);
          }
          return;
        }

        if (!groups[idx]) groups[idx] = { description: "", images: [] };
        if (/desc|description|note|value/i.test(base)) {
          groups[idx].description =
            typeof v === "string" ? v : JSON.stringify(v);
        } else if (/image|img|photo|photos|images|url|urls/i.test(base)) {
          if (Array.isArray(v))
            groups[idx].images = groups[idx].images.concat(v);
          else if (typeof v === "string") groups[idx].images.push(v);
          else if (typeof v === "object" && v !== null) {
            if (v.url) groups[idx].images.push(v.url);
            else if (Array.isArray(v.urls))
              groups[idx].images = groups[idx].images.concat(v.urls);
          }
        } else {
          // fallback: append to description
          if (!groups[idx].description)
            groups[idx].description =
              typeof v === "string" ? v : JSON.stringify(v);
        }
      });

      // build result array
      const result = Object.keys(groups)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => ({
          description: groups[k].description || "",
          images: groups[k].images || [],
        }));

      // if plain has content, prepend it
      if (
        (plain.description && plain.description.length) ||
        (plain.images && plain.images.length)
      ) {
        result.unshift({
          description: plain.description || "",
          images: plain.images || [],
        });
      }

      // If no groups found, try to interpret top-level object as single pair
      if (result.length === 0) {
        // possible shape: { description: 'Bip', images: ['url'] }
        const desc =
          evidence.description || evidence.desc || evidence.note || null;
        const imgs =
          evidence.images ||
          evidence.urls ||
          (evidence.url ? [evidence.url] : []);
        if (desc || (imgs && imgs.length))
          return [{ description: desc || "", images: imgs || [] }];
        // fallback: stringify
        return [{ description: JSON.stringify(evidence), images: [] }];
      }

      return result;
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
                <Descriptions.Item label="Lý do hủy" span={2}>
                  {cancelRequest.reason}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <UserOutlined /> Người yêu cầu
                    </span>
                  }
                  span={1}
                >
                  <Text strong>{requestedByName || cancelRequest.requested_by}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày yêu cầu" span={1}>
                  {formatUtcDate(cancelRequest.requested_at, {
                    withTime: true,
                  })}
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

              {/* Evidence - render descriptions and images instead of raw JSON */}
              {cancelRequest.evidence &&
                Object.keys(cancelRequest.evidence).length > 0 && (
                  <>
                    <Divider>Bằng chứng đính kèm</Divider>
                    <div className="grid grid-cols-1 gap-4">
                      {parseEvidenceToPairs(cancelRequest.evidence).map(
                        (pair, idx) => (
                          <Card key={idx} className="p-3">
                            <div className="mb-2">
                              <strong>Mô tả</strong>
                            </div>
                            <div className="mb-3 text-sm text-gray-700">
                              {pair.description || "-"}
                            </div>

                            {pair.images && pair.images.length > 0 && (
                              <Image.PreviewGroup>
                                <div className="flex flex-wrap gap-3">
                                  {pair.images.map((src, i) => (
                                    <Image
                                      key={i}
                                      src={src}
                                      alt={`evidence-${idx}-${i}`}
                                      width={200}
                                      height={150}
                                      style={{ objectFit: "cover" }}
                                    />
                                  ))}
                                </div>
                              </Image.PreviewGroup>
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
                  <Descriptions.Item label="Phí bảo hiểm nông dân" span={1}>
                    {formatCurrency(policy.total_farmer_premium)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chi phí dữ liệu" span={1}>
                    {formatCurrency(policy.total_data_cost)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hệ số diện tích" span={1}>
                    {policy.area_multiplier}
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

        {/* Resolve Dispute Modal */}
        <Modal
          title={
            resolveAction === "approve"
              ? "Giải quyết tranh chấp - Hủy hợp đồng"
              : "Giải quyết tranh chấp - Giữ hợp đồng"
          }
          open={resolveModalVisible}
          onCancel={() => setResolveModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form form={resolveForm} layout="vertical" onFinish={onResolveSubmit}>
            <div
              className={`mb-4 p-3 border rounded ${
                resolveAction === "approve"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <Space direction="vertical">
                <Space>
                  <ExclamationCircleOutlined
                    style={{
                      color:
                        resolveAction === "approve" ? "#faad14" : "#1890ff",
                    }}
                  />
                  <Text strong>
                    {resolveAction === "approve"
                      ? "Sau khi xác nhận, hợp đồng sẽ chuyển sang trạng thái 'Đã hủy'"
                      : "Sau khi xác nhận, hợp đồng sẽ chuyển về trạng thái 'Đang hoạt động'"}
                  </Text>
                </Space>
                <Text type="secondary" className="text-sm">
                  Vui lòng ghi rõ thông tin thỏa thuận giữa hai bên sau khi liên
                  lạc offline
                </Text>
              </Space>
            </div>

            <Form.Item
              label="Thông tin giải quyết"
              name="resolution_notes"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập thông tin giải quyết tranh chấp",
                },
              ]}
              extra="Ghi rõ nội dung thỏa thuận, ngày liên lạc, và kết quả thảo luận giữa hai bên"
            >
              <TextArea
                rows={6}
                placeholder={
                  resolveAction === "approve"
                    ? "Ví dụ: Sau buổi họp ngày 08/12/2024, hai bên đã thống nhất hủy hợp đồng. Nông dân sẽ được hoàn trả 50% phí bảo hiểm trong vòng 7 ngày làm việc. Người đại diện: Nguyễn Văn A (SĐT: 0123-456-789)"
                    : "Ví dụ: Sau buổi họp ngày 08/12/2024, hai bên đã thống nhất tiếp tục hợp đồng. Nông dân cam kết tuân thủ đầy đủ các điều khoản. Công ty sẽ hỗ trợ thêm 1 lần khảo sát miễn phí. Người đại diện: Nguyễn Văn A (SĐT: 0123-456-789)"
                }
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => setResolveModalVisible(false)}>
                  Hủy
                </Button>
                <Button
                  type={resolveAction === "approve" ? "primary" : "default"}
                  danger={resolveAction === "approve"}
                  htmlType="submit"
                  loading={submitting}
                  icon={
                    resolveAction === "approve" ? (
                      <CloseCircleOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    )
                  }
                >
                  Xác nhận giải quyết
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout.Content>
  );
}
