"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { getApprovalInfo } from "@/libs/message";
import useClaim from "@/services/hooks/claim/use-claim";
import {
  CloseCircleOutlined,
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
import "../../policy/policy.css";

const { Title, Text } = Typography;

export default function RejectionListPage() {
  const { rejections, rejectionsLoading, rejectionsError, fetchRejections } =
    useClaim();

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "claim_id",
    "claim_rejection_type",
    "reason",
    "validated_by",
    "validation_timestamp",
    "created_at",
  ]);

  useEffect(() => {
    fetchRejections();
  }, [fetchRejections]);

  // Filter rejections based on search and type
  const filteredRejections = useMemo(() => {
    let result = rejections || [];

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (rejection) =>
          rejection.claim_id?.toLowerCase().includes(searchLower) ||
          rejection.validated_by?.toLowerCase().includes(searchLower) ||
          rejection.reason?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (typeFilter) {
      result = result.filter(
        (rejection) => rejection.claim_rejection_type === typeFilter
      );
    }

    return result;
  }, [rejections, searchText, typeFilter]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRejections.slice(startIndex, endIndex);
  }, [filteredRejections, currentPage, pageSize]);

  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: filteredRejections.length,
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
    const allRejections = rejections || [];
    const typeCount = {};
    allRejections.forEach((r) => {
      typeCount[r.claim_rejection_type] =
        (typeCount[r.claim_rejection_type] || 0) + 1;
    });

    return {
      total: allRejections.length,
      byType: typeCount,
      mostCommon: Object.keys(typeCount).sort(
        (a, b) => typeCount[b] - typeCount[a]
      )[0],
    };
  }, [rejections]);

  // Get rejection type text
  const getRejectionTypeText = (type) => {
    switch (type) {
      case "claim_data_incorrect":
        return "Dữ liệu không chính xác";
      case "trigger_not_met":
        return "Không đạt điều kiện kích hoạt";
      case "policy_not_active":
        return "Hợp đồng không còn hiệu lực";
      case "location_mismatch":
        return "Vị trí không khớp";
      case "duplicate_claim":
        return "Yêu cầu trùng lặp";
      case "suspected_fraud":
        return "Nghi ngờ gian lận";
      case "policy_exclusion":
        return "Nằm trong điều khoản loại trừ";
      case "other":
        return "Lý do khác";
      default:
        return type;
    }
  };

  // Get rejection type color
  const getRejectionTypeColor = (type) => {
    switch (type) {
      case "claim_data_incorrect":
        return "orange";
      case "trigger_not_met":
        return "red";
      case "policy_not_active":
        return "volcano";
      case "location_mismatch":
        return "magenta";
      case "duplicate_claim":
        return "purple";
      case "suspected_fraud":
        return "red";
      case "policy_exclusion":
        return "geekblue";
      case "other":
        return "default";
      default:
        return "default";
    }
  };

  // Format date from epoch timestamp or ISO string
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let date;
    if (typeof timestamp === "string") {
      // ISO string format
      date = new Date(timestamp);
    } else {
      // Unix timestamp
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

  // Table columns
  const columns = [
    {
      title: "Mã Claim",
      dataIndex: "claim_id",
      key: "claim_id",
      width: 200,
      render: (text) => (
        <Text strong style={{ fontFamily: "monospace" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Loại từ chối",
      dataIndex: "claim_rejection_type",
      key: "claim_rejection_type",
      width: 200,
      render: (type) => (
        <Tag color={getRejectionTypeColor(type)}>
          {getRejectionTypeText(type)}
        </Tag>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      width: 300,
      ellipsis: true,
      render: (text) => (
        <Text ellipsis={{ tooltip: text }}>{text}</Text>
      ),
    },
    {
      title: "Người đánh giá",
      dataIndex: "validated_by",
      key: "validated_by",
      width: 200,
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Thời gian đánh giá",
      dataIndex: "validation_timestamp",
      key: "validation_timestamp",
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
      width: 120,
      render: (_, record) => (
        <Link href={`/claim/detail?id=${record.claim_id}`}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
          >
            Xem Claim
          </Button>
        </Link>
      ),
    },
  ];

  // Handle form submit
  const handleFormSubmit = (formData) => {
    setSearchText(formData.search || "");
    setTypeFilter(formData.type || "");
    setCurrentPage(1); // Reset to first page
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchText("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  // Search fields
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo mã claim, người đánh giá, lý do...",
      value: searchText,
    },
    {
      name: "type",
      label: "Loại từ chối",
      type: "select",
      placeholder: "Chọn loại từ chối",
      value: typeFilter,
      options: [
        { label: "Tất cả", value: "" },
        { label: "Dữ liệu không chính xác", value: "claim_data_incorrect" },
        { label: "Không đạt điều kiện kích hoạt", value: "trigger_not_met" },
        { label: "Hợp đồng không còn hiệu lực", value: "policy_not_active" },
        { label: "Vị trí không khớp", value: "location_mismatch" },
        { label: "Yêu cầu trùng lặp", value: "duplicate_claim" },
        { label: "Nghi ngờ gian lận", value: "suspected_fraud" },
        { label: "Nằm trong điều khoản loại trừ", value: "policy_exclusion" },
        { label: "Lý do khác", value: "other" },
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

  if (rejectionsLoading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip={getApprovalInfo("LOADING_LIST")} />
        </div>
      </Layout.Content>
    );
  }

  if (rejectionsError) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Lỗi: {rejectionsError}</Text>
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
              Danh Sách Từ Chối Bồi Thường
            </Title>
            <Text className="insurance-subtitle">
              Quản lý và theo dõi các yêu cầu bồi thường đã bị từ chối
            </Text>
          </div>
          <div>
            <Link href="/claim">
              <Button type="default" icon={<FileTextOutlined />}>
                Xem tất cả bồi thường
              </Button>
            </Link>
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
                Tổng số từ chối
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon pending">
              <WarningOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.byType["claim_data_incorrect"] || 0}
              </div>
              <div className="insurance-summary-label-compact">
                Dữ liệu không chính xác
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <CloseCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.byType["trigger_not_met"] || 0}
              </div>
              <div className="insurance-summary-label-compact">
                Không đạt điều kiện
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <CloseCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.mostCommon
                  ? getRejectionTypeText(summaryStats.mostCommon)
                  : "-"}
              </div>
              <div className="insurance-summary-label-compact">
                Phổ biến nhất
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
            scroll={{ x: 1400 }}
            pagination={paginationConfig}
          />
        </div>
      </div>
    </Layout.Content>
  );
}
