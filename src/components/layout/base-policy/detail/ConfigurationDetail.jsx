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
                <Text strong style={{ color: 'var(--color-primary-600)', fontSize: '14px' }}>
                    {order || 1}
                </Text>
            ),
        },
        {
            title: 'Nguồn dữ liệu',
            key: 'dataSource',
            render: (_, record) => (
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)' }}>
                        {getDataSourceLabel(record)}
                    </Text>
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
                    <Text style={{ color: 'var(--color-primary-600)' }}>
                        {getAggregationFunctionLabel(record.aggregationFunction)}
                    </Text>
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
                            <Text style={{ fontSize: 10, color: 'var(--color-secondary-700)' }}>
                                Yêu cầu liên tục
                            </Text>
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
                    <Text style={{ color: 'var(--color-secondary-700)' }}>
                        {getThresholdOperatorLabel(record.thresholdOperator)}
                    </Text>
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
                    <Text strong style={{ color: 'var(--color-primary-600)' }}>{record.calculatedCost?.toLocaleString()} ₫</Text>
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
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Header */}
                <div>
                    <Title level={4} style={{ marginBottom: 4, color: 'var(--color-primary-700)' }}>
                        <SettingOutlined style={{ marginRight: 8 }} />
                        Cấu hình Nâng cao
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Giám sát và điều kiện kích hoạt</Text>
                </div>

                {/* Section 1: Monitoring & Alerts */}
                <div>
                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                        <ClockCircleOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                        Giám sát & Cảnh báo
                    </Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tần suất giám sát">
                            <Space>
                                <ClockCircleOutlined style={{ color: 'var(--color-primary-500)' }} />
                                <Text strong>{policyData.configuration?.monitorInterval} {getMonitorFrequencyUnitText(policyData.configuration?.monitorFrequencyUnit)}</Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giai đoạn sinh trưởng">
                            <Tag style={{ backgroundColor: 'var(--color-primary-300)', color: 'var(--color-primary-800)', border: 'none' }}>
                                {policyData.configuration?.growthStage || 'N/A'}
                            </Tag>
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
                                            <Tag key={index} style={{ backgroundColor: 'var(--color-secondary-400)', color: 'var(--color-secondary-800)', border: 'none', fontSize: '13px', padding: '4px 10px' }}>
                                                {formatDate(period.start)} đến {formatDate(period.end)}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* Section 2: Trigger Conditions */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                            <ThunderboltOutlined style={{ marginRight: 6, color: 'var(--color-primary-500)' }} />
                            Điều kiện Kích hoạt
                        </Text>
                        <Tag style={{
                            background: 'rgba(199, 230, 215, 0.6)',
                            color: 'var(--color-primary-800)',
                            border: '1px solid rgba(165, 215, 190, 0.4)',
                            backdropFilter: 'blur(8px)',
                            fontWeight: '500',
                        }}>
                            {policyData.configuration?.triggerConditions?.length || 0} điều kiện
                        </Tag>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />

                    {policyData.configuration?.triggerConditions?.length > 0 ? (
                        <>
                            {/* Logical Operator inline info */}
                            <div style={{
                                padding: '12px 16px',
                                backgroundColor: 'var(--color-primary-100)',
                                borderLeft: '3px solid var(--color-primary-500)',
                                borderRadius: '4px',
                                marginBottom: '16px',
                            }}>
                                <Space size="small">
                                    <AlertOutlined style={{ color: 'var(--color-primary-600)', fontSize: '14px' }} />
                                    <Text style={{ fontSize: '13px' }}>Toán tử Logic:</Text>
                                    <Tag style={{
                                        backgroundColor: 'var(--color-primary-300)',
                                        color: 'var(--color-primary-800)',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                    }}>
                                        {policyData.configuration?.logicalOperator}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {mockData.logicalOperators.find(op => op.value === policyData.configuration?.logicalOperator)?.description || ''}
                                    </Text>
                                </Space>
                            </div>

                            {/* Conditions Table */}
                            <CustomTable
                                columns={triggerColumns}
                                dataSource={policyData.configuration?.triggerConditions || []}
                                pagination={false}
                            />

                            {/* Logic Preview - Clean section without heavy card */}
                            <div style={{ marginTop: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                }}>
                                    <ThunderboltOutlined style={{ color: 'var(--color-primary-600)', fontSize: '16px' }} />
                                    <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                                        Xem trước Logic Kích hoạt
                                    </Text>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: 'var(--color-secondary-100)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-secondary-300)',
                                }}>
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        <Text style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                            <Text strong style={{ color: 'var(--color-primary-600)' }}>
                                                Chi trả {(policyData.payoutBaseRate * 100)?.toFixed(2)}%
                                            </Text>
                                            {' '}(tối đa <Text strong>{policyData.payoutCap?.toLocaleString()} {policyData.coverageCurrency}</Text>) khi{' '}
                                            <Text strong style={{ color: 'var(--color-primary-700)' }}>
                                                {policyData.configuration?.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                                            </Text>
                                            {' '}các điều kiện sau được thỏa mãn:
                                        </Text>
                                        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: '20px' }}>
                                            {policyData.configuration?.triggerConditions?.map((condition, index) => (
                                                <li key={condition.id} style={{ marginBottom: '8px' }}>
                                                    <Text style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                                        <Text style={{ color: 'var(--color-primary-600)' }}>
                                                            {getAggregationFunctionLabel(condition.aggregationFunction)}
                                                        </Text>
                                                        {' '}của{' '}
                                                        <Text strong style={{ color: 'var(--color-primary-700)' }}>
                                                            {getDataSourceLabel(condition)}
                                                        </Text>
                                                        {' '}trong <Text strong>{condition.aggregationWindowDays} ngày</Text>
                                                        {' '}
                                                        <Text style={{ color: 'var(--color-secondary-700)' }}>
                                                            {getThresholdOperatorLabel(condition.thresholdOperator)}
                                                        </Text>
                                                        {' '}<Text strong>{condition.thresholdValue} {getDataSourceUnit(condition)}</Text>
                                                        {condition.baselineWindowDays > 0 && (
                                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                                {' '}(baseline: {condition.baselineWindowDays} ngày)
                                                            </Text>
                                                        )}
                                                    </Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </Space>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            borderRadius: '6px',
                        }}>
                            <Text type="secondary">Chưa có điều kiện kích hoạt nào được cấu hình</Text>
                        </div>
                    )}
                </div>
            </Space>
        </Card>
    );
};

export default ConfigurationDetail;
