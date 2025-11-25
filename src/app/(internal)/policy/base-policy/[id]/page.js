"use client";

import {
  BasicInfoDetail,
  ConfigurationDetail,
  CostSummary,
  TagsDetail,
} from "@/components/layout/policy/detail";
import useDetailPolicy from "@/services/hooks/policy/use-detail-policy";
import usePolicy from "@/services/hooks/policy/use-policy";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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

  // Use policy list hook for checking draft/active status
  const { policies, activePolicies } = usePolicy();

  // Use detail policy hook for fetching policy details
  const {
    policyDetail: apiPolicyDetail,
    policyDetailLoading,
    policyDetailError,
    fetchPolicyDetail,
    fetchActivePolicyDetail,
  } = useDetailPolicy();

  // Fetch policy detail and validate on mount
  useEffect(() => {
    const loadPolicyDetail = async () => {
      if (!params.id) {
        message.error("ID chính sách không hợp lệ");
        router.push("/policy/base-policy");
        return;
      }

      // Get partner_id from localStorage for validation
      const meData = localStorage.getItem("me");
      if (!meData) {
        message.error("Không tìm thấy thông tin người dùng");
        router.push("/policy/base-policy");
        return;
      }

      try {
        const userData = JSON.parse(meData);
        // Use user_id instead of partner_id for consistency
        const userId = userData?.user_id;

        if (!userId) {
          message.error("Không tìm thấy User ID trong thông tin người dùng");
          router.push("/policy/base-policy");
          return;
        }

        // Determine if policy is draft or active by checking both lists
        const isDraft = policies.some((p) => p.base_policy?.id === params.id);
        const isActive = activePolicies.some(
          (p) => p.base_policy?.id === params.id
        );

        let policyData = null;

        // Try to fetch as active policy first (uses the new API)
        if (isActive || (!isDraft && !isActive)) {
          policyData = await fetchActivePolicyDetail(params.id);
        }

        // If not found or is draft, try draft API
        if (!policyData && (isDraft || !isActive)) {
          policyData = await fetchPolicyDetail(params.id);
        }

        if (!policyData) {
          message.error("Không tìm thấy chính sách");
          router.push("/policy/base-policy");
          return;
        }

        // Security validation: Check if policy belongs to current user
        // Note: The security check is already done in fetchPolicyDetail and fetchActivePolicyDetail
        // This is a redundant check that can be removed, but kept for extra safety
        const policyProviderId = policyData.base_policy?.insurance_provider_id;

        if (policyProviderId !== userId) {
          message.error(
            "Bạn không có quyền truy cập chính sách này. Vi phạm bảo mật!"
          );
          router.push("/policy/base-policy");
          return;
        }
      } catch (error) {
        console.error("❌ Error loading policy detail:", error);
        message.error("Có lỗi xảy ra khi tải thông tin chính sách");
        router.push("/policy/base-policy");
      }
    };

    loadPolicyDetail();
  }, [
    params.id,
    fetchPolicyDetail,
    fetchActivePolicyDetail,
    policies,
    activePolicies,
    router,
  ]);

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
      triggerConditions: conditions.map((condition) => ({
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
      })),
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

    // Data sources - map from conditions
    selectedDataSources: conditions.map((condition) => ({
      id: condition.data_source_id,
      dataSourceId: condition.data_source_id,
      baseCost: condition.base_cost,
      calculatedCost: condition.calculated_cost,
      categoryMultiplier: condition.category_multiplier,
      tierMultiplier: condition.tier_multiplier,
    })),
  };

  const handleBack = () => {
    router.push("/policy/base-policy");
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      draft: {
        color: "orange",
        icon: <ClockCircleOutlined />,
        text: "Chờ duyệt",
      },
      active: {
        color: "green",
        icon: <CheckCircleOutlined />,
        text: "Đang hoạt động",
      },
      pending: {
        color: "orange",
        icon: <ClockCircleOutlined />,
        text: "Chờ duyệt",
      },
      inactive: {
        color: "red",
        icon: <ClockCircleOutlined />,
        text: "Không hoạt động",
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
