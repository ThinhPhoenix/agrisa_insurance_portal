"use client";

import '@/app/(internal)/profile/profile.css';
import {
    Card,
    Col,
    Image,
    List,
    Modal,
    Row,
    Space,
    Tag,
    Typography
} from 'antd';
import {
    Building,
    Calendar,
    Globe,
    Mail,
    MapPin,
    Phone,
    Star,
    Target,
    Users
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

const CustomerViewModal = ({ visible, onClose, companyData }) => {
    // Use new data structure
    const data = companyData;

    // Create mock businessInfo for compatibility
    const businessInfo = {
        establishedYear: data.trust_metric_experience,
        employeeCount: data.trust_metric_clients,
        insuranceTypes: ["Bảo hiểm nông nghiệp"],
        coverageAreas: data.coverage_areas.split(", ")
    };

    // Create mock services
    const services = data.products.map(p => p.product_name);

    // Render activity dot based on type (reusing from parent component)
    const renderActivityDot = (type) => {
        const className = `activity-dot ${type}`;
        return <div className={className}></div>;
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <Building size={20} className="text-primary-600 mr-2" />
                    <span>Góc nhìn từ khách hàng</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={425}
            centered
            className="customer-view-modal"
        >
            <div className="mobile-view-container">
                {/* Company Header */}
                <Card className="company-header-card" bordered={false}>
                    <div className="flex items-start">
                        <div className="company-logo-wrapper">
                            <Image
                                src={data.partner_logo_url}
                                alt={data.partner_name}
                                preview={false}
                                width={70}
                                height={70}
                                className="company-avatar"
                            />
                            <div className="rating-badge">
                                <Star size={12} className="text-yellow-500 fill-current" />
                                <span>{data.partner_rating_score}</span>
                            </div>
                        </div>
                        <div className="company-info-container">
                            <Title level={4} className="company-title">{data.partner_name}</Title>
                            <Text className="company-slogan">{data.partner_tagline}</Text>
                            <Space className="company-metrics" size="middle">
                                <div className="metric-item">
                                    <Calendar size={14} className="metric-icon" />
                                    <Text className="metric-text">{businessInfo.establishedYear} năm</Text>
                                </div>
                                <div className="metric-item">
                                    <Users size={14} className="metric-icon" />
                                    <Text className="metric-text">{businessInfo.employeeCount.toLocaleString()} khách hàng</Text>
                                </div>
                            </Space>
                        </div>
                    </div>
                </Card>

                {/* Mobile Content Sections */}
                <div className="mobile-content-wrapper">
                    {/* Services Section */}
                    <Card className="content-card" bordered={false}>
                        <Title level={5} className="section-title">
                            <Target size={16} className="section-icon" />
                            Dịch vụ bảo hiểm
                        </Title>
                        <div className="tags-container">
                            {services.map((service, index) => (
                                <Tag key={index} className="service-tag">{service}</Tag>
                            ))}
                        </div>
                    </Card>

                    {/* Company Info Section */}
                    <Card className="content-card" bordered={false}>
                        <Title level={5} className="section-title">
                            <Building size={16} className="section-icon" />
                            Giới thiệu công ty
                        </Title>
                        <Paragraph className="company-desc">
                            {data.partner_description}
                        </Paragraph>
                        <Row gutter={[0, 16]} className="company-values">
                            <Col span={24}>
                                <Card className="value-card">
                                    <Space direction="vertical" size={2}>
                                        <Text type="secondary" className="value-label">TỶ LỆ CHI TRẢ</Text>
                                        <Text className="value-content">{data.trust_metric_claim_rate}%</Text>
                                    </Space>
                                </Card>
                            </Col>
                            <Col span={24}>
                                <Card className="value-card">
                                    <Space direction="vertical" size={2}>
                                        <Text type="secondary" className="value-label">TỔNG CHI TRẢ</Text>
                                        <Text className="value-content">{data.total_payouts}</Text>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </Card>

                    {/* Contact Info Section */}
                    <Card className="content-card" bordered={false}>
                        <Title level={5} className="section-title">
                            <Phone size={16} className="section-icon" />
                            Thông tin liên hệ
                        </Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={[
                                { icon: <Phone size={16} />, text: data.partner_phone },
                                { icon: <Mail size={16} />, text: data.partner_email },
                                { icon: <Globe size={16} />, text: data.partner_website },
                                { icon: <MapPin size={16} />, text: data.partner_address }
                            ]}
                            renderItem={(item) => (
                                <List.Item className="contact-list-item">
                                    <div className="contact-item">
                                        <div className="contact-icon">{item.icon}</div>
                                        <Text className="contact-text">{item.text}</Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* Business Info Section */}
                    <Card className="content-card" bordered={false}>
                        <Title level={5} className="section-title">
                            <Target size={16} className="section-icon" />
                            Lĩnh vực hoạt động
                        </Title>
                        <Space direction="vertical" size={16} className="business-info">
                            <div>
                                <Text type="secondary" className="info-label">LOẠI HÌNH BẢO HIỂM</Text>
                                <div className="tags-container mt-2">
                                    {businessInfo.insuranceTypes.map((type, index) => (
                                        <Tag key={index} className="insurance-type-tag">{type}</Tag>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" className="info-label">KHU VỰC BẢO HIỂM</Text>
                                <div className="tags-container mt-2">
                                    {businessInfo.coverageAreas.map((area, index) => (
                                        <Tag key={index} className="coverage-area-tag">{area}</Tag>
                                    ))}
                                </div>
                            </div>
                        </Space>
                    </Card>

                    {/* Reviews Section */}
                    <Card className="content-card" bordered={false}>
                        <Title level={5} className="section-title">
                            <Star size={16} className="section-icon" />
                            Đánh giá từ khách hàng
                        </Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={data.reviews.slice(0, 3)} // Show only first 3 reviews
                            renderItem={(review) => (
                                <List.Item className="review-item">
                                    <div className="review-content">
                                        <div className="flex items-center justify-between mb-1">
                                            <Text strong className="reviewer-name">{review.reviewer_name}</Text>
                                            <div className="flex items-center">
                                                {[...Array(review.rating_stars)].map((_, i) => (
                                                    <Star key={i} size={12} className="text-yellow-500 fill-current" />
                                                ))}
                                            </div>
                                        </div>
                                        <Text className="review-text">{review.review_content}</Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </div>
            </div>
        </Modal>
    );
};

export default CustomerViewModal;