import CustomTable from '@/components/custom-table';
import { SettingOutlined } from '@ant-design/icons';
import { Card, Collapse, Descriptions, Tag, Typography } from 'antd';

const { Title, Text } = Typography;
const { Panel } = Collapse;

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
                        {record.dataSourceLabel || mockData.dataSources.find(ds => ds.id === record.dataSourceId)?.label || 'N/A'}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.parameterName || mockData.dataSources.find(ds => ds.id === record.dataSourceId)?.parameterName || ''} (
                        {record.unit || mockData.dataSources.find(ds => ds.id === record.dataSourceId)?.unit || ''})
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
                        {record.aggregationFunctionLabel || mockData.aggregationFunctions.find(f => f.value === record.aggregationFunction)?.label || record.aggregationFunction}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.aggregationWindowDays} ngày
                        {record.baselineWindowDays && (
                            <> | Baseline: {record.baselineWindowDays} ngày</>
                        )}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div>
                    <Tag color="red">
                        {record.thresholdOperatorLabel || mockData.thresholdOperators.find(op => op.value === record.thresholdOperator)?.label || record.thresholdOperator}
                    </Tag>
                    <Text strong> {record.thresholdValue}</Text> {record.unit}
                    {record.alertThreshold && (
                        <>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Cảnh báo sớm: {record.alertThreshold}%
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

            <Collapse defaultActiveKey={['payout']} size="large">
                {/* Payout Configuration */}
                <Panel
                    header="Cấu hình Thanh toán chi trả"
                    key="payout"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Chi cố định (VND)">
                            <Text strong>{policyData.fixedPayoutAmount?.toLocaleString()} ₫</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi trả tối đa (VND)">
                            <Text strong>{policyData.payoutMaxAmount?.toLocaleString()} ₫</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi vượt ngưỡng (%)">
                            <Text strong>{(policyData.exceedingThresholdRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi trả cơ bản">
                            <Text strong>{(policyData.basicPayoutRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Chờ thanh toán (ngày)">
                            <Text strong>{policyData.payoutDelayDays || 0} ngày</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Lấy theo diện tích">
                            <Tag color={policyData.basedOnHectare ? 'green' : 'red'}>
                                {policyData.basedOnHectare ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Insurance Cost Configuration */}
                <Panel
                    header="Cấu hình chi phí bảo hiểm"
                    key="insurance-cost"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Số tiền chi trả cố định (VND)">
                            <Text strong>{policyData.insuranceFixedPayoutAmount?.toLocaleString()} ₫</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỉ lệ chi trả cơ bản">
                            <Text strong>{(policyData.insuranceBasicPayoutRate * 100)?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian gia hạn tối đa (ngày)">
                            <Text strong>{policyData.maxRenewalTime} ngày</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Monitoring & Alerts */}
                <Panel
                    header="Giám sát & Cảnh báo"
                    key="monitoring"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Số lần giám sát">
                            <Text strong>{policyData.monitoringFrequencyValue} lần</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Đơn vị thời gian">
                            <Text strong>{policyData.monitoringFrequencyUnit}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại cảnh báo" span={2}>
                            <div>
                                {policyData.alertTypes?.map((type, index) => (
                                    <Tag key={index} color="orange" style={{ marginBottom: 4 }}>
                                        {mockData.alertTypes.find(a => a.value === type)?.label || type}
                                    </Tag>
                                ))}
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Lifecycle Configuration */}
                <Panel
                    header="Cấu hình lifecycle (Chu kỳ sống của policy)"
                    key="lifecycle"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tự động làm mới (gia hạn) hợp đồng">
                            <Tag color={policyData.autoRenew ? 'green' : 'red'}>
                                {policyData.autoRenew ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Gia hạn nhiều thì có giảm giá (%)">
                            <Text strong>{policyData.renewalDiscount?.toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian sống/tồn tại của bảo hiểm gốc" span={2}>
                            <Text strong>
                                {policyData.originalInsuranceYears || 0} năm, {policyData.originalInsuranceMonths || 0} tháng, {policyData.originalInsuranceDays || 0} ngày
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Registration Time Configuration */}
                <Panel
                    header="Cấu hình thời hạn bảo hiểm"
                    key="registration-time"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Thời gian hiệu lực bảo hiểm (bắt đầu quan sát)">
                            <Text strong>{policyData.insuranceEffectiveStartDate ? new Date(policyData.insuranceEffectiveStartDate).toLocaleDateString('vi-VN') : 'N/A'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian kết thúc hiệu lực bảo hiểm (kết thúc quan sát)">
                            <Text strong>{policyData.insuranceEffectiveEndDate ? new Date(policyData.insuranceEffectiveEndDate).toLocaleDateString('vi-VN') : 'N/A'}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </Panel>

                {/* Trigger Conditions */}
                <Panel
                    header={`Điều kiện Kích hoạt (${policyData.conditions?.length || 0} điều kiện)`}
                    key="conditions"
                >
                    {policyData.conditions?.length > 0 && (
                        <>
                            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                                <Descriptions.Item label="Toán tử Logic giữa các điều kiện">
                                    <Tag color="blue">{policyData.logicalOperator}</Tag>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                        {mockData.logicalOperators.find(op => op.value === policyData.logicalOperator)?.description || ''}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>

                            <CustomTable
                                columns={triggerColumns}
                                dataSource={policyData.conditions || []}
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
                                        Thanh toán <Text strong>{(policyData.basicPayoutRate * 100)?.toFixed(2)}%</Text> (tối đa{' '}
                                        <Text strong>{policyData.payoutMaxAmount?.toLocaleString()} ₫</Text>) khi{' '}
                                        <Text strong>
                                            {policyData.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                                        </Text>
                                        {' '}các điều kiện sau được thỏa mãn:
                                    </Text>
                                    <ul style={{ marginTop: 8 }}>
                                        {policyData.conditions.map((condition, index) => (
                                            <li key={condition.id}>
                                                <Text>
                                                    {condition.aggregationFunctionLabel} của {condition.dataSourceLabel}{' '}
                                                    trong {condition.aggregationWindowDays} ngày{' '}
                                                    {condition.thresholdOperatorLabel} {condition.thresholdValue} {condition.unit}
                                                    {condition.baselineWindowDays && (
                                                        <> (baseline: {condition.baselineWindowDays} ngày)</>
                                                    )}
                                                </Text>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        </>
                    )}

                    {(!policyData.conditions || policyData.conditions.length === 0) && (
                        <Text type="secondary">Chưa có điều kiện kích hoạt nào được cấu hình</Text>
                    )}
                </Panel>

                {/* Additional Settings */}
                <Panel
                    header="Cài đặt Bổ sung"
                    key="additional"
                >
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Mô tả Policy" span={2}>
                            <Text>{policyData.policyDescription || 'Không có mô tả'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Cho phép thời gian ân hạn">
                            <Tag color={policyData.enableGracePeriod ? 'green' : 'red'}>
                                {policyData.enableGracePeriod ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian ân hạn (ngày)">
                            <Text strong>{policyData.gracePeriodDays || 0} ngày</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tự động gia hạn">
                            <Tag color={policyData.enableAutoRenewal ? 'green' : 'red'}>
                                {policyData.enableAutoRenewal ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                    </Descriptions>

                    {/* Notifications */}
                    {policyData.importantNotifications?.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Thông tin quan trọng cần thông báo</Title>
                            <div className="notifications-list">
                                {policyData.importantNotifications.map((notification, index) => (
                                    <Card
                                        key={notification.id}
                                        size="small"
                                        className="notification-item"
                                        style={{ marginBottom: 16 }}
                                    >
                                        <div style={{ marginBottom: 12 }}>
                                            <Text strong style={{ color: '#1890ff' }}>
                                                #{index + 1}: {notification.title}
                                            </Text>
                                        </div>
                                        <Text>{notification.description}</Text>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </Panel>
            </Collapse>
        </Card>
    );
};

export default ConfigurationDetail;
