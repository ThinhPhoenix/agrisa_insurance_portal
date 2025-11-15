import CustomTable from '@/components/custom-table';
import {
    DownloadOutlined,
    FileTextOutlined,
    FullscreenOutlined,
    PrinterOutlined,
    TagOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Empty, Modal, Row, Space, Tag, Typography, message } from 'antd';
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
        {
            title: 'Giá trị',
            key: 'value',
            render: (_, record) => (
                <Text>{formatTagValue(record)}</Text>
            ),
        },
    ];

    return (
        <Card>
            <Title level={4}>
                <TagOutlined style={{ marginRight: 8 }} />
                Tags & Metadata
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>
                    ({tags.length} trường)
                </Text>
            </Title>

            {tags.length === 0 ? (
                <Empty description="Không có tags nào được thêm" />
            ) : (
                <>
                    <CustomTable
                        columns={tagColumns}
                        dataSource={tags}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tags`,
                        }}
                    />

                    <Card
                        title="Thông tin tài liệu"
                        style={{ marginTop: 16 }}
                        type="inner"
                    >
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="URL tài liệu mẫu" span={2}>
                                <Text code>{policyData.templateDocumentUrl || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái xác thực">
                                <Tag color={policyData.documentValidationStatus === 'approved' ? 'green' : 'orange'}>
                                    {policyData.documentValidationStatus || 'pending'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số lượng tags">
                                <Text strong>{tags.length}</Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </>
            )}
        </Card>
    );
};

export default TagsDetail;
