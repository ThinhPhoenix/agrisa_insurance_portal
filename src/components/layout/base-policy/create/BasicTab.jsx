import { getBasePolicyError, getBasePolicyValidation } from '@/libs/message';
import { useAuthStore } from '@/stores/auth-store';
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Popconfirm,
    Row,
    Select,
    Switch,
    Table,
    Tooltip,
    Typography
} from 'antd';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

const { Option } = Select;
const { Title, Text } = Typography;

// ✅ OPTIMIZATION: Memoize BasicTab to prevent unnecessary re-renders
const BasicTabComponent = ({
    basicData,
    mockData,
    onDataChange,
    onAddDataSource,
    onRemoveDataSource,
    estimatedCosts,
    categories = [],
    categoriesLoading = false,
    tiers = [],
    tiersLoading = false,
    dataSources = [],
    dataSourcesLoading = false,
    fetchTiersByCategory,
    fetchDataSourcesByTier
}) => {
    const [form] = Form.useForm();
    const [dataSourceForm] = Form.useForm();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTier, setSelectedTier] = useState('');
    const { user } = useAuthStore();

    useEffect(() => {
        // Auto-fill default values and insurance provider ID
        const updates = {};

        if (!basicData.product_description) {
            updates.product_description = "Bảo hiểm tham số theo chỉ số lượng mưa cho cây lúa mùa khô. Chi trả tự động khi lượng mưa tích lũy thấp hơn ngưỡng 50mm trong 30 ngày liên tục, không cần kiểm tra thiệt hại tại hiện trường.";
        }

        // Auto-fill insurance provider ID from logged-in user's partner_id (if available)
        if (!basicData.insuranceProviderId && user?.partner_id) {
            // Only use partner_id for creating base policy
            updates.insuranceProviderId = user.partner_id;
            console.log("🔍 BasicTab - Set insuranceProviderId from user partner_id:", {
                partner_id: user.partner_id,
                full_user: user
            });
        }

        // Default status to 'draft'
        if (!basicData.status) {
            updates.status = 'draft';
        }

        // Always set premium and payout per hectare to true
        if (basicData.isPerHectare !== true) {
            updates.isPerHectare = true;
        }

        if (basicData.isPayoutPerHectare !== true) {
            updates.isPayoutPerHectare = true;
        }

        if (Object.keys(updates).length > 0) {
            onDataChange({
                ...basicData,
                ...updates
            });
        }
    }, [basicData, onDataChange, user]);

    // ✅ OPTIMIZATION: Debounce form changes to prevent input lag with Vietnamese typing
    const timeoutRef = useRef(null);
    const handleValuesChange = useCallback((changedValues, allValues) => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the onChange call to prevent re-render during typing
        // This fixes Vietnamese input composition issues
        timeoutRef.current = setTimeout(() => {
            onDataChange(allValues);
        }, 300); // 300ms debounce
    }, [onDataChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Handle category change
    const handleCategoryChange = useCallback((categoryName) => {
        setSelectedCategory(categoryName);
        setSelectedTier('');
        dataSourceForm.setFieldsValue({ tier: undefined, dataSource: undefined });

        // Find the selected category to get its ID
        const selectedCategoryObj = categories.find(cat => cat.category_name === categoryName);
        if (selectedCategoryObj && fetchTiersByCategory) {
            fetchTiersByCategory(selectedCategoryObj.id);
        }
    }, [categories, dataSourceForm, fetchTiersByCategory]);

    // Helper: validate decimal precision and scale according to schema limits
    const validateDecimal = (value, max, maxDecimals) => {
        if (value === null || value === undefined || value === '') return true;
        const abs = Math.abs(Number(value));
        if (Number.isNaN(abs)) return false;
        if (abs > max) return false;
        const parts = String(value).split('.');
        const decimals = parts[1] ? parts[1].length : 0;
        if (decimals > maxDecimals) return false;
        return true;
    };

    // Handle tier change
    const handleTierChange = useCallback((tier) => {
        setSelectedTier(tier);
        dataSourceForm.setFieldsValue({ dataSource: undefined });

        // Find the selected tier data to get its ID
        const selectedTierData = tiers.find(t => t.value === tier);
        if (selectedTierData && fetchDataSourcesByTier) {
            fetchDataSourcesByTier(selectedTierData.id);
        }
    }, [tiers, dataSourceForm, fetchDataSourcesByTier]);

    // Handle add data source
    const handleAddDataSource = useCallback(() => {
        dataSourceForm.validateFields().then(values => {
            const selectedSource = dataSources.find(source => source.id === values.dataSource);
            if (selectedSource) {
                // Check if already added
                const exists = basicData.selectedDataSources.find(
                    source => source.id === selectedSource.id
                );

                if (exists) {
                    message.warning('Nguồn dữ liệu này đã được thêm');
                    return;
                }

                // Find category and tier to get multipliers
                const selectedCategoryObj = categories.find(cat => cat.category_name === selectedCategory);
                const selectedTierObj = tiers.find(t => t.value === selectedTier);

                const dataSourceToAdd = {
                    ...selectedSource,
                    category: selectedCategory,
                    tier: selectedTier,
                    categoryLabel: selectedCategory, // Since selectedCategory is already the name
                    tierLabel: selectedTierObj?.label || selectedTier,
                    // Add multipliers for condition calculation
                    categoryMultiplier: selectedCategoryObj?.category_cost_multiplier || 1,
                    tierMultiplier: selectedTierObj?.data_tier_multiplier || 1
                };

                onAddDataSource(dataSourceToAdd);
                dataSourceForm.resetFields();
                setSelectedCategory('');
                setSelectedTier('');
            }
        });
    }, [dataSourceForm, dataSources, onAddDataSource, selectedCategory, selectedTier, basicData.selectedDataSources, categories, tiers]);

    // Data source table columns
    const dataSourceColumns = [
        {
            title: 'Tên nguồn dữ liệu',
            dataIndex: 'label',
            key: 'label',
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
            title: 'Danh mục',
            dataIndex: 'categoryLabel',
            key: 'categoryLabel',
        },
        {
            title: 'Gói',
            dataIndex: 'tierLabel',
            key: 'tierLabel',
        },
        {
            title: 'Chi phí cơ sở',
            dataIndex: 'baseCost',
            key: 'baseCost',
            render: (cost) => `${cost.toLocaleString()} ₫/tháng`,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa nguồn dữ liệu"
                    description="Bạn có chắc chắn muốn xóa nguồn dữ liệu này?"
                    onConfirm={() => onRemoveDataSource(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    // Get filtered tiers based on category
    // Note: Tiers are now fetched from API when category changes

    return (
        <div className="basic-tab">
            <Title level={4}>Thông tin Cơ bản</Title>

            <Form
                form={form}
                layout="vertical"
                initialValues={basicData}
                onValuesChange={handleValuesChange}
                className="basic-form"
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="productName"
                            label="Tên Sản phẩm"
                            tooltip="Tên hiển thị (VD: Bảo hiểm lúa mùa đông 2025)"
                            rules={[
                                { required: true, message: getBasePolicyError('PRODUCT_NAME_REQUIRED') },
                                { min: 3, message: getBasePolicyValidation('PRODUCT_NAME_MIN_LENGTH') }
                            ]}
                        >
                            <Input
                                placeholder="Nhập tên sản phẩm bảo hiểm"
                                size="large"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="productCode"
                            label="Mã Sản phẩm"
                            tooltip="Mã duy nhất (chữ, số, _ - tự động viết hoa)"
                            rules={[
                                { required: true, message: getBasePolicyError('PRODUCT_CODE_REQUIRED') },
                                {
                                    pattern: /^[A-Za-z0-9_]+$/,
                                    message: 'Mã sản phẩm chỉ được chứa chữ cái, số và dấu gạch dưới (_)!'
                                }
                            ]}
                            normalize={(value) => value ? value.toUpperCase() : value}
                        >
                            <Input
                                placeholder="Ví dụ: rice_winter_2025"
                                size="large"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="productDescription"
                            label="Mô tả sản phẩm"
                            tooltip="Mô tả ngắn gọn về sản phẩm (không bắt buộc)"
                        >
                            <Input.TextArea
                                placeholder="Nhập mô tả sản phẩm"
                                rows={4}
                                size="large"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="cropType"
                            label="Loại Cây trồng"
                            tooltip="Chọn loại cây trồng được bảo hiểm"
                            rules={[
                                { required: true, message: 'Vui lòng chọn loại cây trồng!' }
                            ]}
                        >
                            <Select
                                placeholder="Chọn loại cây trồng"
                                size="large"
                                optionLabelProp="label"
                            >
                                {mockData.cropTypes.map(crop => (
                                    <Option key={crop.value} value={crop.value} label={crop.label}>
                                        <div>
                                            <Text>{crop.label}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                {crop.description}
                                            </Text>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="coverageDurationDays"
                            label="Thời hạn bảo hiểm (ngày)"
                            tooltip="Số ngày hợp đồng có hiệu lực (VD: 120 ngày)"
                            rules={[
                                { required: true, message: getBasePolicyError('COVERAGE_DURATION_INVALID') },
                                { type: 'number', min: 1, message: getBasePolicyValidation('COVERAGE_DURATION_MIN') }
                            ]}
                        >
                            <InputNumber
                                placeholder="120"
                                min={1}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            name="premiumBaseRate"
                            label="Tỷ lệ phí cơ bản"
                            tooltip="Hệ số tính phí (phải > 0 nếu không dùng phí cố định)"
                            rules={[
                                { required: true, message: getBasePolicyError('PREMIUM_BASE_RATE_REQUIRED') },
                                { type: 'number', min: 0, message: getBasePolicyError('PREMIUM_BASE_RATE_NEGATIVE') },
                                {
                                    validator: (_, value) => {
                                        if (value === null || value === undefined || value === '') return Promise.resolve();
                                        const ok = validateDecimal(value, 999999.9, 1);
                                        return ok ? Promise.resolve() : Promise.reject(getBasePolicyError('PREMIUM_BASE_RATE_INVALID'));
                                    }
                                }
                            ]}
                        >
                            <InputNumber
                                placeholder="1.0"
                                min={0}
                                step={0.1}
                                max={999999.9}
                                precision={1}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="fixPremiumAmount"
                            label="Phí bảo hiểm cố định"
                            tooltip="Số tiền phí cố định cho hợp đồng (không tính toán)"
                            rules={[
                                { required: true, message: getBasePolicyError('FIX_PREMIUM_AMOUNT_REQUIRED') },
                                { type: 'number', min: 0, message: getBasePolicyError('FIX_PREMIUM_AMOUNT_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="1,000,000"
                                min={0}
                                step={1000}
                                size="large"
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="maxPremiumPaymentProlong"
                            label="Gia hạn thanh toán (ngày)"
                            tooltip="Số ngày tối đa cho phép trả chậm phí"
                            rules={[
                                { type: 'number', min: 0, message: 'Phải >= 0' }
                            ]}
                        >
                            <InputNumber
                                placeholder="7"
                                min={0}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item
                            name="cancelPremiumRate"
                            label="Tỷ lệ phí khi hủy hợp đồng"
                            tooltip="Tỷ lệ hoàn phí khi hủy sớm (0-1, VD: 0.8 = hoàn 80%)"
                            rules={[
                                { type: 'number', min: 0, max: 1, message: getBasePolicyError('CANCEL_PREMIUM_RATE_INVALID') }
                            ]}
                        >
                            <InputNumber
                                placeholder="0.8"
                                min={0}
                                max={1}
                                step={0.01}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Cấu hình Chi trả (Payout)</Divider>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="payoutBaseRate"
                            label="Tỷ lệ chi trả cơ bản"
                            tooltip="Hệ số tính chi trả (phải > 0, VD: 0.75 = 75%)"
                            rules={[
                                { required: true, message: getBasePolicyError('PAYOUT_BASE_RATE_REQUIRED') },
                                { type: 'number', min: 0, message: getBasePolicyError('PAYOUT_BASE_RATE_NEGATIVE') },
                                {
                                    validator: (_, value) => {
                                        if (value === null || value === undefined || value === '') return Promise.resolve();
                                        const ok = validateDecimal(value, 999999.9, 1);
                                        return ok ? Promise.resolve() : Promise.reject(getBasePolicyError('PAYOUT_BASE_RATE_INVALID'));
                                    }
                                }
                            ]}
                        >
                            <InputNumber
                                placeholder="0.75"
                                min={0}
                                step={0.1}
                                max={999999.9}
                                precision={1}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="fixPayoutAmount"
                            label="Số tiền chi trả cố định"
                            tooltip="Số tiền chi trả cố định khi xảy ra sự cố"
                            rules={[
                                { required: true, message: getBasePolicyError('FIX_PAYOUT_AMOUNT_REQUIRED') },
                                { type: 'number', min: 0, message: getBasePolicyError('FIX_PAYOUT_AMOUNT_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="5,000,000"
                                min={0}
                                step={1000}
                                size="large"
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="payoutCap"
                            label="Trần chi trả"
                            tooltip="Số tiền chi trả tối đa cho một hợp đồng"
                            rules={[
                                { type: 'number', min: 0, message: getBasePolicyError('PAYOUT_CAP_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="10,000,000"
                                min={0}
                                step={1000}
                                size="large"
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="overThresholdMultiplier"
                            label="Hệ số vượt ngưỡng"
                            tooltip="Hệ số nhân khi vượt ngưỡng (phải > 0, mặc định: 1.0)"
                            rules={[
                                { type: 'number', min: 0, message: getBasePolicyError('OVER_THRESHOLD_MULTIPLIER_NEGATIVE') },
                                {
                                    validator: (_, value) => {
                                        if (value === null || value === undefined || value === '') return Promise.resolve();
                                        const ok = validateDecimal(value, 999999.9, 1);
                                        return ok ? Promise.resolve() : Promise.reject(getBasePolicyError('OVER_THRESHOLD_MULTIPLIER_INVALID'));
                                    }
                                }
                            ]}
                        >
                            <InputNumber
                                placeholder="1.0"
                                min={0}
                                step={0.1}
                                max={999999.9}
                                precision={1}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Thời gian đăng ký & Hiệu lực</Divider>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="enrollmentStartDay"
                            label="Ngày bắt đầu đăng ký"
                            tooltip="Ngày mở đăng ký (trước ngày hiệu lực)"
                        >
                            <DatePicker
                                placeholder="Chọn ngày bắt đầu đăng ký"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    return current && current.isBefore(new Date(), 'day');
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="enrollmentEndDay"
                            label="Ngày kết thúc đăng ký"
                            tooltip="Ngày đóng đăng ký (trước/bằng ngày hiệu lực)"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const startDay = getFieldValue('enrollmentStartDay');
                                        if (!startDay) {
                                            return Promise.reject(new Error('Vui lòng chọn ngày bắt đầu đăng ký trước'));
                                        }

                                        if (startDay && !value.isAfter(startDay)) {
                                            return Promise.reject(new Error(getBasePolicyError('ENROLLMENT_START_AFTER_END')));
                                        }

                                        const validFrom = getFieldValue('insuranceValidFrom');
                                        if (validFrom && value.isAfter(validFrom)) {
                                            return Promise.reject(new Error(getBasePolicyError('ENROLLMENT_END_AFTER_VALID_FROM')));
                                        }

                                        return Promise.resolve();
                                    }
                                })
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày kết thúc đăng ký"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                disabled={!form.getFieldValue('enrollmentStartDay')}
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    if (current && current.isBefore(new Date(), 'day')) {
                                        return true;
                                    }

                                    const startDay = form.getFieldValue('enrollmentStartDay');
                                    const validFrom = form.getFieldValue('insuranceValidFrom');

                                    // Disable dates before or equal to start day
                                    if (startDay && current && (current.isBefore(startDay, 'day') || current.isSame(startDay, 'day'))) {
                                        return true;
                                    }

                                    // Disable dates after insurance valid from
                                    if (validFrom && current && current.isAfter(validFrom, 'day')) {
                                        return true;
                                    }

                                    return false;
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="insuranceValidFrom"
                            label="Bảo hiểm có hiệu lực từ"
                            tooltip="Ngày bắt đầu bảo hiểm (bắt buộc)"
                            rules={[
                                { required: true, message: getBasePolicyValidation('INSURANCE_VALID_FROM_REQUIRED') },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const enrollmentStartDay = getFieldValue('enrollmentStartDay');
                                        if (enrollmentStartDay && value.isBefore(enrollmentStartDay, 'day')) {
                                            return Promise.reject(new Error('Bảo hiểm có hiệu lực từ phải sau ngày bắt đầu đăng ký'));
                                        }

                                        return Promise.resolve();
                                    }
                                })
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày bắt đầu hiệu lực"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                disabled={!form.getFieldValue('enrollmentStartDay')}
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    if (current && current.isBefore(new Date(), 'day')) {
                                        return true;
                                    }

                                    const enrollmentStartDay = form.getFieldValue('enrollmentStartDay');

                                    // Disable dates before enrollment start day
                                    if (enrollmentStartDay && current && (current.isBefore(enrollmentStartDay, 'day') || current.isSame(enrollmentStartDay, 'day'))) {
                                        return true;
                                    }

                                    return false;
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="insuranceValidTo"
                            label="Bảo hiểm có hiệu lực đến"
                            tooltip="Ngày kết thúc bảo hiểm (bắt buộc)"
                            rules={[
                                { required: true, message: getBasePolicyValidation('INSURANCE_VALID_TO_REQUIRED') },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const validFrom = getFieldValue('insuranceValidFrom');
                                        if (!validFrom) {
                                            return Promise.reject(new Error('Vui lòng chọn ngày bắt đầu hiệu lực trước'));
                                        }

                                        if (!value.isAfter(validFrom)) {
                                            return Promise.reject(new Error(getBasePolicyError('INSURANCE_VALID_FROM_AFTER_TO')));
                                        }

                                        return Promise.resolve();
                                    }
                                })
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày kết thúc hiệu lực"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                disabled={!form.getFieldValue('insuranceValidFrom')}
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    if (current && current.isBefore(new Date(), 'day')) {
                                        return true;
                                    }

                                    const validFrom = form.getFieldValue('insuranceValidFrom');

                                    // Disable dates before or equal to insurance valid from
                                    if (validFrom && current) {
                                        return current.isBefore(validFrom, 'day') || current.isSame(validFrom, 'day');
                                    }

                                    return false;
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Cài đặt gia hạn & Trạng thái</Divider>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            name="autoRenewal"
                            label="Tự động gia hạn"
                            valuePropName="checked"
                            tooltip="Tự động gia hạn hợp đồng khi hết hạn"
                        >
                            <Switch
                                checkedChildren="Có"
                                unCheckedChildren="Không"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="renewalDiscountRate"
                            label="Giảm giá khi gia hạn (%)"
                            tooltip="Phần trăm giảm giá áp dụng cho phí khi gia hạn tự động (ví dụ: 1.25 = 1.25%). Theo schema max 9.99"
                            rules={[
                                { type: 'number', min: 0, max: 9.99, message: getBasePolicyError('RENEWAL_DISCOUNT_RATE_INVALID') }
                            ]}
                        >
                            <InputNumber
                                placeholder="1.25"
                                min={0}
                                max={9.99}
                                step={0.01}
                                size="large"
                                style={{ width: '100%' }}
                                formatter={value => `${value}%`}
                                parser={value => value.replace('%', '')}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Tài liệu & Thông tin bổ sung</Divider>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item
                            name="templateDocumentUrl"
                            label="URL tài liệu mẫu"
                            tooltip="Đường dẫn tới tài liệu mẫu hợp đồng bảo hiểm (policy template) nếu có"
                        >
                            <Input
                                placeholder="https://example.com/template.pdf"
                                size="large"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item
                            name="importantAdditionalInformation"
                            label="Thông tin bổ sung quan trọng"
                            tooltip="Ghi chú, điều khoản đặc biệt hoặc thông tin quan trọng khác"
                        >
                            <Input.TextArea
                                placeholder="Nhập thông tin bổ sung quan trọng..."
                                rows={4}
                                size="large"
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Col>
                </Row>

            </Form>

            <Divider />

            <Title level={4}>
                Cấu hình Gói Dữ liệu
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>
                    (Chi phí ước tính: {estimatedCosts.monthlyDataCost.toLocaleString()} ₫/tháng)
                </Text>
            </Title>

            <Card className="data-source-card" styles={{ body: { padding: '24px' } }}>
                <Form
                    form={dataSourceForm}
                    layout="vertical"
                    className="data-source-form"
                >
                    <Row gutter={16} align="middle">
                        <Col span={6}>
                            <Form.Item
                                name="category"
                                label="Mục dữ liệu"
                            >
                                <Select
                                    placeholder="Chọn danh mục"
                                    onChange={handleCategoryChange}
                                    size="large"
                                    optionLabelProp="label"
                                    loading={categoriesLoading}
                                >
                                    {categories?.map(category => (
                                        <Option key={category.id} value={category.category_name} label={category.category_name}>
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div><strong>{category.category_name}</strong></div>
                                                        <div style={{ marginTop: '4px' }}>{category.category_description}</div>
                                                    </div>
                                                }
                                                placement="right"
                                                mouseEnterDelay={0.3}
                                            >
                                                <div style={{ cursor: 'pointer' }}>
                                                    <Text>{category.category_name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {category.category_description}
                                                    </Text>
                                                </div>
                                            </Tooltip>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="tier"
                                label="Gói dịch vụ"
                            >
                                <Select
                                    placeholder="Chọn gói"
                                    disabled={!selectedCategory}
                                    onChange={handleTierChange}
                                    size="large"
                                    optionLabelProp="label"
                                    loading={tiersLoading}
                                >
                                    {tiers.map(tier => (
                                        <Option key={tier.value} value={tier.value} label={tier.label}>
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div><strong>{tier.label}</strong></div>
                                                        <div style={{ marginTop: '4px' }}>{tier.description}</div>
                                                        <div style={{ marginTop: '4px', color: '#52c41a' }}>
                                                            Hệ số nhân: x{tier.tierMultiplier}
                                                        </div>
                                                    </div>
                                                }
                                                placement="right"
                                                mouseEnterDelay={0.3}
                                            >
                                                <div style={{ cursor: 'pointer' }}>
                                                    <Text>{tier.label}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {tier.description} (x{tier.tierMultiplier})
                                                    </Text>
                                                </div>
                                            </Tooltip>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="dataSource"
                                label="Nguồn dữ liệu"
                            >
                                <Select
                                    placeholder="Chọn nguồn dữ liệu"
                                    disabled={!selectedTier}
                                    size="large"
                                    optionLabelProp="label"
                                    loading={dataSourcesLoading}
                                >
                                    {dataSources.filter(source =>
                                        !basicData.selectedDataSources.some(selected => selected.id === source.id)
                                    ).map(source => (
                                        <Option key={source.id} value={source.id} label={source.label}>
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div><strong>{source.label}</strong></div>
                                                        <div style={{ marginTop: '4px' }}>{source.description}</div>
                                                        <div style={{ marginTop: '4px', color: '#52c41a' }}>
                                                            Nhà cung cấp: {source.data_provider}
                                                        </div>
                                                        <div style={{ marginTop: '4px', color: '#1890ff' }}>
                                                            Chi phí: {source.baseCost.toLocaleString()} ₫/tháng
                                                        </div>
                                                    </div>
                                                }
                                                placement="right"
                                                mouseEnterDelay={0.3}
                                            >
                                                <div style={{ cursor: 'pointer' }}>
                                                    <Text>{source.label}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {source.data_provider} - {source.baseCost.toLocaleString()} ₫/tháng
                                                    </Text>
                                                </div>
                                            </Tooltip>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item label=" ">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddDataSource}
                                    disabled={!selectedCategory || !selectedTier}
                                    size="large"
                                    block
                                >
                                    Thêm
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                {basicData.selectedDataSources.length === 0 ? (
                    <Alert
                        message="Chưa có nguồn dữ liệu nào được chọn"
                        description="Vui lòng thêm ít nhất một nguồn dữ liệu để tiếp tục"
                        type="info"
                        icon={<InfoCircleOutlined />}
                        className="no-data-alert"
                    />
                ) : (
                    <Table
                        columns={dataSourceColumns}
                        dataSource={basicData.selectedDataSources}
                        rowKey="id"
                        pagination={false}
                        className="data-source-table"
                        size="middle"
                    />
                )}
            </Card>
        </div>
    );
};

// ✅ OPTIMIZATION: Wrap with memo and add display name
const BasicTab = memo(BasicTabComponent);
BasicTab.displayName = 'BasicTab';

export default BasicTab;