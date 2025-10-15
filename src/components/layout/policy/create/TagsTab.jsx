import { DeleteOutlined, InfoCircleOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Typography
} from 'antd';

const { Option } = Select;
const { Title, Text } = Typography;

const TagsTab = ({
    tagsData,
    mockData,
    onDataChange,
    onAddTag,
    onRemoveTag,
    onUpdateTag
}) => {
    const [tagForm] = Form.useForm();

    // Handle add tag
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

            const dataType = mockData.tagDataTypes.find(type => type.value === values.dataType);
            const tag = {
                ...values,
                dataTypeLabel: dataType?.label || ''
            };

            onAddTag(tag);
            tagForm.resetFields();
        });
    };

    // Handle inline edit
    const handleCellEdit = (record, field, value) => {
        if (field === 'dataType') {
            const dataType = mockData.tagDataTypes.find(type => type.value === value);
            onUpdateTag(record.id, {
                [field]: value,
                dataTypeLabel: dataType?.label || ''
            });
        } else {
            onUpdateTag(record.id, { [field]: value });
        }
    };

    // Tags table columns with inline editing
    const tagsColumns = [
        {
            title: 'Tên trường (Key)',
            dataIndex: 'key',
            key: 'key',
            width: '30%',
            render: (text, record) => (
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
            ),
        },
        {
            title: 'Giá trị (Value)',
            dataIndex: 'value',
            key: 'value',
            width: '35%',
            render: (text, record) => (
                <Input
                    value={text}
                    onChange={(e) => handleCellEdit(record, 'value', e.target.value)}
                    placeholder="Nhập giá trị"
                    size="small"
                />
            ),
        },
        {
            title: 'Loại dữ liệu',
            dataIndex: 'dataType',
            key: 'dataType',
            width: '25%',
            render: (value, record) => (
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
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            width: '10%',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa tag"
                    description="Bạn có chắc chắn muốn xóa tag này?"
                    onConfirm={() => onRemoveTag(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            ),
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
        <div className="tags-tab">
            <Title level={4}>
                <TagOutlined /> Gắn thẻ & Metadata
            </Title>

            <Alert
                message="Thông tin về Tags"
                description="Tags cho phép bạn thêm các thông tin metadata tùy chỉnh cho policy. Các thông tin này có thể được sử dụng để phân loại, tìm kiếm và báo cáo."
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
                        <Col span={8}>
                            <Form.Item
                                name="key"
                                label="Tên trường (Key)"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tên trường' },
                                    {
                                        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                                        message: 'Tên trường phải bắt đầu bằng chữ cái, chỉ chứa chữ, số và dấu gạch dưới'
                                    }
                                ]}
                            >
                                <Input
                                    placeholder="VD: region, season, area_hectares"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                name="value"
                                label="Giá trị (Value)"
                                rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
                            >
                                <Input
                                    placeholder="Nhập giá trị ban đầu"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={5}>
                            <Form.Item
                                name="dataType"
                                label="Loại dữ liệu"
                                rules={[{ required: true, message: 'Chọn loại dữ liệu' }]}
                            >
                                <Select
                                    placeholder="Chọn loại"
                                    size="large"
                                    optionLabelProp="label"
                                >
                                    {mockData.tagDataTypes.map(type => (
                                        <Option key={type.value} value={type.value} label={type.label}>
                                            <div>
                                                <Text>{type.label}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {type.description}
                                                </Text>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={3}>
                            <Form.Item label="" noStyle>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddTag}
                                    size="large"
                                    block
                                >
                                    Thêm
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <Space style={{ marginTop: 16 }}>
                    <Button onClick={handleLoadDefaults} type="dashed">
                        Tải Tags Mặc định
                    </Button>
                    <Text type="secondary">
                        Tải các tags thông dụng như: region, season, area_hectares
                    </Text>
                </Space>
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
                    <Table
                        columns={tagsColumns}
                        dataSource={tagsData.tags}
                        rowKey="id"
                        pagination={false}
                        className="tags-table"
                        size="middle"
                    />

                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">
                            Tổng cộng: <Text strong>{tagsData.tags.length}</Text> tags
                        </Text>
                    </div>
                </Card>
            )}

            {/* Tag Usage Guidelines */}
            <Card
                title="Hướng dẫn sử dụng Tags"
                style={{ marginTop: 16 }}
                className="guidelines-card"
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Title level={5}>Các loại Tags phổ biến:</Title>
                        <ul>
                            <li><Text strong>region:</Text> Khu vực địa lý (string)</li>
                            <li><Text strong>season:</Text> Mùa vụ (string)</li>
                            <li><Text strong>area_hectares:</Text> Diện tích (integer)</li>
                            <li><Text strong>farmer_count:</Text> Số lượng nông dân (integer)</li>
                            <li><Text strong>is_pilot:</Text> Chương trình thí điểm (boolean)</li>
                            <li><Text strong>risk_level:</Text> Mức độ rủi ro (decimal)</li>
                        </ul>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>Lưu ý:</Title>
                        <ul>
                            <li>Tên trường phải bắt đầu bằng chữ cái</li>
                            <li>Chỉ sử dụng chữ, số và dấu gạch dưới (_)</li>
                            <li>Tránh các từ khóa hệ thống như: id, name, status</li>
                            <li>Sử dụng snake_case cho tên trường</li>
                            <li>Giá trị phải phù hợp với loại dữ liệu đã chọn</li>
                        </ul>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default TagsTab;