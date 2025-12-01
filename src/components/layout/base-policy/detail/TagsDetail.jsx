import CustomTable from '@/components/custom-table';
import {
    TagOutlined
} from '@ant-design/icons';
import { Card, Descriptions, Empty, Tag, Typography } from 'antd';
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
            <Title level={4}>
                <TagOutlined style={{ marginRight: 8 }} />
                Tài liệu & Trường thông tin
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
                                    {getValidationStatusLabel(policyData.documentValidationStatus) || 'chờ duyệt'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số lượng trường thông tin">
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
