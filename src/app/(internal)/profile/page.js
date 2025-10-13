"use client";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Image,
  Rate,
  Row,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  Building,
  Edit,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import CustomerViewModal from "../../../components/layout/profile/CustomerViewModal";
import mockData from "./mockdata.json";
import "./profile.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Meta } = Card;

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("company");
  const [isCustomerViewModalVisible, setIsCustomerViewModalVisible] =
    useState(false);

  // Force navigation function for auth to internal route transitions
  const forceNavigate = (path) => {
    const isAuthRoute =
      pathname.startsWith("/signin") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/profile");
    const isInternalRoute =
      path.startsWith("/dashboard") ||
      path.startsWith("/portal") ||
      (path.startsWith("/") &&
        !path.startsWith("/signin") &&
        !path.startsWith("/signup") &&
        !path.startsWith("/profile"));

    if (isAuthRoute && isInternalRoute) {
      window.location.href = path;
    } else {
      router.push(path);
    }
  };

  // Dynamically get data from mock data
  const data = mockData;

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Render activity dot based on type
  const renderActivityDot = (type) => {
    const className = `activity-dot ${type}`;
    return <div className={className}></div>;
  };

  return (
    <div className="profile-container">
      <div className="resume-page">
        {/* Resume Header */}
        <div
          className="resume-header"
          style={{
            background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${data.cover_photo_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="partner-logo-container mr-4">
                <Image
                  src={data.partner_logo_url}
                  alt={data.partner_name}
                  preview={false}
                  className="partner-logo"
                  width={80}
                  height={80}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
              <div>
                <Title level={2}>{data.partner_name}</Title>
                <Text>{data.partner_tagline}</Text>
                <div className="flex items-center">
                  <Rate
                    disabled
                    defaultValue={data.partner_rating_score}
                    className="mr-2"
                  />
                  <Text>
                    {data.partner_rating_score} ({data.partner_rating_count}{" "}
                    đánh giá)
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Content */}
        <div className="resume-content">
          {/* Left Sidebar */}
          <div className="resume-sidebar">
            {/* Contact Information */}
            <div className="resume-section">
              <h3 className="resume-section-title">THÔNG TIN LIÊN HỆ</h3>
              <div className="contact-item">
                <Mail size={16} className="contact-icon" />
                <Text className="text-secondary-900">{data.partner_email}</Text>
              </div>
              <div className="contact-item">
                <Phone size={16} className="contact-icon" />
                <Text className="text-secondary-900">{data.partner_phone}</Text>
              </div>
              <div className="contact-item">
                <MapPin size={16} className="contact-icon" />
                <Text className="text-secondary-900">
                  {data.partner_address}
                </Text>
              </div>
              <div className="contact-item">
                <Building size={16} className="contact-icon" />
                <Text className="text-secondary-900">
                  {data.partner_website}
                </Text>
              </div>
            </div>

            {/* Trust Metrics */}
            <div className="resume-section">
              <h3 className="resume-section-title">CHỈ SỐ TIN CẬY</h3>
              <div className="trust-metric">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-secondary-700">Kinh nghiệm</Text>
                  <Text className="font-bold text-primary-600">
                    {data.trust_metric_experience} năm
                  </Text>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-secondary-700">Khách hàng</Text>
                  <Text className="font-bold text-primary-600">
                    {data.trust_metric_clients.toLocaleString()} hộ
                  </Text>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-secondary-700">Tỷ lệ chi trả</Text>
                  <Text className="font-bold text-primary-600">
                    {data.trust_metric_claim_rate}%
                  </Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text className="text-secondary-700">Tổng chi trả</Text>
                  <Text className="font-bold text-primary-600">
                    {data.total_payouts}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="resume-main">
            {/* Company Header */}
            <div className="company-header">
              <div>
                <Title level={3} className="text-primary-700 mb-1">
                  {data.partner_name}
                </Title>
                <div className="flex items-center text-secondary-600 mb-2">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <Text>
                    {data.partner_rating_score} ({data.partner_rating_count}{" "}
                    đánh giá)
                  </Text>
                  <Divider type="vertical" />
                  <Users size={16} className="mr-2" />
                  <Text>
                    {data.trust_metric_clients.toLocaleString()} khách hàng
                  </Text>
                </div>
                <Paragraph className="text-secondary-800">
                  {data.partner_description}
                </Paragraph>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="primary"
                  className="bg-primary-500 hover:bg-primary-600 border-primary-500"
                  onClick={() => setIsCustomerViewModalVisible(true)}
                >
                  <Handshake size={16} className="mr-2" />
                  Góc nhìn từ khách hàng
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              className="resume-tabs"
            >
              <TabPane
                tab={
                  <span className="flex items-center">
                    <Building size={16} className="mr-2" />
                    Thông tin chi tiết
                  </span>
                }
                key="company"
              />
              <TabPane
                tab={
                  <span className="flex items-center">
                    <Star size={16} className="mr-2" />
                    Đánh giá
                  </span>
                }
                key="reviews"
              />
              <TabPane
                tab={
                  <span className="flex items-center">
                    <TrendingUp size={16} className="mr-2" />
                    Sản phẩm
                  </span>
                }
                key="products"
              />
            </Tabs>

            {/* Tab Content */}
            {activeTab === "company" && (
              <div>
                {/* Company Description */}
                <div className="resume-section">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="resume-section-title">GIỚI THIỆU</h3>
                    <Button
                      type="text"
                      shape="circle"
                      icon={<Edit size={14} />}
                      className="edit-btn"
                    />
                  </div>
                  <Paragraph className="text-secondary-900 leading-relaxed">
                    {data.partner_description}
                  </Paragraph>
                  <Paragraph className="text-secondary-900 leading-relaxed">
                    <Text strong>Tagline:</Text> {data.partner_tagline}
                  </Paragraph>
                  <Paragraph className="text-secondary-900 leading-relaxed">
                    <Text strong>Kinh nghiệm:</Text>{" "}
                    {data.trust_metric_experience} năm hoạt động trong lĩnh vực
                    bảo hiểm nông nghiệp.
                  </Paragraph>
                </div>

                <div className="section-divider"></div>

                {/* Contact Information */}
                {/* <div className="resume-section">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="resume-section-title">THÔNG TIN LIÊN HỆ</h3>
                                        <Button type="text" shape="circle" icon={<Edit size={14} />} className="edit-btn" />
                                    </div>
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Space direction="vertical" size="middle" className="w-full">
                                                <div><span className="info-label">Email:</span> <span className="info-value">{data.partner_email}</span></div>
                                                <div><span className="info-label">Điện thoại:</span> <span className="info-value">{data.partner_phone}</span></div>
                                                <div><span className="info-label">Website:</span> <span className="info-value">{data.partner_website}</span></div>
                                            </Space>
                                        </Col>
                                        <Col span={12}>
                                            <Space direction="vertical" size="middle" className="w-full">
                                                <div><span className="info-label">Địa chỉ:</span> <span className="info-value">{data.partner_address}</span></div>
                                                <div><span className="info-label">Hotline:</span> <span className="info-value">{data.hotline}</span></div>
                                                <div><span className="info-label">Giờ hỗ trợ:</span> <span className="info-value">{data.support_hours}</span></div>
                                            </Space>
                                        </Col>
                                    </Row>
                                </div> */}

                {/* Service Details */}
                <div className="resume-section">
                  <h3 className="resume-section-title">CHI TIẾT DỊCH VỤ</h3>
                  <Row gutter={24}>
                    <Col span={12}>
                      <div>
                        <div className="mb-2">
                          <span className="info-label">
                            Thời gian xác nhận:
                          </span>
                        </div>
                        <Text className="text-secondary-900">
                          {data.confirmation_timeline}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <div className="mb-2">
                          <span className="info-label">
                            Thời gian thanh toán TB:
                          </span>
                        </div>
                        <Text className="text-secondary-900">
                          {data.average_payout_time}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                  <div className="mt-4">
                    <div className="mb-2">
                      <span className="info-label">Khu vực phục vụ:</span>
                    </div>
                    <Text className="text-secondary-900">
                      {data.coverage_areas}
                    </Text>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <div className="resume-section">
                  <h3 className="resume-section-title">
                    ĐÁNH GIÁ TỪ KHÁCH HÀNG
                  </h3>
                  <div className="reviews-list">
                    {data.reviews.map((review, index) => (
                      <Card key={index} className="review-card mb-4">
                        <Meta
                          avatar={<Avatar src={review.reviewer_avatar_url} />}
                          title={
                            <div className="flex items-center justify-between">
                              <Text strong>{review.reviewer_name}</Text>
                              <Rate
                                disabled
                                defaultValue={review.rating_stars}
                              />
                            </div>
                          }
                          description={
                            <div>
                              <Text className="text-secondary-600">
                                {review.review_content}
                              </Text>
                              <div className="mt-2">
                                <Text type="secondary" className="text-xs">
                                  ID: {review.reviewer_id}
                                </Text>
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                <div className="resume-section">
                  <h3 className="resume-section-title">
                    DANH SÁCH SẢN PHẨM BẢO HIỂM
                  </h3>
                  <Row gutter={16}>
                    {data.products.map((product, index) => (
                      <Col span={12} key={index}>
                        <Card className="product-card">
                          <div className="flex items-center mb-3">
                            <i
                              className={`${product.product_icon} text-2xl text-primary-500 mr-3`}
                            ></i>
                            <div>
                              <Title level={4} className="mb-1">
                                {product.product_name}
                              </Title>
                              <Tag color="blue">
                                {product.product_supported_crop}
                              </Tag>
                            </div>
                          </div>
                          <Paragraph className="text-secondary-600 mb-3">
                            {product.product_description}
                          </Paragraph>
                          <Button type="primary" size="small">
                            Xem chi tiết
                          </Button>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerViewModal
        visible={isCustomerViewModalVisible}
        onClose={() => setIsCustomerViewModalVisible(false)}
        companyData={mockData}
      />
    </div>
  );
}
