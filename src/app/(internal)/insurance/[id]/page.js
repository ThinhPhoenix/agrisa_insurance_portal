"use client";

import { usePremium } from "@/services/hooks/premium/use-premium";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  InsuranceOutlined,
  PhoneOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  StarOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Image,
  Layout,
  Row,
  Space,
  Statistic,
  Steps,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import "../_approval/approval.css";

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

export default function InsuranceDetailPage() {
  const params = useParams();
  const packageId = params.id;

  const { rawData, loading } = usePremium();

  // Find the specific package
  const packageData = rawData?.packages?.find(
    (pkg) => pkg.package_id === packageId
  );

  if (loading) {
    return (
      <Content className="insurance-content">
        <div className="insurance-loading">Đang tải dữ liệu...</div>
      </Content>
    );
  }

  if (!packageData) {
    return (
      <Content className="insurance-content">
        <div className="insurance-error">
          <Title level={3}>Không tìm thấy gói bảo hiểm</Title>
          <Link href="/insurance">
            <Button type="primary" icon={<ArrowLeftOutlined />}>
              Quay lại danh sách
            </Button>
          </Link>
        </div>
      </Content>
    );
  }

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Đang phát hành":
        return "green";
      case "Tạm ngừng":
        return "orange";
      case "Ngừng phát hành":
        return "red";
      default:
        return "default";
    }
  };

  // Helper function to get category color
  const getCategoryColor = (category) => {
    const colors = {
      "Cây lương thực": "blue",
      "Cây rau màu": "green",
      "Cây ăn trái": "orange",
      "Cây hoa màu": "purple",
      "Nuôi trồng thủy sản": "cyan",
    };
    return colors[category] || "default";
  };

  return (
    <Content className="insurance-detail-content">
      <div className="insurance-detail-container">
        {/* Header Section */}
        <div className="insurance-detail-header">
          <div className="insurance-detail-breadcrumb">
            <Link href="/insurance">
              <Button type="text" icon={<ArrowLeftOutlined />}>
                Quay lại danh sách
              </Button>
            </Link>
          </div>

          <div className="insurance-detail-title-section">
            <div className="insurance-detail-title-content">
              <Title level={2} className="insurance-detail-title">
                {packageData.package_name}
              </Title>
              <Text type="secondary" className="insurance-detail-subtitle">
                Mã gói: {packageData.package_id}
              </Text>
              <div className="insurance-detail-tags">
                <Tag
                  color={getCategoryColor(packageData.category)}
                  icon={<InsuranceOutlined />}
                >
                  {packageData.category}
                </Tag>
                <Tag
                  color={getStatusColor(packageData.status)}
                  icon={<CheckCircleOutlined />}
                >
                  {packageData.status}
                </Tag>
              </div>
            </div>

            <div className="insurance-detail-actions">
              <Space wrap>
                <Button type="primary" icon={<EditOutlined />}>
                  Chỉnh sửa
                </Button>
                <Button icon={<ShareAltOutlined />}>Chia sẻ</Button>
                <Button icon={<PrinterOutlined />}>In thông tin</Button>
                <Button icon={<FileTextOutlined />}>Tải hồ sơ</Button>
              </Space>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Rows Layout */}
        <div className="insurance-detail-main">
          {/* Row 1: Basic Info + Statistics */}
          <Row gutter={[24, 24]} className="insurance-detail-row">
            <Col xs={24} lg={14}>
              <Card title="Thông tin cơ bản" className="insurance-detail-card">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Tên gói" span={2}>
                    <Text strong>{packageData.package_name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã gói">
                    {packageData.package_id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Danh mục">
                    <Tag color={getCategoryColor(packageData.category)}>
                      {packageData.category}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày hiệu lực">
                    {packageData.effective_date}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày hết hạn">
                    {packageData.expiry_date}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mức bảo hiểm" span={2}>
                    <Text strong>
                      {packageData.coverage_details.min_coverage_formatted} -{" "}
                      {packageData.coverage_details.max_coverage_formatted}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phí bảo hiểm">
                    {packageData.coverage_details.premium_rate}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời hạn">
                    {packageData.coverage_details.coverage_period}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả" span={2}>
                    <Text>{packageData.description}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card title="Thống kê" className="insurance-detail-card">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Tổng hợp đồng"
                      value={packageData.statistics.total_policies}
                      prefix={<FileTextOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Đang hiệu lực"
                      value={packageData.statistics.active_policies}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Tỷ lệ bồi thường"
                      value={packageData.statistics.claims_ratio}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: "#faad14" }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Độ hài lòng"
                      value={packageData.statistics.satisfaction_rate}
                      prefix={<StarOutlined />}
                      valueStyle={{ color: "#722ed1" }}
                    />
                  </Col>
                </Row>

                {/* Package Images */}
                <div className="insurance-detail-images">
                  <Text strong>Hình ảnh minh họa:</Text>
                  <div className="insurance-images-gallery">
                    <Image.PreviewGroup>
                      {packageData.images.map((image, index) => (
                        <Image
                          key={index}
                          width={80}
                          height={80}
                          src={image}
                          alt={`${packageData.package_name} ${index + 1}`}
                          className="insurance-gallery-image"
                        />
                      ))}
                    </Image.PreviewGroup>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Row 2: Risk Coverage + Land Types */}
          <Row gutter={[24, 24]} className="insurance-detail-row">
            <Col xs={24} lg={12}>
              <Card
                title="Rủi ro được bảo hiểm"
                className="insurance-detail-card"
              >
                <div className="insurance-risks-container">
                  {packageData.risks_covered.map((risk, index) => (
                    <div key={index} className="insurance-risk-item">
                      <div className="insurance-risk-header">
                        <Text strong>{risk.risk_type}</Text>
                      </div>
                      <div className="insurance-risk-details">
                        {risk.details.map((detail, detailIndex) => (
                          <Tag key={detailIndex} style={{ margin: "2px" }}>
                            {detail}
                          </Tag>
                        ))}
                      </div>
                      <div className="insurance-risk-conditions">
                        <Text type="secondary" italic>
                          Điều kiện: {risk.trigger_conditions}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Loại đất phù hợp" className="insurance-detail-card">
                <div className="insurance-land-types">
                  {packageData.eligible_land_types.map((landType, index) => (
                    <div key={index} className="insurance-land-item">
                      <div className="insurance-land-header">
                        <Text strong>{landType.land_type}</Text>
                        <Tag color="blue">{landType.land_code}</Tag>
                      </div>
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="Diện tích tối thiểu">
                          {landType.min_area}
                        </Descriptions.Item>
                        <Descriptions.Item label="Yêu cầu đất">
                          {landType.soil_requirements}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Row 3: Registration Process */}
          <Row gutter={[24, 24]} className="insurance-detail-row">
            <Col xs={24}>
              <Card title="Quy trình đăng ký" className="insurance-detail-card">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Title level={5}>Hồ sơ yêu cầu:</Title>
                    <ul className="insurance-documents-list">
                      {packageData.registration_process.required_documents.map(
                        (doc, index) => (
                          <li key={index}>
                            <CheckCircleOutlined
                              style={{ color: "#52c41a", marginRight: 8 }}
                            />
                            {doc}
                          </li>
                        )
                      )}
                    </ul>

                    <div style={{ marginTop: 16 }}>
                      <Text strong>Thời gian xử lý: </Text>
                      <Tag color="blue">
                        {packageData.registration_process.processing_time}
                      </Tag>
                    </div>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Title level={5}>Các bước thực hiện:</Title>
                    <Steps
                      direction="vertical"
                      size="small"
                      items={packageData.registration_process.steps.map(
                        (step, index) => ({
                          title: step.description,
                          description: `Thời gian: ${step.time_required}`,
                          status: "wait",
                        })
                      )}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Action Buttons Footer */}
        <div className="insurance-detail-footer">
          <Space wrap size="large">
            <Button type="primary" size="large" icon={<EditOutlined />}>
              Chỉnh sửa thông tin
            </Button>
            <Button size="large" icon={<UserOutlined />}>
              Danh sách khách hàng
            </Button>
            <Button size="large" icon={<FileTextOutlined />}>
              Báo cáo thống kê
            </Button>
            <Button size="large" icon={<PhoneOutlined />}>
              Liên hệ hỗ trợ
            </Button>
          </Space>
        </div>
      </div>
    </Content>
  );
}
