"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { useTransaction } from "@/services/hooks/transaction-history/use-transaction";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Space, Tag, Typography } from "antd";
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
    filterOptions,
    summaryStats,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
  } = useTransaction();

  // Visible columns state - action column is always visible
  const [visibleColumns, setVisibleColumns] = useState([
    "invoice_id",
    "recipient_name",
    "date",
    "location",
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
      placeholder: "Tìm kiếm theo mã hóa đơn, tên người nhận, địa điểm...",
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
      name: "location",
      label: "Địa điểm",
      type: "combobox",
      placeholder: "Chọn địa điểm",
      options: filterOptions.locations.map((location) => ({
        label: location,
        value: location,
      })),
      value: filters.location,
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
    switch (status) {
      case "Completed":
        return "green";
      case "Pending":
        return "orange";
      case "Cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Completed":
        return "Hoàn thành";
      case "Pending":
        return "Đang xử lý";
      case "Cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const columns = [
    {
      title: "Mã hóa đơn",
      dataIndex: "invoice_id",
      key: "invoice_id",
      sorter: (a, b) => a.invoice_id.localeCompare(b.invoice_id),
      render: (text) => <span className="transaction-id">{text}</span>,
    },
    {
      title: "Người nhận",
      dataIndex: "recipient_name",
      key: "recipient_name",
      sorter: (a, b) => a.recipient_name.localeCompare(b.recipient_name),
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Ngày giao dịch",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => <span className="transaction-date">{date}</span>,
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
      filters: filterOptions.locations.map((location) => ({
        text: location,
        value: location,
      })),
      onFilter: (value, record) => record.location === value,
      render: (location) => (
        <span className="transaction-location">{location}</span>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount_formatted",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (amount, record) => (
        <span
          className="transaction-amount"
          style={{
            color:
              record.status === "Completed"
                ? "#52c41a"
                : record.status === "Pending"
                ? "#faad14"
                : "#ff4d4f",
          }}
        >
          {amount}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: filterOptions.statuses.map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value, record) => getStatusText(record.status) === value,
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          className="transaction-status-tag"
          icon={
            status === "Completed" ? (
              <CheckCircleOutlined />
            ) : status === "Pending" ? (
              <ClockCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
        >
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space className="transaction-actions">
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            className="transaction-action-btn"
            style={{
              background: "#e6f7ff",
              borderColor: "#91d5ff",
              color: "#1890ff",
            }}
          >
            Xem
          </Button>
          <Button
            type="default"
            size="small"
            icon={<DownloadOutlined />}
            className="transaction-action-btn"
            style={{
              background: "#f6ffed",
              borderColor: "#b7eb8f",
              color: "#52c41a",
            }}
          >
            Tải
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout.Content className="transaction-content">
      <Space direction="vertical" size="large" className="transaction-space">
        {/* Header */}
        <Space direction="vertical" className="transaction-space">
          <div className="transaction-header">
            <div>
              <Title level={3} className="transaction-title">
                Lịch sử giao dịch
              </Title>
              <Typography.Text type="secondary">
                Tổng số: <Text strong>{summaryStats.total}</Text> giao dịch
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
                Tổng giá trị giao dịch
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
                Giao dịch hoàn thành
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
                Giao dịch đang xử lý
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
              <div className="transaction-summary-label-compact">
                Giao dịch đã hủy
              </div>
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
                    gridColumns="2fr 1fr 1fr 1fr 1fr 1fr 1fr"
                    gap="12px"
                    onSubmit={handleFormSubmit}
                  />
                </div>
              ),
            },
          ]}
        />

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
              rowKey="invoice_id"
              scroll={{ x: true }}
              size="middle"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} trong ${total} giao dịch`,
              }}
            />
          </div>
        </div>
      </Space>
    </Layout.Content>
  );
}
