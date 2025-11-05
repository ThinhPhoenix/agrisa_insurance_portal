import CustomForm from '@/components/custom-form';
import CustomTable from '@/components/custom-table';
import { calculateConditionCost } from '@/stores/policy-store';
import {
    AlertOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
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
import { useRef, useState } from 'react';

const { Title, Text, Text: TypographyText } = Typography;
const { Panel } = Collapse;

const ConfigurationTab = ({
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
                conditionOrder: values.conditionOrder || null,

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
            label: 'Khoảng thời gian giám sát',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 1,
            placeholder: '1',
            size: 'large',
            tooltip: 'Số đơn vị thời gian giữa các lần giám sát (theo monitor_interval trong spec)',
            rules: [
                { required: true, message: 'Vui lòng nhập khoảng thời gian giám sát' },
                { type: 'number', min: 1, message: 'Tối thiểu 1' }
            ]
        },
        {
            name: 'monitorFrequencyUnit',
            label: 'Đơn vị thời gian',
            type: 'select',
            required: true,
            gridColumn: '2',
            placeholder: 'Chọn đơn vị',
            size: 'large',
            optionLabelProp: 'label',
            dropdownStyle: { maxWidth: '300px' },
            tooltip: 'Đơn vị thời gian cho monitor_interval (hour, day, week, month, year)',
            options: [
                { value: 'hour', label: 'giờ', description: 'Giám sát theo giờ' },
                { value: 'day', label: 'ngày', description: 'Giám sát theo ngày' },
                { value: 'week', label: 'tuần', description: 'Giám sát theo tuần' },
                { value: 'month', label: 'tháng', description: 'Giám sát theo tháng' },
                { value: 'year', label: 'năm', description: 'Giám sát theo năm' }
            ],
            renderOption: (option) => renderOptionWithTooltip(option, null),
            rules: [
                { required: true, message: 'Vui lòng chọn đơn vị thời gian' }
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
            tooltip: 'Cách kết hợp nhiều điều kiện: AND (tất cả phải đúng) hoặc OR (một trong các điều kiện đúng)',
            options: [
                { value: 'AND', label: 'AND - Tất cả điều kiện phải đúng' },
                { value: 'OR', label: 'OR - Một trong các điều kiện đúng' }
            ],
            rules: [
                { required: true, message: 'Vui lòng chọn toán tử logic' }
            ]
        },
        {
            name: 'growthStage',
            label: 'Giai đoạn sinh trưởng',
            type: 'textarea',
            gridColumn: '2',
            rows: 2,
            placeholder: 'VD: Toàn chu kỳ sinh trưởng lúa (120 ngày)',
            size: 'large',
            tooltip: 'Mô tả giai đoạn sinh trưởng của cây trồng',
            showCount: true,
            maxLength: 500
        },
        {
            name: 'blackoutPeriods',
            label: 'Khoảng thời gian không giám sát (JSON)',
            type: 'textarea',
            gridColumn: '1 / -1',
            rows: 3,
            placeholder: '[{"start": 1762016400, "end": 1762102800}]',
            size: 'large',
            tooltip: 'Mảng JSON các khoảng thời gian không giám sát/không bồi thường (Unix timestamps)',
            showCount: true,
            maxLength: 2000
        }
    ];

    // Note: Additional settings fields removed - not in BE spec
    // - policyDescription → already have product_description in BasicTab
    // - enableGracePeriod/gracePeriodDays → not in spec
    // - enableAutoRenewal → already have auto_renewal in BasicTab
    // - enableStorage → not in spec
    // - NotificationsManager → use important_additional_information in BasicTab

    // Generate condition form fields
    const getConditionFormFields = () => {
        // Filter out data sources that are already used in conditions (except current editing condition)
        const usedDataSourceIds = configurationData.conditions
            ?.filter(condition => !editingCondition || condition.id !== editingCondition.id)
            ?.map(condition => condition.dataSourceId) || [];

        const availableDataSourcesFiltered = availableDataSources.filter(
            source => !usedDataSourceIds.includes(source.value)
        );

        const fields = [
            {
                name: 'dataSourceId',
                label: 'Nguồn dữ liệu',
                type: 'select',
                required: true,
                gridColumn: '1',
                placeholder: 'Chọn nguồn dữ liệu',
                size: 'large',
                optionLabelProp: 'displayLabel',
                dropdownStyle: { maxWidth: '300px' },
                options: availableDataSourcesFiltered.map(source => {
                    const displayLabel = source.label.length > 17 ? source.label.substring(0, 17) + '...' : source.label;
                    return {
                        value: source.value,
                        label: source.label,
                        displayLabel: displayLabel,
                        labelProp: source.label,
                        parameterName: source.parameterName,
                        unit: source.unit
                    };
                }),
                renderOption: (option) => renderOptionWithTooltip(option, (
                    <div>
                        <div><strong>{option.label}</strong></div>
                        <div style={{ marginTop: '4px' }}>{option.parameterName}</div>
                        <div style={{ marginTop: '4px', color: '#52c41a' }}>
                            Đơn vị: {option.unit}
                        </div>
                    </div>
                ))
            },
            {
                name: 'aggregationFunction',
                label: 'Hàm tổng hợp',
                type: 'select',
                required: true,
                gridColumn: '2',
                placeholder: 'Chọn hàm tổng hợp',
                size: 'large',
                optionLabelProp: 'label',
                dropdownStyle: { maxWidth: '300px' },
                options: mockData.aggregationFunctions?.map(func => ({
                    value: func.value,
                    label: func.label,
                    labelProp: func.label,
                    description: func.description
                })),
                renderOption: (option) => renderOptionWithTooltip(option, (
                    <div>
                        <div><strong>{option.label}</strong></div>
                        <div style={{ marginTop: '4px' }}>{option.description}</div>
                    </div>
                ))
            },
            {
                name: 'aggregationWindowDays',
                label: 'Cửa sổ Tổng hợp (Ngày)',
                type: 'number',
                required: true,
                gridColumn: '3',
                placeholder: '30',
                min: 1,
                size: 'large',
                rules: [
                    { required: true, message: 'Nhập cửa sổ tổng hợp' },
                    { type: 'number', min: 1, message: 'Tối thiểu 1 ngày' }
                ]
            },
            {
                name: 'thresholdOperator',
                label: 'Toán tử Ngưỡng',
                type: 'select',
                required: true,
                gridColumn: '1',
                placeholder: 'Chọn toán tử',
                size: 'large',
                optionLabelProp: 'label',
                dropdownStyle: { maxWidth: '300px' },
                options: mockData.thresholdOperators?.map(operator => ({
                    value: operator.value,
                    label: operator.label,
                    labelProp: operator.label,
                    description: operator.description
                })),
                renderOption: (option) => renderOptionWithTooltip(option, (
                    <div>
                        <div><strong>{option.label}</strong></div>
                        <div style={{ marginTop: '4px' }}>{option.description}</div>
                    </div>
                ))
            },
            {
                name: 'thresholdValue',
                label: 'Giá trị Ngưỡng',
                type: 'number',
                required: true,
                gridColumn: '2',
                placeholder: '200',
                size: 'large'
            },
            {
                name: 'earlyWarningThreshold',
                label: 'Ngưỡng cảnh báo sớm',
                type: 'number',
                gridColumn: '3',
                min: 0,
                placeholder: '60',
                size: 'large',
                tooltip: 'Ngưỡng cảnh báo sớm trước khi đạt ngưỡng chính (early_warning_threshold)',
                rules: [
                    { type: 'number', min: 0, message: 'Phải >= 0' }
                ]
            },
            {
                name: 'consecutiveRequired',
                label: 'Yêu cầu liên tiếp',
                type: 'switch',
                gridColumn: '1',
                checkedChildren: 'Có',
                unCheckedChildren: 'Không',
                tooltip: 'Điều kiện phải thỏa liên tiếp qua các monitor windows mới kích hoạt'
            },
            {
                name: 'includeComponent',
                label: 'Bao gồm Component',
                type: 'switch',
                gridColumn: '2',
                checkedChildren: 'Có',
                unCheckedChildren: 'Không',
                tooltip: 'Bao gồm các component cụ thể của dữ liệu (nếu có)'
            },
            {
                name: 'validationWindowDays',
                label: 'Cửa sổ kiểm tra (Ngày)',
                type: 'number',
                gridColumn: '3',
                min: 1,
                placeholder: '7',
                size: 'large',
                tooltip: 'Số ngày để kiểm tra dữ liệu có sẵn/hợp lệ trước khi kích hoạt',
                rules: [
                    { type: 'number', min: 1, message: 'Tối thiểu 1 ngày' }
                ]
            },
            {
                name: 'conditionOrder',
                label: 'Thứ tự điều kiện',
                type: 'number',
                gridColumn: '1',
                min: 1,
                placeholder: '1',
                size: 'large',
                tooltip: 'Thứ tự ưu tiên của điều kiện này (1 = cao nhất)',
                rules: [
                    { type: 'number', min: 1, message: 'Tối thiểu 1' }
                ]
            },
            // ✅ Baseline fields - OPTIONAL for ALL aggregation functions (not just 'change')
            {
                name: 'baselineWindowDays',
                label: 'Cửa sổ Baseline (Ngày)',
                type: 'number',
                gridColumn: '2',
                placeholder: '365',
                min: 1,
                size: 'large',
                tooltip: 'Khoảng thời gian lịch sử để tính baseline và so sánh với giá trị hiện tại (OPTIONAL - để trống nếu không cần so sánh lịch sử). Thường dùng cho aggregation "change" hoặc so sánh xu hướng.',
                rules: [
                    { type: 'number', min: 1, message: 'Tối thiểu 1 ngày nếu nhập' }
                ]
            },
            {
                name: 'baselineFunction',
                label: 'Hàm Baseline',
                type: 'select',
                gridColumn: '3',
                placeholder: 'Chọn hàm (nếu có baseline)',
                size: 'large',
                tooltip: 'Hàm tính baseline từ dữ liệu lịch sử (OPTIONAL - chỉ cần nếu đã nhập baselineWindowDays)',
                options: [
                    { value: 'avg', label: 'Trung bình (Avg)' },
                    { value: 'sum', label: 'Tổng (Sum)' },
                    { value: 'min', label: 'Tối thiểu (Min)' },
                    { value: 'max', label: 'Tối đa (Max)' }
                ],
                rules: [
                    // ✅ Conditional validation: if baselineWindowDays exists, baselineFunction is required
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            const baselineWindowDays = getFieldValue('baselineWindowDays');
                            if (baselineWindowDays && !value) {
                                return Promise.reject(new Error('Vui lòng chọn hàm baseline khi đã nhập cửa sổ baseline'));
                            }
                            return Promise.resolve();
                        }
                    })
                ]
            }
        ];

        return fields;
    };

    // Trigger conditions table columns
    const conditionsColumns = [
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
                            <> | Baseline: {record.baselineWindowDays} ngày</>
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
                                                rules={[{ required: true, message: 'Vui lòng chọn nguồn dữ liệu' }]}
                                            >
                                                <Select
                                                    placeholder="Chọn nguồn dữ liệu"
                                                    size="large"
                                                    optionLabelProp="displayLabel"
                                                    dropdownStyle={{ maxWidth: '300px' }}
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
                                                label="Hàm tổng hợp"
                                                rules={[{ required: true, message: 'Vui lòng chọn hàm tổng hợp' }]}
                                            >
                                                <Select
                                                    placeholder="Chọn hàm tổng hợp"
                                                    size="large"
                                                    optionLabelProp="label"
                                                    dropdownStyle={{ maxWidth: '300px' }}
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
                                        <Col span={8}>
                                            <Form.Item
                                                name="thresholdOperator"
                                                label="Toán tử Ngưỡng"
                                                rules={[{ required: true, message: 'Vui lòng chọn toán tử' }]}
                                            >
                                                <Select
                                                    placeholder="Chọn toán tử"
                                                    size="large"
                                                    optionLabelProp="label"
                                                    dropdownStyle={{ maxWidth: '300px' }}
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
                                                label="Giá trị Ngưỡng"
                                                rules={[{ required: true, message: 'Vui lòng nhập giá trị ngưỡng' }]}
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
                                                name="alertThreshold"
                                                label="Ngưỡng cảnh báo sớm (%)"
                                                rules={[{ type: 'number', min: 50, max: 95, message: 'Từ 50% đến 95%' }]}
                                            >
                                                <InputNumber
                                                    placeholder="80"
                                                    min={50}
                                                    max={95}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    formatter={value => `${value}%`}
                                                    parser={value => value.replace('%', '')}
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

                {/* Note: Additional Settings panel removed - fields not in BE spec */}
                {/* - policyDescription → use product_description in BasicTab */}
                {/* - enableGracePeriod/gracePeriodDays → not in spec */}
                {/* - enableAutoRenewal → use auto_renewal in BasicTab */}
                {/* - enableStorage → not in spec */}
                {/* - importantNotifications → use important_additional_information in BasicTab */}
            </Collapse>
        </div>
    );
};

export default ConfigurationTab;