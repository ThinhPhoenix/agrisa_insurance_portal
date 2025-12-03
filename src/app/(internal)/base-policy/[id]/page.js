"use client";

import {
  BasicInfoDetail,
  ConfigurationDetail,
  CostSummary,
  TagsDetail,
} from "@/components/layout/base-policy/detail";
import useDetailPolicy from "@/services/hooks/base-policy/use-detail-policy";
import usePolicy from "@/services/hooks/base-policy/use-policy";
import useDataSource from "@/services/hooks/common/use-data-source";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  message,
  Row,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import mockData from "../mock..json";

const { Title, Text } = Typography;

const PolicyDetailPage = ({ params }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("basic");
  const [enrichedDataSources, setEnrichedDataSources] = React.useState([]);

  // Use policy list hook for checking policy status
  const { policies } = usePolicy();

  // Use detail policy hook for fetching policy details
  const {
    policyDetail: apiPolicyDetail,
    policyDetailLoading,
    policyDetailError,
    fetchPolicyDetail,
    fetchActivePolicyDetail,
  } = useDetailPolicy();

  // Use data source hook for fetching data source details
  const { fetchDataSourcesByIds } = useDataSource();

  // Fetch policy detail and validate on mount
  useEffect(() => {
    const loadPolicyDetail = async () => {
      if (!params.id) {
        message.error("ID chính sách không hợp lệ");
        router.push("/base-policy");
        return;
      }

      // Get partner_id from localStorage for validation
      const meData = localStorage.getItem("me");
      if (!meData) {
        message.error("Không tìm thấy thông tin người dùng");
        router.push("/base-policy");
        return;
      }

      try {
        const userData = JSON.parse(meData);
        // Use partner_id or user_id for policy access (read operation)
        const userId = userData?.user_id;
        const partnerId = userData?.partner_id;

        if (!partnerId && !userId) {
          message.error("Không tìm thấy thông tin người dùng hợp lệ");
          router.push("/base-policy");
          return;
        }

        // Find policy in the list to check its status
        const policyInList = policies.find(
          (p) => p.base_policy?.id === params.id
        );
        const policyStatus = policyInList?.base_policy?.status;

        let policyData = null;

        // Try to fetch based on status
        if (policyStatus === "active") {
          policyData = await fetchActivePolicyDetail(params.id);
        } else if (policyStatus === "draft") {
          policyData = await fetchPolicyDetail(params.id);
        } else {
          // If policy not found in list or unknown status, try active API first, then draft
          policyData = await fetchActivePolicyDetail(params.id);
          if (!policyData) {
            policyData = await fetchPolicyDetail(params.id);
          }
        }

        if (!policyData) {
          message.error("Không tìm thấy chính sách");
          router.push("/base-policy");
          return;
        }

        // Security validation: Check if policy belongs to current user
        // Note: The security check is already done in fetchPolicyDetail and fetchActivePolicyDetail
        // This is a redundant check that can be removed, but kept for extra safety
        const policyProviderId = policyData.base_policy?.insurance_provider_id;

        const hasAccess =
          policyProviderId === partnerId || policyProviderId === userId;

        if (!hasAccess) {
          message.error(
            "Bạn không có quyền truy cập chính sách này. Vi phạm bảo mật!"
          );
          router.push("/base-policy");
          return;
        }
      } catch (error) {
        console.error("❌ Error loading policy detail:", error);
        message.error("Có lỗi xảy ra khi tải thông tin chính sách");
        router.push("/base-policy");
      }
    };

    loadPolicyDetail();
  }, [params.id, fetchPolicyDetail, fetchActivePolicyDetail, policies, router]);

  // Fetch data source details when policy detail is loaded
  useEffect(() => {
    const loadDataSources = async () => {
      if (
        !apiPolicyDetail?.conditions ||
        apiPolicyDetail.conditions.length === 0
      ) {
        setEnrichedDataSources([]);
        return;
      }

      // Extract unique data source IDs from conditions
      const dataSourceIds = [
        ...new Set(
          apiPolicyDetail.conditions.map(
            (condition) => condition.data_source_id
          )
        ),
      ].filter(Boolean);

      if (dataSourceIds.length === 0) {
        setEnrichedDataSources([]);
        return;
      }

      // Fetch data source details
      const dataSourceDetails = await fetchDataSourcesByIds(dataSourceIds);

      // Create a map for quick lookup
      const dataSourceMap = {};
      dataSourceDetails.forEach((ds) => {
        dataSourceMap[ds.id] = ds;
      });

      setEnrichedDataSources(dataSourceMap);
    };

    loadDataSources();
  }, [apiPolicyDetail, fetchDataSourcesByIds]);

  // Show loading spinner
  if (policyDetailLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" tip="Đang tải thông tin chính sách..." />
      </div>
    );
  }

  // Show error or redirect handled in useEffect
  if (!apiPolicyDetail) {
    return null;
  }

  // Transform API data to component format
  const basePolicy = apiPolicyDetail.base_policy;
  const trigger = apiPolicyDetail.trigger;
  const conditions = apiPolicyDetail.conditions || [];

  // Convert timestamp to date string
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0 || timestamp === "0001-01-01T00:00:00Z")
      return "N/A";

    // Handle both Unix timestamp and ISO string
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp * 1000);
    }

    return date.toLocaleDateString("vi-VN");
  };

  const policyDetail = {
    id: basePolicy.id,
    productName: basePolicy.product_name,
    productCode: basePolicy.product_code,
    insuranceProviderId: basePolicy.insurance_provider_id,
    cropType: basePolicy.crop_type,
    premiumBaseRate: basePolicy.premium_base_rate,
    coverageDurationDays: basePolicy.coverage_duration_days,
    coverageAmount: basePolicy.fix_payout_amount || 0,
    status: basePolicy.status,
    createdAt: formatDate(basePolicy.created_at),
    updatedAt: formatDate(basePolicy.updated_at),
    description: basePolicy.product_description || "",
    coverageCurrency: basePolicy.coverage_currency,
    fixPremiumAmount: basePolicy.fix_premium_amount,
    isPerHectare: basePolicy.is_per_hectare,
    maxPremiumPaymentProlong: basePolicy.max_premium_payment_prolong,
    fixPayoutAmount: basePolicy.fix_payout_amount,
    isPayoutPerHectare: basePolicy.is_payout_per_hectare,
    overThresholdMultiplier: basePolicy.over_threshold_multiplier,
    payoutBaseRate: basePolicy.payout_base_rate,
    payoutCap: basePolicy.payout_cap,
    cancelPremiumRate: basePolicy.cancel_premium_rate,
    enrollmentStartDay: formatDate(basePolicy.enrollment_start_day),
    enrollmentEndDay: formatDate(basePolicy.enrollment_end_day),
    autoRenewal: basePolicy.auto_renewal,
    renewalDiscountRate: basePolicy.renewal_discount_rate,
    insuranceValidFromDay: formatDate(basePolicy.insurance_valid_from_day),
    insuranceValidToDay: formatDate(basePolicy.insurance_valid_to_day),
    templateDocumentUrl: basePolicy.template_document_url,
    documentValidationStatus: basePolicy.document_validation_status,
    documentTags: basePolicy.document_tags || {},
    importantAdditionalInformation:
      basePolicy.important_additional_information || "",
    createdBy: basePolicy.created_by,

    // Configuration from trigger and conditions
    configuration: {
      logicalOperator: trigger?.logical_operator || "AND",
      growthStage: trigger?.growth_stage || "",
      monitorInterval: trigger?.monitor_interval || 1,
      monitorFrequencyUnit: trigger?.monitor_frequency_unit || "day",
      triggerConditions: conditions.map((condition) => {
        const dataSourceDetail = enrichedDataSources[condition.data_source_id];
        return {
          id: condition.id,
          dataSourceId: condition.data_source_id,
          thresholdOperator: condition.threshold_operator,
          thresholdValue: condition.threshold_value,
          earlyWarningThreshold: condition.early_warning_threshold,
          aggregationFunction: condition.aggregation_function,
          aggregationWindowDays: condition.aggregation_window_days,
          consecutiveRequired: condition.consecutive_required,
          includeComponent: condition.include_component,
          baselineWindowDays: condition.baseline_window_days,
          baselineFunction: condition.baseline_function,
          validationWindowDays: condition.validation_window_days,
          conditionOrder: condition.condition_order,
          baseCost: condition.base_cost,
          categoryMultiplier: condition.category_multiplier,
          tierMultiplier: condition.tier_multiplier,
          calculatedCost: condition.calculated_cost,
          // Enriched fields for display
          dataSourceLabel: dataSourceDetail?.label || condition.data_source_id,
          dataSourceParameterName: dataSourceDetail?.parameterName || "",
          dataSourceUnit: dataSourceDetail?.unit || "",
        };
      }),
    },

    // Tags from document_tags
    tags: Object.entries(basePolicy.document_tags || {}).map(
      ([key, dataType]) => ({
        id: key,
        key,
        label: key,
        value: "",
        dataType,
      })
    ),

    // Data sources - map from conditions with enriched details
    selectedDataSources: conditions.map((condition) => {
      const dataSourceDetail = enrichedDataSources[condition.data_source_id];
      return {
        id: condition.data_source_id,
        dataSourceId: condition.data_source_id,
        baseCost: condition.base_cost,
        calculatedCost: condition.calculated_cost,
        categoryMultiplier: condition.category_multiplier,
        tierMultiplier: condition.tier_multiplier,
        // Enriched fields from API
        label: dataSourceDetail?.label || condition.data_source_id,
        parameterName: dataSourceDetail?.parameterName || "",
        unit: dataSourceDetail?.unit || "",
        categoryLabel: dataSourceDetail?.categoryLabel || "",
        tierLabel: dataSourceDetail?.tierLabel || "",
      };
    }),

    // Document information from API
    document: apiPolicyDetail.document || null,
    metadata: apiPolicyDetail.metadata || null,
  };

  const handleBack = () => {
    router.push("/base-policy");
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      draft: {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "Chờ duyệt",
      },
      active: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Đang hoạt động",
      },
      closed: {
        color: "error",
        icon: <ClockCircleOutlined />,
        text: "Đã đóng",
      },
      archived: {
        color: "default",
        icon: <FileTextOutlined />,
        text: "Đã lưu trữ",
      },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const tabItems = [
    {
      key: "basic",
      label: (
        <Space>
          <FileTextOutlined />
          <span>Thông tin Cơ bản</span>
        </Space>
      ),
      children: (
        <BasicInfoDetail policyData={policyDetail} mockData={mockData} />
      ),
    },
    {
      key: "configuration",
      label: (
        <Space>
          <CheckCircleOutlined />
          <span>Cấu hình</span>
        </Space>
      ),
      children: (
        <ConfigurationDetail policyData={policyDetail} mockData={mockData} />
      ),
    },
    {
      key: "tags",
      label: (
        <Space>
          <FileTextOutlined />
          <span>Tài liệu & Trường thông tin</span>
        </Space>
      ),
      children: <TagsDetail policyData={policyDetail} mockData={mockData} />,
    },
    // Add document tab if document exists
    ...(policyDetail.document?.has_document
      ? [
          {
            key: "document",
            label: (
              <Space>
                <FilePdfOutlined />
                <span>Xem Tài liệu PDF</span>
              </Space>
            ),
            children: (
              <Card>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Title level={4}>
                      <FilePdfOutlined /> Tài liệu Chính sách Bảo hiểm
                    </Title>
                    <Text type="secondary">
                      Xem và tải xuống tài liệu chính sách bảo hiểm
                    </Text>
                  </div>

                  <Divider style={{ margin: "12px 0" }} />

                  {/* Document info */}
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text type="secondary">Tên tài liệu:</Text>
                      <br />
                      <Text strong code>
                        {policyDetail.document.document_url}
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Loại tệp:</Text>
                      <br />
                      <Tag color="blue">
                        {policyDetail.document.content_type || "PDF"}
                      </Tag>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Kích thước:</Text>
                      <br />
                      <Text strong>
                        {policyDetail.document.file_size_bytes
                          ? `${(policyDetail.document.file_size_bytes / 1024).toFixed(
                              2
                            )} KB`
                          : "N/A"}
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Trạng thái:</Text>
                      <br />
                      <Tag
                        color={
                          policyDetail.documentValidationStatus === "passed"
                            ? "green"
                            : "orange"
                        }
                      >
                        {policyDetail.documentValidationStatus === "passed"
                          ? "Đã xác thực"
                          : "Chưa xác thực"}
                      </Tag>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "12px 0" }} />

                  {/* Action buttons */}
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text type="secondary" strong>
                        Tài liệu gốc (Document URL):
                      </Text>
                      <br />
                      <Text code style={{ wordBreak: "break-all" }}>
                        {policyDetail.document.document_url}
                      </Text>
                    </div>
                    <Space>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="large"
                        onClick={() => {
                          if (policyDetail.document.presigned_url) {
                            window.open(
                              policyDetail.document.presigned_url,
                              "_blank"
                            );
                          } else {
                            message.warning("URL tài liệu không khả dụng");
                          }
                        }}
                        disabled={!policyDetail.document.presigned_url}
                      >
                        Xem Tài liệu PDF
                      </Button>
                      {policyDetail.document.presigned_url_expiry && (
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Link hết hạn:{" "}
                          {new Date(
                            policyDetail.document.presigned_url_expiry
                          ).toLocaleString("vi-VN")}
                        </Text>
                      )}
                    </Space>
                  </Space>

                  {/* Metadata */}
                  {policyDetail.metadata && (
                    <>
                      <Divider style={{ margin: "12px 0" }} />
                      <div>
                        <Text type="secondary" strong>
                          Thông tin bổ sung:
                        </Text>
                        <Row gutter={[16, 8]} style={{ marginTop: "8px" }}>
                          <Col span={8}>
                            <Text type="secondary">Tổng triggers:</Text>
                            <br />
                            <Text strong>
                              {policyDetail.metadata.total_triggers || 0}
                            </Text>
                          </Col>
                          <Col span={8}>
                            <Text type="secondary">Tổng conditions:</Text>
                            <br />
                            <Text strong>
                              {policyDetail.metadata.total_conditions || 0}
                            </Text>
                          </Col>
                          <Col span={8}>
                            <Text type="secondary">Tổng chi phí dữ liệu:</Text>
                            <br />
                            <Text strong style={{ color: "#1890ff" }}>
                              {policyDetail.metadata.total_data_cost?.toLocaleString() ||
                                0}{" "}
                              ₫
                            </Text>
                          </Col>
                        </Row>
                      </div>
                    </>
                  )}
                </Space>
              </Card>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <Row align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: 0, height: "auto" }}
              >
                Quay lại danh sách
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {policyDetail.productName}
              </Title>
              <Space>
                <Text type="secondary" code>
                  {policyDetail.productCode}
                </Text>
                {getStatusTag(policyDetail.status)}
              </Space>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={6}>
            <Text type="secondary">Ngày tạo:</Text>
            <br />
            <Text strong>{policyDetail.createdAt}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Cập nhật:</Text>
            <br />
            <Text strong>{policyDetail.updatedAt}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Thời hạn:</Text>
            <br />
            <Text strong>{policyDetail.coverageDurationDays} ngày</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Số tiền bảo hiểm:</Text>
            <br />
            <Text strong style={{ color: "#52c41a" }}>
              {policyDetail.coverageAmount?.toLocaleString()} ₫
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row gutter={24}>
        {/* Left Content - Details Tabs */}
        <Col span={16}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Col>

        {/* Right Content - Cost Summary */}
        <Col span={8}>
          <div
            style={{
              position: "sticky",
              top: "24px",
              height: "fit-content",
            }}
          >
            <CostSummary policyData={policyDetail} mockData={mockData} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PolicyDetailPage;
