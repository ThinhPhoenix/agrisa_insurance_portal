import {
    DeleteOutlined,
    DownloadOutlined,
    DragOutlined,
    EditOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    FileTextOutlined,
    FullscreenOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    PrinterOutlined,
    TagOutlined
} from '@ant-design/icons';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Slider,
    Space,
    Table,
    TimePicker,
    Tooltip,
    Typography
} from 'antd';
import React from 'react';
import ContractPreview from './ContractPreview';

const { Option } = Select;
const { Title, Text } = Typography;

const TagsTab = ({
    tagsData,
    mockData,
    onDataChange,
    onAddTag,
    onRemoveTag,
    onUpdateTag,
    previewVisible = true,
    onPreviewVisibleChange
}) => {
    const [tagForm] = Form.useForm();
    const [selectedDataType, setSelectedDataType] = React.useState('string');
    const [selectOptions, setSelectOptions] = React.useState(['']);
    const [isMultipleSelect, setIsMultipleSelect] = React.useState(false);
    const [editingRows, setEditingRows] = React.useState(new Set()); // Track which rows are in edit mode
    const [previewFullscreen, setPreviewFullscreen] = React.useState(false); // Fullscreen preview mode
    const [fieldWidth, setFieldWidth] = React.useState(40); // Field width percentage for layout (default 40% = 2 fields/row)
    const [textareaRows, setTextareaRows] = React.useState(3); // Number of rows for textarea

    // Handle data type change
    const handleDataTypeChange = (value) => {
        setSelectedDataType(value);
        // Reset value when data type changes
        tagForm.setFieldsValue({ value: '' });

        if (value === 'select') {
            setSelectOptions(['']);
            setIsMultipleSelect(false);
        }

        // Textarea always uses 100% width
        if (value === 'textarea') {
            setFieldWidth(100);
            setTextareaRows(3); // Default 3 rows
        } else if (fieldWidth === 100 && value !== 'textarea') {
            // Reset to default when changing from textarea
            setFieldWidth(40);
        }
    };

    // Handle select options change
    const handleOptionChange = (index, value) => {
        const newOptions = [...selectOptions];
        newOptions[index] = value;
        setSelectOptions(newOptions);
        // Reset value to ensure no auto-selection
        tagForm.setFieldsValue({ value: '' });
    };

    // Add new option
    const addOption = () => {
        setSelectOptions([...selectOptions, '']);
        // Reset value to ensure no auto-selection
        tagForm.setFieldsValue({ value: '' });
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

    // Toggle edit mode for a row
    const toggleEditMode = (recordId) => {
        setEditingRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(recordId)) {
                newSet.delete(recordId);
            } else {
                newSet.add(recordId);
            }
            return newSet;
        });
    };

    // Handle drag and drop
    const handleDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(tagsData.tags);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update index for all items
        const updatedItems = items.map((item, index) => ({
            ...item,
            index: index + 1
        }));

        // Update the tags data
        onDataChange({
            ...tagsData,
            tags: updatedItems
        });

        // Reset edit mode after drag and drop
        setEditingRows(new Set());
    };

    // Render value input based on data type
    const renderValueInput = () => {
        switch (selectedDataType) {
            case 'integer':
                return (
                    <InputNumber
                        placeholder="Nhập số nguyên"
                        size="large"
                        style={{ width: '100%' }}
                    />
                );
            case 'decimal':
                return (
                    <InputNumber
                        step="0.01"
                        placeholder="Nhập số thập phân"
                        size="large"
                        style={{ width: '100%' }}
                    />
                );
            case 'boolean':
                return (
                    <Select
                        placeholder="Chọn giá trị"
                        size="large"
                        allowClear
                    >
                        <Option value="true">Có / Đúng</Option>
                        <Option value="false">Không / Sai</Option>
                    </Select>
                );
            case 'date':
                return (
                    <DatePicker
                        placeholder="Chọn ngày"
                        size="large"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                    />
                );
            case 'time':
                return (
                    <TimePicker
                        placeholder="Chọn giờ"
                        size="large"
                        style={{ width: '100%' }}
                        format="HH:mm"
                    />
                );
            case 'datetime':
                return (
                    <DatePicker
                        showTime
                        placeholder="Chọn ngày giờ"
                        size="large"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY HH:mm"
                    />
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

                        <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                            💡 Giá trị sẽ để trống khi tạo tag mới. Người dùng có thể chọn từ các tùy chọn đã định nghĩa.
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <div>
                        <Input.TextArea
                            placeholder="Nhập nội dung văn bản dài (có thể nhiều dòng)"
                            rows={4}
                            size="large"
                            showCount
                            maxLength={500}
                            style={{ marginBottom: 8 }}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text strong style={{ fontSize: '12px' }}>Số dòng hiển thị trên hợp đồng:</Text>
                        </div>
                        <InputNumber
                            min={1}
                            max={10}
                            value={textareaRows}
                            onChange={(value) => setTextareaRows(value || 3)}
                            size="small"
                            style={{ width: 100, marginTop: 4 }}
                            addonAfter="dòng"
                        />
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: 4 }}>
                            💡 Textarea luôn chiếm full width (100%) trên hợp đồng
                        </Text>
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

    // Get validation rules based on data type - All optional now
    const getValueValidationRules = () => {
        return []; // No validation - all fields optional
    };    // Handle add tag
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

            // Additional validation based on data type - Allow empty values
            let processedValue = values.value;
            switch (values.dataType) {
                case 'integer':
                    // Allow empty values
                    if (values.value !== undefined && values.value !== null && values.value !== '') {
                        processedValue = parseInt(values.value, 10);
                        if (isNaN(processedValue)) {
                            processedValue = ''; // Set to empty if invalid
                        }
                    } else {
                        processedValue = '';
                    }
                    break;
                case 'decimal':
                    // Allow empty values
                    if (values.value !== undefined && values.value !== null && values.value !== '') {
                        processedValue = parseFloat(values.value);
                        if (isNaN(processedValue)) {
                            processedValue = ''; // Set to empty if invalid
                        }
                    } else {
                        processedValue = '';
                    }
                    break;
                case 'boolean':
                    processedValue = values.value === 'true';
                    break;
                case 'select':
                    // For select, always leave value empty - user will select later
                    processedValue = '';
                    // Only validate options if user is trying to use select type
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
                    processedValue = values.value ? String(values.value) : '';
                    break;
            }

            const dataType = mockData.tagDataTypes.find(type => type.value === values.dataType);

            // Handle date/time types - convert to display string
            let displayValue = processedValue;
            if (values.dataType === 'date' && values.value) {
                displayValue = values.value.format('DD/MM/YYYY');
            } else if (values.dataType === 'time' && values.value) {
                displayValue = values.value.format('HH:mm');
            } else if (values.dataType === 'datetime' && values.value) {
                displayValue = values.value.format('DD/MM/YYYY HH:mm');
            }

            const tag = {
                ...values,
                value: displayValue || '',
                options: values.dataType === 'select' ? selectOptions.filter(opt => opt.trim() !== '') : undefined,
                isMultipleSelect: values.dataType === 'select' ? isMultipleSelect : undefined,
                rows: values.dataType === 'textarea' ? textareaRows : undefined, // Number of rows for textarea
                index: tagsData.tags.length + 1, // Auto increment index
                dataTypeLabel: dataType?.label || '',
                width: fieldWidth // Layout configuration (textarea always 100%)
            };

            onAddTag(tag);
            tagForm.resetFields();
            setSelectedDataType('string'); // Reset to default
            setSelectOptions(['']); // Reset options
            setIsMultipleSelect(false); // Reset multiple select
            setTextareaRows(3); // Reset rows
            setFieldWidth(40); // Reset width to default 40%
        });
    };

    // Handle inline edit
    const handleCellEdit = (record, field, value) => {
        // Only allow editing if row is in edit mode
        if (!editingRows.has(record.id)) {
            return;
        }

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
            title: 'STT',
            dataIndex: 'index',
            key: 'index',
            width: '6%',
            render: (text) => (
                <Text strong style={{ textAlign: 'center', display: 'block' }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Tên trường',
            dataIndex: 'key',
            key: 'key',
            width: '22%',
            render: (text, record) => {
                const isEditing = editingRows.has(record.id);
                if (isEditing) {
                    return (
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
                    );
                }
                return <Text strong>{text}</Text>;
            },
        },
        {
            title: 'Giá trị (Value)',
            dataIndex: 'value',
            key: 'value',
            width: '30%',
            render: (text, record) => {
                const isEditing = editingRows.has(record.id);
                if (isEditing) {
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
                }
                return <Text>{text}</Text>;
            },
        },
        {
            title: 'Loại dữ liệu',
            dataIndex: 'dataType',
            key: 'dataType',
            width: '18%',
            render: (value, record) => {
                const isEditing = editingRows.has(record.id);
                if (isEditing) {
                    return (
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
                    );
                }
                return <Text type="secondary" style={{ fontSize: '12px' }}>{record.dataTypeLabel}</Text>;
            },
        },
        {
            title: 'Độ rộng',
            dataIndex: 'width',
            key: 'width',
            width: '12%',
            render: (width) => (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    {width || 50}%
                </Text>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            fixed: 'right',
            width: 150,
            render: (_, record) => {
                const isEditing = editingRows.has(record.id);
                return (
                    <div className="flex gap-2">
                        <div className="drag-handle">
                            <DragOutlined
                                style={{ color: '#999', cursor: 'grab', fontSize: '14px' }}
                                title="Kéo thả để thay đổi thứ tự"
                            />
                        </div>
                        <Button
                            type="dashed"
                            size="small"
                            className="!bg-orange-100 !border-orange-200 !text-orange-800 hover:!bg-orange-200"
                            onClick={() => toggleEditMode(record.id)}
                            title={isEditing ? 'Chế độ xem' : 'Chế độ chỉnh sửa'}
                        >
                            <EditOutlined size={14} />
                        </Button>
                        <Popconfirm
                            title="Xóa tag"
                            description="Bạn có chắc chắn muốn xóa tag này?"
                            onConfirm={() => onRemoveTag(record.id)}
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
                );
            },
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
        <div className="tags-tab" style={{ position: 'relative', minHeight: '100%' }}>
            {/* Main Content */}
            <div style={{
                width: '100%',
                minHeight: '100vh'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        <TagOutlined /> Gắn thẻ & Metadata
                    </Title>
                    <Space wrap>
                        <Button
                            type="default"
                            icon={<FullscreenOutlined />}
                            onClick={() => setPreviewFullscreen(true)}
                        >
                            Xem toàn màn hình
                        </Button>
                        <Button
                            type={previewVisible ? 'primary' : 'default'}
                            icon={previewVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            onClick={() => onPreviewVisibleChange && onPreviewVisibleChange(!previewVisible)}
                        >
                            {previewVisible ? 'Ẩn xem trước' : 'Hiện xem trước'}
                        </Button>
                    </Space>
                </div>

                <Alert
                    message="Cấu hình trường thông tin cho hợp đồng"
                    description="Thêm các trường thông tin để tạo mẫu hợp đồng bảo hiểm. Các trường này sẽ được hiển thị trên hợp đồng PDF theo thứ tự và độ rộng bạn cấu hình. Xem trước realtime ở bên phải."
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
                            <Col span={12}>
                                <Form.Item
                                    name="key"
                                    label="Tên trường (Key)"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập tên trường' }
                                    ]}
                                >
                                    <Input
                                        placeholder="VD: Họ và tên, Ngày sinh, Địa chỉ"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    name="value"
                                    label="Giá trị (Value)"
                                    rules={getValueValidationRules()}
                                >
                                    {renderValueInput()}
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16} align="middle">
                            <Col span={12}>
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
                                                <Tooltip
                                                    title={
                                                        <div>
                                                            <div><strong>{type.label}</strong></div>
                                                            <div style={{ marginTop: '4px' }}>{type.description}</div>
                                                        </div>
                                                    }
                                                    placement="right"
                                                    mouseEnterDelay={0.3}
                                                >
                                                    <div style={{
                                                        maxWidth: '330px',
                                                        cursor: 'pointer'
                                                    }}
                                                        className="option-hover-item"
                                                    >
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
                                                </Tooltip>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    label={
                                        <Space size={4}>
                                            <span>Độ rộng trường</span>
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                            Độ rộng trường chiếm % của hợp đồng:
                                                        </div>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            • <strong>20%</strong>: Rất ngắn - 5 trường/hàng
                                                        </div>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            • <strong>40%</strong>: Ngắn - 2-3 trường/hàng
                                                        </div>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            • <strong>60%</strong>: Vừa - 1-2 trường/hàng
                                                        </div>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            • <strong>80%</strong>: Dài - 1 trường/hàng
                                                        </div>
                                                        <div>
                                                            • <strong>100%</strong>: Toàn bộ - 1 trường/hàng
                                                        </div>
                                                        {selectedDataType === 'textarea' && (
                                                            <div style={{ marginTop: '8px', color: '#faad14', fontSize: '11px' }}>
                                                                ⚠️ Văn bản dài luôn dùng 100%
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '11px' }}>
                                                            💡 Hệ thống tự động sắp xếp các trường vào hàng dựa trên tổng % độ rộng
                                                        </div>
                                                    </div>
                                                }
                                                placement="topLeft"
                                            >
                                                <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                                            </Tooltip>
                                        </Space>
                                    }
                                >
                                    <Slider
                                        value={fieldWidth}
                                        onChange={setFieldWidth}
                                        min={20}
                                        max={100}
                                        step={20}
                                        marks={{
                                            20: '20%',
                                            40: '40%',
                                            60: '60%',
                                            80: '80%',
                                            100: '100%'
                                        }}
                                        tooltip={{
                                            formatter: (value) => {
                                                const descriptions = {
                                                    20: '20% - Rất ngắn (5 trường/hàng)',
                                                    40: '40% - Ngắn (2-3 trường/hàng)',
                                                    60: '60% - Vừa (1-2 trường/hàng)',
                                                    80: '80% - Dài (1 trường/hàng)',
                                                    100: '100% - Toàn bộ (1 trường/hàng)'
                                                };
                                                return descriptions[value] || `${value}%`;
                                            }
                                        }}
                                        disabled={selectedDataType === 'textarea'}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={handleAddTag}
                                        size="large"
                                        block
                                        style={{ height: '48px', fontSize: '15px' }}
                                    >
                                        Thêm
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
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
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="tags-table">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        <Table
                                            columns={tagsColumns}
                                            dataSource={tagsData.tags}
                                            rowKey="id"
                                            pagination={false}
                                            className="tags-table"
                                            size="middle"
                                            components={{
                                                body: {
                                                    row: ({ children, ...props }) => (
                                                        <Draggable
                                                            draggableId={props['data-row-key'].toString()}
                                                            index={props.index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <tr
                                                                    {...props}
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        backgroundColor: snapshot.isDragging ? '#fafafa' : 'transparent',
                                                                    }}
                                                                >
                                                                    {children}
                                                                </tr>
                                                            )}
                                                        </Draggable>
                                                    ),
                                                },
                                            }}
                                            onRow={(record, index) => ({
                                                index,
                                                'data-row-key': record.id,
                                            })}
                                        />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div style={{ marginTop: 16 }}>
                            <Text type="secondary">
                                Tổng cộng: <Text strong>{tagsData.tags.length}</Text> tags
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                💡 Kéo thả icon <DragOutlined /> để thay đổi thứ tự • Nhấn <EditOutlined /> để chỉnh sửa
                            </Text>
                        </div>
                    </Card>
                )}

                {/* Tag Usage Guidelines */}
                <Card
                    title="Hướng dẫn sử dụng"
                    style={{ marginTop: 16 }}
                    className="guidelines-card"
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Title level={5}>📋 Các loại trường phổ biến:</Title>
                            <ul style={{ fontSize: '13px' }}>
                                <li><Text strong>Họ và tên:</Text> Văn bản (String)</li>
                                <li><Text strong>Ngày sinh:</Text> Ngày tháng (Date)</li>
                                <li><Text strong>Địa chỉ:</Text> Văn bản (String)</li>
                                <li><Text strong>Số điện thoại:</Text> Văn bản (String)</li>
                                <li><Text strong>Số tiền bảo hiểm:</Text> Số thập phân (Decimal)</li>
                                <li><Text strong>Giới tính:</Text> Có/Không (Boolean)</li>
                                <li><Text strong>Ngày ký:</Text> Ngày giờ (DateTime)</li>
                                <li><Text strong>Quốc tịch:</Text> Lựa chọn (Select)</li>
                            </ul>
                        </Col>
                        <Col span={12}>
                            <Title level={5}>💡 Cấu hình Layout:</Title>
                            <ul style={{ fontSize: '13px' }}>
                                <li><Text strong>Độ rộng:</Text> 20%, 40%, 60%, 80%, 100%</li>
                                <li>20% = 5 trường/hàng (thông tin rất ngắn)</li>
                                <li>40% = 2-3 trường/hàng (thông tin ngắn)</li>
                                <li>60% = 1-2 trường/hàng (thông tin vừa)</li>
                                <li>80% = 1 trường/hàng (thông tin dài)</li>
                                <li>100% = 1 trường/hàng (toàn bộ)</li>
                                <li><Text type="warning">Văn bản dài luôn 100%</Text></li>
                            </ul>
                            <Title level={5} style={{ marginTop: '16px' }}>✨ Tính năng:</Title>
                            <ul style={{ fontSize: '13px' }}>
                                <li>Tất cả giá trị có thể để trống</li>
                                <li>Văn bản dài: Nhiều dòng, full width</li>
                                <li>Kéo thả <DragOutlined /> để sắp xếp</li>
                                <li>Xem trước realtime bên phải</li>
                                <li>Xuất PDF khi hoàn thành</li>
                            </ul>
                        </Col>
                    </Row>
                </Card>
            </div>

            {/* Fullscreen Preview Modal */}
            <Modal
                open={previewFullscreen}
                onCancel={() => setPreviewFullscreen(false)}
                width="100%"
                style={{ top: 0, paddingBottom: 0, maxWidth: '100vw' }}
                bodyStyle={{ height: 'calc(100vh - 110px)', padding: 0, overflow: 'auto' }}
                title={
                    <Space>
                        <FileTextOutlined />
                        <span>Xem trước hợp đồng - Toàn màn hình</span>
                    </Space>
                }
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={() => message.info('Chức năng xuất PDF sẽ được triển khai sau')}
                            >
                                Xuất PDF
                            </Button>
                            <Button
                                icon={<PrinterOutlined />}
                                onClick={() => window.print()}
                            >
                                In ấn
                            </Button>
                        </Space>
                        <Space>
                            <Button onClick={() => setPreviewFullscreen(false)}>
                                Đóng
                            </Button>
                        </Space>
                    </div>
                }
            >
                <ContractPreview tagsData={tagsData} isFullscreen={true} />
            </Modal>
        </div>
    );
};

export default TagsTab;