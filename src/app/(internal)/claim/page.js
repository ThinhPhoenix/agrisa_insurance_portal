"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { formatUtcDate } from "@/libs/date-utils";
import { getApprovalInfo } from "@/libs/message";
import useClaim from "@/services/hooks/claim/use-claim";
import { statusFilter, useFilterableList } from "@/services/hooks/common";
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
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Descriptions,
  Layout,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import "../policy/policy.css";

const { Title, Text } = Typography;

export default function ClaimListPage() {
  const {
    claims,
    claimsLoading,
    claimsError,
    fetchClaims,
    fetchRejectionByClaim,
  } = useClaim();

  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [loadingRejection, setLoadingRejection] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const {
    paginatedData,
    filteredData: filteredClaims,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    visibleColumns,
    setColumns: setVisibleColumns,
    getSummaryStats,
  } = useFilterableList(claims || [], {
    searchFields: ["claim_number", "id"],
    defaultFilters: {
      search: "",
      status: "",
    },
    defaultVisibleColumns: [
      "claim_number",
      "status",
      "claim_amount",
      "over_threshold_value",
      "auto_generated",
      "created_at",
    ],
    defaultPageSize: 10,
    filterHandlers: {
      search: (item, value) => {
        if (!value) return true;
        const searchLower = value.toLowerCase();
        return (
          item.claim_number?.toLowerCase().includes(searchLower) ||
          item.id?.toLowerCase().includes(searchLower)
        );
      },
      status: (item, value) => statusFilter(item, value, "status"),
    },
  });

  // Calculate summary stats
  const summaryStats = getSummaryStats({
    total: { type: "count" },
    pendingReview: {
      type: "count",
      filterFn: (c) =>
        c.status === "pending_partner_review" || c.status === "generated",
    },
    approved: {
      type: "count",
      filterFn: (c) => c.status === "approved" || c.status === "paid",
    },
    totalAmount: {
      type: "sum",
      field: "claim_amount",
    },
  });

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

  // Handle view rejection details
  const handleViewRejection = async (claimId) => {
    setLoadingRejection(true);
    setRejectionModalVisible(true);
    setSelectedRejection(null);

    const result = await fetchRejectionByClaim(claimId);

    if (result.success) {
      setSelectedRejection(result.data);
    } else {
      setSelectedRejection({ error: result.error });
    }

    setLoadingRejection(false);
  };

  // Table columns
  const columns = [
    {
      title: "Mã Chi trả",
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
      title: "Số tiền chi trả",
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
      title: "Chi trả cố định",
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
      title: "Chi trả theo ngưỡng",
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
      render: (value) => (value ? `${value.toFixed(2)}` : "-"),
    },
    {
      title: "Phương thức tạo",
      dataIndex: "auto_generated",
      key: "auto_generated",
      width: 140,
      render: (auto) =>
        auto ? <Tag color="blue">Tự động</Tag> : <Tag>Thủ công</Tag>,
    },
    {
      title: "Thời điểm kích hoạt",
      dataIndex: "trigger_timestamp",
      key: "trigger_timestamp",
      width: 150,
      render: (timestamp) => formatUtcDate(timestamp),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => formatUtcDate(date),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space size="small">
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
          {record.status === "rejected" && (
            <Button
              danger
              size="small"
              onClick={() => handleViewRejection(record.id)}
              icon={<CloseCircleOutlined />}
            >
              Lý do từ chối
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Search fields
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo mã Chi trả...",
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      placeholder: "Chọn trạng thái",
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
              Quản Lý Chi trả
            </Title>
            <Text className="insurance-subtitle">
              Theo dõi và quản lý các yêu cầu Chi trả bảo hiểm nông nghiệp
            </Text>
          </div>
          <div>
            <Link href="/claim/rejection">
              <Button type="default" icon={<CloseCircleOutlined />}>
                Xem danh sách từ chối
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
                Tổng Chi trả
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
              <div className="insurance-summary-label-compact">Chờ duyệt</div>
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
              <div className="insurance-summary-label-compact">
                Đã phê duyệt
              </div>
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

      {/* Rejection Details Modal */}
      <Modal
        title="Chi tiết lý do từ chối Chi trả"
        open={rejectionModalVisible}
        onCancel={() => {
          setRejectionModalVisible(false);
          setSelectedRejection(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setRejectionModalVisible(false);
              setSelectedRejection(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {loadingRejection ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" tip="Đang tải thông tin từ chối..." />
          </div>
        ) : selectedRejection?.error ? (
          <div className="text-center py-8">
            <Text type="danger">{selectedRejection.error}</Text>
          </div>
        ) : selectedRejection ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Loại từ chối">
              <Tag color="red">
                {getRejectionTypeText(selectedRejection.claim_rejection_type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lý do từ chối">
              {selectedRejection.reason}
            </Descriptions.Item>
            <Descriptions.Item label="Người đánh giá">
              {selectedRejection.validated_by}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú chi tiết">
              {selectedRejection.validation_notes}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian đánh giá">
              {formatUtcDate(selectedRejection.validation_timestamp)}
            </Descriptions.Item>
            {selectedRejection.reason_evidence &&
              Object.keys(selectedRejection.reason_evidence).length > 0 && (
                <Descriptions.Item label="Bằng chứng chi tiết">
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: "1",
                        label: "Xem bằng chứng chi tiết",
                        children: (
                          <div className="space-y-2">
                            {selectedRejection.reason_evidence.event_date && (
                              <div>
                                <Text strong>Ngày sự kiện: </Text>
                                <Text>
                                  {selectedRejection.reason_evidence.event_date}
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .policy_clause && (
                              <div>
                                <Text strong>Điều khoản chính sách: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .policy_clause
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .claimed_value && (
                              <div>
                                <Text strong>Giá trị yêu cầu: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .claimed_value
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .measured_value && (
                              <div>
                                <Text strong>Giá trị đo được: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .measured_value
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .threshold_value && (
                              <div>
                                <Text strong>Ngưỡng kích hoạt: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .threshold_value
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .blackout_period_start && (
                              <div>
                                <Text strong>Bắt đầu giai đoạn loại trừ: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .blackout_period_start
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .blackout_period_end && (
                              <div>
                                <Text strong>
                                  Kết thúc giai đoạn loại trừ:{" "}
                                </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .blackout_period_end
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .discrepancy_percent && (
                              <div>
                                <Text strong>Phần trăm chênh lệch: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .discrepancy_percent
                                  }
                                  %
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence.data_source && (
                              <div>
                                <Text strong>Nguồn dữ liệu: </Text>
                                <Text>
                                  {
                                    selectedRejection.reason_evidence
                                      .data_source
                                  }
                                </Text>
                              </div>
                            )}
                            {selectedRejection.reason_evidence
                              .evidence_documents &&
                              selectedRejection.reason_evidence
                                .evidence_documents.length > 0 && (
                                <div>
                                  <Text strong>Tài liệu bằng chứng: </Text>
                                  <ul className="ml-4 mt-1">
                                    {selectedRejection.reason_evidence.evidence_documents.map(
                                      (doc, idx) => (
                                        <li key={idx}>
                                          <Text>{doc}</Text>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        ),
                      },
                    ]}
                  />
                </Descriptions.Item>
              )}
          </Descriptions>
        ) : (
          <div className="text-center py-8">
            <Text type="secondary">Không có thông tin từ chối</Text>
          </div>
        )}
      </Modal>
    </Layout.Content>
  );
}
