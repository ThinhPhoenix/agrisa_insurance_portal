import useClaim from "@/services/hooks/claim/use-claim";
import CustomTable from "@/components/custom-table";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Space, Spin, Typography } from "antd";
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
      width: 160,
      fixed: "left",
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>{text}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status) => {
        const colorMap = {
          generated: '#595959',
          pending_partner_review: '#d46b08',
          approved: '#18573f',
          rejected: '#cf1322',
          paid: '#096dd9',
        };
        return (
          <Text strong style={{ fontSize: '13px', color: colorMap[status] || '#595959' }}>
            {getStatusText(status)}
          </Text>
        );
      },
    },
    {
      title: "Số tiền bồi thường",
      dataIndex: "claim_amount",
      key: "claim_amount",
      width: 180,
      render: (amount) => (
        <Text strong style={{ fontSize: '15px', color: '#1890ff' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Bồi thường cố định",
      dataIndex: "calculated_fix_payout",
      key: "calculated_fix_payout",
      width: 170,
      render: (amount) => <Text>{formatCurrency(amount)}</Text>,
    },
    {
      title: "Bồi thường theo ngưỡng",
      dataIndex: "calculated_threshold_payout",
      key: "calculated_threshold_payout",
      width: 190,
      render: (amount) => <Text>{formatCurrency(amount)}</Text>,
    },
    {
      title: "Giá trị vượt ngưỡng",
      dataIndex: "over_threshold_value",
      key: "over_threshold_value",
      width: 170,
      render: (value) => value ? (
        <Text strong style={{ fontSize: '13px', color: '#d46b08' }}>
          {value.toFixed(2)}%
        </Text>
      ) : "-",
    },
    {
      title: "Phương thức",
      dataIndex: "auto_generated",
      key: "auto_generated",
      width: 130,
      render: (auto) => (
        <Text strong style={{ fontSize: '13px', color: auto ? '#096dd9' : '#595959' }}>
          {auto ? (
            <span><InfoCircleOutlined /> Tự động</span>
          ) : (
            <span>Thủ công</span>
          )}
        </Text>
      ),
    },
    {
      title: "Thời điểm kích hoạt",
      dataIndex: "trigger_timestamp",
      key: "trigger_timestamp",
      width: 160,
      render: (timestamp) => (
        <Text type="secondary" style={{ fontSize: '13px' }}>
          {formatDate(timestamp)}
        </Text>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: '13px' }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Link href={`/claim/detail?id=${record.id}`}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
          >
            Xem chi tiết
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
    (c) => c.status === "approved" || c.status === "paid"
  ).length;
  const pendingCount = claimsByPolicy.filter(
    (c) => c.status === "pending_partner_review" || c.status === "generated"
  ).length;

  return (
    <Space direction="vertical" size="large" className="w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-blue-100 p-4 rounded-xl">
              <FileTextOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            </div>
            <div className="flex-1">
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Tổng số bồi thường
              </Text>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff', lineHeight: '1' }}>
                {claimsByPolicy.length}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                yêu cầu
              </Text>
            </div>
          </div>
        </Card>

        <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-green-100 p-4 rounded-xl">
              <CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />
            </div>
            <div className="flex-1">
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Đã phê duyệt
              </Text>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a', lineHeight: '1' }}>
                {approvedCount}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                yêu cầu
              </Text>
            </div>
          </div>
        </Card>

        <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-orange-100 p-4 rounded-xl">
              <WalletOutlined style={{ fontSize: 32, color: "#faad14" }} />
            </div>
            <div className="flex-1">
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Tổng số tiền
              </Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14', lineHeight: '1.2' }}>
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Claims Table */}
      <div className="mt-4">
        <CustomTable
          columns={columns}
          dataSource={claimsByPolicy}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} yêu cầu bồi thường`,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </div>
    </Space>
  );
};

export default ClaimsTab;
