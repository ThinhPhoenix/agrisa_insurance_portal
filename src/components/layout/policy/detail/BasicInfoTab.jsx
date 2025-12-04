import {
  CalendarOutlined,
  DollarOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HomeOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Card, Descriptions, Divider, Tag, Typography } from "antd";

const { Text, Title } = Typography;

// Crop type translation
const CROP_TYPE_LABELS = {
  rice: "Lúa",
  coffee: "Cà phê",
  corn: "Ngô",
  wheat: "Lúa mì",
  tea: "Chè",
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "green";
    case "rejected":
      return "red";
    case "pending_review":
      return "orange";
    case "pending_payment":
      return "gold";
    case "pending":
    case "draft":
      return "blue";
    case "expired":
      return "default";
    case "cancelled":
      return "volcano";
    default:
      return "default";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "draft":
      return "Nháp";
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

export default function BasicInfoTab({ policy, farm }) {
  return (
    <Card>
      {/* Policy Info Section */}
      <div className="flex items-center gap-2 mb-4">
        <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
        <Title level={4} style={{ margin: 0 }}>Thông tin hợp đồng</Title>
      </div>
      <Descriptions
        column={{ xs: 1, sm: 1, md: 2 }}
        size="small"
        labelStyle={{ fontWeight: 500 }}
      >
        <Descriptions.Item label="Số hợp đồng">
          <Text strong>{policy.policy_number}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={getStatusColor(policy.status)}>
            {getStatusText(policy.status)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserOutlined /> Mã nông dân</span>}>
          {policy.farmer_id}
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarOutlined /> Ngày tạo</span>}>
          {new Date(policy.created_at).toLocaleDateString("vi-VN")}
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarOutlined /> Số tiền bảo hiểm</span>}>
          <Text strong style={{ color: '#52c41a' }}>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(policy.coverage_amount)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarOutlined /> Phí bảo hiểm</span>}>
          <Text strong style={{ color: '#1890ff' }}>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(policy.total_farmer_premium)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarOutlined /> Ngày trồng</span>}>
          {new Date(policy.planting_date * 1000).toLocaleDateString(
            "vi-VN"
          )}
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarOutlined /> Ngày kết thúc BH</span>}>
          {new Date(policy.coverage_end_date * 1000).toLocaleDateString(
            "vi-VN"
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* Farm Info Section */}
      <div className="flex items-center gap-2 mb-4">
        <EnvironmentOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
        <Title level={4} style={{ margin: 0 }}>Thông tin trang trại</Title>
      </div>
      {farm ? (
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="small"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HomeOutlined /> Tên trang trại</span>}>
            <Text strong>{farm.farm_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Diện tích">
            <Text strong>{farm.area_sqm} ha</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loại cây trồng" span={2}>
            <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
              {CROP_TYPE_LABELS[farm.crop_type] || farm.crop_type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EnvironmentOutlined /> Địa chỉ</span>} span={2}>
            {farm.address}, {farm.commune}, {farm.district}, {farm.province}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Text type="secondary">
          Không tìm thấy thông tin trang trại
        </Text>
      )}

      {/* Signed Document Section */}
      {policy.signed_policy_document_url && (
        <>
          <Divider />
          <div className="flex items-center gap-2 mb-4">
            <FileTextOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
            <Title level={4} style={{ margin: 0 }}>Hợp đồng đã ký</Title>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={() =>
              window.open(policy.signed_policy_document_url, "_blank")
            }
          >
            Xem hợp đồng đã ký (PDF)
          </Button>
        </>
      )}
    </Card>
  );
}
