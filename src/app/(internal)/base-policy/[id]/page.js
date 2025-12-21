"use client";

import {
  BasicInfoDetail,
  ConfigurationDetail,
  TagsDetail,
} from "@/components/layout/base-policy/detail";
import { POLICY_MESSAGES } from "@/libs/message/policy-message";
import useCancelPolicy from "@/services/hooks/base-policy/use-cancel-policy";
import useDetailPolicy from "@/services/hooks/base-policy/use-detail-policy";
import usePolicy from "@/services/hooks/base-policy/use-policy";
import useDataSource from "@/services/hooks/common/use-data-source";
import useDictionary from "@/services/hooks/common/use-dictionary";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  message,
  Modal,
  Radio,
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
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [cancelOption, setCancelOption] = React.useState("keep"); // "keep" or "compensate"
  const hasFetchedRef = React.useRef(false); // Track if we've already fetched

  // Use dictionary hook for labels
  const dict = useDictionary();
  const { basePolicy: labels } = dict;

  // Use policy list hook for checking policy status
  const { policies } = usePolicy();

  // Use detail policy hook for fetching policy details
  const {
    policyDetail: apiPolicyDetail,
    policyDetailLoading,
    policyDetailError,
    fetchDraftPolicyDetail,
    fetchPolicyDetail,
    fetchActivePolicyDetail,
  } = useDetailPolicy();

  // Use cancel policy hook
  const { cancelBasePolicyAPI, cancelLoading, cancelError } = useCancelPolicy();

  // Use data source hook for fetching data source details
  const { fetchDataSourcesByIds } = useDataSource();

  // Fetch policy detail and validate on mount
  useEffect(() => {
    // Prevent duplicate fetches
    if (hasFetchedRef.current) return;
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

        // Mark as fetched before making API call
        hasFetchedRef.current = true;

        // Try to fetch based on status
        if (policyStatus === "draft") {
          // Draft policies use draft/filter API with base_policy_id
          policyData = await fetchDraftPolicyDetail(params.id, false);
        } else if (
          policyStatus === "active" ||
          policyStatus === "closed" ||
          policyStatus === "archived"
        ) {
          // Non-draft policies use detail API
          policyData = await fetchActivePolicyDetail(params.id);
        } else {
          // If policy not found in list or unknown status, try active API first, then draft
          policyData = await fetchActivePolicyDetail(params.id);
          if (!policyData) {
            policyData = await fetchDraftPolicyDetail(params.id, false);
          }
        }

        if (!policyData) {
          hasFetchedRef.current = false; // Reset on error
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
        hasFetchedRef.current = false; // Reset on error
        message.error("Có lỗi xảy ra khi tải thông tin chính sách");
        router.push("/base-policy");
      }
    };

    loadPolicyDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]); // Only depend on params.id to prevent re-fetching

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

  // Format UTC date string (for created_at and updated_at)
  const formatUtcDateString = (utcDateString) => {
    if (!utcDateString || utcDateString === "0001-01-01T00:00:00Z")
      return "N/A";

    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("vi-VN", { timeZone: "UTC" });
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
    createdAt: formatUtcDateString(basePolicy.created_at),
    updatedAt: formatUtcDateString(basePolicy.updated_at),
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
      blackoutPeriods: trigger?.blackout_periods || null,
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

  const handleCancelPolicy = async () => {
    if (!apiPolicyDetail?.base_policy?.id) {
      message.error(POLICY_MESSAGES.BASE_POLICY.ERROR.CANCEL_INVALID_ID);
      return;
    }

    const keepRegistered = cancelOption === "keep";
    const cancelMessage = keepRegistered
      ? POLICY_MESSAGES.BASE_POLICY.WARNING.CANCEL_KEEP_POLICIES_CONFIRM
      : POLICY_MESSAGES.BASE_POLICY.WARNING.CANCEL_WITH_COMPENSATION_CONFIRM;

    Modal.confirm({
      title: "Xác nhận huỷ hợp đồng mẫu",
      content: cancelMessage,
      okText: "Tiếp tục",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          message.loading({
            content: POLICY_MESSAGES.BASE_POLICY.INFO.CANCELLING,
            key: "cancel-loading",
          });

          await cancelBasePolicyAPI(
            apiPolicyDetail.base_policy.id,
            keepRegistered
          );

          message.success({
            content: keepRegistered
              ? POLICY_MESSAGES.BASE_POLICY.SUCCESS.CANCELLED_KEEP_POLICIES
              : POLICY_MESSAGES.BASE_POLICY.SUCCESS.CANCELLED_WITH_COMPENSATION,
            key: "cancel-loading",
          });

          // Redirect to base-policy list after successful cancellation
          setTimeout(() => {
            router.push("/base-policy");
          }, 1000);
        } catch (error) {
          message.error({
            content:
              cancelError || POLICY_MESSAGES.BASE_POLICY.ERROR.CANCEL_FAILED,
            key: "cancel-loading",
          });
        }
      },
    });

    setCancelModalVisible(false);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      draft: {
        background: "rgba(252, 242, 205, 0.6)",
        color: "var(--color-secondary-800)",
        border: "1px solid rgba(252, 242, 205, 0.8)",
        icon: <ClockCircleOutlined />,
        text: dict.getEnumLabel("BasePolicyStatus", "draft"),
      },
      active: {
        background: "rgba(165, 215, 190, 0.6)",
        color: "var(--color-primary-800)",
        border: "1px solid rgba(165, 215, 190, 0.8)",
        icon: <CheckCircleOutlined />,
        text: dict.getEnumLabel("BasePolicyStatus", "active"),
      },
      closed: {
        background: "rgba(255, 240, 240, 0.6)",
        color: "#d32f2f",
        border: "1px solid rgba(255, 200, 200, 0.8)",
        icon: <ClockCircleOutlined />,
        text: dict.getEnumLabel("BasePolicyStatus", "closed"),
      },
      archived: {
        background: "rgba(245, 245, 245, 0.6)",
        color: "#666",
        border: "1px solid rgba(220, 220, 220, 0.8)",
        icon: <FileTextOutlined />,
        text: dict.getEnumLabel("BasePolicyStatus", "archived"),
      },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Tag
        icon={config.icon}
        style={{
          background: config.background,
          color: config.color,
          border: config.border,
          backdropFilter: "blur(10px)",
          padding: "4px 12px",
          fontSize: "13px",
          fontWeight: "500",
        }}
      >
        {config.text}
      </Tag>
    );
  };

  const tabItems = [
    {
      key: "basic",
      label: (
        <Space>
          <InfoCircleOutlined />
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
          <SettingOutlined />
          <span>Cấu hình Nâng cao</span>
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
          <TagOutlined />
          <span>Hợp đồng và thẻ tài liệu</span>
        </Space>
      ),
      children: <TagsDetail policyData={policyDetail} mockData={mockData} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}

      <Row align="middle" justify="space-between">
        <Col>
          <Space direction="vertical" size={8}>
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
        {/* Cancel Button - Only show for active policies */}
        {policyDetail.status === "active" && (
          <Col>
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={() => setCancelModalVisible(true)}
              loading={cancelLoading}
            >
              Huỷ hợp đồng mẫu
            </Button>
          </Col>
        )}
      </Row>

      <Divider />

      {/* Main Content - Full Width Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {/* Cancel Policy Modal */}
      <Modal
        title="Huỷ hợp đồng mẫu"
        open={cancelModalVisible}
        onOk={handleCancelPolicy}
        onCancel={() => setCancelModalVisible(false)}
        okText="Tiếp tục"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: cancelLoading }}
        width={600}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Text strong>Vui lòng chọn tùy chọn huỷ hợp đồng:</Text>
            <Radio.Group
              value={cancelOption}
              onChange={(e) => setCancelOption(e.target.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "16px",
                gap: "12px",
              }}
            >
              <Radio value="keep">
                <div>
                  <Text strong>Giữ nguyên các hợp đồng đã ký</Text>
                  <br />
                  <Text type="secondary">
                    Huỷ chính sách nhưng các hợp đồng đã ký cho nông dân sẽ vẫn
                    hoạt động bình thường. Không có bồi thường.
                  </Text>
                </div>
              </Radio>
              <Radio value="compensate">
                <div>
                  <Text strong>Huỷ các hợp đồng đã ký (có bồi thường)</Text>
                  <br />
                  <Text type="secondary">
                    Huỷ chính sách và huỷ tất cả các hợp đồng đã ký. Nông dân sẽ
                    được bồi thường và nhận được thông báo từ hệ thống.
                  </Text>
                </div>
              </Radio>
            </Radio.Group>
          </div>
          <Card style={{ backgroundColor: "#fafafa" }}>
            <Space direction="vertical" size="small">
              <Text strong>Chính sách sẽ huỷ:</Text>
              <Text code>{policyDetail.productName}</Text>
              <Text type="secondary">{policyDetail.productCode}</Text>
            </Space>
          </Card>
        </Space>
      </Modal>
    </div>
  );
};

export default PolicyDetailPage;
