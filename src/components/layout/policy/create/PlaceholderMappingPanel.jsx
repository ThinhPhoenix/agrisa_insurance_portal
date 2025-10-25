import {
    CheckCircleOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    LinkOutlined,
    SyncOutlined
} from '@ant-design/icons';
import {
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Empty,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    message
} from 'antd';
import { useEffect, useState } from 'react';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * Panel để map placeholders trong PDF với tags đã tạo
 */
const PlaceholderMappingPanel = ({
    placeholders = [],
    tags = [],
    onMappingChange,
    onExportSchema
}) => {
    const [mappings, setMappings] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        mapped: 0,
        unmapped: 0
    });

    // Update stats khi mappings thay đổi
    useEffect(() => {
        const mapped = Object.values(mappings).filter(Boolean).length;
        const total = placeholders.length;

        setStats({
            total,
            mapped,
            unmapped: total - mapped
        });
    }, [mappings, placeholders]);

    // Handle mapping change
    const handleMapPlaceholder = (placeholderId, tagId) => {
        const newMappings = {
            ...mappings,
            [placeholderId]: tagId
        };

        setMappings(newMappings);

        // Notify parent
        if (onMappingChange) {
            onMappingChange(newMappings);
        }
    };

    // Auto-map placeholders với tags có cùng index
    const handleAutoMap = () => {
        const newMappings = { ...mappings };
        let autoMappedCount = 0;

        placeholders.forEach(placeholder => {
            if (placeholder.type === 'numbered') {
                // Tìm tag có index matching
                const matchingTag = tags.find(tag =>
                    tag.index === parseInt(placeholder.extractedKey)
                );

                if (matchingTag) {
                    newMappings[placeholder.id] = matchingTag.id;
                    autoMappedCount++;
                }
            }
        });

        setMappings(newMappings);

        if (onMappingChange) {
            onMappingChange(newMappings);
        }

        message.success(`Đã tự động map ${autoMappedCount} placeholders`);
    };

    // Clear all mappings
    const handleClearMappings = () => {
        setMappings({});
        if (onMappingChange) {
            onMappingChange({});
        }
        message.info('Đã xóa tất cả mappings');
    };

    // Export schema
    const handleExportSchema = () => {
        const schema = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            mappings: placeholders.map(ph => {
                const tagId = mappings[ph.id];
                const mappedTag = tags.find(t => t.id === tagId);

                return {
                    placeholder: {
                        id: ph.id,
                        original: ph.original,
                        type: ph.type,
                        extractedKey: ph.extractedKey,
                        position: ph.position
                    },
                    tag: mappedTag ? {
                        id: mappedTag.id,
                        key: mappedTag.key,
                        dataType: mappedTag.dataType,
                        dataTypeLabel: mappedTag.dataTypeLabel,
                        value: mappedTag.value,
                        index: mappedTag.index
                    } : null,
                    mapped: !!tagId
                };
            }),
            stats: {
                totalPlaceholders: stats.total,
                mappedPlaceholders: stats.mapped,
                unmappedPlaceholders: stats.unmapped,
                mappingProgress: stats.total > 0 ? Math.round((stats.mapped / stats.total) * 100) : 0
            }
        };

        // Download JSON file
        const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-schema-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        if (onExportSchema) {
            onExportSchema(schema);
        }

        message.success('Đã export schema thành công');
    };

    // Table columns
    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            key: 'index',
            width: 60,
            render: (_, __, index) => <Text strong>{index + 1}</Text>
        },
        {
            title: 'Placeholder trong PDF',
            dataIndex: 'original',
            key: 'original',
            width: 200,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {text}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        Loại: {record.type}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Map với Tag',
            dataIndex: 'mapping',
            key: 'mapping',
            render: (_, record) => {
                const selectedTagId = mappings[record.id];
                const selectedTag = tags.find(t => t.id === selectedTagId);

                return (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Select
                            placeholder="Chọn tag để map"
                            style={{ width: '100%' }}
                            value={selectedTagId}
                            onChange={(value) => handleMapPlaceholder(record.id, value)}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                        >
                            {tags.map(tag => (
                                <Option key={tag.id} value={tag.id}>
                                    <Space>
                                        <Tag color="green">#{tag.index}</Tag>
                                        <Text strong>{tag.key}</Text>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            ({tag.dataTypeLabel})
                                        </Text>
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                        {selectedTag && (
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                ✓ Mapped: <Text code>{selectedTag.key}</Text>
                            </Text>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (_, record) => {
                const isMapped = !!mappings[record.id];
                return isMapped ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Đã map
                    </Tag>
                ) : (
                    <Tag icon={<ExclamationCircleOutlined />} color="warning">
                        Chưa map
                    </Tag>
                );
            }
        }
    ];

    if (placeholders.length === 0) {
        return (
            <Card>
                <Empty
                    description="Không có placeholders nào được phát hiện"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Text type="secondary">
                        Upload file PDF có chứa placeholders dạng (1), (2)... hoặc {'{{key}}'}
                    </Text>
                </Empty>
            </Card>
        );
    }

    return (
        <Card
            title={
                <Space>
                    <LinkOutlined />
                    <span>Mapping Placeholders với Tags</span>
                    <Badge
                        count={`${stats.mapped}/${stats.total}`}
                        style={{
                            backgroundColor: stats.mapped === stats.total ? '#52c41a' : '#faad14'
                        }}
                    />
                </Space>
            }
            extra={
                <Space>
                    <Tooltip title="Tự động map placeholders với tags có cùng index">
                        <Button
                            icon={<SyncOutlined />}
                            onClick={handleAutoMap}
                            disabled={tags.length === 0}
                        >
                            Auto Map
                        </Button>
                    </Tooltip>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportSchema}
                        disabled={stats.mapped === 0}
                    >
                        Export Schema
                    </Button>
                </Space>
            }
        >
            {/* Stats Alert */}
            <Alert
                message={
                    <Space>
                        <Text strong>Tiến độ mapping:</Text>
                        <Tag color="blue">Tổng: {stats.total}</Tag>
                        <Tag color="green">Đã map: {stats.mapped}</Tag>
                        <Tag color="orange">Chưa map: {stats.unmapped}</Tag>
                        <Text type="secondary">
                            ({stats.total > 0 ? Math.round((stats.mapped / stats.total) * 100) : 0}%)
                        </Text>
                    </Space>
                }
                type={stats.unmapped > 0 ? 'warning' : 'success'}
                showIcon
                style={{ marginBottom: 16 }}
            />

            {/* Mapping Table */}
            <Table
                columns={columns}
                dataSource={placeholders}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
            />

            <Divider />

            {/* Actions */}
            <Space>
                <Button onClick={handleClearMappings} danger>
                    Xóa tất cả mappings
                </Button>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    💡 Tip: Sử dụng "Auto Map" để tự động map placeholders có số index với tags
                </Text>
            </Space>
        </Card>
    );
};

export default PlaceholderMappingPanel;
