import GlassmorphismBadge from "@/components/layout/policy/detail/glassmorphism-badge";
import { useGetPublicUser } from "@/services/hooks/profile/use-profile";
import {
  CalendarOutlined,
  DollarOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HomeOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Card, Descriptions, Divider, Typography } from "antd";
import { useEffect, useState } from "react";

const { Text, Title } = Typography;

// Crop type translation
const CROP_TYPE_LABELS = {
  rice: "Lúa",
  coffee: "Cà phê",
  corn: "Ngô",
  wheat: "Lúa mì",
  tea: "Chè",
};

const CROP_TYPE_COLORS = {
  rice: "#18573f",
  coffee: "#d46b08",
  corn: "#d48806",
  wheat: "#ad8b00",
  tea: "#389e0d",
};

export default function BasicInfoTab({ policy, farm }) {
  const { getPublicUser } = useGetPublicUser();
  const [farmerLabel, setFarmerLabel] = useState(
    policy?.farmer_id ? `Nông dân đăng kí ${policy.farmer_id}` : ""
  );

  useEffect(() => {
    let mounted = true;
    const id = policy?.farmer_id;
    if (!id) return;

    // attempt to fetch public user display name; fallback to id label
    getPublicUser(id)
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data?.display_name) {
          setFarmerLabel(res.data.display_name);
        } else {
          setFarmerLabel(`Nông dân đăng kí ${id}`);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setFarmerLabel(`Nông dân đăng kí ${id}`);
      });

    return () => {
      mounted = false;
    };
  }, [policy?.farmer_id, getPublicUser]);
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
          <GlassmorphismBadge status={policy.status} />
        </Descriptions.Item>
        <Descriptions.Item label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserOutlined /> Nông dân đăng kí</span>}>
          <Text strong>{farmerLabel || policy.farmer_id}</Text>
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
            <Text strong style={{ fontSize: '15px', color: CROP_TYPE_COLORS[farm.crop_type] || '#18573f' }}>
              {CROP_TYPE_LABELS[farm.crop_type] || farm.crop_type}
            </Text>
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
