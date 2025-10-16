import CustomTable from '@/components/custom-table';
import {
    AlertOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    DollarOutlined,
    EditOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    SettingOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    Collapse,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Radio,
    Row,
    Select,
    Slider,
    Space,
    Switch,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import { useState } from 'react';

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

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
                id: editingCondition?.id || Date.now().toString(),
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

    // Get filtered data sources by selected category
    const getFilteredDataSources = (categoryValue) => {
        if (!categoryValue) return mockData.dataSources;
        return mockData.dataSources.filter(ds =>
            mockData.dataTierCategories.find(cat => cat.value === categoryValue)?.id ===
            mockData.dataTiers.find(tier => tier.id === ds.data_tier_id)?.data_tier_category_id
        );
    };

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
            fixed: 'right',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <div className="flex gap-2">
                    <Button
                        type="dashed"
                        size="small"
                        className="!bg-orange-100 !border-orange-200 !text-orange-800 hover:!bg-orange-200"
                        onClick={() => handleEditCondition(record)}
                        title="Chỉnh sửa"
                    >
                        <EditOutlined size={14} />
                    </Button>
                    <Popconfirm
                        title="Xóa điều kiện"
                        description="Bạn có chắc chắn muốn xóa điều kiện này?"
                        onConfirm={() => onRemoveTriggerCondition(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            type="dashed"
                            size="small"
                            className="!bg-red-100 !border-red-200 !text-red-800 hover:!bg-red-200"
                            title="Xóa"
                        >
                            <DeleteOutlined size={14} />
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="configuration-tab">
            <Form
                form={form}
                layout="vertical"
                initialValues={configurationData}
                onValuesChange={handleValuesChange}
                className="configuration-form"
            >
                <Collapse defaultActiveKey={['basic', 'conditions']} size="large">
                    {/* Basic Policy Configuration */}
                    <Panel
                        header={
                            <Space>
                                <SettingOutlined />
                                <span>Cấu hình Policy Cơ bản</span>
                            </Space>
                        }
                        key="basic"
                    >
                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item
                                    name="coverageType"
                                    label="Loại bảo hiểm"
                                    rules={[{ required: true, message: 'Vui lòng chọn loại bảo hiểm' }]}
                                >
                                    <Select
                                        placeholder="Chọn loại bảo hiểm"
                                        size="large"
                                        dropdownStyle={{ maxWidth: '300px' }}
                                        optionLabelProp="label"
                                    >
                                        {mockData.coverageTypes?.map(type => (
                                            <Option key={type.value} value={type.value} label={type.label}>
                                                <Tooltip
                                                    title={
                                                        <div>
                                                            <div><strong>{type.label}</strong></div>
                                                            <div style={{ marginTop: '4px' }}>{type.description}</div>
                                                            <div style={{ marginTop: '4px' }}>
                                                                Tỷ lệ phí: {(type.premium_rate * 100).toFixed(1)}%
                                                            </div>
                                                        </div>
                                                    }
                                                    placement="right"
                                                    mouseEnterDelay={0.3}
                                                >
                                                    <div style={{
                                                        maxWidth: '280px',
                                                        cursor: 'pointer'
                                                    }}
                                                        className="option-hover-item"
                                                    >
                                                        <Text strong style={{
                                                            fontSize: '13px',
                                                            display: 'block',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {type.label}
                                                        </Text>
                                                        <Text type="secondary" style={{
                                                            fontSize: '11px',
                                                            display: 'block',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {type.description} - Phí: {(type.premium_rate * 100).toFixed(1)}%
                                                        </Text>
                                                    </div>
                                                </Tooltip>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="riskLevel"
                                    label="Mức độ rủi ro"
                                    rules={[{ required: true, message: 'Vui lòng chọn mức độ rủi ro' }]}
                                >
                                    <Select placeholder="Chọn mức độ rủi ro" size="large">
                                        {mockData.riskLevels?.map(level => (
                                            <Option key={level.value} value={level.value}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            backgroundColor: level.color,
                                                            borderRadius: '50%'
                                                        }}
                                                    />
                                                    <Text strong>{level.label}</Text>
                                                    <Text type="secondary">({level.multiplier}x)</Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="logicalOperator"
                                    label="Toán tử Logic giữa các điều kiện"
                                    rules={[{ required: true, message: 'Vui lòng chọn toán tử logic' }]}
                                >
                                    <Radio.Group size="large">
                                        {mockData.logicalOperators?.map(operator => (
                                            <Radio key={operator.value} value={operator.value}>
                                                <div>
                                                    <Text strong>{operator.label}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                                        {operator.description}
                                                    </Text>
                                                </div>
                                            </Radio>
                                        ))}
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="payoutPercentage"
                                    label="Tỷ lệ Thanh toán (%)"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập tỷ lệ thanh toán' },
                                        { type: 'number', min: 1, max: 100, message: 'Tỷ lệ từ 1% đến 100%' }
                                    ]}
                                >
                                    <Slider
                                        min={1}
                                        max={100}
                                        marks={{
                                            25: '25%',
                                            50: '50%',
                                            75: '75%',
                                            100: '100%'
                                        }}
                                        tooltip={{ formatter: value => `${value}%` }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="maxPayoutAmount"
                                    label="Số tiền thanh toán tối đa (USD)"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số tiền tối đa' },
                                        { type: 'number', min: 1000, message: 'Tối thiểu $1,000' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1000}
                                        step={1000}
                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Panel>

                    {/* Payout Configuration */}
                    <Panel
                        header={
                            <Space>
                                <DollarOutlined />
                                <span>Cấu hình Thanh toán</span>
                            </Space>
                        }
                        key="payout"
                    >
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="payoutMethod"
                                    label="Phương thức thanh toán"
                                    rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
                                >
                                    <Select
                                        placeholder="Chọn phương thức"
                                        size="large"
                                        dropdownStyle={{ maxWidth: '300px' }}
                                    >
                                        {mockData.payoutMethods?.map(method => (
                                            <Option key={method.value} value={method.value}>
                                                <div style={{ maxWidth: '280px' }}>
                                                    <Text strong style={{
                                                        fontSize: '13px',
                                                        display: 'block',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {method.label}
                                                    </Text>
                                                    <Text type="secondary" style={{
                                                        fontSize: '11px',
                                                        display: 'block',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {method.description}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="payoutCalculationMethod"
                                    label="Phương thức tính toán"
                                    rules={[{ required: true, message: 'Vui lòng chọn phương thức tính' }]}
                                >
                                    <Select
                                        placeholder="Chọn phương thức tính"
                                        size="large"
                                        dropdownStyle={{ maxWidth: '300px' }}
                                    >
                                        {mockData.payoutCalculationMethods?.map(method => (
                                            <Option key={method.value} value={method.value}>
                                                <div style={{ maxWidth: '280px' }}>
                                                    <Text strong style={{
                                                        fontSize: '13px',
                                                        display: 'block',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {method.label}
                                                    </Text>
                                                    <Text type="secondary" style={{
                                                        fontSize: '11px',
                                                        display: 'block',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {method.description}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="payoutDelayDays"
                                    label="Thời gian trì hoãn thanh toán (ngày)"
                                    tooltip="Số ngày chờ đợi trước khi thanh toán tự động"
                                >
                                    <InputNumber
                                        min={0}
                                        max={30}
                                        placeholder="3"
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item
                                    name="requireManualApproval"
                                    label="Yêu cầu phê duyệt thủ công"
                                    valuePropName="checked"
                                >
                                    <Switch
                                        checkedChildren="Có"
                                        unCheckedChildren="Không"
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="enablePartialPayout"
                                    label="Cho phép thanh toán một phần"
                                    valuePropName="checked"
                                >
                                    <Switch
                                        checkedChildren="Có"
                                        unCheckedChildren="Không"
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Panel>

                    {/* Monitoring & Alerts */}
                    <Panel
                        header={
                            <Space>
                                <AlertOutlined />
                                <span>Giám sát & Cảnh báo</span>
                            </Space>
                        }
                        key="monitoring"
                    >
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="monitoringFrequency"
                                    label="Tần suất giám sát"
                                    rules={[{ required: true, message: 'Vui lòng chọn tần suất giám sát' }]}
                                >
                                    <Select
                                        placeholder="Chọn tần suất"
                                        size="large"
                                        dropdownStyle={{ maxWidth: '300px' }}
                                    >
                                        {mockData.monitoringFrequencies?.map(freq => (
                                            <Option key={freq.value} value={freq.value}>
                                                <div style={{ maxWidth: '280px' }}>
                                                    <Text strong style={{
                                                        fontSize: '13px',
                                                        display: 'block',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {freq.label}
                                                    </Text>
                                                    <Text type="secondary" style={{
                                                        fontSize: '11px',
                                                        display: 'block',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {freq.description}
                                                    </Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="alertThreshold"
                                    label="Ngưỡng cảnh báo sớm (%)"
                                    tooltip="Cảnh báo khi gần đạt điều kiện kích hoạt"
                                >
                                    <InputNumber
                                        min={50}
                                        max={95}
                                        placeholder="80"
                                        formatter={value => `${value}%`}
                                        parser={value => value.replace('%', '')}
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="alertTypes"
                                    label="Loại cảnh báo"
                                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất một loại cảnh báo' }]}
                                >
                                    <Checkbox.Group
                                        options={mockData.alertTypes?.map(type => ({
                                            label: type.label,
                                            value: type.value
                                        }))}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item
                                    name="enableRealTimeAlerts"
                                    label="Cảnh báo thời gian thực"
                                    valuePropName="checked"
                                >
                                    <Switch
                                        checkedChildren="Bật"
                                        unCheckedChildren="Tắt"
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="enablePredictiveAlerts"
                                    label="Cảnh báo dự đoán"
                                    valuePropName="checked"
                                    tooltip="Cảnh báo dựa trên dự đoán AI"
                                >
                                    <Switch
                                        checkedChildren="Bật"
                                        unCheckedChildren="Tắt"
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Panel>

                    {/* Trigger Conditions */}
                    <Panel
                        header={
                            <Space>
                                <ClockCircleOutlined />
                                <span>Điều kiện Kích hoạt</span>
                                <Tag color={configurationData.conditions?.length > 0 ? 'green' : 'orange'}>
                                    {configurationData.conditions?.length || 0} điều kiện
                                </Tag>
                            </Space>
                        }
                        key="conditions"
                    >
                        {/* Add/Edit Condition Form */}
                        <Card className="condition-form-card" style={{ marginBottom: 16 }}>
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
                                                    dropdownStyle={{ maxWidth: '300px' }}
                                                >
                                                    {availableDataSources.map(source => (
                                                        <Option key={source.value} value={source.value} label={source.label}>
                                                            <div style={{ maxWidth: '280px' }}>
                                                                <Text style={{
                                                                    fontSize: '13px',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {source.label}
                                                                </Text>
                                                                <Text type="secondary" style={{
                                                                    fontSize: '11px',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
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
                                                    dropdownStyle={{ maxWidth: '300px' }}
                                                >
                                                    {mockData.aggregationFunctions?.map(func => (
                                                        <Option key={func.value} value={func.value} label={func.label}>
                                                            <div style={{ maxWidth: '280px' }}>
                                                                <Text style={{
                                                                    fontSize: '13px',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {func.label}
                                                                </Text>
                                                                <Text type="secondary" style={{
                                                                    fontSize: '11px',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
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
                                                    dropdownStyle={{ maxWidth: '300px' }}
                                                >
                                                    {mockData.thresholdOperators?.map(operator => (
                                                        <Option key={operator.value} value={operator.value} label={operator.label}>
                                                            <div style={{ maxWidth: '280px' }}>
                                                                <Text style={{
                                                                    fontSize: '13px',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {operator.label}
                                                                </Text>
                                                                <Text type="secondary" style={{
                                                                    fontSize: '11px',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
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
                        {configurationData.conditions?.length === 0 ? (
                            <Alert
                                message="Chưa có điều kiện nào được tạo"
                                description="Vui lòng thêm ít nhất một điều kiện kích hoạt để tiếp tục"
                                type="info"
                                icon={<InfoCircleOutlined />}
                                className="no-conditions-alert"
                            />
                        ) : (
                            <CustomTable
                                columns={conditionsColumns}
                                dataSource={configurationData.conditions}
                                pagination={false}
                            />
                        )}

                        {/* Logic Preview */}
                        {configurationData.conditions?.length > 0 && (
                            <Card
                                title="Xem trước Logic Kích hoạt"
                                className="logic-preview-card"
                                style={{ marginTop: 16 }}
                            >
                                <div className="logic-preview">
                                    <Text>
                                        Thanh toán <Text strong>{configurationData.payoutPercentage}%</Text> (tối đa{' '}
                                        <Text strong>${configurationData.maxPayoutAmount?.toLocaleString()}</Text>) khi{' '}
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
                                                        <> (baseline: {condition.baselineWindowDays} ngày)</>
                                                    )}
                                                </Text>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        )}
                    </Panel>

                    {/* Additional Settings */}
                    <Panel
                        header={
                            <Space>
                                <SettingOutlined />
                                <span>Cài đặt Bổ sung</span>
                            </Space>
                        }
                        key="additional"
                    >
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item
                                    name="policyDescription"
                                    label="Mô tả Policy"
                                    rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Mô tả chi tiết về policy bảo hiểm này..."
                                        showCount
                                        maxLength={500}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="enableGracePeriod"
                                    label="Cho phép thời gian ân hạn"
                                    valuePropName="checked"
                                    tooltip="Thời gian ân hạn trước khi policy có hiệu lực"
                                >
                                    <Switch
                                        checkedChildren="Có"
                                        unCheckedChildren="Không"
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="gracePeriodDays"
                                    label="Thời gian ân hạn (ngày)"
                                    dependencies={['enableGracePeriod']}
                                >
                                    <InputNumber
                                        min={1}
                                        max={30}
                                        placeholder="7"
                                        size="large"
                                        style={{ width: '100%' }}
                                        disabled={!Form.useWatch('enableGracePeriod', form)}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="enableAutoRenewal"
                                    label="Tự động gia hạn"
                                    valuePropName="checked"
                                >
                                    <Switch
                                        checkedChildren="Có"
                                        unCheckedChildren="Không"
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>
            </Form>
        </div>
    );
};

export default ConfigurationTab;