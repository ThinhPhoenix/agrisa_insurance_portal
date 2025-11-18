import CustomTable from '@/components/custom-table';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Descriptions, Divider, Tag, Typography } from 'antd';

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
            <Title level={4}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                Thông tin Cơ bản
            </Title>

            <Descriptions bordered column={2}>
                <Descriptions.Item label="Tên Sản phẩm" span={2}>
                    <Text strong style={{ fontSize: 16 }}>{policyData.productName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mã Sản phẩm">
                    <Text code>{policyData.productCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Đối tác Bảo hiểm">
                    <Tag color="blue">{policyData.insuranceProviderId}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Loại Cây trồng" span={2}>
                    <div>
                        <Tag color="green">{getCropTypeLabel(policyData.cropType)}</Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                            {getCropTypeDescription(policyData.cropType)}
                        </Text>
                    </div>
                </Descriptions.Item>
                <Descriptions.Item label="Tỷ lệ Phí BH Cơ sở">
                    <Text strong>{(policyData.premiumBaseRate * 100).toFixed(2)}%</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời hạn Bảo hiểm">
                    <Text strong>{policyData.coverageDurationDays} ngày</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tiền tệ">
                    <Text strong>{policyData.coverageCurrency}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phí cố định">
                    <Text strong>{policyData.fixPremiumAmount?.toLocaleString()} ₫</Text>
                    {policyData.isPerHectare && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>Theo hecta</Tag>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả" span={2}>
                    {policyData.description || 'Không có mô tả'}
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Data Sources */}
            <Title level={5}>
                Cấu hình Gói Dữ liệu
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>
                    ({policyData.selectedDataSources?.length || 0} nguồn dữ liệu)
                </Text>
            </Title>

            <CustomTable
                columns={dataSourceColumns}
                dataSource={policyData.selectedDataSources || []}
                pagination={false}
            />
        </Card>
    );
};

export default BasicInfoDetail;
