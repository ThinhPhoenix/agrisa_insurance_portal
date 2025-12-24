import { InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Tag, Typography } from 'antd';
import { memo, useRef } from 'react';
import ConditionZoneChart from './ConditionZoneChart';
import { buildNaturalSentence, getDisplayName } from './chartHelpers';

const { Text, Title } = Typography;

/**
 * Component diễn giải logic trigger thành câu văn dễ hiểu
 * Ví dụ: "Nhiệt độ bé hơn 60 thì kích hoạt ABC"
 */
const TriggerLogicExplainerComponent = ({ configurationData = {}, mockData = {} }) => {
    const { logicalOperator = 'AND', conditions = [], growthStage } = configurationData;

    // Helper: Lấy label từ operator (natural language)
    const getOperatorText = (operator, natural = true) => {
        if (natural) {
            const naturalMapping = {
                '<': 'giảm xuống dưới',
                '>': 'vượt quá',
                '<=': 'không cao hơn',
                '>=': 'không thấp hơn',
                '==': 'đúng bằng',
                '!=': 'khác với',
                'change_gt': 'tăng lên hơn',
                'change_lt': 'giảm xuống hơn'
            };
            return naturalMapping[operator] || operator;
        }
        const mapping = {
            '<': 'nhỏ hơn',
            '>': 'lớn hơn',
            '<=': 'nhỏ hơn hoặc bằng',
            '>=': 'lớn hơn hoặc bằng',
            '==': 'bằng',
            '!=': 'khác',
            'change_gt': 'thay đổi tăng lớn hơn',
            'change_lt': 'thay đổi giảm nhỏ hơn'
        };
        return mapping[operator] || operator;
    };

    // Helper: Lấy label hàm tổng hợp (natural language)
    const getAggFunctionText = (func, natural = true) => {
        if (natural) {
            const naturalMapping = {
                'sum': 'tổng lượng',
                'avg': 'mức trung bình',
                'min': 'mức thấp nhất',
                'max': 'mức cao nhất',
                'change': 'biến đổi'
            };
            return naturalMapping[func] || func;
        }
        const mapping = {
            'sum': 'tổng',
            'avg': 'trung bình',
            'min': 'giá trị nhỏ nhất',
            'max': 'giá trị lớn nhất',
            'change': 'thay đổi'
        };
        return mapping[func] || func;
    };

    // Nếu chưa có điều kiện
    if (!conditions || conditions.length === 0) {
        return (
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">
                        <InfoCircleOutlined /> Chưa có điều kiện kích hoạt. Vui lòng thêm ít nhất một điều kiện.
                    </Text>
                </Space>
            </Card>
        );
    }

    // Sort conditions by conditionOrder
    const sortedConditions = [...conditions].sort((a, b) =>
        (a.conditionOrder || 1) - (b.conditionOrder || 1)
    );

    // Create refs for scrolling to conditions
    const conditionRefs = useRef({});

    // Handle click on summary chart to scroll to condition
    const handleConditionClick = (condition) => {
        const ref = conditionRefs.current[condition.id];
        if (ref) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight effect
            ref.style.transition = 'all 0.3s ease';
            ref.style.transform = 'scale(1.02)';
            ref.style.boxShadow = '0 4px 12px rgba(24, 87, 63, 0.2)';
            setTimeout(() => {
                ref.style.transform = 'scale(1)';
                ref.style.boxShadow = '';
            }, 600);
        }
    };

    // Build câu văn cho từng điều kiện (improved with natural language)
    const conditionTexts = sortedConditions.map((condition, index) => {
        const {
            dataSourceLabel = 'Nguồn dữ liệu',
            parameterName = '',
            aggregationFunction,
            aggregationWindowDays,
            thresholdOperator,
            thresholdValue,
            unit = '',
            earlyWarningThreshold,
            consecutiveRequired,
            baselineWindowDays,
            baselineFunction
        } = condition;

        // Use natural sentence builder
        const naturalSentence = buildNaturalSentence(condition);

        // Additional explanation for better understanding
        let explanation = '';
        const sourceName = getDisplayName(parameterName, dataSourceLabel);
        const aggText = getAggFunctionText(aggregationFunction, true);
        const unitStr = unit ? ` ${unit}` : '';

        if (thresholdOperator === '>') {
            explanation = `Điều này có nghĩa là nếu ${aggText} ${sourceName} liên tục cao hơn ${thresholdValue}${unitStr} trong ${aggregationWindowDays} ngày, nông dân sẽ nhận được bồi thường.`;
        } else if (thresholdOperator === '<') {
            explanation = `Điều này có nghĩa là nếu ${aggText} ${sourceName} liên tục thấp hơn ${thresholdValue}${unitStr} trong ${aggregationWindowDays} ngày, nông dân sẽ nhận được bồi thường.`;
        } else if (thresholdOperator === 'change_gt' || thresholdOperator === 'change_lt') {
            explanation = `Hệ thống sẽ so sánh ${aggText} hiện tại với mức ${baselineFunction ? getAggFunctionText(baselineFunction, true) : 'tham chiếu'} ${baselineWindowDays || 0} ngày trước để phát hiện biến đổi bất thường.`;
        }

        // Phần cảnh báo sớm
        let warningText = '';
        if (earlyWarningThreshold) {
            warningText = `Cảnh báo sớm sẽ được gửi khi đạt ngưỡng ${earlyWarningThreshold}${unitStr}, giúp nông dân có thời gian chuẩn bị.`;
        }

        return {
            order: condition.conditionOrder || index + 1,
            naturalSentence,
            explanation,
            warningText,
            condition
        };
    });

    // Ghép các điều kiện với nhau
    const logicText = logicalOperator === 'AND' ? 'VÀ' : 'HOẶC';
    const logicColor = logicalOperator === 'AND' ? 'blue' : 'orange';

    return (
        <Card
            size="small"
            title={
                <Space>
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />
                    <span>Diễn giải Logic Kích hoạt</span>
                </Space>
            }
            style={{ backgroundColor: '#f0f5ff', borderColor: '#1890ff' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Phần mô tả giai đoạn sinh trưởng */}
                {growthStage && (
                    <Alert
                        message={
                            <Text>
                                <strong>Giai đoạn:</strong> {growthStage}
                            </Text>
                        }
                        type="info"
                        showIcon={false}
                        style={{ marginBottom: 8 }}
                    />
                )}

                {/* Câu tổng quan */}
                <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #d9d9d9' }}>
                    <Text strong style={{ fontSize: '15px', color: '#262626' }}>
                        Bảo hiểm sẽ kích hoạt thanh toán khi:
                    </Text>
                </div>

                {/* Danh sách điều kiện */}
                {conditionTexts.map((item, idx) => (
                    <div
                        key={idx}
                        ref={(el) => (conditionRefs.current[item.condition.id] = el)}
                        style={{
                            padding: '16px',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: '2px solid #e6f7ff',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            {/* Số thứ tự và logic operator */}
                            <Space size={8}>
                                <Tag color="blue" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                    Điều kiện {item.order}
                                </Tag>
                                {idx > 0 && (
                                    <Tag color={logicColor} style={{ fontSize: '12px' }}>
                                        {logicText}
                                    </Tag>
                                )}
                            </Space>

                            {/* Mini Chart for this condition */}
                            <ConditionZoneChart
                                condition={item.condition}
                                showTitle={false}
                                height={100}
                                compactMode={false}
                            />

                            {/* Câu diễn giải tự nhiên */}
                            <div style={{ marginLeft: '8px', marginTop: '8px' }}>
                                <Text
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '1.8',
                                        display: 'block',
                                        marginBottom: '8px'
                                    }}
                                >
                                    {/* Parse markdown bold **text** */}
                                    {item.naturalSentence.split(/(\*\*.*?\*\*)/).map((part, i) => {
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                            return (
                                                <Text key={i} strong style={{ color: '#18573f' }}>
                                                    {part.slice(2, -2)}
                                                </Text>
                                            );
                                        }
                                        return <Text key={i}>{part}</Text>;
                                    })}
                                </Text>

                                {/* Giải thích thêm */}
                                {item.explanation && (
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            display: 'block',
                                            fontStyle: 'italic',
                                            marginTop: '4px'
                                        }}
                                    >
                                        {item.explanation}
                                    </Text>
                                )}
                            </div>

                            {/* Cảnh báo sớm */}
                            {item.warningText && (
                                <Alert
                                    message={item.warningText}
                                    type="warning"
                                    showIcon
                                    style={{
                                        fontSize: '12px',
                                        marginTop: '8px',
                                        backgroundColor: '#fffbe6',
                                        border: '1px solid #ffe58f'
                                    }}
                                />
                            )}
                        </Space>
                    </div>
                ))}

                {/* Tổng kết logic */}
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: logicalOperator === 'AND' ? '#e6f7ff' : '#fff7e6',
                    borderRadius: '6px',
                    border: `2px solid ${logicalOperator === 'AND' ? '#1890ff' : '#faad14'}`
                }}>
                    <Text strong style={{ fontSize: '14px' }}>
                        💡 Tóm tắt: Kích hoạt khi {' '}
                        <Tag color={logicColor} style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            {logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                        </Tag>
                        {' '}{conditions.length} điều kiện trên được thỏa mãn
                        {logicalOperator === 'AND' ? ' (phải đủ tất cả)' : ' (đủ 1 trong số đó)'}
                    </Text>
                </div>
            </Space>
        </Card>
    );
};

const TriggerLogicExplainer = memo(TriggerLogicExplainerComponent);
TriggerLogicExplainer.displayName = 'TriggerLogicExplainer';

export default TriggerLogicExplainer;
