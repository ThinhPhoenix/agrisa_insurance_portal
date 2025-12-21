"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import usePolicy from "@/services/hooks/base-policy/use-policy";
import { useFilterableList } from "@/services/hooks/common";
import useDictionary from "@/services/hooks/common/use-dictionary";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  PercentageOutlined,
  SafetyOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Space, Spin, Tag, Typography } from "antd";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import mockData from "./mock..json";
import "./policy.css";

const { Title, Text } = Typography;

export default function PolicyPage() {
  // Use dictionary hook
  const dict = useDictionary();
  const { basePolicy: labels } = dict;

  // Use policy hook
  const {
    policies,
    policiesLoading,
    policiesError,
    policyCounts,
    policyCountsLoading,
    fetchPoliciesByProvider,
    fetchPolicies,
    fetchPolicyCounts,
  } = usePolicy();

  // Fetch data on mount
  useEffect(() => {
    fetchPolicies();
    fetchPolicyCounts();
  }, [fetchPolicies, fetchPolicyCounts]);

  // Transform API data to table format with useMemo
  const allPoliciesRaw = useMemo(() => {
    if (!policies || policies.length === 0) return [];

    return policies.map((item) => ({
      id: item.base_policy.id,
      productName: item.base_policy.product_name,
      productCode: item.base_policy.product_code,
      productDescription: item.base_policy.product_description,
      insuranceProviderId: item.base_policy.insurance_provider_id,
      cropType: item.base_policy.crop_type,
      coverageCurrency: item.base_policy.coverage_currency,
      coverageDurationDays: item.base_policy.coverage_duration_days,
      premiumBaseRate: item.base_policy.premium_base_rate,
      status: item.base_policy.status,
    }));
  }, [policies]);

  // Debug: Log data length
  useEffect(() => {
    console.log("Data loaded:", allPoliciesRaw.length);
  }, [allPoliciesRaw]);

  // Use filterable list hook
  const {
    paginatedData,
    filteredData,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    visibleColumns,
    setColumns: setVisibleColumns,
    getSummaryStats,
  } = useFilterableList(allPoliciesRaw, {
    searchFields: [], // Using individual field filters instead of global search
    defaultFilters: {
      productName: "",
      productCode: "",
      insuranceProviderId: "",
      cropType: "",
      premiumRange: "",
      durationRange: "",
      policyStatus: "all",
    },
    defaultVisibleColumns: [
      "productName",
      "productCode",
      "cropType",
      "premiumBaseRate",
      "coverageDurationDays",
      "status",
    ],
    defaultPageSize: 10,
    filterHandlers: {
      // Text search filters - contains search (case-insensitive)
      productName: (item, value) => {
        console.log("Filter productName:", {
          value,
          itemName: item.productName,
        });
        if (!value || value === "") return true;
        const result = item.productName
          ?.toLowerCase()
          .includes(value.toLowerCase());
        console.log("Result:", result);
        return result;
      },
      productCode: (item, value) => {
        console.log("Filter productCode:", {
          value,
          itemCode: item.productCode,
        });
        if (!value || value === "") return true;
        const result = item.productCode
          ?.toLowerCase()
          .includes(value.toLowerCase());
        console.log("Result:", result);
        return result;
      },
      insuranceProviderId: (item, value) => {
        if (!value || value === "") return true;
        return item.insuranceProviderId === value;
      },
      cropType: (item, value) => {
        if (!value || value === "") return true;
        return item.cropType === value;
      },
      // Range filters - min-max format
      premiumRange: (item, value) => {
        if (!value || value === "") return true;
        const [min, max] = value.split("-").map(Number);
        return item.premiumBaseRate >= min && item.premiumBaseRate < max;
      },
      durationRange: (item, value) => {
        if (!value || value === "") return true;
        const [min, max] = value.split("-").map(Number);
        return (
          item.coverageDurationDays >= min && item.coverageDurationDays < max
        );
      },
      // Status filter - with "all" support
      policyStatus: (item, value) => {
        if (!value || value === "" || value === "all") return true;
        return item.status === value;
      },
    },
  });

  // Calculate summary stats
  // Total = API total + draft list count (to include draft policies)
  // Draft = draft list count
  const draftCount = filteredData.filter(
    (item) => item.status === "draft"
  ).length;

  const summaryStats = {
    totalPolicies: (policyCounts.total || 0) + draftCount,
    draftPolicies: draftCount,
    activePoliciesCount: policyCounts.active || 0,
    archivedPolicies: policyCounts.archived || 0,
    avgPremiumRate:
      allPoliciesRaw.length > 0
        ? (
            (allPoliciesRaw.reduce(
              (sum, p) => sum + (p.premiumBaseRate || 0),
              0
            ) /
              allPoliciesRaw.length) *
            100
          ).toFixed(1)
        : "0.0",
  };

  // Filter options - using dictionary for status labels
  const filterOptions = {
    providers: [
      { label: "PARTNER_001", value: "PARTNER_001" },
      { label: "PARTNER_002", value: "PARTNER_002" },
      { label: "PARTNER_003", value: "PARTNER_003" },
    ],
    cropTypes: mockData.cropTypes.map((type) => ({
      label: type.label,
      value: type.value,
    })),
    premiumRanges: [
      { label: "Dưới 5%", value: "0-0.05" },
      { label: "5% - 7%", value: "0.05-0.07" },
      { label: "Trên 7%", value: "0.07-1" },
    ],
    durationRanges: [
      { label: "Dưới 120 ngày", value: "0-120" },
      { label: "120 - 300 ngày", value: "120-300" },
      { label: "Trên 300 ngày", value: "300-999" },
    ],
    policyStatuses: [
      { label: "Tất cả", value: "all" },
      { label: dict.getEnumLabel('BasePolicyStatus', 'draft'), value: "draft" },
      { label: dict.getEnumLabel('BasePolicyStatus', 'active'), value: "active" },
    ],
  };

  // Filter options

  // Get crop type label
  const getCropTypeLabel = (cropTypeValue) => {
    const cropType = mockData.cropTypes.find(
      (type) => type.value === cropTypeValue
    );
    return cropType ? cropType.label : cropTypeValue;
  };

  // Table columns - using dictionary labels
  const columns = [
    {
      title: labels.productName,
      dataIndex: "productName",
      key: "productName",
      width: 250,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: labels.productCode,
      dataIndex: "productCode",
      key: "productCode",
      width: 200,
      render: (text) => <Text code>{text}</Text>,
    },

    {
      title: labels.cropType,
      dataIndex: "cropType",
      key: "cropType",
      width: 180,
      render: (text) => <Tag color="green">{getCropTypeLabel(text)}</Tag>,
    },
    {
      title: labels.premiumBaseRate,
      dataIndex: "premiumBaseRate",
      key: "premiumBaseRate",
      width: 200,
      render: (rate) => <Text>{(rate * 100).toFixed(2)}%</Text>,
    },
    {
      title: labels.coverageDurationDays,
      dataIndex: "coverageDurationDays",
      key: "coverageDurationDays",
      width: 200,
      render: (days) => <Text>{days} ngày</Text>,
    },
    {
      title: labels.status,
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const statusConfig = {
          draft: {
            color: "processing",
            text: dict.getEnumLabel('BasePolicyStatus', 'draft'),
          },
          active: {
            color: "success",
            text: dict.getEnumLabel('BasePolicyStatus', 'active'),
          },
          closed: {
            color: "error",
            text: dict.getEnumLabel('BasePolicyStatus', 'closed'),
          },
          archived: {
            color: "default",
            text: dict.getEnumLabel('BasePolicyStatus', 'archived'),
          },
        };
        const config = statusConfig[status] || statusConfig.draft;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <div className="policy-actions-cell">
          <Link href={`/base-policy/${record.id}`}>
            <Button
              type="dashed"
              size="small"
              className="policy-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Search fields - using dictionary labels
  const searchFields = [
    // First row - Main search fields (4 fields)
    {
      name: "productName",
      label: labels.productName,
      type: "input",
      placeholder: "Tìm kiếm theo tên sản phẩm...",
    },
    {
      name: "productCode",
      label: labels.productCode,
      type: "input",
      placeholder: "Tìm kiếm theo mã sản phẩm...",
    },
    {
      name: "cropType",
      label: labels.cropType,
      type: "combobox",
      placeholder: "Chọn loại cây trồng",
      options: filterOptions.cropTypes,
    },
    {
      name: "policyStatus",
      label: labels.status,
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: filterOptions.policyStatuses,
    },

    {
      name: "premiumRange",
      label: labels.premiumBaseRate,
      type: "combobox",
      placeholder: "Chọn khoảng tỷ lệ phí",
      options: filterOptions.premiumRanges,
    },
    {
      name: "durationRange",
      label: labels.coverageDurationDays,
      type: "combobox",
      placeholder: "Chọn khoảng thời hạn",
      options: filterOptions.durationRanges,
    },
    {
      name: "searchButton",
      label: " ",
      type: "button",
      variant: "primary",
      buttonText: dict.ui.search,
      startContent: <SearchOutlined size={14} />,
      isSubmit: true,
    },
    {
      name: "clearButton",
      label: " ",
      type: "button",
      variant: "dashed",
      buttonText: dict.ui.clearFilters,
      startContent: <FilterOutlined size={14} />,
      onClick: handleClearFilters,
    },
  ];

  return (
    <Layout.Content className="policy-content">
      <Spin
        spinning={policiesLoading || policyCountsLoading}
        tip={dict.ui.loadingData}
      >
        <div className="policy-space">
          {/* Header */}
          <div className="policy-header">
            <div>
              <Title level={2} className="policy-title">
                <SafetyOutlined className="policy-icon" />
                {dict.ui.manageBasePolicies}
              </Title>
              <Text type="secondary" className="policy-subtitle">
                {dict.ui.managePoliciesDescription}
              </Text>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="policy-summary-row">
            <div className="policy-summary-card-compact">
              <div className="policy-summary-icon total">
                <FileTextOutlined />
              </div>
              <div className="policy-summary-content">
                <div className="policy-summary-value-compact">
                  {summaryStats.totalPolicies}
                </div>
                <div className="policy-summary-label-compact">
                  {dict.ui.totalPolicies}
                </div>
              </div>
            </div>

            <div className="policy-summary-card-compact">
              <div className="policy-summary-icon active">
                <CheckCircleOutlined />
              </div>
              <div className="policy-summary-content">
                <div className="policy-summary-value-compact">
                  {summaryStats.activePoliciesCount}
                </div>
                <div className="policy-summary-label-compact">
                  {dict.ui.activePoliciesCount}
                </div>
              </div>
            </div>

            <div className="policy-summary-card-compact">
              <div
                className="policy-summary-icon"
                style={{ backgroundColor: "#fff7e6", color: "#fa8c16" }}
              >
                <ClockCircleOutlined />
              </div>
              <div className="policy-summary-content">
                <div className="policy-summary-value-compact">
                  {summaryStats.draftPolicies}
                </div>
                <div className="policy-summary-label-compact">
                  {dict.ui.draftPolicies}
                </div>
              </div>
            </div>

            <div className="policy-summary-card-compact">
              <div className="policy-summary-icon premium">
                <PercentageOutlined />
              </div>
              <div className="policy-summary-content">
                <div className="policy-summary-value-compact">
                  {summaryStats.avgPremiumRate}%
                </div>
                <div className="policy-summary-label-compact">
                  {dict.ui.avgPremiumRate}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="policy-filters">
            <Collapse
              items={[
                {
                  key: "1",
                  label: (
                    <Space>
                      <FilterOutlined />
                      {dict.ui.filterSearchLabel}
                    </Space>
                  ),
                  children: (
                    <div className="policy-filter-form">
                      <CustomForm
                        fields={searchFields}
                        gridColumns="1fr 1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmit}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Table */}
          <div>
            <div className="flex justify-start items-center gap-2 mb-2">
              <Link href="/base-policy/create">
                <Button type="primary" icon={<SafetyOutlined />}>
                  {dict.ui.create}
                </Button>
              </Link>
              {/* <Button icon={<DownloadOutlined />}>Nhập excel</Button>
              <Button icon={<DownloadOutlined />}>Xuất excel</Button> */}
              <SelectedColumn
                columns={columns}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
              />
            </div>

            <CustomTable
              columns={columns}
              dataSource={paginatedData}
              visibleColumns={visibleColumns}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{
                ...paginationConfig,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} hợp đồng mẫu`,
              }}
            />
          </div>
        </div>
      </Spin>
    </Layout.Content>
  );
}
