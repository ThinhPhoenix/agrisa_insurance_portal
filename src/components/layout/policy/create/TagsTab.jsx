import {
    DeleteOutlined,
    DragOutlined,
    EditOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    PlusOutlined,
    TagOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Checkbox,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    TimePicker,
    Typography
} from 'antd';
import React from 'react';
import PlaceholderMappingPanel from './PlaceholderMappingPanel';

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
    onPreviewVisibleChange,
    onFileUpload,
    onFileRemove
    ,
    // New handlers from parent (page.js)
    onOpenPaste,
    onOpenFullscreen,
    placeholders = [],
    filePreviewRef  //  NEW - receive from parent to pass down to PlaceholderMappingPanel
}) => {
    const [tagForm] = Form.useForm();
    const [selectedDataType, setSelectedDataType] = React.useState('string');
    const [selectOptions, setSelectOptions] = React.useState(['']);
    const [isMultipleSelect, setIsMultipleSelect] = React.useState(false);
    const [editingRows, setEditingRows] = React.useState(new Set()); // Track which rows are in edit mode
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
            width: '30%',
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

                {/* (Thêm Tag Nhanh đã bị loại bỏ — dùng ô Map trong bảng để tạo và map trực tiếp) */}

                {/* Placeholder mapping panel replaces the tags table */}

                {placeholders && placeholders.length > 0 ? (
                    <PlaceholderMappingPanel
                        placeholders={placeholders}
                        tags={tagsData?.tags || []}
                        tagDataTypes={mockData.tagDataTypes || []}
                        onCreateTag={(tag) => {
                            console.log('🔍 TagsTab - onCreateTag called with:', tag);
                            console.log('🔍 TagsTab - calling onAddTag...');
                            onAddTag(tag);
                            console.log('🔍 TagsTab - onAddTag called, current tagsData.tags:', tagsData.tags);
                        }}
                        onMappingChange={(mappings, pdfData) => {
                            console.log('🔍 TagsTab - onMappingChange called with:', { mappings, pdfData });

                            //  FIX: Use handleTagsDataChange (prev => ...) instead of spreading tagsData
                            // to avoid race condition where tags haven't been added yet
                            onDataChange && onDataChange((prev) => {
                                const updates = { ...prev, mappings };

                                // Only update fields that exist in pdfData (avoid overwriting with undefined)
                                if (pdfData) {
                                    if (pdfData.documentTagsObject !== undefined) {
                                        updates.documentTagsObject = pdfData.documentTagsObject;
                                    }
                                    if (pdfData.modifiedPdfBytes !== undefined) {
                                        updates.modifiedPdfBytes = pdfData.modifiedPdfBytes;
                                    }
                                    if (pdfData.uploadedFile !== undefined) {
                                        updates.uploadedFile = pdfData.uploadedFile;
                                    }
                                }

                                return updates;
                            });
                        }}
                        onExportSchema={(schema) => console.log('Exported schema', schema)}
                        filePreviewRef={filePreviewRef}  //  Pass ref down to PlaceholderMappingPanel
                    />
                ) : (
                    <Alert
                        message="Chưa có placeholders"
                        description="Upload hoặc paste text từ PDF để phát hiện placeholders và map với tags"
                        type="info"
                        showIcon
                    />
                )}

                <div style={{ marginTop: 12 }}>
                    <Text type="secondary">Tổng tags hiện tại: <Text strong>{tagsData.tags.length}</Text></Text>
                </div>
            </div>
        </div>
    );
};

export default TagsTab;