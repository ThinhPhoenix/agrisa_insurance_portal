import CustomTable from '@/components/custom-table';
import {
    EyeOutlined,
    FilePdfOutlined,
    TagOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Empty, Row, Space, Tag, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

const TagsDetail = ({ policyData, mockData }) => {
    const [previewFullscreen, setPreviewFullscreen] = React.useState(false);

    const getDataTypeLabel = (value) => {
        return mockData.tagDataTypes.find(t => t.value === value)?.label || value;
    };

    const formatTagValue = (tag) => {
        if (tag.dataType === 'boolean') {
            return tag.value ? 'Có' : 'Không';
        }
        if (tag.dataType === 'decimal') {
            return parseFloat(tag.value).toLocaleString();
        }
        return tag.value || 'N/A';
    };

    const getValidationStatusLabel = (status) => {
        const statusMap = {
            'approved': 'đang hoạt động',
            'pending': 'chờ duyệt',
        };
        return statusMap[status] || status;
    };

    // Convert document_tags object to array format
    const tags = policyData.tags || [];

    // Columns for tags table
    const tagColumns = [
        {
            title: '#',
            key: 'index',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên trường',
            key: 'label',
            dataIndex: 'label',
            render: (text, record) => (
                <div>
                    <Text strong>{text || record.key}</Text>
                    <br />
                    <Text type="secondary" code style={{ fontSize: 11 }}>
                        {record.key}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Loại dữ liệu',
            key: 'dataType',
            dataIndex: 'dataType',
            width: 150,
            render: (value) => (
                <Tag color="blue">{getDataTypeLabel(value)}</Tag>
            ),
        },
    ];

    return (
        <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <div>
                    <Title level={4} style={{ marginBottom: 0 }}>
                        <TagOutlined style={{ marginRight: 8 }} />
                        Tài liệu & Trường thông tin
                    </Title>
                    <Text type="secondary">Trường dữ liệu và tài liệu hợp đồng PDF</Text>
                </div>

                {/* Section 1: PDF Document */}
                {policyData.document?.has_document && (
                    <div>
                        <Text strong>
                            <FilePdfOutlined style={{ marginRight: 6, color: '#ff4d4f' }} />
                            Tài liệu PDF Hợp đồng
                        </Text>
                        <Card size="small" style={{ marginTop: 8, backgroundColor: '#fafafa' }}>
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                {/* Document info */}
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Text type="secondary">Tên tài liệu:</Text>
                                        <br />
                                        <Text strong code style={{ fontSize: 12 }}>
                                            {policyData.document.document_url}
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary">Loại tệp:</Text>
                                        <br />
                                        <Tag color="blue">
                                            {policyData.document.content_type || 'PDF'}
                                        </Tag>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary">Kích thước:</Text>
                                        <br />
                                        <Text strong>
                                            {policyData.document.file_size_bytes
                                                ? `${(policyData.document.file_size_bytes / 1024).toFixed(2)} KB`
                                                : 'N/A'}
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary">Trạng thái:</Text>
                                        <br />
                                        <Tag
                                            color={
                                                policyData.documentValidationStatus === 'passed'
                                                    ? 'green'
                                                    : 'orange'
                                            }
                                        >
                                            {policyData.documentValidationStatus === 'passed'
                                                ? 'Đã xác thực'
                                                : 'Chưa xác thực'}
                                        </Tag>
                                    </Col>
                                </Row>

                                {/* Action button */}
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                            if (policyData.document.presigned_url) {
                                                window.open(policyData.document.presigned_url, '_blank');
                                            }
                                        }}
                                        disabled={!policyData.document.presigned_url}
                                    >
                                        Xem Tài liệu PDF
                                    </Button>
                                    {policyData.document.presigned_url_expiry && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Link hết hạn:{' '}
                                            {new Date(policyData.document.presigned_url_expiry).toLocaleString('vi-VN')}
                                        </Text>
                                    )}
                                </Space>
                            </Space>
                        </Card>
                    </div>
                )}

                <Divider style={{ margin: '8px 0' }} />

                {/* Section 2: Tags/Fields */}
                <div>
                    <Text strong>
                        <TagOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                        Trường thông tin
                        <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>
                            ({tags.length} trường)
                        </Text>
                    </Text>

                    {tags.length === 0 ? (
                        <Empty description="Không có trường thông tin nào" style={{ marginTop: 16 }} />
                    ) : (
                        <CustomTable
                            columns={tagColumns}
                            dataSource={tags}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: false,
                                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} trường`,
                            }}
                            style={{ marginTop: 8 }}
                        />
                    )}
                </div>
            </Space>
        </Card>
    );
};

export default TagsDetail;
