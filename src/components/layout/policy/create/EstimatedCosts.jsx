import { CalculatorOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

const EstimatedCosts = ({ estimatedCosts, basicData }) => {
    const {
        monthlyDataCost,
        dataComplexityScore,
        premiumBaseRate,
        totalEstimatedCost
    } = estimatedCosts;

    // Calculate complexity level
    const getComplexityLevel = (score) => {
        if (score === 0) return { level: 'Chưa cấu hình', color: 'default' };
        if (score <= 2) return { level: 'Đơn giản', color: 'green' };
        if (score <= 4) return { level: 'Trung bình', color: 'orange' };
        return { level: 'Phức tạp', color: 'red' };
    };

    const complexityInfo = getComplexityLevel(dataComplexityScore);

    return (
        <Card
            title={
                <Space size="small">
                    <CalculatorOutlined />
                    <span style={{ fontSize: '14px' }}>Chi phí Ước tính</span>
                </Space>
            }
            size="small"
            style={{
                fontSize: '12px',
                maxHeight: '100%',
                overflow: 'unset'
            }}
            bodyStyle={{
                padding: '12px'
            }}
        >
            {/* Monthly Data Cost */}
            <div className="cost-section" style={{ marginBottom: '12px' }}>
                <Statistic
                    title="Chi phí Dữ liệu/tháng"
                    value={monthlyDataCost}
                    prefix={<DollarOutlined />}
                    suffix="VND"
                    precision={0}
                    valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                />
                <Text type="secondary" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                    {basicData.selectedDataSources.length} nguồn dữ liệu
                </Text>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Data Complexity Score */}
            <div className="cost-section" style={{ marginBottom: '12px' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: '4px' }}>
                    <Col>
                        <Text strong style={{ fontSize: '11px' }}>Độ phức tạp</Text>
                    </Col>
                    <Col>
                        <Tag color={complexityInfo.color} size="small">{complexityInfo.level}</Tag>
                    </Col>
                </Row>
                <div>
                    <Text style={{ fontSize: '12px' }}>{dataComplexityScore} nguồn</Text>
                    <Progress
                        percent={Math.min(dataComplexityScore * 20, 100)}
                        showInfo={false}
                        strokeColor="#1890ff"
                        size="small"
                        style={{ marginTop: '4px' }}
                    />
                </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Premium Base Rate */}
            <div className="cost-section" style={{ marginBottom: '12px' }}>
                <Statistic
                    title="Tỷ lệ Phí BH"
                    value={premiumBaseRate * 100}
                    prefix={<PercentageOutlined />}
                    suffix="%"
                    precision={2}
                    valueStyle={{ fontSize: '12px' }}
                />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Total Estimated Cost */}
            <div className="cost-section" style={{ marginBottom: '12px' }}>
                <Statistic
                    title="Tổng Chi phí/Tháng"
                    value={totalEstimatedCost}
                    prefix={<DollarOutlined />}
                    suffix="VND"
                    precision={0}
                    valueStyle={{
                        color: '#52c41a',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                />
                <Text type="secondary" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                    Chi phí AGRISA thu từ đối tác
                </Text>
            </div>

            {/* Data Sources Breakdown */}
            {basicData.selectedDataSources.length > 0 && (
                <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div className="data-sources-breakdown">
                        <Text strong style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>
                            Chi tiết Nguồn dữ liệu
                        </Text>
                        {basicData.selectedDataSources.map((source, index) => (
                            <div key={source.id} className="data-source-item" style={{ marginBottom: '6px' }}>
                                <Row justify="space-between" align="top">
                                    <Col span={14}>
                                        <Text strong style={{ fontSize: '10px' }}>
                                            {source.label}
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '9px' }}>
                                            {source.categoryLabel} • {source.tierLabel}
                                        </Text>
                                    </Col>
                                    <Col span={10} style={{ textAlign: 'right' }}>
                                        <Text style={{ fontSize: '10px' }}>
                                            {(source.baseCost *
                                                (source.category === 'weather' ? 1.0 :
                                                    source.category === 'satellite' ? 1.5 : 2.0) *
                                                (source.tier === 'basic' ? 1.0 :
                                                    source.tier === 'premium' ? 1.8 : 3.0)
                                            ).toLocaleString()} ₫
                                        </Text>
                                    </Col>
                                </Row>
                                {index < basicData.selectedDataSources.length - 1 && (
                                    <Divider style={{ margin: '4px 0' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Cost Calculation Info */}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                <Text strong style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                    Cách tính Chi phí
                </Text>
                <Text type="secondary" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>
                    Chi phí = Cơ sở × Danh mục × Gói
                </Text>
                <Text type="secondary" style={{ fontSize: '8px', lineHeight: '1.2' }}>
                    • Thời tiết: 1.0x | Vệ tinh: 1.5x | Phân tích: 2.0x<br />
                    • Cơ bản: 1.0x | Cao cấp: 1.8x | Doanh nghiệp: 3.0x
                </Text>
            </div>
        </Card>
    );
};

export default EstimatedCosts;