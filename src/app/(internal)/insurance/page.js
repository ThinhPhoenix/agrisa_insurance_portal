"use client";

import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import SelectedColumn from "@/components/selected-column";
import { usePremium } from "@/services/hooks/premium/use-premium";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  InsuranceOutlined,
  SafetyOutlined,
  SearchOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Image, Layout, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import "./insurance.css";

const { Title, Text } = Typography;

export default function InsurancePage() {
  const {
    filteredData,
    filterOptions,
    summaryStats,
    filters,
    updateFilters,
    clearFilters,
    loading,
  } = usePremium();

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "package_info",
    "category",
    "status",
    "coverage",
    "validity",
    "statistics",
  ]);

  // Loading state check
  if (loading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="insurance-loading">Đang tải dữ liệu...</div>
      </Layout.Content>
    );
  }

  // Handle form submit
  const handleFormSubmit = (formData) => {
    updateFilters(formData);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    clearFilters();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Đang phát hành":
        return "green";
      case "Tạm dừng":
        return "orange";
      case "Ngừng phát hành":
        return "red";
      default:
        return "default";
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      "Cây lương thực": "blue",
      "Cây rau màu": "green",
      "Cây ăn trái": "orange",
      "Cây hoa màu": "purple",
      "Nuôi trồng thủy sản": "cyan",
    };
    return colors[category] || "default";
  };

  // Table columns
  const columns = [
    {
      title: "Thông tin gói bảo hiểm",
      dataIndex: "package_info",
      key: "package_info",
      width: 300,
      render: (_, record) => (
        <div className="insurance-package-info">
          <Image
            src={record.images?.[0]}
            alt={record.package_name}
            width={48}
            height={48}
            className="insurance-package-image"
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
          <div className="insurance-package-details">
            <div className="insurance-package-name">{record.package_name}</div>
            <div className="insurance-package-id">{record.package_id}</div>
            <div className="insurance-package-description">
              {record.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (_, record) => (
        <Tag
          color={getCategoryColor(record.category)}
          className="insurance-category-tag"
        >
          {record.category}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (_, record) => (
        <Tag
          color={getStatusColor(record.status)}
          className="insurance-status-tag"
        >
          {record.status}
        </Tag>
      ),
    },
    {
      title: "Mức bảo hiểm",
      dataIndex: "coverage",
      key: "coverage",
      width: 180,
      render: (_, record) => (
        <div className="insurance-coverage-info">
          <div className="insurance-coverage-range">
            {record.coverage_details.min_coverage_formatted} -{" "}
            {record.coverage_details.max_coverage_formatted}
          </div>
          <div className="insurance-coverage-rate">
            Phí: {record.coverage_details.premium_rate}
          </div>
        </div>
      ),
    },
    {
      title: "Thời gian hiệu lực",
      dataIndex: "validity",
      key: "validity",
      width: 160,
      render: (_, record) => (
        <div className="insurance-date-info">
          <div className="insurance-date-range">
            {record.effective_date} - {record.expiry_date}
          </div>
          <div className="insurance-coverage-rate">
            Thời hạn: {record.coverage_details.coverage_period}
          </div>
        </div>
      ),
    },
    {
      title: "Thống kê",
      dataIndex: "statistics",
      key: "statistics",
      width: 120,
      render: (_, record) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">
            <span className="insurance-stat-label">Hợp đồng:</span>
            <span className="insurance-stat-value">
              {record.statistics.total_policies}
            </span>
          </div>
          <div className="insurance-stat-item">
            <span className="insurance-stat-label">Đang hoạt động:</span>
            <span className="insurance-stat-value">
              {record.statistics.active_policies}
            </span>
          </div>
          <div className="insurance-stat-item">
            <span className="insurance-stat-label">Hài lòng:</span>
            <span className="insurance-stat-value">
              {record.statistics.satisfaction_rate}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <div className="insurance-actions-cell">
          <Link href={`/insurance/${record.package_id}`}>
            <Button
              type="dashed"
              size="small"
              className="insurance-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
            </Button>
          </Link>
          <Button
            type="dashed"
            size="small"
            className="insurance-action-btn !bg-green-100 !border-green-200 !text-green-800 hover:!bg-green-200"
          >
            <EditOutlined size={14} />
          </Button>
          <Button
            type="dashed"
            size="small"
            className="insurance-action-btn !bg-purple-100 !border-purple-200 !text-purple-800 hover:!bg-purple-200"
          >
            <DownloadOutlined size={14} />
          </Button>
        </div>
      ),
    },
  ];

  // Search fields - organized in 2 rows
  const searchFields = [
    // First row - Main filters (3 fields)
    {
      name: "package_name",
      label: "Tên gói bảo hiểm",
      type: "input",
      placeholder: "Tìm kiếm theo tên gói...",
      value: filters.package_name,
    },
    {
      name: "category",
      label: "Danh mục",
      type: "combobox",
      placeholder: "Chọn danh mục",
      options: filterOptions.categories,
      value: filters.category,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: filterOptions.statuses,
      value: filters.status,
    },
    // Second row - Additional filters and actions (4 fields)
    {
      name: "effective_date",
      label: "Năm hiệu lực",
      type: "combobox",
      placeholder: "Chọn năm",
      options: [
        { label: "2024", value: "2024" },
        { label: "2025", value: "2025" },
        { label: "2026", value: "2026" },
      ],
      value: filters.effective_date,
    },
    {
      name: "coverage_range",
      label: "Mức bảo hiểm",
      type: "combobox",
      placeholder: "Chọn mức bảo hiểm",
      options: filterOptions.coverageRanges,
      value: filters.coverage_range,
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
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="insurance-header">
          <div>
            <Title level={2} className="insurance-title">
              Quản lý Sản phẩm Bảo hiểm
            </Title>
            <Text className="insurance-subtitle">
              Quản lý các gói bảo hiểm nông nghiệp và thống kê hiệu quả
            </Text>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="insurance-summary-row">
          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon total">
              <InsuranceOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.totalPackages}
              </div>
              <div className="insurance-summary-label-compact">Tổng số gói</div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.activePackages}
              </div>
              <div className="insurance-summary-label-compact">
                Đang phát hành
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon policies">
              <SafetyOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.totalPolicies.toLocaleString()}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng hợp đồng
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <StarOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.avgSatisfaction}%
              </div>
              <div className="insurance-summary-label-compact">Hài lòng TB</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="insurance-filters">
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
                  <div className="insurance-filter-form">
                    <div className="space-y-4">
                      {/* First row - Main filters */}
                      <CustomForm
                        fields={searchFields.slice(0, 3)}
                        gridColumns="1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmit}
                      />
                      {/* Second row - Additional filters and actions */}
                      <CustomForm
                        fields={searchFields.slice(3)}
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
        <div className="insurance-table-wrapper">
          <div className="flex justify-start items-center gap-2 mb-2">
            <Button type="primary" icon={<SafetyOutlined />}>
              Tạo mới
            </Button>
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
            rowKey="package_id"
            scroll={{ x: 1200 }}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} gói bảo hiểm`,
            }}
          />
        </div>
      </div>
    </Layout.Content>
  );
}
