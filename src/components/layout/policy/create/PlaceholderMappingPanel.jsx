import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LinkOutlined
} from '@ant-design/icons';
import {
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Empty,
    Input,
    Select,
    Space,
    Tag,
    Typography,
    message
} from 'antd';
import { useEffect, useState } from 'react';
import CustomTable from '../../../custom-table';

const { Text, Title } = Typography;

/**
 * Panel để map placeholders trong PDF với tags đã tạo
 */
const PlaceholderMappingPanel = ({
    placeholders = [],
    tags = [],
    tagDataTypes = [],
    onCreateTag,
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

    const [tempInputs, setTempInputs] = useState({});

    const setTempInput = (id, value) => {
        setTempInputs(prev => ({ ...prev, [id]: value }));
    };

    // Table columns
    const columns = [
        {
            title: 'Vị trí',
            dataIndex: 'original',
            key: 'original',
            width: 30,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {text}
                    </Tag>
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

                const local = tempInputs[record.id] || { key: '', dataType: tagDataTypes?.[0]?.value || 'string' };

                // Use flex layout so controls scale and the row remains aligned regardless of text length
                return (
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
                        {selectedTag ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Text strong style={{ display: 'block' }}>{selectedTag.key}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{selectedTag.dataTypeLabel}</Text>
                                </div>

                                <div style={{ flex: '0 0 auto' }}>
                                    <Button size="small" onClick={() => handleMapPlaceholder(record.id, null)} danger>Unmap</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="Tên trường (key)"
                                    value={local.key}
                                    onChange={(e) => setTempInput(record.id, { ...local, key: e.target.value })}
                                    // make input occupy ~1/3 of the Map cell so it's not overly wide
                                    style={{ flex: '0 0 28%', minWidth: 100 }}
                                    size="middle"
                                />

                                <Select
                                    value={local.dataType}
                                    onChange={(val) => setTempInput(record.id, { ...local, dataType: val })}
                                    style={{ flex: '0 0 20%', minWidth: 100 }}
                                    size="middle"
                                    options={(tagDataTypes || []).map(dt => ({ label: dt.label, value: dt.value }))}
                                />

                                <Button
                                    type="primary"
                                    size="middle"
                                    onClick={async () => {
                                        if (!local.key || !local.dataType) {
                                            message.warning('Vui lòng nhập tên trường và chọn loại dữ liệu');
                                            return;
                                        }

                                        const newId = `local-${Date.now()}`;
                                        const dataTypeLabel = tagDataTypes.find(t => t.value === local.dataType)?.label || local.dataType;
                                        const newTag = {
                                            id: newId,
                                            key: local.key,
                                            dataType: local.dataType,
                                            dataTypeLabel,
                                            value: '',
                                            index: tags.length + 1
                                        };

                                        if (onCreateTag) {
                                            onCreateTag(newTag);
                                        }

                                        handleMapPlaceholder(record.id, newId);
                                    }}
                                >
                                    Áp dụng
                                </Button>
                            </>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 50,
            fixed: 'right',
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

    // compute horizontal scroll width (fallback)
    const tableX = Math.max(900, columns.reduce((acc, c) => acc + (c.width || 200), 0));

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

            {/* Mapping Table (custom for horizontal overflow and fixed status column) */}
            <CustomTable
                columns={columns}
                dataSource={placeholders}
                rowKey="id"
                pagination={false}
                scroll={{ x: tableX, y: 400 }}
            />

            <Divider />
        </Card>
    );
};

export default PlaceholderMappingPanel;
