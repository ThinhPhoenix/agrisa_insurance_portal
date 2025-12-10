import CustomTable from '@/components/custom-table';
import {
    AlertOutlined,
    ClockCircleOutlined,
    SettingOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { Card, Descriptions, Divider, Space, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

const ConfigurationDetail = ({ policyData, mockData }) => {
    const getAggregationFunctionLabel = (value) => {
        return mockData.aggregationFunctions.find(f => f.value === value)?.label || value;
    };

    const getThresholdOperatorLabel = (value) => {
        return mockData.thresholdOperators.find(op => op.value === value)?.label || value;
    };

    const getMonitoringFrequencyLabel = (value) => {
        return mockData.monitoringFrequencies.find(m => m.value === value)?.label || value;
    };

    // Map validation status to Vietnamese
    const getValidationStatusText = (status) => {
        const mapping = {
            'pending': 'Đang chờ xác thực',
            'passed': 'Đã xác thực',
            'passed_ai': 'Đã xác thực bởi AI',
            'failed': 'Xác thực thất bại',
            'warning': 'Cảnh báo'
        };
        return mapping[status] || status;
    };

    // Get validation status color
    const getValidationStatusColor = (status) => {
        const colorMapping = {
            'pending': 'orange',
            'passed': 'green',
            'passed_ai': 'blue',
            'failed': 'red',
            'warning': 'gold'
        };
        return colorMapping[status] || 'default';
    };

    // Map monitor frequency unit to Vietnamese
    const getMonitorFrequencyUnitText = (unit) => {
        const mapping = {
            'hour': 'giờ',
            'day': 'ngày',
            'week': 'tuần',
            'month': 'tháng',
            'year': 'năm'
        };
        return mapping[unit] || unit || 'ngày';
    };

    const getDataSourceLabel = (condition) => {
        // Use enriched data from API if available
        if (condition.dataSourceLabel) {
            return condition.dataSourceLabel;
        }
        // Fallback to mockData for backwards compatibility
        return mockData.dataSources.find(ds => ds.id === condition.dataSourceId)?.label || condition.dataSourceId || 'N/A';
    };

    const getDataSourceUnit = (condition) => {
        // Use enriched data from API if available
        if (condition.dataSourceUnit) {
            return condition.dataSourceUnit;
        }
        // Fallback to mockData for backwards compatibility
        return mockData.dataSources.find(ds => ds.id === condition.dataSourceId)?.unit || '';
    };

    const getDataSourceParameterName = (condition) => {
        // Use enriched data from API if available
        if (condition.dataSourceParameterName) {
            return condition.dataSourceParameterName;
        }
        // Fallback to mockData for backwards compatibility
        return mockData.dataSources.find(ds => ds.id === condition.dataSourceId)?.parameterName || '';
    };

    // Trigger conditions table columns
    const triggerColumns = [
        {
            title: '#',
            dataIndex: 'conditionOrder',
            key: 'conditionOrder',
            width: 60,
            render: (order) => (
                <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {order || 1}
                </Tag>
            ),
        },
        {
            title: 'Nguồn dữ liệu',
            key: 'dataSource',
            render: (_, record) => (
                <div>
                    <Tag color="blue">
                        {getDataSourceLabel(record)}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {getDataSourceParameterName(record)} {getDataSourceUnit(record) && `(${getDataSourceUnit(record)})`}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Hàm tổng hợp',
            key: 'aggregation',
            render: (_, record) => (
                <div>
                    <Tag color="green">
                        {getAggregationFunctionLabel(record.aggregationFunction)}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Chu kỳ: {record.aggregationWindowDays} ngày
                        {record.baselineWindowDays > 0 && (
                            <> | Baseline: {record.baselineWindowDays} ngày</>
                        )}
                    </Text>
                    {record.consecutiveRequired && (
                        <>
                            <br />
                            <Tag color="orange" style={{ fontSize: 10 }}>Yêu cầu liên tục</Tag>
                        </>
                    )}
                </div>
            ),
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div>
                    <Tag color="red">
                        {getThresholdOperatorLabel(record.thresholdOperator)}
                    </Tag>
                    <Text strong> {record.thresholdValue}</Text> {getDataSourceUnit(record)}
                    {record.earlyWarningThreshold && (
                        <>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Cảnh báo sớm: {record.earlyWarningThreshold}
                            </Text>
                        </>
                    )}
                </div>
            ),
        },
        {
            title: 'Chi phí',
            key: 'cost',
            render: (_, record) => (
                <div>
                    <Text strong>{record.calculatedCost?.toLocaleString()} ₫</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        Cơ sở: {record.baseCost?.toLocaleString()}
                    </Text>
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
                        <SettingOutlined style={{ marginRight: 8 }} />
                        Cấu hình Nâng cao
                    </Title>
                    <Text type="secondary">Giám sát và điều kiện kích hoạt</Text>
                </div>

                {/* Section 1: Monitoring & Alerts */}
                <div>
                    <Text strong>
                        <ClockCircleOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                        Giám sát & Cảnh báo
                    </Text>
                    <Descriptions bordered column={2} size="small" style={{ marginTop: 8 }}>
                        <Descriptions.Item label="Tần suất giám sát">
                            <Space>
                                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                                <Text strong>{policyData.configuration?.monitorInterval} {getMonitorFrequencyUnitText(policyData.configuration?.monitorFrequencyUnit)}</Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giai đoạn sinh trưởng">
                            <Tag color="cyan">{policyData.configuration?.growthStage || 'N/A'}</Tag>
                        </Descriptions.Item>
                        {policyData.configuration?.blackoutPeriods?.periods?.length > 0 && (
                            <Descriptions.Item label="Giai đoạn không kích hoạt" span={2}>
                                <Space size="small" wrap>
                                    {policyData.configuration.blackoutPeriods.periods.map((period, index) => {
                                        const formatDate = (dateStr) => {
                                            if (!dateStr) return dateStr;
                                            const [month, day] = dateStr.split('-');
                                            return `${day}/${month}`;
                                        };
                                        return (
                                            <Tag key={index} color="red" style={{ fontSize: '13px', padding: '4px 10px' }}>
                                                {formatDate(period.start)} đến {formatDate(period.end)}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                {/* Section 2: Trigger Conditions */}
                <div>
                    <Space style={{ marginBottom: 12 }}>
                        <ThunderboltOutlined style={{ color: '#ff4d4f' }} />
                        <Text strong>Điều kiện Kích hoạt</Text>
                        <Tag color="blue">{policyData.configuration?.triggerConditions?.length || 0} điều kiện</Tag>
                    </Space>

                    {policyData.configuration?.triggerConditions?.length > 0 ? (
                        <>
                            {/* Logical Operator Info */}
                            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
                                <Space>
                                    <AlertOutlined style={{ color: '#1890ff' }} />
                                    <Text strong>Toán tử Logic:</Text>
                                    <Tag color="blue" style={{ fontSize: 13 }}>
                                        {policyData.configuration?.logicalOperator}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {mockData.logicalOperators.find(op => op.value === policyData.configuration?.logicalOperator)?.description || ''}
                                    </Text>
                                </Space>
                            </Card>

                            {/* Conditions Table */}
                            <CustomTable
                                columns={triggerColumns}
                                dataSource={policyData.configuration?.triggerConditions || []}
                                pagination={false}
                            />

                            {/* Logic Preview */}
                            <Card
                                size="small"
                                title={
                                    <Space>
                                        <ThunderboltOutlined style={{ color: '#faad14' }} />
                                        <span>Xem trước Logic Kích hoạt</span>
                                    </Space>
                                }
                                style={{ marginTop: 16, borderColor: '#faad14' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Text>
                                        <Text strong style={{ color: '#52c41a' }}>Chi trả {(policyData.payoutBaseRate * 100)?.toFixed(2)}%</Text>
                                        {' '}(tối đa <Text strong>{policyData.payoutCap?.toLocaleString()} {policyData.coverageCurrency}</Text>) khi{' '}
                                        <Tag color="blue">
                                            {policyData.configuration?.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                                        </Tag>
                                        {' '}các điều kiện sau được thỏa mãn:
                                    </Text>
                                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                                        {policyData.configuration?.triggerConditions?.map((condition, index) => (
                                            <li key={condition.id}>
                                                <Text>
                                                    <Tag color="green">{getAggregationFunctionLabel(condition.aggregationFunction)}</Tag>
                                                    {' '}của <Tag color="blue">{getDataSourceLabel(condition)}</Tag>
                                                    {' '}trong <Text strong>{condition.aggregationWindowDays} ngày</Text>
                                                    {' '}<Tag color="red">{getThresholdOperatorLabel(condition.thresholdOperator)}</Tag>
                                                    {' '}<Text strong>{condition.thresholdValue} {getDataSourceUnit(condition)}</Text>
                                                    {condition.baselineWindowDays > 0 && (
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {' '}(baseline: {condition.baselineWindowDays} ngày)
                                                        </Text>
                                                    )}
                                                </Text>
                                            </li>
                                        ))}
                                    </ul>
                                </Space>
                            </Card>
                        </>
                    ) : (
                        <Card size="small">
                            <Text type="secondary">Chưa có điều kiện kích hoạt nào được cấu hình</Text>
                        </Card>
                    )}
                </div>
            </Space>
        </Card>
    );
};

export default ConfigurationDetail;
