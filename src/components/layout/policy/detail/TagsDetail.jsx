import CustomTable from '@/components/custom-table';
import contractTemplate from '@/libs/mockdata/contract-template.json';
import {
    DownloadOutlined,
    FileTextOutlined,
    FullscreenOutlined,
    PrinterOutlined,
    TagOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Modal, Row, Space, Tag, Typography, message } from 'antd';
import React from 'react';
import ContractPreview from '../ContractPreview';

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
        return tag.value;
    };

    // Use contract-template.json data instead of policyData.tags
    const tags = contractTemplate.tags || [];

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
        <>
            <Row gutter={[16, 16]}>
                {/* Tags Table */}
                <Col xs={24} lg={12}>
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
                            <CustomTable
                                columns={tagColumns}
                                dataSource={tags}
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: false,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tags`,
                                }}
                            />
                        )}
                    </Card>
                </Col>

                {/* Contract Preview */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<FullscreenOutlined />}
                                    onClick={() => setPreviewFullscreen(true)}
                                >
                                    Xem toàn màn hình
                                </Button>
                            </div>
                        }
                        size="small"
                        bodyStyle={{ padding: 0 }}
                    >
                        <div style={{ height: 'calc(100vh - 200px)' }}>
                            <ContractPreview
                                tagsData={contractTemplate}
                                isFullscreen={false}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Fullscreen Preview Modal */}
            <Modal
                open={previewFullscreen}
                onCancel={() => setPreviewFullscreen(false)}
                width="100%"
                style={{ top: 0, paddingBottom: 0, maxWidth: '100vw' }}
                bodyStyle={{ height: 'calc(100vh - 110px)', padding: 0, overflow: 'auto' }}
                closable={false}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Space>
                            <FileTextOutlined />
                            <span>Hợp đồng Mẫu - Toàn màn hình</span>
                        </Space>
                        <Space>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={() => message.info('Chức năng xuất PDF sẽ được triển khai sau')}
                            >
                                Xuất PDF
                            </Button>
                            <Button
                                icon={<PrinterOutlined />}
                                onClick={() => window.print()}
                            >
                                In ấn
                            </Button>
                            <Button onClick={() => setPreviewFullscreen(false)}>
                                Đóng
                            </Button>
                        </Space>
                    </div>
                }
                footer={null}
            >
                <ContractPreview tagsData={contractTemplate} isFullscreen={true} />
            </Modal>
        </>
    );
};

export default TagsDetail;
