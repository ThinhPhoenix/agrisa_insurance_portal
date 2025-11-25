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
import { useEffect, useRef, useState } from "react";
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

  // Data source names mapping
  const [dataSourceNames, setDataSourceNames] = useState({});

  // Fetch data source names when basePolicy is loaded
  useEffect(() => {
    const fetchDataSourceNames = async () => {
      if (!basePolicy?.triggers) return;

      const uniqueDataSourceIds = new Set();
      basePolicy.triggers.forEach((trigger) => {
        trigger.conditions?.forEach((condition) => {
          if (condition.data_source_id) {
            uniqueDataSourceIds.add(condition.data_source_id);
          }
        });
      });

      const names = {};
      await Promise.all(
        Array.from(uniqueDataSourceIds).map(async (dataSourceId) => {
          try {
            const response = await axiosInstance.get(
              endpoints.dataSources.detail(dataSourceId)
            );
            if (response.data.success) {
              const source = response.data.data;
              names[dataSourceId] =
                source.display_name_vi || source.parameter_name || dataSourceId;
            }
          } catch (error) {
            console.error(`Error fetching data source ${dataSourceId}:`, error);
            names[dataSourceId] = dataSourceId; // Fallback to ID
          }
        })
      );

      setDataSourceNames(names);
    };

    fetchDataSourceNames();
  }, [basePolicy]);

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
              <Text strong className="text-base block mb-3">
                Thông tin hợp đồng
              </Text>
              <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ width: "50%" }}
                contentStyle={{ width: "50%" }}
              >
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
                <Descriptions
                  column={1}
                  size="small"
                  bordered
                  labelStyle={{ width: "50%" }}
                  contentStyle={{ width: "50%" }}
                >
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
                <Text type="secondary">
                  Không tìm thấy thông tin trang trại
                </Text>
              )}
            </div>

            {/* Signed Document Section */}
            {policy.signed_policy_document_url && (
              <div>
                <Text strong className="text-base block mb-3">
                  Hợp đồng đã ký
                </Text>
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
              <Text strong className="text-base block mb-3">
                Thông tin sản phẩm
              </Text>
              <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ width: "50%" }}
                contentStyle={{ width: "50%" }}
              >
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
              <Text strong className="text-base block mb-3">
                Thông tin phí bảo hiểm
              </Text>
              <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ width: "50%" }}
                contentStyle={{ width: "50%" }}
              >
                <Descriptions.Item label="Phí cố định">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency:
                      basePolicy.base_policy?.coverage_currency || "VND",
                  }).format(basePolicy.base_policy?.fix_premium_amount || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Tính theo hecta">
                  <Tag
                    color={
                      basePolicy.base_policy?.is_per_hectare
                        ? "green"
                        : "orange"
                    }
                  >
                    {basePolicy.base_policy?.is_per_hectare ? "Có" : "Không"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tỷ lệ phí cơ bản">
                  {(basePolicy.base_policy?.premium_base_rate * 100).toFixed(2)}
                  %
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian gia hạn thanh toán tối đa">
                  {basePolicy.base_policy?.max_premium_payment_prolong} ngày
                </Descriptions.Item>
                <Descriptions.Item label="Tỷ lệ phí hủy">
                  {(basePolicy.base_policy?.cancel_premium_rate * 100).toFixed(
                    2
                  )}
                  %
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Payout Info Section */}
            <div>
              <Text strong className="text-base block mb-3">
                Thông tin chi trả bồi thường
              </Text>
              <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ width: "50%" }}
                contentStyle={{ width: "50%" }}
              >
                <Descriptions.Item label="Số tiền chi trả cố định">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency:
                      basePolicy.base_policy?.coverage_currency || "VND",
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
                    currency:
                      basePolicy.base_policy?.coverage_currency || "VND",
                  }).format(basePolicy.base_policy?.payout_cap || 0)}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Coverage Duration Section */}
            <div>
              <Text strong className="text-base block mb-3">
                Thời hạn bảo hiểm
              </Text>
              <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ width: "50%" }}
                contentStyle={{ width: "50%" }}
              >
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
              <Text strong className="text-base block mb-3">
                Gia hạn & Tài liệu
              </Text>
              <Descriptions
                column={1}
                size="small"
                bordered
                labelStyle={{ width: "50%" }}
                contentStyle={{ width: "50%" }}
              >
                <Descriptions.Item label="Tự động gia hạn">
                  <Tag
                    color={
                      basePolicy.base_policy?.auto_renewal ? "green" : "red"
                    }
                  >
                    {basePolicy.base_policy?.auto_renewal ? "Có" : "Không"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tỷ lệ giảm giá khi gia hạn">
                  {(
                    basePolicy.base_policy?.renewal_discount_rate * 100
                  ).toFixed(2)}
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
                  <Text strong className="block mb-2">
                    Hợp đồng gốc (Template):
                  </Text>
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
                      Kích thước:{" "}
                      {(basePolicy.document.file_size_bytes / 1024).toFixed(2)}{" "}
                      KB
                    </Text>
                  </Space>
                </div>
              )}
            </div>

            {/* Triggers Section */}
            {basePolicy.triggers && basePolicy.triggers.length > 0 && (
              <div>
                <Text strong className="text-base block mb-3">
                  Điều kiện kích hoạt bồi thường ({basePolicy.triggers.length}{" "}
                  trigger)
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
                                render: (dataSourceId) => (
                                  <span>
                                    {dataSourceNames[dataSourceId] || (
                                      <Text
                                        type="secondary"
                                        className="text-xs"
                                      >
                                        Đang tải...
                                      </Text>
                                    )}
                                  </span>
                                ),
                              },
                              {
                                title: "Toán tử",
                                dataIndex: "threshold_operator",
                                key: "operator",
                                width: 100,
                                render: (val) => (
                                  <Tag color="orange">{val}</Tag>
                                ),
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
                <Text strong className="text-base block mb-3">
                  Metadata
                </Text>
                <Descriptions
                  column={1}
                  size="small"
                  bordered
                  labelStyle={{ width: "50%" }}
                  contentStyle={{ width: "50%" }}
                >
                  <Descriptions.Item label="Tổng số triggers">
                    <Tag color="blue">{basePolicy.metadata.total_triggers}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng số điều kiện">
                    <Tag color="cyan">
                      {basePolicy.metadata.total_conditions}
                    </Tag>
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
                <Text strong className="text-base block mb-3">
                  Tổng quan đánh giá rủi ro
                </Text>
                <Descriptions
                  column={1}
                  size="small"
                  bordered
                  labelStyle={{ width: "50%" }}
                  contentStyle={{ width: "50%" }}
                >
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
              {riskAnalysis.risk_analyses &&
              riskAnalysis.risk_analyses.length > 0 ? (
                <Space direction="vertical" size="large" className="w-full">
                  {riskAnalysis.risk_analyses.map((analysis, idx) => {
                    const getRiskLevelColor = (level) => {
                      switch (level?.toLowerCase()) {
                        case "critical":
                          return "red";
                        case "high":
                          return "orange";
                        case "medium":
                          return "gold";
                        case "low":
                          return "green";
                        default:
                          return "default";
                      }
                    };

                    const getRiskLevelText = (level) => {
                      switch (level?.toLowerCase()) {
                        case "critical":
                          return "Nghiêm trọng";
                        case "high":
                          return "Cao";
                        case "medium":
                          return "Trung bình";
                        case "low":
                          return "Thấp";
                        default:
                          return level;
                      }
                    };

                    const getAnalysisStatusColor = (status) => {
                      switch (status?.toLowerCase()) {
                        case "completed":
                          return "green";
                        case "failed":
                          return "red";
                        case "pending":
                          return "orange";
                        default:
                          return "default";
                      }
                    };

                    const getAnalysisStatusText = (status) => {
                      switch (status?.toLowerCase()) {
                        case "completed":
                          return "Hoàn thành";
                        case "failed":
                          return "Thất bại";
                        case "pending":
                          return "Đang xử lý";
                        default:
                          return status;
                      }
                    };

                    const getRecommendationColor = (rec) => {
                      switch (rec?.toLowerCase()) {
                        case "reject":
                          return "red";
                        case "approve":
                          return "green";
                        case "review":
                          return "orange";
                        default:
                          return "default";
                      }
                    };

                    const getRecommendationText = (rec) => {
                      switch (rec?.toLowerCase()) {
                        case "reject":
                          return "Từ chối";
                        case "approve":
                          return "Chấp thuận";
                        case "review":
                          return "Xem xét thêm";
                        default:
                          return rec;
                      }
                    };

                    return (
                      <Card
                        key={analysis.id || idx}
                        title={
                          <div className="flex justify-between items-center">
                            <span>Đánh giá rủi ro #{idx + 1}</span>
                            <Space>
                              <Tag
                                color={getAnalysisStatusColor(
                                  analysis.analysis_status
                                )}
                              >
                                {getAnalysisStatusText(
                                  analysis.analysis_status
                                )}
                              </Tag>
                              <Tag
                                color={getRiskLevelColor(
                                  analysis.overall_risk_level
                                )}
                              >
                                Mức độ:{" "}
                                {getRiskLevelText(analysis.overall_risk_level)}
                              </Tag>
                            </Space>
                          </div>
                        }
                      >
                        <Space
                          direction="vertical"
                          size="large"
                          className="w-full"
                        >
                          {/* Basic Info */}
                          <div>
                            <Text strong className="text-base block mb-3">
                              Thông tin cơ bản
                            </Text>
                            <Descriptions column={2} size="small" bordered>
                              <Descriptions.Item
                                label="Loại phân tích"
                                span={1}
                              >
                                <Tag color="blue">{analysis.analysis_type}</Tag>
                              </Descriptions.Item>
                              <Descriptions.Item
                                label="Nguồn phân tích"
                                span={1}
                              >
                                {analysis.analysis_source}
                              </Descriptions.Item>
                              <Descriptions.Item
                                label="Thời gian phân tích"
                                span={1}
                              >
                                {new Date(
                                  analysis.analysis_timestamp * 1000
                                ).toLocaleString("vi-VN")}
                              </Descriptions.Item>
                              <Descriptions.Item
                                label="Điểm rủi ro tổng thể"
                                span={1}
                              >
                                <Text
                                  strong
                                  style={{
                                    color:
                                      analysis.overall_risk_score > 0.7
                                        ? "#ff4d4f"
                                        : analysis.overall_risk_score > 0.4
                                        ? "#faad14"
                                        : "#52c41a",
                                  }}
                                >
                                  {(analysis.overall_risk_score * 100).toFixed(
                                    1
                                  )}
                                  %
                                </Text>
                              </Descriptions.Item>
                              {analysis.analysis_notes && (
                                <Descriptions.Item
                                  label="Ghi chú phân tích"
                                  span={2}
                                >
                                  <Text type="secondary">
                                    {analysis.analysis_notes}
                                  </Text>
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          </div>

                          {/* Farm Profile Summary */}
                          {analysis.raw_output?.farm_profile_summary && (
                            <div>
                              <Text strong className="text-base block mb-3">
                                Tóm tắt thông tin trang trại
                              </Text>
                              <Descriptions column={2} size="small" bordered>
                                <Descriptions.Item
                                  label="Mã trang trại"
                                  span={2}
                                >
                                  <Text code>
                                    {
                                      analysis.raw_output.farm_profile_summary
                                        .farm_id
                                    }
                                  </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Vị trí" span={2}>
                                  {
                                    analysis.raw_output.farm_profile_summary
                                      .location
                                  }
                                </Descriptions.Item>
                                <Descriptions.Item label="Diện tích">
                                  {
                                    analysis.raw_output.farm_profile_summary
                                      .area_m2
                                  }{" "}
                                  ha
                                </Descriptions.Item>
                                <Descriptions.Item label="Loại cây trồng">
                                  <Space>
                                    <Tag color="green">
                                      {CROP_TYPE_LABELS[
                                        analysis.raw_output.farm_profile_summary
                                          .crop_type
                                      ] ||
                                        analysis.raw_output.farm_profile_summary
                                          .crop_type}
                                    </Tag>
                                    {analysis.raw_output.farm_profile_summary
                                      .crop_type_verified ? (
                                      <Tag color="green">
                                        Đã xác minh (
                                        {(
                                          analysis.raw_output
                                            .farm_profile_summary
                                            .crop_type_confidence * 100
                                        ).toFixed(0)}
                                        %)
                                      </Tag>
                                    ) : (
                                      <Tag color="red">Chưa xác minh</Tag>
                                    )}
                                  </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày gieo trồng">
                                  {new Date(
                                    analysis.raw_output.farm_profile_summary.planting_date
                                  ).toLocaleDateString("vi-VN")}
                                </Descriptions.Item>
                                <Descriptions.Item label="Hệ thống tưới tiêu">
                                  <Tag
                                    color={
                                      analysis.raw_output.farm_profile_summary
                                        .has_irrigation
                                        ? "green"
                                        : "orange"
                                    }
                                  >
                                    {analysis.raw_output.farm_profile_summary
                                      .has_irrigation
                                      ? "Có"
                                      : "Không"}
                                  </Tag>
                                </Descriptions.Item>
                              </Descriptions>
                            </div>
                          )}

                          {/* Identified Risks */}
                          {analysis.identified_risks &&
                            Object.keys(analysis.identified_risks).length >
                              0 && (
                              <div>
                                <Text strong className="text-base block mb-3">
                                  Các rủi ro đã xác định
                                </Text>
                                <Collapse
                                  items={Object.entries(
                                    analysis.identified_risks
                                  ).map(([riskKey, riskData]) => {
                                    const riskTitleMap = {
                                      farm_characteristics_risk:
                                        "Đặc điểm trang trại",
                                      fraud_risk: "Gian lận",
                                      historical_performance_risk:
                                        "Hiệu suất lịch sử",
                                      trigger_activation_risk:
                                        "Kích hoạt trigger",
                                    };

                                    return {
                                      key: riskKey,
                                      label: (
                                        <div className="flex justify-between items-center w-full">
                                          <span style={{ fontWeight: 500 }}>
                                            {riskTitleMap[riskKey] || riskKey}
                                          </span>
                                          <Space>
                                            <Tag
                                              color={getRiskLevelColor(
                                                riskData.level
                                              )}
                                            >
                                              {getRiskLevelText(riskData.level)}
                                            </Tag>
                                            <Tag color="blue">
                                              Điểm: {riskData.score}
                                            </Tag>
                                          </Space>
                                        </div>
                                      ),
                                      children: (
                                        <Space
                                          direction="vertical"
                                          size="small"
                                          className="w-full"
                                        >
                                          {riskData.factors &&
                                          riskData.factors.length > 0 ? (
                                            riskData.factors.map(
                                              (factor, fIdx) => (
                                                <Card
                                                  key={fIdx}
                                                  size="small"
                                                  style={{
                                                    backgroundColor: "#fafafa",
                                                  }}
                                                >
                                                  <Space
                                                    direction="vertical"
                                                    size="small"
                                                    className="w-full"
                                                  >
                                                    <div className="flex justify-between items-center">
                                                      <Tag
                                                        color={getRiskLevelColor(
                                                          factor.level
                                                        )}
                                                      >
                                                        {getRiskLevelText(
                                                          factor.level
                                                        )}
                                                      </Tag>
                                                      <Text
                                                        type="secondary"
                                                        className="text-xs"
                                                      >
                                                        Loại: {factor.type} |
                                                        Điểm: {factor.score}
                                                      </Text>
                                                    </div>
                                                    <Text>
                                                      {factor.description}
                                                    </Text>
                                                  </Space>
                                                </Card>
                                              )
                                            )
                                          ) : (
                                            <Text type="secondary">
                                              Không có chi tiết
                                            </Text>
                                          )}
                                        </Space>
                                      ),
                                    };
                                  })}
                                  defaultActiveKey={Object.keys(
                                    analysis.identified_risks
                                  )}
                                  expandIconPosition="end"
                                />
                              </div>
                            )}

                          {/* Monitoring Data Analysis */}
                          {analysis.raw_output?.monitoring_data_analysis && (
                            <div>
                              <Text strong className="text-base block mb-3">
                                Phân tích dữ liệu giám sát
                              </Text>
                              <Collapse
                                items={Object.entries(
                                  analysis.raw_output.monitoring_data_analysis
                                ).map(([paramName, paramData]) => ({
                                  key: paramName,
                                  label: (
                                    <span style={{ fontWeight: 500 }}>
                                      {paramName.toUpperCase()}
                                    </span>
                                  ),
                                  children: (
                                    <Space
                                      direction="vertical"
                                      size="middle"
                                      className="w-full"
                                    >
                                      {/* Statistics */}
                                      {paramData.statistics && (
                                        <div>
                                          <Text strong className="block mb-2">
                                            Thống kê
                                          </Text>
                                          <Descriptions
                                            column={3}
                                            size="small"
                                            bordered
                                          >
                                            <Descriptions.Item label="Trung bình">
                                              {paramData.statistics.mean?.toFixed(
                                                4
                                              )}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Trung vị">
                                              {paramData.statistics.median?.toFixed(
                                                4
                                              )}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Độ lệch chuẩn">
                                              {paramData.statistics.std_dev?.toFixed(
                                                4
                                              )}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Giá trị nhỏ nhất">
                                              {paramData.statistics.min?.toFixed(
                                                4
                                              )}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Giá trị lớn nhất">
                                              {paramData.statistics.max?.toFixed(
                                                4
                                              )}
                                            </Descriptions.Item>
                                          </Descriptions>
                                        </div>
                                      )}

                                      {/* Data Quality Summary */}
                                      {paramData.data_quality_summary && (
                                        <div>
                                          <Text strong className="block mb-2">
                                            Chất lượng dữ liệu
                                          </Text>
                                          <Descriptions
                                            column={2}
                                            size="small"
                                            bordered
                                          >
                                            <Descriptions.Item label="Tổng số đo">
                                              {
                                                paramData.data_quality_summary
                                                  .total_measurements
                                              }
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Độ hoàn chỉnh">
                                              {
                                                paramData.data_quality_summary
                                                  .completeness
                                              }
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Chất lượng tốt">
                                              {
                                                paramData.data_quality_summary
                                                  .good_quality_count
                                              }
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Chất lượng chấp nhận được">
                                              {
                                                paramData.data_quality_summary
                                                  .acceptable_quality_count
                                              }
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Chất lượng kém">
                                              {
                                                paramData.data_quality_summary
                                                  .poor_quality_count
                                              }
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Độ tin cậy trung bình">
                                              {(
                                                paramData.data_quality_summary
                                                  .average_confidence * 100
                                              ).toFixed(1)}
                                              %
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                              label="Độ phủ mây trung bình"
                                              span={2}
                                            >
                                              {paramData.data_quality_summary.average_cloud_cover?.toFixed(
                                                1
                                              )}
                                              %
                                            </Descriptions.Item>
                                          </Descriptions>
                                        </div>
                                      )}

                                      {/* Trend Analysis */}
                                      {paramData.trend_analysis && (
                                        <div>
                                          <Text strong className="block mb-2">
                                            Phân tích xu hướng
                                          </Text>
                                          <Text type="secondary">
                                            {paramData.trend_analysis}
                                          </Text>
                                        </div>
                                      )}

                                      {/* Anomalies */}
                                      {paramData.anomalies &&
                                        paramData.anomalies.length > 0 && (
                                          <div>
                                            <Text strong className="block mb-2">
                                              Bất thường phát hiện
                                            </Text>
                                            <Space
                                              direction="vertical"
                                              size="small"
                                              className="w-full"
                                            >
                                              {paramData.anomalies.map(
                                                (anomaly, aIdx) => (
                                                  <Card
                                                    key={aIdx}
                                                    size="small"
                                                    style={{
                                                      backgroundColor:
                                                        "#fff7e6",
                                                      borderColor: "#ffa940",
                                                    }}
                                                  >
                                                    <Text>
                                                      <WarningOutlined
                                                        style={{
                                                          color: "#fa8c16",
                                                          marginRight: 8,
                                                        }}
                                                      />
                                                      {anomaly}
                                                    </Text>
                                                  </Card>
                                                )
                                              )}
                                            </Space>
                                          </div>
                                        )}
                                    </Space>
                                  ),
                                }))}
                                defaultActiveKey={Object.keys(
                                  analysis.raw_output.monitoring_data_analysis
                                )}
                                expandIconPosition="end"
                              />
                            </div>
                          )}

                          {/* Trigger Simulation Results */}
                          {analysis.raw_output?.trigger_simulation_results &&
                            analysis.raw_output.trigger_simulation_results
                              .length > 0 && (
                              <div>
                                <Text strong className="text-base block mb-3">
                                  Kết quả mô phỏng trigger
                                </Text>
                                <Collapse
                                  items={analysis.raw_output.trigger_simulation_results.map(
                                    (trigger, tIdx) => ({
                                      key: tIdx,
                                      label: (
                                        <div className="flex justify-between items-center w-full">
                                          <span style={{ fontWeight: 500 }}>
                                            {trigger.parameter_name?.toUpperCase()}
                                          </span>
                                          <Tag
                                            color={
                                              trigger.historical_breaches > 0
                                                ? "red"
                                                : "green"
                                            }
                                          >
                                            Vi phạm:{" "}
                                            {trigger.historical_breaches}
                                          </Tag>
                                        </div>
                                      ),
                                      children: (
                                        <Space
                                          direction="vertical"
                                          size="middle"
                                          className="w-full"
                                        >
                                          <Descriptions
                                            column={1}
                                            size="small"
                                            bordered
                                          >
                                            <Descriptions.Item label="Condition ID">
                                              <Text code>
                                                {trigger.condition_id}
                                              </Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Số lần vi phạm lịch sử">
                                              <Tag
                                                color={
                                                  trigger.historical_breaches >
                                                  0
                                                    ? "red"
                                                    : "green"
                                                }
                                              >
                                                {trigger.historical_breaches}
                                              </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Khoảng cách đến ngưỡng">
                                              {trigger.proximity_to_threshold}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Phân tích">
                                              <Text type="secondary">
                                                {trigger.analysis}
                                              </Text>
                                            </Descriptions.Item>
                                          </Descriptions>

                                          {trigger.breach_dates &&
                                            trigger.breach_dates.length > 0 && (
                                              <div>
                                                <Text
                                                  strong
                                                  className="block mb-2"
                                                >
                                                  Ngày vi phạm:
                                                </Text>
                                                <Space wrap>
                                                  {trigger.breach_dates.map(
                                                    (date, dIdx) => (
                                                      <Tag
                                                        key={dIdx}
                                                        color="red"
                                                      >
                                                        {date}
                                                      </Tag>
                                                    )
                                                  )}
                                                </Space>
                                              </div>
                                            )}
                                        </Space>
                                      ),
                                    })
                                  )}
                                  defaultActiveKey={analysis.raw_output.trigger_simulation_results.map(
                                    (_, idx) => idx
                                  )}
                                  expandIconPosition="end"
                                />
                              </div>
                            )}

                          {/* Fraud Assessment */}
                          {analysis.raw_output?.fraud_assessment_details && (
                            <div>
                              <Text strong className="text-base block mb-3">
                                Đánh giá gian lận
                              </Text>
                              <Card
                                size="small"
                                style={{
                                  backgroundColor: "#fff1f0",
                                  borderColor: "#ffccc7",
                                }}
                              >
                                <Space
                                  direction="vertical"
                                  size="middle"
                                  className="w-full"
                                >
                                  <div className="flex justify-between items-center">
                                    <Text strong>
                                      Mức độ:{" "}
                                      {getRiskLevelText(
                                        analysis.raw_output
                                          .fraud_assessment_details.level
                                      )}
                                    </Text>
                                    <Tag
                                      color={getRiskLevelColor(
                                        analysis.raw_output
                                          .fraud_assessment_details.level
                                      )}
                                    >
                                      Điểm:{" "}
                                      {
                                        analysis.raw_output
                                          .fraud_assessment_details.score
                                      }
                                    </Tag>
                                  </div>
                                  {analysis.raw_output.fraud_assessment_details
                                    .indicators_triggered && (
                                    <div>
                                      <Text strong className="block mb-2">
                                        Chỉ số kích hoạt:
                                      </Text>
                                      <Space
                                        direction="vertical"
                                        size="small"
                                        className="w-full"
                                      >
                                        {analysis.raw_output.fraud_assessment_details.indicators_triggered.map(
                                          (indicator, iIdx) => (
                                            <Card
                                              key={iIdx}
                                              size="small"
                                              style={{
                                                backgroundColor: "#ffffff",
                                              }}
                                            >
                                              <Text>
                                                <WarningOutlined
                                                  style={{
                                                    color: "#ff4d4f",
                                                    marginRight: 8,
                                                  }}
                                                />
                                                {indicator}
                                              </Text>
                                            </Card>
                                          )
                                        )}
                                      </Space>
                                    </div>
                                  )}
                                </Space>
                              </Card>
                            </div>
                          )}

                          {/* Recommendations */}
                          {analysis.recommendations && (
                            <div>
                              <Text strong className="text-base block mb-3">
                                Khuyến nghị
                              </Text>
                              <Space
                                direction="vertical"
                                size="middle"
                                className="w-full"
                              >
                                {/* Underwriting Decision - Always visible */}
                                {analysis.recommendations
                                  .underwriting_decision && (
                                  <Card
                                    size="small"
                                    style={{
                                      backgroundColor:
                                        analysis.recommendations
                                          .underwriting_decision
                                          .recommendation === "reject"
                                          ? "#fff1f0"
                                          : analysis.recommendations
                                              .underwriting_decision
                                              .recommendation === "approve"
                                          ? "#f6ffed"
                                          : "#fffbe6",
                                      borderColor:
                                        analysis.recommendations
                                          .underwriting_decision
                                          .recommendation === "reject"
                                          ? "#ffccc7"
                                          : analysis.recommendations
                                              .underwriting_decision
                                              .recommendation === "approve"
                                          ? "#b7eb8f"
                                          : "#ffe58f",
                                    }}
                                  >
                                    <Space
                                      direction="vertical"
                                      size="small"
                                      className="w-full"
                                    >
                                      <div className="flex justify-between items-center">
                                        <Text
                                          strong
                                          style={{ fontSize: "16px" }}
                                        >
                                          Quyết định underwriting
                                        </Text>
                                        <Space>
                                          <Tag
                                            color={getRecommendationColor(
                                              analysis.recommendations
                                                .underwriting_decision
                                                .recommendation
                                            )}
                                            style={{
                                              fontSize: "14px",
                                              padding: "4px 12px",
                                            }}
                                          >
                                            {getRecommendationText(
                                              analysis.recommendations
                                                .underwriting_decision
                                                .recommendation
                                            )}
                                          </Tag>
                                          <Tag color="blue">
                                            Độ tin cậy:{" "}
                                            {
                                              analysis.recommendations
                                                .underwriting_decision
                                                .confidence
                                            }
                                            %
                                          </Tag>
                                        </Space>
                                      </div>
                                      <Text type="secondary">
                                        {
                                          analysis.recommendations
                                            .underwriting_decision.reasoning
                                        }
                                      </Text>
                                    </Space>
                                  </Card>
                                )}

                                {/* Other Recommendations in Collapse */}
                                <Collapse
                                  items={[
                                    analysis.recommendations
                                      .premium_adjustment && {
                                      key: "premium",
                                      label: (
                                        <span style={{ fontWeight: 500 }}>
                                          Điều chỉnh phí bảo hiểm
                                        </span>
                                      ),
                                      children: (
                                        <Descriptions
                                          column={1}
                                          size="small"
                                          bordered
                                        >
                                          <Descriptions.Item label="Trạng thái">
                                            <Tag
                                              color={
                                                analysis.recommendations
                                                  .premium_adjustment
                                                  .should_adjust
                                                  ? "orange"
                                                  : "green"
                                              }
                                            >
                                              {analysis.recommendations
                                                .premium_adjustment
                                                .should_adjust
                                                ? "Cần điều chỉnh"
                                                : "Không cần"}
                                            </Tag>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Lý do">
                                            {
                                              analysis.recommendations
                                                .premium_adjustment.reasoning
                                            }
                                          </Descriptions.Item>
                                        </Descriptions>
                                      ),
                                    },
                                    analysis.recommendations
                                      .monitoring_recommendations && {
                                      key: "monitoring",
                                      label: (
                                        <span style={{ fontWeight: 500 }}>
                                          Giám sát thêm
                                        </span>
                                      ),
                                      children: (
                                        <Descriptions
                                          column={1}
                                          size="small"
                                          bordered
                                        >
                                          <Descriptions.Item label="Trạng thái">
                                            <Tag
                                              color={
                                                analysis.recommendations
                                                  .monitoring_recommendations
                                                  .additional_monitoring_needed
                                                  ? "orange"
                                                  : "green"
                                              }
                                            >
                                              {analysis.recommendations
                                                .monitoring_recommendations
                                                .additional_monitoring_needed
                                                ? "Cần giám sát"
                                                : "Không cần"}
                                            </Tag>
                                          </Descriptions.Item>
                                          <Descriptions.Item label="Lý do">
                                            {
                                              analysis.recommendations
                                                .monitoring_recommendations
                                                .reasoning
                                            }
                                          </Descriptions.Item>
                                        </Descriptions>
                                      ),
                                    },
                                    analysis.recommendations
                                      .required_verifications &&
                                      analysis.recommendations
                                        .required_verifications.length > 0 && {
                                        key: "verifications",
                                        label: (
                                          <div className="flex justify-between items-center w-full">
                                            <span style={{ fontWeight: 500 }}>
                                              Xác minh yêu cầu
                                            </span>
                                            <Tag color="orange">
                                              {
                                                analysis.recommendations
                                                  .required_verifications.length
                                              }{" "}
                                              mục
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <ul
                                            style={{
                                              paddingLeft: "20px",
                                              margin: 0,
                                            }}
                                          >
                                            {analysis.recommendations.required_verifications.map(
                                              (verification, vIdx) => (
                                                <li
                                                  key={vIdx}
                                                  style={{
                                                    marginBottom: "8px",
                                                  }}
                                                >
                                                  <Text>{verification}</Text>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        ),
                                      },
                                    analysis.recommendations
                                      .suggested_actions &&
                                      analysis.recommendations.suggested_actions
                                        .length > 0 && {
                                        key: "actions",
                                        label: (
                                          <div className="flex justify-between items-center w-full">
                                            <span style={{ fontWeight: 500 }}>
                                              Hành động đề xuất
                                            </span>
                                            <Tag color="blue">
                                              {
                                                analysis.recommendations
                                                  .suggested_actions.length
                                              }{" "}
                                              hành động
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Space
                                            direction="vertical"
                                            size="small"
                                            className="w-full"
                                          >
                                            {analysis.recommendations.suggested_actions.map(
                                              (action, aIdx) => (
                                                <Card
                                                  key={aIdx}
                                                  size="small"
                                                  style={{
                                                    backgroundColor: "#e6f7ff",
                                                    borderColor: "#91d5ff",
                                                  }}
                                                >
                                                  <Text>• {action}</Text>
                                                </Card>
                                              )
                                            )}
                                          </Space>
                                        ),
                                      },
                                    analysis.recommendations
                                      .trigger_adjustments &&
                                      analysis.recommendations
                                        .trigger_adjustments.length > 0 && {
                                        key: "triggers",
                                        label: (
                                          <div className="flex justify-between items-center w-full">
                                            <span style={{ fontWeight: 500 }}>
                                              Điều chỉnh trigger
                                            </span>
                                            <Tag color="gold">
                                              {
                                                analysis.recommendations
                                                  .trigger_adjustments.length
                                              }{" "}
                                              điều chỉnh
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Space
                                            direction="vertical"
                                            size="small"
                                            className="w-full"
                                          >
                                            {analysis.recommendations.trigger_adjustments.map(
                                              (adjustment, tIdx) => (
                                                <Card
                                                  key={tIdx}
                                                  size="small"
                                                  style={{
                                                    backgroundColor: "#fff7e6",
                                                    borderColor: "#ffd591",
                                                  }}
                                                >
                                                  <Space
                                                    direction="vertical"
                                                    size="small"
                                                    className="w-full"
                                                  >
                                                    <Text strong>
                                                      Condition ID:{" "}
                                                      <Text code>
                                                        {
                                                          adjustment.condition_id
                                                        }
                                                      </Text>
                                                    </Text>
                                                    <Text type="secondary">
                                                      {adjustment.suggestion}
                                                    </Text>
                                                  </Space>
                                                </Card>
                                              )
                                            )}
                                          </Space>
                                        ),
                                      },
                                  ].filter(Boolean)}
                                  expandIconPosition="end"
                                />
                              </Space>
                            </div>
                          )}

                          {/* Timestamp */}
                          {analysis.created_at && (
                            <div className="text-right">
                              <Text type="secondary" className="text-xs">
                                Tạo lúc:{" "}
                                {new Date(analysis.created_at).toLocaleString(
                                  "vi-VN"
                                )}
                              </Text>
                            </div>
                          )}
                        </Space>
                      </Card>
                    );
                  })}
                </Space>
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
