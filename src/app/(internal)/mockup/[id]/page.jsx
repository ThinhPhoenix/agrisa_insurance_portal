"use client";


import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Image, Layout, Space, Spin, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import { formatDate, getCropTypeColor, getWaterRequirementColor, useCropDetail } from "../hooks/mockup";

const { Title, Text } = Typography;

export default function CropDetailPage({ params }) {
    const router = useRouter();
    const { loading, cropData, contextHolder } = useCropDetail(params.id);

    const formatYield = (yieldValue) => {
        if (!yieldValue) return "Chưa có thông tin";
        return `${yieldValue} tấn/công`;
    };

    const handleEdit = () => {
        router.push(`/mockup/edit/${params.id}`);
    };

    const handleBack = () => {
        router.push("/mockup");
    };

    // Detail information display
    const detailItems = cropData ? [
        {
            label: "Tên cây trồng",
            value: cropData.name,
            span: 1,
        },
        {
            label: "Tên người dùng",
            value: cropData.username,
            span: 1,
        },
        {
            label: "Tên giống",
            value: cropData.profile?.firstName,
            span: 1,
        },
        {
            label: "Loại cây trồng",
            value: cropData.cropDetails?.type,
            span: 1,
            render: (value) => (
                <Tag color={getCropTypeColor(value)}>{value}</Tag>
            ),
        },
        {
            label: "Tháng trồng",
            value: cropData.cropDetails?.plantingMonth,
            span: 1,
        },
        {
            label: "Tháng thu hoạch",
            value: cropData.cropDetails?.harvestMonth,
            span: 1,
        },
        {
            label: "Năng suất (tấn/công)",
            value: formatYield(cropData.cropDetails?.yieldPerAcre),
            span: 1,
        },
        {
            label: "Nhu cầu nước",
            value: cropData.cropDetails?.waterRequirement,
            span: 1,
            render: (value) => (
                <Tag color={getWaterRequirementColor(value)}>{value}</Tag>
            ),
        },
        {
            label: "Mô tả",
            value: cropData.profile?.lastName,
            span: 2,
        },
        {
            label: "Ngày tạo",
            value: formatDate(cropData.createdAt),
            span: 2,
        },
    ] : [];



    if (loading) {
        return (
            <Layout.Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </Layout.Content>
        );
    }

    if (!cropData) {
        return (
            <Layout.Content style={{ padding: '24px' }}>
                <Text>Không tìm thấy dữ liệu cây trồng.</Text>
            </Layout.Content>
        );
    }

    return (
        <Layout.Content style={{ padding: '8px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBack}
                            type="text"
                        >
                            Quay lại
                        </Button>
                    </Space>

                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div>
                            <Title level={3} style={{ marginBottom: 4 }}>
                                Chi tiết cây trồng: {cropData.name}
                            </Title>
                            <Text type="secondary">
                                ID: {cropData.id} • Tạo ngày: {formatDate(cropData.createdAt)}
                            </Text>
                        </div>

                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={handleEdit}
                        >
                            Chỉnh sửa
                        </Button>
                    </Space>
                </Space>

                {/* Detail Information */}
                <Card title="Thông tin chi tiết cây trồng">
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        {/* Avatar Section */}
                        <div style={{ flex: '0 0 280px', textAlign: 'center' }}>
                            <Image
                                src={cropData.avatar}
                                alt={cropData.name}
                                width={280}
                                height={320}
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                preview={{
                                    mask: 'Xem ảnh',
                                    maskClassName: 'custom-mask'
                                }}
                            />
                        </div>

                        {/* Information Section */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                {detailItems.map((item, index) => (
                                    <div key={index} style={{
                                        gridColumn: item.span === 2 ? '1 / -1' : 'auto',
                                        padding: '8px 14px',
                                        borderRadius: '3px',
                                        border: '1px solid #f0f0f0'
                                    }}>
                                        <div style={{ marginBottom: '6px' }}>
                                            <Text strong style={{ color: '#666', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {item.label}
                                            </Text>
                                        </div>
                                        <div>
                                            {item.render ? (
                                                item.render(item.value)
                                            ) : (
                                                <Text style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>
                                                    {item.value || 'Chưa có thông tin'}
                                                </Text>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </Space>
            {contextHolder}
        </Layout.Content>
    );
}