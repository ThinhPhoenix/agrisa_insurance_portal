"use client";
import {
  Card,
  Col,
  Divider,
  Image,
  Rate,
  Row,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  Building,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useEffect } from "react";
import { useGetPartnerProfile } from "@/services/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth-store";
import "./profile.css";

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { getPartnerProfile, isLoading, error, data } = useGetPartnerProfile();

  useEffect(() => {
    const fetchProfile = async () => {
      let partnerId = null;
      try {
        const meData = localStorage.getItem("me");
        if (meData) {
          const me = JSON.parse(meData);
          partnerId = me.partner_id;
        }
      } catch (e) {
        console.error("Failed to parse me data from localStorage:", e);
      }

      if (!partnerId) {
        partnerId = user?.user?.partner_id || user?.profile?.partner_id;
      }

      if (!partnerId) {
        message.error("Không tìm thấy thông tin đối tác");
        return;
      }

      const result = await getPartnerProfile(partnerId);
      if (!result.success) {
        message.error(result.message || "Không thể tải thông tin đối tác");
      }
    };

    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" tip="Đang tải thông tin đối tác..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Text type="danger">Không thể tải thông tin đối tác</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <Row align="middle" gutter={16}>
          <Col>
            {data.partner_logo_url ? (
              <Image
                src={data.partner_logo_url}
                alt={data.partner_display_name}
                preview={false}
                width={80}
                height={80}
                style={{ borderRadius: "8px", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "8px",
                  backgroundColor: "#f6ffed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#52c41a",
                }}
              >
                {data.partner_display_name?.charAt(0) || "P"}
              </div>
            )}
          </Col>
          <Col flex={1}>
            <Title level={3} style={{ margin: 0 }}>
              {data.partner_display_name}
            </Title>
            <Text type="secondary">{data.partner_tagline}</Text>
            <div style={{ marginTop: 8 }}>
              <Rate
                disabled
                value={data.partner_rating_score}
                style={{ fontSize: 16 }}
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {data.partner_rating_score} ({data.partner_rating_count} đánh giá)
              </Text>
            </div>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={6}>
            <Text type="secondary">Kinh nghiệm:</Text>
            <br />
            <Text strong>{data.trust_metric_experience} năm</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Khách hàng:</Text>
            <br />
            <Text strong>{data.trust_metric_clients.toLocaleString()} hộ</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Tỷ lệ chi trả:</Text>
            <br />
            <Text strong style={{ color: "#52c41a" }}>
              {data.trust_metric_claim_rate}%
            </Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Tổng chi trả:</Text>
            <br />
            <Text strong style={{ color: "#faad14" }}>{data.total_payouts}</Text>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row gutter={24}>
        {/* Left Content - Details */}
        <Col span={16}>
          <Card>
            <Title level={4}>Giới thiệu</Title>
            <Paragraph>{data.partner_description}</Paragraph>
            <Paragraph>
              <Text strong>Tagline:</Text> {data.partner_tagline}
            </Paragraph>
            <Paragraph>
              <Text strong>Kinh nghiệm:</Text> {data.trust_metric_experience} năm hoạt động trong lĩnh vực bảo hiểm nông nghiệp
            </Paragraph>
            {data.year_established && (
              <Paragraph>
                <Text strong>Năm thành lập:</Text> {data.year_established}
              </Paragraph>
            )}
            {data.legal_company_name && (
              <Paragraph>
                <Text strong>Tên pháp lý:</Text> {data.legal_company_name}
              </Paragraph>
            )}

            <Divider />

            <Title level={4}>Chi tiết dịch vụ</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Paragraph>
                  <Text type="secondary">Thời gian xác nhận:</Text>
                  <br />
                  <Text>{data.confirmation_timeline}</Text>
                </Paragraph>
              </Col>
              <Col span={12}>
                <Paragraph>
                  <Text type="secondary">Thời gian thanh toán TB:</Text>
                  <br />
                  <Text>{data.average_payout_time}</Text>
                </Paragraph>
              </Col>
            </Row>

            <Paragraph>
              <Text type="secondary">Khu vực phục vụ:</Text>
              <br />
              {data.operating_provinces ? (
                <div style={{ marginTop: 8 }}>
                  {data.operating_provinces.map((province, index) => (
                    <Tag key={index} color="green">
                      {province}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text>{data.coverage_areas}</Text>
              )}
            </Paragraph>

            {data.support_hours && (
              <Paragraph>
                <Text type="secondary">Giờ hỗ trợ:</Text>
                <br />
                <Text>{data.support_hours}</Text>
              </Paragraph>
            )}

            {data.authorized_insurance_lines && data.authorized_insurance_lines.length > 0 && (
              <Paragraph>
                <Text type="secondary">Loại hình bảo hiểm được phép:</Text>
                <br />
                <div style={{ marginTop: 8 }}>
                  {data.authorized_insurance_lines.map((line, index) => (
                    <Tag key={index} color="gold">
                      {line}
                    </Tag>
                  ))}
                </div>
              </Paragraph>
            )}
          </Card>
        </Col>

        {/* Right Content - Contact Info */}
        <Col span={8}>
          <Card title="Thông tin liên hệ">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <Mail size={16} style={{ marginRight: 8, color: "#52c41a" }} />
                <Text>{data.partner_official_email}</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <Phone size={16} style={{ marginRight: 8, color: "#52c41a" }} />
                <Text>{data.partner_phone}</Text>
              </div>
              {data.customer_service_hotline && (
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  <Phone size={16} style={{ marginRight: 8, color: "#52c41a" }} />
                  <Text>Hotline: {data.customer_service_hotline}</Text>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 12 }}>
                <MapPin size={16} style={{ marginRight: 8, marginTop: 4, color: "#52c41a" }} />
                <Text>{data.head_office_address}</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <Building size={16} style={{ marginRight: 8, color: "#52c41a" }} />
                <Text>{data.partner_website}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
