"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { useBeneficiary } from "@/services/hooks/beneficiary/use-beneficiary";
import {
  CheckCircleOutlined,
  CreditCardOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  SafetyOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Collapse, Layout, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import "./beneficiary.css";

const { Title, Text } = Typography;

export default function BeneficiaryPage() {
  const {
    filteredData,
    filterOptions,
    summaryStats,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
  } = useBeneficiary();

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState([
    "beneficiary_id",
    "personal_info",
    "address",
    "farm_info",
    "coverage_amount",
    "premium",
    "status",
    "payment_status",
    "action",
  ]);

  // Search fields for custom form - organized in 2 rows
  const searchFields = [
    // First row - Main filters
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm kiếm theo mã, tên, CCCD, SĐT, loại cây trồng...",
      value: searchText,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: filterOptions.statuses.map((status) => ({
        label: status,
        value: status,
      })),
      value: filters.status,
    },
    {
      name: "paymentStatus",
      label: "Thanh toán",
      type: "combobox",
      placeholder: "Chọn trạng thái thanh toán",
      options: filterOptions.paymentStatuses.map((status) => ({
        label: status,
        value: status,
      })),
      value: filters.paymentStatus,
    },
    {
      name: "cropType",
      label: "Loại cây trồng",
      type: "combobox",
      placeholder: "Chọn loại cây trồng",
      options: filterOptions.cropTypes.map((type) => ({
        label: type,
        value: type,
      })),
      value: filters.cropType,
    },
    // Second row - Additional filters and actions
    {
      name: "province",
      label: "Tỉnh/Thành phố",
      type: "combobox",
      placeholder: "Chọn tỉnh/thành phố",
      options: filterOptions.provinces.map((province) => ({
        label: province,
        value: province,
      })),
      value: filters.province,
    },
    {
      name: "minCoverage",
      label: "Bảo hiểm tối thiểu",
      type: "number",
      placeholder: "Nhập số tiền tối thiểu",
      min: 0,
      max: 500000000,
      step: 10000000,
      value: filters.coverageAmountRange[0],
      formatter: (value) =>
        value ? `${(value / 1000000).toFixed(0)}M VND` : "",
    },
    {
      name: "maxCoverage",
      label: "Bảo hiểm tối đa",
      type: "number",
      placeholder: "Nhập số tiền tối đa",
      min: 0,
      max: 500000000,
      step: 10000000,
      value: filters.coverageAmountRange[1],
      formatter: (value) =>
        value ? `${(value / 1000000).toFixed(0)}M VND` : "",
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã kích hoạt":
        return "green";
      case "Chờ kích hoạt":
        return "orange";
      case "Tạm dừng":
        return "red";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status) => {
    if (status === "Đã thanh toán") return "green";
    if (status.includes("Trả góp")) return "blue";
    return "orange";
  };

  const columns = [
    {
      title: "Mã người thụ hưởng",
      dataIndex: "beneficiary_id",
      key: "beneficiary_id",
      width: 150,
      ellipsis: true,
      sorter: (a, b) => a.beneficiary_id.localeCompare(b.beneficiary_id),
      render: (text) => (
        <span title={text} className="beneficiary-id inline-block max-w-full">
          {text}
        </span>
      ),
    },
    {
      title: "Thông tin cá nhân",
      dataIndex: "personal_info",
      key: "personal_info",
      width: 250,
      render: (_, record) => (
        <div className="beneficiary-info">
          <Avatar
            src={record.avatar}
            size={32}
            icon={<UserOutlined />}
            className="beneficiary-avatar"
          />
          <div>
            <div className="beneficiary-name">{record.full_name}</div>
            <div className="beneficiary-contact">
              {record.phone} • {record.citizen_id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <div
          className="beneficiary-address"
          title={`${record.address.street}, ${record.address.ward}, ${record.address.district}, ${record.address.province}`}
        >
          <div>
            {record.address.ward}, {record.address.district}
          </div>
          <div>{record.address.province}</div>
        </div>
      ),
    },
    {
      title: "Thông tin trang trại",
      dataIndex: "farm_info",
      key: "farm_info",
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <div
          className="beneficiary-farm-info"
          title={`${record.farm_info.crop_type} - ${record.farm_info.farm_area} - ${record.farm_info.farming_experience}`}
        >
          <div>
            <strong>{record.farm_info.crop_type}</strong>
          </div>
          <div>
            {record.farm_info.farm_area} • {record.farm_info.farming_experience}
          </div>
        </div>
      ),
    },
    {
      title: "Số tiền bảo hiểm",
      dataIndex: ["insurance_package", "coverage_amount_formatted"],
      key: "coverage_amount",
      width: 150,
      sorter: (a, b) =>
        a.insurance_package.coverage_amount -
        b.insurance_package.coverage_amount,
      render: (amount) => (
        <span className="beneficiary-amount" style={{ color: "#1890ff" }}>
          {amount}
        </span>
      ),
    },
    {
      title: "Phí bảo hiểm",
      dataIndex: ["insurance_package", "premium_formatted"],
      key: "premium",
      width: 130,
      sorter: (a, b) =>
        a.insurance_package.premium - b.insurance_package.premium,
      render: (premium) => (
        <span className="beneficiary-amount" style={{ color: "#722ed1" }}>
          {premium}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: filterOptions.statuses.map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          className="beneficiary-status-tag"
          icon={<CheckCircleOutlined />}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      width: 140,
      ellipsis: true,
      filters: filterOptions.paymentStatuses.map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value, record) => record.payment_status === value,
      render: (status) => (
        <Tag
          color={getPaymentStatusColor(status)}
          className="beneficiary-status-tag"
          icon={<CreditCardOutlined />}
          title={status}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      fixed: "right",
      key: "action",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Link href={`/beneficiary/${record.beneficiary_id}`}>
            <Button
              type="dashed"
              size="small"
              className="!bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
            </Button>
          </Link>
          <Button
            type="dashed"
            size="small"
            className="!bg-green-100 !border-green-200 !text-green-800 hover:!bg-green-200"
          >
            <DownloadOutlined size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout.Content className="beneficiary-content">
      <Space direction="vertical" size="large" className="beneficiary-space">
        {/* Header */}
        <Space direction="vertical" className="beneficiary-space">
          <div className="beneficiary-header">
            <div>
              <Title level={3} className="beneficiary-title">
                Quản lý người thụ hưởng
              </Title>
              <Typography.Text type="secondary">
                Tổng số: <Text strong>{summaryStats.total}</Text> người thụ
                hưởng
              </Typography.Text>
            </div>
          </div>
        </Space>

        {/* Summary Cards */}
        <div className="beneficiary-summary-row">
          <div className="beneficiary-summary-card-compact">
            <div className="beneficiary-summary-icon total">
              <UserOutlined style={{ fontSize: "16px" }} />
            </div>
            <div className="beneficiary-summary-content">
              <div className="beneficiary-summary-value-compact">
                {summaryStats.total}
              </div>
              <div className="beneficiary-summary-label-compact">
                Tổng số người thụ hưởng
              </div>
            </div>
          </div>
          <div className="beneficiary-summary-card-compact">
            <div className="beneficiary-summary-icon active">
              <CheckCircleOutlined style={{ fontSize: "16px" }} />
            </div>
            <div className="beneficiary-summary-content">
              <div className="beneficiary-summary-value-compact">
                {summaryStats.active}
              </div>
              <div className="beneficiary-summary-label-compact">
                Đã kích hoạt
              </div>
            </div>
          </div>
          <div className="beneficiary-summary-card-compact">
            <div className="beneficiary-summary-icon coverage">
              <SafetyOutlined style={{ fontSize: "16px" }} />
            </div>
            <div className="beneficiary-summary-content">
              <div className="beneficiary-summary-value-compact">
                {summaryStats.totalCoverageFormatted}
              </div>
              <div className="beneficiary-summary-label-compact">
                Tổng số tiền bảo hiểm
              </div>
            </div>
          </div>
          <div className="beneficiary-summary-card-compact">
            <div className="beneficiary-summary-icon premium">
              <CreditCardOutlined style={{ fontSize: "16px" }} />
            </div>
            <div className="beneficiary-summary-content">
              <div className="beneficiary-summary-value-compact">
                {summaryStats.totalPremiumFormatted}
              </div>
              <div className="beneficiary-summary-label-compact">
                Tổng phí bảo hiểm
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Collapse
            size="small"
            items={[
              {
                key: "1",
                label: (
                  <p className="flex items-center gap-2">
                    <SearchOutlined size={16} />
                    Bộ lọc & Tìm kiếm
                  </p>
                ),
                children: (
                  <div className="space-y-4">
                    {/* First row - Main filters */}
                    <CustomForm
                      fields={searchFields.slice(0, 4)}
                      gridColumns="2fr 1fr 1fr 1fr"
                      gap="10px"
                      onSubmit={handleFormSubmit}
                    />
                    {/* Second row - Additional filters and actions */}
                    <CustomForm
                      fields={searchFields.slice(4)}
                      gridColumns="1fr 1fr 1fr 1fr 1fr"
                      gap="10px"
                      onSubmit={handleFormSubmit}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="flex justify-end items-center gap-2 mb-2">
            <SelectedColumn
              columns={columns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>
          <CustomTable
            dataSource={filteredData}
            columns={columns}
            visibleColumns={visibleColumns}
            rowKey="beneficiary_id"
            scroll={{ x: true }}
          />
        </div>
      </Space>
    </Layout.Content>
  );
}
