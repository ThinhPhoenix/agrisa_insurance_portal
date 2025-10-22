import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    message,
    Popconfirm,
    Row,
    Select,
    Table,
    Tooltip,
    Typography
} from 'antd';
import { useState } from 'react';

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
    categoriesLoading = false
}) => {
    const [form] = Form.useForm();
    const [dataSourceForm] = Form.useForm();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTier, setSelectedTier] = useState('');
    const [availableDataSources, setAvailableDataSources] = useState([]);

    // Handle form values change
    const handleValuesChange = (changedValues, allValues) => {
        onDataChange(allValues);
    };

    // Handle category change
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setSelectedTier('');
        setAvailableDataSources([]);
        dataSourceForm.setFieldsValue({ tier: undefined, dataSource: undefined });
    };

    // Handle tier change
    const handleTierChange = (tier) => {
        setSelectedTier(tier);
        // Find the tier ID from the selected tier value
        const selectedTierData = mockData.dataTiers.find(t => t.value === tier);
        // Filter data sources by the tier's ID
        const sources = mockData.dataSources.filter(source => source.data_tier_id === selectedTierData?.id) || [];
        setAvailableDataSources(sources);
        dataSourceForm.setFieldsValue({ dataSource: undefined });
    };

    // Handle add data source
    const handleAddDataSource = () => {
        dataSourceForm.validateFields().then(values => {
            const selectedSource = availableDataSources.find(source => source.id === values.dataSource);
            if (selectedSource) {
                // Check if already added
                const exists = basicData.selectedDataSources.find(
                    source => source.id === selectedSource.id
                );

                if (exists) {
                    message.warning('Nguồn dữ liệu này đã được thêm');
                    return;
                }

                const dataSourceToAdd = {
                    ...selectedSource,
                    category: selectedCategory,
                    tier: selectedTier,
                    categoryLabel: mockData.dataTierCategories.find(cat => cat.value === selectedCategory)?.label,
                    tierLabel: mockData.dataTiers.find(t => t.value === selectedTier)?.label
                };

                onAddDataSource(dataSourceToAdd);
                dataSourceForm.resetFields();
                setSelectedCategory('');
                setSelectedTier('');
                setAvailableDataSources([]);
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
    const getFilteredTiers = (category) => {
        if (!category) return mockData.dataTiers;
        const categoryId = mockData.dataTierCategories.find(cat => cat.value === category)?.id;
        return mockData.dataTiers.filter(tier => tier.data_tier_category_id === categoryId);
    };

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
                            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
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
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã sản phẩm' },
                                {
                                    pattern: /^[A-Z0-9_]+$/,
                                    message: 'Mã sản phẩm chỉ chứa chữ hoa, số và dấu gạch dưới'
                                }
                            ]}
                        >
                            <Input
                                placeholder="VD: RICE_WINTER_2025"
                                size="large"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="insuranceProviderId"
                            label="Đối tác Bảo hiểm"
                            rules={[{ required: true, message: 'Vui lòng nhập mã đối tác' }]}
                        >
                            <Input
                                placeholder="VD: PARTNER_001"
                                size="large"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="cropType"
                            label="Loại Cây trồng"
                            rules={[{ required: true, message: 'Vui lòng chọn loại cây trồng' }]}
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
                                label="Danh mục dữ liệu"
                                rules={[{ required: true, message: 'Chọn danh mục' }]}
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
                                rules={[{ required: true, message: 'Chọn gói' }]}
                            >
                                <Select
                                    placeholder="Chọn gói"
                                    disabled={!selectedCategory}
                                    onChange={handleTierChange}
                                    size="large"
                                    optionLabelProp="label"
                                >
                                    {getFilteredTiers(selectedCategory).map(tier => (
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
                                rules={[{ required: true, message: 'Chọn nguồn dữ liệu' }]}
                            >
                                <Select
                                    placeholder="Chọn nguồn dữ liệu"
                                    disabled={!selectedTier}
                                    size="large"
                                    optionLabelProp="label"
                                >
                                    {availableDataSources.map(source => (
                                        <Option key={source.id} value={source.id} label={source.label}>
                                            <Tooltip
                                                title={
                                                    <div>
                                                        <div><strong>{source.label}</strong></div>
                                                        <div style={{ marginTop: '4px' }}>{source.description}</div>
                                                        <div style={{ marginTop: '4px', color: '#52c41a' }}>
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
                                                        {source.description} - {source.baseCost.toLocaleString()} ₫/tháng
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