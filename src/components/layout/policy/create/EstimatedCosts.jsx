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
        <Card title={
            <Space>
                <CalculatorOutlined />
                <span>Chi phí Ước tính</span>
            </Space>
        }>
            {/* Monthly Data Cost */}
            <div className="cost-section">
                <Statistic
                    title="Chi phí Dữ liệu Hàng tháng"
                    value={monthlyDataCost}
                    prefix={<DollarOutlined />}
                    suffix="USD"
                    precision={2}
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Tổng chi phí sử dụng {basicData.selectedDataSources.length} nguồn dữ liệu
                </Text>
            </div>

            <Divider />

            {/* Data Complexity Score */}
            <div className="cost-section">
                <Row justify="space-between" align="middle">
                    <Col>
                        <Text strong>Độ phức tạp Dữ liệu</Text>
                    </Col>
                    <Col>
                        <Tag color={complexityInfo.color}>{complexityInfo.level}</Tag>
                    </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                    <Statistic
                        value={dataComplexityScore}
                        suffix="nguồn dữ liệu"
                        valueStyle={{ fontSize: '16px' }}
                    />
                    <Progress
                        percent={Math.min(dataComplexityScore * 20, 100)}
                        showInfo={false}
                        strokeColor="#1890ff"
                        size="small"
                    />
                </div>
            </div>

            <Divider />

            {/* Premium Base Rate */}
            <div className="cost-section">
                <Statistic
                    title="Tỷ lệ Phí BH Cơ sở"
                    value={premiumBaseRate * 100}
                    prefix={<PercentageOutlined />}
                    suffix="%"
                    precision={2}
                    valueStyle={{ fontSize: '16px' }}
                />
            </div>

            <Divider />

            {/* Total Estimated Cost */}
            <div className="cost-section">
                <Statistic
                    title="Tổng Chi phí Ước tính/Tháng"
                    value={totalEstimatedCost}
                    prefix={<DollarOutlined />}
                    suffix="USD"
                    precision={2}
                    valueStyle={{
                        color: '#52c41a',
                        fontSize: '20px',
                        fontWeight: 'bold'
                    }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Chi phí mà AGRISA thu từ đối tác bảo hiểm để vận hành Policy
                </Text>
            </div>

            {/* Data Sources Breakdown */}
            {basicData.selectedDataSources.length > 0 && (
                <>
                    <Divider />
                    <div className="data-sources-breakdown">
                        <Title level={5}>Chi tiết Nguồn dữ liệu</Title>
                        {basicData.selectedDataSources.map((source, index) => (
                            <div key={source.id} className="data-source-item">
                                <Row justify="space-between" align="middle">
                                    <Col span={16}>
                                        <Text strong style={{ fontSize: '12px' }}>
                                            {source.label}
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            {source.categoryLabel} • {source.tierLabel}
                                        </Text>
                                    </Col>
                                    <Col span={8} style={{ textAlign: 'right' }}>
                                        <Text style={{ fontSize: '12px' }}>
                                            ${(source.baseCost *
                                                (source.category === 'weather' ? 1.0 :
                                                    source.category === 'satellite' ? 1.5 : 2.0) *
                                                (source.tier === 'basic' ? 1.0 :
                                                    source.tier === 'premium' ? 1.8 : 3.0)
                                            ).toFixed(2)}
                                        </Text>
                                    </Col>
                                </Row>
                                {index < basicData.selectedDataSources.length - 1 && (
                                    <Divider style={{ margin: '8px 0' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Cost Calculation Info */}
            <Divider />
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                <Title level={5}>Cách tính Chi phí</Title>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Chi phí = Chi phí cơ sở × Hệ số danh mục × Hệ số gói dịch vụ
                </Text>
                <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        • Thời tiết: 1.0x | Vệ tinh: 1.5x | Phân tích: 2.0x<br />
                        • Cơ bản: 1.0x | Cao cấp: 1.8x | Doanh nghiệp: 3.0x
                    </Text>
                </div>
            </div>
        </Card>
    );
};

export default EstimatedCosts;