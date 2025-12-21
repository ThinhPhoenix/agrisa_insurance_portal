import CustomTable from '@/components/custom-table';
import useDictionary from '@/services/hooks/common/use-dictionary';
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

    // Use dictionary hook
    const dict = useDictionary();
    const { basePolicy: labels } = dict;

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

    // Columns for tags table - using dictionary labels where applicable
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
                <Text strong style={{ color: 'var(--color-primary-700)' }}>
                    {getDataTypeLabel(value)}
                </Text>
            ),
        },
    ];

    return (
        <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Header */}
                <div>
                    <Title level={4} style={{ marginBottom: 4, color: 'var(--color-primary-700)' }}>
                        <TagOutlined style={{ marginRight: 8 }} />
                        Hợp đồng và thẻ tài liệu
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Trường dữ liệu và tài liệu hợp đồng PDF</Text>
                </div>

                {/* Section 1: PDF Document */}
                {policyData.document?.has_document && (
                    <div>
                        <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                            <FilePdfOutlined style={{ marginRight: 6 }} />
                            Tài liệu PDF Hợp đồng
                        </Text>
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{
                            padding: '16px',
                            backgroundColor: 'var(--color-secondary-100)',
                            borderRadius: '6px',
                            border: '1px solid var(--color-secondary-300)',
                        }}>
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                {/* Document info */}
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Tên tài liệu:</Text>
                                        <br />
                                        <Text strong code style={{ fontSize: 12 }}>
                                            {policyData.document.document_url}
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Loại tệp:</Text>
                                        <br />
                                        <Text strong style={{ color: 'var(--color-primary-700)' }}>
                                            {policyData.document.content_type || 'PDF'}
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Kích thước:</Text>
                                        <br />
                                        <Text strong>
                                            {policyData.document.file_size_bytes
                                                ? `${(policyData.document.file_size_bytes / 1024).toFixed(2)} KB`
                                                : 'N/A'}
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{labels.status}:</Text>
                                        <br />
                                        <Tag style={{
                                            backgroundColor: policyData.documentValidationStatus === 'passed'
                                                ? 'var(--color-primary-300)'
                                                : 'var(--color-secondary-400)',
                                            color: policyData.documentValidationStatus === 'passed'
                                                ? 'var(--color-primary-800)'
                                                : 'var(--color-secondary-800)',
                                            border: 'none'
                                        }}>
                                            {policyData.documentValidationStatus === 'passed'
                                                ? 'Đã xác thực'
                                                : 'Chưa xác thực'}
                                        </Tag>
                                    </Col>
                                </Row>

                                {/* Action button */}
                                <Space>
                                    <Button
                                        style={{
                                            backgroundColor: 'var(--color-primary-500)',
                                            borderColor: 'var(--color-primary-500)',
                                            color: 'white'
                                        }}
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
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            Link hết hạn:{' '}
                                            {new Date(policyData.document.presigned_url_expiry).toLocaleString('vi-VN')}
                                        </Text>
                                    )}
                                </Space>
                            </Space>
                        </div>
                    </div>
                )}

                <Divider style={{ margin: '12px 0' }} />

                {/* Section 2: Tags/Fields */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <Text strong style={{ color: 'var(--color-primary-700)', fontSize: '14px' }}>
                            <TagOutlined style={{ marginRight: 6 }} />
                            {labels.documentTags}
                        </Text>
                        <Tag style={{
                            background: 'rgba(199, 230, 215, 0.6)',
                            color: 'var(--color-primary-800)',
                            border: '1px solid rgba(165, 215, 190, 0.4)',
                            backdropFilter: 'blur(8px)',
                            fontWeight: '500',
                        }}>
                            {tags.length} trường
                        </Tag>
                    </div>

                    {tags.length === 0 ? (
                        <Empty description="Không có thẻ tài liệu nào" style={{ marginTop: 16 }} />
                    ) : (
                        <CustomTable
                            columns={tagColumns}
                            dataSource={tags}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: false,
                                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} trường`,
                            }}
                        />
                    )}
                </div>
            </Space>
        </Card>
    );
};

export default TagsDetail;
