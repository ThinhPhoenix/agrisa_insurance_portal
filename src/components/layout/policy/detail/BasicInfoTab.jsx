import { Card, Descriptions, Space, Tag, Typography, Button } from "antd";
import { DownloadOutlined, EnvironmentOutlined } from "@ant-design/icons";

const { Text } = Typography;

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
      <Space direction="vertical" size="large" className="w-full">
        {/* Policy Info Section */}
        <div>
          <Text strong className="text-base block mb-3">
            Thông tin hợp đồng
          </Text>
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "50%" }}
            contentStyle={{ width: "50%" }}
          >
            <Descriptions.Item label="Số hợp đồng">
              <Text strong>{policy.policy_number}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã nông dân">
              {policy.farmer_id}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền bảo hiểm">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(policy.coverage_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="Phí bảo hiểm">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(policy.total_farmer_premium)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày trồng">
              {new Date(policy.planting_date * 1000).toLocaleDateString(
                "vi-VN"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc bảo hiểm">
              {new Date(policy.coverage_end_date * 1000).toLocaleDateString(
                "vi-VN"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(policy.created_at).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(policy.status)}>
                {getStatusText(policy.status)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Farm Info Section */}
        <div>
          <Text strong className="text-base block mb-3">
            <EnvironmentOutlined /> Thông tin trang trại
          </Text>
          {farm ? (
            <Descriptions
              column={1}
              size="small"
              bordered
              labelStyle={{ width: "50%" }}
              contentStyle={{ width: "50%" }}
            >
              <Descriptions.Item label="Tên trang trại">
                {farm.farm_name}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {farm.address}, {farm.commune}, {farm.district},{" "}
                {farm.province}
              </Descriptions.Item>
              <Descriptions.Item label="Diện tích">
                {farm.area_sqm} ha
              </Descriptions.Item>
              <Descriptions.Item label="Loại cây trồng">
                <Tag color="green">
                  {CROP_TYPE_LABELS[farm.crop_type] || farm.crop_type}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Text type="secondary">
              Không tìm thấy thông tin trang trại
            </Text>
          )}
        </div>

        {/* Signed Document Section */}
        {policy.signed_policy_document_url && (
          <div>
            <Text strong className="text-base block mb-3">
              Hợp đồng đã ký
            </Text>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() =>
                window.open(policy.signed_policy_document_url, "_blank")
              }
            >
              Xem hợp đồng đã ký (PDF)
            </Button>
          </div>
        )}
      </Space>
    </Card>
  );
}
