"use client";
import {
    Button,
    Col,
    Divider,
    Image,
    List,
    Row,
    Space,
    Tabs,
    Tag,
    Typography
} from 'antd';
import {
    Award,
    Building,
    Edit,
    FileText,
    Handshake,
    Mail,
    MapPin,
    Phone,
    TrendingUp,
    Users
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import CustomerViewModal from '../../../components/layout/profile/CustomerViewModal';
import mockData from './mockdata.json';
import './profile.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Mapping between icon names and actual Lucide icons
const iconMap = {
    Users: <Users size={20} />,
    FileText: <FileText size={20} />,
    TrendingUp: <TrendingUp size={20} />
};

export default function ProfilePage() {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState('company');
    const [isCustomerViewModalVisible, setIsCustomerViewModalVisible] = useState(false);

    // Force navigation function for auth to internal route transitions
    const forceNavigate = (path) => {
        const isAuthRoute = pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/profile');
        const isInternalRoute = path.startsWith('/dashboard') || path.startsWith('/portal') || path.startsWith('/') && !path.startsWith('/signin') && !path.startsWith('/signup') && !path.startsWith('/profile');

        if (isAuthRoute && isInternalRoute) {
            window.location.href = path;
        } else {
            router.push(path);
        }
    };

    // Dynamically get company data from mock data
    const { company, contact, statistics, services, recentActivities, businessInfo, certifications } = mockData;

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
                <div className="resume-header">
                    <div className="flex items-center justify-between">
                        <div>
                            <Title level={2} className="text-white mb-2">{company.name}</Title>
                            <Text className="text-secondary-100 text-lg">{company.slogan}</Text>
                        </div>
                        <div className="company-logo-container">
                            {company.logo && (
                                <Image
                                    src={company.logo}
                                    alt={company.name}
                                    preview={true}
                                    className="company-logo object-contain"
                                    width="100%"
                                />
                            )}
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
                                <Text className="text-secondary-900">{contact.email}</Text>
                            </div>
                            <div className="contact-item">
                                <Phone size={16} className="contact-icon" />
                                <Text className="text-secondary-900">{contact.phone}</Text>
                            </div>
                            <div className="contact-item">
                                <MapPin size={16} className="contact-icon" />
                                <Text className="text-secondary-900">{contact.headquarters}</Text>
                            </div>
                            <div className="contact-item">
                                <Building size={16} className="contact-icon" />
                                <Text className="text-secondary-900">{contact.website}</Text>
                            </div>
                        </div>

                        {/* Statistics Section */}
                        <div className="resume-section">
                            <h3 className="resume-section-title">THỐNG KÊ HOẠT ĐỘNG</h3>
                            <div className="stats-grid">
                                {statistics.map((stat, index) => (
                                    <div key={index} className="stat-item">
                                        <div className="flex items-center mb-2">
                                            {iconMap[stat.icon]}
                                            <Text className="ml-2 text-secondary-700 font-medium">{stat.title}</Text>
                                        </div>
                                        <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="section-divider"></div>

                        {/* Services Section */}
                        <div className="resume-section">
                            <h3 className="resume-section-title">DỊCH VỤ BẢO HIỂM</h3>
                            <div className="flex flex-wrap gap-2">
                                {services.map((service, index) => (
                                    <Tag key={index} className="service-tag py-1 px-3">{service}</Tag>
                                ))}
                                <Tag className="bg-secondary-200 text-secondary-800 border-secondary-400 py-1 px-3 cursor-pointer">+ Thêm dịch vụ</Tag>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="resume-main">
                        {/* Company Header */}
                        <div className="company-header">
                            <div>
                                <Title level={3} className="text-primary-700 mb-1">{company.name}</Title>
                                <div className="flex items-center text-secondary-600">
                                    <Building size={16} className="mr-2" />
                                    <Text>Thành lập: {businessInfo.establishedYear}</Text>
                                    <Divider type="vertical" />
                                    <Users size={16} className="mr-2" />
                                    <Text>{businessInfo.employeeCount} nhân viên</Text>
                                </div>
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
                                tab={<span className="flex items-center"><Building size={16} className="mr-2" />Thông tin công ty</span>}
                                key="company"
                            />
                            <TabPane
                                tab={<span className="flex items-center"><TrendingUp size={16} className="mr-2" />Thống kê</span>}
                                key="statistics"
                            />
                            <TabPane
                                tab={<span className="flex items-center"><Users size={16} className="mr-2" />Đối tác</span>}
                                key="partners"
                            />
                        </Tabs>

                        {/* Tab Content */}
                        {activeTab === 'company' && (
                            <div>
                                {/* Company Description */}
                                <div className="resume-section">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="resume-section-title">GIỚI THIỆU CÔNG TY</h3>
                                        <Button type="text" shape="circle" icon={<Edit size={14} />} className="edit-btn" />
                                    </div>
                                    <Paragraph className="text-secondary-900 leading-relaxed">
                                        {company.description}
                                    </Paragraph>
                                    <Paragraph className="text-secondary-900 leading-relaxed">
                                        <Text strong>Sứ mệnh:</Text> {company.mission}
                                    </Paragraph>
                                    <Paragraph className="text-secondary-900 leading-relaxed">
                                        <Text strong>Cam kết:</Text> {company.commitment}
                                    </Paragraph>
                                </div>

                                <div className="section-divider"></div>

                                {/* Contact Information */}
                                <div className="resume-section">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="resume-section-title">THÔNG TIN LIÊN HỆ</h3>
                                        <Button type="text" shape="circle" icon={<Edit size={14} />} className="edit-btn" />
                                    </div>
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Space direction="vertical" size="middle" className="w-full">
                                                <div><span className="info-label">Email:</span> <span className="info-value">{contact.email}</span></div>
                                                <div><span className="info-label">Điện thoại:</span> <span className="info-value">{contact.phone}</span></div>
                                                <div><span className="info-label">Website:</span> <span className="info-value">{contact.website}</span></div>
                                            </Space>
                                        </Col>
                                        <Col span={12}>
                                            <Space direction="vertical" size="middle" className="w-full">
                                                <div><span className="info-label">Trụ sở:</span> <span className="info-value">{contact.headquarters}</span></div>
                                                <div><span className="info-label">Chi nhánh:</span> <span className="info-value">{contact.branches}</span></div>
                                                <div><span className="info-label">Mã số thuế:</span> <span className="info-value">{contact.taxCode}</span></div>
                                            </Space>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="section-divider"></div>

                                {/* Business Info */}
                                <div className="resume-section">
                                    <h3 className="resume-section-title">LĨNH VỰC HOẠT ĐỘNG</h3>
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <div>
                                                <div className="mb-2"><span className="info-label">Loại hình bảo hiểm:</span></div>
                                                <div className="flex flex-wrap gap-2">
                                                    {businessInfo.insuranceTypes.map((type, index) => (
                                                        <Tag key={index} className="service-tag">{type}</Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div>
                                                <div className="mb-2"><span className="info-label">Khu vực bảo hiểm:</span></div>
                                                <div className="flex flex-wrap gap-2">
                                                    {businessInfo.coverageAreas.map((area, index) => (
                                                        <Tag key={index} className="bg-secondary-100 text-secondary-900 border-secondary-300">{area}</Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="section-divider"></div>

                                {/* Certifications */}
                                <div className="resume-section">
                                    <h3 className="resume-section-title">CHỨNG NHẬN & GIẢI THƯỞNG</h3>
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={certifications}
                                        renderItem={(item, index) => (
                                            <List.Item>
                                                <div className="flex items-center">
                                                    <Award size={18} className="text-primary-500 mr-3" />
                                                    <Text>{item}</Text>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </div>

                                <div className="section-divider"></div>

                                {/* Recent Activity */}
                                <div className="resume-section">
                                    <h3 className="resume-section-title">HOẠT ĐỘNG GẦN ĐÂY</h3>
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={recentActivities}
                                        renderItem={(activity, index) => (
                                            <List.Item className="activity-card">
                                                <div className="flex items-center">
                                                    {renderActivityDot(activity.type)}
                                                    <div className="ml-3 flex-grow">
                                                        <Text className="text-secondary-800">{activity.description}</Text>
                                                    </div>
                                                    <Text className="text-secondary-600">{activity.time}</Text>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === 'statistics' && (
                            <div>
                                <div className="resume-section">
                                    <h3 className="resume-section-title">THỐNG KÊ HOẠT ĐỘNG</h3>
                                    <Text>Nội dung thống kê sẽ được hiển thị ở đây...</Text>
                                </div>
                            </div>
                        )}

                        {/* Partners Tab */}
                        {activeTab === 'partners' && (
                            <div>
                                <div className="resume-section">
                                    <h3 className="resume-section-title">ĐỐI TÁC</h3>
                                    <Text>Danh sách đối tác sẽ được hiển thị ở đây...</Text>
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