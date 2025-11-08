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
    filePreviewRef  //  NEW - to call applyReplacements
}) => {
    // Định nghĩa rõ các loại dữ liệu theo quy định
    const defaultTagDataTypes = [
        { label: 'Chuỗi/Text', value: 'string' },
        { label: 'Văn bản dài', value: 'long_string' },
        { label: 'Ngày tháng', value: 'date' },
        { label: 'Ngày giờ', value: 'datetime' },
        { label: 'Giờ phút', value: 'time' },
        { label: 'Số nguyên', value: 'integer' },
        { label: 'Số thực', value: 'float' },
    ];

    // Sử dụng tagDataTypes từ prop nếu có, ngược lại dùng default
    const effectiveTagDataTypes = tagDataTypes.length > 0 ? tagDataTypes : defaultTagDataTypes;
    const [mappings, setMappings] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        mapped: 0,
        unmapped: 0
    });

    // ✅ Use tags directly from parent - no need for local cache
    // Parent state (use-policy.js) is the single source of truth
    const effectiveTags = tags || [];

    // Sort placeholders by position (1), (2), (3)...
    const sortedPlaceholders = [...placeholders].sort((a, b) => {
        const aMatch = a.original.match(/\((\d+)\)/);
        const bMatch = b.original.match(/\((\d+)\)/);
        if (aMatch && bMatch) {
            return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        return a.original.localeCompare(b.original);
    });

    // Update stats khi mappings thay đổi
    useEffect(() => {
        const mapped = Object.values(mappings).filter(Boolean).length;
        const total = sortedPlaceholders.length;

        setStats({
            total,
            mapped,
            unmapped: total - mapped
        });
    }, [mappings, sortedPlaceholders]);

    // Handle mapping change
    // ✅ NEW: Accept optional newTag parameter for immediate mapping
    const handleMapPlaceholder = (placeholderId, tagId, newTag = null) => {
        const newMappings = {
            ...mappings,
            [placeholderId]: tagId
        };

        setMappings(newMappings);

        //  Build and notify parent immediately when mapping changes
        // This ensures documentTagsObject is always up-to-date in tagsData
        if (onMappingChange) {
            // ✅ Build temporary tags array including the new tag if provided
            const tagsToUse = newTag ? [...effectiveTags, newTag] : effectiveTags;

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

                if (!mappedTagId) {
                    return;
                }

                const tag = tagsToUse.find(t => t.id === mappedTagId);

                if (!tag) {
                    console.warn(`⚠️ Tag not found for id: ${mappedTagId}`);
                    return;
                }

                documentTags[tag.key] = tag.dataType || 'string';
            });

            console.log('🔍 handleMapPlaceholder - documentTags:', documentTags);

            // Notify parent with mappings + documentTagsObject
            onMappingChange(newMappings, {
                documentTagsObject: documentTags
            });
        }
    };

    //  Build document_tags object for BE submission
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

        return documentTags;
    };

    //  Apply mapping to PDF - NEW
    const applyMappingToPDF = async () => {
        if (!filePreviewRef?.current?.applyReplacements) {
            message.warning('Chức năng chỉnh sửa PDF chưa sẵn sàng');
            return;
        }

        // Build replacement instructions from current mappings
        const replacements = [];

        placeholders.forEach(placeholder => {
            const tagId = mappings[placeholder.id];

            if (!tagId) {
                return; // Skip unmapped placeholders
            }

            //  Use effectiveTags (fallback to localTags if parent tags empty)
            const tag = effectiveTags.find(t => t.id === tagId);

            if (!tag) {
                return;
            }

            // Calculate appropriate font size (80% of original, 8-10pt range)
            const originalFontSize = placeholder.fontSize || 12;
            const adjustedFontSize = Math.max(8, Math.min(10, originalFontSize * 0.8));

            // Build replacement instruction
            replacements.push({
                page: placeholder.page || 1,
                x: placeholder.x,
                y: placeholder.y,
                width: placeholder.width,
                height: placeholder.height,
                backgroundX: placeholder.backgroundX,  //  NEW: Exact position of (number) for accurate centering
                backgroundWidth: placeholder.backgroundWidth,  //  NEW: Exact width of (number) for accurate centering
                oldText: placeholder.fullText || placeholder.original,  //  Use fullText like "______(1)______"
                newText: tag.key,                   //  Just tag key (no underscores)
                fontSize: adjustedFontSize          //  8-10pt range
            });
        });

        if (replacements.length === 0) {
            message.error({
                content: ' Chưa có mapping nào để áp dụng. Vui lòng map placeholders với tags trước!',
                duration: 5
            });
            return;
        }

        // Apply to PDF via ref
        const result = await filePreviewRef.current.applyReplacements(replacements);

        if (result.success) {
            //  Check modified PDF size
            const modifiedSizeMB = result.bytes ? (result.bytes.byteLength / (1024 * 1024)).toFixed(2) : 0;

            if (result.bytes && result.bytes.byteLength > 50 * 1024 * 1024) { // 50MB limit
                message.warning({
                    content: `⚠️ PDF sau chỉnh sửa có kích thước lớn (${modifiedSizeMB} MB). Có thể gây lỗi khi gửi. Hãy thử compress PDF gốc trước khi upload.`,
                    duration: 8
                });
            }

            message.success({
                content: ` Đã thay thế ${replacements.length} placeholders trong PDF!`,
                duration: 5
            });

            //  Build and notify parent about document_tags and modified PDF
            const documentTags = buildDocumentTags();
            if (onMappingChange) {
                onMappingChange(mappings, {
                    documentTagsObject: documentTags,
                    modifiedPdfBytes: result.bytes, // Pass modified PDF bytes from FileUploadPreview
                    uploadedFile: result.file // Pass updated file object
                });
            }
        } else {
            message.error(`Lỗi: ${result.error}`);
        }
    };

    const [tempInputs, setTempInputs] = useState({});

    const setTempInput = (id, value) => {
        setTempInputs(prev => ({ ...prev, [id]: value }));
    };

    //  NEW: Apply single placeholder replacement (for inline creation)
    const applySingleReplacement = async (placeholderId, tagIdOrTag) => {
        if (!filePreviewRef?.current?.applyReplacements) {
            return;
        }

        const placeholder = placeholders.find(p => p.id === placeholderId);
        if (!placeholder) {
            return;
        }

        // Accept either tagId (string) or tag object directly
        const tag = typeof tagIdOrTag === 'string'
            ? effectiveTags.find(t => t.id === tagIdOrTag)
            : tagIdOrTag;

        if (!tag) {
            return;
        }

        // Calculate appropriate font size (80% of original for better fit)
        const originalFontSize = placeholder.fontSize || 12;
        const adjustedFontSize = Math.max(8, Math.min(10, originalFontSize * 0.8));

        const replacement = {
            page: placeholder.page || 1,
            x: placeholder.x,
            y: placeholder.y,
            width: placeholder.width,
            height: placeholder.height,
            backgroundX: placeholder.backgroundX,  //  NEW: Exact position of (number) for accurate centering
            backgroundWidth: placeholder.backgroundWidth,  //  NEW: Exact width of (number) for accurate centering
            oldText: placeholder.fullText || placeholder.original,  //  Use fullText like "______(1)______"
            newText: tag.key, //  Use tag.key directly (match PDF format)
            fontSize: adjustedFontSize  //  8-10pt range
        };

        const result = await filePreviewRef.current.applyReplacements([replacement]);

        if (result.success) {
            message.success(`Đã thay thế "${placeholder.original}" thành "${tag.key}"!`);
        } else {
            message.error(`Lỗi: ${result.error}`);
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
                    <Tag color={record.isManual ? "orange" : "blue"} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
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

                const local = tempInputs[record.id] || { key: '', dataType: effectiveTagDataTypes?.[0]?.value || 'string' };

                // Use flex layout so controls scale and the row remains aligned regardless of text length
                return (
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
                        {selectedTag ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Text strong style={{ display: 'block' }}>{selectedTag.key}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{selectedTag.dataTypeLabel}</Text>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Input
                                    placeholder="Tên trường (key)"
                                    value={local.key}
                                    onChange={(e) => setTempInput(record.id, { ...local, key: e.target.value.toLowerCase() })}
                                    // make input occupy ~1/3 of the Map cell so it's not overly wide
                                    style={{ flex: '0 0 28%', minWidth: 100 }}
                                    size="middle"
                                />

                                <Select
                                    value={local.dataType}
                                    onChange={(val) => setTempInput(record.id, { ...local, dataType: val })}
                                    style={{ flex: '0 0 20%', minWidth: 100 }}
                                    size="middle"
                                    options={effectiveTagDataTypes.map(dt => ({ label: dt.label, value: dt.value }))}
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
                                        const dataTypeLabel = effectiveTagDataTypes.find(t => t.value === local.dataType)?.label || local.dataType;
                                        const newTag = {
                                            id: newId,
                                            key: local.key,
                                            dataType: local.dataType,
                                            dataTypeLabel,
                                            value: '',
                                            index: effectiveTags.length + 1
                                        };

                                        // 1. Notify parent FIRST to add tag with proper ID
                                        if (onCreateTag) {
                                            onCreateTag(newTag);
                                        }

                                        //  2. Map placeholder with tag - ✅ Pass newTag to avoid race condition
                                        handleMapPlaceholder(record.id, newId, newTag);

                                        //  3. Auto-replace on PDF (realtime!) - Pass tag object directly
                                        await applySingleReplacement(record.id, newTag);

                                        //  4. Clear temp input
                                        setTempInput(record.id, { key: '', dataType: effectiveTagDataTypes?.[0]?.value || 'string' });
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
                dataSource={sortedPlaceholders}
                rowKey="id"
                pagination={false}
                scroll={{ x: tableX, y: 400 }}
            />

            <Divider />
        </Card>
    );
};

export default PlaceholderMappingPanel;
