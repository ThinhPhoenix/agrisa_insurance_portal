"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import {
  booleanFilter,
  statusFilter,
  useFilterableList,
} from "@/services/hooks/common";
import usePayout from "@/services/hooks/payout/use-payout";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Space, Spin, Tag, Typography } from "antd";
import Link from "next/link";
import { useEffect } from "react";
import "./payout.css";

const { Title, Text } = Typography;

export default function PayoutListPage() {
  const { payouts, payoutsLoading, fetchPayouts } = usePayout();

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const {
    paginatedData,
    filteredData,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    visibleColumns,
    setColumns: setVisibleColumns,
    getSummaryStats,
  } = useFilterableList(payouts, {
    searchFields: ["id", "claim_id", "farmer_id"],
    defaultFilters: {
      searchText: "",
      status: "all",
      farmerConfirmed: "all",
    },
    defaultVisibleColumns: [
      "id",
      "claim_id",
      "payout_amount",
      "status",
      "farmer_confirmed",
      "initiated_at",
    ],
    defaultPageSize: 10,
    filterHandlers: {
      searchText: (item, value) => {
        if (!value || value === "") return true;
        const searchLower = value.toLowerCase();
        return (
          item.id?.toLowerCase().includes(searchLower) ||
          item.claim_id?.toLowerCase().includes(searchLower) ||
          item.farmer_id?.toLowerCase().includes(searchLower)
        );
      },
      status: (item, value) => statusFilter(item, value, "status"),
      farmerConfirmed: (item, value) =>
        booleanFilter(item, value, "farmer_confirmed"),
    },
  });

  // Calculate summary stats using hook
  const summaryStats = getSummaryStats({
    total: { type: "count" },
    completed: {
      type: "count",
      filterFn: (item) => item.status === "completed",
    },
    processing: {
      type: "count",
      filterFn: (item) => item.status === "processing",
    },
    totalAmount: {
      type: "sum",
      field: "payout_amount",
    },
  });

  // Filter options
  const filterOptions = {
    statuses: [
      { label: "Tất cả", value: "all" },
      { label: "Chờ xử lý", value: "pending" },
      { label: "Đang xử lý", value: "processing" },
      { label: "Hoàn tất", value: "completed" },
      { label: "Thất bại", value: "failed" },
    ],
    farmerConfirmedOptions: [
      { label: "Tất cả", value: "all" },
      { label: "Đã xác nhận", value: "true" },
      { label: "Chưa xác nhận", value: "false" },
    ],
  };

  // Filter options for form

  // Format date from epoch timestamp or ISO string
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      date =
        timestamp < 5000000000
          ? new Date(timestamp * 1000)
          : new Date(timestamp);
    }
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "default";
      case "processing":
        return "processing";
      case "completed":
        return "success";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "completed":
        return "Hoàn tất";
      case "failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  // Table columns
  const columns = [
    {
      title: "Mã chi trả",
      dataIndex: "id",
      key: "id",
      width: 280,
      fixed: "left",
      render: (id) => (
        <Link href={`/payout/detail?id=${id}`}>
          <Text
            style={{
              color: "#1890ff",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            {id}
          </Text>
        </Link>
      ),
    },
    {
      title: "Mã bồi thường",
      dataIndex: "claim_id",
      key: "claim_id",
      width: 280,
      render: (claimId) => (
        <Link href={`/claim/detail?id=${claimId}`}>
          <Text
            style={{
              color: "#1890ff",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            {claimId}
          </Text>
        </Link>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "payout_amount",
      key: "payout_amount",
      width: 150,
      render: (amount) => (
        <Text strong style={{ color: "#52c41a", fontSize: "14px" }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Loại tiền",
      dataIndex: "currency",
      key: "currency",
      width: 100,
      render: (currency) => <Tag color="blue">{currency || "VND"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Xác nhận nông dân",
      dataIndex: "farmer_confirmed",
      key: "farmer_confirmed",
      width: 150,
      align: "center",
      render: (confirmed) => (
        <Tag
          color={confirmed ? "success" : "default"}
          icon={confirmed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {confirmed ? "Đã xác nhận" : "Chưa xác nhận"}
        </Tag>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "farmer_rating",
      key: "farmer_rating",
      width: 100,
      align: "center",
      render: (rating) =>
        rating ? (
          <Text style={{ fontSize: "13px" }}>⭐ {rating}/5</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Thời gian khởi tạo",
      dataIndex: "initiated_at",
      key: "initiated_at",
      width: 130,
      render: (timestamp) => <Text>{formatDate(timestamp)}</Text>,
    },
    {
      title: "Thời gian hoàn tất",
      dataIndex: "completed_at",
      key: "completed_at",
      width: 130,
      render: (timestamp) => <Text>{formatDate(timestamp)}</Text>,
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <div className="payout-actions-cell">
          <Link href={`/payout/detail?id=${record.id}`}>
            <Button
              type="dashed"
              size="small"
              className="payout-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // All search fields in one array
  const searchFields = [
    {
      name: "searchText",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo ID chi trả, mã claim, farmer ID...",
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: filterOptions.statuses,
    },
    {
      name: "farmerConfirmed",
      label: "Xác nhận nông dân",
      type: "combobox",
      placeholder: "Chọn trạng thái xác nhận",
      options: filterOptions.farmerConfirmedOptions,
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
    <Layout.Content className="payout-content">
      <Spin spinning={payoutsLoading} tip="Đang tải dữ liệu...">
        <div className="payout-space">
          {/* Header */}
          <div className="payout-header">
            <div>
              <Title level={2} className="payout-title">
                <WalletOutlined className="payout-icon" />
                Quản Lý Chi Trả
              </Title>
              <Text type="secondary" className="payout-subtitle">
                Xem và quản lý các khoản chi trả bồi thường
              </Text>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="payout-summary-row">
            <div className="payout-summary-card-compact">
              <div className="payout-summary-icon total">
                <WalletOutlined />
              </div>
              <div className="payout-summary-content">
                <div className="payout-summary-value-compact">
                  {summaryStats.total}
                </div>
                <div className="payout-summary-label-compact">Tổng chi trả</div>
              </div>
            </div>

            <div className="payout-summary-card-compact">
              <div className="payout-summary-icon active">
                <CheckCircleOutlined />
              </div>
              <div className="payout-summary-content">
                <div className="payout-summary-value-compact">
                  {summaryStats.completed}
                </div>
                <div className="payout-summary-label-compact">Hoàn tất</div>
              </div>
            </div>

            <div className="payout-summary-card-compact">
              <div
                className="payout-summary-icon"
                style={{ backgroundColor: "#fff7e6", color: "#fa8c16" }}
              >
                <ClockCircleOutlined />
              </div>
              <div className="payout-summary-content">
                <div className="payout-summary-value-compact">
                  {summaryStats.processing}
                </div>
                <div className="payout-summary-label-compact">Đang xử lý</div>
              </div>
            </div>

            <div className="payout-summary-card-compact">
              <div className="payout-summary-icon premium">
                <DollarOutlined />
              </div>
              <div className="payout-summary-content">
                <div className="payout-summary-value-compact">
                  {summaryStats.totalAmount > 0
                    ? new Intl.NumberFormat("vi-VN").format(
                        summaryStats.totalAmount
                      )
                    : "0"}
                </div>
                <div className="payout-summary-label-compact">
                  Tổng tiền đã chi (VND)
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="payout-filters">
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
                    <div className="payout-filter-form">
                      <CustomForm
                        fields={searchFields}
                        gridColumns="1fr 1fr 1fr 120px 120px"
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
              scroll={{ x: 1600 }}
              pagination={{
                ...paginationConfig,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} khoản chi trả`,
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: "40px 0" }}>
                    <WalletOutlined
                      style={{
                        fontSize: 48,
                        color: "#d9d9d9",
                        marginBottom: "16px",
                      }}
                    />
                    <div>
                      <Text type="secondary" style={{ display: "block" }}>
                        Chưa có khoản chi trả nào
                      </Text>
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </Spin>
    </Layout.Content>
  );
}
