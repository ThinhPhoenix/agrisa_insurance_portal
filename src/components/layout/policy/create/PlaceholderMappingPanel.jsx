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
    onExportSchema,
    filePreviewRef  // ✅ NEW - to call applyReplacements
}) => {
    const [mappings, setMappings] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        mapped: 0,
        unmapped: 0
    });

    // ✅ Local tags cache - Fix Tags count = 0 issue
    const [localTags, setLocalTags] = useState([]);

    // Sync localTags với tags prop
    useEffect(() => {
        if (tags && tags.length > 0) {
            setLocalTags(tags);
            console.log('🔄 Synced localTags with tags prop:', tags.length);
        }
    }, [tags]);

    // Combined tags: Use localTags as fallback if parent tags empty
    const effectiveTags = tags.length > 0 ? tags : localTags;

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

        // ✅ Build and notify parent immediately when mapping changes
        // This ensures documentTagsObject is always up-to-date in tagsData
        if (onMappingChange) {
            // Build documentTags from new mappings
            const documentTags = {};
            const sortedPlaceholders = [...placeholders].sort((a, b) => {
                const aMatch = a.original.match(/\((\d+)\)/);
                const bMatch = b.original.match(/\((\d+)\)/);
                if (aMatch && bMatch) {
                    return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                }
                return a.original.localeCompare(b.original);
            });

            sortedPlaceholders.forEach(placeholder => {
                const mappedTagId = newMappings[placeholder.id];
                console.log(`  🔍 Placeholder ${placeholder.id} (${placeholder.original}): tagId =`, mappedTagId);

                if (!mappedTagId) {
                    console.log(`    ⚠️ Skipped - No mapping`);
                    return;
                }

                const tag = effectiveTags.find(t => t.id === mappedTagId);
                console.log(`    🔍 Found tag:`, tag);

                if (!tag) {
                    console.log(`    ❌ Skipped - Tag not found in effectiveTags`);
                    return;
                }

                documentTags[tag.key] = tag.dataType || 'string';
                console.log(`    ✅ Added to documentTags: "${tag.key}" = "${tag.dataType}"`);
            });

            console.log('📋 Updated document_tags (realtime):', documentTags);
            console.log('📊 Total tags in documentTags:', Object.keys(documentTags).length);

            // Notify parent with mappings + documentTagsObject
            onMappingChange(newMappings, {
                documentTagsObject: documentTags
            });
        }
    };

    // ✅ Build document_tags object for BE submission
    const buildDocumentTags = () => {
        const documentTags = {};

        // Sort placeholders by original text to maintain order (1), (2), (3)...
        const sortedPlaceholders = [...placeholders].sort((a, b) => {
            // Extract number from placeholder like "(1)", "(2)"
            const aMatch = a.original.match(/\((\d+)\)/);
            const bMatch = b.original.match(/\((\d+)\)/);

            if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }

            // Fallback: alphabetical sort
            return a.original.localeCompare(b.original);
        });

        // Build tags object in order
        sortedPlaceholders.forEach(placeholder => {
            const tagId = mappings[placeholder.id];
            if (!tagId) return; // Skip unmapped

            const tag = effectiveTags.find(t => t.id === tagId);
            if (!tag) return;

            // Add to document_tags with key from tag.key and data type from tag.dataType
            // Format: { "họ và tên": "string", "tuổi": "int" }
            documentTags[tag.key] = tag.dataType || 'string';
        });

        console.log('📋 Built document_tags:', documentTags);
        return documentTags;
    };

    // ✅ Apply mapping to PDF - NEW
    const applyMappingToPDF = async () => {
        if (!filePreviewRef?.current?.applyReplacements) {
            message.warning('Chức năng chỉnh sửa PDF chưa sẵn sàng');
            return;
        }

        // 🔍 DEBUG: Log state before building replacements
        console.log('🔍 DEBUG - Apply Mapping to PDF:');
        console.log('  - Placeholders count:', placeholders.length);
        console.log('  - Placeholders:', placeholders);
        console.log('  - Tags (prop) count:', tags.length);
        console.log('  - Tags (prop):', tags);
        console.log('  - LocalTags count:', localTags.length);
        console.log('  - LocalTags:', localTags);
        console.log('  - EffectiveTags count:', effectiveTags.length);
        console.log('  - EffectiveTags:', effectiveTags);
        console.log('  - Mappings:', mappings);
        console.log('  - Stats:', stats);

        // Build replacement instructions from current mappings
        const replacements = [];

        placeholders.forEach(placeholder => {
            const tagId = mappings[placeholder.id];
            console.log(`  - Checking placeholder ${placeholder.id}: tagId =`, tagId);

            if (!tagId) {
                console.log(`    ⚠️ No tagId for placeholder ${placeholder.id}`);
                return; // Skip unmapped placeholders
            }

            // ✅ Use effectiveTags (fallback to localTags if parent tags empty)
            const tag = effectiveTags.find(t => t.id === tagId);
            console.log(`    - Found tag (from effectiveTags):`, tag);

            if (!tag) {
                console.log(`    ⚠️ No tag found for tagId ${tagId} in effectiveTags`);
                return;
            }

            // Build replacement instruction
            replacements.push({
                page: placeholder.page || 1,
                x: placeholder.x,
                y: placeholder.y,
                width: placeholder.width,
                height: placeholder.height,
                oldText: placeholder.original,      // e.g., "____(1)____"
                newText: `____${tag.key}____`,     // e.g., "____Họ và tên____"
                fontSize: 12
            });
            console.log(`    ✅ Added replacement: "${placeholder.original}" → "____${tag.key}____"`);
        });

        console.log('📊 Total replacements built:', replacements.length);
        console.log('📤 Replacements array:', replacements);

        if (replacements.length === 0) {
            message.error({
                content: '❌ Chưa có mapping nào để áp dụng. Vui lòng map placeholders với tags trước!',
                duration: 5
            });
            return;
        }

        console.log('📤 Sending replacements to PDF editor...');

        // Apply to PDF via ref
        const result = await filePreviewRef.current.applyReplacements(replacements);

        if (result.success) {
            message.success({
                content: `✅ Đã thay thế ${replacements.length} placeholders trong PDF!`,
                duration: 5
            });

            // ✅ Build and notify parent about document_tags and modified PDF
            const documentTags = buildDocumentTags();
            if (onMappingChange) {
                onMappingChange(mappings, {
                    documentTagsObject: documentTags,
                    modifiedPdfBytes: result.bytes, // Pass modified PDF bytes from FileUploadPreview
                    uploadedFile: result.file // Pass updated file object
                });
            }
        } else {
            message.error(`❌ Lỗi: ${result.error}`);
        }
    };

    const [tempInputs, setTempInputs] = useState({});

    const setTempInput = (id, value) => {
        setTempInputs(prev => ({ ...prev, [id]: value }));
    };

    // ✅ NEW: Apply single placeholder replacement (for inline creation)
    const applySingleReplacement = async (placeholderId, tagIdOrTag) => {
        if (!filePreviewRef?.current?.applyReplacements) {
            console.warn('⚠️ applyReplacements not available');
            return;
        }

        const placeholder = placeholders.find(p => p.id === placeholderId);
        if (!placeholder) {
            console.error('❌ Placeholder not found:', placeholderId);
            return;
        }

        // Accept either tagId (string) or tag object directly
        const tag = typeof tagIdOrTag === 'string'
            ? effectiveTags.find(t => t.id === tagIdOrTag)
            : tagIdOrTag;

        if (!tag) {
            console.error('❌ Tag not found:', tagIdOrTag);
            return;
        }

        console.log('🚀 Auto-replacing single placeholder:', placeholder.original, '→', tag.key);

        const replacement = {
            page: placeholder.page || 1,
            x: placeholder.x,
            y: placeholder.y,
            width: placeholder.width,
            height: placeholder.height,
            oldText: placeholder.original,
            newText: tag.key, // ✅ Use tag.key directly (match PDF format)
            fontSize: 12
        };

        const result = await filePreviewRef.current.applyReplacements([replacement]);

        if (result.success) {
            message.success(`✅ Đã thay thế "${placeholder.original}" thành "${tag.key}"!`);
        } else {
            message.error(`❌ Lỗi: ${result.error}`);
        }
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
                const selectedTag = effectiveTags.find(t => t.id === selectedTagId);

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
                                            index: effectiveTags.length + 1
                                        };

                                        console.log('🆕 Creating inline tag:', newTag);

                                        // ✅ 1. Save to localTags (immediate)
                                        setLocalTags(prev => {
                                            const updated = [...prev, newTag];
                                            console.log('💾 Saved to localTags, total:', updated.length);
                                            return updated;
                                        });

                                        // ✅ 2. Notify parent (may not update immediately)
                                        if (onCreateTag) {
                                            onCreateTag(newTag);
                                        }

                                        // ✅ 3. Map placeholder with tag
                                        handleMapPlaceholder(record.id, newId);

                                        // ✅ 4. Auto-replace on PDF (realtime!) - Pass tag object directly
                                        console.log('🔄 Triggering auto-replace for', record.id);
                                        await applySingleReplacement(record.id, newTag);

                                        // ✅ 5. Clear temp input
                                        setTempInput(record.id, { key: '', dataType: tagDataTypes?.[0]?.value || 'string' });
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
            extra={
                <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={applyMappingToPDF}
                    disabled={stats.mapped === 0}
                    size="middle"
                >
                    Áp dụng lên PDF ({stats.mapped})
                </Button>
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
