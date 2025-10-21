"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  PercentageOutlined,
  SafetyOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import mockData from "./mock..json";
import "./policy.css";

const { Title, Text } = Typography;

export default function PolicyPage() {
  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "productName",
    "productCode",
    "insuranceProviderId",
    "cropType",
    "premiumBaseRate",
    "coverageDurationDays",
  ]);

  // Filter state
  const [filters, setFilters] = useState({
    productName: "",
    productCode: "",
    insuranceProviderId: "",
    cropType: "",
    premiumRange: "",
    durationRange: "",
  });

  // Filtered data
  const [filteredData, setFilteredData] = useState(mockData.policies);

  // Calculate summary stats
  const summaryStats = {
    totalPolicies: mockData.policies.length,
    activePolicies: mockData.policies.length, // Assuming all are active
    uniqueProviders: new Set(
      mockData.policies.map((p) => p.insuranceProviderId)
    ).size,
    avgPremiumRate: (
      (mockData.policies.reduce((sum, p) => sum + p.premiumBaseRate, 0) /
        mockData.policies.length) *
      100
    ).toFixed(1),
  };

  // Filter options
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
  };

  // Handle form submit
  const handleFormSubmit = (formData) => {
    setFilters(formData);
    applyFilters(formData);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters = {
      productName: "",
      productCode: "",
      insuranceProviderId: "",
      cropType: "",
      premiumRange: "",
      durationRange: "",
    };
    setFilters(clearedFilters);
    setFilteredData(mockData.policies);
  };

  // Apply filters
  const applyFilters = (filterValues) => {
    let filtered = [...mockData.policies];

    if (filterValues.productName) {
      filtered = filtered.filter((policy) =>
        policy.productName
          .toLowerCase()
          .includes(filterValues.productName.toLowerCase())
      );
    }

    if (filterValues.productCode) {
      filtered = filtered.filter((policy) =>
        policy.productCode
          .toLowerCase()
          .includes(filterValues.productCode.toLowerCase())
      );
    }

    if (filterValues.insuranceProviderId) {
      filtered = filtered.filter(
        (policy) =>
          policy.insuranceProviderId === filterValues.insuranceProviderId
      );
    }

    if (filterValues.cropType) {
      filtered = filtered.filter(
        (policy) => policy.cropType === filterValues.cropType
      );
    }

    if (filterValues.premiumRange) {
      const [min, max] = filterValues.premiumRange.split("-").map(Number);
      filtered = filtered.filter(
        (policy) =>
          policy.premiumBaseRate >= min && policy.premiumBaseRate < max
      );
    }

    if (filterValues.durationRange) {
      const [min, max] = filterValues.durationRange.split("-").map(Number);
      filtered = filtered.filter(
        (policy) =>
          policy.coverageDurationDays >= min &&
          policy.coverageDurationDays < max
      );
    }

    setFilteredData(filtered);
  };

  // Get crop type label
  const getCropTypeLabel = (cropTypeValue) => {
    const cropType = mockData.cropTypes.find(
      (type) => type.value === cropTypeValue
    );
    return cropType ? cropType.label : cropTypeValue;
  };

  // Table columns
  const columns = [
    {
      title: "Tên Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 250,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Mã Sản phẩm",
      dataIndex: "productCode",
      key: "productCode",
      width: 200,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "Đối tác Bảo hiểm",
      dataIndex: "insuranceProviderId",
      key: "insuranceProviderId",
      width: 180,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Loại Cây trồng",
      dataIndex: "cropType",
      key: "cropType",
      width: 180,
      render: (text) => <Tag color="green">{getCropTypeLabel(text)}</Tag>,
    },
    {
      title: "Tỷ lệ Phí BH Cơ sở (%)",
      dataIndex: "premiumBaseRate",
      key: "premiumBaseRate",
      width: 200,
      render: (rate) => <Text>{(rate * 100).toFixed(2)}%</Text>,
    },
    {
      title: "Thời hạn Bảo hiểm (Ngày)",
      dataIndex: "coverageDurationDays",
      key: "coverageDurationDays",
      width: 200,
      render: (days) => <Text>{days} ngày</Text>,
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <div className="policy-actions-cell">
          <Link href={`/policy/${record.id}`}>
            <Button
              type="dashed"
              size="small"
              className="policy-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
            </Button>
          </Link>
          <Button
            type="dashed"
            size="small"
            className="policy-action-btn !bg-green-100 !border-green-200 !text-green-800 hover:!bg-green-200"
          >
            <EditOutlined size={14} />
          </Button>
          <Button
            type="dashed"
            size="small"
            className="policy-action-btn !bg-purple-100 !border-purple-200 !text-purple-800 hover:!bg-purple-200"
          >
            <DownloadOutlined size={14} />
          </Button>
        </div>
      ),
    },
  ];

  // Search fields - organized in 2 rows with 4 fields each
  const searchFields = [
    // First row - Main search fields (4 fields)
    {
      name: "productName",
      label: "Tên sản phẩm",
      type: "input",
      placeholder: "Tìm kiếm theo tên sản phẩm...",
      value: filters.productName,
    },
    {
      name: "productCode",
      label: "Mã sản phẩm",
      type: "input",
      placeholder: "Tìm kiếm theo mã sản phẩm...",
      value: filters.productCode,
    },
    {
      name: "cropType",
      label: "Loại cây trồng",
      type: "combobox",
      placeholder: "Chọn loại cây trồng",
      options: filterOptions.cropTypes,
      value: filters.cropType,
    },
    {
      name: "insuranceProviderId",
      label: "Đối tác bảo hiểm",
      type: "combobox",
      placeholder: "Chọn đối tác bảo hiểm",
      options: filterOptions.providers,
      value: filters.insuranceProviderId,
    },
    // Second row - Range filters and actions (4 fields)
    {
      name: "premiumRange",
      label: "Tỷ lệ phí BH",
      type: "combobox",
      placeholder: "Chọn khoảng tỷ lệ phí",
      options: filterOptions.premiumRanges,
      value: filters.premiumRange,
    },
    {
      name: "durationRange",
      label: "Thời hạn bảo hiểm",
      type: "combobox",
      placeholder: "Chọn khoảng thời hạn",
      options: filterOptions.durationRanges,
      value: filters.durationRange,
    },
    {
      name: "searchButton",
      label: " ",
      type: "button",
      variant: "primary",
      buttonText: "Tìm kiếm",
      startContent: <SearchOutlined size={14} />,
      isSubmit: true,
    },
    {
      name: "clearButton",
      label: " ",
      type: "button",
      variant: "dashed",
      buttonText: "Xóa bộ lọc",
      startContent: <FilterOutlined size={14} />,
      onClick: handleClearFilters,
    },
  ];

  return (
    <Layout.Content className="policy-content">
      <div className="policy-space">
        {/* Header */}
        <div className="policy-header">
          <div>
            <Title level={2} className="policy-title">
              <SafetyOutlined className="policy-icon" />
              Quản lý Chính sách Bảo hiểm
            </Title>
            <Text type="secondary" className="policy-subtitle">
              Quản lý các chính sách bảo hiểm nông nghiệp
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
                Tổng số chính sách
              </div>
            </div>
          </div>

          <div className="policy-summary-card-compact">
            <div className="policy-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="policy-summary-content">
              <div className="policy-summary-value-compact">
                {summaryStats.activePolicies}
              </div>
              <div className="policy-summary-label-compact">Đang hoạt động</div>
            </div>
          </div>

          <div className="policy-summary-card-compact">
            <div className="policy-summary-icon providers">
              <TeamOutlined />
            </div>
            <div className="policy-summary-content">
              <div className="policy-summary-value-compact">
                {summaryStats.uniqueProviders}
              </div>
              <div className="policy-summary-label-compact">
                Đối tác bảo hiểm
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
              <div className="policy-summary-label-compact">Phí BH TB</div>
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
                    Bộ lọc tìm kiếm
                  </Space>
                ),
                children: (
                  <div className="policy-filter-form">
                    <div className="space-y-4">
                      {/* First row - Main search fields */}
                      <CustomForm
                        fields={searchFields.slice(0, 4)}
                        gridColumns="1fr 1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmit}
                      />
                      {/* Second row - Range filters and actions */}
                      <CustomForm
                        fields={searchFields.slice(4)}
                        gridColumns="1fr 1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmit}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Table */}
        <div>
          <div className="flex justify-start items-center gap-2 mb-2">
            <Link href="/policy/create">
              <Button type="primary" icon={<SafetyOutlined />}>
                Tạo mới
              </Button>
            </Link>
            <Button icon={<DownloadOutlined />}>Nhập excel</Button>
            <Button icon={<DownloadOutlined />}>Xuất excel</Button>
            <SelectedColumn
              columns={columns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>

          <CustomTable
            columns={columns}
            dataSource={filteredData}
            visibleColumns={visibleColumns}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} chính sách`,
            }}
          />
        </div>
      </div>
    </Layout.Content>
  );
}
