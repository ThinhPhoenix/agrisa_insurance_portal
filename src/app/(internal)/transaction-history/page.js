"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { formatUtcDate } from "@/libs/date-utils";
import { usePayout } from "@/services/hooks/transaction-history/use-payout";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Collapse, Layout, Space, Spin, Tag, Typography } from "antd";
import { useState } from "react";
import "./transaction-history.css";

const { Title, Text } = Typography;

// Custom VND Currency Icon Component
const VNDIcon = ({ style }) => (
  <span
    style={{
      fontFamily: "monospace",
      fontWeight: "bold",
      fontSize: "20px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    }}
  >
    ₫
  </span>
);

export default function TransactionHistoryPage() {
  const {
    filteredData,
    loading,
    error,
    pagination,
    filterOptions,
    summaryStats,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
    handlePageChange,
  } = usePayout();

  // Visible columns state - action column is always visible
  const [visibleColumns, setVisibleColumns] = useState([
    "id",
    "description",
    "created_at",
    "amount",
    "status",
    "action", // Always visible
  ]);

  // Search fields for custom form
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder:
        "Tìm kiếm theo mã chi trả, mô tả, số tài khoản, mã ngân hàng...",
      value: searchText,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: filterOptions.statuses,
      value: filters.status,
    },
    {
      name: "minAmount",
      label: "Số tiền tối thiểu",
      type: "number",
      placeholder: "Nhập số tiền tối thiểu",
      min: 0,
      max: 500000000,
      step: 1000000,
      value: filters.amountRange[0],
      formatter: (value) =>
        value ? `${(value / 1000000).toFixed(0)}M VND` : "",
    },
    {
      name: "maxAmount",
      label: "Số tiền tối đa",
      type: "number",
      placeholder: "Nhập số tiền tối đa",
      min: 0,
      max: 500000000,
      step: 1000000,
      value: filters.amountRange[1],
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
    if (!status) return "default";
    const code = status.code || status;
    switch (code) {
      case "completed":
        return "green";
      case "pending":
        return "orange";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    if (!status) return "—";
    return status.label || status;
  };

  const columns = [
    {
      title: "Mã chi trả",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => (a.id || "").localeCompare(b.id || ""),
      render: (text) => <span className="transaction-id">{text}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) =>
        (a.description || "").localeCompare(b.description || ""),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Ngày giao dịch",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <span className="transaction-date">{formatUtcDate(date)}</span>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (amount, record) => (
        <span
          className="transaction-amount"
          style={{
            color:
              record.status?.code === "completed"
                ? "#52c41a"
                : record.status?.code === "pending"
                ? "#faad14"
                : "#ff4d4f",
          }}
        >
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(amount || 0)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusCode = status?.code || status;
        const statusLabel = status?.label || status;
        const icon =
          statusCode === "completed" ? (
            <CheckCircleOutlined />
          ) : statusCode === "pending" ? (
            <ClockCircleOutlined />
          ) : (
            <CloseCircleOutlined />
          );
        return (
          <Tag
            color={getStatusColor(status)}
            className="transaction-status-tag"
            icon={icon}
          >
            {statusLabel}
          </Tag>
        );
      },
    },
    // {
    //   title: "Thao tác",
    //   key: "action",
    //   fixed: "right",
    //   width: 150,
    //   render: (_, record) => (
    //     <Space className="transaction-actions">
    //       <Button
    //         type="default"
    //         size="small"
    //         icon={<EyeOutlined />}
    //         className="transaction-action-btn"
    //         style={{
    //           background: "#e6f7ff",
    //           borderColor: "#91d5ff",
    //           color: "#1890ff",
    //         }}
    //       >
    //         Xem
    //       </Button>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <Layout.Content className="transaction-content">
      <Spin spinning={loading} tip="Đang tải danh sách chi trả...">
        <Space direction="vertical" size="large" className="transaction-space">
          {/* Header */}
          <Space direction="vertical" className="transaction-space">
            <div className="transaction-header">
              <div>
                <Title level={3} className="transaction-title">
                  Lịch sử chi trả
                </Title>
                <Typography.Text type="secondary">
                  Tổng số: <Text strong>{summaryStats.total}</Text> chi trả
                </Typography.Text>
              </div>
            </div>
          </Space>

          {/* Summary Cards */}
          <div className="transaction-summary-row">
            <div className="transaction-summary-card-compact">
              <div className="transaction-summary-icon total">₫</div>
              <div className="transaction-summary-content">
                <div className="transaction-summary-value-compact">
                  {summaryStats.totalAmountFormatted}
                </div>
                <div className="transaction-summary-label-compact">
                  Tổng giá trị chi trả
                </div>
              </div>
            </div>
            <div className="transaction-summary-card-compact">
              <div className="transaction-summary-icon completed">
                <CheckCircleOutlined style={{ fontSize: "16px" }} />
              </div>
              <div className="transaction-summary-content">
                <div className="transaction-summary-value-compact">
                  {summaryStats.completed}
                </div>
                <div className="transaction-summary-label-compact">
                  Đã chi trả
                </div>
              </div>
            </div>
            <div className="transaction-summary-card-compact">
              <div className="transaction-summary-icon pending">
                <ClockCircleOutlined style={{ fontSize: "16px" }} />
              </div>
              <div className="transaction-summary-content">
                <div className="transaction-summary-value-compact">
                  {summaryStats.pending}
                </div>
                <div className="transaction-summary-label-compact">
                  Đang xử lý
                </div>
              </div>
            </div>
            <div className="transaction-summary-card-compact">
              <div className="transaction-summary-icon cancelled">
                <CloseCircleOutlined style={{ fontSize: "16px" }} />
              </div>
              <div className="transaction-summary-content">
                <div className="transaction-summary-value-compact">
                  {summaryStats.cancelled}
                </div>
                <div className="transaction-summary-label-compact">Đã hủy</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Collapse
            size="small"
            className="transaction-filters"
            items={[
              {
                key: "1",
                label: (
                  <Space>
                    <SearchOutlined />
                    Bộ lọc & Tìm kiếm
                  </Space>
                ),
                children: (
                  <div className="transaction-filter-form">
                    <CustomForm
                      fields={searchFields}
                      gridColumns="2fr 1fr 1fr 1fr 1fr 1fr"
                      gap="12px"
                      onSubmit={handleFormSubmit}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fff7f6",
                border: "1px solid #ffccc7",
                borderRadius: "4px",
                color: "#ff4d4f",
              }}
            >
              {error}
            </div>
          )}

          {/* Table */}
          <div className="transaction-overflow">
            <div className="flex justify-end items-center gap-2 mb-2">
              <SelectedColumn
                columns={columns}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
              />
            </div>
            <div className="transaction-table-wrapper">
              <CustomTable
                dataSource={filteredData}
                columns={columns}
                visibleColumns={visibleColumns}
                rowKey="id"
                scroll={{ x: true }}
                size="middle"
                pagination={{
                  current: pagination.page,
                  pageSize: pagination.limit,
                  total: pagination.total_items,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} trong ${total} chi trả`,
                  onChange: (page, limit) => handlePageChange(page, limit),
                }}
              />
            </div>
          </div>
        </Space>
      </Spin>
    </Layout.Content>
  );
}
