import { DeleteOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    InputNumber,
    Popconfirm,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import { useState } from 'react';

const { Option } = Select;
const { Title, Text } = Typography;

const ConfigurationTab = ({
    configurationData,
    mockData,
    onDataChange,
    onAddTriggerCondition,
    onRemoveTriggerCondition,
    onUpdateTriggerCondition,
    getAvailableDataSourcesForTrigger
}) => {
    const [form] = Form.useForm();
    const [conditionForm] = Form.useForm();
    const [editingCondition, setEditingCondition] = useState(null);

    const availableDataSources = getAvailableDataSourcesForTrigger();

    // Handle form values change
    const handleValuesChange = (changedValues, allValues) => {
        onDataChange(allValues);
    };

    // Handle add/update condition
    const handleSaveCondition = () => {
        conditionForm.validateFields().then(values => {
            const selectedDataSource = availableDataSources.find(ds => ds.value === values.dataSourceId);

            const condition = {
                ...values,
                dataSourceLabel: selectedDataSource?.label || '',
                parameterName: selectedDataSource?.parameterName || '',
                unit: selectedDataSource?.unit || '',
                aggregationFunctionLabel: mockData.aggregationFunctions.find(af => af.value === values.aggregationFunction)?.label || '',
                thresholdOperatorLabel: mockData.thresholdOperators.find(to => to.value === values.thresholdOperator)?.label || ''
            };

            if (editingCondition) {
                onUpdateTriggerCondition(editingCondition.id, condition);
                setEditingCondition(null);
            } else {
                onAddTriggerCondition(condition);
            }

            conditionForm.resetFields();
        });
    };

    // Handle edit condition
    const handleEditCondition = (condition) => {
        setEditingCondition(condition);
        conditionForm.setFieldsValue(condition);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingCondition(null);
        conditionForm.resetFields();
    };

    // Check if aggregation function is 'change'
    const isChangeAggregation = Form.useWatch('aggregationFunction', conditionForm);

    // Trigger conditions table columns
    const conditionsColumns = [
        {
            title: 'Nguồn dữ liệu',
            dataIndex: 'dataSourceLabel',
            key: 'dataSourceLabel',
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.parameterName} ({record.unit})
                    </Text>
                </div>
            ),
        },
        {
            title: 'Hàm tổng hợp',
            dataIndex: 'aggregationFunctionLabel',
            key: 'aggregationFunctionLabel',
            render: (text, record) => (
                <div>
                    <Tag color="blue">{text}</Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.aggregationWindowDays} ngày
                        {record.baselineWindowDays && (
                            <> | Baseline: {record.baselineWindowDays} ngày</>
                        )}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div>
                    <Text>
                        {record.thresholdOperatorLabel} {record.thresholdValue} {record.unit}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditCondition(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa điều kiện"
                        description="Bạn có chắc chắn muốn xóa điều kiện này?"
                        onConfirm={() => onRemoveTriggerCondition(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="configuration-tab">
            <Title level={4}>Cấu hình Điều kiện Kích hoạt</Title>

            {/* Main Configuration Form */}
            <Form
                form={form}
                layout="vertical"
                initialValues={configurationData}
                onValuesChange={handleValuesChange}
                className="configuration-form"
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="logicalOperator"
                            label="Toán tử Logic"
                            rules={[{ required: true, message: 'Vui lòng chọn toán tử logic' }]}
                        >
                            <Radio.Group size="large">
                                {mockData.logicalOperators.map(operator => (
                                    <Radio.Button key={operator.value} value={operator.value}>
                                        <div>
                                            <Text strong>{operator.label}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {operator.description}
                                            </Text>
                                        </div>
                                    </Radio.Button>
                                ))}
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="payoutPercentage"
                            label="Tỷ lệ Thanh toán (%)"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tỷ lệ thanh toán' },
                                { type: 'number', min: 1, max: 100, message: 'Tỷ lệ từ 1% đến 100%' }
                            ]}
                        >
                            <InputNumber
                                min={1}
                                max={100}
                                formatter={value => `${value}%`}
                                parser={value => value.replace('%', '')}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            <Divider />

            <Title level={4}>Điều kiện Kích hoạt Chi tiết</Title>

            {/* Add/Edit Condition Form */}
            <Card className="condition-form-card">
                <Title level={5}>
                    {editingCondition ? 'Chỉnh sửa Điều kiện' : 'Thêm Điều kiện Mới'}
                </Title>

                {availableDataSources.length === 0 ? (
                    <Alert
                        message="Chưa có nguồn dữ liệu"
                        description="Vui lòng thêm nguồn dữ liệu ở tab 'Thông tin Cơ bản' trước khi tạo điều kiện"
                        type="warning"
                        showIcon
                    />
                ) : (
                    <Form
                        form={conditionForm}
                        layout="vertical"
                        className="condition-form"
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="dataSourceId"
                                    label="Nguồn dữ liệu"
                                    rules={[{ required: true, message: 'Chọn nguồn dữ liệu' }]}
                                >
                                    <Select
                                        placeholder="Chọn nguồn dữ liệu"
                                        size="large"
                                        optionLabelProp="label"
                                    >
                                        {availableDataSources.map(source => (
                                            <Option key={source.value} value={source.value} label={source.label}>
                                                <div>
                                                    <Text>{source.label}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {source.parameterName} ({source.unit})
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="aggregationFunction"
                                    label="Hàm tổng hợp"
                                    rules={[{ required: true, message: 'Chọn hàm tổng hợp' }]}
                                >
                                    <Select
                                        placeholder="Chọn hàm tổng hợp"
                                        size="large"
                                        optionLabelProp="label"
                                    >
                                        {mockData.aggregationFunctions.map(func => (
                                            <Option key={func.value} value={func.value} label={func.label}>
                                                <div>
                                                    <Text>{func.label}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {func.description}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="aggregationWindowDays"
                                    label="Cửa sổ Tổng hợp (Ngày)"
                                    rules={[
                                        { required: true, message: 'Nhập cửa sổ tổng hợp' },
                                        { type: 'number', min: 1, message: 'Tối thiểu 1 ngày' }
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
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name="thresholdOperator"
                                    label="Toán tử Ngưỡng"
                                    rules={[{ required: true, message: 'Chọn toán tử ngưỡng' }]}
                                >
                                    <Select
                                        placeholder="Chọn toán tử"
                                        size="large"
                                        optionLabelProp="label"
                                    >
                                        {mockData.thresholdOperators.map(operator => (
                                            <Option key={operator.value} value={operator.value} label={operator.label}>
                                                <div>
                                                    <Text>{operator.label}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {operator.description}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    name="thresholdValue"
                                    label="Giá trị Ngưỡng"
                                    rules={[{ required: true, message: 'Nhập giá trị ngưỡng' }]}
                                >
                                    <InputNumber
                                        placeholder="200"
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            {isChangeAggregation === 'change' && (
                                <Col span={8}>
                                    <Form.Item
                                        name="baselineWindowDays"
                                        label="Cửa sổ Baseline (Ngày)"
                                        rules={[
                                            { required: true, message: 'Nhập cửa sổ baseline' },
                                            { type: 'number', min: 1, message: 'Tối thiểu 1 ngày' }
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
                            )}
                        </Row>

                        <Row>
                            <Col span={24}>
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={editingCondition ? <EditOutlined /> : <PlusOutlined />}
                                        onClick={handleSaveCondition}
                                        size="large"
                                    >
                                        {editingCondition ? 'Cập nhật Điều kiện' : 'Thêm Điều kiện'}
                                    </Button>
                                    {editingCondition && (
                                        <Button onClick={handleCancelEdit} size="large">
                                            Hủy
                                        </Button>
                                    )}
                                </Space>
                            </Col>
                        </Row>
                    </Form>
                )}
            </Card>

            {/* Conditions Table */}
            {configurationData.conditions.length === 0 ? (
                <Alert
                    message="Chưa có điều kiện nào được tạo"
                    description="Vui lòng thêm ít nhất một điều kiện kích hoạt để tiếp tục"
                    type="info"
                    icon={<InfoCircleOutlined />}
                    className="no-conditions-alert"
                    style={{ marginTop: 16 }}
                />
            ) : (
                <Table
                    columns={conditionsColumns}
                    dataSource={configurationData.conditions}
                    rowKey="id"
                    pagination={false}
                    className="conditions-table"
                    style={{ marginTop: 16 }}
                />
            )}

            {/* Logic Preview */}
            {configurationData.conditions.length > 0 && (
                <Card
                    title="Xem trước Logic Kích hoạt"
                    className="logic-preview-card"
                    style={{ marginTop: 16 }}
                >
                    <div className="logic-preview">
                        <Text>
                            Thanh toán <Text strong>{configurationData.payoutPercentage}%</Text> khi{' '}
                            <Text strong>
                                {configurationData.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                            </Text>
                            {' '}các điều kiện sau được thỏa mãn:
                        </Text>
                        <ul style={{ marginTop: 8 }}>
                            {configurationData.conditions.map((condition, index) => (
                                <li key={condition.id}>
                                    <Text>
                                        {condition.aggregationFunctionLabel} của {condition.dataSourceLabel}{' '}
                                        trong {condition.aggregationWindowDays} ngày{' '}
                                        {condition.thresholdOperatorLabel} {condition.thresholdValue} {condition.unit}
                                        {condition.baselineWindowDays && (
                                            <Text type="secondary">
                                                {' '}(so với baseline {condition.baselineWindowDays} ngày)
                                            </Text>
                                        )}
                                    </Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ConfigurationTab;