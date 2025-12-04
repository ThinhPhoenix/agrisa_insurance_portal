"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { getApprovalInfo } from "@/libs/message";
import useClaim from "@/services/hooks/claim/use-claim";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Space, Spin, Tag, Typography } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "../policy/policy.css";

const { Title, Text } = Typography;

export default function ClaimListPage() {
  const { claims, claimsLoading, claimsError, fetchClaims } = useClaim();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "claim_number",
    "status",
    "claim_amount",
    "over_threshold_value",
    "auto_generated",
    "created_at",
  ]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Filter claims based on search and status
  const filteredClaims = useMemo(() => {
    let result = claims || [];

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (claim) =>
          claim.claim_number?.toLowerCase().includes(searchLower) ||
          claim.id?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((claim) => claim.status === statusFilter);
    }

    return result;
  }, [claims, searchText, statusFilter]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredClaims.slice(startIndex, endIndex);
  }, [filteredClaims, currentPage, pageSize]);

  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: filteredClaims.length,
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} của ${total} bản ghi`,
    onChange: (page, pageSize) => {
      setCurrentPage(page);
      setPageSize(pageSize);
    },
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const allClaims = claims || [];
    return {
      total: allClaims.length,
      pendingReview: allClaims.filter(
        (c) => c.status === "pending_partner_review" || c.status === "generated"
      ).length,
      approved: allClaims.filter(
        (c) => c.status === "approved" || c.status === "paid"
      ).length,
      totalAmount: allClaims.reduce(
        (sum, c) => sum + (c.claim_amount || 0),
        0
      ),
    };
  }, [claims]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "generated":
        return "default";
      case "pending_partner_review":
        return "orange";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "paid":
        return "blue";
      default:
        return "default";
    }
  };

  // Get status text (tiếng Việt)
  const getStatusText = (status) => {
    switch (status) {
      case "generated":
        return "Đã tạo";
      case "pending_partner_review":
        return "Chờ đối tác xem xét";
      case "approved":
        return "Đã phê duyệt";
      case "rejected":
        return "Đã từ chối";
      case "paid":
        return "Đã thanh toán";
      default:
        return status;
    }
  };

  // Format date from epoch timestamp or ISO string
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let date;
    if (typeof timestamp === 'string') {
      // ISO string format
      date = new Date(timestamp);
    } else {
      // Unix timestamp
      date = timestamp < 5000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    }
    return date.toLocaleDateString("vi-VN", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Table columns
  const columns = [
    {
      title: "Mã bồi thường",
      dataIndex: "claim_number",
      key: "claim_number",
      width: 150,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Số tiền bồi thường",
      dataIndex: "claim_amount",
      key: "claim_amount",
      width: 180,
      render: (amount) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount || 0),
    },
    {
      title: "Bồi thường cố định",
      dataIndex: "calculated_fix_payout",
      key: "calculated_fix_payout",
      width: 180,
      render: (amount) =>
        amount
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(amount)
          : "-",
    },
    {
      title: "Bồi thường theo ngưỡng",
      dataIndex: "calculated_threshold_payout",
      key: "calculated_threshold_payout",
      width: 180,
      render: (amount) =>
        amount
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(amount)
          : "-",
    },
    {
      title: "Giá trị vượt ngưỡng",
      dataIndex: "over_threshold_value",
      key: "over_threshold_value",
      width: 160,
      render: (value) => (value ? `${value.toFixed(2)}%` : "-"),
    },
    {
      title: "Phương thức tạo",
      dataIndex: "auto_generated",
      key: "auto_generated",
      width: 140,
      render: (auto) => (auto ? <Tag color="blue">Tự động</Tag> : <Tag>Thủ công</Tag>),
    },
    {
      title: "Thời điểm kích hoạt",
      dataIndex: "trigger_timestamp",
      key: "trigger_timestamp",
      width: 150,
      render: (timestamp) => formatDate(timestamp),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => formatDate(date),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Link href={`/claim/detail?id=${record.id}`}>
          <Button
            type="dashed"
            size="small"
            className="!bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
          >
            <EyeOutlined size={14} />
            Xem
          </Button>
        </Link>
      ),
    },
  ];

  // Handle form submit
  const handleFormSubmit = (formData) => {
    setSearchText(formData.search || "");
    setStatusFilter(formData.status || "");
    setCurrentPage(1); // Reset to first page
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // Search fields
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo mã bồi thường...",
      value: searchText,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      placeholder: "Chọn trạng thái",
      value: statusFilter,
      options: [
        { label: "Tất cả", value: "" },
        { label: "Đã tạo", value: "generated" },
        { label: "Chờ đối tác xem xét", value: "pending_partner_review" },
        { label: "Đã phê duyệt", value: "approved" },
        { label: "Đã từ chối", value: "rejected" },
        { label: "Đã thanh toán", value: "paid" },
      ],
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

  if (claimsLoading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip={getApprovalInfo("LOADING_LIST")} />
        </div>
      </Layout.Content>
    );
  }

  if (claimsError) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Lỗi: {claimsError}</Text>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="insurance-header">
          <div>
            <Title level={2} className="insurance-title">
              Quản Lý Bồi Thường
            </Title>
            <Text className="insurance-subtitle">
              Theo dõi và quản lý các yêu cầu bồi thường bảo hiểm nông nghiệp
            </Text>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="insurance-summary-row">
          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon total">
              <FileTextOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.total}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng bồi thường
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon pending">
              <ClockCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.pendingReview}
              </div>
              <div className="insurance-summary-label-compact">
                Chờ duyệt
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.approved}
              </div>
              <div className="insurance-summary-label-compact">Đã phê duyệt</div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <DollarOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(summaryStats.totalAmount)}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng số tiền
              </div>
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
                      <CustomForm
                        fields={searchFields}
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
            <Button icon={<DownloadOutlined />}>Xuất excel</Button>
            <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
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
            pagination={paginationConfig}
          />
        </div>
      </div>
    </Layout.Content>
  );
}
