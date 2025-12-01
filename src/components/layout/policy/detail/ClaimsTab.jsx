import useClaim from "@/services/hooks/claim/use-claim";
import {
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Spin, Table, Tag, Typography } from "antd";
import Link from "next/link";
import { useEffect } from "react";

const { Text } = Typography;

/**
 * ClaimsTab - Hiển thị danh sách claims theo policy_id
 */
const ClaimsTab = ({ policyId }) => {
  const {
    claimsByPolicy,
    claimsByPolicyLoading,
    claimsByPolicyError,
    fetchClaimsByPolicy,
  } = useClaim();

  useEffect(() => {
    if (policyId) {
      fetchClaimsByPolicy(policyId);
    }
  }, [policyId, fetchClaimsByPolicy]);

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
        return "Chờ đối tác duyệt";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      case "paid":
        return "Đã thanh toán";
      default:
        return status;
    }
  };

  // Format date from epoch timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date =
      timestamp < 5000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString("vi-VN");
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: "Bồi thường cố định",
      dataIndex: "calculated_fix_payout",
      key: "calculated_fix_payout",
      width: 180,
      render: (amount) => formatCurrency(amount),
    },
    {
      title: "Bồi thường ngưỡng",
      dataIndex: "calculated_threshold_payout",
      key: "calculated_threshold_payout",
      width: 180,
      render: (amount) => formatCurrency(amount),
    },
    {
      title: "Tự động tạo",
      dataIndex: "auto_generated",
      key: "auto_generated",
      width: 120,
      render: (auto) =>
        auto ? <Tag color="blue">Tự động</Tag> : <Tag>Thủ công</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
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

  if (claimsByPolicyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải danh sách bồi thường..." />
      </div>
    );
  }

  if (claimsByPolicyError) {
    return (
      <Alert
        message="Lỗi"
        description={claimsByPolicyError}
        type="error"
        showIcon
      />
    );
  }

  if (!claimsByPolicy || claimsByPolicy.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
          <Text type="secondary" className="mt-4">
            Chưa có yêu cầu bồi thường nào cho đơn bảo hiểm này
          </Text>
        </div>
      </Card>
    );
  }

  // Calculate summary
  const totalAmount = claimsByPolicy.reduce(
    (sum, claim) => sum + (claim.claim_amount || 0),
    0
  );
  const approvedCount = claimsByPolicy.filter(
    (c) => c.status === "approved"
  ).length;
  const pendingCount = claimsByPolicy.filter(
    (c) => c.status === "pending_partner_review"
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card size="small">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Tổng bồi thường</Text>
              <div className="text-2xl font-bold">{claimsByPolicy.length}</div>
            </div>
            <FileTextOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          </div>
        </Card>

        <Card size="small">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Đã duyệt</Text>
              <div className="text-2xl font-bold text-green-600">
                {approvedCount}
              </div>
            </div>
            <CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />
          </div>
        </Card>

        <Card size="small">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Tổng số tiền</Text>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <InfoCircleOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          </div>
        </Card>
      </div>

      {/* Claims Table */}
      <Card title="Danh sách bồi thường">
        <Table
          columns={columns}
          dataSource={claimsByPolicy}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bản ghi`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Card>
    </div>
  );
};

export default ClaimsTab;
