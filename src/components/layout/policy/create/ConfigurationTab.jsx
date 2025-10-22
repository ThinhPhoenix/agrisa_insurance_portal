import CustomForm from '@/components/custom-form';
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
    Col,
    Collapse,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Row,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    const [notifications, setNotifications] = useState(Array.isArray(configurationData.importantNotifications) ? configurationData.importantNotifications : []);

    // Update notifications when configurationData changes
    useEffect(() => {
        setNotifications(Array.isArray(configurationData.importantNotifications) ? configurationData.importantNotifications : []);
    }, [configurationData.importantNotifications]);

    const availableDataSources = getAvailableDataSourcesForTrigger();

    // Handle form values change
    const handleValuesChange = (changedValues, allValues) => {
        const currentNotifications = Array.isArray(notifications) ? notifications : [];
        onDataChange({
            ...allValues,
            importantNotifications: currentNotifications
        });
    };

    // Handle add notification
    const handleAddNotification = () => {
        const currentNotifications = Array.isArray(notifications) ? notifications : [];
        const newNotification = {
            id: Date.now().toString(),
            title: '',
            description: ''
        };
        const updatedNotifications = [...currentNotifications, newNotification];
        setNotifications(updatedNotifications);
        onDataChange({
            ...configurationData,
            importantNotifications: updatedNotifications
        });
    };

    // Handle remove notification
    const handleRemoveNotification = (id) => {
        const currentNotifications = Array.isArray(notifications) ? notifications : [];
        const updatedNotifications = currentNotifications.filter(notification => notification.id !== id);
        setNotifications(updatedNotifications);
        onDataChange({
            ...configurationData,
            importantNotifications: updatedNotifications
        });
    };

    // Handle update notification
    const handleUpdateNotification = (id, field, value) => {
        const currentNotifications = Array.isArray(notifications) ? notifications : [];
        const updatedNotifications = currentNotifications.map(notification =>
            notification.id === id
                ? { ...notification, [field]: value }
                : notification
        );
        setNotifications(updatedNotifications);
        onDataChange({
            ...configurationData,
            importantNotifications: updatedNotifications
        });
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

    // Generate payout configuration fields
    const getPayoutConfigFields = () => [
        {
            name: 'fixedPayoutAmount',
            label: 'Chi cố định (VND)',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 0,
            step: 100000,
            size: 'middle',
            formatter: value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫',
            parser: value => value.replace(/\s?₫|(,*)/g, ''),
            rules: [
                { required: true, message: 'Vui lòng nhập số tiền chi trả cố định' },
                { type: 'number', min: 0, message: 'Số tiền phải lớn hơn 0' }
            ]
        },
        {
            name: 'payoutMaxAmount',
            label: 'Chi trả tối đa (VND)',
            type: 'number',
            required: true,
            gridColumn: '2',
            min: 0,
            step: 100000,
            size: 'middle',
            formatter: value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫',
            parser: value => value.replace(/\s?₫|(,*)/g, ''),
            rules: [
                { required: true, message: 'Vui lòng nhập số tiền tối đa' },
                { type: 'number', min: 0, message: 'Số tiền phải lớn hơn hoặc bằng 0' }
            ]
        },
        {
            name: 'exceedingThresholdRate',
            label: 'Chi vượt ngưỡng (%)',
            type: 'number',
            required: true,
            gridColumn: '3',
            min: 0.01,
            max: 1,
            step: 0.01,
            size: 'middle',
            tooltip: 'Tỉ lệ chi trả được tính theo công thức bên phía bảo hiểm',
            rules: [
                { required: true, message: 'Vui lòng nhập tỉ lệ' },
                { type: 'number', min: 0.01, max: 1, message: 'Tỉ lệ từ 0.01 đến 1' }
            ]
        },
        {
            name: 'basicPayoutRate',
            label: 'Chi trả cơ bản',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 0.01,
            max: 1,
            step: 0.01,
            size: 'middle',
            tooltip: 'Tỉ lệ chi trả được tính theo công thức của bên bảo hiểm',
            rules: [
                { required: true, message: 'Vui lòng nhập tỉ lệ' },
                { type: 'number', min: 0.01, max: 1, message: 'Tỉ lệ từ 0.01 đến 1' }
            ]
        },
        {
            name: 'payoutDelayDays',
            label: 'Chờ thanh toán (ngày)',
            type: 'number',
            gridColumn: '2',
            min: 0,
            max: 30,
            placeholder: '3',
            size: 'middle',
            tooltip: 'Số ngày chờ đợi trước khi thanh toán'
        },
        {
            name: 'basedOnHectare',
            label: 'Lấy theo diện tích',
            type: 'switch',
            gridColumn: '3',
            checkedChildren: 'Có',
            unCheckedChildren: 'Không'
        }
    ];    // Generate insurance cost fields
    const getInsuranceCostFields = () => [
        {
            name: 'insuranceFixedPayoutAmount',
            label: 'Số tiền chi trả cố định (VND)',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 0,
            step: 100000,
            size: 'large',
            formatter: value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫',
            parser: value => value.replace(/\s?₫|(,*)/g, ''),
            rules: [
                { required: true, message: 'Vui lòng nhập số tiền chi trả cố định' },
                { type: 'number', min: 0, message: 'Số tiền phải lớn hơn hoặc bằng 0' }
            ]
        },
        {
            name: 'insuranceBasicPayoutRate',
            label: 'Tỉ lệ chi trả cơ bản',
            type: 'number',
            required: true,
            gridColumn: '2',
            min: 0.01,
            max: 1,
            step: 0.01,
            size: 'large',
            tooltip: 'Tỉ lệ chi trả được tính theo công thức của bên bảo hiểm',
            rules: [
                { required: true, message: 'Vui lòng nhập tỉ lệ' },
                { type: 'number', min: 0.01, max: 1, message: 'Tỉ lệ từ 0.01 đến 1' }
            ]
        },
        {
            name: 'maxRenewalTime',
            label: 'Thời gian gia hạn tối đa (ngày)',
            type: 'number',
            gridColumn: '2',
            min: 1,
            step: 1,
            placeholder: '12',
            size: 'large',
            tooltip: 'Thời gian tối đa có thể gia hạn hợp đồng bảo hiểm',
            rules: [
                { required: true, message: 'Vui lòng nhập thời gian gia hạn tối đa' },
                { type: 'number', min: 1, message: 'Tối thiểu 1 ngày' }
            ]
        }
    ];

    // Generate monitoring fields
    const getMonitoringFields = () => [
        {
            name: 'monitoringFrequencyValue',
            label: 'Số lần giám sát',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 1,
            placeholder: '1',
            size: 'large',
            rules: [
                { required: true, message: 'Vui lòng nhập số lần giám sát' },
                { type: 'number', min: 1, message: 'Tối thiểu 1 lần' }
            ]
        },
        {
            name: 'monitoringFrequencyUnit',
            label: 'Đơn vị thời gian',
            type: 'select',
            required: true,
            gridColumn: '2',
            placeholder: 'Chọn đơn vị',
            size: 'large',
            optionLabelProp: 'label',
            dropdownStyle: { maxWidth: '300px' },
            options: [
                { value: 'hours', label: 'giờ', description: 'Giám sát theo giờ' },
                { value: 'days', label: 'ngày', description: 'Giám sát theo ngày' },
                { value: 'weeks', label: 'tuần', description: 'Giám sát theo tuần' },
                { value: 'months', label: 'tháng', description: 'Giám sát theo tháng' },
                { value: 'years', label: 'năm', description: 'Giám sát theo năm' }
            ],
            renderOption: (option) => renderOptionWithTooltip(option, null)
        },
        {
            name: 'alertTypes',
            label: 'Loại cảnh báo',
            type: 'checkbox-group',
            required: true,
            gridColumn: '1 / -1',
            direction: 'horizontal',
            options: mockData.alertTypes?.map(type => ({
                value: type.value,
                label: type.label
            })),
            rules: [{ required: true, message: 'Vui lòng chọn ít nhất một loại cảnh báo' }]
        }
    ];

    // Generate registration time fields
    const getRegistrationTimeFields = () => [
        {
            name: 'insuranceEffectiveStartDate',
            label: 'Thời gian hiệu lực bảo hiểm (bắt đầu quan sát)',
            type: 'datepicker',
            required: true,
            gridColumn: '1',
            placeholder: 'Chọn ngày bắt đầu',
            size: 'large',
            rules: [
                { required: true, message: 'Vui lòng chọn ngày bắt đầu' }
            ]
        },
        {
            name: 'insuranceEffectiveEndDate',
            label: 'Thời gian kết thúc hiệu lực bảo hiểm (kết thúc quan sát)',
            type: 'datepicker',
            required: true,
            gridColumn: '2',
            placeholder: 'Chọn ngày kết thúc',
            size: 'large',
            rules: [
                { required: true, message: 'Vui lòng chọn ngày kết thúc' }
            ]
        }
    ];

    // Generate lifecycle fields
    const getLifecycleFields = () => [
        {
            name: 'autoRenew',
            label: 'Tự động làm mới (gia hạn) hợp đồng',
            type: 'switch',
            gridColumn: '1',
            checkedChildren: 'Có',
            unCheckedChildren: 'Không',
            tooltip: 'Tự động gia hạn hợp đồng khi đến hạn'
        },
        {
            name: 'renewalDiscount',
            label: 'Gia hạn nhiều thì có giảm giá (%)',
            type: 'number',
            gridColumn: '2',
            min: 0,
            max: 100,
            step: 0.1,
            placeholder: '0.0',
            size: 'large',
            tooltip: 'Phần trăm giảm giá khi gia hạn nhiều lần',
            formatter: value => `${value}%`,
            parser: value => value.replace('%', ''),
            rules: [
                { type: 'number', min: 0, max: 100, message: 'Giảm giá từ 0% đến 100%' }
            ]
        },
        {
            name: 'originalInsuranceYears',
            label: 'Năm',
            type: 'number',
            gridColumn: '1',
            min: 0,
            step: 1,
            placeholder: '0',
            size: 'large',
            tooltip: 'Số năm tồn tại của bảo hiểm gốc',
            rules: [
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        const months = getFieldValue('originalInsuranceMonths') || 0;
                        const days = getFieldValue('originalInsuranceDays') || 0;
                        if ((value || 0) === 0 && months === 0 && days === 0) {
                            return Promise.reject(new Error('Vui lòng nhập ít nhất năm, tháng hoặc ngày'));
                        }
                        return Promise.resolve();
                    }
                })
            ]
        },
        {
            name: 'originalInsuranceMonths',
            label: 'Tháng',
            type: 'number',
            gridColumn: '2',
            min: 0,
            max: 11,
            step: 1,
            placeholder: '0',
            size: 'large',
            tooltip: 'Số tháng tồn tại của bảo hiểm gốc (0-11)',
            rules: [
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        const years = getFieldValue('originalInsuranceYears') || 0;
                        const days = getFieldValue('originalInsuranceDays') || 0;
                        if (years === 0 && (value || 0) === 0 && days === 0) {
                            return Promise.reject(new Error('Vui lòng nhập ít nhất năm, tháng hoặc ngày'));
                        }
                        return Promise.resolve();
                    }
                })
            ]
        },
        {
            name: 'originalInsuranceDays',
            label: 'Ngày',
            type: 'number',
            gridColumn: '3',
            min: 0,
            max: 30,
            step: 1,
            placeholder: '0',
            size: 'large',
            tooltip: 'Số ngày tồn tại của bảo hiểm gốc (0-30)',
            rules: [
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        const years = getFieldValue('originalInsuranceYears') || 0;
                        const months = getFieldValue('originalInsuranceMonths') || 0;
                        if (years === 0 && months === 0 && (value || 0) === 0) {
                            return Promise.reject(new Error('Vui lòng nhập ít nhất năm, tháng hoặc ngày'));
                        }
                        return Promise.resolve();
                    }
                })
            ]
        }
    ];

    // Generate additional settings fields  
    const getAdditionalSettingsFields = () => [
        {
            name: 'policyDescription',
            label: 'Mô tả Policy',
            type: 'textarea',
            rows: 4,
            placeholder: 'Mô tả chi tiết về policy bảo hiểm này...',
            showCount: true,
            maxLength: 500,
            rules: [{ max: 500, message: 'Tối đa 500 ký tự' }]
        },
        {
            name: 'enableGracePeriod',
            label: 'Thời gian ân hạn',
            type: 'switch',
            gridColumn: '1',
            checkedChildren: 'Có',
            unCheckedChildren: 'Không',
            tooltip: 'Thời gian ân hạn trước khi policy có hiệu lực'
        },
        {
            name: 'gracePeriodDays',
            label: 'Thời gian ân hạn (ngày)',
            type: 'number',
            gridColumn: '2',
            min: 1,
            max: 30,
            placeholder: '7',
            size: 'large',
            dependencies: ['enableGracePeriod'],
            disabled: !formRef.current?.getFieldsValue()?.enableGracePeriod
        },
        {
            name: 'enableAutoRenewal',
            label: 'Tự động gia hạn',
            type: 'switch',
            gridColumn: '3',
            checkedChildren: 'Có',
            unCheckedChildren: 'Không'
        },
        {
            name: 'enableStorage',
            label: 'Lưu trữ',
            type: 'switch',
            gridColumn: '4',
            checkedChildren: 'Có',
            unCheckedChildren: 'Không',
            tooltip: 'Cho phép lưu trữ dữ liệu policy'
        }
    ];

    // Memoized Notifications Manager Component
    const NotificationsManager = useMemo(() => (
        <div className="notifications-manager">
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddNotification}
                    size="large"
                >
                    Thêm Thông báo
                </Button>
            </div>

            {(!Array.isArray(notifications) || notifications.length === 0) ? (
                <Alert
                    message="Chưa có thông báo nào"
                    description="Nhấp vào nút 'Thêm Thông báo' để thêm thông báo quan trọng"
                    type="info"
                    showIcon
                />
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification, index) => (
                        <Card
                            key={notification.id}
                            size="small"
                            className="notification-item"
                            style={{ marginBottom: 16 }}
                            extra={
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleRemoveNotification(notification.id)}
                                    size="small"
                                />
                            }
                        >
                            <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ color: '#1890ff' }}>
                                    #{index + 1}
                                </Text>
                            </div>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        label="Tiêu đề"
                                        required
                                        style={{ marginBottom: 8 }}
                                    >
                                        <Input
                                            placeholder="Ví dụ: Quy định ruộng"
                                            value={notification.title}
                                            onChange={(e) => handleUpdateNotification(notification.id, 'title', e.target.value)}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item
                                        label="Mô tả chi tiết"
                                        required
                                        style={{ marginBottom: 8 }}
                                    >
                                        <Input.TextArea
                                            placeholder="Ví dụ: Không được tự ý phá ruộng chủ quan để đòi bồi thường"
                                            value={notification.description}
                                            onChange={(e) => handleUpdateNotification(notification.id, 'description', e.target.value)}
                                            rows={2}
                                            showCount
                                            maxLength={300}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    ), [notifications, handleAddNotification, handleRemoveNotification, handleUpdateNotification]);

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
                name: 'alertThreshold',
                label: 'Ngưỡng cảnh báo sớm (%)',
                type: 'number',
                gridColumn: '3',
                min: 50,
                max: 95,
                placeholder: '80',
                size: 'large',
                tooltip: 'Cảnh báo khi gần đạt điều kiện kích hoạt cho nguồn dữ liệu này',
                formatter: value => `${value}%`,
                parser: value => value.replace('%', ''),
                rules: [
                    { type: 'number', min: 50, max: 95, message: 'Từ 50% đến 95%' }
                ]
            }
        ];

        // Add baseline window field if aggregation function is 'change'
        if (isChangeAggregation === 'change') {
            fields.push({
                name: 'baselineWindowDays',
                label: 'Cửa sổ Baseline (Ngày)',
                type: 'number',
                required: true,
                gridColumn: '1',
                placeholder: '365',
                min: 1,
                size: 'large',
                rules: [
                    { required: true, message: 'Nhập cửa sổ baseline' },
                    { type: 'number', min: 1, message: 'Tối thiểu 1 ngày' }
                ]
            });
        }

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
            <Collapse defaultActiveKey={['payout']} size="large">
                {/* Payout Configuration */}
                <Panel
                    header={
                        <Space>
                            <DollarOutlined />
                            <span>Cấu hình Thanh toán chi trả</span>
                        </Space>
                    }
                    key="payout"
                >
                    <CustomForm
                        ref={formRef}
                        fields={getPayoutConfigFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="1fr 1fr 1fr"
                        gap="10px"
                    />
                </Panel>

                {/* Insurance Cost Configuration */}
                <Panel
                    header={
                        <Space>
                            <DollarOutlined />
                            <span>Cấu hình chi phí bảo hiểm</span>
                        </Space>
                    }
                    key="insurance-cost"
                >
                    <CustomForm
                        ref={formRef}
                        fields={getInsuranceCostFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="repeat(2, 1fr)"
                        gap="16px"
                    />
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
                    <CustomForm
                        ref={formRef}
                        fields={getMonitoringFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="repeat(2, 1fr)"
                        gap="24px"
                    />
                </Panel>

                {/* Lifecycle Configuration */}
                <Panel
                    header={
                        <Space>
                            <SettingOutlined />
                            <span>Cấu hình lifecycle (Chu kỳ sống của policy)</span>
                        </Space>
                    }
                    key="lifecycle"
                >
                    <div style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 8 }}>Thời gian sống/tồn tại của bảo hiểm gốc</Title>
                        <TypographyText type="secondary">
                            Nhập khoảng thời gian tồn tại của hợp đồng bảo hiểm gốc (ví dụ: 1 năm 2 tháng 13 ngày)
                        </TypographyText>
                    </div>
                    <CustomForm
                        ref={formRef}
                        fields={getLifecycleFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="repeat(3, 1fr)"
                        gap="24px"
                    />
                </Panel>

                {/* Registration Time Configuration */}
                <Panel
                    header={
                        <Space>
                            <ClockCircleOutlined />
                            <span>Cấu hình thời hạn bảo hiểm</span>
                        </Space>
                    }
                    key="registration-time"
                >
                    <CustomForm
                        ref={formRef}
                        fields={getRegistrationTimeFields()}
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
                    <CustomForm
                        ref={formRef}
                        fields={getAdditionalSettingsFields()}
                        initialValues={configurationData}
                        onValuesChange={onDataChange}
                        gridColumns="repeat(4, 1fr)"
                        gap="88px"
                    />

                    {/* Notifications Manager */}
                    <div style={{ marginTop: 24 }}>
                        <Title level={5} style={{ marginBottom: 16 }}>Thông tin quan trọng cần thông báo</Title>
                        {NotificationsManager}
                    </div>
                </Panel>
            </Collapse>
        </div>
    );
};

export default ConfigurationTab;