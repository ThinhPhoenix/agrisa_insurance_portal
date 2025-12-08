"use client";

import { CustomForm } from "@/components/custom-form";
import ErrorResult from "@/components/error-result";
import {
  BasePolicyTab,
  BasicInfoTab,
  ClaimsTab,
  ImagesTab,
  MapTab,
  MonitoringDataTab,
  RiskAnalysisTab,
} from "@/components/layout/policy/detail";
import axiosInstance from "@/libs/axios-instance";
import {
  getApprovalError,
  getApprovalInfo,
  getApprovalSuccess,
  getApprovalWarning,
  getRiskAnalysisWarning,
} from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { usePolicyDetail } from "@/services/hooks/policy/use-policy-detail";
import { useAuthStore } from "@/stores/auth-store";
import {
  BarChartOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  SafetyOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Layout,
  message,
  Modal,
  Space,
  Spin,
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

  // Active tab state
  const [activeTab, setActiveTab] = useState("basic");

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
      const partnerName =
        user?.profile?.full_name || user?.user?.full_name || "Đối tác";

      // Build identified_risks object if any field is provided
      const identifiedRisks = {};
      if (values.weather_risk)
        identifiedRisks.weather_risk = values.weather_risk;
      if (values.crop_health) identifiedRisks.crop_health = values.crop_health;
      if (values.historical_claims)
        identifiedRisks.historical_claims = values.historical_claims;

      // Build recommendations object if any field is provided
      const recommendations = {};
      if (values.monitoring_frequency)
        recommendations.monitoring_frequency = values.monitoring_frequency;
      if (values.suggested_actions) {
        const actions = values.suggested_actions
          .split("\n")
          .filter((a) => a.trim());
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
        identified_risks:
          Object.keys(identifiedRisks).length > 0 ? identifiedRisks : undefined,
        recommendations:
          Object.keys(recommendations).length > 0 ? recommendations : undefined,
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
        placeholder:
          "Nhập ghi chú xác thực...\nVí dụ: Đã xác minh tất cả tài liệu. Vị trí trang trại đã được xác nhận. Phân tích rủi ro hoàn tất thành công.",
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

  // Handle access denied - show error message only
  // IMPORTANT: useEffect must be called before any conditional returns
  useEffect(() => {
    if (accessDenied) {
      console.error("🚫 Access Denied - Showing error page");
      message.error("Bạn không có quyền truy cập đơn bảo hiểm này!");
    }
  }, [accessDenied]);

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
        subTitle="Bạn không có quyền truy cập đơn bảo hiểm này. Vui lòng kiểm tra lại quyền truy cập của bạn."
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

  // Build tab items - only show Claims tab for active policies
  const tabItems = [
    {
      key: "basic",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          <span className="hidden sm:inline">Cơ bản</span>
        </span>
      ),
      children: <BasicInfoTab policy={policy} farm={farm} />,
    },
    {
      key: "basePolicy",
      label: (
        <span className="flex items-center gap-2">
          <SafetyOutlined />
          <span className="hidden sm:inline">Hợp đồng mẫu</span>
        </span>
      ),
      children: (
        <BasePolicyTab
          basePolicy={basePolicy}
          dataSourceNames={dataSourceNames}
        />
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
      children: <MapTab farm={farm} />,
    },
    {
      key: "images",
      label: (
        <span className="flex items-center gap-2">
          <CameraOutlined />
          <span className="hidden sm:inline">Hình ảnh</span>
        </span>
      ),
      children: <ImagesTab farm={farm} />,
    },
    {
      key: "monitoring",
      label: (
        <span className="flex items-center gap-2">
          <BarChartOutlined />
          <span className="hidden sm:inline">Giám sát</span>
        </span>
      ),
      children: <MonitoringDataTab monitoringData={monitoringData} />,
    },
    {
      key: "risk",
      label: (
        <span className="flex items-center gap-2">
          <ExclamationCircleOutlined />
          <span className="hidden sm:inline">Rủi ro</span>
        </span>
      ),
      children: (
        <RiskAnalysisTab
          riskAnalysis={riskAnalysis}
          hasRiskAnalysis={hasRiskAnalysis}
          pageType={pageType}
          onCreateRiskAnalysis={handleCreateRiskAnalysis}
          getRiskAnalysisWarning={getRiskAnalysisWarning}
          getRiskLevelColor={getRiskLevelColor}
          getRiskLevelText={getRiskLevelText}
          getAnalysisTypeText={getAnalysisTypeText}
        />
      ),
    },
  ];

  // Add Claims tab for active policies
  if (
    pageType === "active" &&
    policy.status === "active" &&
    policy.underwriting_status === "approved"
  ) {
    tabItems.push({
      key: "claims",
      label: (
        <span className="flex items-center gap-2">
          <WalletOutlined style={{ color: "#52c41a" }} />
          <span className="hidden sm:inline">Bồi thường</span>
        </span>
      ),
      children: <ClaimsTab policyId={policyId} />,
    });
  }

  return (
    <div className="insurance-content">
      <div className="insurance-space">
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>
            Chi tiết đơn hợp đồng số: {policy.policy_number}
          </Title>
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

        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />

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
            <Card
              size="small"
              style={{ marginBottom: 16, backgroundColor: "#f5f5f5" }}
            >
              <Space direction="vertical" size="small" className="w-full">
                <Text strong>Thông tin đánh giá rủi ro:</Text>
                <div className="flex justify-between">
                  <Text type="secondary">Loại phân tích:</Text>
                  <Text strong>
                    {getAnalysisTypeText(
                      riskAnalysis.risk_analyses[0].analysis_type
                    )}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Điểm rủi ro:</Text>
                  <Text strong>
                    {riskAnalysis.risk_analyses[0].overall_risk_score
                      ? `${(
                          riskAnalysis.risk_analyses[0].overall_risk_score * 100
                        ).toFixed(2)}%`
                      : "0%"}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Mức độ rủi ro:</Text>
                  <Tag
                    color={getRiskLevelColor(
                      riskAnalysis.risk_analyses[0].overall_risk_level
                    )}
                  >
                    {getRiskLevelText(
                      riskAnalysis.risk_analyses[0].overall_risk_level
                    )}
                  </Tag>
                </div>
                {riskAnalysis.risk_analyses[0].analysis_notes && (
                  <div>
                    <Text type="secondary">Ghi chú đánh giá:</Text>
                    <Text
                      style={{
                        display: "block",
                        marginTop: 4,
                        whiteSpace: "pre-wrap",
                      }}
                    >
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
