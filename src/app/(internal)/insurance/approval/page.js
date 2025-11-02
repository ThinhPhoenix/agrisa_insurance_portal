"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { useApplications } from "@/services/hooks/applications/use-applications";
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
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Image,
  Layout,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from "antd";
import Link from "next/link";
import { useState } from "react";
import "../insurance.css";

const { Title, Text } = Typography;

export default function InsuranceApprovalPage() {
  const {
    filteredData,
    filterOptions,
    searchText,
    filters,
    handleFormSubmit,
    handleClearFilters,
  } = useApplications();

  // Modal states
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [form] = Form.useForm();

  // Visible columns state - simplified to key fields only
  const [visibleColumns, setVisibleColumns] = useState([
    "application_id",
    "farmer_name",
    "status",
    "submission_date",
  ]);

  // Calculate summary stats from applications data
  const summaryStats = {
    totalApplications: filteredData.length,
    pendingApplications: filteredData.filter(
      (app) => app.status === "awaiting_assessment"
    ).length,
    underAssessment: filteredData.filter(
      (app) => app.status === "under_assessment"
    ).length,
    avgRiskScore:
      filteredData.length > 0
        ? (
            filteredData.reduce((sum, app) => sum + (app.risk_score || 0), 0) /
            filteredData.length
          ).toFixed(2)
        : 0,
  };

  // Handle form submit
  const handleFormSubmitWrapper = (formData) => {
    handleFormSubmit(formData);
  };

  // Handle clear filters
  const handleClearFiltersWrapper = () => {
    handleClearFilters();
  };

  // Handle reject modal
  const handleRejectClick = (record) => {
    setSelectedApplication(record);
    setRejectModalVisible(true);
    form.resetFields();
  };

  const handleRejectConfirm = async () => {
    try {
      const values = await form.validateFields();
      // Here you would typically call an API to reject the application
      console.log(
        "Rejecting application:",
        selectedApplication.id,
        "with reason:",
        values.rejectReason,
        "verification:",
        values.verificationCode
      );

      // Show success message
      message.success(`Đã từ chối đơn ${selectedApplication.id} thành công`);

      // Close modal
      setRejectModalVisible(false);
      setSelectedApplication(null);
      form.resetFields();

      // TODO: Refresh data or update local state
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalVisible(false);
    setSelectedApplication(null);
    form.resetFields();
  };

  // Handle approve action
  const handleApproveClick = (record) => {
    // Here you would typically call an API to approve the application
    console.log("Approving application:", record.id);

    // Show success message
    message.success(`Đã duyệt đơn ${record.id} thành công`);

    // TODO: Refresh data or update local state
  };

  // Get status color for applications
  const getStatusColor = (status) => {
    switch (status) {
      case "awaiting_assessment":
        return "orange";
      case "under_assessment":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  // Get risk level color
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case "Low":
        return "green";
      case "Medium":
        return "orange";
      case "High":
        return "red";
      default:
        return "default";
    }
  };

  // Table columns for applications - simplified to key fields
  const columns = [
    {
      title: "Mã đơn đăng ký",
      dataIndex: "application_id",
      key: "application_id",
      width: 150,
      render: (_, record) => (
        <div className="insurance-package-id">{record.id}</div>
      ),
    },
    {
      title: "Tên nông dân",
      dataIndex: "farmer_name",
      key: "farmer_name",
      width: 200,
      render: (_, record) => (
        <div className="insurance-package-name">{record.farmer_name}</div>
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
          {record.status === "awaiting_assessment"
            ? "Chờ đánh giá"
            : record.status === "under_assessment"
            ? "Đang đánh giá"
            : record.status === "approved"
            ? "Đã duyệt"
            : "Từ chối"}
        </Tag>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "submission_date",
      key: "submission_date",
      width: 120,
      render: (_, record) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">
            {new Date(record.submission_date).toLocaleDateString("vi-VN")}
          </div>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <div className="insurance-actions-cell">
          <Link href={`/applications/${record.id}`}>
            <Button
              type="dashed"
              size="small"
              className="insurance-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
              Xem
            </Button>
          </Link>
          <Popconfirm
            title="Bạn có chắc chắn muốn duyệt đơn này?"
            onConfirm={() => handleApproveClick(record)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              type="dashed"
              size="small"
              className="insurance-action-btn !bg-green-100 !border-green-200 !text-green-800 hover:!bg-green-200"
            >
              <CheckOutlined size={14} />
              Duyệt
            </Button>
          </Popconfirm>
          <Button
            type="dashed"
            size="small"
            className="insurance-action-btn !bg-red-100 !border-red-200 !text-red-800 hover:!bg-red-200"
            onClick={() => handleRejectClick(record)}
          >
            <CloseOutlined size={14} />
            Từ chối
          </Button>
        </div>
      ),
    },
  ];

  // Search fields for applications
  const searchFields = [
    // First row - Main filters (3 fields)
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo tên nông dân hoặc ID...",
      value: searchText,
    },
    {
      name: "cropType",
      label: "Loại cây trồng",
      type: "combobox",
      placeholder: "Chọn loại cây",
      options:
        filterOptions.cropTypes?.map((type) => ({
          label: type,
          value: type,
        })) || [],
      value: filters.cropType,
    },
    {
      name: "region",
      label: "Khu vực",
      type: "combobox",
      placeholder: "Chọn khu vực",
      options:
        filterOptions.regions?.map((region) => ({
          label: region,
          value: region,
        })) || [],
      value: filters.region,
    },
    // Second row - Additional filters and actions (4 fields)
    {
      name: "riskLevel",
      label: "Mức độ rủi ro",
      type: "combobox",
      placeholder: "Chọn mức rủi ro",
      options: [
        { label: "Thấp", value: "Low" },
        { label: "Trung bình", value: "Medium" },
        { label: "Cao", value: "High" },
      ],
      value: filters.riskLevel,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: [
        { label: "Chờ đánh giá", value: "awaiting_assessment" },
        { label: "Đang đánh giá", value: "under_assessment" },
        { label: "Đã duyệt", value: "approved" },
        { label: "Từ chối", value: "rejected" },
      ],
      value: filters.status,
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
              <InsuranceOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.totalApplications}
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
                {summaryStats.pendingApplications}
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
                {summaryStats.underAssessment}
              </div>
              <div className="insurance-summary-label-compact">
                Đang đánh giá
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <StarOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.avgRiskScore}
              </div>
              <div className="insurance-summary-label-compact">
                Điểm rủi ro TB
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
                        fields={searchFields.slice(0, 3)}
                        gridColumns="1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmitWrapper}
                      />
                      {/* Second row - Additional filters and actions */}
                      <CustomForm
                        fields={searchFields.slice(3)}
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
            <Button type="primary" icon={<SafetyOutlined />}>
              Duyệt hàng loạt
            </Button>
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
            dataSource={filteredData}
            visibleColumns={visibleColumns}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đơn đăng ký`,
            }}
          />
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        title={`Từ chối đơn ${selectedApplication?.id}`}
        open={rejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        width={500}
      >
        <div className="mb-4">
          <p>
            <strong>Nông dân:</strong> {selectedApplication?.farmer_name}
          </p>
          <p>
            <strong>Mã đơn:</strong> {selectedApplication?.id}
          </p>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="rejectReason"
            label="Lý do từ chối"
            rules={[
              { required: true, message: "Vui lòng nhập lý do từ chối" },
              { min: 10, message: "Lý do từ chối phải có ít nhất 10 ký tự" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối đơn đăng ký..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout.Content>
  );
}
