"use client";

import { CustomForm } from "@/components/custom-form";
import ErrorResult from "@/components/error-result";
import OpenStreetMapWithPolygon from "@/components/map-polygon";
import MonitoringDataView from "@/components/monitoring-data-view";
import axiosInstance from "@/libs/axios-instance";
import {
  getApprovalError,
  getApprovalInfo,
  getApprovalSuccess,
} from "@/libs/message";
import { getErrorMessage } from "@/libs/message/common-message";
import { endpoints } from "@/services/endpoints";
import { usePolicyDetail } from "@/services/hooks/policy/use-policy-detail";
import {
  DownloadOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  LineChartOutlined,
  SafetyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Form,
  Image,
  Layout,
  Modal,
  Pagination,
  Row,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Title as ChartTitle,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import "../approval/approval.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Quality translation
const QUALITY_LABELS = {
  excellent: "Xuất sắc",
  good: "Tốt",
  fair: "Trung bình",
  poor: "Kém",
};

// Status translation
const STATUS_LABELS = {
  active: "Đang hoạt động",
  pending_review: "Chờ duyệt",
};

// Crop type translation
const CROP_TYPE_LABELS = {
  rice: "Lúa",
  coffee: "Cà phê",
  corn: "Ngô",
  wheat: "Lúa mì",
  tea: "Chè",
};

export default function PolicyDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyId = searchParams.get("id");
  const pageType = searchParams.get("type") || "approval"; // 'approval' or 'active'

  const {
    policy,
    farm,
    basePolicy,
    riskAnalysis,
    monitoringData,
    loading,
    accessDenied,
    refetch,
  } = usePolicyDetail(policyId);

  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [decisionType, setDecisionType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const formRef = useRef();

  // Pagination state for photos
  const [currentPhotoPage, setCurrentPhotoPage] = useState(1);
  const photosPerPage = 12;

  const handleDecision = (type) => {
    setDecisionType(type);
    setDecisionModalVisible(true);
  };

  const handleDecisionSubmit = async (values) => {
    setSubmitting(true);
    try {
      const underwritingData = {
        underwriting_status:
          decisionType === "approve" ? "approved" : "rejected",
        recommendations: {
          risk_level: "low",
          suggested_premium_adjustment: 0,
        },
        reason:
          decisionType === "approve"
            ? values.note ||
              "All documentation verified and risk assessment completed"
            : values.reason || getApprovalError("REASON_REQUIRED"),
        reason_evidence: {
          documents_verified: decisionType === "approve",
          risk_score: decisionType === "approve" ? 25 : 75,
          fraud_check: decisionType === "approve" ? "passed" : "failed",
        },
        validation_notes:
          decisionType === "approve"
            ? values.note ||
              "Policy meets all underwriting criteria. Approved for activation."
            : values.reason,
      };

      const response = await axiosInstance.post(
        endpoints.policy.policy.underwriting(policyId),
        underwritingData
      );

      if (response.data.success) {
        const successMessage =
          decisionType === "approve"
            ? getApprovalSuccess("APPROVED")
            : getApprovalSuccess("REJECTED");
        message.success(successMessage);

        setDecisionModalVisible(false);
        form.resetFields();

        setTimeout(() => {
          router.push("/policy/approval");
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
      const errorMessage =
        decisionType === "approve"
          ? getApprovalError("APPROVE_FAILED")
          : getApprovalError("REJECT_FAILED");
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await formRef.current?.validateFields();
      if (values) {
        await handleDecisionSubmit(values);
      }
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  const getDecisionFormFields = () => {
    const baseFields = [];

    if (decisionType === "approve") {
      baseFields.push({
        name: "note",
        label: "Ghi chú duyệt",
        type: "textarea",
        placeholder: "Nhập ghi chú (nếu có)",
        required: false,
      });
    } else if (decisionType === "reject") {
      baseFields.push({
        name: "reason",
        label: "Lý do từ chối",
        type: "textarea",
        placeholder: "Nhập lý do từ chối đơn bảo hiểm",
        required: true,
      });
    }

    return baseFields;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "rejected":
        return "red";
      case "pending_review":
        return "orange";
      case "pending":
        return "blue";
      default:
        return "default";
    }
  };

  const formatUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://${url}`;
  };

  // Pagination logic
  const indexOfLastPhoto = currentPhotoPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos =
    farm?.farm_photos?.slice(indexOfFirstPhoto, indexOfLastPhoto) || [];

  const handlePageChange = (page) => {
    setCurrentPhotoPage(page);
  };

  if (loading) {
    return (
      <Layout.Content className="application-loading">
        <Spin size="large" tip={getApprovalInfo("LOADING_POLICY")} />
      </Layout.Content>
    );
  }

  if (accessDenied) {
    return (
      <ErrorResult
        status="403"
        subTitle={getErrorMessage("FORBIDDEN")}
        backUrl={`/policy/${pageType}`}
        backText="Quay lại danh sách"
      />
    );
  }

  if (!policy) {
    return (
      <ErrorResult
        status="404"
        subTitle={getApprovalError("POLICY_NOT_FOUND")}
        backUrl={`/policy/${pageType}`}
        backText="Quay lại danh sách"
      />
    );
  }

  const tabItems = [
    {
      key: "basic",
      label: (
        <span>
          <FileTextOutlined /> Thông tin cơ bản
        </span>
      ),
      children: (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            {/* Policy Info Section */}
            <div>
              <Text strong className="text-base block mb-3">Thông tin hợp đồng</Text>
              <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
                <Descriptions.Item label="Số hợp đồng">
                  <Text strong>{policy.policy_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mã nông dân">
                  {policy.farmer_id}
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền bảo hiểm">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(policy.coverage_amount)}
                </Descriptions.Item>
                <Descriptions.Item label="Phí bảo hiểm">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(policy.total_farmer_premium)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày trồng">
                  {new Date(policy.planting_date * 1000).toLocaleDateString(
                    "vi-VN"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc bảo hiểm">
                  {new Date(policy.coverage_end_date * 1000).toLocaleDateString(
                    "vi-VN"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {new Date(policy.created_at).toLocaleDateString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(policy.status)}>
                    {policy.status === "pending_review"
                      ? "Chờ duyệt"
                      : policy.status === "active"
                      ? "Đang hoạt động"
                      : policy.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Farm Info Section */}
            <div>
              <Text strong className="text-base block mb-3">
                <EnvironmentOutlined /> Thông tin trang trại
              </Text>
              {farm ? (
                <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
                  <Descriptions.Item label="Tên trang trại">
                    {farm.farm_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {farm.address}, {farm.commune}, {farm.district},{" "}
                    {farm.province}
                  </Descriptions.Item>
                  <Descriptions.Item label="Diện tích">
                    {farm.area_sqm} ha
                  </Descriptions.Item>
                  <Descriptions.Item label="Loại cây trồng">
                    <Tag color="green">
                      {CROP_TYPE_LABELS[farm.crop_type] || farm.crop_type}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">Không tìm thấy thông tin trang trại</Text>
              )}
            </div>

            {/* Signed Document Section */}
            {policy.signed_policy_document_url && (
              <div>
                <Text strong className="text-base block mb-3">Hợp đồng đã ký</Text>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    window.open(policy.signed_policy_document_url, "_blank")
                  }
                >
                  Xem hợp đồng đã ký (PDF)
                </Button>
              </div>
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: "basePolicy",
      label: (
        <span>
          <SafetyOutlined /> Thông tin gói bảo hiểm
        </span>
      ),
      children: basePolicy ? (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            {/* Product Info Section */}
            <div>
              <Text strong className="text-base block mb-3">Thông tin sản phẩm</Text>
              <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
                <Descriptions.Item label="Tên sản phẩm">
                  <Text strong>{basePolicy.base_policy?.product_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mã sản phẩm">
                  <Tag color="blue">{basePolicy.base_policy?.product_code}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả sản phẩm">
                  {basePolicy.base_policy?.product_description}
                </Descriptions.Item>
                <Descriptions.Item label="Loại cây trồng">
                  <Tag color="green">
                    {CROP_TYPE_LABELS[basePolicy.base_policy?.crop_type] ||
                      basePolicy.base_policy?.crop_type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag
                    color={
                      basePolicy.base_policy?.status === "active"
                        ? "green"
                        : "orange"
                    }
                  >
                    {STATUS_LABELS[basePolicy.base_policy?.status] ||
                      basePolicy.base_policy?.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Premium Info Section */}
            <div>
              <Text strong className="text-base block mb-3">Thông tin phí bảo hiểm</Text>
              <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
              <Descriptions.Item label="Phí cố định">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: basePolicy.base_policy?.coverage_currency || "VND",
                }).format(basePolicy.base_policy?.fix_premium_amount || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="Tính theo hecta">
                <Tag
                  color={
                    basePolicy.base_policy?.is_per_hectare ? "green" : "orange"
                  }
                >
                  {basePolicy.base_policy?.is_per_hectare ? "Có" : "Không"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ phí cơ bản">
                {(basePolicy.base_policy?.premium_base_rate * 100).toFixed(2)}%
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian gia hạn thanh toán tối đa">
                {basePolicy.base_policy?.max_premium_payment_prolong} ngày
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ phí hủy">
                {(basePolicy.base_policy?.cancel_premium_rate * 100).toFixed(2)}
                %
              </Descriptions.Item>
            </Descriptions>
            </div>

            {/* Payout Info Section */}
            <div>
              <Text strong className="text-base block mb-3">Thông tin chi trả bồi thường</Text>
            <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
              <Descriptions.Item label="Số tiền chi trả cố định">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: basePolicy.base_policy?.coverage_currency || "VND",
                }).format(basePolicy.base_policy?.fix_payout_amount || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="Chi trả theo hecta">
                <Tag
                  color={
                    basePolicy.base_policy?.is_payout_per_hectare
                      ? "green"
                      : "orange"
                  }
                >
                  {basePolicy.base_policy?.is_payout_per_hectare
                    ? "Có"
                    : "Không"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hệ số nhân vượt ngưỡng">
                {basePolicy.base_policy?.over_threshold_multiplier}x
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ chi trả cơ bản">
                {(basePolicy.base_policy?.payout_base_rate * 100).toFixed(2)}%
              </Descriptions.Item>
              <Descriptions.Item label="Giới hạn chi trả tối đa">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: basePolicy.base_policy?.coverage_currency || "VND",
                }).format(basePolicy.base_policy?.payout_cap || 0)}
              </Descriptions.Item>
            </Descriptions>
            </div>

            {/* Coverage Duration Section */}
            <div>
              <Text strong className="text-base block mb-3">Thời hạn bảo hiểm</Text>
            <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
              <Descriptions.Item label="Thời hạn bảo hiểm">
                {basePolicy.base_policy?.coverage_duration_days} ngày
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu đăng ký">
                {new Date(
                  basePolicy.base_policy?.enrollment_start_day * 1000
                ).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc đăng ký">
                {new Date(
                  basePolicy.base_policy?.enrollment_end_day * 1000
                ).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu hiệu lực">
                {new Date(
                  basePolicy.base_policy?.insurance_valid_from_day * 1000
                ).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc hiệu lực">
                {new Date(
                  basePolicy.base_policy?.insurance_valid_to_day * 1000
                ).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
            </Descriptions>
            </div>

            {/* Renewal & Document Section */}
            <div>
              <Text strong className="text-base block mb-3">Gia hạn & Tài liệu</Text>
            <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
              <Descriptions.Item label="Tự động gia hạn">
                <Tag
                  color={basePolicy.base_policy?.auto_renewal ? "green" : "red"}
                >
                  {basePolicy.base_policy?.auto_renewal ? "Có" : "Không"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ giảm giá khi gia hạn">
                {(basePolicy.base_policy?.renewal_discount_rate * 100).toFixed(
                  2
                )}
                %
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái xác thực tài liệu">
                <Tag
                  color={
                    basePolicy.base_policy?.document_validation_status ===
                    "passed"
                      ? "green"
                      : "orange"
                  }
                >
                  {basePolicy.base_policy?.document_validation_status ===
                  "passed"
                    ? "Đã xác thực"
                    : "Chờ xác thực"}
                </Tag>
              </Descriptions.Item>
              {basePolicy.base_policy?.important_additional_information && (
                <Descriptions.Item label="Thông tin bổ sung quan trọng">
                  {basePolicy.base_policy.important_additional_information}
                </Descriptions.Item>
              )}
            </Descriptions>

            {basePolicy?.document?.presigned_url && (
              <div className="mt-4">
                <Text strong className="block mb-2">Hợp đồng gốc (Template):</Text>
                <Space direction="vertical" size="small">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      window.open(basePolicy.document.presigned_url, "_blank")
                    }
                  >
                    Xem hợp đồng gốc (PDF)
                  </Button>
                  <Text type="secondary" className="text-xs">
                    Kích thước: {(basePolicy.document.file_size_bytes / 1024).toFixed(2)} KB
                  </Text>
                </Space>
              </div>
            )}
            </div>

            {/* Triggers Section */}
            {basePolicy.triggers && basePolicy.triggers.length > 0 && (
            <div>
              <Text strong className="text-base block mb-3">
                Điều kiện kích hoạt bồi thường ({basePolicy.triggers.length} trigger)
              </Text>
              <Space direction="vertical" size="middle" className="w-full">
                {basePolicy.triggers.map((trigger, idx) => (
                  <Card
                    key={trigger.id || idx}
                    size="small"
                    type="inner"
                    title={`Trigger ${idx + 1}`}
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      bordered
                      className="mb-3"
                    >
                      <Descriptions.Item label="Toán tử logic">
                        <Tag color="purple">{trigger.logical_operator}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Giai đoạn sinh trưởng">
                        {trigger.growth_stage || "Tất cả"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tần suất giám sát">
                        {trigger.monitor_interval}{" "}
                        {trigger.monitor_frequency_unit === "day"
                          ? "ngày"
                          : trigger.monitor_frequency_unit}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số điều kiện">
                        <Tag color="blue">
                          {trigger.conditions?.length || 0} điều kiện
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>

                    {trigger.conditions && trigger.conditions.length > 0 && (
                      <div>
                        <Text strong className="block mb-2">
                          Chi tiết điều kiện:
                        </Text>
                        <Table
                          size="small"
                          dataSource={trigger.conditions}
                          rowKey={(record) => record.id}
                          pagination={false}
                          columns={[
                            {
                              title: "Thứ tự",
                              dataIndex: "condition_order",
                              key: "order",
                              width: 80,
                              render: (val) => <Tag color="blue">#{val}</Tag>,
                            },
                            {
                              title: "Nguồn dữ liệu",
                              dataIndex: "data_source_id",
                              key: "data_source",
                              ellipsis: true,
                            },
                            {
                              title: "Toán tử",
                              dataIndex: "threshold_operator",
                              key: "operator",
                              width: 100,
                              render: (val) => <Tag color="orange">{val}</Tag>,
                            },
                            {
                              title: "Giá trị ngưỡng",
                              dataIndex: "threshold_value",
                              key: "threshold",
                              width: 120,
                              render: (val) => <Text strong>{val}</Text>,
                            },
                            {
                              title: "Cảnh báo sớm",
                              dataIndex: "early_warning_threshold",
                              key: "warning",
                              width: 120,
                              render: (val) => <Tag color="gold">{val}</Tag>,
                            },
                            {
                              title: "Hàm tổng hợp",
                              dataIndex: "aggregation_function",
                              key: "agg_func",
                              width: 120,
                            },
                            {
                              title: "Cửa sổ tổng hợp",
                              dataIndex: "aggregation_window_days",
                              key: "agg_window",
                              width: 130,
                              render: (val) => `${val} ngày`,
                            },
                            {
                              title: "Chi phí tính toán",
                              dataIndex: "calculated_cost",
                              key: "cost",
                              width: 120,
                              render: (val) => (
                                <Text type="success">
                                  {new Intl.NumberFormat("vi-VN").format(val)}
                                </Text>
                              ),
                            },
                          ]}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </Space>
            </div>
            )}

            {/* Metadata Section */}
            {basePolicy.metadata && (
            <div>
              <Text strong className="text-base block mb-3">Metadata</Text>
              <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
                <Descriptions.Item label="Tổng số triggers">
                  <Tag color="blue">{basePolicy.metadata.total_triggers}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng số điều kiện">
                  <Tag color="cyan">{basePolicy.metadata.total_conditions}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng chi phí dữ liệu">
                  <Text type="success" strong>
                    {new Intl.NumberFormat("vi-VN").format(
                      basePolicy.metadata.total_data_cost
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng nguồn dữ liệu">
                  <Tag color="purple">
                    {basePolicy.metadata.data_source_count}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian truy xuất">
                  {new Date(basePolicy.metadata.retrieved_at).toLocaleString(
                    "vi-VN"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </div>
            )}
          </Space>
        </Card>
      ) : (
        <Card>
          <Text type="secondary">Không có thông tin gói bảo hiểm</Text>
        </Card>
      ),
    },
    {
      key: "map",
      label: (
        <span>
          <EnvironmentOutlined /> Bản đồ
        </span>
      ),
      children: (
        <Card>
          {farm ? (
            <div style={{ height: "600px" }}>
              <OpenStreetMapWithPolygon
                boundary={farm.boundary}
                centerLocation={farm.center_location}
              />
            </div>
          ) : (
            <Text type="secondary">Không có thông tin bản đồ</Text>
          )}
        </Card>
      ),
    },
    {
      key: "images",
      label: (
        <span>
          <FileTextOutlined /> Hình ảnh bằng chứng
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" className="w-full">
          <Card title="Giấy chứng nhận quyền sử dụng đất">
            {farm?.land_certificate_url ? (
              <Image.PreviewGroup>
                <Row gutter={[16, 16]}>
                  {farm.land_certificate_url.split("|").map((url, index) => (
                    <Col xs={12} sm={8} md={6} lg={4} key={`cert-${index}`}>
                      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <Image
                          width="100%"
                          height={150}
                          src={formatUrl(url)}
                          alt={`Giấy chứng nhận ${index + 1}`}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            ) : (
              <Text type="secondary">Không có giấy chứng nhận</Text>
            )}
          </Card>

          <Card
            title={`Ảnh vệ tinh & thực địa (${
              farm?.farm_photos?.length || 0
            } ảnh)`}
          >
            {farm?.farm_photos && farm.farm_photos.length > 0 ? (
              <>
                <Image.PreviewGroup>
                  <Row gutter={[16, 16]}>
                    {currentPhotos.map((photo, index) => (
                      <Col xs={12} sm={8} md={6} lg={4} key={photo.id || index}>
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                          <div className="relative pt-[75%]">
                            <div className="absolute inset-0">
                              <Image
                                width="100%"
                                height="100%"
                                src={formatUrl(photo.photo_url)}
                                alt={`Ảnh ${photo.photo_type}`}
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 border-t border-gray-100">
                            <Tag
                              color={
                                photo.photo_type === "satellite"
                                  ? "blue"
                                  : "green"
                              }
                              className="text-[10px]"
                            >
                              {photo.photo_type === "satellite"
                                ? "Vệ tinh"
                                : "Thực địa"}
                            </Tag>
                            <Text
                              type="secondary"
                              className="text-xs block mt-1"
                            >
                              {new Date(
                                photo.taken_at * 1000
                              ).toLocaleDateString("vi-VN")}
                            </Text>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>

                {farm.farm_photos.length > photosPerPage && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      current={currentPhotoPage}
                      total={farm.farm_photos.length}
                      pageSize={photosPerPage}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper
                    />
                  </div>
                )}
              </>
            ) : (
              <Text type="secondary">Không có hình ảnh</Text>
            )}
          </Card>
        </Space>
      ),
    },
    {
      key: "monitoring",
      label: (
        <span>
          <LineChartOutlined /> Dữ liệu giám sát
        </span>
      ),
      children: (
        <div>
          {monitoringData && monitoringData.length > 0 ? (
            <Space direction="vertical" size="large" className="w-full">
              {monitoringData.map((item, idx) => (
                <Card
                  key={idx}
                  title={
                    <div className="flex justify-between items-center">
                      <span>
                        <LineChartOutlined />{" "}
                        {item.dataSource?.display_name_vi ||
                          item.parameterName.toUpperCase()}
                        {" - "}
                        <Text type="secondary">
                          {item.dataSource?.description_vi}
                        </Text>
                      </span>
                      <Tag color="blue">
                        {item.monitoringData?.count || 0} bản ghi
                      </Tag>
                    </div>
                  }
                >
                  <MonitoringDataView item={item} />
                </Card>
              ))}
            </Space>
          ) : (
            <Card>
              <Text type="secondary">Không có dữ liệu giám sát</Text>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: "risk",
      label: (
        <span>
          <WarningOutlined /> Phân tích rủi ro
        </span>
      ),
      children: (
        <Card>
          {riskAnalysis ? (
            <Space direction="vertical" size="large" className="w-full">
              {/* Summary Section */}
              <div>
                <Text strong className="text-base block mb-3">Tổng quan đánh giá rủi ro</Text>
                <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
                  <Descriptions.Item label="Mã hợp đồng đã đăng ký">
                    <Text code>{riskAnalysis.registered_policy_id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lượng đánh giá rủi ro">
                    <Tag color={riskAnalysis.count > 0 ? "blue" : "orange"}>
                      {riskAnalysis.count} đánh giá
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Risk Analyses Details */}
              {riskAnalysis.risk_analyses && riskAnalysis.risk_analyses.length > 0 ? (
                <div>
                  <Text strong className="text-base block mb-3">
                    Chi tiết đánh giá rủi ro ({riskAnalysis.risk_analyses.length} bản ghi)
                  </Text>
                  <Space direction="vertical" size="middle" className="w-full">
                    {riskAnalysis.risk_analyses.map((analysis, idx) => (
                      <Card
                        key={idx}
                        size="small"
                        type="inner"
                        title={`Đánh giá #${idx + 1}`}
                      >
                        <Descriptions column={1} size="small" bordered labelStyle={{ width: '50%' }} contentStyle={{ width: '50%' }}>
                          {Object.entries(analysis).map(([key, value]) => (
                            <Descriptions.Item label={key} key={key}>
                              {typeof value === "object" ? (
                                <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
                              ) : (
                                <Text>{String(value)}</Text>
                              )}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </Card>
                    ))}
                  </Space>
                </div>
              ) : (
                <Card size="small">
                  <Text type="secondary">
                    Chưa có dữ liệu đánh giá rủi ro chi tiết cho hợp đồng này
                  </Text>
                </Card>
              )}
            </Space>
          ) : (
            <Text type="secondary">Đang tải dữ liệu phân tích rủi ro...</Text>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="insurance-content">
      <div className="insurance-space">
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>Chi tiết đơn bảo hiểm: {policy.policy_number}</Title>
          <Space>
            <Button onClick={() => router.push(`/policy/${pageType}`)}>
              Quay lại
            </Button>
            {pageType === "approval" && policy.status === "pending_review" && (
              <>
                <Button danger onClick={() => handleDecision("reject")}>
                  Từ chối đơn
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleDecision("approve")}
                >
                  Chấp thuận đơn
                </Button>
              </>
            )}
          </Space>
        </div>

        <Tabs items={tabItems} />

        <Modal
          title={
            decisionType === "approve"
              ? "Chấp thuận đơn bảo hiểm"
              : "Từ chối đơn bảo hiểm"
          }
          open={decisionModalVisible}
          onCancel={() => {
            if (!submitting) {
              setDecisionModalVisible(false);
              form.resetFields();
            }
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setDecisionModalVisible(false);
                form.resetFields();
              }}
              disabled={submitting}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleFormSubmit}
              loading={submitting}
              disabled={submitting}
            >
              Xác nhận
            </Button>,
          ]}
          width={600}
          closable={!submitting}
          maskClosable={!submitting}
        >
          <CustomForm
            ref={formRef}
            fields={getDecisionFormFields()}
            onSubmit={handleDecisionSubmit}
            gridColumns="1fr"
            gap="16px"
          />
        </Modal>
      </div>
    </div>
  );
}
