import {
    CheckCircleOutlined,
    DollarOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography
} from 'antd';

const { Title, Text } = Typography;

const ReviewTab = ({
    basicData,
    configurationData,
    tagsData,
    estimatedCosts,
    validationStatus,
    loading,
    onCreatePolicy
}) => {

    // Data sources summary table columns
    const dataSourceColumns = [
        {
            title: 'Nguồn dữ liệu',
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
            title: 'Danh mục & Gói',
            key: 'category',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color="blue">{record.categoryLabel}</Tag>
                    <Tag color="green">{record.tierLabel}</Tag>
                </Space>
            ),
        },
        {
            title: 'Chi phí ước tính',
            key: 'cost',
            render: (_, record) => {
                const cost = record.baseCost *
                    (record.category === 'weather' ? 1.0 :
                        record.category === 'satellite' ? 1.5 : 2.0) *
                    (record.tier === 'basic' ? 1.0 :
                        record.tier === 'premium' ? 1.8 : 3.0);
                return `$${cost.toFixed(2)}/tháng`;
            },
        },
    ];

    // Conditions summary table columns
    const conditionColumns = [
        {
            title: 'Nguồn dữ liệu',
            dataIndex: 'dataSourceLabel',
            key: 'dataSourceLabel',
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <Text>
                    {record.aggregationFunctionLabel} trong {record.aggregationWindowDays} ngày{' '}
                    {record.thresholdOperatorLabel} {record.thresholdValue} {record.unit}
                </Text>
            ),
        },
    ];

    // Tags summary table columns
    const tagColumns = [
        {
            title: 'Tên trường',
            dataIndex: 'key',
            key: 'key',
        },
        {
            title: 'Giá trị',
            dataIndex: 'value',
            key: 'value',
        },
        {
            title: 'Loại dữ liệu',
            dataIndex: 'dataTypeLabel',
            key: 'dataTypeLabel',
            render: (text) => <Tag>{text}</Tag>
        },
    ];

    // Validation summary
    const getValidationSummary = () => {
        const issues = [];
        if (!validationStatus.basic) {
            issues.push('Thông tin cơ bản chưa hoàn thành');
        }
        if (!validationStatus.configuration) {
            issues.push('Cấu hình điều kiện chưa hoàn thành');
        }
        return issues;
    };

    const validationIssues = getValidationSummary();

    return (
        <div className="review-tab">
            <Title level={4}>Xem lại & Tạo Policy</Title>

            {/* Validation Summary */}
            {validationIssues.length > 0 ? (
                <Alert
                    message="Policy chưa sẵn sàng để tạo"
                    description={
                        <ul>
                            {validationIssues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    }
                    type="warning"
                    icon={<ExclamationCircleOutlined />}
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            ) : (
                <Alert
                    message="Policy đã sẵn sàng để tạo"
                    description="Tất cả thông tin bắt buộc đã được hoàn thành. Bạn có thể tiến hành tạo policy."
                    type="success"
                    icon={<CheckCircleOutlined />}
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            <Row gutter={24}>
                <Col span={16}>
                    {/* Basic Information */}
                    <Card title="Thông tin Cơ bản" className="review-section">
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Tên sản phẩm" span={2}>
                                <Text strong>{basicData.productName || 'Chưa nhập'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã sản phẩm">
                                <Text code>{basicData.productCode || 'Chưa nhập'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Đối tác bảo hiểm">
                                {basicData.insuranceProviderId || 'Chưa nhập'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại cây trồng">
                                {basicData.cropType ? (
                                    <Tag color="green">
                                        {basicData.cropType === 'rice' ? 'Cây Lúa (Rice)' : 'Cây Cà phê (Coffee)'}
                                    </Tag>
                                ) : 'Chưa chọn'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tỷ lệ phí BH">
                                {basicData.premiumBaseRate ? `${(basicData.premiumBaseRate * 100).toFixed(2)}%` : 'Chưa nhập'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời hạn bảo hiểm" span={2}>
                                {basicData.coverageDurationDays ? `${basicData.coverageDurationDays} ngày` : 'Chưa nhập'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Data Sources */}
                    <Card
                        title={`Nguồn dữ liệu (${basicData.selectedDataSources.length})`}
                        className="review-section"
                        style={{ marginTop: 16 }}
                    >
                        {basicData.selectedDataSources.length === 0 ? (
                            <Alert
                                message="Chưa có nguồn dữ liệu nào được chọn"
                                type="info"
                                showIcon
                            />
                        ) : (
                            <Table
                                columns={dataSourceColumns}
                                dataSource={basicData.selectedDataSources}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        )}
                    </Card>

                    {/* Configuration */}
                    <Card
                        title="Cấu hình Điều kiện Kích hoạt"
                        className="review-section"
                        style={{ marginTop: 16 }}
                    >
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col span={12}>
                                <Descriptions size="small" column={1} bordered>
                                    <Descriptions.Item label="Toán tử logic">
                                        <Tag color={configurationData.logicalOperator === 'AND' ? 'blue' : 'orange'}>
                                            {configurationData.logicalOperator === 'AND' ? 'VÀ (AND)' : 'HOẶC (OR)'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tỷ lệ thanh toán">
                                        <Text strong>{configurationData.payoutPercentage}%</Text>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Col>
                        </Row>

                        {configurationData.conditions.length === 0 ? (
                            <Alert
                                message="Chưa có điều kiện nào được tạo"
                                type="warning"
                                showIcon
                            />
                        ) : (
                            <>
                                <Title level={5}>Điều kiện ({configurationData.conditions.length}):</Title>
                                <Table
                                    columns={conditionColumns}
                                    dataSource={configurationData.conditions}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                />

                                {/* Logic Preview */}
                                <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                                    <Text type="secondary">
                                        <InfoCircleOutlined /> Logic kích hoạt: Thanh toán{' '}
                                        <Text strong>{configurationData.payoutPercentage}%</Text> khi{' '}
                                        <Text strong>
                                            {configurationData.logicalOperator === 'AND' ? 'TẤT CẢ' : 'BẤT KỲ'}
                                        </Text>
                                        {' '}điều kiện trên được thỏa mãn.
                                    </Text>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* Tags */}
                    {tagsData.tags.length > 0 && (
                        <Card
                            title={`Tags & Metadata (${tagsData.tags.length})`}
                            className="review-section"
                            style={{ marginTop: 16 }}
                        >
                            <Table
                                columns={tagColumns}
                                dataSource={tagsData.tags}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    )}
                </Col>

                <Col span={8}>
                    {/* Cost Summary */}
                    <Card title="Tóm tắt Chi phí" className="cost-summary-card">
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Statistic
                                title="Chi phí Dữ liệu Hàng tháng"
                                value={estimatedCosts.monthlyDataCost}
                                prefix={<DollarOutlined />}
                                suffix="USD"
                                precision={2}
                            />

                            <Statistic
                                title="Độ phức tạp Dữ liệu"
                                value={estimatedCosts.dataComplexityScore}
                                suffix="nguồn"
                            />

                            <Statistic
                                title="Tỷ lệ Phí BH Cơ sở"
                                value={estimatedCosts.premiumBaseRate * 100}
                                suffix="%"
                                precision={2}
                            />

                            <Divider />

                            <div className="total-cost">
                                <Statistic
                                    title="Tổng Chi phí Ước tính/Tháng"
                                    value={estimatedCosts.totalEstimatedCost}
                                    prefix={<DollarOutlined />}
                                    suffix="USD"
                                    precision={2}
                                    valueStyle={{
                                        color: '#52c41a',
                                        fontSize: '24px',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </div>
                        </Space>
                    </Card>

                    {/* Create Action */}
                    <Card title="Tạo Policy" style={{ marginTop: 16 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Alert
                                message="Thông tin quan trọng"
                                description="Policy sẽ được tạo với trạng thái 'Draft' và cần được phê duyệt trước khi có thể sử dụng."
                                type="info"
                                showIcon
                                size="small"
                            />

                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={loading}
                                disabled={validationIssues.length > 0}
                                onClick={onCreatePolicy}
                            >
                                {loading ? 'Đang tạo Policy...' : 'Tạo Policy Template'}
                            </Button>

                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Quá trình tạo có thể mất vài giây để xử lý và validate dữ liệu.
                            </Text>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReviewTab;