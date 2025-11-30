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
  getApprovalWarning,
  getRiskAnalysisWarning,
} from "@/libs/message";
import { getErrorMessage } from "@/libs/message/common-message";
import { endpoints } from "@/services/endpoints";
import { usePolicyDetail } from "@/services/hooks/policy/use-policy-detail";
import { useAuthStore } from "@/stores/auth-store";
import {
  getFactorDescription,
  getFactorLevel,
  getFactorType,
  getRiskTitle,
  normalizeFraudAssessment,
  normalizeIdentifiedRisks,
  normalizeTriggerSimulation,
} from "@/components/risk-analysis-normalizer";
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
  message,
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
  ArcElement,
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
import "../policy.css";

// Register ChartJS components
ChartJS.register(
  ArcElement,
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
  const pageType = searchParams.get("type") || "pending"; // 'pending' or 'active'

  const { user } = useAuthStore();

  const {
    policy,
    farm,
    basePolicy,
    riskAnalysis,
    monitoringData,
    loading,
    accessDenied,
    refetch,
    hasRiskAnalysis,
  } = usePolicyDetail(policyId);

  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [decisionType, setDecisionType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const formRef = useRef();

  // Risk Analysis modal state
  const [riskAnalysisModalVisible, setRiskAnalysisModalVisible] =
    useState(false);
  const [creatingRiskAnalysis, setCreatingRiskAnalysis] = useState(false);
  const riskAnalysisFormRef = useRef();

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
    // Check if risk analysis exists before allowing ANY decision (approve or reject)
    if (!hasRiskAnalysis) {
      message.warning(getApprovalWarning("NO_RISK_ANALYSIS"));
      return;
    }
    setDecisionType(type);
    setDecisionModalVisible(true);
  };

  const handleCreateRiskAnalysis = () => {
    setRiskAnalysisModalVisible(true);
  };

  const handleRiskAnalysisSubmit = async (values) => {
    setCreatingRiskAnalysis(true);
    try {
      // Get partner name from user profile
      const partnerName = user?.profile?.full_name || user?.user?.full_name || "Đối tác";

      // Build identified_risks object if any field is provided
      const identifiedRisks = {};
      if (values.weather_risk) identifiedRisks.weather_risk = values.weather_risk;
      if (values.crop_health) identifiedRisks.crop_health = values.crop_health;
      if (values.historical_claims) identifiedRisks.historical_claims = values.historical_claims;

      // Build recommendations object if any field is provided
      const recommendations = {};
      if (values.monitoring_frequency) recommendations.monitoring_frequency = values.monitoring_frequency;
      if (values.suggested_actions) {
        const actions = values.suggested_actions.split("\n").filter((a) => a.trim());
        if (actions.length > 0) recommendations.suggested_actions = actions;
      }

      const requestData = {
        registered_policy_id: policy.id,
        analysis_status: "passed", // Always "passed" for manual assessment
        analysis_type: values.analysis_type,
        analysis_source: `${partnerName} đánh giá thủ công`,
        overall_risk_score: values.overall_risk_score
          ? parseFloat(values.overall_risk_score) / 100
          : undefined,
        overall_risk_level: values.overall_risk_level,
        identified_risks: Object.keys(identifiedRisks).length > 0 ? identifiedRisks : undefined,
        recommendations: Object.keys(recommendations).length > 0 ? recommendations : undefined,
        analysis_notes: values.analysis_notes,
      };

      const response = await axiosInstance.post(
        endpoints.riskAnalysis.create,
        requestData
      );

      if (response.data.success) {
        message.success("Tạo đánh giá rủi ro thành công!");
        setRiskAnalysisModalVisible(false);
        riskAnalysisFormRef.current?.resetFields();
        // Refresh policy detail to get new risk analysis
        refetch();
      }
    } catch (error) {
      console.error("Error creating risk analysis:", error);
      const errorMessage =
        error.response?.data?.message || "Tạo đánh giá rủi ro thất bại!";
      message.error(errorMessage);
    } finally {
      setCreatingRiskAnalysis(false);
    }
  };

  const getRiskAnalysisFormFields = () => {
    return [
      {
        name: "analysis_type",
        label: "Loại phân tích",
        type: "select",
        required: true,
        placeholder: "Chọn loại phân tích",
        options: [
          { value: "manual", label: "Phân tích thủ công" },
          { value: "document_validation", label: "Xác thực tài liệu" },
          { value: "cross_reference", label: "Tham chiếu chéo dữ liệu" },
        ],
        gridColumn: "1 / 2",
      },
      {
        name: "overall_risk_level",
        label: "Mức độ rủi ro tổng thể",
        type: "select",
        required: true,
        placeholder: "Chọn mức độ rủi ro",
        options: [
          { value: "low", label: "Thấp" },
          { value: "medium", label: "Trung bình" },
          { value: "high", label: "Cao" },
          { value: "critical", label: "Nghiêm trọng" },
        ],
        gridColumn: "2 / 3",
      },
      {
        name: "overall_risk_score",
        label: "Điểm số rủi ro (%)",
        type: "number",
        required: false,
        placeholder: "Nhập điểm số rủi ro (0-100)",
        min: 0,
        max: 100,
        step: 0.01,
        tooltip: "Điểm số từ 0 (không rủi ro) đến 100 (rủi ro cao nhất)",
      },
      {
        name: "weather_risk",
        label: "Rủi ro thời tiết",
        type: "select",
        required: false,
        placeholder: "Đánh giá rủi ro thời tiết",
        options: [
          { value: "low", label: "Thấp" },
          { value: "moderate", label: "Trung bình" },
          { value: "high", label: "Cao" },
          { value: "severe", label: "Nghiêm trọng" },
        ],
        gridColumn: "1 / 2",
      },
      {
        name: "crop_health",
        label: "Sức khỏe cây trồng",
        type: "select",
        required: false,
        placeholder: "Đánh giá sức khỏe cây trồng",
        options: [
          { value: "excellent", label: "Xuất sắc" },
          { value: "good", label: "Tốt" },
          { value: "fair", label: "Trung bình" },
          { value: "poor", label: "Kém" },
          { value: "unknown", label: "Chưa xác định" },
        ],
        gridColumn: "2 / 3",
      },
      {
        name: "historical_claims",
        label: "Lịch sử bồi thường",
        type: "select",
        required: false,
        placeholder: "Đánh giá lịch sử bồi thường",
        options: [
          { value: "low", label: "Thấp" },
          { value: "moderate", label: "Trung bình" },
          { value: "high", label: "Cao" },
          { value: "unknown", label: "Chưa xác định" },
        ],
        gridColumn: "1 / 2",
      },
      {
        name: "monitoring_frequency",
        label: "Tần suất giám sát đề xuất",
        type: "select",
        required: false,
        placeholder: "Chọn tần suất giám sát",
        options: [
          { value: "daily", label: "Hàng ngày" },
          { value: "weekly", label: "Hàng tuần" },
          { value: "biweekly", label: "2 tuần/lần" },
          { value: "monthly", label: "Hàng tháng" },
        ],
        gridColumn: "2 / 3",
      },
      {
        name: "suggested_actions",
        label: "Hành động đề xuất",
        type: "textarea",
        required: false,
        placeholder:
          "Nhập các hành động đề xuất (mỗi hành động một dòng)\nVí dụ:\n- Theo dõi NDVI chặt chẽ\n- Kiểm tra xu hướng lượng mưa\n- Kiểm tra sức khỏe cây trồng hàng tuần",
        rows: 3,
      },
      {
        name: "analysis_notes",
        label: "Ghi chú đánh giá",
        type: "textarea",
        required: true,
        placeholder:
          "Nhập nhận xét chi tiết về đánh giá rủi ro...\nVí dụ: Đơn bảo hiểm cho thấy rủi ro trung bình do xu hướng thời tiết theo mùa. Khuyến nghị giám sát hàng tuần.",
        rows: 3,
      },
    ];
  };

  const handleDecisionSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Validate partner_id before submitting
      const meData = localStorage.getItem("me");
      if (meData) {
        try {
          const userData = JSON.parse(meData);
          const partnerId = userData?.partner_id;

          if (!partnerId || policy.insurance_provider_id !== partnerId) {
            message.error(getApprovalError("UNAUTHORIZED_APPROVE"));
            router.push(`/policy/${pageType}`);
            return;
          }
        } catch (e) {
          console.error("Failed to parse user data:", e);
          message.error(getApprovalError("USER_DATA_PARSE_FAILED"));
          return;
        }
      } else {
        message.error(getApprovalError("USER_DATA_NOT_FOUND"));
        return;
      }

      // Get latest risk analysis for evidence
      const latestRiskAnalysis = riskAnalysis?.risk_analyses?.[0] || null;

      const underwritingData = {
        underwriting_status:
          decisionType === "approve" ? "approved" : "rejected",
        recommendations: {
          suggested_coverage: decisionType === "approve" ? "full" : "none",
          premium_adjustment: decisionType === "approve" ? "none" : "reject",
        },
        reason:
          decisionType === "approve"
            ? "Policy meets all underwriting criteria. Risk analysis shows acceptable risk levels."
            : values.reason || getApprovalError("REASON_REQUIRED"),
        reason_evidence: {
          risk_score: latestRiskAnalysis?.overall_risk_score || 0,
          risk_level: latestRiskAnalysis?.overall_risk_level || "unknown",
          farm_history: decisionType === "approve" ? "clean" : "flagged",
        },
        validation_notes: values.validation_notes || "No additional notes",
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
          // Redirect to pending page after approval or rejection
          router.push("/policy/pending");
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
        name: "validation_notes",
        label: "Ghi chú xác thực",
        type: "textarea",
        placeholder: "Nhập ghi chú xác thực...\nVí dụ: Đã xác minh tất cả tài liệu. Vị trí trang trại đã được xác nhận. Phân tích rủi ro hoàn tất thành công.",
        required: true,
        rows: 4,
      });
    } else if (decisionType === "reject") {
      baseFields.push(
        {
          name: "reason",
          label: "Lý do từ chối",
          type: "textarea",
          placeholder: "Nhập lý do từ chối đơn bảo hiểm...",
          required: true,
          rows: 3,
        },
        {
          name: "validation_notes",
          label: "Ghi chú xác thực",
          type: "textarea",
          placeholder: "Nhập ghi chú chi tiết...",
          required: true,
          rows: 3,
        }
      );
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

  // Risk level mapping functions
  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "severe":
        return "red";
      case "medium":
        return "gold";
      case "moderate":
        return "gold";
      case "fair":
        return "gold";
      case "low":
        return "green";
      case "good":
        return "green";
      case "excellent":
        return "blue";
      case "poor":
        return "orange";
      case "unknown":
        return "default";
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
      case "severe":
        return "Nghiêm trọng";
      case "medium":
        return "Trung bình";
      case "moderate":
        return "Trung bình";
      case "fair":
        return "Trung bình";
      case "low":
        return "Thấp";
      case "good":
        return "Tốt";
      case "excellent":
        return "Xuất sắc";
      case "poor":
        return "Kém";
      case "unknown":
        return "Chưa xác định";
      default:
        return level;
    }
  };

  const getAnalysisTypeText = (type) => {
    switch (type?.toLowerCase()) {
      case "ai_model":
        return "Mô hình AI";
      case "document_validation":
        return "Xác thực tài liệu";
      case "cross_reference":
        return "Tham chiếu chéo dữ liệu";
      case "manual":
        return "Phân tích thủ công";
      default:
        return type;
    }
  };

  // Pagination logic
  const indexOfLastPhoto = currentPhotoPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos =
    farm?.farm_photos?.slice(indexOfFirstPhoto, indexOfLastPhoto) || [];

  const handlePageChange = (page) => {
    setCurrentPhotoPage(page);
  };

  // Handle access denied - redirect to list page
  // IMPORTANT: useEffect must be called before any conditional returns
  useEffect(() => {
    if (accessDenied) {
      message.error(getApprovalError("UNAUTHORIZED_APPROVE"));
      router.push(`/policy/${pageType}`);
    }
  }, [accessDenied, pageType, router]);

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
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          <span className="hidden sm:inline">Thông tin cơ bản</span>
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
        <span className="flex items-center gap-2">
          <SafetyOutlined />
          <span className="hidden sm:inline">Thông tin gói bảo hiểm</span>
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
        <span className="flex items-center gap-2">
          <EnvironmentOutlined />
          <span className="hidden sm:inline">Bản đồ</span>
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
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          <span className="hidden sm:inline">Hình ảnh bằng chứng</span>
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
        <span className="flex items-center gap-2">
          <LineChartOutlined />
          <span className="hidden sm:inline">Dữ liệu giám sát</span>
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
        <span className="flex items-center gap-2">
          <WarningOutlined />
          <span className="hidden sm:inline">Phân tích rủi ro</span>
        </span>
      ),
      children: (
        <Card>
          {!hasRiskAnalysis && pageType === "pending" && (
            <Card
              type="inner"
              style={{
                backgroundColor: "#fff7e6",
                borderColor: "#ffa940",
                borderLeft: "4px solid #fa8c16",
                marginBottom: "16px",
              }}
            >
              <Space direction="vertical" size="small" className="w-full">
                <div className="flex items-center gap-2">
                  <WarningOutlined
                    style={{ color: "#fa8c16", fontSize: "18px" }}
                  />
                  <Text strong style={{ color: "#d46b08", fontSize: "16px" }}>
                    {getRiskAnalysisWarning("NO_RISK_ANALYSIS")}
                  </Text>
                </div>
                <Text type="secondary">
                  {getRiskAnalysisWarning("NO_RISK_ANALYSIS_DESCRIPTION")}
                </Text>
                <Text type="secondary">
                  {getRiskAnalysisWarning("AUTO_OR_MANUAL")}
                </Text>
                <Button
                  type="primary"
                  icon={<SafetyOutlined />}
                  onClick={handleCreateRiskAnalysis}
                  style={{ marginTop: "8px" }}
                >
                  {getRiskAnalysisWarning("CREATE_BUTTON")}
                </Button>
              </Space>
            </Card>
          )}

          {riskAnalysis ? (
            <Space direction="vertical" size="large" className="w-full">
              {/* Summary Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Text strong className="text-base">
                    Tổng quan đánh giá rủi ro
                  </Text>
                  {pageType === "pending" && (
                    <Button
                      type="dashed"
                      icon={<SafetyOutlined />}
                      onClick={handleCreateRiskAnalysis}
                      size="small"
                    >
                      Tạo đánh giá thủ công
                    </Button>
                  )}
                </div>
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
                                <Tag color="blue">{getAnalysisTypeText(analysis.analysis_type)}</Tag>
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
                                    normalizeIdentifiedRisks(
                                      analysis.identified_risks
                                    )
                                  ).map(([riskKey, riskData]) => {
                                    return {
                                      key: riskKey,
                                      label: (
                                        <div className="flex justify-between items-center w-full">
                                          <span style={{ fontWeight: 500 }}>
                                            {getRiskTitle(riskKey)}
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
                                              (factor, fIdx) => {
                                                const factorLevel =
                                                  getFactorLevel(
                                                    factor,
                                                    riskData.level
                                                  );
                                                const factorType =
                                                  getFactorType(factor);
                                                const factorDesc =
                                                  getFactorDescription(factor);

                                                return (
                                                  <Card
                                                    key={fIdx}
                                                    size="small"
                                                    style={{
                                                      backgroundColor:
                                                        "#fafafa",
                                                      borderLeft: `4px solid ${
                                                        factorLevel ===
                                                        "critical"
                                                          ? "#ff4d4f"
                                                          : factorLevel ===
                                                            "high"
                                                          ? "#fa8c16"
                                                          : factorLevel ===
                                                            "medium"
                                                          ? "#faad14"
                                                          : "#52c41a"
                                                      }`,
                                                    }}
                                                  >
                                                    <Space
                                                      direction="vertical"
                                                      size="small"
                                                      className="w-full"
                                                    >
                                                      <div className="flex justify-between items-start gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <Tag
                                                            color={getRiskLevelColor(
                                                              factorLevel
                                                            )}
                                                          >
                                                            {getRiskLevelText(
                                                              factorLevel
                                                            )}
                                                          </Tag>
                                                          <Text
                                                            strong
                                                            className="text-sm"
                                                          >
                                                            {factorType}
                                                          </Text>
                                                        </div>
                                                        <Tag color="blue">
                                                          Điểm: {factor.score}
                                                        </Tag>
                                                      </div>
                                                      <Text
                                                        style={{
                                                          whiteSpace:
                                                            "pre-wrap",
                                                          lineHeight: "1.6",
                                                        }}
                                                      >
                                                        {factorDesc}
                                                      </Text>
                                                    </Space>
                                                  </Card>
                                                );
                                              }
                                            )
                                          ) : riskData._isManual ? (
                                            <Text type="secondary">
                                              Đánh giá thủ công - Mức độ: <Tag color={getRiskLevelColor(riskData.level)}>{getRiskLevelText(riskData.level)}</Tag>
                                            </Text>
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
                          {(analysis.raw_output?.trigger_simulation_results ||
                            analysis.raw_output?.trigger_simulation) && (
                            <div>
                              <Text strong className="text-base block mb-3">
                                Kết quả mô phỏng trigger
                              </Text>
                              <Collapse
                                items={normalizeTriggerSimulation(
                                  analysis.raw_output
                                    .trigger_simulation_results ||
                                    analysis.raw_output.trigger_simulation
                                ).map((trigger, tIdx) => ({
                                  key: tIdx,
                                  label: (
                                    <div className="flex justify-between items-center w-full">
                                      <span style={{ fontWeight: 500 }}>
                                        {trigger.parameter_name?.toUpperCase() ||
                                          "TRIGGER"}
                                      </span>
                                      <Space size="small">
                                        {trigger.status &&
                                          trigger.status !== "completed" && (
                                            <Tag color="orange">
                                              {trigger.status ===
                                              "simulation_failed"
                                                ? "Mô phỏng thất bại"
                                                : trigger.status}
                                            </Tag>
                                          )}
                                        {trigger.risk_level && (
                                          <Tag
                                            color={getRiskLevelColor(
                                              trigger.risk_level
                                            )}
                                          >
                                            {getRiskLevelText(
                                              trigger.risk_level
                                            )}
                                          </Tag>
                                        )}
                                        <Tag
                                          color={
                                            trigger.historical_breaches > 0
                                              ? "red"
                                              : "green"
                                          }
                                        >
                                          Vi phạm: {trigger.historical_breaches}
                                        </Tag>
                                      </Space>
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
                                              trigger.historical_breaches > 0
                                                ? "red"
                                                : "green"
                                            }
                                          >
                                            {trigger.historical_breaches}
                                          </Tag>
                                        </Descriptions.Item>
                                        {trigger.simulated_breaches !==
                                          undefined && (
                                          <Descriptions.Item label="Mô phỏng vi phạm">
                                            <Tag
                                              color={
                                                trigger.simulated_breaches > 0
                                                  ? "red"
                                                  : "green"
                                              }
                                            >
                                              {trigger.simulated_breaches ===
                                              "Infinite/Guaranteed"
                                                ? "Vô hạn/Chắc chắn"
                                                : trigger.simulated_breaches}
                                            </Tag>
                                          </Descriptions.Item>
                                        )}
                                        <Descriptions.Item label="Khoảng cách đến ngưỡng">
                                          {trigger.proximity_to_threshold ||
                                            "N/A"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Phân tích">
                                          <Text
                                            type="secondary"
                                            style={{
                                              whiteSpace: "pre-wrap",
                                              lineHeight: "1.6",
                                            }}
                                          >
                                            {trigger.analysis}
                                          </Text>
                                        </Descriptions.Item>
                                      </Descriptions>

                                      {trigger.breach_dates &&
                                        trigger.breach_dates.length > 0 && (
                                          <div>
                                            <Text strong className="block mb-2">
                                              Ngày vi phạm:
                                            </Text>
                                            <Space wrap>
                                              {trigger.breach_dates.map(
                                                (date, dIdx) => (
                                                  <Tag key={dIdx} color="red">
                                                    {date}
                                                  </Tag>
                                                )
                                              )}
                                            </Space>
                                          </div>
                                        )}
                                    </Space>
                                  ),
                                }))}
                                defaultActiveKey={normalizeTriggerSimulation(
                                  analysis.raw_output
                                    .trigger_simulation_results ||
                                    analysis.raw_output.trigger_simulation
                                ).map((_, idx) => idx)}
                                expandIconPosition="end"
                              />
                            </div>
                          )}

                          {/* Fraud Assessment */}
                          {analysis.raw_output?.fraud_assessment_details &&
                            (() => {
                              const fraudAssessment = normalizeFraudAssessment(
                                analysis.raw_output.fraud_assessment_details
                              );

                              return (
                                <div>
                                  <Text strong className="text-base block mb-3">
                                    Đánh giá gian lận
                                  </Text>
                                  <Card
                                    size="small"
                                    style={{
                                      backgroundColor:
                                        fraudAssessment.level === "critical"
                                          ? "#fff1f0"
                                          : fraudAssessment.level === "high"
                                          ? "#fff7e6"
                                          : "#fffbe6",
                                      borderColor:
                                        fraudAssessment.level === "critical"
                                          ? "#ffccc7"
                                          : fraudAssessment.level === "high"
                                          ? "#ffd591"
                                          : "#ffe58f",
                                      borderLeft: `4px solid ${
                                        fraudAssessment.level === "critical"
                                          ? "#ff4d4f"
                                          : fraudAssessment.level === "high"
                                          ? "#fa8c16"
                                          : "#faad14"
                                      }`,
                                    }}
                                  >
                                    <Space
                                      direction="vertical"
                                      size="middle"
                                      className="w-full"
                                    >
                                      <div className="flex justify-between items-center">
                                        <Text strong>
                                          Mức độ gian lận:{" "}
                                          {getRiskLevelText(
                                            fraudAssessment.level
                                          )}
                                        </Text>
                                        <Tag
                                          color={getRiskLevelColor(
                                            fraudAssessment.level
                                          )}
                                        >
                                          Điểm: {fraudAssessment.score}
                                        </Tag>
                                      </div>
                                      {fraudAssessment.indicators_triggered &&
                                        fraudAssessment.indicators_triggered
                                          .length > 0 && (
                                          <div>
                                            <Text strong className="block mb-2">
                                              Chỉ số kích hoạt:
                                            </Text>
                                            <Space
                                              direction="vertical"
                                              size="small"
                                              className="w-full"
                                            >
                                              {fraudAssessment.indicators_triggered.map(
                                                (indicator, iIdx) => (
                                                  <Card
                                                    key={iIdx}
                                                    size="small"
                                                    style={{
                                                      backgroundColor:
                                                        "#ffffff",
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
                              );
                            })()}

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
            {pageType === "pending" && policy.status === "pending_review" && (
              <>
                <Button
                  danger
                  onClick={() => handleDecision("reject")}
                  disabled={!hasRiskAnalysis}
                  title={
                    !hasRiskAnalysis
                      ? getApprovalWarning("DECISION_REQUIRES_RISK_ANALYSIS")
                      : ""
                  }
                >
                  Từ chối đơn
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleDecision("approve")}
                  disabled={!hasRiskAnalysis}
                  title={
                    !hasRiskAnalysis
                      ? getApprovalWarning("DECISION_REQUIRES_RISK_ANALYSIS")
                      : ""
                  }
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
          {/* Risk Analysis Summary */}
          {riskAnalysis?.risk_analyses?.[0] && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
              <Space direction="vertical" size="small" className="w-full">
                <Text strong>Thông tin đánh giá rủi ro:</Text>
                <div className="flex justify-between">
                  <Text type="secondary">Loại phân tích:</Text>
                  <Text strong>
                    {getAnalysisTypeText(riskAnalysis.risk_analyses[0].analysis_type)}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Điểm rủi ro:</Text>
                  <Text strong>
                    {riskAnalysis.risk_analyses[0].overall_risk_score
                      ? `${(riskAnalysis.risk_analyses[0].overall_risk_score * 100).toFixed(2)}%`
                      : '0%'}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Mức độ rủi ro:</Text>
                  <Tag color={getRiskLevelColor(riskAnalysis.risk_analyses[0].overall_risk_level)}>
                    {getRiskLevelText(riskAnalysis.risk_analyses[0].overall_risk_level)}
                  </Tag>
                </div>
                {riskAnalysis.risk_analyses[0].analysis_notes && (
                  <div>
                    <Text type="secondary">Ghi chú đánh giá:</Text>
                    <Text style={{ display: 'block', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                      {riskAnalysis.risk_analyses[0].analysis_notes}
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          )}

          <CustomForm
            ref={formRef}
            fields={getDecisionFormFields()}
            onSubmit={handleDecisionSubmit}
            gridColumns="1fr"
            gap="16px"
          />
        </Modal>

        {/* Risk Analysis Creation Modal */}
        <Modal
          title="Tạo đánh giá rủi ro thủ công"
          open={riskAnalysisModalVisible}
          onCancel={() => {
            if (!creatingRiskAnalysis) {
              setRiskAnalysisModalVisible(false);
              riskAnalysisFormRef.current?.resetFields();
            }
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setRiskAnalysisModalVisible(false);
                riskAnalysisFormRef.current?.resetFields();
              }}
              disabled={creatingRiskAnalysis}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={() => riskAnalysisFormRef.current?.submit()}
              loading={creatingRiskAnalysis}
              disabled={creatingRiskAnalysis}
            >
              Tạo đánh giá
            </Button>,
          ]}
          width={900}
          closable={!creatingRiskAnalysis}
          maskClosable={!creatingRiskAnalysis}
        >
          <CustomForm
            ref={riskAnalysisFormRef}
            fields={getRiskAnalysisFormFields()}
            onSubmit={handleRiskAnalysisSubmit}
            gridColumns="1fr 1fr"
            gap="16px"
          />
        </Modal>
      </div>
    </div>
  );
}
