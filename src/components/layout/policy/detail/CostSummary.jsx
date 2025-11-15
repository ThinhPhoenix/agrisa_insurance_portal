import { DollarOutlined } from '@ant-design/icons';
import { Card, Col, Divider, List, Row, Statistic, Typography } from 'antd';

const { Title, Text } = Typography;

const CostSummary = ({ policyData, mockData }) => {
    // Calculate costs
    const calculateCosts = () => {
        // Calculate total cost from trigger conditions
        const conditionsCost = (policyData.configuration?.triggerConditions || []).reduce((sum, condition) => {
            return sum + (condition.calculatedCost || 0);
        }, 0);

        // Get premium information
        const fixPremiumAmount = policyData.fixPremiumAmount || 0;
        const premiumBaseRate = policyData.premiumBaseRate || 0;

        // Get payout information
        const fixPayoutAmount = policyData.fixPayoutAmount || 0;
        const payoutCap = policyData.payoutCap || 0;

        return {
            conditionsCost,
            fixPremiumAmount,
            premiumBaseRate,
            fixPayoutAmount,
            payoutCap,
            conditionsCount: policyData.configuration?.triggerConditions?.length || 0
        };
    };

    const costs = calculateCosts();

    return (
        <Card>
            <Title level={4}>
                <DollarOutlined style={{ marginRight: 8 }} />
                Tóm tắt Chi phí
            </Title>

            <Row gutter={16}>
                <Col span={12}>
                    <Statistic
                        title="Phí cố định"
                        value={costs.fixPremiumAmount}
                        suffix={policyData.coverageCurrency}
                        precision={0}
                        valueStyle={{ color: '#1890ff' }}
                    />
                    {policyData.isPerHectare && (
                        <Text type="secondary" style={{ fontSize: 12 }}>Theo hecta</Text>
                    )}
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Tỷ lệ Phí BH"
                        value={costs.premiumBaseRate * 100}
                        suffix="%"
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
                <Col span={12}>
                    <Statistic
                        title="Chi trả cố định"
                        value={costs.fixPayoutAmount}
                        suffix={policyData.coverageCurrency}
                        precision={0}
                        valueStyle={{ color: '#ff4d4f' }}
                    />
                    {policyData.isPayoutPerHectare && (
                        <Text type="secondary" style={{ fontSize: 12 }}>Theo hecta</Text>
                    )}
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Giới hạn chi trả"
                        value={costs.payoutCap}
                        suffix={policyData.coverageCurrency}
                        precision={0}
                        valueStyle={{ color: '#fa8c16' }}
                    />
                </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
                <Col span={12}>
                    <Statistic
                        title="Tỷ lệ chi trả"
                        value={policyData.payoutBaseRate * 100}
                        suffix="%"
                        precision={2}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Hệ số vượt ngưỡng"
                        value={policyData.overThresholdMultiplier}
                        suffix="x"
                        precision={1}
                    />
                </Col>
            </Row>

            <Divider />

            <List
                size="small"
                header={<Text strong>Chi tiết Điều kiện</Text>}
                bordered
                dataSource={[
                    {
                        label: 'Số điều kiện kích hoạt',
                        value: costs.conditionsCount
                    },
                    {
                        label: 'Tổng chi phí điều kiện',
                        value: `${costs.conditionsCost?.toLocaleString()} ${policyData.coverageCurrency}`
                    },
                    {
                        label: 'Toán tử logic',
                        value: policyData.configuration?.logicalOperator || 'N/A'
                    },
                    {
                        label: 'Thời hạn bảo hiểm',
                        value: `${policyData.coverageDurationDays} ngày`
                    },
                    {
                        label: 'Tỷ lệ hoàn phí khi hủy',
                        value: `${(policyData.cancelPremiumRate * 100)?.toFixed(2)}%`
                    }
                ]}
                renderItem={(item) => (
                    <List.Item>
                        <Text type="secondary">{item.label}:</Text>
                        <Text strong style={{ float: 'right' }}>{item.value}</Text>
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default CostSummary;
