import { LinkOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Tag, Typography } from 'antd';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip
} from 'chart.js';
import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    calculateChartRange,
    getZoneColor,
    operatorToVietnamese
} from './chartHelpers';

const { Text } = Typography;

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

/**
 * TriggerLogicSummaryChart - Overview visualization of all conditions with AND/OR logic
 *
 * @param {Object} props
 * @param {Array} props.conditions - Array of condition objects
 * @param {string} props.logicalOperator - "AND" | "OR"
 * @param {string} props.growthStage - Growth stage label
 * @param {Function} props.onConditionClick - Callback when clicking a condition bar
 */
const TriggerLogicSummaryChartComponent = ({
    conditions = [],
    logicalOperator = 'AND',
    growthStage = '',
    onConditionClick
}) => {
    // Don't show summary chart if there's only 1 condition (not useful)
    if (!conditions || conditions.length === 0 || conditions.length === 1) {
        return null;
    }

    // Sort conditions by order
    const sortedConditions = useMemo(() => {
        return [...conditions].sort((a, b) =>
            (a.conditionOrder || 1) - (b.conditionOrder || 1)
        );
    }, [conditions]);

    // Generate chart data
    const chartData = useMemo(() => {
        const labels = sortedConditions.map((c, idx) => {
            const paramName = c.parameterName || c.dataSourceLabel || `Điều kiện ${idx + 1}`;
            return paramName;
        });

        // Create a dataset for each condition showing its trigger zone
        const datasets = sortedConditions.map((condition, idx) => {
            const { zones } = calculateChartRange(
                condition.thresholdOperator,
                condition.thresholdValue,
                condition.earlyWarningThreshold
            );

            // Find the trigger zone
            const triggerZone = zones.find(z => z.type === 'trigger');
            const width = triggerZone ? (triggerZone.end - triggerZone.start) : 0;

            return {
                label: condition.parameterName || condition.dataSourceLabel || `Điều kiện ${idx + 1}`,
                data: Array(sortedConditions.length).fill(null).map((_, i) => i === idx ? width : null),
                backgroundColor: getZoneColor('trigger'),
                borderColor: getZoneColor('trigger', true),
                borderWidth: 2,
                borderRadius: 6,
                conditionId: condition.id,
                conditionOrder: condition.conditionOrder || idx + 1,
                hoverBackgroundColor: '#ef9a9a',
                hoverBorderColor: '#e57373'
            };
        });

        return {
            labels,
            datasets
        };
    }, [sortedConditions]);

    // Chart options
    const options = useMemo(() => ({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
            if (elements.length > 0 && onConditionClick) {
                const datasetIndex = elements[0].datasetIndex;
                const condition = sortedConditions[datasetIndex];
                onConditionClick(condition);
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#18573f',
                bodyColor: '#0e3528',
                borderColor: '#ffcdd2',
                borderWidth: 2,
                padding: 12,
                bodyFont: {
                    size: 13
                },
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                displayColors: false,
                callbacks: {
                    title: function (context) {
                        const datasetIndex = context[0].datasetIndex;
                        const condition = sortedConditions[datasetIndex];
                        return `Điều kiện ${condition.conditionOrder || datasetIndex + 1}`;
                    },
                    label: function (context) {
                        const datasetIndex = context.datasetIndex;
                        const condition = sortedConditions[datasetIndex];
                        const opText = operatorToVietnamese(condition.thresholdOperator, true);
                        const unitStr = condition.unit ? ` ${condition.unit}` : '';

                        return [
                            `${condition.parameterName || condition.dataSourceLabel}`,
                            `Kích hoạt khi ${opText} ${condition.thresholdValue}${unitStr}`,
                            '',
                            '💡 Click để xem chi tiết'
                        ];
                    }
                }
            },
            title: {
                display: true,
                text: logicalOperator === 'AND'
                    ? 'Tất cả điều kiện phải thỏa mãn'
                    : 'Chỉ cần 1 điều kiện thỏa mãn',
                font: {
                    size: 14,
                    weight: 'bold'
                },
                color: logicalOperator === 'AND' ? '#1890ff' : '#faad14',
                padding: {
                    bottom: 15
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Khoảng giá trị kích hoạt',
                    font: {
                        size: 11,
                        style: 'italic'
                    },
                    color: '#595959'
                }
            },
            y: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    color: '#18573f',
                    padding: 8,
                    callback: function (value, index) {
                        const condition = sortedConditions[index];
                        const order = condition?.conditionOrder || index + 1;
                        return `#${order}`;
                    }
                }
            }
        },
        animation: {
            duration: 800,
            easing: 'easeOutQuart',
            delay: (context) => {
                // Stagger effect - each bar appears sequentially
                return context.datasetIndex * 150;
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 5,
                bottom: 5
            }
        }
    }), [sortedConditions, onConditionClick, logicalOperator]);

    const logicColor = logicalOperator === 'AND' ? 'blue' : 'orange';
    const logicText = logicalOperator === 'AND' ? 'VÀ' : 'HOẶC';

    return (
        <Card
            size="small"
            style={{
                backgroundColor: '#f0f5ff',
                borderColor: '#1890ff',
                marginBottom: 16
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* Header */}
                <Space>
                    <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                    <Text strong style={{ fontSize: 15, color: '#18573f' }}>
                        Tổng Quan Logic Kích Hoạt
                    </Text>
                    <Tag color={logicColor} style={{ marginLeft: 8 }}>
                        {logicText}
                    </Tag>
                </Space>

                {/* Logic explanation */}
                <Alert
                    message={
                        <Space size={4}>
                            <LinkOutlined />
                            <Text style={{ fontSize: 12 }}>
                                {logicalOperator === 'AND' ? (
                                    <>
                                        Bảo hiểm kích hoạt khi <strong>TẤT CẢ {conditions.length} điều kiện</strong> dưới đây
                                        được thỏa mãn đồng thời
                                    </>
                                ) : (
                                    <>
                                        Bảo hiểm kích hoạt khi <strong>BẤT KỲ</strong> điều kiện nào dưới đây được thỏa mãn
                                    </>
                                )}
                            </Text>
                        </Space>
                    }
                    type={logicalOperator === 'AND' ? 'info' : 'warning'}
                    showIcon={false}
                    style={{
                        fontSize: 12,
                        padding: '6px 12px',
                        marginBottom: 8
                    }}
                />

                {/* Chart */}
                <div style={{
                    width: '100%',
                    height: Math.max(120, conditions.length * 50),
                    minHeight: 120,
                    maxHeight: 300,
                    cursor: onConditionClick ? 'pointer' : 'default'
                }}>
                    <Bar data={chartData} options={options} />
                </div>

                {/* Footer hint */}
                <Text
                    type="secondary"
                    style={{
                        fontSize: 11,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        display: 'block',
                        marginTop: 4
                    }}
                >
                    💡 Click vào thanh điều kiện để xem chi tiết bên dưới
                </Text>
            </Space>
        </Card>
    );
};

const TriggerLogicSummaryChart = memo(TriggerLogicSummaryChartComponent);
TriggerLogicSummaryChart.displayName = 'TriggerLogicSummaryChart';

export default TriggerLogicSummaryChart;
