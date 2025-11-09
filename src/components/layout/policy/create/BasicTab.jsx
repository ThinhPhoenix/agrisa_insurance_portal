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
import { useEffect, useState } from 'react';

const { Option } = Select;
const { Title, Text } = Typography;

const BasicTab = ({
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
            updates.product_description = "Bảo hiểm tham số theo chỉ số lượng mưa cho cây lúa mùa khô. Bồi thường tự động khi lượng mưa tích lũy thấp hơn ngưỡng 50mm trong 30 ngày liên tục, không cần kiểm tra thiệt hại tại hiện trường.";
        }

        if (!basicData.coverage_currency) {
            updates.coverage_currency = "VND";
        }

        // Auto-fill insurance provider ID from logged-in user (if available)
        if (!basicData.insuranceProviderId && user?.user_id) {
            // ⚠️ TODO: Check if user has partner_code/provider_code field
            // BE spec expects string like "bao-minh-insurance", not UUID
            updates.insuranceProviderId = user.user_id;
            console.log("🔍 BasicTab - Set insuranceProviderId from user:", {
                user_id: user.user_id,
                full_user: user
            });
        }

        // Default status to 'draft'
        if (!basicData.status) {
            updates.status = 'draft';
        }

        if (Object.keys(updates).length > 0) {
            onDataChange({
                ...basicData,
                ...updates
            });
        }
    }, [basicData, onDataChange, user]);

    // Handle form values change
    const handleValuesChange = (changedValues, allValues) => {
        onDataChange(allValues);
    };

    // Handle category change
    const handleCategoryChange = (categoryName) => {
        setSelectedCategory(categoryName);
        setSelectedTier('');
        dataSourceForm.setFieldsValue({ tier: undefined, dataSource: undefined });

        // Find the selected category to get its ID
        const selectedCategoryObj = categories.find(cat => cat.category_name === categoryName);
        if (selectedCategoryObj && fetchTiersByCategory) {
            fetchTiersByCategory(selectedCategoryObj.id);
        }
    };

    // Handle tier change
    const handleTierChange = (tier) => {
        setSelectedTier(tier);
        dataSourceForm.setFieldsValue({ dataSource: undefined });

        // Find the selected tier data to get its ID
        const selectedTierData = tiers.find(t => t.value === tier);
        if (selectedTierData && fetchDataSourcesByTier) {
            fetchDataSourcesByTier(selectedTierData.id);
        }
    };

    // Handle add data source
    const handleAddDataSource = () => {
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
    };

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
                            tooltip="Tên sản phẩm hiển thị, ví dụ: Bảo hiểm lúa mùa đông 2025"
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
                            tooltip="Mã định danh duy nhất cho sản phẩm (chỉ chữ hoa, số và dấu gạch dưới). Ví dụ: RICE_WINTER_2025"
                            rules={[
                                { required: true, message: getBasePolicyError('PRODUCT_CODE_REQUIRED') },
                                {
                                    pattern: /^[A-Z0-9_]+$/,
                                    message: getBasePolicyValidation('PRODUCT_CODE_FORMAT')
                                }
                            ]}
                        >
                            <Input
                                placeholder="Ví dụ: RICE_WINTER_2025"
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
                            tooltip="Mô tả chi tiết sản phẩm bảo hiểm (tuỳ chọn)"
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
                            tooltip="Loại cây trồng áp dụng (tuỳ chọn)"
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
                    <Col span={8}>
                        <Form.Item
                            name="coverageCurrency"
                            label="Đơn vị tiền tệ"
                            tooltip="Mã tiền tệ theo chuẩn ISO (3 ký tự)"
                            rules={[
                                { required: true, message: getBasePolicyError('COVERAGE_CURRENCY_REQUIRED') },
                                { len: 3, message: getBasePolicyError('CURRENCY_INVALID') }
                            ]}
                        >
                            <Select
                                placeholder="Chọn đơn vị tiền tệ"
                                size="large"
                            >
                                <Option value="VND">VND - Việt Nam Đồng</Option>
                                <Option value="USD">USD - Đô la Mỹ</Option>
                                <Option value="EUR">EUR - Euro</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="coverageDurationDays"
                            label="Thời hạn bảo hiểm (ngày)"
                            tooltip="Số ngày bảo hiểm bao phủ cho mỗi hợp đồng (ví dụ: 120 ngày cho chu kỳ lúa mùa đông)"
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
                    <Col span={8}>
                        <Form.Item
                            name="isPerHectare"
                            label="Tính phí theo Hecta"
                            tooltip="Tính phí theo Hecta (Is Per Hectare): Nếu bật, phí bảo hiểm sẽ được tính bằng cách nhân đơn giá với tổng diện tích (hecta) mà người dùng đăng ký"
                            rules={[{ required: true, message: getBasePolicyValidation('IS_PER_HECTARE_REQUIRED') }]}
                        >
                            <Select size="large" placeholder="Chọn">
                                <Option value={true}>Có (theo hectare)</Option>
                                <Option value={false}>Không (cố định)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item
                            name="premiumBaseRate"
                            label="Tỷ lệ phí cơ bản"
                            tooltip="Tỷ lệ phí bảo hiểm cơ bản (VND/ha hoặc hệ số nhân - multiplier). Bắt buộc nếu không có phí cố định"
                            rules={[
                                { required: true, message: getBasePolicyError('PREMIUM_BASE_RATE_REQUIRED') },
                                { type: 'number', min: 0, message: getBasePolicyError('PREMIUM_BASE_RATE_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="1.0"
                                min={0}
                                step={0.1}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="fixPremiumAmount"
                            label="Phí bảo hiểm cố định"
                            tooltip="Phí bảo hiểm cố định (Fixed Premium Amount): Một số tiền phí bảo hiểm được ấn định trước cho hợp đồng, không cần qua các bước tính toán động"
                            rules={[
                                { type: 'number', min: 0, message: getBasePolicyError('FIX_PREMIUM_AMOUNT_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="1,000,000"
                                min={0}
                                step={100000}
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
                            tooltip="Thời gian (ngày) tối đa được gia hạn việc thanh toán phí bảo hiểm (premium) - không ảnh hưởng công thức tính, chỉ tác động quy trình thanh toán (workflow)"
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
                            tooltip="Tỷ lệ phí khi hủy hợp đồng (Cancel Premium Rate): Quy định tỷ lệ phí bảo hiểm được áp dụng khi hợp đồng bị hủy trước hạn. Tỷ lệ này có thể là phần trăm phí được hoàn lại cho người dùng hoặc phần trăm phí bị giữ lại, tùy theo quy định của sản phẩm. Giá trị từ 0 đến 1 (ví dụ: 0.8 = 80%)"
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
                    <Col span={8}>
                        <Form.Item
                            name="isPayoutPerHectare"
                            label="Bồi thường theo Hecta"
                            tooltip="Bồi thường theo Hecta (Is Payout Per Hectare?): Nếu bật, số tiền bồi thường sẽ được tính bằng cách nhân mức bồi thường cơ bản với tổng diện tích (hecta) đã đăng ký"
                            rules={[{ required: true, message: getBasePolicyValidation('IS_PAYOUT_PER_HECTARE_REQUIRED') }]}
                        >
                            <Select size="large" placeholder="Chọn">
                                <Option value={true}>Có (theo hectare)</Option>
                                <Option value={false}>Không (cố định)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="payoutBaseRate"
                            label="Tỷ lệ bồi thường cơ bản"
                            tooltip="Tỷ lệ bồi thường cơ bản (Payout Base Rate): Tỷ lệ phần trăm (ví dụ: 0.75 tương đương 75%) của một giá trị cơ sở (như tổng thiệt hại hoặc chi phí cơ sở) sẽ được dùng để tính ra số tiền bồi thường cuối cùng. BẮT BUỘC"
                            rules={[
                                { required: true, message: getBasePolicyError('PAYOUT_BASE_RATE_REQUIRED') },
                                { type: 'number', min: 0, message: getBasePolicyError('PAYOUT_BASE_RATE_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="0.75"
                                min={0}
                                step={0.01}
                                size="large"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="fixPayoutAmount"
                            label="Số tiền bồi thường cố định"
                            tooltip="Số tiền bồi thường cố định (Fixed Payout Amount): Một số tiền bồi thường được ấn định trước sẽ được chi trả khi điều kiện bảo hiểm xảy ra, thay vì tính toán động"
                            rules={[
                                { type: 'number', min: 0, message: getBasePolicyError('FIX_PAYOUT_AMOUNT_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="5,000,000"
                                min={0}
                                step={100000}
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
                            label="Trần bồi thường"
                            tooltip="Trần bồi thường (Payout Cap): Mức bồi thường tối đa mà một hợp đồng có thể nhận được, dù cho kết quả tính toán thực tế có thể cao hơn"
                            rules={[
                                { type: 'number', min: 0, message: getBasePolicyError('PAYOUT_CAP_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="10,000,000"
                                min={0}
                                step={100000}
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
                            tooltip="Hệ số vượt ngưỡng (Over Threshold Multiplier): Một hệ số nhân bổ sung, làm tăng số tiền bồi thường khi mức độ nghiêm trọng của sự kiện vượt xa giá trị ngưỡng đã định. Ví dụ: 2.0 = nhân đôi số tiền bồi thường. Mặc định: 1.0 (100%)"
                            rules={[
                                { type: 'number', min: 0, message: getBasePolicyError('OVER_THRESHOLD_MULTIPLIER_NEGATIVE') }
                            ]}
                        >
                            <InputNumber
                                placeholder="1.0"
                                min={0}
                                step={0.1}
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
                            tooltip="Thời điểm bắt đầu cho phép đăng ký tham gia (tuỳ chọn). Thường trước ngày bắt đầu hiệu lực bảo hiểm"
                        >
                            <DatePicker
                                placeholder="Chọn ngày bắt đầu đăng ký"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="enrollmentEndDay"
                            label="Ngày kết thúc đăng ký"
                            tooltip="Thời điểm kết thúc cho phép đăng ký tham gia (tuỳ chọn). Phải sau ngày bắt đầu đăng ký và trước/bằng ngày bắt đầu hiệu lực bảo hiểm"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();

                                        const startDay = getFieldValue('enrollmentStartDay');
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
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="insuranceValidFrom"
                            label="Bảo hiểm có hiệu lực từ"
                            tooltip="Khoảng thời gian mà bảo hiểm có hiệu lực - ngày bắt đầu (BẮT BUỘC). Thường sau hoặc bằng ngày kết thúc đăng ký"
                            rules={[
                                { required: true, message: getBasePolicyValidation('INSURANCE_VALID_FROM_REQUIRED') }
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày bắt đầu hiệu lực"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="insuranceValidTo"
                            label="Bảo hiểm có hiệu lực đến"
                            tooltip="Khoảng thời gian mà bảo hiểm có hiệu lực - ngày kết thúc (BẮT BUỘC). Phải sau ngày bắt đầu hiệu lực"
                            rules={[
                                { required: true, message: getBasePolicyValidation('INSURANCE_VALID_TO_REQUIRED') },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const validFrom = getFieldValue('insuranceValidFrom');
                                        if (!value || !validFrom || value.isAfter(validFrom)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error(getBasePolicyError('INSURANCE_VALID_FROM_AFTER_TO')));
                                    }
                                })
                            ]}
                        >
                            <DatePicker
                                placeholder="Chọn ngày kết thúc hiệu lực"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
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
                            tooltip="Phần trăm giảm giá áp dụng cho phí khi gia hạn tự động (auto-renewal) được thực hiện (ví dụ: 10 = giảm 10%). Giá trị từ 0-100%"
                            rules={[
                                { type: 'number', min: 0, max: 100, message: getBasePolicyError('RENEWAL_DISCOUNT_RATE_INVALID') }
                            ]}
                        >
                            <InputNumber
                                placeholder="10"
                                min={0}
                                max={100}
                                step={0.1}
                                size="large"
                                style={{ width: '100%' }}
                                formatter={value => `${value}%`}
                                parser={value => value.replace('%', '')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="basePolicyInvalidDate"
                            label="Ngày vô hiệu hóa"
                            tooltip="Ngày mà hợp đồng bảo hiểm (policy) này sẽ bị vô hiệu hóa (tuỳ chọn)"
                        >
                            <DatePicker
                                placeholder="Chọn ngày vô hiệu"
                                size="large"
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
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

            <Card className="data-source-card">
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
                                    {categories.map(category => (
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
                                    {dataSources.map(source => (
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

export default BasicTab;