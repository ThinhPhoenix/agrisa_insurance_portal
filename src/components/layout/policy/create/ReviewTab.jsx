import {
    CheckCircleOutlined,
    DollarOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import {
    Alert,
    Card,
    Col,
    Descriptions,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography
} from 'antd';
import { memo } from 'react';

const { Title, Text } = Typography;

// ✅ OPTIMIZATION: Memoize ReviewTab to prevent unnecessary re-renders
const ReviewTabComponent = ({
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
                return `${cost.toLocaleString()} ₫/tháng`;
            },
        },
    ];

    // Conditions summary table columns
    const conditionColumns = [
        {
            title: 'Nguồn dữ liệu',
            dataIndex: 'dataSourceLabel',
            key: 'dataSourceLabel',
            width: 150,
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            width: 350,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>
                        {record.aggregationFunctionLabel} trong {record.aggregationWindowDays} ngày{' '}
                        {record.thresholdOperatorLabel} {record.thresholdValue} {record.unit}
                    </Text>
                    {record.earlyWarningThreshold && (
                        <Text type="warning" style={{ fontSize: 12 }}>
                            Cảnh báo sớm: {record.earlyWarningThreshold}
                        </Text>
                    )}
                    <Space size={4} wrap>
                        {record.consecutiveRequired && (
                            <Tag color="orange" size="small">Liên tiếp</Tag>
                        )}
                        {record.includeComponent && (
                            <Tag color="purple" size="small">Bao gồm Component</Tag>
                        )}
                        <Tag color="blue" size="small">Thứ tự: {record.conditionOrder || 1}</Tag>
                        <Tag color="green" size="small">Kiểm tra: {record.validationWindowDays || 3} ngày</Tag>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Baseline',
            key: 'baseline',
            width: 150,
            render: (_, record) => (
                record.baselineWindowDays ? (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: 12 }}>{record.baselineWindowDays} ngày</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {record.baselineFunction || 'avg'}
                        </Text>
                    </Space>
                ) : <Text type="secondary">-</Text>
            ),
        },
        {
            title: 'Chi phí',
            key: 'cost',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: 12 }}>
                        Base: {record.baseCost?.toLocaleString() || 0} VND
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Category: {record.categoryMultiplier}x | Tier: {record.tierMultiplier}x
                    </Text>
                    <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                        = {record.calculatedCost?.toLocaleString() || 0} VND
                    </Text>
                </Space>
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

            {/* Tóm tắt Chi phí - Đưa lên đầu */}
            <Card
                title={
                    <Space>
                        <DollarOutlined style={{ color: '#52c41a' }} />
                        <Text strong>Tóm tắt Chi phí</Text>
                    </Space>
                }
                className="cost-summary-card"
                style={{ marginBottom: 16 }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title="Chi phí Dữ liệu Hàng tháng"
                            value={estimatedCosts.monthlyDataCost}
                            prefix={<DollarOutlined />}
                            suffix="VND"
                            precision={0}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title="Độ phức tạp Dữ liệu"
                            value={estimatedCosts.dataComplexityScore}
                            suffix="nguồn"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title="Tỷ lệ Phí BH Cơ sở"
                            value={estimatedCosts.premiumBaseRate * 100}
                            suffix="%"
                            precision={2}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Statistic
                            title="Tổng Chi phí Ước tính/Tháng"
                            value={estimatedCosts.totalEstimatedCost}
                            prefix={<DollarOutlined />}
                            suffix="VND"
                            precision={0}
                            valueStyle={{
                                color: '#52c41a',
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Layout 1 cột cho tất cả nội dung */}
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
                        <Descriptions.Item label="Đơn vị tiền tệ">
                            {basicData.coverageCurrency || 'VND'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời hạn bảo hiểm">
                            {basicData.coverageDurationDays ? `${basicData.coverageDurationDays} ngày` : 'Chưa nhập'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tính theo diện tích">
                            <Tag color={basicData.isPerHectare ? 'green' : 'default'}>
                                {basicData.isPerHectare ? 'Có (per hectare)' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phí BH cố định">
                            {basicData.fixPremiumAmount ? `${basicData.fixPremiumAmount.toLocaleString()} VND` : 'Không có'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỷ lệ phí BH cơ sở">
                            {basicData.premiumBaseRate ? `${(basicData.premiumBaseRate * 100).toFixed(2)}%` : 'Chưa nhập'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Gia hạn thanh toán">
                            {basicData.maxPremiumPaymentProlong ? `${basicData.maxPremiumPaymentProlong} ngày` : 'Không cho phép'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỷ lệ hủy phí">
                            {basicData.cancelPremiumRate ? `${(basicData.cancelPremiumRate * 100).toFixed(2)}%` : 'Không có'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian đăng ký" span={2}>
                            {basicData.enrollmentStartDay && basicData.enrollmentEndDay ? (
                                <Space>
                                    <Text>{new Date(basicData.enrollmentStartDay * 1000).toLocaleDateString('vi-VN')}</Text>
                                    <Text>→</Text>
                                    <Text>{new Date(basicData.enrollmentEndDay * 1000).toLocaleDateString('vi-VN')}</Text>
                                </Space>
                            ) : 'Chưa thiết lập'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian hiệu lực" span={2}>
                            {basicData.insuranceValidFrom && basicData.insuranceValidTo ? (
                                <Space>
                                    <Text strong>{new Date(basicData.insuranceValidFrom * 1000).toLocaleDateString('vi-VN')}</Text>
                                    <Text>→</Text>
                                    <Text strong>{new Date(basicData.insuranceValidTo * 1000).toLocaleDateString('vi-VN')}</Text>
                                </Space>
                            ) : 'Chưa thiết lập'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tự động gia hạn">
                            <Tag color={basicData.autoRenewal ? 'green' : 'default'}>
                                {basicData.autoRenewal ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giảm giá gia hạn">
                            {basicData.renewalDiscountRate ? `${(basicData.renewalDiscountRate * 100).toFixed(2)}%` : '0%'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={basicData.status === 'active' ? 'green' : 'orange'}>
                                {basicData.status === 'draft' ? 'Nháp' : basicData.status === 'active' ? 'Đang hoạt động' : 'Đã lưu trữ'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái xác thực tài liệu">
                            <Tag color={basicData.documentValidationStatus === 'passed' ? 'green' : 'orange'}>
                                {basicData.documentValidationStatus === 'pending' ? 'Đang chờ' :
                                    basicData.documentValidationStatus === 'passed' ? 'Đã xác thực' : 'Cảnh báo'}
                            </Tag>
                        </Descriptions.Item>
                        {basicData.importantAdditionalInformation && (
                            <Descriptions.Item label="Thông tin bổ sung" span={2}>
                                <Text>{basicData.importantAdditionalInformation}</Text>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>

                {/* Data Sources */}
                <Card
                    title={`Nguồn dữ liệu (${basicData.selectedDataSources.length})`}
                    className="review-section"
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
                >
                    <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Toán tử logic">
                            <Tag color={configurationData.logicalOperator === 'AND' ? 'blue' : 'orange'}>
                                {configurationData.logicalOperator === 'AND' ? 'VÀ (AND)' : 'HOẶC (OR)'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giai đoạn sinh trưởng">
                            {configurationData.growthStage || 'Chưa thiết lập'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khoảng giám sát">
                            {configurationData.monitorInterval} {configurationData.monitorFrequencyUnit === 'day' ? 'ngày' :
                                configurationData.monitorFrequencyUnit === 'hour' ? 'giờ' : 'tháng'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thanh toán theo ha">
                            <Tag color={configurationData.isPayoutPerHectare ? 'green' : 'default'}>
                                {configurationData.isPayoutPerHectare ? 'Có' : 'Không'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tỷ lệ thanh toán cơ sở">
                            <Text strong>{(configurationData.payoutBaseRate * 100).toFixed(2)}%</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền thanh toán cố định">
                            {configurationData.fixPayoutAmount ? `${configurationData.fixPayoutAmount.toLocaleString()} VND` : 'Không có'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hệ số vượt ngưỡng">
                            {configurationData.overThresholdMultiplier}x
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới hạn thanh toán">
                            {configurationData.payoutCap ? `${configurationData.payoutCap.toLocaleString()} VND` : 'Không giới hạn'}
                        </Descriptions.Item>
                    </Descriptions>

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

                {/* Document Tags (for BE submission) */}
                {tagsData.documentTagsObject && Object.keys(tagsData.documentTagsObject).length > 0 && (
                    <Card
                        title={`Trường thông tin tài liệu (${Object.keys(tagsData.documentTagsObject).length})`}
                        className="review-section"
                    >
                        <Alert
                            message="Các trường này sẽ được ánh xạ vào tài liệu policy"
                            type="info"
                            showIcon
                            style={{ marginBottom: 12 }}
                        />
                        <Descriptions column={2} bordered size="small">
                            {Object.entries(tagsData.documentTagsObject).map(([key, dataType]) => (
                                <Descriptions.Item
                                    key={key}
                                    label={<Text strong>{key}</Text>}
                                >
                                    <Tag color="blue">{dataType}</Tag>
                                </Descriptions.Item>
                            ))}
                        </Descriptions>
                    </Card>
                )}

                {/* Policy Document */}
                {(tagsData.uploadedFile || tagsData.modifiedPdfBytes) && (
                    <Card
                        title="Tài liệu Policy"
                        className="review-section"
                    >
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Tên file">
                                <Text strong>{tagsData.uploadedFile?.name || 'policy_document.pdf'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Kích thước">
                                {tagsData.uploadedFile?.size
                                    ? `${(tagsData.uploadedFile.size / 1024 / 1024).toFixed(2)} MB`
                                    : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại file">
                                <Tag color="red">PDF</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={tagsData.modifiedPdfBytes ? 'green' : 'blue'}>
                                    {tagsData.modifiedPdfBytes ? 'Đã áp dụng mappings' : 'File gốc'}
                                </Tag>
                            </Descriptions.Item>
                            {tagsData.documentTagsObject && Object.keys(tagsData.documentTagsObject).length > 0 && (
                                <Descriptions.Item label="Số trường đã map" span={2}>
                                    <Text strong>{Object.keys(tagsData.documentTagsObject).length} trường</Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>
                )}

            </Space>
        </div>
    );
};

// ✅ OPTIMIZATION: Wrap with memo and add display name
const ReviewTab = memo(ReviewTabComponent);
ReviewTab.displayName = 'ReviewTab';

export default ReviewTab;