import CustomForm from '@/components/custom-form';
import CustomTable from '@/components/custom-table';
import TriggerLogicExplainer from '@/components/layout/base-policy/TriggerLogicExplainer';
import {
    getConditionValidation,
    getTriggerValidation
} from '@/libs/message';
import useDictionary from '@/services/hooks/common/use-dictionary';
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
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
    Alert,
    Button,
    Card,
    Col,
    Collapse,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    message
} from 'antd';
import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

const { Title, Text, Text: TypographyText } = Typography;
const { Panel } = Collapse;

//  Debounced Input Component for Vietnamese IME fix
const DebouncedTextArea = memo(({ value: initialValue, onChange, ...props }) => {
    const [localValue, setLocalValue] = useState(initialValue || '');
    const timeoutRef = useRef(null);

    // Sync local state when initialValue changes from parent
    useEffect(() => {
        setLocalValue(initialValue || '');
    }, [initialValue]);

    // Handle input with debounce
    const handleChange = useCallback((e) => {
        const newValue = e.target.value;
        setLocalValue(newValue); // Update local immediately for smooth typing

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce parent update
        timeoutRef.current = setTimeout(() => {
            onChange?.(e);
        }, 300);
    }, [onChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Input.TextArea
            {...props}
            value={localValue}
            onChange={handleChange}
        />
    );
});

DebouncedTextArea.displayName = 'DebouncedTextArea';

//  OPTIMIZATION: Memoize ConfigurationTab to prevent unnecessary re-renders
const ConfigurationTabComponent = ({
    configurationData,
    mockData,
    basicData, //  NEW: Add basicData for valid date range
    onDataChange,
    onAddTriggerCondition,
    onRemoveTriggerCondition,
    onUpdateTriggerCondition,
    onAddBlackoutPeriod, //  NEW: Blackout period handlers
    onRemoveBlackoutPeriod,
    onUpdateBlackoutPeriod,
    getAvailableDataSourcesForTrigger
}) => {
    const formRef = useRef();
    const [conditionForm] = Form.useForm();
    const conditionFormRef = useRef();
    const [editingCondition, setEditingCondition] = useState(null);
    const [blackoutPeriodForm] = Form.useForm(); //  NEW: Form for blackout periods
    const dict = useDictionary();
    const [selectedThresholdOperator, setSelectedThresholdOperator] = useState(null); //  NEW: Track threshold operator

    //  Sync form with configurationData when it changes (e.g., when template is applied)
    const configDataRef = useRef(configurationData);
    useEffect(() => {
        const hasChanged = configDataRef.current !== configurationData;

        if (hasChanged && formRef.current) {
            // Update form fields with current configurationData
            formRef.current.setFieldsValue(configurationData);

            // Manually trigger onDataChange to ensure parent component updates
            onDataChange(configurationData);

            console.log(' ConfigurationTab synced with template data:', {
                conditionsCount: configurationData.conditions?.length || 0,
                logicalOperator: configurationData.logicalOperator,
                blackoutPeriodsCount: configurationData.blackoutPeriods?.periods?.length || 0
            });
        }

        configDataRef.current = configurationData;
    }, [configurationData, onDataChange]);

    const availableDataSources = getAvailableDataSourcesForTrigger();

    //  Filter out data sources that are already used in conditions
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

            //  AUTO-SET conditionOrder: Set theo thứ tự thêm của user
            // Nếu đang edit, giữ nguyên order cũ
            // Nếu thêm mới, set order = số lượng conditions hiện tại + 1
            let conditionOrder;
            if (editingCondition) {
                conditionOrder = editingCondition.conditionOrder;
            } else {
                conditionOrder = (configurationData.conditions?.length || 0) + 1;
            }

            const condition = {
                //  Core condition fields (from form)
                dataSourceId: values.dataSourceId, // REQUIRED - UUID from API
                thresholdOperator: values.thresholdOperator, // REQUIRED
                thresholdValue: values.thresholdValue, // REQUIRED
                earlyWarningThreshold: values.earlyWarningThreshold || null,
                aggregationFunction: values.aggregationFunction, // REQUIRED
                aggregationWindowDays: values.aggregationWindowDays, // REQUIRED
                consecutiveRequired: values.consecutiveRequired ?? false,
                includeComponent: values.includeComponent ?? false,
                //  Baseline CHỈ set khi dùng change_gt hoặc change_lt, các operator khác về null
                baselineWindowDays: (values.thresholdOperator === 'change_gt' || values.thresholdOperator === 'change_lt')
                    ? (values.baselineWindowDays || null)
                    : null,
                baselineFunction: (values.thresholdOperator === 'change_gt' || values.thresholdOperator === 'change_lt')
                    ? (values.baselineFunction || null)
                    : null,
                validationWindowDays: values.validationWindowDays || null,
                dataQuality: values.dataQuality || 'good', //  Data Quality: good | acceptable | poor
                conditionOrder, //  AUTO-SET theo thứ tự thêm

                //  Display labels (for UI table)
                id: editingCondition?.id || Date.now().toString(),
                dataSourceLabel: selectedDataSource?.label || '',
                parameterName: selectedDataSource?.parameterName || '',
                unit: selectedDataSource?.unit || '',
                aggregationFunctionLabel: mockData.aggregationFunctions.find(af => af.value === values.aggregationFunction)?.label || '',
                thresholdOperatorLabel: mockData.thresholdOperators.find(to => to.value === values.thresholdOperator)?.label || '',
                dataQualityLabel: values.dataQuality === 'good' ? 'Tốt' : values.dataQuality === 'acceptable' ? 'Chấp nhận được' : 'Kém',

                //  Cost calculation fields (for payload)
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

            setSelectedThresholdOperator(null); //  Clear selected operator
            conditionFormRef.current?.resetFields();
        });
    };

    // Handle edit condition
    const handleEditCondition = (condition) => {
        setEditingCondition(condition);
        setSelectedThresholdOperator(condition.thresholdOperator); //  Set selected operator for conditional rendering
        conditionForm.setFieldsValue(condition);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingCondition(null);
        setSelectedThresholdOperator(null); //  Clear selected operator
        conditionForm.resetFields();
    };

    //  Handle drag end - Reorder conditions and update conditionOrder
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



    //  Note: getTriggerFields removed - now using direct Form rendering with DebouncedTextArea
    // This fixes Vietnamese IME re-render issues for growthStage field

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
                        {record.dataQuality && (
                            <> | Chất lượng: <Tag color={record.dataQuality === 'good' ? 'green' : record.dataQuality === 'acceptable' ? 'orange' : 'red'} style={{ marginLeft: 4 }}>{record.dataQualityLabel}</Tag></>
                        )}
                    </TypographyText>
                </div>
            ),
        },
        {
            title: dict.ui.condition,
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
                            <span>{dict.ui.sectionMonitoringAlerts}</span>
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
                            <span>{dict.ui.sectionTriggerConfig}</span>
                        </Space>
                    }
                    key="trigger-config"
                >
                    <div style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 8 }}>{dict.ui.titleTriggerGrowthStage}</Title>
                        <TypographyText type="secondary">
                            Chọn toán tử logic để kết hợp các điều kiện, mô tả giai đoạn sinh trưởng.
                        </TypographyText>
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
                </Panel>

                {/* Blackout Periods Section */}
                <Panel
                    header={
                        <Space>
                            <AlertOutlined />
                            <span>Giai đoạn Không Kích hoạt</span>
                            <Tag color={configurationData.blackoutPeriods?.periods?.length > 0 ? 'purple' : 'default'}>
                                {configurationData.blackoutPeriods?.periods?.length || 0} giai đoạn
                            </Tag>
                            {(!basicData?.insuranceValidFrom || !basicData?.insuranceValidTo) && (
                                <Tag color="orange">Cần nhập thời gian hiệu lực trước</Tag>
                            )}
                        </Space>
                    }
                    key="blackoutPeriods"
                >
                    {(!basicData?.insuranceValidFrom || !basicData?.insuranceValidTo) ? (
                        <Alert
                            message="Chưa xác định khoảng thời gian bảo hiểm"
                            description="Vui lòng điền 'Bảo hiểm có hiệu lực từ' và 'Bảo hiểm có hiệu lực đến' ở tab 'Thông tin Cơ bản' trước khi thiết lập giai đoạn không kích hoạt."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    ) : (
                        <>
                            <Alert
                                message="Giai đoạn Không Kích hoạt (Blackout Periods)"
                                description="Đây là các giai đoạn trong chu kỳ bảo hiểm mà hệ thống KHÔNG được phép kích hoạt chi trả, dù các điều kiện đều thỏa mãn. Ví dụ: giai đoạn gieo hạt, giai đoạn nảy mầm sớm, hoặc giai đoạn thu hoạch."
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />

                            <Card style={{ marginBottom: 16 }}>
                                <Title level={5}>Thêm Giai đoạn Mới</Title>
                                <Form
                                    form={blackoutPeriodForm}
                                    layout="vertical"
                                    onFinish={(values) => {
                                        const startDate = values.start;
                                        const endDate = values.end;

                                        // Validation 1: Kiểm tra start < end
                                        if (startDate.isAfter(endDate) || startDate.isSame(endDate)) {
                                            message.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!');
                                            return;
                                        }

                                        // Validation 2: Kiểm tra nằm trong valid date range (xử lý trường hợp vượt năm)
                                        const validFrom = basicData?.insuranceValidFrom ? dayjs(basicData.insuranceValidFrom) : null;
                                        const validTo = basicData?.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;

                                        if (validFrom && validTo) {
                                            const validFromMD = validFrom.format('MM-DD');
                                            const validToMD = validTo.format('MM-DD');
                                            const startMD = values.start.format('MM-DD');
                                            const endMD = values.end.format('MM-DD');
                                            const isValidRangeAcrossYear = validFromMD > validToMD; // e.g., "12-01" > "06-01"

                                            let isValid = false;
                                            if (isValidRangeAcrossYear) {
                                                // Valid range crosses year: start >= validFrom OR start <= validTo AND end >= validFrom OR end <= validTo
                                                const startValid = startMD >= validFromMD || startMD <= validToMD;
                                                const endValid = endMD >= validFromMD || endMD <= validToMD;
                                                isValid = startValid && endValid;
                                            } else {
                                                // Normal range within same year
                                                isValid = startMD >= validFromMD && endMD <= validToMD;
                                            }

                                            if (!isValid) {
                                                message.error(`Giai đoạn phải nằm trong khoảng hiệu lực bảo hiểm (${validFrom.format('DD/MM')} - ${validTo.format('DD/MM')})!`);
                                                return;
                                            }
                                        }

                                        // Validation 3: Kiểm tra không trùng lặp (xử lý vượt năm)
                                        const newStart = values.start.format('MM-DD');
                                        const newEnd = values.end.format('MM-DD');
                                        const isNewAcrossYear = newStart > newEnd;

                                        const hasOverlap = configurationData.blackoutPeriods?.periods?.some(period => {
                                            const existingStart = period.start; // MM-DD format
                                            const existingEnd = period.end;
                                            const isExistingAcrossYear = existingStart > existingEnd;

                                            // Helper: Check if a date falls within a range
                                            const isDateInRange = (date, rangeStart, rangeEnd, rangeAcrossYear) => {
                                                if (rangeAcrossYear) {
                                                    return date >= rangeStart || date <= rangeEnd;
                                                } else {
                                                    return date >= rangeStart && date <= rangeEnd;
                                                }
                                            };

                                            // Check if ranges overlap
                                            const newStartInExisting = isDateInRange(newStart, existingStart, existingEnd, isExistingAcrossYear);
                                            const newEndInExisting = isDateInRange(newEnd, existingStart, existingEnd, isExistingAcrossYear);
                                            const existingStartInNew = isDateInRange(existingStart, newStart, newEnd, isNewAcrossYear);
                                            const existingEndInNew = isDateInRange(existingEnd, newStart, newEnd, isNewAcrossYear);

                                            return newStartInExisting || newEndInExisting || existingStartInNew || existingEndInNew;
                                        });

                                        if (hasOverlap) {
                                            message.error('Giai đoạn này trùng lặp với giai đoạn đã có. Vui lòng chọn khoảng thời gian khác!');
                                            return;
                                        }

                                        // Add the blackout period
                                        onAddBlackoutPeriod({
                                            start: newStart,
                                            end: newEnd
                                        });

                                        blackoutPeriodForm.resetFields();
                                        message.success('Đã thêm giai đoạn không kích hoạt thành công!');
                                    }}
                                >
                                    <Row gutter={16}>
                                        <Col span={10}>
                                            <Form.Item
                                                name="start"
                                                label={dict.getFieldLabel('BasePolicyTrigger', 'blackout_periods') || 'Ngày bắt đầu'}
                                                tooltip="Ngày bắt đầu giai đoạn không kích hoạt (chỉ chọn được trong khoảng thời gian bảo hiểm có hiệu lực)"
                                                rules={[
                                                    { required: true, message: 'Vui lòng chọn ngày bắt đầu!' }
                                                ]}
                                            >
                                                <DatePicker
                                                    format="DD/MM/YYYY"
                                                    placeholder="Chọn ngày bắt đầu"
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    disabledDate={(current) => {
                                                        if (!current) return false;
                                                        const validFrom = basicData?.insuranceValidFrom ? dayjs(basicData.insuranceValidFrom) : null;
                                                        const validTo = basicData?.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;

                                                        if (!validFrom || !validTo) return false;

                                                        // Disable dates outside valid range (xử lý vượt năm)
                                                        const currentMD = current.format('MM-DD');
                                                        const validFromMD = validFrom.format('MM-DD');
                                                        const validToMD = validTo.format('MM-DD');
                                                        const isValidRangeAcrossYear = validFromMD > validToMD; // e.g., \"12-01\" > \"06-01\"

                                                        let isOutsideValidRange = false;
                                                        if (isValidRangeAcrossYear) {
                                                            // Range crosses year: current must be >= validFrom OR <= validTo
                                                            isOutsideValidRange = !(currentMD >= validFromMD || currentMD <= validToMD);
                                                        } else {
                                                            // Normal range: current must be >= validFrom AND <= validTo
                                                            isOutsideValidRange = currentMD < validFromMD || currentMD > validToMD;
                                                        }

                                                        if (isOutsideValidRange) {
                                                            return true;
                                                        }

                                                        // Disable dates that overlap with existing blackout periods
                                                        const existingPeriods = configurationData.blackoutPeriods?.periods || [];
                                                        const isInExistingPeriod = existingPeriods.some(period => {
                                                            const periodStart = period.start; // MM-DD format
                                                            const periodEnd = period.end;
                                                            const isExistingAcrossYear = periodStart > periodEnd;

                                                            if (isExistingAcrossYear) {
                                                                return currentMD >= periodStart || currentMD <= periodEnd;
                                                            } else {
                                                                return currentMD >= periodStart && currentMD <= periodEnd;
                                                            }
                                                        });

                                                        return isInExistingPeriod;
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item
                                                name="end"
                                                label={dict.getFieldLabel('BasePolicyTrigger', 'blackout_periods') || 'Ngày kết thúc'}
                                                tooltip="Ngày kết thúc giai đoạn không kích hoạt (phải sau ngày bắt đầu và trong khoảng thời gian bảo hiểm có hiệu lực)"
                                                rules={[
                                                    { required: true, message: 'Vui lòng chọn ngày kết thúc!' }
                                                ]}
                                            >
                                                <DatePicker
                                                    format="DD/MM/YYYY"
                                                    placeholder="Chọn ngày kết thúc"
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    disabledDate={(current) => {
                                                        if (!current) return false;
                                                        const validFrom = basicData?.insuranceValidFrom ? dayjs(basicData.insuranceValidFrom) : null;
                                                        const validTo = basicData?.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;
                                                        const startDate = blackoutPeriodForm.getFieldValue('start');

                                                        if (!validFrom || !validTo) return false;

                                                        // Disable dates outside valid range (xử lý vượt năm)
                                                        const currentMD = current.format('MM-DD');
                                                        const validFromMD = validFrom.format('MM-DD');
                                                        const validToMD = validTo.format('MM-DD');
                                                        const isValidRangeAcrossYear = validFromMD > validToMD; // e.g., \"12-01\" > \"06-01\"

                                                        let isOutsideValidRange = false;
                                                        if (isValidRangeAcrossYear) {
                                                            // Range crosses year: current must be >= validFrom OR <= validTo
                                                            isOutsideValidRange = !(currentMD >= validFromMD || currentMD <= validToMD);
                                                        } else {
                                                            // Normal range: current must be >= validFrom AND <= validTo
                                                            isOutsideValidRange = currentMD < validFromMD || currentMD > validToMD;
                                                        }

                                                        if (isOutsideValidRange) {
                                                            return true;
                                                        }

                                                        // Disable dates before or equal to start date
                                                        if (startDate && (current.isBefore(startDate, 'day') || current.isSame(startDate, 'day'))) {
                                                            return true;
                                                        }

                                                        // Disable dates that overlap with existing blackout periods
                                                        const existingPeriods = configurationData.blackoutPeriods?.periods || [];
                                                        const isInExistingPeriod = existingPeriods.some(period => {
                                                            const periodStart = period.start; // MM-DD format
                                                            const periodEnd = period.end;
                                                            const isExistingAcrossYear = periodStart > periodEnd;

                                                            if (isExistingAcrossYear) {
                                                                return currentMD >= periodStart || currentMD <= periodEnd;
                                                            } else {
                                                                return currentMD >= periodStart && currentMD <= periodEnd;
                                                            }
                                                        });

                                                        return isInExistingPeriod;
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label=" ">
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    icon={<PlusOutlined />}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                >
                                                    Thêm
                                                </Button>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>

                            {/* Blackout Periods Table */}
                            {configurationData.blackoutPeriods?.periods?.length > 0 && (
                                <Table
                                    dataSource={configurationData.blackoutPeriods.periods.map((period, index) => ({
                                        key: index,
                                        index: index + 1,
                                        start: period.start,
                                        end: period.end
                                    }))}
                                    columns={[
                                        {
                                            title: '#',
                                            dataIndex: 'index',
                                            key: 'index',
                                            width: 60,
                                            render: (num) => <Tag color="purple">{num}</Tag>
                                        },
                                        {
                                            title: 'Ngày bắt đầu',
                                            dataIndex: 'start',
                                            key: 'start',
                                            render: (text) => {
                                                if (!text) return <Text type="secondary">-</Text>;
                                                // Convert MM-DD to DD/MM for display
                                                const parts = text.split('-');
                                                if (parts.length < 2) return <Text strong>{text}</Text>;
                                                const [month, day] = parts;
                                                return <Text strong>{day}/{month}</Text>;
                                            }
                                        },
                                        {
                                            title: 'Ngày kết thúc',
                                            dataIndex: 'end',
                                            key: 'end',
                                            render: (text) => {
                                                if (!text) return <Text type="secondary">-</Text>;
                                                // Convert MM-DD to DD/MM for display
                                                const parts = text.split('-');
                                                if (parts.length < 2) return <Text strong>{text}</Text>;
                                                const [month, day] = parts;
                                                return <Text strong>{day}/{month}</Text>;
                                            }
                                        },
                                        {
                                            title: 'Hành động',
                                            key: 'action',
                                            width: 100,
                                            render: (_, record) => (
                                                <Popconfirm
                                                    title="Xóa giai đoạn"
                                                    description="Bạn có chắc chắn muốn xóa giai đoạn này?"
                                                    onConfirm={() => {
                                                        onRemoveBlackoutPeriod(record.key);
                                                        message.success('Đã xóa giai đoạn!');
                                                    }}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                >
                                                    <Button type="text" danger icon={<DeleteOutlined />} />
                                                </Popconfirm>
                                            )
                                        }
                                    ]}
                                    pagination={false}
                                    size="small"
                                />
                            )}
                        </>
                    )}
                </Panel>

                {/* Trigger Conditions */}
                <Panel
                    header={
                        <Space>
                            <ClockCircleOutlined />
                            <span>{dict.ui.sectionTriggerConditions}</span>
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
                            {editingCondition ? dict.ui.editCondition : dict.ui.addNewCondition}
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
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'data_source_id')}
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
                                                    {/*  Show only unused data sources when adding new, or include current when editing */}
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
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'aggregation_function')}
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
                                                        setSelectedThresholdOperator(value);
                                                        //  Clear baseline fields if operator is not change_gt or change_lt
                                                        if (value !== 'change_gt' && value !== 'change_lt') {
                                                            conditionForm.setFieldsValue({
                                                                baselineWindowDays: null,
                                                                baselineFunction: null
                                                            });
                                                        }
                                                    }}
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
                                        <Col span={8}>
                                            <Form.Item
                                                name="consecutiveRequired"
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'consecutive_required')}
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
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'include_component')}
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
                                                label={dict.getFieldLabel('BasePolicyTriggerCondition', 'validation_window_days')}
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
                                        {/*  REMOVED: conditionOrder manual input - Auto-set theo thứ tự thêm của user */}

                                        {/*  CONDITIONAL: Baseline fields CHỈ hiện khi chọn change_gt hoặc change_lt */}
                                        {(() => {
                                            const currentOperator = conditionForm.getFieldValue('thresholdOperator') || selectedThresholdOperator || editingCondition?.thresholdOperator;
                                            return (currentOperator === 'change_gt' || currentOperator === 'change_lt');
                                        })() && (
                                                <>
                                                    <Col span={8}>
                                                        <Form.Item
                                                            name="baselineWindowDays"
                                                            label={dict.getFieldLabel('BasePolicyTriggerCondition', 'baseline_window_days')}
                                                            tooltip="Chu kỳ tham chiếu (Baseline Window): Khoảng thời gian trong quá khứ (tính bằng ngày) được dùng để tạo ra một giá trị 'nền' hoặc 'bình thường'. BẮT BUỘC khi sử dụng toán tử thay đổi (change_gt/change_lt). Ví dụ: 365 ngày để tính giá trị trung bình hàng năm làm mốc so sánh."
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
                                                            tooltip="Hàm tính tham chiếu (Baseline Function): Phương pháp tính toán giá trị 'nền' từ dữ liệu lịch sử. BẮT BUỘC khi sử dụng toán tử thay đổi (change_gt/change_lt). Ví dụ: AVG để tính giá trị trung bình trong chu kỳ tham chiếu làm mốc so sánh với giá trị hiện tại."
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

                    {/* Logic Explainer - Diễn giải logic trigger thành câu văn dễ hiểu */}
                    <div style={{ marginTop: 16 }}>
                        <TriggerLogicExplainer
                            configurationData={configurationData}
                            mockData={mockData}
                        />
                    </div>
                </Panel>
            </Collapse>
        </div>
    );
};

const ConfigurationTab = memo(ConfigurationTabComponent);
ConfigurationTab.displayName = 'ConfigurationTab';

export default ConfigurationTab;