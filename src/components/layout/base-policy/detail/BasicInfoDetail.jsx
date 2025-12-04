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
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <div>
                    <Title level={4} style={{ marginBottom: 0 }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        Thông tin Cơ bản
                    </Title>
                    <Text type="secondary">Thông tin sản phẩm và cấu hình cơ bản</Text>
                </div>

                {/* Section 1: Product Info */}
                <div>
                    <Text strong>
                        <FileTextOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                        Thông tin Sản phẩm
                    </Text>
                    <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
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
                    <Text strong>
                        <EnvironmentOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                        Thông tin Bảo hiểm
                    </Text>
                    <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="Loại Cây trồng" span={2}>
                            <Space>
                                <Tag color="green">{getCropTypeLabel(policyData.cropType)}</Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {getCropTypeDescription(policyData.cropType)}
                                </Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tiền tệ">
                            <Text strong>{policyData.coverageCurrency}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời hạn Bảo hiểm">
                            <Text strong>{policyData.coverageDurationDays} ngày</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Section 3: Premium & Payout */}
                <div>
                    <Text strong>
                        <DollarOutlined style={{ marginRight: 6, color: '#faad14' }} />
                        Cấu hình Phí & Chi trả
                    </Text>
                    <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="Tỷ lệ Phí BH Cơ sở">
                            <Text strong>{(policyData.premiumBaseRate * 100).toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phí cố định">
                            <Space>
                                <Text strong>{policyData.fixPremiumAmount?.toLocaleString()} ₫</Text>
                                {policyData.isPerHectare && (
                                    <Tag color="blue">Theo hecta</Tag>
                                )}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỷ lệ Chi trả Cơ sở">
                            <Text strong>{(policyData.payoutBaseRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền Chi trả Cố định">
                            <Space>
                                <Text strong style={{ color: '#52c41a' }}>
                                    {policyData.fixPayoutAmount?.toLocaleString()} ₫
                                </Text>
                                {policyData.isPayoutPerHectare && (
                                    <Tag color="green">Theo hecta</Tag>
                                )}
                            </Space>
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Section 4: Registration Time & Validity */}
                <div>
                    <Text strong>
                        <CalendarOutlined style={{ marginRight: 6, color: '#faad14' }} />
                        Thời hạn Đăng ký & Hiệu lực
                    </Text>
                    <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
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
                    <Text strong>
                        <ReloadOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                        Cài đặt Gia hạn & Các chính sách khác
                    </Text>
                    <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="Tự động gia hạn">
                            <Tag color={policyData.autoRenewal ? 'green' : 'default'}>
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

                <Divider style={{ margin: '8px 0' }} />

                {/* Section 6: Data Sources */}
                <div>
                    <Text strong>
                        <DatabaseOutlined style={{ marginRight: 6, color: '#722ed1' }} />
                        Cấu hình Gói Dữ liệu
                        <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>
                            ({policyData.selectedDataSources?.length || 0} nguồn dữ liệu)
                        </Text>
                    </Text>
                    <CustomTable
                        columns={dataSourceColumns}
                        dataSource={policyData.selectedDataSources || []}
                        pagination={false}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Space>
        </Card>
    );
};

export default BasicInfoDetail;
