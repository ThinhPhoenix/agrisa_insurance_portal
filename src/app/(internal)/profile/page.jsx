"use client";
import {
    Button,
    Card,
    Col,
    Divider,
    Image,
    List,
    Row,
    Space,
    Statistic,
    Tabs,
    Tag,
    Typography
} from 'antd';
import {
    Award,
    Building,
    Camera,
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
            <div className="max-w-8xl mx-auto p-4">
                {/* Main Content */}
                <Row gutter={24}>
                    {/* Left Column */}
                    <Col xs={24} md={8} className="mb-6">
                        {/* Company Profile Card */}
                        <Card className="profile-card mb-6">
                            {/* Profile Image */}
                            <div className="mb-6 editable-section relative">
                                <div className="w-full h-48 avatar-container rounded-md mb-4 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                                    <Image
                                        src="https://www.baovietnhantho.com.vn/storage/8f698cfe-2689-4637-bee7-62e592122dee/c/tap-doan-bao-viet-large.jpg"
                                        alt={company.name}
                                        preview={true}
                                        className="object-contain"
                                        width="100%"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={20} className="text-white" />
                                        <span className="text-white text-sm ml-2">Đổi logo</span>
                                    </div>
                                </div>
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<Edit size={14} />}
                                    className="edit-btn absolute top-2 right-2 bg-white shadow-lg hover:bg-gray-50"
                                />
                            </div>

                            <div className="text-center mb-4">
                                <Title level={4} className="text-primary-700 mb-1">{company.name}</Title>
                                <Text className="text-secondary-900">{company.slogan}</Text>
                            </div>

                            <Divider className="my-4" />

                            {/* Quick Contact Info */}
                            <Space direction="vertical" size="small" className="w-full">
                                <div className="flex items-center">
                                    <Mail size={16} className="text-primary-500 mr-2" />
                                    <Text className="text-secondary-900">{contact.email}</Text>
                                </div>
                                <div className="flex items-center">
                                    <Phone size={16} className="text-primary-500 mr-2" />
                                    <Text className="text-secondary-900">{contact.phone}</Text>
                                </div>
                                <div className="flex items-center">
                                    <MapPin size={16} className="text-primary-500 mr-2" />
                                    <Text className="text-secondary-900">{contact.headquarters}</Text>
                                </div>
                            </Space>
                        </Card>

                        {/* Company Stats */}
                        <Card className="profile-card mb-6" title={<span className="text-primary-700">THỐNG KÊ HOẠT ĐỘNG</span>}>
                            <Space direction="vertical" size="middle" className="w-full">
                                {statistics.map((stat, index) => (
                                    <Card key={index} className="stats-card p-3">
                                        <Statistic
                                            title={stat.title}
                                            value={stat.value}
                                            prefix={iconMap[stat.icon]}
                                        />
                                    </Card>
                                ))}
                            </Space>
                        </Card>

                        {/* Services */}
                        <Card
                            className="profile-card"
                            title={
                                <div className="flex items-center justify-between">
                                    <span className="text-primary-700">DỊCH VỤ BẢO HIỂM</span>
                                    <Button
                                        type="text"
                                        shape="circle"
                                        icon={<Edit size={14} />}
                                        className="edit-btn bg-white shadow-lg hover:bg-gray-50"
                                    />
                                </div>
                            }
                        >
                            <div className="flex flex-wrap gap-2">
                                {services.map((service, index) => (
                                    <Tag key={index} className="service-tag py-1 px-3">{service}</Tag>
                                ))}
                                <Tag className="bg-secondary-200 text-secondary-800 border-secondary-400 py-1 px-3 cursor-pointer">+ Thêm dịch vụ</Tag>
                            </div>
                        </Card>
                    </Col>

                    {/* Right Column */}
                    <Col xs={24} md={16}>
                        <Card className="profile-card">
                            {/* Profile Header with Tabs */}
                            <div className="profile-header">
                                <div className="flex items-start justify-between mb-6">
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
                                    className="custom-tabs"
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
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'company' && (
                                <div>
                                    {/* Company Description */}
                                    <div className="section-card mb-6 editable-section relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <Title level={4} className="text-primary-700">GIỚI THIỆU CÔNG TY</Title>
                                            <Button type="text" shape="circle" icon={<Edit size={14} />} className="edit-btn bg-white shadow-lg hover:bg-gray-50" />
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

                                    {/* Contact Information */}
                                    <Row gutter={24} className="mb-6">
                                        <Col span={12}>
                                            <div className="section-card h-full editable-section relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Title level={4} className="text-primary-700">THÔNG TIN LIÊN HỆ</Title>
                                                    <Button type="text" shape="circle" icon={<Edit size={14} />} className="edit-btn bg-white shadow-lg hover:bg-gray-50" />
                                                </div>
                                                <Space direction="vertical" size="middle" className="w-full">
                                                    <div><span className="info-label">Email:</span> <span className="info-value">{contact.email}</span></div>
                                                    <div><span className="info-label">Điện thoại:</span> <span className="info-value">{contact.phone}</span></div>
                                                    <div><span className="info-label">Website:</span> <span className="info-value">{contact.website}</span></div>
                                                </Space>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="section-card h-full editable-section relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Title level={4} className="text-primary-700">ĐỊA CHỈ</Title>
                                                    <Button type="text" shape="circle" icon={<Edit size={14} />} className="edit-btn bg-white shadow-lg hover:bg-gray-50" />
                                                </div>
                                                <Space direction="vertical" size="middle" className="w-full">
                                                    <div><span className="info-label">Trụ sở:</span> <span className="info-value">{contact.headquarters}</span></div>
                                                    <div><span className="info-label">Chi nhánh:</span> <span className="info-value">{contact.branches}</span></div>
                                                    <div><span className="info-label">Mã số thuế:</span> <span className="info-value">{contact.taxCode}</span></div>
                                                </Space>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Business Info & Certifications */}
                                    <Row gutter={24} className="mb-6">
                                        <Col span={12}>
                                            <div className="section-card h-full">
                                                <Title level={4} className="text-primary-700 mb-4">LĨNH VỰC HOẠT ĐỘNG</Title>
                                                <Space direction="vertical" size="middle" className="w-full">
                                                    <div>
                                                        <div className="mb-2"><span className="info-label">Loại hình bảo hiểm:</span></div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {businessInfo.insuranceTypes.map((type, index) => (
                                                                <Tag key={index} className="service-tag">{type}</Tag>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="mb-2"><span className="info-label">Khu vực bảo hiểm:</span></div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {businessInfo.coverageAreas.map((area, index) => (
                                                                <Tag key={index} className="bg-secondary-100 text-secondary-900 border-secondary-300">{area}</Tag>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Space>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div className="section-card h-full">
                                                <Title level={4} className="text-primary-700 mb-4">CHỨNG NHẬN & GIẢI THƯỞNG</Title>
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
                                        </Col>
                                    </Row>

                                    {/* Recent Activity */}
                                    <div className="section-card">
                                        <Title level={4} className="text-primary-700 mb-4">HOẠT ĐỘNG GẦN ĐÂY</Title>
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

                            {/* Other tabs content would go here */}
                            {activeTab === 'statistics' && (
                                <div className="flex items-center justify-center h-64">
                                    <Text className="text-secondary-600">Đang phát triển biểu đồ thống kê...</Text>
                                </div>
                            )}

                            {activeTab === 'partners' && (
                                <div className="flex items-center justify-center h-64">
                                    <Text className="text-secondary-600">Đang phát triển danh sách đối tác...</Text>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>

            <CustomerViewModal
                visible={isCustomerViewModalVisible}
                onClose={() => setIsCustomerViewModalVisible(false)}
                companyData={mockData}
            />
        </div>
    );
}