import CustomTable from '@/components/custom-table';
import {
    CalendarOutlined,
    DatabaseOutlined,
    DollarOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { Card, Descriptions, Divider, Space, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

const BasicInfoDetail = ({ policyData, mockData }) => {
    const getCropTypeLabel = (value) => {
        return mockData.cropTypes.find(t => t.value === value)?.label || value;
    };

    const getCropTypeDescription = (value) => {
        return mockData.cropTypes.find(t => t.value === value)?.description || '';
    };

    const getCropTypeColor = (value) => {
        const label = (getCropTypeLabel(value) || '').toLowerCase();
        if (label.includes('lúa') || label.includes('lua') || label.includes('rice')) return '#2e8b57';
        if (label.includes('cafe') || label.includes('cà phê') || label.includes('coffee')) return '#6f4e37';
        return 'var(--color-primary-800)';
    };

    // Data source table columns
    const dataSourceColumns = [
        {
            title: 'Tên nguồn dữ liệu',
            dataIndex: 'label',
            key: 'label',
            render: (text, record) => (
                <div>
                    <Text strong>{text || record.dataSourceId || 'N/A'}</Text>
                    <br />
                    {(record.parameterName || record.unit) && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.parameterName || ''} {record.unit ? `(${record.unit})` : ''}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'categoryLabel',
            key: 'categoryLabel',
            render: (text, record) => (
                <Text>{text || `Hệ số: ${record.categoryMultiplier || 'N/A'}`}</Text>
            ),
        },
        {
            title: 'Gói',
            dataIndex: 'tierLabel',
            key: 'tierLabel',
            render: (text, record) => (
                <Text>{text || `Hệ số: ${record.tierMultiplier || 'N/A'}`}</Text>
            ),
        },
        {
            title: 'Chi phí',
            dataIndex: 'calculatedCost',
            key: 'calculatedCost',
            render: (cost, record) => (
                <div>
                    <Text strong>{cost?.toLocaleString() || 'N/A'} ₫</Text>
                    <br />
                    {record.baseCost && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            Cơ sở: {record.baseCost?.toLocaleString()} ₫
                        </Text>
                    )}
                </div>
            ),
        },
    ];

    return (
        <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Header */}
                <div>
                    <Title level={4} style={{ marginBottom: 4, color: 'var(--color-primary-700)' }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        Thông tin Cơ bản
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Thông tin sản phẩm và cấu hình cơ bản</Text>
                </div>

                {/* Section 1: Product Info */}
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                        <FileTextOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                        Thông tin Sản phẩm
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tên Sản phẩm" span={2}>
                            <Text strong style={{ fontSize: 15 }}>{policyData.productName}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã Sản phẩm" span={2}>
                            <Text code>{policyData.productCode}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Mô tả" span={2}>
                            <Text>{policyData.description || 'Không có mô tả'}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Section 2: Coverage Info */}
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                        <EnvironmentOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                        Thông tin Bảo hiểm
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Loại Cây trồng" span={2}>
                            <Space>
                                <Text strong style={{ color: getCropTypeColor(policyData.cropType) }}>
                                    {getCropTypeLabel(policyData.cropType)}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {getCropTypeDescription(policyData.cropType)}
                                </Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời hạn Bảo hiểm">
                            <Text strong>{policyData.coverageDurationDays} ngày</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Section 3: Premium & Payout */}
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                        <DollarOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                        Cấu hình Phí & Chi trả
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tỷ lệ Phí BH Cơ sở">
                            <Text strong style={{ color: 'var(--color-primary-600)' }}>
                                {(policyData.premiumBaseRate * 100).toFixed(2)}%
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phí cố định">
                            <Space>
                                <Text strong>{policyData.fixPremiumAmount?.toLocaleString()} ₫</Text>
                                {policyData.isPerHectare && (
                                    <Text style={{ color: 'var(--color-primary-700)' }}>/ ha</Text>
                                )}
                                {!policyData.isPerHectare && (
                                    <Text style={{ color: 'var(--color-primary-700)' }}>/ m²</Text>
                                )}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỷ lệ Chi trả Cơ sở">
                            <Text strong style={{ color: 'var(--color-primary-600)' }}>
                                {(policyData.payoutBaseRate * 100)?.toFixed(2)}%
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền Chi trả Cố định">
                            <Space>
                                <Text strong style={{ color: '' }}>
                                    {policyData.fixPayoutAmount?.toLocaleString()} ₫
                                </Text>
                                {policyData.isPayoutPerHectare && (
                                    <Text style={{ color: 'var(--color-primary-700)' }}>/ ha</Text>
                                )}
                                {!policyData.isPayoutPerHectare && (
                                    <Text style={{ color: 'var(--color-primary-700)' }}>/ m²</Text>
                                )}
                            </Space>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Section 4: Registration Time & Validity */}
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                        <CalendarOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                        Thời hạn Đăng ký & Hiệu lực
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Mở đăng ký">
                            <Text strong>{policyData.enrollmentStartDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Đóng đăng ký">
                            <Text strong>{policyData.enrollmentEndDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Bắt đầu hiệu lực">
                            <Text strong>{policyData.insuranceValidFromDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Kết thúc hiệu lực">
                            <Text strong>{policyData.insuranceValidToDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Gia hạn thanh toán phí">
                            <Text strong>{policyData.maxPremiumPaymentProlong} ngày</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Section 5: Renewal Settings */}
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                        <ReloadOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                        Cài đặt Gia hạn & Các chính sách khác
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tự động gia hạn">
                            <Tag style={{
                                backgroundColor: policyData.autoRenewal ? 'var(--color-primary-300)' : '#f5f5f5',
                                color: policyData.autoRenewal ? 'var(--color-primary-800)' : '#8c8c8c',
                                border: 'none'
                            }}>
                                {policyData.autoRenewal ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giảm giá khi gia hạn">
                            <Text strong>{(policyData.renewalDiscountRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Hệ số vượt ngưỡng">
                            <Text strong>{policyData.overThresholdMultiplier}x</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới hạn chi trả">
                            <Text strong>{policyData.payoutCap?.toLocaleString()} {policyData.coverageCurrency}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỉ lệ hoàn phí khi hủy">
                            <Text strong>{(policyData.cancelPremiumRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* Section 6: Data Sources */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                            <DatabaseOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                            Cấu hình Gói Dữ liệu
                        </Text>
                        <Tag style={{
                            background: 'rgba(199, 230, 215, 0.6)',
                            color: 'var(--color-primary-800)',
                            border: '1px solid rgba(165, 215, 190, 0.4)',
                            backdropFilter: 'blur(8px)',
                            fontWeight: '500',
                        }}>
                            {policyData.selectedDataSources?.length || 0} nguồn
                        </Tag>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <CustomTable
                        columns={dataSourceColumns}
                        dataSource={policyData.selectedDataSources || []}
                        pagination={false}
                    />
                </div>
            </Space>
        </Card>
    );
};

export default BasicInfoDetail;
