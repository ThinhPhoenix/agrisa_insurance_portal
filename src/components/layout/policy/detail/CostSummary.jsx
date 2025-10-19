import { DollarOutlined } from '@ant-design/icons';
import { Card, Col, Divider, List, Row, Statistic, Typography } from 'antd';

const { Title, Text } = Typography;

const CostSummary = ({ policyData, mockData }) => {
    // Calculate costs
    const calculateCosts = () => {
        const dataSourcesCost = (policyData.selectedDataSources || []).reduce((sum, source) => {
            return sum + (source.baseCost || 0);
        }, 0);

        const coverageType = mockData.coverageTypes.find(
            t => t.value === policyData.configuration?.coverageType
        );
        const premiumRate = coverageType?.premium_rate || policyData.premiumBaseRate || 0;

        const riskLevel = mockData.riskLevels.find(
            r => r.value === policyData.configuration?.riskLevel
        );
        const riskMultiplier = riskLevel?.multiplier || 1;

        const basePremium = policyData.coverageAmount || 0;
        const estimatedPremium = basePremium * premiumRate * riskMultiplier;

        return {
            dataSourcesCost,
            basePremium,
            premiumRate,
            riskMultiplier,
            estimatedPremium,
            totalMonthlyCost: dataSourcesCost,
            maxPayout: policyData.configuration?.maxPayoutAmount || 0
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
                        title="Chi phí Dữ liệu (Tháng)"
                        value={costs.dataSourcesCost}
                        suffix="₫"
                        precision={0}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Phí Bảo hiểm Ước tính"
                        value={costs.estimatedPremium}
                        suffix="₫"
                        precision={0}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
                <Col span={12}>
                    <Statistic
                        title="Thanh toán Tối đa"
                        value={costs.maxPayout}
                        suffix="₫"
                        precision={0}
                        valueStyle={{ color: '#ff4d4f' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic
                        title="Tỷ lệ Thanh toán"
                        value={policyData.configuration?.payoutPercentage || 0}
                        suffix="%"
                        precision={0}
                    />
                </Col>
            </Row>

            <Divider />

            <List
                size="small"
                header={<Text strong>Chi tiết Tính toán</Text>}
                bordered
                dataSource={[
                    {
                        label: 'Tỷ lệ Phí BH',
                        value: `${(costs.premiumRate * 100).toFixed(2)}%`
                    },
                    {
                        label: 'Hệ số Rủi ro',
                        value: `${costs.riskMultiplier}x`
                    },
                    {
                        label: 'Số nguồn Dữ liệu',
                        value: policyData.selectedDataSources?.length || 0
                    },
                    {
                        label: 'Số Điều kiện Kích hoạt',
                        value: policyData.configuration?.triggerConditions?.length || 0
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
