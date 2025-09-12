"use client";

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
    Award,
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
import '../../../styles/profile.css';

const { Title, Text, Paragraph } = Typography;

const CustomerViewModal = ({ visible, onClose, companyData }) => {
    const { company, contact, statistics, services, recentActivities, businessInfo, certifications } = companyData;

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
                                src="https://www.baovietnhantho.com.vn/storage/8f698cfe-2689-4637-bee7-62e592122dee/c/tap-doan-bao-viet-large.jpg"
                                alt={company.name}
                                preview={false}
                                width={70}
                                height={70}
                                className="company-avatar"
                            />
                            <div className="rating-badge">
                                <Star size={12} className="text-yellow-500 fill-current" />
                                <span>4.2</span>
                            </div>
                        </div>
                        <div className="company-info-container">
                            <Title level={4} className="company-title">{company.name}</Title>
                            <Text className="company-slogan">{company.slogan}</Text>
                            <Space className="company-metrics" size="middle">
                                <div className="metric-item">
                                    <Calendar size={14} className="metric-icon" />
                                    <Text className="metric-text">{businessInfo.establishedYear}</Text>
                                </div>
                                <div className="metric-item">
                                    <Users size={14} className="metric-icon" />
                                    <Text className="metric-text">{businessInfo.employeeCount}</Text>
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
                            {company.description}
                        </Paragraph>
                        <Row gutter={[0, 16]} className="company-values">
                            <Col span={24}>
                                <Card className="value-card">
                                    <Space direction="vertical" size={2}>
                                        <Text type="secondary" className="value-label">SỨ MỆNH</Text>
                                        <Text className="value-content">{company.mission}</Text>
                                    </Space>
                                </Card>
                            </Col>
                            <Col span={24}>
                                <Card className="value-card">
                                    <Space direction="vertical" size={2}>
                                        <Text type="secondary" className="value-label">CAM KẾT</Text>
                                        <Text className="value-content">{company.commitment}</Text>
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
                                { icon: <Phone size={16} />, text: contact.phone },
                                { icon: <Mail size={16} />, text: contact.email },
                                { icon: <Globe size={16} />, text: contact.website },
                                { icon: <MapPin size={16} />, text: contact.headquarters }
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

                    {/* Certifications Section */}
                    <Card className="content-card" bordered={false}>
                        <Title level={5} className="section-title">
                            <Award size={16} className="section-icon" />
                            Chứng nhận & Giải thưởng
                        </Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={certifications}
                            renderItem={(item) => (
                                <List.Item className="certification-item">
                                    <Space>
                                        <Award size={16} className="award-icon" />
                                        <Text>{item}</Text>
                                    </Space>
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