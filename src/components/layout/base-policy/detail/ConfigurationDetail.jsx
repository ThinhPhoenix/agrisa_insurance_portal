import CustomTable from '@/components/custom-table';
import { SettingOutlined } from '@ant-design/icons';
import { Card, Collapse, Descriptions, Tag, Typography } from 'antd';

const { Title, Text } = Typography;
const { Panel } = Collapse;

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
                        Cửa sổ: {record.aggregationWindowDays} ngày
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
            <Title level={4}>
                <SettingOutlined style={{ marginRight: 8 }} />
                Cấu hình Chính sách
            </Title>

            <Collapse defaultActiveKey={['payout', 'conditions']} size="large">
                {/* Payout Configuration */}
                <Panel
                    header="Cấu hình Thanh toán chi trả"
                    key="payout"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Số tiền chi trả cố định">
                            <Text strong>{policyData.fixPayoutAmount?.toLocaleString()} {policyData.coverageCurrency}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi trả theo hecta">
                            <Tag color={policyData.isPayoutPerHectare ? 'green' : 'red'}>
                                {policyData.isPayoutPerHectare ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Hệ số vượt ngưỡng">
                            <Text strong>{policyData.overThresholdMultiplier}x</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỉ lệ chi trả cơ bản">
                            <Text strong>{(policyData.payoutBaseRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới hạn chi trả">
                            <Text strong>{policyData.payoutCap?.toLocaleString()} {policyData.coverageCurrency}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỉ lệ hoàn phí khi hủy">
                            <Text strong>{(policyData.cancelPremiumRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Monitoring & Alerts */}
                <Panel
                    header="Giám sát & Cảnh báo"
                    key="monitoring"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tần suất giám sát">
                            <Text strong>{policyData.configuration?.monitorInterval} {getMonitorFrequencyUnitText(policyData.configuration?.monitorFrequencyUnit)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giai đoạn sinh trưởng">
                            <Text strong>{policyData.configuration?.growthStage || 'N/A'}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Lifecycle Configuration */}
                <Panel
                    header="Cấu hình Chu kỳ sống của Policy"
                    key="lifecycle"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tự động gia hạn hợp đồng">
                            <Tag color={policyData.autoRenewal ? 'green' : 'red'}>
                                {policyData.autoRenewal ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỉ lệ giảm giá khi gia hạn">
                            <Text strong>{(policyData.renewalDiscountRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Registration Time Configuration */}
                <Panel
                    header="Cấu hình thời hạn bảo hiểm"
                    key="registration-time"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Thời gian mở đăng ký">
                            <Text strong>{policyData.enrollmentStartDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian đóng đăng ký">
                            <Text strong>{policyData.enrollmentEndDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian bắt đầu hiệu lực">
                            <Text strong>{policyData.insuranceValidFromDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian kết thúc hiệu lực">
                            <Text strong>{policyData.insuranceValidToDay}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian gia hạn thanh toán phí tối đa">
                            <Text strong>{policyData.maxPremiumPaymentProlong} ngày</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Trigger Conditions */}
                <Panel
                    header={`Điều kiện Kích hoạt (${policyData.configuration?.triggerConditions?.length || 0} điều kiện)`}
                    key="conditions"
                >
                    {policyData.configuration?.triggerConditions?.length > 0 && (
                        <>
                            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                                <Descriptions.Item label="Toán tử Logic giữa các điều kiện">
                                    <Tag color="blue">{policyData.configuration?.logicalOperator}</Tag>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                        {mockData.logicalOperators.find(op => op.value === policyData.configuration?.logicalOperator)?.description || ''}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>

                            <CustomTable
                                columns={triggerColumns}
                                dataSource={policyData.configuration?.triggerConditions || []}
                                pagination={false}
                            />

                            {/* Logic Preview */}
                            <Card
                                title="Xem trước Logic Kích hoạt"
                                className="logic-preview-card"
                                style={{ marginTop: 16 }}
                            >
                                <div className="logic-preview">
                                    <Text>
                                        Thanh toán <Text strong>{(policyData.payoutBaseRate * 100)?.toFixed(2)}%</Text> (tối đa{' '}
                                        <Text strong>{policyData.payoutCap?.toLocaleString()} {policyData.coverageCurrency}</Text>) khi{' '}
                                        <Text strong>
                                            {policyData.configuration?.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                                        </Text>
                                        {' '}các điều kiện sau được thỏa mãn:
                                    </Text>
                                    <ul style={{ marginTop: 8 }}>
                                        {policyData.configuration?.triggerConditions?.map((condition, index) => (
                                            <li key={condition.id}>
                                                <Text>
                                                    {getAggregationFunctionLabel(condition.aggregationFunction)} của {getDataSourceLabel(condition)}{' '}
                                                    trong {condition.aggregationWindowDays} ngày{' '}
                                                    {getThresholdOperatorLabel(condition.thresholdOperator)} {condition.thresholdValue} {getDataSourceUnit(condition)}
                                                    {condition.baselineWindowDays > 0 && (
                                                        <> (baseline: {condition.baselineWindowDays} ngày, hàm: {condition.baselineFunction})</>
                                                    )}
                                                </Text>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        </>
                    )}

                    {(!policyData.configuration?.triggerConditions || policyData.configuration?.triggerConditions.length === 0) && (
                        <Text type="secondary">Chưa có điều kiện kích hoạt nào được cấu hình</Text>
                    )}
                </Panel>

                {/* Additional Settings */}
                <Panel
                    header="Cài đặt Bổ sung"
                    key="additional"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Mô tả sản phẩm" span={2}>
                            <Text>{policyData.description || 'Không có mô tả'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thông tin bổ sung quan trọng" span={2}>
                            <Text>{policyData.importantAdditionalInformation || 'Không có thông tin'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="URL tài liệu mẫu" span={2}>
                            <Text code>{policyData.templateDocumentUrl || 'N/A'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái xác thực tài liệu">
                            <Tag color={getValidationStatusColor(policyData.documentValidationStatus || 'pending')}>
                                {getValidationStatusText(policyData.documentValidationStatus || 'pending')}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>
            </Collapse>
        </Card>
    );
};

export default ConfigurationDetail;
