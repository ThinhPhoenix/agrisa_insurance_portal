import { InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Card, Space, Tag, Typography } from 'antd';
import { memo } from 'react';

const { Text, Title } = Typography;

/**
 * Component diễn giải logic trigger thành câu văn dễ hiểu
 * Ví dụ: "Nhiệt độ bé hơn 60 thì kích hoạt ABC"
 */
const TriggerLogicExplainerComponent = ({ configurationData = {}, mockData = {} }) => {
    const { logicalOperator = 'AND', conditions = [], growthStage } = configurationData;

    // Helper: Lấy label từ operator
    const getOperatorText = (operator) => {
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

    // Helper: Lấy label hàm tổng hợp
    const getAggFunctionText = (func) => {
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

    // Build câu văn cho từng điều kiện
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

        // Build main sentence
        let sentence = '';

        // Phần nguồn dữ liệu
        const sourceName = parameterName || dataSourceLabel;
        sentence += `**${sourceName}**`;

        // Phần tổng hợp
        if (aggregationFunction && aggregationWindowDays) {
            const aggText = getAggFunctionText(aggregationFunction);
            sentence += ` (${aggText} trong ${aggregationWindowDays} ngày)`;
        }

        // Phần điều kiện
        if (thresholdOperator && thresholdValue !== undefined) {
            const opText = getOperatorText(thresholdOperator);
            sentence += ` ${opText} **${thresholdValue}${unit ? ' ' + unit : ''}**`;
        }

        // Phần baseline (nếu có)
        if (baselineWindowDays && baselineFunction) {
            const baselineText = getAggFunctionText(baselineFunction);
            sentence += ` so với ${baselineText} ${baselineWindowDays} ngày trước`;
        }

        // Phần yêu cầu liên tiếp
        if (consecutiveRequired) {
            sentence += ' (liên tiếp)';
        }

        // Phần cảnh báo sớm
        let warningText = '';
        if (earlyWarningThreshold) {
            warningText = ` ⚠️ Cảnh báo sớm khi đạt ${earlyWarningThreshold}${unit ? ' ' + unit : ''}`;
        }

        return { order: condition.conditionOrder || index + 1, sentence, warningText };
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
                    <div key={idx} style={{
                        padding: '12px 16px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '2px solid #e6f7ff',
                        position: 'relative'
                    }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
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

                            {/* Câu diễn giải */}
                            <Text
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    display: 'block',
                                    marginLeft: '8px'
                                }}
                            >
                                {/* Parse markdown bold **text** */}
                                {item.sentence.split(/(\*\*.*?\*\*)/).map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                            <Text key={i} strong style={{ color: '#1890ff' }}>
                                                {part.slice(2, -2)}
                                            </Text>
                                        );
                                    }
                                    return <Text key={i}>{part}</Text>;
                                })}
                            </Text>

                            {/* Cảnh báo sớm */}
                            {item.warningText && (
                                <Text type="warning" style={{ fontSize: '12px', marginLeft: '8px' }}>
                                    {item.warningText}
                                </Text>
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
