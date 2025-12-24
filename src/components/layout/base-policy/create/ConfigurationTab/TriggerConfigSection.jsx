import { getTriggerValidation } from '@/libs/message';
import useDictionary from '@/services/hooks/common/use-dictionary';
import { Form, Input, Select, Row, Col, Typography } from 'antd';
import { memo } from 'react';

const { Title, Text } = Typography;

const TriggerConfigSection = memo(({ configurationData, onDataChange, formRef }) => {
    const dict = useDictionary();

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 8 }}>{dict.ui.titleTriggerGrowthStage}</Title>
                <Text type="secondary">
                    Chọn toán tử logic để kết hợp các điều kiện, mô tả giai đoạn sinh trưởng.
                </Text>
            </div>
            <Form
                ref={formRef}
                layout="vertical"
                initialValues={configurationData}
                onValuesChange={onDataChange}
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="logicalOperator"
                            label={dict.getFieldLabel('BasePolicyTrigger', 'logical_operator')}
                            tooltip="AND = tất cả điều kiện phải đúng | OR = 1 điều kiện đúng là đủ"
                            rules={[{ required: true, message: getTriggerValidation('LOGICAL_OPERATOR_REQUIRED') }]}
                        >
                            <Select
                                placeholder="Chọn toán tử"
                                size="large"
                                options={[
                                    { value: 'AND', label: 'AND - Tất cả điều kiện phải đúng' },
                                    { value: 'OR', label: 'OR - Một trong các điều kiện đúng' }
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="growthStage"
                            label={dict.getFieldLabel('BasePolicyTrigger', 'growth_stage')}
                            tooltip="Mô tả giai đoạn sinh trưởng (không bắt buộc, tối đa 50 ký tự)"
                            rules={[{ type: 'string', max: 50, message: 'Giai đoạn sinh trưởng tối đa 50 ký tự' }]}
                        >
                            <Input.TextArea
                                placeholder="Ví dụ: Toàn chu kỳ sinh trưởng lúa"
                                rows={2}
                                size="large"
                                maxLength={50}
                                showCount
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </>
    );
});

TriggerConfigSection.displayName = 'TriggerConfigSection';

export default TriggerConfigSection;
