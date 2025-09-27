"use client";

import { useBeneficiary } from "@/services/hooks/beneficiary/use-beneficiary";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  PrinterOutlined,
  SafetyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Image,
  Layout,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import "../beneficiary.css";

const { Title, Text, Paragraph } = Typography;

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { rawData } = useBeneficiary();

  // Find the specific beneficiary by ID
  const beneficiary = rawData.beneficiaries.find(
    (b) => b.beneficiary_id === params.id
  );

  if (!beneficiary) {
    return (
      <Layout.Content className="beneficiary-content">
        <div className="beneficiary-loading">
          <Text>Không tìm thấy thông tin người thụ hưởng</Text>
        </div>
      </Layout.Content>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã kích hoạt":
        return "green";
      case "Chờ kích hoạt":
        return "orange";
      case "Tạm dừng":
        return "red";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status) => {
    if (status === "Đã thanh toán") return "green";
    if (status.includes("Trả góp")) return "blue";
    return "orange";
  };

  return (
    <Layout.Content className="beneficiary-content">
      <div className="beneficiary-space">
        {/* Header with Back Button */}
        <div className="beneficiary-detail-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className="!mb-4"
          >
            Quay lại
          </Button>
          <div className="beneficiary-detail-title-section">
            <Space align="start" size="large">
              <Avatar
                src={beneficiary.avatar}
                size={80}
                icon={<UserOutlined />}
                className="beneficiary-detail-avatar"
              />
              <div>
                <Title level={2} className="!mb-2">
                  {beneficiary.full_name}
                </Title>
                <Space size="middle" wrap>
                  <Tag color="blue" icon={<IdcardOutlined />}>
                    {beneficiary.beneficiary_id}
                  </Tag>
                  <Badge
                    status={
                      getStatusColor(beneficiary.status) === "green"
                        ? "success"
                        : getStatusColor(beneficiary.status) === "orange"
                        ? "processing"
                        : "error"
                    }
                    text={beneficiary.status}
                  />
                  <Tag
                    color={getPaymentStatusColor(beneficiary.payment_status)}
                    icon={<CreditCardOutlined />}
                  >
                    {beneficiary.payment_status}
                  </Tag>
                </Space>
              </div>
            </Space>
          </div>

          {/* Action Buttons */}
          <div className="beneficiary-detail-actions">
            <Space>
              <Button type="primary" icon={<PrinterOutlined />}>
                In hồ sơ
              </Button>
              <Button icon={<DownloadOutlined />}>Tải xuống</Button>
            </Space>
          </div>
        </div>

        {/* Main Content */}
        <div className="beneficiary-detail-layout">
          {/* First Row - Personal Information and Insurance Package */}
          <Row gutter={[24, 24]} className="beneficiary-detail-row-1">
            {/* Personal Information Card */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <UserOutlined />
                    Thông tin cá nhân
                  </Space>
                }
                className="beneficiary-detail-card beneficiary-equal-height"
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Họ và tên">
                    <Text strong>{beneficiary.full_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="CCCD/CMND">
                    <Text code>{beneficiary.citizen_id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <Space>
                      <PhoneOutlined />
                      <Text>{beneficiary.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Space>
                      <MailOutlined />
                      <Text>{beneficiary.email}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    <Space>
                      <EnvironmentOutlined />
                      <div>
                        <div>{beneficiary.address.street}</div>
                        <div>
                          {beneficiary.address.ward},{" "}
                          {beneficiary.address.district}
                        </div>
                        <div>{beneficiary.address.province}</div>
                      </div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày đăng ký">
                    <Space>
                      <CalendarOutlined />
                      <Text>{beneficiary.registration_date}</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Insurance Package Card */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <SafetyOutlined />
                    Gói bảo hiểm
                  </Space>
                }
                className="beneficiary-detail-card beneficiary-equal-height"
              >
                <div className="beneficiary-insurance-header">
                  <Title level={4} className="!mb-2">
                    {beneficiary.insurance_package.package_name}
                  </Title>
                  <Text code>{beneficiary.insurance_package.package_id}</Text>
                </div>

                <Row gutter={16} className="!mt-4 !mb-4">
                  <Col span={12}>
                    <div className="beneficiary-insurance-metric">
                      <Text type="secondary">Số tiền bảo hiểm</Text>
                      <Title level={3} className="!mb-0 !text-blue-600">
                        {
                          beneficiary.insurance_package
                            .coverage_amount_formatted
                        }
                      </Title>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="beneficiary-insurance-metric">
                      <Text type="secondary">Phí bảo hiểm</Text>
                      <Title level={3} className="!mb-0 !text-purple-600">
                        {beneficiary.insurance_package.premium_formatted}
                      </Title>
                    </div>
                  </Col>
                </Row>

                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Thời gian bảo hiểm">
                    <Text strong>
                      {beneficiary.insurance_package.coverage_period}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>

                {/* Dates in same row */}
                <Row gutter={16} className="!mt-3">
                  <Col span={12}>
                    <div className="beneficiary-date-item">
                      <Text type="secondary" className="!block !mb-1">
                        Ngày bắt đầu
                      </Text>
                      <Text strong>
                        {beneficiary.insurance_package.start_date}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="beneficiary-date-item">
                      <Text type="secondary" className="!block !mb-1">
                        Ngày kết thúc
                      </Text>
                      <Text strong>
                        {beneficiary.insurance_package.end_date}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Second Row - Farm Information (Full Width) */}
          <Row gutter={[24, 24]} className="beneficiary-detail-row-2">
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <HomeOutlined />
                    Thông tin trang trại
                  </Space>
                }
                className="beneficiary-detail-card"
              >
                <Row gutter={[24, 0]}>
                  {/* Left side - Farm details and images (40%) */}
                  <Col xs={24} lg={9}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Diện tích">
                        <Text strong>{beneficiary.farm_info.farm_area}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Loại cây trồng">
                        <Tag color="green">
                          {beneficiary.farm_info.crop_type}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Kinh nghiệm">
                        <Text>{beneficiary.farm_info.farming_experience}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Vị trí trang trại">
                        <Text>{beneficiary.farm_info.farm_location}</Text>
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Farm Images */}
                    {beneficiary.farm_info.farm_images && (
                      <>
                        <Divider>Hình ảnh trang trại</Divider>
                        <div className="beneficiary-farm-images">
                          <Image.PreviewGroup>
                            {beneficiary.farm_info.farm_images.map(
                              (image, index) => (
                                <Image
                                  key={index}
                                  width={120}
                                  height={80}
                                  src={image}
                                  placeholder
                                  className="beneficiary-farm-image"
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                  }}
                                />
                              )
                            )}
                          </Image.PreviewGroup>
                        </div>
                      </>
                    )}
                  </Col>

                  {/* Right side - Satellite Map (60%) */}
                  <Col xs={24} lg={15}>
                    {beneficiary.farm_info.satellite_map && (
                      <>
                        <div className="beneficiary-map-title">
                          <Title level={5} className="!mb-3">
                            <EnvironmentOutlined className="!mr-2" />
                            Bản đồ vệ tinh
                          </Title>
                        </div>
                        <div className="beneficiary-satellite-map">
                          <iframe
                            src={beneficiary.farm_info.satellite_map.embed_url}
                            width="100%"
                            height="320"
                            style={{ border: "none", borderRadius: "6px" }}
                            title="Bản đồ vệ tinh trang trại"
                          />
                        </div>
                      </>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Third Row - Coverage Details and Status Summary (Same Row) */}
          <Row gutter={[24, 24]} className="beneficiary-detail-row-3">
            {/* Coverage Details Card */}
            <Col xs={24} lg={12}>
              <Card
                title="Chi tiết bảo hiểm"
                className="beneficiary-detail-card beneficiary-equal-height"
              >
                <div className="beneficiary-coverage-list">
                  {beneficiary.coverage_details.map((detail, index) => (
                    <div key={index} className="beneficiary-coverage-item">
                      <Badge status="success" text={detail} className="!mb-2" />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Status Summary Card */}
            <Col xs={24} lg={12}>
              <Card
                title="Tóm tắt trạng thái"
                className="beneficiary-detail-card beneficiary-equal-height"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="beneficiary-status-item">
                      <Text type="secondary">Trạng thái bảo hiểm</Text>
                      <div>
                        <Tag
                          color={getStatusColor(beneficiary.status)}
                          className="!mt-1"
                        >
                          {beneficiary.status}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="beneficiary-status-item">
                      <Text type="secondary">Trạng thái thanh toán</Text>
                      <div>
                        <Tag
                          color={getPaymentStatusColor(
                            beneficiary.payment_status
                          )}
                          className="!mt-1"
                        >
                          {beneficiary.payment_status}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Layout.Content>
  );
}
