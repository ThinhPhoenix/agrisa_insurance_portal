import { calculateConditionCost, calculateFrequencyCost } from '@/stores/policy-store';
import { CalculatorOutlined, PercentageOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { memo, useMemo } from 'react';

const { Title, Text } = Typography;

// ✅ OPTIMIZATION: Memoize EstimatedCosts to prevent unnecessary re-renders
const EstimatedCostsComponent = ({ estimatedCosts, basicData, configurationData }) => {
    const {
        dataComplexityScore,
        premiumBaseRate,
    } = estimatedCosts;

    // ✅ NEW: Recalculate costs using the new formula to ensure accuracy
    // Calculate frequency cost ONCE (not per condition)
    // FrequencyBaseCost = average of all data source base costs
    const frequencyCost = useMemo(() =>
        calculateFrequencyCost(
            configurationData?.monitorInterval || 1,
            configurationData?.monitorFrequencyUnit || 'hour',
            basicData?.selectedDataSources || []
        ),
        [configurationData?.monitorInterval, configurationData?.monitorFrequencyUnit, basicData?.selectedDataSources]
    );

    // Calculate total data source costs (sum of all data sources without frequency cost)
    const totalDataSourceCost = useMemo(() =>
        (basicData?.selectedDataSources || []).reduce((sum, source) => {
            const cost = calculateConditionCost(
                source.baseCost || 0,
                source.categoryMultiplier || 1,
                source.tierMultiplier || 1
            );
            return sum + cost;
        }, 0),
        [basicData?.selectedDataSources]
    );

    // Monthly data cost = data sources cost + frequency cost (counted once)
    const monthlyDataCost = useMemo(() =>
        totalDataSourceCost + frequencyCost,
        [totalDataSourceCost, frequencyCost]
    );

    // ✅ Total condition cost as sent to backend (for display in "Tổng Chi phí Điều kiện" section)
    // Note: Each condition's calculatedCost now ONLY contains data source cost (base × category × tier)
    // When building backend payload, frequency cost is added to EACH condition for validation
    // So we simulate what backend will receive: sum of data source costs + (frequency cost × number of conditions)
    const totalConditionCost = useMemo(() => {
        const conditionsCount = configurationData?.conditions?.length || 0;
        if (conditionsCount === 0) return 0;

        const dataSourceCostsSum = (configurationData?.conditions || []).reduce(
            (sum, condition) => sum + (condition.calculatedCost || 0),
            0
        );

        // Backend receives: each condition with frequency cost added
        // Total = sum of data source costs + (frequency cost × number of conditions)
        return dataSourceCostsSum + (frequencyCost * conditionsCount);
    }, [configurationData?.conditions, frequencyCost]);

    // Total estimated cost (same as monthlyDataCost for monthly billing)
    const totalEstimatedCost = monthlyDataCost;

    // Monitor frequency cost multiplier for display
    const monitorFrequencyCost = useMemo(() => {
        const multipliers = { hour: 0.5, day: 0.8, week: 1.0, month: 1.5, year: 2.0 };
        return multipliers[configurationData?.monitorFrequencyUnit] || multipliers.hour;
    }, [configurationData?.monitorFrequencyUnit]);

    // Monitor frequency cost labels (updated with new multipliers)
    const frequencyLabels = {
        hour: "Giờ (0.5x)",
        day: "Ngày (0.8x)",
        week: "Tuần (1.0x)",
        month: "Tháng (1.5x)",
        year: "Năm (2.0x)",
    };

    // Calculate complexity level
    const complexityInfo = useMemo(() => {
        if (dataComplexityScore === 0) return { level: 'Chưa cấu hình', color: 'default' };
        if (dataComplexityScore <= 2) return { level: 'Đơn giản', color: 'green' };
        if (dataComplexityScore <= 4) return { level: 'Trung bình', color: 'orange' };
        return { level: 'Phức tạp', color: 'red' };
    }, [dataComplexityScore]);

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
            styles={{
                body: { padding: '12px' }
            }}
        >
            {/* Monthly Data Cost */}
            <div className="cost-section" style={{ marginBottom: '12px' }}>
                <Statistic
                    title="Chi phí Dữ liệu/tháng"
                    value={monthlyDataCost}
                    suffix="VND"
                    precision={0}
                    valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                    formatter={(value) => {
                        const num = typeof value === 'number' ? value : parseInt(value);
                        return isNaN(num) ? '0' : num.toLocaleString('vi-VN');
                    }}
                />
                <Text type="secondary" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                    {basicData.selectedDataSources.length} nguồn dữ liệu: {totalDataSourceCost.toLocaleString('vi-VN')} ₫
                    {configurationData?.monitorInterval && configurationData?.monitorFrequencyUnit && (
                        <> • Chi phí giám sát: {frequencyCost.toLocaleString('vi-VN')} ₫</>
                    )}
                </Text>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Monitor Frequency Multiplier */}
            {configurationData?.monitorInterval && configurationData?.monitorFrequencyUnit && (
                <>
                    <div className="cost-section" style={{ marginBottom: '12px' }}>
                        <Row justify="space-between" align="middle" style={{ marginBottom: '4px' }}>
                            <Col>
                                <Text strong style={{ fontSize: '11px' }}>Tần suất Giám sát</Text>
                            </Col>
                            <Col>
                                <Tag color="cyan">{frequencyLabels[configurationData.monitorFrequencyUnit] || 'N/A'}</Tag>
                            </Col>
                        </Row>
                        <Text type="secondary" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                            Khoảng: {configurationData.monitorInterval} • Hệ số: {monitorFrequencyCost.toFixed(2)}x
                        </Text>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />
                </>
            )}

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
                    suffix="VND"
                    precision={0}
                    valueStyle={{
                        color: '#ff4d4f',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}
                    formatter={(value) => {
                        const num = typeof value === 'number' ? value : parseInt(value);
                        return isNaN(num) ? '0' : num.toLocaleString('vi-VN');
                    }}
                />
                <Text type="secondary" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                    Chi phí AGRISA thu từ đối tác
                </Text>
            </div>

            {/* Total Condition Cost */}
            {/* {configurationData?.conditions && configurationData.conditions.length > 0 && (
                <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div className="cost-section" style={{ marginBottom: '12px' }}>
                        <Statistic
                            title="Tổng Chi phí Điều kiện"
                            value={totalConditionCost}
                            suffix="VND"
                            precision={0}
                            valueStyle={{
                                color: '#fa8c16',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                            formatter={(value) => {
                                const num = typeof value === 'number' ? value : parseInt(value);
                                return isNaN(num) ? '0' : num.toLocaleString('vi-VN');
                            }}
                        />
                        <Text type="secondary" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                            {configurationData.conditions.length} điều kiện • Mỗi điều kiện có cộng chi phí giám sát ({frequencyCost.toLocaleString('vi-VN')} ₫)
                        </Text>
                    </div>
                </>
            )} */}

            {/* Data Sources Breakdown */}
            {basicData.selectedDataSources.length > 0 && (
                <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div className="data-sources-breakdown">
                        <Text strong style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>
                            Chi tiết Nguồn dữ liệu & Điều kiện
                        </Text>
                        {basicData.selectedDataSources.map((source, index) => {
                            // Find conditions for this data source
                            const relatedConditions = (configurationData?.conditions || []).filter(
                                condition => condition.dataSourceId === source.id
                            );
                            const sourceConditionCost = relatedConditions.reduce(
                                (sum, cond) => sum + (cond.calculatedCost || 0),
                                0
                            );

                            return (
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
                                            {relatedConditions.length > 0 && (
                                                <>
                                                    <br />
                                                    <Text type="success" style={{ fontSize: '9px' }}>
                                                        {relatedConditions.length} điều kiện
                                                    </Text>
                                                </>
                                            )}
                                        </Col>
                                        <Col span={10} style={{ textAlign: 'right' }}>
                                            <Text style={{ fontSize: '10px' }}>
                                                {(source.calculatedCost || (source.baseCost *
                                                    (source.categoryMultiplier || 1) *
                                                    (source.tierMultiplier || 1)
                                                )).toLocaleString('vi-VN')} ₫
                                            </Text>
                                            {sourceConditionCost > 0 && (
                                                <>
                                                    <br />
                                                    <Text type="success" style={{ fontSize: '9px' }}>
                                                        Chi phí điều kiện: {sourceConditionCost.toLocaleString()} ₫
                                                    </Text>
                                                </>
                                            )}
                                        </Col>
                                    </Row>
                                    {index < basicData.selectedDataSources.length - 1 && (
                                        <Divider style={{ margin: '4px 0' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Cost Calculation Info */}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                <Text strong style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
                    Cách tính Chi phí (Công thức mới)
                </Text>
                <Text type="secondary" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>
                    <strong>Chi phí Dữ liệu:</strong> Σ(Cơ sở × Danh mục × Gói) cho tất cả nguồn
                </Text>
                <Text type="secondary" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>
                    <strong>Chi phí Giám sát:</strong> (TB Cơ sở) - (10.000 × Khoảng × Hệ số)
                </Text>
                <Text type="secondary" style={{ fontSize: '8px', lineHeight: '1.2', marginBottom: '4px' }}>
                    Ví dụ: 3 nguồn @ 200k cơ sở (×1.5 ×1.5), giám sát 2 ngày:<br />
                    • Dữ liệu: 3 × (200k × 1.5 × 1.5) = 1.350.000 ₫<br />
                    • TB Cơ sở: (200k + 200k + 200k) / 3 = 200k<br />
                    • Giám sát: 200k - (10k × 2 × 0.8) = 184.000 ₫<br />
                    • <strong>Tổng: 1.534.000 ₫/tháng</strong>
                </Text>
                <Text strong style={{ fontSize: '9px', display: 'block', marginBottom: '2px' }}>
                    Hệ số Tần suất (mới):
                </Text>
                <Text type="secondary" style={{ fontSize: '8px', lineHeight: '1.2' }}>
                    • Giờ: 0.5 | Ngày: 0.8 | Tuần: 1.0 | Tháng: 1.5 | Năm: 2.0
                </Text>
            </div>
        </Card>
    );
};

// ✅ OPTIMIZATION: Wrap with memo and add display name
const EstimatedCosts = memo(EstimatedCostsComponent);
EstimatedCosts.displayName = 'EstimatedCosts';

export default EstimatedCosts;