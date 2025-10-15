import { DeleteOutlined, InfoCircleOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    Form,
    Input,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Typography
} from 'antd';
import React from 'react';

const { Option } = Select;
const { Title, Text } = Typography;

const TagsTab = ({
    tagsData,
    mockData,
    onDataChange,
    onAddTag,
    onRemoveTag,
    onUpdateTag
}) => {
    const [tagForm] = Form.useForm();
    const [selectedDataType, setSelectedDataType] = React.useState('string');
    const [selectOptions, setSelectOptions] = React.useState(['']);
    const [isMultipleSelect, setIsMultipleSelect] = React.useState(false);

    // Handle data type change
    const handleDataTypeChange = (value) => {
        setSelectedDataType(value);
        // Reset value when data type changes
        tagForm.setFieldsValue({ value: '' });

        if (value === 'select') {
            setSelectOptions(['']);
            setIsMultipleSelect(false);
        }
    };

    // Handle select options change
    const handleOptionChange = (index, value) => {
        const newOptions = [...selectOptions];
        newOptions[index] = value;
        setSelectOptions(newOptions);
    };

    // Add new option
    const addOption = () => {
        setSelectOptions([...selectOptions, '']);
    };

    // Remove option
    const removeOption = (index) => {
        if (selectOptions.length > 1) {
            const newOptions = selectOptions.filter((_, i) => i !== index);
            setSelectOptions(newOptions);
        }
    };

    // Handle multiple select toggle
    const handleMultipleSelectChange = (checked) => {
        setIsMultipleSelect(checked);
        tagForm.setFieldsValue({ value: '' });
    };

    // Render value input based on data type
    const renderValueInput = () => {
        switch (selectedDataType) {
            case 'integer':
                return (
                    <Input
                        type="number"
                        step="1"
                        placeholder="Nhập số nguyên"
                        size="large"
                    />
                );
            case 'decimal':
                return (
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="Nhập số thập phân"
                        size="large"
                    />
                );
            case 'boolean':
                return (
                    <Select
                        placeholder="Chọn giá trị"
                        size="large"
                    >
                        <Option value="true">True (Đúng)</Option>
                        <Option value="false">False (Sai)</Option>
                    </Select>
                );
            case 'select':
                return (
                    <div>
                        <div style={{ marginBottom: 8 }}>
                            <Checkbox
                                checked={isMultipleSelect}
                                onChange={(e) => handleMultipleSelectChange(e.target.checked)}
                            >
                                Cho phép chọn nhiều giá trị
                            </Checkbox>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: '12px' }}>Các tùy chọn:</Text>
                        </div>

                        {selectOptions.map((option, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Tùy chọn ${index + 1}`}
                                    size="small"
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                {selectOptions.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeOption(index)}
                                        size="small"
                                    />
                                )}
                            </div>
                        ))}

                        <Button
                            type="dashed"
                            onClick={addOption}
                            icon={<PlusOutlined />}
                            size="small"
                            style={{ marginTop: 4 }}
                        >
                            Thêm tùy chọn
                        </Button>

                        <div style={{ marginTop: 8 }}>
                            <Text strong style={{ fontSize: '12px' }}>Giá trị mặc định:</Text>
                        </div>

                        <Select
                            placeholder="Chọn giá trị mặc định"
                            size="large"
                            mode={isMultipleSelect ? 'multiple' : undefined}
                            style={{ marginTop: 4 }}
                        >
                            {selectOptions.filter(opt => opt.trim() !== '').map((option, index) => (
                                <Option key={index} value={option}>
                                    {option}
                                </Option>
                            ))}
                        </Select>
                    </div>
                );
            case 'string':
            default:
                return (
                    <Input
                        placeholder="Nhập giá trị ban đầu"
                        size="large"
                    />
                );
        }
    };

    // Get validation rules based on data type
    const getValueValidationRules = () => {
        const baseRules = [{ required: true, message: 'Vui lòng nhập giá trị' }];

        switch (selectedDataType) {
            case 'integer':
                return [
                    ...baseRules,
                    {
                        pattern: /^-?\d+$/,
                        message: 'Giá trị phải là số nguyên'
                    }
                ];
            case 'decimal':
                return [
                    ...baseRules,
                    {
                        pattern: /^-?\d+(\.\d+)?$/,
                        message: 'Giá trị phải là số thập phân'
                    }
                ];
            case 'boolean':
                return [
                    ...baseRules,
                    {
                        pattern: /^(true|false)$/,
                        message: 'Giá trị phải là true hoặc false'
                    }
                ];
            case 'select':
                return [
                    {
                        validator: (_, value) => {
                            const validOptions = selectOptions.filter(opt => opt.trim() !== '');
                            if (validOptions.length < 2) {
                                return Promise.reject(new Error('Phải có ít nhất 2 tùy chọn'));
                            }
                            if (!value || value.length === 0) {
                                return Promise.reject(new Error('Vui lòng chọn giá trị mặc định'));
                            }
                            return Promise.resolve();
                        }
                    }
                ];
            case 'string':
            default:
                return baseRules;
        }
    };

    // Handle add tag
    const handleAddTag = () => {
        tagForm.validateFields().then(values => {
            // Check if key already exists
            const exists = tagsData.tags.find(tag => tag.key === values.key);
            if (exists) {
                tagForm.setFields([{
                    name: 'key',
                    errors: ['Tên trường này đã tồn tại']
                }]);
                return;
            }

            // Additional validation based on data type
            let processedValue = values.value;
            switch (values.dataType) {
                case 'integer':
                    processedValue = parseInt(values.value, 10);
                    if (isNaN(processedValue)) {
                        tagForm.setFields([{
                            name: 'value',
                            errors: ['Giá trị phải là số nguyên hợp lệ']
                        }]);
                        return;
                    }
                    break;
                case 'decimal':
                    processedValue = parseFloat(values.value);
                    if (isNaN(processedValue)) {
                        tagForm.setFields([{
                            name: 'value',
                            errors: ['Giá trị phải là số thập phân hợp lệ']
                        }]);
                        return;
                    }
                    break;
                case 'boolean':
                    processedValue = values.value === 'true';
                    break;
                case 'select':
                    // For select, value should be the selected options
                    processedValue = values.value;
                    // Validate that we have valid options
                    const validOptions = selectOptions.filter(opt => opt.trim() !== '');
                    if (validOptions.length < 2) {
                        tagForm.setFields([{
                            name: 'value',
                            errors: ['Phải có ít nhất 2 tùy chọn hợp lệ']
                        }]);
                        return;
                    }
                    break;
                case 'string':
                default:
                    processedValue = String(values.value);
                    break;
            }

            const dataType = mockData.tagDataTypes.find(type => type.value === values.dataType);
            const tag = {
                ...values,
                value: processedValue,
                options: values.dataType === 'select' ? selectOptions.filter(opt => opt.trim() !== '') : undefined,
                isMultipleSelect: values.dataType === 'select' ? isMultipleSelect : undefined,
                index: tagsData.tags.length + 1, // Auto increment index
                dataTypeLabel: dataType?.label || ''
            };

            onAddTag(tag);
            tagForm.resetFields();
            setSelectedDataType('string'); // Reset to default
            setSelectOptions(['']); // Reset options
            setIsMultipleSelect(false); // Reset multiple select
        });
    };

    // Handle inline edit
    const handleCellEdit = (record, field, value) => {
        let processedValue = value;

        if (field === 'value') {
            // Validate and process value based on data type
            switch (record.dataType) {
                case 'integer':
                    processedValue = parseInt(value, 10);
                    if (isNaN(processedValue) && value !== '') {
                        // Reset to original value if invalid
                        return;
                    }
                    break;
                case 'decimal':
                    processedValue = parseFloat(value);
                    if (isNaN(processedValue) && value !== '') {
                        // Reset to original value if invalid
                        return;
                    }
                    break;
                case 'boolean':
                    processedValue = value === 'true';
                    break;
                case 'string':
                default:
                    processedValue = String(value);
                    break;
            }
        }

        if (field === 'dataType') {
            const dataType = mockData.tagDataTypes.find(type => type.value === value);
            onUpdateTag(record.id, {
                [field]: value,
                dataTypeLabel: dataType?.label || ''
            });
        } else if (field !== 'index') { // Don't allow editing index
            onUpdateTag(record.id, { [field]: processedValue });
        }
    };

    // Tags table columns with inline editing
    const tagsColumns = [
        {
            title: 'Tên trường (Key)',
            dataIndex: 'key',
            key: 'key',
            width: '25%',
            render: (text, record) => (
                <Input
                    value={text}
                    onChange={(e) => handleCellEdit(record, 'key', e.target.value)}
                    onBlur={(e) => {
                        // Validate key format
                        const value = e.target.value.trim();
                        if (value && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                            onUpdateTag(record.id, { key: record.key }); // Reset to original
                        }
                    }}
                    placeholder="Nhập tên trường"
                    size="small"
                />
            ),
        },
        {
            title: 'Giá trị (Value)',
            dataIndex: 'value',
            key: 'value',
            width: '30%',
            render: (text, record) => {
                switch (record.dataType) {
                    case 'integer':
                        return (
                            <Input
                                type="number"
                                step="1"
                                value={text}
                                onChange={(e) => handleCellEdit(record, 'value', e.target.value)}
                                placeholder="Nhập số nguyên"
                                size="small"
                            />
                        );
                    case 'decimal':
                        return (
                            <Input
                                type="number"
                                step="0.01"
                                value={text}
                                onChange={(e) => handleCellEdit(record, 'value', e.target.value)}
                                placeholder="Nhập số thập phân"
                                size="small"
                            />
                        );
                    case 'boolean':
                        return (
                            <Select
                                value={text}
                                onChange={(value) => handleCellEdit(record, 'value', value)}
                                size="small"
                                style={{ width: '100%' }}
                            >
                                <Option value="true">True</Option>
                                <Option value="false">False</Option>
                            </Select>
                        );
                    case 'select':
                        return (
                            <Select
                                value={text}
                                onChange={(value) => handleCellEdit(record, 'value', value)}
                                mode={record.isMultipleSelect ? 'multiple' : undefined}
                                size="small"
                                style={{ width: '100%' }}
                            >
                                {record.options?.map((option, index) => (
                                    <Option key={index} value={option}>
                                        {option}
                                    </Option>
                                ))}
                            </Select>
                        );
                    case 'string':
                    default:
                        return (
                            <Input
                                value={text}
                                onChange={(e) => handleCellEdit(record, 'value', e.target.value)}
                                placeholder="Nhập giá trị"
                                size="small"
                            />
                        );
                }
            },
        },
        {
            title: 'Loại dữ liệu',
            dataIndex: 'dataType',
            key: 'dataType',
            width: '25%',
            render: (value, record) => (
                <Select
                    value={value}
                    onChange={(newValue) => handleCellEdit(record, 'dataType', newValue)}
                    size="small"
                    style={{ width: '100%' }}
                >
                    {mockData.tagDataTypes.map(type => (
                        <Option key={type.value} value={type.value}>
                            {type.label}
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Thứ tự',
            dataIndex: 'index',
            key: 'index',
            width: '10%',
            render: (text) => (
                <Text strong style={{ textAlign: 'center', display: 'block' }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: '10%',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa tag"
                    description="Bạn có chắc chắn muốn xóa tag này?"
                    onConfirm={() => onRemoveTag(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            ),
        },
    ];

    // Load default tags
    const handleLoadDefaults = () => {
        mockData.sampleData.defaultTags.forEach(defaultTag => {
            const exists = tagsData.tags.find(tag => tag.key === defaultTag.key);
            if (!exists) {
                const dataType = mockData.tagDataTypes.find(type => type.value === defaultTag.dataType);
                onAddTag({
                    ...defaultTag,
                    dataTypeLabel: dataType?.label || ''
                });
            }
        });
    };

    return (
        <div className="tags-tab">
            <Title level={4}>
                <TagOutlined /> Gắn thẻ & Metadata
            </Title>

            <Alert
                message="Thông tin về Tags"
                description="Tags cho phép bạn thêm các thông tin metadata tùy chỉnh cho policy. Các thông tin này có thể được sử dụng để phân loại, tìm kiếm và báo cáo."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* Add Tag Form */}
            <Card className="add-tag-card">
                <Title level={5}>Thêm Tag Mới</Title>

                <Form
                    form={tagForm}
                    layout="vertical"
                    className="tag-form"
                >
                    <Row gutter={16} align="middle">
                        <Col span={6}>
                            <Form.Item
                                name="key"
                                label="Tên trường (Key)"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tên trường' },
                                    {
                                        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                                        message: 'Tên trường phải bắt đầu bằng chữ cái, chỉ chứa chữ, số và dấu gạch dưới'
                                    }
                                ]}
                            >
                                <Input
                                    placeholder="VD: region, season, area_hectares"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                name="value"
                                label="Giá trị (Value)"
                                rules={getValueValidationRules()}
                            >
                                {renderValueInput()}
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item
                                name="dataType"
                                label="Loại dữ liệu"
                                rules={[{ required: true, message: 'Chọn loại dữ liệu' }]}
                            >
                                <Select
                                    placeholder="Chọn loại"
                                    size="large"
                                    optionLabelProp="label"
                                    dropdownStyle={{ maxWidth: '350px' }}
                                    onChange={handleDataTypeChange}
                                >
                                    {mockData.tagDataTypes.map(type => (
                                        <Option key={type.value} value={type.value} label={type.label}>
                                            <div style={{ maxWidth: '330px' }}>
                                                <Text style={{
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
                                                    {type.description}
                                                </Text>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item label="" noStyle>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddTag}
                                    size="large"
                                    block
                                    style={{ height: '40px', fontSize: '14px' }}
                                >
                                    Thêm
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <Space style={{ marginTop: 16 }}>
                    <Button onClick={handleLoadDefaults} type="dashed">
                        Tải Tags Mặc định
                    </Button>
                    <Text type="secondary">
                        Tải các tags thông dụng như: region, season, area_hectares
                    </Text>
                </Space>
            </Card>

            {/* Tags Table */}
            {tagsData.tags.length === 0 ? (
                <Alert
                    message="Chưa có tag nào được tạo"
                    description="Tags là tùy chọn, bạn có thể bỏ qua hoặc thêm các thông tin metadata để hỗ trợ quản lý policy"
                    type="info"
                    icon={<InfoCircleOutlined />}
                    className="no-tags-alert"
                    style={{ marginTop: 16 }}
                />
            ) : (
                <Card title="Danh sách Tags" style={{ marginTop: 16 }}>
                    <Table
                        columns={tagsColumns}
                        dataSource={tagsData.tags}
                        rowKey="id"
                        pagination={false}
                        className="tags-table"
                        size="middle"
                    />

                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">
                            Tổng cộng: <Text strong>{tagsData.tags.length}</Text> tags
                        </Text>
                    </div>
                </Card>
            )}

            {/* Tag Usage Guidelines */}
            <Card
                title="Hướng dẫn sử dụng Tags"
                style={{ marginTop: 16 }}
                className="guidelines-card"
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Title level={5}>Các loại Tags phổ biến:</Title>
                        <ul>
                            <li><Text strong>region:</Text> Khu vực địa lý (string)</li>
                            <li><Text strong>season:</Text> Mùa vụ (string)</li>
                            <li><Text strong>area_hectares:</Text> Diện tích (integer)</li>
                            <li><Text strong>farmer_count:</Text> Số lượng nông dân (integer)</li>
                            <li><Text strong>is_pilot:</Text> Chương trình thí điểm (boolean)</li>
                            <li><Text strong>risk_level:</Text> Mức độ rủi ro (decimal)</li>
                        </ul>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>Lưu ý:</Title>
                        <ul>
                            <li>Tên trường phải bắt đầu bằng chữ cái</li>
                            <li>Chỉ sử dụng chữ, số và dấu gạch dưới (_)</li>
                            <li>Tránh các từ khóa hệ thống như: id, name, status</li>
                            <li>Sử dụng snake_case cho tên trường</li>
                            <li>Giá trị phải phù hợp với loại dữ liệu đã chọn</li>
                        </ul>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default TagsTab;