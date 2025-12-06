"use client";
import { useGetPartnerProfile } from "@/services/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth-store";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Divider,
  Image,
  message,
  Rate,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useEffect } from "react";
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
      {/* Cover Photo + Avatar Header */}
      <div
        style={{
          position: "relative",
          marginBottom: 24,
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#f0f2f5",
        }}
      >
        {/* Cover Photo Background */}
        <div
          style={{
            height: 280,
            backgroundImage: `url(${data.cover_photo_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "relative",
          }}
        >
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)",
            }}
          />
        </div>

        {/* Avatar + Info Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "24px",
            background:
              "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)",
            display: "flex",
            alignItems: "flex-end",
            gap: 20,
          }}
        >
          {/* Logo Avatar */}
          <div
            style={{
              flex: "0 0 auto",
            }}
          >
            {data.partner_logo_url ? (
              <Image
                src={data.partner_logo_url}
                alt={data.partner_display_name}
                preview={false}
                width={120}
                height={120}
                style={{
                  borderRadius: "12px",
                  objectFit: "cover",
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "12px",
                  backgroundColor: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  fontWeight: "bold",
                  color: "white",
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                {data.partner_display_name?.charAt(0) || "P"}
              </div>
            )}
          </div>

          {/* Title + Tagline */}
          <div style={{ flex: "1 1 auto", paddingBottom: 12 }}>
            <Title
              level={2}
              style={{ margin: 0, marginBottom: 8, color: "#000" }}
            >
              {data.partner_display_name}
            </Title>
            <Text style={{ fontSize: 16, color: "#595959" }}>
              {data.partner_tagline}
            </Text>
            <div style={{ marginTop: 12 }}>
              <Rate
                disabled
                value={data.partner_rating_score || 0}
                style={{ fontSize: 14 }}
              />
              <Text style={{ marginLeft: 12, color: "#8c8c8c" }}>
                {data.partner_rating_score?.toFixed(1) || "0"} (
                {data.partner_rating_count || 0} đánh giá)
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Metrics */}
      <Row gutter={12}>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <CalendarOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Kinh nghiệm</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#000",
                marginTop: 4,
              }}
            >
              {data.trust_metric_experience} năm
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <TeamOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Khách hàng</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#000",
                marginTop: 4,
              }}
            >
              {(data.trust_metric_clients / 1000).toLocaleString("vi-VN", {
                maximumFractionDigits: 0,
              })}
              K
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Tỷ lệ chi trả</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#52c41a",
                marginTop: 4,
              }}
            >
              {data.trust_metric_claim_rate}%
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <StarOutlined style={{ fontSize: 20, color: "#faad14" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Tổng chi trả</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#000",
                marginTop: 4,
              }}
            >
              {data.total_payouts}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content - Full Width Vertical Layout */}
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #f0f0f0",
        }}
      >
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          Giới thiệu
        </Title>
        <Typography.Paragraph
          style={{
            color: "#595959",
            lineHeight: 1.8,
            marginBottom: 16,
          }}
        >
          {data.partner_description}
        </Typography.Paragraph>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24}>
            <Text strong>Năm thành lập:</Text>
            <br />
            <Text style={{ color: "#8c8c8c" }}>
              {data.year_established || "—"}
            </Text>
          </Col>
          <Col xs={24} sm={24}>
            <Text strong>Tên pháp lý:</Text>
            <br />
            <Text style={{ color: "#8c8c8c" }}>
              {data.legal_company_name || "—"}
            </Text>
          </Col>
          <Col xs={24} sm={24}>
            <Text strong>Tên gọi kinh doanh:</Text>
            <br />
            <Text style={{ color: "#8c8c8c" }}>
              {data.partner_trading_name || "—"}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Service Details */}
      <Card style={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}>
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          Chi tiết dịch vụ
        </Title>

        <Row gutter={[16, 24]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <ClockCircleOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Thời gian xác nhận</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>
                {data.confirmation_timeline}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <CalendarOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Thời gian thanh toán TB</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>
                {data.average_payout_time}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <ClockCircleOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Giờ hỗ trợ</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>{data.support_hours}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <EnvironmentOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Khu vực phục vụ</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>{data.coverage_areas}</Text>
            </Space>
          </Col>
        </Row>

        {data.operating_provinces && data.operating_provinces.length > 0 && (
          <>
            <Divider style={{ margin: "24px 0" }} />
            <div>
              <Text strong>Tỉnh/Thành phố phục vụ:</Text>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {data.operating_provinces.map((province, index) => (
                  <Tag key={index} color="blue">
                    {province}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}

        {data.authorized_insurance_lines &&
          data.authorized_insurance_lines.length > 0 && (
            <>
              <Divider style={{ margin: "24px 0" }} />
              <div>
                <Text strong>Loại hình bảo hiểm được phép:</Text>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {data.authorized_insurance_lines.map((line, index) => (
                    <Tag key={index} color="cyan">
                      {line.replace(/_/g, " ").toUpperCase()}
                    </Tag>
                  ))}
                </div>
              </div>
            </>
          )}
      </Card>

      {/* Contact Information */}
      <Card
        title="Thông tin liên hệ"
        style={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MailOutlined
              style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                Email chính thức
              </div>
              <a
                href={`mailto:${data.partner_official_email}`}
                style={{ color: "#1890ff" }}
              >
                {data.partner_official_email}
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PhoneOutlined
              style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                Điện thoại
              </div>
              <a
                href={`tel:${data.partner_phone}`}
                style={{ color: "#1890ff" }}
              >
                {data.partner_phone}
              </a>
            </div>
          </div>

          {data.customer_service_hotline && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PhoneOutlined
                style={{ fontSize: 18, color: "#52c41a", flex: "0 0 auto" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}
                >
                  Hotline hỗ trợ khách hàng
                </div>
                <a
                  href={`tel:${data.customer_service_hotline}`}
                  style={{ color: "#52c41a" }}
                >
                  {data.customer_service_hotline}
                </a>
              </div>
            </div>
          )}

          {data.fax_number && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileTextOutlined
                style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}
                >
                  Fax
                </div>
                <Text style={{ color: "#595959" }}>{data.fax_number}</Text>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <EnvironmentOutlined
              style={{
                fontSize: 18,
                color: "#1890ff",
                flex: "0 0 auto",
                marginTop: 2,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                Văn phòng đại diện
              </div>
              <Text style={{ color: "#595959", lineHeight: 1.6 }}>
                {data.head_office_address}
              </Text>
              {data.province_name && (
                <>
                  <br />
                  <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                    {data.province_name}
                  </Text>
                </>
              )}
            </div>
          </div>

          {data.partner_website && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <GlobalOutlined
                style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}
                >
                  Website
                </div>
                <a
                  href={data.partner_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1890ff" }}
                >
                  {data.partner_website}
                </a>
              </div>
            </div>
          )}
        </Space>
      </Card>

      {/* Company Information */}
      <Card
        title="Thông tin công ty"
        style={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text type="secondary">Mã số thuế:</Text>
            <br />
            <Text strong>{data.tax_identification_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Số giấy phép kinh doanh:</Text>
            <br />
            <Text strong>{data.business_registration_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Số giấy phép bảo hiểm:</Text>
            <br />
            <Text strong>{data.insurance_license_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Ngày cấp giấy phép:</Text>
            <br />
            <Text strong>
              {data.license_issue_date
                ? new Date(data.license_issue_date).toLocaleDateString("vi-VN")
                : "—"}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Ngày hết hạn giấy phép:</Text>
            <br />
            <Text strong>
              {data.license_expiry_date
                ? new Date(data.license_expiry_date).toLocaleDateString("vi-VN")
                : "—"}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Loại công ty:</Text>
            <br />
            <Text strong>
              {data.company_type === "domestic"
                ? "Trong nước"
                : data.company_type}
            </Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
