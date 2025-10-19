import CustomTable from '@/components/custom-table';
import { SettingOutlined } from '@ant-design/icons';
import { Badge, Card, Descriptions, Divider, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

const ConfigurationDetail = ({ policyData, mockData }) => {
    const getCoverageTypeInfo = (value) => {
        return mockData.coverageTypes.find(t => t.value === value) || {};
    };

    const getRiskLevelInfo = (value) => {
        return mockData.riskLevels.find(r => r.value === value) || {};
    };

    const getPayoutMethodLabel = (value) => {
        return mockData.payoutMethods.find(p => p.value === value)?.label || value;
    };

    const getPayoutCalculationLabel = (value) => {
        return mockData.payoutCalculationMethods.find(p => p.value === value)?.label || value;
    };

    const getMonitoringFrequencyLabel = (value) => {
        return mockData.monitoringFrequencies.find(m => m.value === value)?.label || value;
    };

    const coverageType = getCoverageTypeInfo(policyData.configuration?.coverageType);
    const riskLevel = getRiskLevelInfo(policyData.configuration?.riskLevel);

    // Trigger conditions table columns
    const triggerColumns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Nguồn dữ liệu',
            key: 'dataSource',
            render: (_, record) => (
                <div>
                    <Tag color="blue">
                        {mockData.dataSources.find(ds => ds.id === record.dataSourceId)?.label || 'N/A'}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {mockData.dataSources.find(ds => ds.id === record.dataSourceId)?.parameterName || ''} (
                        {mockData.dataSources.find(ds => ds.id === record.dataSourceId)?.unit || ''})
                    </Text>
                </div>
            ),
        },
        {
            title: 'Hàm tổng hợp',
            key: 'aggregation',
            render: (_, record) => (
                <Tag color="green">
                    {mockData.aggregationFunctions.find(f => f.value === record.aggregationFunction)?.label || record.aggregationFunction}
                </Tag>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            render: (_, record) => `${record.timeWindow} ${record.timeUnit}`,
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div>
                    <Tag color="red">
                        {mockData.thresholdOperators.find(op => op.value === record.thresholdOperator)?.label || record.thresholdOperator}
                    </Tag>
                    <Text strong> {record.thresholdValue}</Text>
                    {record.baselineValue && (
                        <>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Baseline: {record.baselineValue}
                            </Text>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <Card>
            <Title level={4}>
                <SettingOutlined style={{ marginRight: 8 }} />
                Cấu hình Chính sách
            </Title>

            <Title level={5}>Thông tin Bảo hiểm</Title>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Loại bảo hiểm" span={2}>
                    <div>
                        <Tag color="purple">{coverageType.label}</Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {coverageType.description}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                            Tỷ lệ phí: {((coverageType.premium_rate || 0) * 100).toFixed(1)}%
                        </Text>
                    </div>
                </Descriptions.Item>
                <Descriptions.Item label="Mức độ rủi ro">
                    <div>
                        <Badge color={riskLevel.color} text={riskLevel.label} />
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            Hệ số: {riskLevel.multiplier}x
                        </Text>
                    </div>
                </Descriptions.Item>
                <Descriptions.Item label="Toán tử Logic">
                    <div>
                        <Tag color="blue">{policyData.configuration?.logicalOperator}</Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {mockData.logicalOperators.find(op => op.value === policyData.configuration?.logicalOperator)?.description || ''}
                        </Text>
                    </div>
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Thanh toán & Chi trả</Title>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Tỷ lệ Thanh toán">
                    <Text strong>{policyData.configuration?.payoutPercentage}%</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền tối đa">
                    <Text strong style={{ color: '#52c41a' }}>
                        {policyData.configuration?.maxPayoutAmount?.toLocaleString()} ₫
                    </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức thanh toán">
                    <div>
                        {getPayoutMethodLabel(policyData.configuration?.payoutMethod)}
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {mockData.payoutMethods.find(p => p.value === policyData.configuration?.payoutMethod)?.description || ''}
                        </Text>
                    </div>
                </Descriptions.Item>
                <Descriptions.Item label="Cách tính thanh toán">
                    <div>
                        {getPayoutCalculationLabel(policyData.configuration?.payoutCalculation)}
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {mockData.payoutCalculationMethods.find(p => p.value === policyData.configuration?.payoutCalculation)?.description || ''}
                        </Text>
                    </div>
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Giám sát & Cảnh báo</Title>
            <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Tần suất giám sát">
                    <div>
                        {getMonitoringFrequencyLabel(policyData.configuration?.monitoringFrequency)}
                        <br />
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {mockData.monitoringFrequencies.find(m => m.value === policyData.configuration?.monitoringFrequency)?.description || ''}
                        </Text>
                    </div>
                </Descriptions.Item>
                <Descriptions.Item label="Loại cảnh báo">
                    <div>
                        {policyData.configuration?.alertTypes?.map((type, index) => (
                            <Tag key={index} color="orange" style={{ marginBottom: 4 }}>
                                {mockData.alertTypes.find(a => a.value === type)?.label || type}
                            </Tag>
                        ))}
                    </div>
                </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Trigger Conditions */}
            <Title level={5}>
                Điều kiện Kích hoạt
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>
                    ({policyData.configuration?.triggerConditions?.length || 0} điều kiện)
                </Text>
            </Title>
            <CustomTable
                columns={triggerColumns}
                dataSource={policyData.configuration?.triggerConditions || []}
                pagination={false}
            />
        </Card>
    );
};

export default ConfigurationDetail;
