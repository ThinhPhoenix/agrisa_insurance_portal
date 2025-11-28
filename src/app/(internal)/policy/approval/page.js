"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { getApprovalInfo } from "@/libs/message";
import { useInsurancePolicies } from "@/services/hooks/policy/use-aproval";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  SafetyOutlined,
  SearchOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Space, Spin, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import "./approval.css";

const { Title, Text } = Typography;

export default function InsuranceApprovalPage() {
  const {
    paginatedData,
    allPolicies,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    loading,
  } = useInsurancePolicies();

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "policy_number",
    "farmer_id",
    "status",
    "underwriting_status",
    "created_at",
  ]);

  // Calculate summary stats using allPolicies (unpaginated)
  const summaryStats = {
    totalPolicies: allPolicies.length,
    pendingReview: allPolicies.filter((p) => p.status === "pending_review")
      .length,
    underwritingPending: allPolicies.filter(
      (p) => p.underwriting_status === "pending"
    ).length,
    totalPremium: allPolicies.reduce(
      (sum, p) => sum + (p.total_farmer_premium || 0),
      0
    ),
  };

  // Handle form submit
  const handleFormSubmitWrapper = (formData) => {
    handleFormSubmit(formData);
  };

  // Handle clear filters
  const handleClearFiltersWrapper = () => {
    handleClearFilters();
  };

  // Get status color for policy status
  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "default";
      case "pending_review":
        return "orange";
      case "pending_payment":
        return "gold";
      case "active":
        return "green";
      case "expired":
        return "volcano";
      case "cancelled":
        return "red";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "draft":
        return "Bản nháp";
      case "pending_review":
        return "Chờ duyệt";
      case "pending_payment":
        return "Chờ thanh toán";
      case "active":
        return "Đang hoạt động";
      case "expired":
        return "Hết hạn";
      case "cancelled":
        return "Đã hủy";
      case "rejected":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  // Get underwriting status color
  const getUnderwritingStatusColor = (underwritingStatus) => {
    switch (underwritingStatus) {
      case "pending":
        return "gold";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  // Get underwriting status text
  const getUnderwritingStatusText = (underwritingStatus) => {
    switch (underwritingStatus) {
      case "pending":
        return "Chờ thẩm định";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return underwritingStatus;
    }
  };

  // Table columns
  const columns = [
    {
      title: "Số hợp đồng",
      dataIndex: "policy_number",
      key: "policy_number",
      width: 150,
      render: (_, record) => (
        <div className="insurance-package-id">{record.policy_number}</div>
      ),
    },
    {
      title: "Mã nông dân",
      dataIndex: "farmer_id",
      key: "farmer_id",
      width: 150,
      render: (_, record) => (
        <div className="insurance-package-name">{record.farmer_id}</div>
      ),
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (_, record) => (
        <Tag
          color={getStatusColor(record.status)}
          className="insurance-status-tag"
        >
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: "Trạng thái bảo hiểm",
      dataIndex: "underwriting_status",
      key: "underwriting_status",
      width: 150,
      render: (_, record) => (
        <Tag
          color={getUnderwritingStatusColor(record.underwriting_status)}
          className="insurance-status-tag"
        >
          {getUnderwritingStatusText(record.underwriting_status)}
        </Tag>
      ),
    },
    {
      title: "Phí bảo hiểm",
      dataIndex: "total_farmer_premium",
      key: "total_farmer_premium",
      width: 150,
      render: (val) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(val),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (_, record) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">
            {new Date(record.created_at).toLocaleDateString("vi-VN")}
          </div>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <div className="insurance-actions-cell">
          <Link href={`/policy/policy-detail?id=${record.id}&type=approval`}>
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
      placeholder: "Tìm theo số HĐ hoặc mã nông dân...",
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
              Duyệt Đơn Bảo Hiểm
            </Title>
            <Text className="insurance-subtitle">
              Xem xét và phê duyệt các đơn đăng ký bảo hiểm nông nghiệp
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
                {summaryStats.totalPolicies}
              </div>
              <div className="insurance-summary-label-compact">Tổng đơn</div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.pendingReview}
              </div>
              <div className="insurance-summary-label-compact">Chờ duyệt</div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon policies">
              <SafetyOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.underwritingPending}
              </div>
              <div className="insurance-summary-label-compact">
                Chờ thẩm định
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <StarOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(summaryStats.totalPremium)}
              </div>
              <div className="insurance-summary-label-compact">Tổng phí BH</div>
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
            {/* <Button type="primary" icon={<SafetyOutlined />}>
              Duyệt hàng loạt
            </Button> */}
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
            scroll={{ x: 800 }}
            pagination={paginationConfig}
          />
        </div>
      </div>
    </Layout.Content>
  );
}
