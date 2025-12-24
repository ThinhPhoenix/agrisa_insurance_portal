import { getConditionValidation } from '@/libs/message';
import useDictionary from '@/services/hooks/common/use-dictionary';
import { calculateConditionCost } from '@/stores/policy-store';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Form, InputNumber, Row, Select, Space, Tooltip, Typography, message } from 'antd';
import { memo, useEffect, useState } from 'react';

const { Title, Text: TypographyText } = Typography;

const renderOptionWithTooltip = (item, content) => content; // fallback if global helper is not available

const ConditionForm = memo(({
    availableDataSources,
    mockData,
    configurationData,
    editingCondition,
    conditionForm,
    selectedThresholdOperator,
    onSave,
    onCancel,
    onOperatorChange
}) => {
    const dict = useDictionary();
    const [selectedAggregation, setSelectedAggregation] = useState(() => conditionForm.getFieldValue('aggregationFunction') || editingCondition?.aggregationFunction || null);

    useEffect(() => {
        // Keep local selectedAggregation in sync when editingCondition or form changes
        setSelectedAggregation(conditionForm.getFieldValue('aggregationFunction') || editingCondition?.aggregationFunction || null);
    }, [editingCondition, conditionForm]);

    // validationWindowDays is fixed to 30 (no longer derived from monitor frequency)

    const handleSaveCondition = () => {
        // Fast-path: read current form values synchronously to perform immediate checks and show instant warnings
        const quickValues = conditionForm.getFieldsValue();

        // If required quick fields missing, show immediate warning and abort fast checks
        if (!quickValues?.dataSourceId || !quickValues?.thresholdOperator || !quickValues?.aggregationFunction) {
            try { message.destroy(); } catch (e) { }
            message.warning('Vui lòng chọn nguồn dữ liệu, phương pháp tính và toán tử trước khi lưu.');
            return;
        }

        // Quick duplicate check: warn only when same dataSource AND same operator AND same aggregation function
        const duplicateOperatorQuick = (configurationData.conditions || []).some((c) => {
            if (editingCondition && c.id === editingCondition.id) return false;
            return c.dataSourceId === quickValues.dataSourceId &&
                c.thresholdOperator === quickValues.thresholdOperator &&
                c.aggregationFunction === quickValues.aggregationFunction;
        });

        if (duplicateOperatorQuick) {
            try { message.destroy(); } catch (e) { }
            message.warning('Nguồn dữ liệu này đã có điều kiện cùng phương pháp tính và toán tử. Vui lòng chọn toán tử hoặc phương pháp khác.');
            return;
        }

        // Quick coverage check using quickValues to avoid waiting for validateFields (only for numeric range operators)
        const tempConditionQuick = {
            dataSourceId: quickValues.dataSourceId,
            thresholdOperator: quickValues.thresholdOperator,
            thresholdValue: quickValues.thresholdValue
        };

        const isFullCoverageForSourceQuick = (allConditions, targetDataSourceId) => {
            const numericOps = ['<', '<=', '>', '>='];
            const numericConds = (allConditions || []).filter(c =>
                c.dataSourceId === targetDataSourceId && numericOps.includes(c.thresholdOperator)
            );
            if (numericConds.length === 0) return false;

            let maxUpper = -Infinity;
            let minLower = Infinity;
            for (let i = 0; i < numericConds.length; i++) {
                const c = numericConds[i];
                const op = c.thresholdOperator;
                const val = Number(c.thresholdValue);
                if (!isFinite(val)) continue;
                if (op === '<' || op === '<=') {
                    if (val > maxUpper) maxUpper = val;
                } else if (op === '>' || op === '>=') {
                    if (val < minLower) minLower = val;
                }
            }

            if (maxUpper === -Infinity || minLower === Infinity) return false;
            return maxUpper >= minLower;
        };

        const existingQuick = (configurationData.conditions || []).filter(c => !(editingCondition && c.id === editingCondition.id));
        const combinedQuick = [...existingQuick, tempConditionQuick];
        if (isFullCoverageForSourceQuick(combinedQuick, tempConditionQuick.dataSourceId)) {
            try { message.destroy(); } catch (e) { }
            message.warning('Không thể lưu: các điều kiện cho nguồn dữ liệu này bao phủ toàn bộ miền giá trị (không còn vùng an toàn). Vui lòng điều chỉnh toán tử hoặc giá trị ngưỡng.');
            return;
        }

        // Passed quick checks -> run full validation and proceed
        conditionForm.validateFields().then(values => {
            const selectedDataSource = availableDataSources.find(ds => ds.value === values.dataSourceId);

            const baseCost = selectedDataSource?.baseCost || 0;
            const categoryMultiplier = selectedDataSource?.categoryMultiplier || 1;
            const tierMultiplier = selectedDataSource?.tierMultiplier || 1;

            const calculatedCost = calculateConditionCost(
                baseCost,
                categoryMultiplier,
                tierMultiplier
            );

            let conditionOrder;
            if (editingCondition) {
                conditionOrder = editingCondition.conditionOrder;
            } else {
                conditionOrder = (configurationData.conditions?.length || 0) + 1;
            }


            const condition = {
                dataSourceId: values.dataSourceId,
                thresholdOperator: values.thresholdOperator,
                thresholdValue: values.thresholdValue,
                earlyWarningThreshold: values.earlyWarningThreshold || null,
                aggregationFunction: values.aggregationFunction,
                aggregationWindowDays: values.aggregationWindowDays,
                // Consecutive requirement is fixed to false and not configurable
                consecutiveRequired: false,
                includeComponent: values.includeComponent ?? false,
                // Baseline only set when operator is change_gt or change_lt
                baselineWindowDays: (values.thresholdOperator === 'change_gt' || values.thresholdOperator === 'change_lt')
                    ? (values.baselineWindowDays || null)
                    : null,
                baselineFunction: (values.thresholdOperator === 'change_gt' || values.thresholdOperator === 'change_lt')
                    ? (values.baselineFunction || null)
                    : null,
                // Validation window is fixed to 30 days
                validationWindowDays: 30,
                dataQuality: values.dataQuality || 'good',
                conditionOrder,
                // Display labels (for UI table)
                id: editingCondition?.id || Date.now().toString(),
                dataSourceLabel: selectedDataSource?.label || '',
                parameterName: selectedDataSource?.parameterName || '',
                unit: selectedDataSource?.unit || '',
                aggregationFunctionLabel: mockData.aggregationFunctions.find(af => af.value === values.aggregationFunction)?.label || '',
                thresholdOperatorLabel: mockData.thresholdOperators.find(to => to.value === values.thresholdOperator)?.label || '',
                dataQualityLabel: values.dataQuality === 'good' ? 'Tốt' : values.dataQuality === 'acceptable' ? 'Chấp nhận được' : 'Kém',
                // Cost calculation fields
                baseCost,
                categoryMultiplier,
                tierMultiplier,
                calculatedCost
            };

            onSave(condition, editingCondition);
        }).catch(err => {
            // validation failed - show first error quickly
            try { message.destroy(); } catch (e) { }
            message.warning('Vui lòng kiểm tra các trường nhập và thử lại.');
        });
    };

    return (
        <>
            <Title level={5}>
                {editingCondition ? dict.ui.editCondition : dict.ui.addNewCondition}
            </Title>

            {availableDataSources.length === 0 ? (
                <Alert
                    message="Chưa có nguồn dữ liệu"
                    description="Vui lòng thêm nguồn dữ liệu ở tab 'Thông tin Cơ bản' trước khi tạo điều kiện"
                    type="warning"
                    showIcon
                />
            ) : (
                <>
                    <Form
                        form={conditionForm}
                        layout="vertical"
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="dataSourceId"
                                    label={dict.getFieldLabel('BasePolicyTriggerCondition', 'data_source_id')}
                                    tooltip="Nguồn dữ liệu để tính điều kiện (trạm khí tượng, vệ tinh, v.v.). Có thể sử dụng cùng một nguồn cho nhiều điều kiện để tạo biên độ khác nhau"
                                    rules={[{ required: true, message: getConditionValidation('DATA_SOURCE_ID_REQUIRED') }]}
                                >
                                    <Select
                                        placeholder="Chọn nguồn dữ liệu"
                                        size="large"
                                        optionLabelProp="displayLabel"
                                        popupMatchSelectWidth={300}
                                        disabled={availableDataSources.length === 0}
                                    >
                                        {availableDataSources.map(source => {
                                            const displayLabel = source.label.length > 17 ? source.label.substring(0, 17) + '...' : source.label;
                                            return (
                                                <Select.Option
                                                    key={source.value}
                                                    value={source.value}
                                                    displayLabel={displayLabel}
                                                    label={source.label}
                                                    parameterName={source.parameterName}
                                                    unit={source.unit}
                                                >
                                                    <Tooltip
                                                        title={
                                                            <div>
                                                                <div><strong>{source.label}</strong></div>
                                                                <div style={{ marginTop: '4px' }}>{source.parameterName}</div>
                                                                <div style={{ marginTop: '4px', color: '#52c41a' }}>
                                                                    Đơn vị: {source.unit}
                                                                </div>
                                                            </div>
                                                        }
                                                        placement="right"
                                                        mouseEnterDelay={0.3}
                                                    >
                                                        <div style={{ maxWidth: '280px', cursor: 'pointer' }}>
                                                            <TypographyText style={{
                                                                fontSize: '13px',
                                                                display: 'block',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {source.label}
                                                            </TypographyText>
                                                        </div>
                                                    </Tooltip>
                                                </Select.Option>
                                            );
                                        })}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="aggregationFunction"
                                    label={dict.getFieldLabel('BasePolicyTriggerCondition', 'aggregation_function')}
                                    tooltip="Phương pháp tổng hợp (Aggregation Function): Cách thức tính toán một giá trị duy nhất từ dữ liệu thu thập trong một chu kỳ. Ví dụ: SUM để tính tổng lượng mưa, AVG để tính nhiệt độ trung bình"
                                    rules={[{ required: true, message: getConditionValidation('AGGREGATION_FUNCTION_REQUIRED') }]}
                                >
                                    <Select
                                        placeholder="Chọn hàm tổng hợp"
                                        size="large"
                                        optionLabelProp="label"
                                        popupMatchSelectWidth={300}
                                        onChange={(value) => {
                                            // Update local aggregation state and clear operator/baseline fields
                                            setSelectedAggregation(value);
                                            conditionForm.setFieldsValue({
                                                thresholdOperator: null,
                                                baselineWindowDays: null,
                                                baselineFunction: null
                                            });
                                            onOperatorChange(null);
                                        }}
                                    >
                                        {mockData.aggregationFunctions?.map(func => (
                                            <Select.Option
                                                key={func.value}
                                                value={func.value}
                                                label={func.label}
                                                description={func.description}
                                            >
                                                {renderOptionWithTooltip(func, <div><div><strong>{func.label}</strong></div><div style={{ marginTop: '4px' }}>{func.description}</div></div>)}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="aggregationWindowDays"
                                    label={dict.getFieldLabel('BasePolicyTriggerCondition', 'aggregation_window_days')}
                                    tooltip="Chu kỳ tổng hợp (Aggregation Window): Khoảng thời gian (tính bằng ngày) mà dữ liệu được gom lại để tính toán. Ví dụ: 30 ngày nghĩa là sẽ tính tổng/trung bình dữ liệu của 30 ngày gần nhất"
                                    rules={[
                                        { required: true, message: getConditionValidation('AGGREGATION_WINDOW_DAYS_REQUIRED') },
                                        { type: 'number', min: 1, message: getConditionValidation('AGGREGATION_WINDOW_DAYS_MIN') }
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="30"
                                        min={1}
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="thresholdOperator"
                                    label={dict.getFieldLabel('BasePolicyTriggerCondition', 'threshold_operator')}
                                    tooltip="Toán tử so sánh ngưỡng (Threshold Operator): Phép toán logic (ví dụ: >, <, =) dùng để so sánh giá trị dữ liệu thực tế với giá trị ngưỡng đã định"
                                    rules={[{ required: true, message: getConditionValidation('THRESHOLD_OPERATOR_REQUIRED') }]}
                                >
                                    <Select
                                        placeholder="Chọn toán tử"
                                        size="large"
                                        optionLabelProp="label"
                                        popupMatchSelectWidth={300}
                                        onChange={(value) => {
                                            onOperatorChange(value);
                                            // Clear baseline fields if operator is not change_gt or change_lt
                                            if (value !== 'change_gt' && value !== 'change_lt') {
                                                conditionForm.setFieldsValue({
                                                    baselineWindowDays: null,
                                                    baselineFunction: null
                                                });
                                            }
                                        }}
                                    >
                                        {(() => {
                                            const currentAggregation = selectedAggregation || conditionForm.getFieldValue('aggregationFunction') || editingCondition?.aggregationFunction;
                                            const operatorList = (mockData.thresholdOperators || []).filter(operator => {
                                                if (currentAggregation === 'change') {
                                                    return operator.value === 'change_gt' || operator.value === 'change_lt';
                                                }
                                                return operator.value !== 'change_gt' && operator.value !== 'change_lt';
                                            });

                                            return operatorList.map(operator => (
                                                <Select.Option
                                                    key={operator.value}
                                                    value={operator.value}
                                                    label={operator.label}
                                                    description={operator.description}
                                                >
                                                    {renderOptionWithTooltip(operator, <div><div><strong>{operator.label}</strong></div><div style={{ marginTop: '4px' }}>{operator.description}</div></div>)}
                                                </Select.Option>
                                            ));
                                        })()}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="thresholdValue"
                                    label={dict.getFieldLabel('BasePolicyTriggerCondition', 'threshold_value')}
                                    tooltip="Giá trị ngưỡng (Threshold Value): Mốc giá trị cụ thể để xác định một sự kiện bảo hiểm. Đơn vị của ngưỡng phụ thuộc vào nguồn dữ liệu"
                                    rules={[
                                        { required: true, message: getConditionValidation('THRESHOLD_VALUE_REQUIRED') },
                                        {
                                            validator: (_, value) => {
                                                if (value === null || value === undefined || value === '') return Promise.resolve();
                                                const abs = Math.abs(Number(value));
                                                if (Number.isNaN(abs)) return Promise.reject('Giá trị ngưỡng không hợp lệ');
                                                if (abs > 999999.9999) return Promise.reject('Giá trị ngưỡng vượt giới hạn (<= 999999.9999)');
                                                const parts = String(value).split('.');
                                                const decimals = parts[1] ? parts[1].length : 0;
                                                if (decimals > 4) return Promise.reject('Giá trị ngưỡng tối đa 4 chữ số thập phân');
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="200"
                                        size="large"
                                        step={0.0001}
                                        max={999999.9999}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="earlyWarningThreshold"
                                    label={dict.getFieldLabel('BasePolicyTriggerCondition', 'early_warning_threshold')}
                                    tooltip="Ngưỡng cảnh báo sớm (Early Warning Threshold): Một mốc phụ, khi bị vi phạm sẽ gửi cảnh báo cho người dùng biết rủi ro sắp xảy ra, trước khi đạt đến ngưỡng kích hoạt chi trả chính"
                                    rules={[{ type: 'number', min: 0, message: getConditionValidation('EARLY_WARNING_THRESHOLD_MIN') }]}
                                >
                                    <InputNumber
                                        placeholder="60"
                                        min={0}
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            {/* validationWindowDays is derived from monitor frequency and hidden from UI */}
                            <Col span={0} style={{ display: 'none' }}>
                                <Form.Item
                                    name="validationWindowDays"
                                    rules={[{ type: 'number', min: 1, message: getConditionValidation('VALIDATION_WINDOW_DAYS_MIN') }]}
                                >
                                    <InputNumber
                                        min={1}
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="dataQuality"
                                    label={dict.getFieldLabel('DataQuality', 'poor') || 'Chất lượng dữ liệu'}
                                    tooltip="Chất lượng dữ liệu (Data Quality): Mức độ tin cậy và chính xác của nguồn dữ liệu được sử dụng. Tốt (good): dữ liệu chất lượng cao, Chấp nhận được (acceptable): dữ liệu đủ dùng, Kém (poor): dữ liệu chất lượng thấp"
                                    initialValue="good"
                                >
                                    <Select
                                        placeholder="Chọn chất lượng dữ liệu"
                                        size="large"
                                        options={[
                                            { value: 'good', label: 'Tốt (Good)' },
                                            { value: 'acceptable', label: 'Chấp nhận được (Acceptable)' },
                                            { value: 'poor', label: 'Kém (Poor)' }
                                        ]}
                                    />
                                </Form.Item>
                            </Col>

                            {/* Baseline fields only when operator is change_gt or change_lt */}
                            {(() => {
                                const currentOperator = conditionForm.getFieldValue('thresholdOperator') || selectedThresholdOperator || editingCondition?.thresholdOperator;
                                return (currentOperator === 'change_gt' || currentOperator === 'change_lt');
                            })() && (
                                    <>
                                        <Col span={8}>
                                            <Form.Item
                                                name="baselineWindowDays"
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'baseline_window_days')}
                                                tooltip="Chu kỳ tham chiếu (Baseline Window): Khoảng thời gian trong quá khứ (tính bằng ngày) được dùng để tạo ra một giá trị 'nền' hoặc 'bình thường'. BẮT BUỘC khi sử dụng toán tử thay đổi (change_gt/change_lt)."
                                                rules={[
                                                    { required: true, message: 'Chu kỳ tham chiếu là bắt buộc khi sử dụng toán tử thay đổi!' },
                                                    { type: 'number', min: 1, message: getConditionValidation('BASELINE_WINDOW_DAYS_MIN') }
                                                ]}
                                            >
                                                <InputNumber
                                                    placeholder="365"
                                                    min={1}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="baselineFunction"
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'baseline_function')}
                                                tooltip="Hàm tính tham chiếu (Baseline Function): Phương pháp tính toán giá trị 'nền' từ dữ liệu lịch sử. BẮT BUỘC khi sử dụng toán tử thay đổi (change_gt/change_lt)."
                                                rules={[
                                                    { required: true, message: 'Hàm tính tham chiếu là bắt buộc khi sử dụng toán tử thay đổi!' }
                                                ]}
                                            >
                                                <Select
                                                    placeholder="Chọn hàm tính tham chiếu"
                                                    size="large"
                                                    options={[
                                                        { value: 'avg', label: 'Trung bình (avg)' },
                                                        { value: 'sum', label: 'Tổng (sum)' },
                                                        { value: 'min', label: 'Tối thiểu (min)' },
                                                        { value: 'max', label: 'Tối đa (max)' }
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                        </Row>
                    </Form>

                    <div style={{ marginTop: 16 }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={editingCondition ? <EditOutlined /> : <PlusOutlined />}
                                onClick={handleSaveCondition}
                                size="large"
                            >
                                {editingCondition ? dict.ui.updateCondition : dict.ui.addCondition}
                            </Button>
                            {editingCondition && (
                                <Button onClick={onCancel} size="large">
                                    Hủy
                                </Button>
                            )}
                        </Space>
                    </div>
                </>
            )}
        </>
    );
});

ConditionForm.displayName = 'ConditionForm';

export default ConditionForm;