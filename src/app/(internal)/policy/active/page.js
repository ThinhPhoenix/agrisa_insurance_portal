"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { getApprovalInfo } from "@/libs/message";
import { useActivePolicies } from "@/services/hooks/policy/use-active-policies";
import { useCancelPolicy } from "@/services/hooks/policy/use-cancel-policy";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  SafetyOutlined,
  SearchOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Layout,
  message,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useRef, useState } from "react";
import "../policy.css";

const { Title, Text } = Typography;

export default function ActivePoliciesPage() {
  const {
    paginatedData,
    allPolicies,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    loading,
  } = useActivePolicies();

  const { createCancelRequest } = useCancelPolicy();

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "policy_number",
    "farmer_id",
    "status",
    "underwriting_status",
    "created_at",
  ]);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRequestType, setCancelRequestType] = useState(
    "policyholder_request"
  );
  const [compensateAmount, setCompensateAmount] = useState(0);
  const [evidenceFields, setEvidenceFields] = useState([]);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const formRef = useRef(null);

  // Calculate summary stats using allPolicies (unpaginated)
  const summaryStats = {
    totalPolicies: allPolicies.length,
    activePolicies: allPolicies.filter((p) => p.status === "active").length,
    totalPremium: allPolicies.reduce(
      (sum, p) => sum + (p.total_farmer_premium || 0),
      0
    ),
    totalCoverage: allPolicies.reduce(
      (sum, p) => sum + (p.coverage_amount || 0),
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

  // Handle cancel request
  const handleCancelRequest = (policy) => {
    setSelectedPolicy(policy);
    setCancelModalVisible(true);
    setCancelReason("");
    setCancelRequestType("policyholder_request");
    setCompensateAmount(0);
    setEvidenceFields([]);
  };

  const handleSubmitCancelRequest = () => {
    if (!cancelReason.trim()) {
      message.error("Vui lòng nhập lý do hủy");
      return;
    }

    Modal.confirm({
      title: "Xác nhận gửi yêu cầu hủy",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn gửi yêu cầu hủy hợp đồng này không?</p>
          <p className="mt-2 text-sm text-gray-500">
            Hợp đồng sẽ chuyển sang trạng thái "Chờ hủy" và chờ bên bảo hiểm xem
            xét.
          </p>
        </div>
      ),
      okText: "Xác nhận gửi",
      cancelText: "Hủy",
      onOk: async () => {
        setSubmittingCancel(true);
        try {
          // Transform evidenceFields array into evidence object
          const evidence = {};
          evidenceFields.forEach((field) => {
            if (field.key && field.value) {
              evidence[field.key] = field.value;
            }
          });

          const result = await createCancelRequest(selectedPolicy.id, {
            cancel_request_type: cancelRequestType,
            reason: cancelReason,
            compensate_amount: compensateAmount,
            evidence: evidence,
          });

          if (result.success) {
            message.success("Gửi yêu cầu hủy thành công");
            setCancelModalVisible(false);
            // Refresh the list
            window.location.reload();
          } else {
            throw new Error(result.error || "Gửi yêu cầu thất bại");
          }
        } catch (error) {
          console.error("Error submitting cancel request:", error);
          message.error(error.message || "Gửi yêu cầu thất bại");
        } finally {
          setSubmittingCancel(false);
        }
      },
    });
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
      case "dispute":
        return "volcano";
      case "pending_cancel":
        return "orange";
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
      case "dispute":
        return "Tranh chấp";
      case "pending_cancel":
        return "Chờ hủy";
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
    // {
    //   title: "Mã nông dân",
    //   dataIndex: "farmer_id",
    //   key: "farmer_id",
    //   width: 150,
    //   render: (_, record) => (
    //     <div className="insurance-package-name">{record.farmer_id}</div>
    //   ),
    // },
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
      title: "Số tiền bảo hiểm",
      dataIndex: "coverage_amount",
      key: "coverage_amount",
      width: 150,
      render: (val) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(val),
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
      title: "Ngày kết thúc",
      dataIndex: "coverage_end_date",
      key: "coverage_end_date",
      width: 120,
      render: (_, record) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">
            {new Date(record.coverage_end_date * 1000).toLocaleDateString(
              "vi-VN"
            )}
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
          <Space size="small">
            <Link href={`/policy/policy-detail?id=${record.id}&type=active`}>
              <Button
                type="dashed"
                size="small"
                className="insurance-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
              >
                <EyeOutlined size={14} />
                Xem
              </Button>
            </Link>
            {record.status === "active" && (
              <Button
                type="dashed"
                size="small"
                danger
                onClick={() => handleCancelRequest(record)}
                className="insurance-action-btn"
              >
                <CloseCircleOutlined size={14} />
                Yêu cầu hủy
              </Button>
            )}
          </Space>
        </div>
      ),
    },
  ];

  // Generate evidence fields for CustomForm
  const generateEvidenceFields = (evidenceArray) => {
    const fields = [];

    evidenceArray.forEach((evidence, idx) => {
      fields.push(
        {
          name: `evidence_${idx}_key`,
          type: "input",
          label: `Tên bằng chứng ${idx + 1}`,
          placeholder: "e.g., photo_url, description, invoice, etc.",
          initialValue: evidence.key || "",
          required: false,
        },
        {
          name: `evidence_${idx}_value`,
          type: "textarea",
          label: `Giá trị bằng chứng ${idx + 1}`,
          placeholder: "Nhập giá trị hoặc nội dung liên quan",
          initialValue: evidence.value || "",
          required: false,
        },
        {
          name: `evidence_${idx}_images`,
          type: "image",
          label: `Hình ảnh bằng chứng ${idx + 1}`,
          maxCount: 5,
          required: false,
        }
      );
    });

    return fields;
  };

  // Search fields - no status filter needed as we already filter active policies
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo số HĐ...",
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
              Đơn Bảo Hiểm Đang Hoạt Động
            </Title>
            <Text className="insurance-subtitle">
              Quản lý và theo dõi các đơn bảo hiểm nông nghiệp đang hoạt động
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
              <div className="insurance-summary-label-compact">
                Tổng đơn hoạt động
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.activePolicies}
              </div>
              <div className="insurance-summary-label-compact">
                Đang hiệu lực
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon policies">
              <SafetyOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(summaryStats.totalCoverage)}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng số tiền BH
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
            scroll={{ x: 800 }}
            pagination={paginationConfig}
          />
        </div>

        {/* Cancel Request Modal */}
        <Modal
          title="Yêu cầu hủy hợp đồng bảo hiểm"
          open={cancelModalVisible}
          onOk={handleSubmitCancelRequest}
          onCancel={() => setCancelModalVisible(false)}
          confirmLoading={submittingCancel}
          okText="Gửi yêu cầu"
          cancelText="Hủy"
          width={700}
        >
          {selectedPolicy && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p>
                  <strong>Số hợp đồng:</strong> {selectedPolicy.policy_number}
                </p>
                <p>
                  <strong>Mã nông dân:</strong> {selectedPolicy.farmer_id}
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Loại yêu cầu <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={cancelRequestType}
                  onChange={(e) => setCancelRequestType(e.target.value)}
                >
                  <option value="policyholder_request">
                    Yêu cầu từ nông dân
                  </option>
                  <option value="contract_violation">Vi phạm hợp đồng</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={4}
                  placeholder="Nhập lý do yêu cầu hủy hợp đồng..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Số tiền bồi thường (nếu có)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  min="0"
                  value={compensateAmount}
                  onChange={(e) =>
                    setCompensateAmount(parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 mt-1">VND</p>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Bằng chứng đính kèm (Tùy chọn)
                </label>
                <CustomForm
                  ref={formRef}
                  fields={generateEvidenceFields(evidenceFields)}
                  onValuesChange={(changedValues, allValues) => {
                    // Transform form values into evidenceFields array
                    const newEvidenceFields = [];
                    const keys = Object.keys(allValues).filter((k) =>
                      k.startsWith("evidence_")
                    );
                    const evidenceIndices = new Set();

                    keys.forEach((k) => {
                      const match = k.match(/^evidence_(\d+)_/);
                      if (match) evidenceIndices.add(parseInt(match[1]));
                    });

                    evidenceIndices.forEach((idx) => {
                      const key = allValues[`evidence_${idx}_key`];
                      const value = allValues[`evidence_${idx}_value`];
                      if (key) {
                        newEvidenceFields[idx] = { key, value, images: [] };
                      }
                    });

                    setEvidenceFields(newEvidenceFields.filter((f) => f));
                  }}
                />
                <Button
                  type="dashed"
                  className="mt-3"
                  onClick={() => {
                    setEvidenceFields([
                      ...evidenceFields,
                      { key: "", value: "", images: [] },
                    ]);
                  }}
                >
                  + Thêm bằng chứng
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                ⚠️ Sau khi gửi yêu cầu, hợp đồng sẽ chuyển sang trạng thái "Chờ
                hủy" và bên bảo hiểm sẽ xem xét trong vòng 24-48 giờ.
              </p>
            </div>
          )}
        </Modal>
      </div>
    </Layout.Content>
  );
}
