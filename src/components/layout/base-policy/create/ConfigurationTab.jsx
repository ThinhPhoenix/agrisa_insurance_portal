import CustomForm from '@/components/custom-form';
import CustomTable from '@/components/custom-table';
import {
    getConditionError,
    getConditionValidation,
    getTriggerValidation
} from '@/libs/message';
import { calculateConditionCost } from '@/stores/policy-store';
import {
    AlertOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    HolderOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    SettingOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Collapse,
    Form,
    InputNumber,
    Popconfirm,
    Row,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const { Title, Text, Text: TypographyText } = Typography;
const { Panel } = Collapse;

// ✅ OPTIMIZATION: Memoize ConfigurationTab to prevent unnecessary re-renders
const ConfigurationTabComponent = ({
    configurationData,
    mockData,
    onDataChange,
    onAddTriggerCondition,
    onRemoveTriggerCondition,
    onUpdateTriggerCondition,
    getAvailableDataSourcesForTrigger
}) => {
    const formRef = useRef();
    const [conditionForm] = Form.useForm();
    const conditionFormRef = useRef();
    const [editingCondition, setEditingCondition] = useState(null);

    const availableDataSources = getAvailableDataSourcesForTrigger();

    // ✅ Filter out data sources that are already used in conditions
    const unusedDataSources = availableDataSources.filter(dataSource => {
        // Check if this data source is already used in any condition
        const isUsed = configurationData.conditions?.some(
            condition => condition.dataSourceId === dataSource.value
        );
        return !isUsed;
    });

    // Handle form values change
    const handleValuesChange = (changedValues, allValues) => {
        onDataChange(allValues);
    };

    // Handle add/update condition
    const handleSaveCondition = () => {
        conditionForm.validateFields().then(values => {
            const selectedDataSource = availableDataSources.find(ds => ds.value === values.dataSourceId);

            // Get baseCost and multipliers from BasicTab's selected data sources
            // The values.dataSourceId matches the 'id' field from basicData.selectedDataSources
            // But we need to access it via the parent component (getAvailableDataSourcesForTrigger passes basicData.selectedDataSources)
            // For now, we'll get it from the selectedDataSource if it has those properties
            // If not, we'll use default values

            // Note: availableDataSources structure needs baseCost, categoryMultiplier, tierMultiplier
            // We need to pass these from parent through getAvailableDataSourcesForTrigger
            const baseCost = selectedDataSource?.baseCost || 0;
            const categoryMultiplier = selectedDataSource?.categoryMultiplier || 1;
            const tierMultiplier = selectedDataSource?.tierMultiplier || 1;

            // Calculate condition cost
            const calculatedCost = calculateConditionCost(baseCost, categoryMultiplier, tierMultiplier);

            // ✅ AUTO-SET conditionOrder: Set theo thứ tự thêm của user
            // Nếu đang edit, giữ nguyên order cũ
            // Nếu thêm mới, set order = số lượng conditions hiện tại + 1
            let conditionOrder;
            if (editingCondition) {
                conditionOrder = editingCondition.conditionOrder;
            } else {
                conditionOrder = (configurationData.conditions?.length || 0) + 1;
            }

            const condition = {
                // ✅ Core condition fields (from form)
                dataSourceId: values.dataSourceId, // REQUIRED - UUID from API
                thresholdOperator: values.thresholdOperator, // REQUIRED
                thresholdValue: values.thresholdValue, // REQUIRED
                earlyWarningThreshold: values.earlyWarningThreshold || null,
                aggregationFunction: values.aggregationFunction, // REQUIRED
                aggregationWindowDays: values.aggregationWindowDays, // REQUIRED
                consecutiveRequired: values.consecutiveRequired ?? false,
                includeComponent: values.includeComponent ?? false,
                baselineWindowDays: values.baselineWindowDays || null,
                baselineFunction: values.baselineFunction || null,
                validationWindowDays: values.validationWindowDays || null,
                conditionOrder, // ✅ AUTO-SET theo thứ tự thêm

                // ✅ Display labels (for UI table)
                id: editingCondition?.id || Date.now().toString(),
                dataSourceLabel: selectedDataSource?.label || '',
                parameterName: selectedDataSource?.parameterName || '',
                unit: selectedDataSource?.unit || '',
                aggregationFunctionLabel: mockData.aggregationFunctions.find(af => af.value === values.aggregationFunction)?.label || '',
                thresholdOperatorLabel: mockData.thresholdOperators.find(to => to.value === values.thresholdOperator)?.label || '',

                // ✅ Cost calculation fields (for payload)
                baseCost,
                categoryMultiplier,
                tierMultiplier,
                calculatedCost
            };

            console.log("🔍 ConfigurationTab - Created condition:", condition);

            if (editingCondition) {
                onUpdateTriggerCondition(editingCondition.id, condition);
                setEditingCondition(null);
            } else {
                onAddTriggerCondition(condition);
            }

            conditionFormRef.current?.resetFields();
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

    // ✅ Handle drag end - Reorder conditions and update conditionOrder
    const handleDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (sourceIndex === destIndex) {
            return;
        }

        // Reorder array
        const newConditions = Array.from(configurationData.conditions);
        const [removed] = newConditions.splice(sourceIndex, 1);
        newConditions.splice(destIndex, 0, removed);

        // Update conditionOrder for all conditions based on new position
        const updatedConditions = newConditions.map((condition, index) => ({
            ...condition,
            conditionOrder: index + 1
        }));

        // Update parent state
        onDataChange({
            ...configurationData,
            conditions: updatedConditions
        });
    };

    // Helper function to render select option with tooltip
    const renderOptionWithTooltip = (option, tooltipContent) => {
        return (
            <Tooltip
                title={tooltipContent}
                placement="right"
                mouseEnterDelay={0.3}
            >
                <div style={{ maxWidth: '280px', cursor: 'pointer' }} className="option-hover-item">
                    <TypographyText style={{
                        fontSize: '13px',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {option.label}
                    </TypographyText>
                    {option.description && (
                        <TypographyText type="secondary" style={{
                            fontSize: '11px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {option.description}
                        </TypographyText>
                    )}
                </div>
            </Tooltip>
        );
    };

    // Note: Payout fields (fix_payout_amount, payout_cap, payout_base_rate, over_threshold_multiplier, is_payout_per_hectare) 
    // are already in BasicTab, so we don't duplicate them here

    // Generate monitoring fields
    const getMonitoringFields = () => [
        {
            name: 'monitorInterval',
            label: 'Tần suất giám sát',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 1,
            placeholder: '1',
            size: 'large',
            tooltip: 'Số lần kiểm tra (VD: 1 ngày = kiểm tra mỗi ngày)',
            rules: [
                { required: true, message: getTriggerValidation('MONITOR_INTERVAL_REQUIRED') },
                { type: 'number', min: 1, message: getTriggerValidation('MONITOR_INTERVAL_MIN') }
            ]
        },
        {
            name: 'monitorFrequencyUnit',
            label: 'Đơn vị tần suất',
            type: 'select',
            required: true,
            gridColumn: '2',
            placeholder: 'Chọn đơn vị',
            size: 'large',
            optionLabelProp: 'label',
            dropdownStyle: { maxWidth: '300px' },
            tooltip: 'Đơn vị thời gian (giờ, ngày, tuần, tháng, năm)',
            options: [
                { value: 'hour', label: 'giờ', description: 'Giám sát theo giờ' },
                { value: 'day', label: 'ngày', description: 'Giám sát theo ngày' },
                { value: 'week', label: 'tuần', description: 'Giám sát theo tuần' },
                { value: 'month', label: 'tháng', description: 'Giám sát theo tháng' },
                { value: 'year', label: 'năm', description: 'Giám sát theo năm' }
            ],
            renderOption: (option) => renderOptionWithTooltip(option, null),
            rules: [
                { required: true, message: getTriggerValidation('MONITOR_FREQUENCY_UNIT_REQUIRED') }
            ]
        }
    ];



    // Generate trigger configuration fields
    const getTriggerFields = () => [
        {
            name: 'logicalOperator',
            label: 'Toán tử Logic',
            type: 'select',
            required: true,
            gridColumn: '1',
            placeholder: 'Chọn toán tử',
            size: 'large',
            tooltip: 'AND = tất cả điều kiện phải đúng | OR = 1 điều kiện đúng là đủ',
            options: [
                { value: 'AND', label: 'AND - Tất cả điều kiện phải đúng' },
                { value: 'OR', label: 'OR - Một trong các điều kiện đúng' }
            ],
            rules: [
                { required: true, message: getTriggerValidation('LOGICAL_OPERATOR_REQUIRED') }
            ]
        },
        {
            name: 'growthStage',
            label: 'Giai đoạn sinh trưởng',
            type: 'textarea',
            gridColumn: '2',
            rows: 2,
            placeholder: 'Ví dụ: Toàn chu kỳ sinh trưởng lúa (120 ngày)',
            size: 'large',
            tooltip: 'Mô tả giai đoạn sinh trưởng (không bắt buộc, tối đa 500 ký tự)',
            showCount: true,
            maxLength: 500
        }
        // ✅ HIDDEN: blackoutPeriods field - Giữ nguyên payload object rỗng {} nhưng ẩn UI input
        // Payload sẽ được set mặc định là {} trong hook
    ];

    // Note: Additional settings fields removed - not in BE spec
    // - policyDescription → already have product_description in BasicTab
    // - enableGracePeriod/gracePeriodDays → not in spec
    // - enableAutoRenewal → already have auto_renewal in BasicTab
    // - enableStorage → not in spec
    // - NotificationsManager → use important_additional_information in BasicTab

    // Trigger conditions table columns
    const conditionsColumns = [
        {
            title: '#',
            dataIndex: 'conditionOrder',
            key: 'conditionOrder',
            width: 60,
            render: (order) => (
                <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {order || 1}
                </Tag>
            ),
        },
        {
            title: 'Nguồn dữ liệu',
            dataIndex: 'dataSourceLabel',
            key: 'dataSourceLabel',
            render: (text, record) => (
                <div>
                    <TypographyText strong>{text}</TypographyText>
                    <br />
                    <TypographyText type="secondary" style={{ fontSize: '12px' }}>
                        {record.parameterName} ({record.unit})
                    </TypographyText>
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
                    <TypographyText type="secondary" style={{ fontSize: '12px' }}>
                        {record.aggregationWindowDays} ngày
                        {record.baselineWindowDays && (
                            <> | Baseline: {record.baselineWindowDays} ngày ({record.baselineFunction})</>
                        )}
                        {record.validationWindowDays && (
                            <> | Kiểm tra: {record.validationWindowDays} ngày</>
                        )}
                    </TypographyText>
                </div>
            ),
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div>
                    <TypographyText>
                        {record.thresholdOperatorLabel} {record.thresholdValue} {record.unit}
                    </TypographyText>
                    {(record.consecutiveRequired || record.includeComponent) && (
                        <>
                            <br />
                            <TypographyText type="secondary" style={{ fontSize: '11px' }}>
                                {record.consecutiveRequired && 'Liên tiếp'}
                                {record.consecutiveRequired && record.includeComponent && ' | '}
                                {record.includeComponent && 'Bao gồm Component'}
                            </TypographyText>
                        </>
                    )}
                </div>
            ),
        },
        {
            title: 'Chi phí tính toán',
            key: 'calculatedCost',
            align: 'right',
            render: (_, record) => (
                <div>
                    <TypographyText strong style={{ color: '#52c41a' }}>
                        {(record.calculatedCost || 0).toLocaleString('vi-VN')} ₫
                    </TypographyText>
                    <br />
                    <TypographyText type="secondary" style={{ fontSize: '11px' }}>
                        {record.baseCost?.toLocaleString() || 0} × {record.categoryMultiplier || 1} × {record.tierMultiplier || 1}
                    </TypographyText>
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
            <Collapse defaultActiveKey={['monitoring']} size="large">
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
                    <CustomForm
                        ref={formRef}
                        fields={getMonitoringFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="repeat(2, 1fr)"
                        gap="24px"
                    />
                </Panel>

                {/* Trigger Configuration */}
                <Panel
                    header={
                        <Space>
                            <SettingOutlined />
                            <span>Cấu hình Trigger</span>
                        </Space>
                    }
                    key="trigger-config"
                >
                    <div style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 8 }}>Cấu hình Trigger & Giai đoạn sinh trưởng</Title>
                        <TypographyText type="secondary">
                            Chọn toán tử logic để kết hợp các điều kiện, mô tả giai đoạn sinh trưởng, và cấu hình các khoảng thời gian không giám sát (blackout periods).
                        </TypographyText>
                    </div>
                    <CustomForm
                        ref={formRef}
                        fields={getTriggerFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="repeat(2, 1fr)"
                        gap="24px"
                    />
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
                        ) : unusedDataSources.length === 0 && !editingCondition ? (
                            <Alert
                                message="Đã sử dụng hết nguồn dữ liệu"
                                description="Tất cả nguồn dữ liệu đã được thêm vào điều kiện. Vui lòng thêm nguồn dữ liệu mới ở tab 'Thông tin Cơ bản' hoặc chỉnh sửa điều kiện hiện có."
                                type="info"
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
                                                label="Nguồn dữ liệu"
                                                tooltip="Nguồn dữ liệu để tính điều kiện (trạm khí tượng, vệ tinh, v.v.). Mỗi nguồn chỉ được sử dụng một lần"
                                                rules={[{ required: true, message: getConditionValidation('DATA_SOURCE_ID_REQUIRED') }]}
                                            >
                                                <Select
                                                    placeholder="Chọn nguồn dữ liệu"
                                                    size="large"
                                                    optionLabelProp="displayLabel"
                                                    popupMatchSelectWidth={300}
                                                    disabled={!editingCondition && unusedDataSources.length === 0}
                                                >
                                                    {/* ✅ Show only unused data sources when adding new, or include current when editing */}
                                                    {(editingCondition
                                                        ? availableDataSources
                                                        : unusedDataSources
                                                    ).map(source => {
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
                                                label="Phương pháp tổng hợp"
                                                tooltip="Phương pháp tổng hợp (Aggregation Function): Cách thức tính toán một giá trị duy nhất từ dữ liệu thu thập trong một chu kỳ. Ví dụ: SUM để tính tổng lượng mưa, AVG để tính nhiệt độ trung bình"
                                                rules={[{ required: true, message: getConditionValidation('AGGREGATION_FUNCTION_REQUIRED') }]}
                                            >
                                                <Select
                                                    placeholder="Chọn hàm tổng hợp"
                                                    size="large"
                                                    optionLabelProp="label"
                                                    popupMatchSelectWidth={300}
                                                >
                                                    {mockData.aggregationFunctions?.map(func => (
                                                        <Select.Option
                                                            key={func.value}
                                                            value={func.value}
                                                            label={func.label}
                                                            description={func.description}
                                                        >
                                                            <Tooltip
                                                                title={
                                                                    <div>
                                                                        <div><strong>{func.label}</strong></div>
                                                                        <div style={{ marginTop: '4px' }}>{func.description}</div>
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
                                                                        {func.label}
                                                                    </TypographyText>
                                                                </div>
                                                            </Tooltip>
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="aggregationWindowDays"
                                                label="Chu kỳ tổng hợp (ngày)"
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
                                                label="Toán tử so sánh ngưỡng"
                                                tooltip="Toán tử so sánh ngưỡng (Threshold Operator): Phép toán logic (ví dụ: >, <, =) dùng để so sánh giá trị dữ liệu thực tế với giá trị ngưỡng đã định"
                                                rules={[{ required: true, message: getConditionValidation('THRESHOLD_OPERATOR_REQUIRED') }]}
                                            >
                                                <Select
                                                    placeholder="Chọn toán tử"
                                                    size="large"
                                                    optionLabelProp="label"
                                                    popupMatchSelectWidth={300}
                                                >
                                                    {mockData.thresholdOperators?.map(operator => (
                                                        <Select.Option
                                                            key={operator.value}
                                                            value={operator.value}
                                                            label={operator.label}
                                                            description={operator.description}
                                                        >
                                                            <Tooltip
                                                                title={
                                                                    <div>
                                                                        <div><strong>{operator.label}</strong></div>
                                                                        <div style={{ marginTop: '4px' }}>{operator.description}</div>
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
                                                                        {operator.label}
                                                                    </TypographyText>
                                                                </div>
                                                            </Tooltip>
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="thresholdValue"
                                                label="Giá trị ngưỡng"
                                                tooltip="Giá trị ngưỡng (Threshold Value): Mốc giá trị cụ thể để xác định một sự kiện bảo hiểm. Ví dụ: Nếu lượng mưa < 10mm, điều kiện hạn hán được kích hoạt. Đơn vị của ngưỡng phụ thuộc vào nguồn dữ liệu"
                                                rules={[{ required: true, message: getConditionValidation('THRESHOLD_VALUE_REQUIRED') }]}
                                            >
                                                <InputNumber
                                                    placeholder="200"
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="earlyWarningThreshold"
                                                label="Ngưỡng cảnh báo sớm"
                                                tooltip="Ngưỡng cảnh báo sớm (Early Warning Threshold): Một mốc phụ, khi bị vi phạm sẽ gửi cảnh báo cho người dùng biết rủi ro sắp xảy ra, trước khi đạt đến ngưỡng kích hoạt bồi thường chính"
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
                                        <Col span={8}>
                                            <Form.Item
                                                name="consecutiveRequired"
                                                label="Yêu cầu điều kiện liên tục"
                                                tooltip="Yêu cầu điều kiện liên tục (Consecutive Required): Nếu bật, sự kiện bảo hiểm chỉ xảy ra khi điều kiện được thỏa mãn trong nhiều chu kỳ giám sát liên tiếp nhau. Ví dụ: Hạn hán xảy ra nếu không có mưa trong 3 chu kỳ liên tiếp"
                                                valuePropName="checked"
                                            >
                                                <Select
                                                    placeholder="Không"
                                                    size="large"
                                                    options={[
                                                        { value: false, label: 'Không' },
                                                        { value: true, label: 'Có' }
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="includeComponent"
                                                label="Bao gồm thành phần con"
                                                tooltip="Bao gồm thành phần con (Include Component): Cho phép tính toán dựa trên các thành phần con của một loại dữ liệu, nếu có. Ví dụ: Dữ liệu thời tiết có thể bao gồm các thành phần như 'lượng mưa' và 'độ ẩm'"
                                            >
                                                <Select
                                                    placeholder="Không"
                                                    size="large"
                                                    options={[
                                                        { value: false, label: 'Không' },
                                                        { value: true, label: 'Có' }
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="validationWindowDays"
                                                label="Chu kỳ xác thực dữ liệu (ngày)"
                                                tooltip="Chu kỳ xác thực (Validation Window): Số ngày tối thiểu mà dữ liệu từ một nguồn phải có sẵn và hợp lệ trước khi hệ thống sử dụng nó để tính toán, nhằm đảm bảo tính chính xác"
                                                rules={[{ type: 'number', min: 1, message: getConditionValidation('VALIDATION_WINDOW_DAYS_MIN') }]}
                                            >
                                                <InputNumber
                                                    placeholder="7"
                                                    min={1}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        {/* ✅ REMOVED: conditionOrder manual input - Auto-set theo thứ tự thêm của user */}
                                        <Col span={8}>
                                            <Form.Item
                                                name="baselineWindowDays"
                                                label="Chu kỳ tham chiếu (ngày)"
                                                tooltip="Chu kỳ tham chiếu (Baseline Window): Khoảng thời gian trong quá khứ (tính bằng ngày) được dùng để tạo ra một giá trị 'nền' hoặc 'bình thường'. Ví dụ: Lấy dữ liệu của 365 ngày qua để tính lượng mưa trung bình hàng năm. TUỲ CHỌN - để trống nếu không cần so sánh lịch sử"
                                                rules={[{ type: 'number', min: 1, message: getConditionValidation('BASELINE_WINDOW_DAYS_MIN') }]}
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
                                                label="Hàm tính tham chiếu"
                                                tooltip="Hàm tính tham chiếu (Baseline Function): Phương pháp tính toán giá trị 'nền' từ dữ liệu lịch sử. Ví dụ: AVG để tính giá trị trung bình trong chu kỳ tham chiếu. TUỲ CHỌN - BẮT BUỘC nếu đã nhập chu kỳ tham chiếu"
                                                rules={[
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            const baselineWindowDays = getFieldValue('baselineWindowDays');
                                                            if (baselineWindowDays && !value) {
                                                                return Promise.reject(new Error(getConditionError('BASELINE_FUNCTION_REQUIRED')));
                                                            }
                                                            return Promise.resolve();
                                                        }
                                                    })
                                                ]}
                                            >
                                                <Select
                                                    placeholder="Chọn hàm (nếu có giá trị nền)"
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
                                            {editingCondition ? 'Cập nhật Điều kiện' : 'Thêm Điều kiện'}
                                        </Button>
                                        {editingCondition && (
                                            <Button onClick={handleCancelEdit} size="large">
                                                Hủy
                                            </Button>
                                        )}
                                    </Space>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* Logical Operator Configuration */}
                    {configurationData.conditions?.length > 0 && (
                        <Card className="logical-operator-card" style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ marginBottom: 16 }}>Toán tử Logic giữa các điều kiện</Title>
                            <CustomForm
                                ref={formRef}
                                fields={[{
                                    name: 'logicalOperator',
                                    label: '',
                                    type: 'radioGroup',
                                    required: true,
                                    options: mockData.logicalOperators?.map(operator => ({
                                        value: operator.value,
                                        label: (
                                            <div>
                                                <TypographyText strong>{operator.label}</TypographyText>
                                                <br />
                                                <TypographyText type="secondary" style={{ fontSize: '11px' }}>
                                                    {operator.description}
                                                </TypographyText>
                                            </div>
                                        )
                                    }))
                                }]}
                                initialValues={configurationData}
                                onValuesChange={onDataChange}
                            />
                        </Card>
                    )}

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
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="conditions-table">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        <CustomTable
                                            columns={conditionsColumns}
                                            dataSource={configurationData.conditions}
                                            pagination={false}
                                            rowKey="id"
                                            components={{
                                                body: {
                                                    wrapper: (props) => <tbody {...props}>{props.children}</tbody>,
                                                    row: ({ children, ...props }) => {
                                                        const index = configurationData.conditions.findIndex(
                                                            (x) => x.id === props['data-row-key']
                                                        );
                                                        return (
                                                            <Draggable
                                                                key={props['data-row-key']}
                                                                draggableId={props['data-row-key']}
                                                                index={index}
                                                            >
                                                                {(provided, snapshot) => (
                                                                    <tr
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...props}
                                                                        style={{
                                                                            ...props.style,
                                                                            ...provided.draggableProps.style,
                                                                            ...(snapshot.isDragging ? {
                                                                                display: 'table',
                                                                                background: '#fafafa'
                                                                            } : {}),
                                                                        }}
                                                                    >
                                                                        {children?.map((child, idx) => {
                                                                            if (idx === 0) {
                                                                                return (
                                                                                    <td key={child.key} {...child.props}>
                                                                                        <Space>
                                                                                            <HolderOutlined
                                                                                                {...provided.dragHandleProps}
                                                                                                style={{ cursor: 'grab' }}
                                                                                            />
                                                                                            {child.props.children}
                                                                                        </Space>
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            return child;
                                                                        })}
                                                                    </tr>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    },
                                                },
                                            }}
                                        />
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}

                    {/* Logic Preview */}
                    {configurationData.conditions?.length > 0 && (
                        <Card
                            title="Xem trước Logic Kích hoạt"
                            className="logic-preview-card"
                            style={{ marginTop: 16 }}
                        >
                            <div className="logic-preview">
                                <TypographyText>
                                    Thanh toán <TypographyText strong>{configurationData.payoutPercentage}%</TypographyText> (tối đa{' '}
                                    <TypographyText strong>{configurationData.maxPayoutAmount?.toLocaleString()} ₫</TypographyText>) khi{' '}
                                    <TypographyText strong>
                                        {configurationData.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                                    </TypographyText>
                                    {' '}các điều kiện sau được thỏa mãn:
                                </TypographyText>
                                <ul style={{ marginTop: 8 }}>
                                    {configurationData.conditions.map((condition, index) => (
                                        <li key={condition.id}>
                                            <TypographyText>
                                                {condition.aggregationFunctionLabel} của {condition.dataSourceLabel}{' '}
                                                trong {condition.aggregationWindowDays} ngày{' '}
                                                {condition.thresholdOperatorLabel} {condition.thresholdValue} {condition.unit}
                                                {condition.baselineWindowDays && (
                                                    <> (baseline: {condition.baselineWindowDays} ngày)</>
                                                )}
                                            </TypographyText>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    )}
                </Panel>
            </Collapse>
        </div>
    );
};

// ✅ OPTIMIZATION: Wrap with memo and add display name
const ConfigurationTab = memo(ConfigurationTabComponent);
ConfigurationTab.displayName = 'ConfigurationTab';

export default ConfigurationTab;