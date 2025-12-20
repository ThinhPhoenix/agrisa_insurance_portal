"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { formatUtcDate } from "@/libs/date-utils";
import { getApprovalInfo } from "@/libs/message";
import { useCancelPolicy } from "@/services/hooks/policy/use-cancel-policy";
import {
  CheckCircleOutlined,
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
import { useState } from "react";
import "../policy.css";

const { Title, Text } = Typography;

export default function CancelRequestsPage() {
  const {
    paginatedData,
    allCancelRequests,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    loading,
  } = useCancelPolicy();

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "id",
    "registered_policy_id",
    "cancel_request_type",
    "reason",
    "status",
    "requested_by",
    "requested_at",
  ]);

  // Calculate summary stats
  const summaryStats = {
    totalRequests: allCancelRequests.length,
    pendingReview: allCancelRequests.filter(
      (r) => r.status === "pending_review"
    ).length,
    approved: allCancelRequests.filter((r) => r.status === "approved").length,
    denied: allCancelRequests.filter((r) => r.status === "denied").length,
    dispute: allCancelRequests.filter(
      (r) => r.status === "dispute" || r.status === "denied"
    ).length,
  };

  // Handle form submit
  const handleFormSubmitWrapper = (formData) => {
    handleFormSubmit(formData);
  };

  // Handle clear filters
  const handleClearFiltersWrapper = () => {
    handleClearFilters();
  };

  // Get cancel request status color
  const getCancelStatusColor = (status) => {
    switch (status) {
      case "pending_review":
        return "orange";
      case "approved":
        return "green";
      case "denied":
        return "red";
      case "dispute":
        return "volcano";
      case "litigation":
        return "purple";
      default:
        return "default";
    }
  };

  // Get cancel request status text
  const getCancelStatusText = (status) => {
    switch (status) {
      case "pending_review":
        return "Chờ xem xét";
      case "approved":
        return "Đã chấp thuận";
      case "denied":
        return "Bị từ chối";
      case "dispute":
        return "Tranh chấp";
      case "litigation":
        return "Tranh chấp";
      default:
        return status;
    }
  };

  // Get cancel request type text
  const getCancelTypeText = (type) => {
    switch (type) {
      case "contract_violation":
        return "Vi phạm hợp đồng";
      case "policyholder_request":
        return "Yêu cầu từ nông dân";
      case "non_payment":
        return "Không thanh toán";
      case "regulatory_change":
        return "Thay đổi quy định";
      case "other":
        return "Khác";
      default:
        return type;
    }
  };

  // Table columns
  const columns = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      width: 300,
      render: (text) => (
        <div className="insurance-package-id break-all">{text}</div>
      ),
    },
    {
      title: "Mã hợp đồng",
      dataIndex: "registered_policy_id",
      key: "registered_policy_id",
      width: 300,
      render: (text) => (
        <div className="insurance-package-name break-all">{text}</div>
      ),
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "cancel_request_type",
      key: "cancel_request_type",
      width: 150,
      render: (type) => <Tag color="blue">{getCancelTypeText(type)}</Tag>,
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      width: 200,
      ellipsis: true,
      render: (text) => (
        <div className="truncate" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag
          color={getCancelStatusColor(status)}
          className="insurance-status-tag"
        >
          {getCancelStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Người yêu cầu",
      dataIndex: "requested_by",
      key: "requested_by",
      width: 150,
      render: (id) => {
        if (!id) return "-";
        // Check if it's a UUID (contains hyphens and longer format)
        const isUUID = id.includes("-") && id.length > 30;
        return (
          <Tag color={isUUID ? "blue" : "green"}>
            {isUUID ? "Đối tác bảo hiểm" : "Nông dân"}
          </Tag>
        );
      },
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "requested_at",
      key: "requested_at",
      width: 120,
      render: (date) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">{formatUtcDate(date)}</div>
        </div>
      ),
    },
    {
      title: "Số tiền bồi thường",
      dataIndex: "compensate_amount",
      key: "compensate_amount",
      width: 150,
      render: (val) =>
        val > 0
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(val)
          : "-",
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <div className="insurance-actions-cell">
          <Link href={`/policy/cancel/${record.id}`}>
            <Button
              type="dashed"
              size="small"
              className="insurance-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
              Xem
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  // Search fields
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo mã yêu cầu, mã hợp đồng...",
      value: searchText,
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
      onClick: handleClearFiltersWrapper,
    },
  ];

  if (loading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip={getApprovalInfo("LOADING_LIST")} />
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
              Yêu Cầu Hủy Hợp Đồng
            </Title>
            <Text className="insurance-subtitle">
              Quản lý các yêu cầu hủy hợp đồng bảo hiểm từ nông dân
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
                {summaryStats.totalRequests}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng yêu cầu
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <WarningOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.pendingReview}
              </div>
              <div className="insurance-summary-label-compact">Chờ xem xét</div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon policies">
              <CheckCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.approved}
              </div>
              <div className="insurance-summary-label-compact">
                Đã chấp thuận
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <CloseCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.denied}
              </div>
              <div className="insurance-summary-label-compact">Bị từ chối</div>
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
                        gridColumns="1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmitWrapper}
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
