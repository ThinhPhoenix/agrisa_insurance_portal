import { getBasePolicyError, getBasePolicyValidation } from "@/libs/message";
import useDictionary from "@/services/hooks/common/use-dictionary";
import { useAuthStore } from "@/stores/auth-store";
import {
    DeleteOutlined,
    InfoCircleOutlined,
    PlusOutlined,
} from "@ant-design/icons";
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
    Popconfirm,
    Row,
    Select,
    Switch,
    Table,
    Tooltip,
    Typography
} from "antd";
import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useRef, useState } from "react";

const { Option } = Select;
const { Title, Text } = Typography;

//  OPTIMIZATION: Memoize BasicTab to prevent unnecessary re-renders
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
    fetchDataSourcesByTier,
}) => {
    const [form] = Form.useForm();
    const [dataSourceForm] = Form.useForm();
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTier, setSelectedTier] = useState("");
    const { user } = useAuthStore();
    const dict = useDictionary();

    useEffect(() => {
        // Auto-fill default values and insurance provider ID
        const updates = {};

        if (!basicData.product_description) {
            updates.product_description =
                "Bảo hiểm tham số theo chỉ số lượng mưa cho cây lúa mùa khô. Chi trả tự động khi lượng mưa tích lũy thấp hơn ngưỡng 50mm trong 30 ngày liên tục, không cần kiểm tra thiệt hại tại hiện trường.";
        }

        // Auto-fill insurance provider ID from logged-in user's partner_id (if available)
        if (!basicData.insuranceProviderId && user?.partner_id) {
            // Only use partner_id for creating base policy
            updates.insuranceProviderId = user.partner_id;
            console.log(
                "🔍 BasicTab - Set insuranceProviderId from user partner_id:",
                {
                    partner_id: user.partner_id,
                    full_user: user,
                }
            );
        }

        // Default status to 'draft'
        if (!basicData.status) {
            updates.status = "draft";
        }

        // Always set premium and payout per hectare to true
        if (basicData.isPerHectare !== true) {
            updates.isPerHectare = true;
        }

        if (basicData.isPayoutPerHectare !== true) {
            updates.isPayoutPerHectare = true;
        }

        // Auto-calculate insuranceValidTo = insuranceValidFrom + coverageDurationDays
        if (basicData.insuranceValidFrom && basicData.coverageDurationDays) {
            const from = dayjs(basicData.insuranceValidFrom);
            if (from.isValid()) {
                const validTo = from.add(Number(basicData.coverageDurationDays), 'day');
                // Only update if the calculated value is different from current value
                const currentValidTo = basicData.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;
                if (!currentValidTo || !currentValidTo.isSame(validTo, 'day')) {
                    updates.insuranceValidTo = validTo;
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            onDataChange({
                ...basicData,
                ...updates,
            });
            // Update form values to reflect the changes
            form.setFieldsValue(updates);
        }
    }, [
        basicData.insuranceValidFrom,
        basicData.coverageDurationDays,
        basicData.product_description,
        basicData.insuranceProviderId,
        basicData.status,
        basicData.isPerHectare,
        basicData.isPayoutPerHectare,
        user,
        onDataChange,
        form,
    ]);

    //  OPTIMIZATION: Debounce form changes to prevent input lag with Vietnamese typing
    const timeoutRef = useRef(null);
    const handleValuesChange = useCallback(
        (changedValues, allValues) => {
            // Auto-calculate insuranceValidTo when insuranceValidFrom or coverageDurationDays changes
            if (changedValues.insuranceValidFrom || changedValues.coverageDurationDays) {
                const validFrom = allValues.insuranceValidFrom || changedValues.insuranceValidFrom;
                const duration = allValues.coverageDurationDays || changedValues.coverageDurationDays;

                if (validFrom && duration) {
                    const from = dayjs(validFrom);
                    if (from.isValid()) {
                        const validTo = from.add(Number(duration), 'day');
                        allValues.insuranceValidTo = validTo;
                        // Update the form field immediately (non-text field, safe)
                        form.setFieldsValue({ insuranceValidTo: validTo });
                    }
                }
            }

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Debounce the onChange call to prevent re-render during typing
            // CRITICAL: 600ms delay required for Vietnamese IME composition to complete properly
            timeoutRef.current = setTimeout(() => {
                onDataChange(allValues);
            }, 600); // 600ms debounce for Vietnamese typing (increased from 300ms)
        },
        [onDataChange, form]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    //  Sync form with basicData when it changes (e.g., when template is applied)
    //  Use deep comparison to prevent infinite loop from reference changes
    const basicDataRef = useRef(basicData);
    const syncTimeoutRef = useRef(null);
    useEffect(() => {
        // Deep comparison: check if content actually changed
        const hasContentChanged = JSON.stringify(basicDataRef.current) !== JSON.stringify(basicData);

        if (hasContentChanged) {
            // Clear any pending sync
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }

            // Debounce sync to prevent rapid updates
            syncTimeoutRef.current = setTimeout(() => {
                // ✅ FIX: Only sync non-text fields to prevent Vietnamese IME interruption
                // Exclude fields that user actively types into to avoid cursor jump
                const { productName, productDescription, importantAdditionalInformation, ...safeFields } = basicData;

                // Get current form values for text fields
                const currentTextFields = form.getFieldsValue(['productName', 'productDescription', 'importantAdditionalInformation']);

                // Merge: use form's current text values + new non-text values
                form.setFieldsValue({
                    ...safeFields,
                    ...currentTextFields, // Preserve what user is typing
                });

                console.log('✅ BasicTab synced with template data:', {
                    dataSourcesCount: basicData.selectedDataSources?.length || 0,
                    productName: basicData.productName
                });

                // Update ref to new data
                basicDataRef.current = basicData;
            }, 150); // Slightly longer delay to avoid race with handleValuesChange
        }

        // Cleanup
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [basicData, form]);

    // Handle category change
    const handleCategoryChange = useCallback(
        (categoryName) => {
            setSelectedCategory(categoryName);
            setSelectedTier("");
            dataSourceForm.setFieldsValue({
                tier: undefined,
                dataSource: undefined,
            });

            // Find the selected category to get its ID
            const selectedCategoryObj = categories.find(
                (cat) => cat.category_name === categoryName
            );
            if (selectedCategoryObj && fetchTiersByCategory) {
                fetchTiersByCategory(selectedCategoryObj.id);
            }
        },
        [categories, dataSourceForm, fetchTiersByCategory]
    );

    // Helper: validate decimal precision and scale according to schema limits
    const validateDecimal = (value, max, maxDecimals) => {
        if (value === null || value === undefined || value === "") return true;
        const abs = Math.abs(Number(value));
        if (Number.isNaN(abs)) return false;
        if (abs > max) return false;
        const parts = String(value).split(".");
        const decimals = parts[1] ? parts[1].length : 0;
        if (decimals > maxDecimals) return false;
        return true;
    };

    // Handle tier change
    const handleTierChange = useCallback(
        (tier) => {
            setSelectedTier(tier);
            dataSourceForm.setFieldsValue({ dataSource: undefined });

            // Find the selected tier data to get its ID
            const selectedTierData = tiers.find((t) => t.value === tier);
            if (selectedTierData && fetchDataSourcesByTier) {
                fetchDataSourcesByTier(selectedTierData.id);
            }
        },
        [tiers, dataSourceForm, fetchDataSourcesByTier]
    );

    // Handle add data source
    const handleAddDataSource = useCallback(() => {
        dataSourceForm.validateFields().then((values) => {
            const selectedSource = dataSources.find(
                (source) => source.id === values.dataSource
            );
            if (selectedSource) {
                // Create an instance wrapper to allow same data source added multiple times
                const instanceId = `inst_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 7)}`;

                // Find category and tier to get multipliers
                const selectedCategoryObj = categories.find(
                    (cat) => cat.category_name === selectedCategory
                );
                const selectedTierObj = tiers.find(
                    (t) => t.value === selectedTier
                );

                const dataSourceToAdd = {
                    ...selectedSource,
                    // Keep original id (data source id from API) and add unique instance id
                    originalDataSourceId: selectedSource.id,
                    instanceId,
                    category: selectedCategory,
                    tier: selectedTier,
                    categoryLabel: selectedCategory,
                    tierLabel: selectedTierObj?.label || selectedTier,
                    // Add multipliers for condition calculation
                    categoryMultiplier:
                        selectedCategoryObj?.category_cost_multiplier || 1,
                    tierMultiplier: selectedTierObj?.data_tier_multiplier || 1,
                };

                onAddDataSource(dataSourceToAdd);
                dataSourceForm.resetFields();
                setSelectedCategory("");
                setSelectedTier("");
            }
        });
    }, [
        dataSourceForm,
        dataSources,
        onAddDataSource,
        selectedCategory,
        selectedTier,
        basicData.selectedDataSources,
        categories,
        tiers,
    ]);

    // Data source table columns
    const dataSourceColumns = [
        {
            title: dict.ui.dataSourceName,
            dataIndex: "label",
            key: "label",
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        {record.parameterName} ({record.unit})
                    </Text>
                </div>
            ),
        },
        {
            title: dict.ui.category,
            dataIndex: "categoryLabel",
            key: "categoryLabel",
        },
        {
            title: dict.ui.tier,
            dataIndex: "tierLabel",
            key: "tierLabel",
        },
        {
            title: dict.ui.baseCost,
            dataIndex: "baseCost",
            key: "baseCost",
            render: (cost) => `${cost.toLocaleString()} ₫/tháng`,
        },
        {
            title: dict.ui.actions,
            key: "action",
            render: (_, record) => (
                <Popconfirm
                    title={dict.ui.msgDeleteDataSource}
                    description={dict.ui.msgConfirmDeleteDataSource}
                    onConfirm={() => onRemoveDataSource(record.instanceId || record.id)}
                    okText={dict.ui.delete}
                    cancelText={dict.ui.cancel}
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
            <Title level={4}>{dict.ui.sectionBasicInfo}</Title>

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
                            label={dict.getFieldLabel('BasePolicy', 'product_name')}
                            tooltip={dict.getFieldNote('BasePolicy', 'product_name') || 'Tên hiển thị (VD: Bảo hiểm lúa mùa đông 2025)'}
                            rules={[
                                {
                                    required: true,
                                    message: getBasePolicyError(
                                        "PRODUCT_NAME_REQUIRED"
                                    ),
                                },
                                {
                                    min: 3,
                                    message: getBasePolicyValidation(
                                        "PRODUCT_NAME_MIN_LENGTH"
                                    ),
                                },
                            ]}
                        >
                            <Input
                                placeholder={dict.getFieldNote('BasePolicy', 'product_name') || 'Nhập tên sản phẩm bảo hiểm'}
                                size="large"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        {/* Product code is auto-generated and hidden from the user. */}
                        <Form.Item
                            name="productCode"
                            // productCode is auto-generated; keep pattern but not required
                            rules={[
                                {
                                    pattern: /^[A-Za-z0-9_]+$/,
                                    message:
                                        "Mã sản phẩm chỉ được chứa chữ cái, số và dấu gạch dưới (_)!",
                                },
                            ]}
                            normalize={(value) => (value ? value.toUpperCase() : value)}
                            style={{ display: "none" }}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="productDescription"
                            label={dict.getFieldLabel('BasePolicy', 'product_description')}
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
                            label={dict.getFieldLabel('BasePolicy', 'crop_type')}
                            tooltip="Chọn loại cây trồng được bảo hiểm"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng chọn loại cây trồng!",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Chọn loại cây trồng"
                                size="large"
                                optionLabelProp="label"
                            >
                                {mockData.cropTypes.map((crop) => (
                                    <Option
                                        key={crop.value}
                                        value={crop.value}
                                        label={crop.label}
                                    >
                                        <div>
                                            <Text>{crop.label}</Text>
                                            <br />
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: "12px" }}
                                            >
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
                            label={dict.getFieldLabel('BasePolicy', 'coverage_duration_days')}
                            tooltip="Số ngày hợp đồng có hiệu lực (VD: 120 ngày)"
                            rules={[
                                {
                                    required: true,
                                    message: getBasePolicyError(
                                        "COVERAGE_DURATION_INVALID"
                                    ),
                                },
                                {
                                    type: "number",
                                    min: 1,
                                    message: getBasePolicyValidation(
                                        "COVERAGE_DURATION_MIN"
                                    ),
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="120"
                                min={1}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            name="premiumBaseRate"
                            label={dict.getFieldLabel('BasePolicy', 'premium_base_rate')}
                            tooltip="Hệ số tính phí (phải > 0 nếu không dùng phí cố định)"
                            rules={[
                                {
                                    required: true,
                                    message: getBasePolicyError(
                                        "PREMIUM_BASE_RATE_REQUIRED"
                                    ),
                                },
                                {
                                    type: "number",
                                    min: 0,
                                    message: getBasePolicyError(
                                        "PREMIUM_BASE_RATE_NEGATIVE"
                                    ),
                                },
                                {
                                    validator: (_, value) => {
                                        if (
                                            value === null ||
                                            value === undefined ||
                                            value === ""
                                        )
                                            return Promise.resolve();
                                        const ok = validateDecimal(
                                            value,
                                            999999.9,
                                            1
                                        );
                                        return ok
                                            ? Promise.resolve()
                                            : Promise.reject(
                                                getBasePolicyError(
                                                    "PREMIUM_BASE_RATE_INVALID"
                                                )
                                            );
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="1.0"
                                min={0}
                                step={0.1}
                                max={999999.9}
                                precision={1}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="fixPremiumAmount"
                            label={dict.getFieldLabel('BasePolicy', 'fix_premium_amount')}
                            tooltip="Số tiền phí cố định cho hợp đồng (không tính toán)"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: getBasePolicyError(
                                        "FIX_PREMIUM_AMOUNT_NEGATIVE"
                                    ),
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="1,000,000"
                                min={0}
                                step={1000}
                                size="large"
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                    )
                                }
                                parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="maxPremiumPaymentProlong"
                            label={dict.getFieldLabel('BasePolicy', 'max_premium_payment_prolong')}
                            tooltip="Số ngày tối đa cho phép trả chậm phí"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Phải >= 0",
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="7"
                                min={0}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item
                            name="cancelPremiumRate"
                            label={dict.getFieldLabel('BasePolicy', 'cancel_premium_rate')}
                            tooltip="Tỷ lệ hoàn phí khi hủy sớm (0-1, VD: 0.8 = hoàn 80%)"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    max: 1,
                                    message: getBasePolicyError(
                                        "CANCEL_PREMIUM_RATE_INVALID"
                                    ),
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="0.8"
                                min={0}
                                max={1}
                                step={0.01}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">{dict.ui.sectionPayoutSettings}</Divider>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="payoutBaseRate"
                            label={dict.getFieldLabel('BasePolicy', 'payout_base_rate')}
                            tooltip="Hệ số tính chi trả (phải > 0, VD: 0.75 = 75%)"
                            rules={[
                                {
                                    required: true,
                                    message: getBasePolicyError(
                                        "PAYOUT_BASE_RATE_REQUIRED"
                                    ),
                                },
                                {
                                    type: "number",
                                    min: 0,
                                    message: getBasePolicyError(
                                        "PAYOUT_BASE_RATE_NEGATIVE"
                                    ),
                                },
                                {
                                    validator: (_, value) => {
                                        if (
                                            value === null ||
                                            value === undefined ||
                                            value === ""
                                        )
                                            return Promise.resolve();
                                        const ok = validateDecimal(
                                            value,
                                            999999.9,
                                            1
                                        );
                                        return ok
                                            ? Promise.resolve()
                                            : Promise.reject(
                                                getBasePolicyError(
                                                    "PAYOUT_BASE_RATE_INVALID"
                                                )
                                            );
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="0.75"
                                min={0}
                                step={0.1}
                                max={999999.9}
                                precision={1}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="fixPayoutAmount"
                            label={dict.getFieldLabel('BasePolicy', 'fix_payout_amount')}
                            tooltip="Số tiền chi trả cố định khi xảy ra sự cố"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: getBasePolicyError(
                                        "FIX_PAYOUT_AMOUNT_NEGATIVE"
                                    ),
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="5,000,000"
                                min={0}
                                step={1000}
                                size="large"
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                    )
                                }
                                parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="payoutCap"
                            label={dict.getFieldLabel('BasePolicy', 'payout_cap')}
                            tooltip="Số tiền chi trả tối đa cho một hợp đồng"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: getBasePolicyError(
                                        "PAYOUT_CAP_NEGATIVE"
                                    ),
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="10,000,000"
                                min={0}
                                step={1000}
                                size="large"
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                    )
                                }
                                parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="overThresholdMultiplier"
                            label={dict.getFieldLabel('BasePolicy', 'over_threshold_multiplier')}
                            tooltip="Hệ số nhân khi vượt ngưỡng (phải > 0, mặc định: 1.0)"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: getBasePolicyError(
                                        "OVER_THRESHOLD_MULTIPLIER_NEGATIVE"
                                    ),
                                },
                                {
                                    validator: (_, value) => {
                                        if (
                                            value === null ||
                                            value === undefined ||
                                            value === ""
                                        )
                                            return Promise.resolve();
                                        const ok = validateDecimal(
                                            value,
                                            999999.9,
                                            1
                                        );
                                        return ok
                                            ? Promise.resolve()
                                            : Promise.reject(
                                                getBasePolicyError(
                                                    "OVER_THRESHOLD_MULTIPLIER_INVALID"
                                                )
                                            );
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="1.0"
                                min={0}
                                step={0.1}
                                max={999999.9}
                                precision={1}
                                size="large"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">
                    {dict.ui.sectionEnrollmentPeriod}
                </Divider>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="enrollmentStartDay"
                            label={dict.getFieldLabel('BasePolicy', 'enrollment_start_day')}
                            tooltip="Ngày mở đăng ký (trước ngày hiệu lực)"
                        >
                            <DatePicker
                                placeholder="Chọn ngày bắt đầu đăng ký"
                                size="large"
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    return (
                                        current &&
                                        current.isBefore(new Date(), "day")
                                    );
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="enrollmentEndDay"
                            label={dict.getFieldLabel('BasePolicy', 'enrollment_end_day')}
                            tooltip="Ngày đóng đăng ký (trước/bằng ngày hiệu lực)"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const startDay =
                                            getFieldValue("enrollmentStartDay");
                                        if (!startDay) {
                                            return Promise.reject(
                                                new Error(
                                                    "Vui lòng chọn ngày bắt đầu đăng ký trước"
                                                )
                                            );
                                        }

                                        if (
                                            startDay &&
                                            !value.isAfter(startDay)
                                        ) {
                                            return Promise.reject(
                                                new Error(
                                                    getBasePolicyError(
                                                        "ENROLLMENT_START_AFTER_END"
                                                    )
                                                )
                                            );
                                        }

                                        const validFrom =
                                            getFieldValue("insuranceValidFrom");
                                        if (
                                            validFrom &&
                                            value.isAfter(validFrom)
                                        ) {
                                            return Promise.reject(
                                                new Error(
                                                    getBasePolicyError(
                                                        "ENROLLMENT_END_AFTER_VALID_FROM"
                                                    )
                                                )
                                            );
                                        }

                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày kết thúc đăng ký"
                                size="large"
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                disabled={
                                    !form.getFieldValue("enrollmentStartDay")
                                }
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    if (
                                        current &&
                                        current.isBefore(new Date(), "day")
                                    ) {
                                        return true;
                                    }

                                    const startDay =
                                        form.getFieldValue(
                                            "enrollmentStartDay"
                                        );
                                    const validFrom =
                                        form.getFieldValue(
                                            "insuranceValidFrom"
                                        );

                                    // Disable dates before or equal to start day
                                    if (
                                        startDay &&
                                        current &&
                                        (current.isBefore(startDay, "day") ||
                                            current.isSame(startDay, "day"))
                                    ) {
                                        return true;
                                    }

                                    // Disable dates after insurance valid from
                                    if (
                                        validFrom &&
                                        current &&
                                        current.isAfter(validFrom, "day")
                                    ) {
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
                            label={dict.getFieldLabel('BasePolicy', 'insurance_valid_from_day')}
                            tooltip="Ngày bắt đầu bảo hiểm (bắt buộc)"
                            rules={[
                                {
                                    required: true,
                                    message: getBasePolicyValidation(
                                        "INSURANCE_VALID_FROM_REQUIRED"
                                    ),
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const enrollmentStartDay =
                                            getFieldValue("enrollmentStartDay");
                                        if (
                                            enrollmentStartDay &&
                                            value.isBefore(
                                                enrollmentStartDay,
                                                "day"
                                            )
                                        ) {
                                            return Promise.reject(
                                                new Error(
                                                    "Bảo hiểm có hiệu lực từ phải sau ngày bắt đầu đăng ký"
                                                )
                                            );
                                        }

                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày bắt đầu hiệu lực"
                                size="large"
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                disabled={
                                    !form.getFieldValue("enrollmentStartDay")
                                }
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    if (
                                        current &&
                                        current.isBefore(new Date(), "day")
                                    ) {
                                        return true;
                                    }

                                    const enrollmentStartDay =
                                        form.getFieldValue(
                                            "enrollmentStartDay"
                                        );

                                    // Disable dates before enrollment start day
                                    if (
                                        enrollmentStartDay &&
                                        current &&
                                        (current.isBefore(
                                            enrollmentStartDay,
                                            "day"
                                        ) ||
                                            current.isSame(
                                                enrollmentStartDay,
                                                "day"
                                            ))
                                    ) {
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
                            label={dict.getFieldLabel('BasePolicy', 'insurance_valid_to_day')}
                            tooltip="Ngày kết thúc bảo hiểm (tự động tính = ngày bắt đầu + thời hạn bảo hiểm)"
                            rules={[
                                {
                                    required: true,
                                    message: getBasePolicyValidation(
                                        "INSURANCE_VALID_TO_REQUIRED"
                                    ),
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const validFrom =
                                            getFieldValue("insuranceValidFrom");
                                        if (!validFrom) {
                                            return Promise.reject(
                                                new Error(
                                                    "Vui lòng chọn ngày bắt đầu hiệu lực trước"
                                                )
                                            );
                                        }

                                        if (!value.isAfter(validFrom)) {
                                            return Promise.reject(
                                                new Error(
                                                    getBasePolicyError(
                                                        "INSURANCE_VALID_FROM_AFTER_TO"
                                                    )
                                                )
                                            );
                                        }

                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <DatePicker
                                placeholder="Tự động tính dựa trên ngày bắt đầu + thời hạn"
                                size="large"
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                disabled
                                disabledDate={(current) => {
                                    // Disable past dates (before today)
                                    if (
                                        current &&
                                        current.isBefore(new Date(), "day")
                                    ) {
                                        return true;
                                    }

                                    const validFrom =
                                        form.getFieldValue(
                                            "insuranceValidFrom"
                                        );

                                    // Disable dates before or equal to insurance valid from
                                    if (validFrom && current) {
                                        return (
                                            current.isBefore(
                                                validFrom,
                                                "day"
                                            ) ||
                                            current.isSame(validFrom, "day")
                                        );
                                    }

                                    return false;
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">
                    {dict.ui.sectionRenewalSettings}
                </Divider>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            name="autoRenewal"
                            label={dict.getFieldLabel('BasePolicy', 'auto_renewal')}
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
                            label={dict.getFieldLabel('BasePolicy', 'renewal_discount_rate')}
                            tooltip="Phần trăm giảm giá áp dụng cho phí khi gia hạn tự động (ví dụ: 1.25 = 1.25%). Theo schema max 9.99"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    max: 9.99,
                                    message: getBasePolicyError(
                                        "RENEWAL_DISCOUNT_RATE_INVALID"
                                    ),
                                },
                            ]}
                        >
                            <InputNumber
                                placeholder="1.25"
                                min={0}
                                max={9.99}
                                step={0.01}
                                size="large"
                                style={{ width: "100%" }}
                                formatter={(value) => `${value}%`}
                                parser={(value) => value.replace("%", "")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="isArchive"
                            label={dict.ui.isArchive}
                            valuePropName="checked"
                            tooltip={dict.ui.isArchiveTooltip}
                        >
                            <Switch
                                checkedChildren="Có"
                                unCheckedChildren="Không"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">
                    {dict.ui.sectionDocumentInfo}
                </Divider>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item
                            name="templateDocumentUrl"
                            label={dict.getFieldLabel('BasePolicy', 'template_document_url')}
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
                            label={dict.getFieldLabel('BasePolicy', 'important_additional_information')}
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
                <Text
                    type="secondary"
                    style={{
                        fontSize: "14px",
                        fontWeight: "normal",
                        marginLeft: "8px",
                    }}
                >
                    (Chi phí ước tính:{" "}
                    {estimatedCosts.monthlyDataCost.toLocaleString('vi-VN')} ₫/tháng)
                </Text>
            </Title>

            <Card
                className="data-source-card"
                styles={{ body: { padding: "24px" } }}
            >
                <Form
                    form={dataSourceForm}
                    layout="vertical"
                    className="data-source-form"
                >
                    <Row gutter={16} align="middle">
                        <Col span={6}>
                            <Form.Item name="category" label={dict.ui.category || 'Mục dữ liệu'}>
                                <Select
                                    placeholder="Chọn danh mục"
                                    onChange={handleCategoryChange}
                                    size="large"
                                    optionLabelProp="label"
                                    loading={categoriesLoading}
                                >
                                    {categories?.map((category) => (
                                        <Option
                                            key={category.id}
                                            value={category.category_name}
                                            label={category.category_name}
                                        >
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div>
                                                            <strong>
                                                                {
                                                                    category.category_name
                                                                }
                                                            </strong>
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                            }}
                                                        >
                                                            {
                                                                category.category_description
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                                placement="right"
                                                mouseEnterDelay={0.3}
                                            >
                                                <div
                                                    style={{
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Text>
                                                        {category.category_name}
                                                    </Text>
                                                    <br />
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {
                                                            category.category_description
                                                        }
                                                    </Text>
                                                </div>
                                            </Tooltip>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="tier" label={dict.ui.tier || 'Gói dịch vụ'}>
                                <Select
                                    placeholder="Chọn gói"
                                    disabled={!selectedCategory}
                                    onChange={handleTierChange}
                                    size="large"
                                    optionLabelProp="label"
                                    loading={tiersLoading}
                                >
                                    {tiers.map((tier) => (
                                        <Option
                                            key={tier.value}
                                            value={tier.value}
                                            label={tier.label}
                                        >
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div>
                                                            <strong>
                                                                {tier.label}
                                                            </strong>
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                            }}
                                                        >
                                                            {tier.description}
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                                color: "#52c41a",
                                                            }}
                                                        >
                                                            Hệ số nhân: x
                                                            {
                                                                tier.tierMultiplier
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                                placement="right"
                                                mouseEnterDelay={0.3}
                                            >
                                                <div
                                                    style={{
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Text>{tier.label}</Text>
                                                    <br />
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        {tier.description} (x
                                                        {tier.tierMultiplier})
                                                    </Text>
                                                </div>
                                            </Tooltip>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="dataSource" label={dict.ui.dataSourceName || 'Nguồn dữ liệu'}>
                                <Select
                                    placeholder="Chọn nguồn dữ liệu"
                                    disabled={!selectedTier}
                                    size="large"
                                    optionLabelProp="label"
                                    loading={dataSourcesLoading}
                                >
                                    {dataSources.map((source) => (
                                        <Option
                                            key={source.id}
                                            value={source.id}
                                            label={source.label}
                                        >
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div>
                                                            <strong>
                                                                {
                                                                    source.label
                                                                }
                                                            </strong>
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                            }}
                                                        >
                                                            {
                                                                source.description
                                                            }
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                                color: "#52c41a",
                                                            }}
                                                        >
                                                            Nhà cung cấp:{" "}
                                                            {
                                                                source.data_provider
                                                            }
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "4px",
                                                                color: "#1890ff",
                                                            }}
                                                        >
                                                            Chi phí:{" "}
                                                            {source.baseCost.toLocaleString()}{" "}
                                                            ₫/tháng
                                                        </div>
                                                    </div>
                                                }
                                                placement="right"
                                                mouseEnterDelay={0.3}
                                            >
                                                <div
                                                    style={{
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Text>
                                                        {source.label}
                                                    </Text>
                                                    <br />
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize:
                                                                "12px",
                                                        }}
                                                    >
                                                        {
                                                            source.data_provider
                                                        }{" "}
                                                        -{" "}
                                                        {source.baseCost.toLocaleString()}{" "}
                                                        ₫/tháng
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
                                    disabled={
                                        !selectedCategory || !selectedTier
                                    }
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
                        rowKey={(record, index) => record.instanceId || `${record.id}_${index}`}
                        pagination={false}
                        className="data-source-table"
                        size="middle"
                    />
                )}
            </Card>
        </div>
    );
};

//  OPTIMIZATION: Wrap with memo and add display name
const BasicTab = memo(BasicTabComponent);
BasicTab.displayName = "BasicTab";

export default BasicTab;
