import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
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
    Modal,
    Popconfirm,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography,
    message
} from 'antd';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CustomTable from '../../../custom-table';

const { Text, Title } = Typography;

/**
 *  OPTIMIZATION: Separate memoized component for mapping input
 * Strategy: Keep local state for smooth UI + sync to parent with debounce
 */
const MappingInputCell = memo(({
    recordId,
    initialValue,
    onInputChange,
    dataTypeOptions
}) => {
    const [localKey, setLocalKey] = useState(initialValue?.key || '');
    const [localDataType, setLocalDataType] = useState(initialValue?.dataType || dataTypeOptions[0]?.value || 'string');
    const timeoutRef = useRef(null);

    // Sync local state when initialValue.key is cleared (empty string)
    useEffect(() => {
        if (initialValue?.key === '') {
            setLocalKey('');
        }
    }, [initialValue?.key]);

    // Handle key input with debounce
    const handleKeyChange = useCallback((e) => {
        const newValue = e.target.value.toLowerCase();
        setLocalKey(newValue); // Update local immediately for smooth typing

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce parent update
        timeoutRef.current = setTimeout(() => {
            onInputChange(recordId, 'key', newValue);
        }, 300);
    }, [recordId, onInputChange]);

    // Handle dataType change (immediate parent update)
    const handleDataTypeChange = useCallback((val) => {
        setLocalDataType(val);
        onInputChange(recordId, 'dataType', val);
    }, [recordId, onInputChange]);

    //  CRITICAL: Initialize default dataType to parent on mount
    useEffect(() => {
        if (initialValue?.dataType || dataTypeOptions[0]?.value) {
            onInputChange(recordId, 'dataType', initialValue?.dataType || dataTypeOptions[0]?.value || 'string');
        }
    }, []); // Only on mount

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
            <Input
                placeholder="Tên trường (key)"
                value={localKey}
                onChange={handleKeyChange}
                style={{ flex: '0 0 28%', minWidth: 100 }}
                size="middle"
            />

            <Select
                value={localDataType}
                onChange={handleDataTypeChange}
                style={{ flex: '1', minWidth: 100 }}
                size="middle"
                options={dataTypeOptions}
            />
        </div>
    );
});

MappingInputCell.displayName = 'MappingInputCell';

/**
 * Panel để map placeholders trong PDF với tags đã tạo
 */
const PlaceholderMappingPanelComponent = ({
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
        { label: 'Văn bản dài', value: 'textarea' },
        { label: 'Ngày tháng', value: 'date' },
        { label: 'Ngày giờ', value: 'datetime' },
        { label: 'Giờ phút', value: 'time' },
        { label: 'Số nguyên', value: 'integer' },
        { label: 'Số thực', value: 'float' },
    ];

    // Sử dụng tagDataTypes từ prop nếu có, ngược lại dùng default
    const effectiveTagDataTypes = tagDataTypes.length > 0 ? tagDataTypes : defaultTagDataTypes;

    //  OPTIMIZATION: Memoize dataType options to prevent re-creation on every render
    const dataTypeOptions = useMemo(() =>
        effectiveTagDataTypes.map(dt => ({ label: dt.label, value: dt.value })),
        [effectiveTagDataTypes]
    );

    const [mappings, setMappings] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        mapped: 0,
        unmapped: 0
    });
    const [selectedRows, setSelectedRows] = useState([]); // Track selected placeholders
    const [appliedToPDF, setAppliedToPDF] = useState(new Set()); // Track which placeholders are applied to PDF
    const [batchCreatedTags, setBatchCreatedTags] = useState([]); // Track tags created during batch operations

    //  Use tags directly from parent - no need for local cache
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

    // Clear batchCreatedTags once they're included in effectiveTags from parent
    useEffect(() => {
        if (batchCreatedTags.length > 0) {
            // Check if all batch-created tags are now in effectiveTags
            const allSynced = batchCreatedTags.every(batchTag =>
                effectiveTags.some(parentTag => parentTag.id === batchTag.id)
            );

            if (allSynced) {
                setBatchCreatedTags([]); // Clear local cache once parent is synced
            }
        }
    }, [effectiveTags, batchCreatedTags]);

    // Handle mapping change
    //  NEW: Accept optional newTag parameter for immediate mapping
    const handleMapPlaceholder = (placeholderId, tagId, newTag = null) => {
        const newMappings = {
            ...mappings,
            [placeholderId]: tagId
        };

        setMappings(newMappings);

        //  Build and notify parent immediately when mapping changes
        // This ensures documentTagsObject is always up-to-date in tagsData
        if (onMappingChange) {
            //  Build temporary tags array including the new tag if provided
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
            // Mark all as applied to PDF
            const newApplied = new Set(appliedToPDF);
            placeholders.forEach(placeholder => {
                if (mappings[placeholder.id]) {
                    newApplied.add(placeholder.id);
                }
            });
            setAppliedToPDF(newApplied);

            //  Check modified PDF size
            const modifiedSizeMB = result.bytes ? (result.bytes.byteLength / (1024 * 1024)).toFixed(2) : 0;

            if (result.bytes && result.bytes.byteLength > 50 * 1024 * 1024) { // 50MB limit
                message.warning({
                    content: `⚠️ PDF sau chỉnh sửa có kích thước lớn (${modifiedSizeMB} MB). Có thể gây lỗi khi gửi. Hãy thử compress PDF gốc trước khi upload.`,
                    duration: 8
                });
            }

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

    //  OPTIMIZATION: Update tempInputs from MappingInputCell (already debounced in component)
    const handleInputChange = useCallback((id, field, value) => {
        setTempInputs(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), [field]: value }
        }));
    }, []);

    const setTempInput = (id, value) => {
        setTempInputs(prev => ({ ...prev, [id]: value }));
    };

    // ❌ REMOVED: checkTextOverflow, applySingleReplacement, handleApplyClick, applySelectedBatch, applyAllMapped
    // All per-row apply and overflow check logic removed
    // Only applySelectedFillable (fillable AcroForm creation) is now supported

    //  NEW: Delete unmapped placeholder
    const handleDeletePlaceholder = (placeholderId) => {
        // Remove from mappings
        const newMappings = { ...mappings };
        delete newMappings[placeholderId];
        setMappings(newMappings);

        // Remove from selection
        setSelectedRows(prev => prev.filter(id => id !== placeholderId));

        // Notify parent
        if (onMappingChange) {
            const documentTags = {};
            sortedPlaceholders.forEach(placeholder => {
                if (placeholder.id === placeholderId) return; // Skip deleted

                const mappedTagId = newMappings[placeholder.id];
                if (!mappedTagId) return;

                const tag = effectiveTags.find(t => t.id === mappedTagId);
                if (!tag) return;

                documentTags[tag.key] = tag.dataType || 'string';
            });

            onMappingChange(newMappings, {
                documentTagsObject: documentTags
            });
        }

        message.success('Đã xóa vị trí placeholder');
    };

    // NEW: Apply selected fillable fields only
    const applySelectedFillable = async () => {
        if (selectedRows.length === 0) {
            message.warning('Vui lòng chọn ít nhất một vị trí để áp dụng');
            return;
        }

        if (!filePreviewRef?.current?.getCurrentFile) {
            message.warning('Chức năng xuất PDF chưa sẵn sàng');
            return;
        }

        try {
            message.loading('Đang tạo fillable PDF cho các vị trí đã chọn...', 0);

            // Get current PDF file
            const fileResult = filePreviewRef.current.getCurrentFile();
            if (!fileResult || !fileResult.success || !fileResult.file) {
                message.destroy();
                message.error('Không tìm thấy file PDF');
                return;
            }

            const currentFile = fileResult.file;
            const arrayBuffer = await currentFile.arrayBuffer();

            // Import functions
            const { createFillablePDFFromMappings, pdfBytesToFile } = await import('../../../../libs/pdf/pdfEditor');

            // Filter: Only selected placeholders
            const selectedPlaceholders = placeholders.filter(p => selectedRows.includes(p.id));

            // Build mappings for selected (create tags from input if needed)
            const selectedMappings = {};
            const createdTagsInBatch = [];

            for (const rowId of selectedRows) {
                // Check if already mapped
                let tagId = mappings[rowId];
                let tag = tagId ? effectiveTags.find(t => t.id === tagId) : null;

                // If not mapped, create from temp input
                if (!tag) {
                    const local = tempInputs[rowId];

                    if (!local || !local.key || !local.dataType) {
                        continue; // Skip if not filled
                    }

                    // Create new tag
                    const newId = `local-${Date.now()}-${createdTagsInBatch.length}`;
                    const dataTypeLabel = effectiveTagDataTypes.find(t => t.value === local.dataType)?.label || local.dataType;
                    tag = {
                        id: newId,
                        key: local.key,
                        dataType: local.dataType,
                        dataTypeLabel,
                        value: '',
                        index: effectiveTags.length + createdTagsInBatch.length + 1
                    };

                    // Notify parent to add tag
                    if (onCreateTag) {
                        onCreateTag(tag);
                    }

                    // Map placeholder
                    handleMapPlaceholder(rowId, newId, tag);

                    createdTagsInBatch.push(tag);
                    tagId = newId;
                }

                selectedMappings[rowId] = tagId;
            }

            if (Object.keys(selectedMappings).length === 0) {
                message.destroy();
                message.error('Các vị trí đã chọn chưa có thông tin để map');
                return;
            }

            // Update batch created tags state
            if (createdTagsInBatch.length > 0) {
                setBatchCreatedTags(prev => [...prev, ...createdTagsInBatch]);
            }

            // ✅ Merge effectiveTags + createdTagsInBatch để tránh race condition
            const allTagsIncludingNew = [...effectiveTags, ...createdTagsInBatch];
            console.log('🔍 allTagsIncludingNew for fillable PDF:', allTagsIncludingNew);

            // ✅ Create fillable AcroForm fields directly (no text writing layer)
            const result = await createFillablePDFFromMappings(
                arrayBuffer,   // Original PDF without text modifications
                selectedPlaceholders,
                selectedMappings,
                allTagsIncludingNew,
                {
                    fillFields: true,              // Pre-fill with ASCII-safe tag.key
                    makeFieldsEditable: true,      // Editable for backend
                    showBorders: true,             // Show field borders
                    removeOriginalText: true,      // Remove placeholder background text
                    writeTextBeforeField: false,   // No text writing layer
                }
            );

            message.destroy();

            if (result.warnings && result.warnings.length > 0) {
                Modal.warning({
                    title: 'Có một số cảnh báo khi tạo fillable PDF',
                    content: (
                        <div>
                            <ul>
                                {result.warnings.map((w, i) => (
                                    <li key={i}>{w.fieldName}: {w.warning}</li>
                                ))}
                            </ul>
                        </div>
                    ),
                });
            }

            // Convert to File object
            const fillableFile = pdfBytesToFile(result.pdfBytes, currentFile.name);

            // ✅ Update FileUploadPreview to show fillable PDF in iframe
            if (filePreviewRef?.current?.updateFillablePDF) {
                await filePreviewRef.current.updateFillablePDF(fillableFile, result.pdfBytes);
            }

            // Build document_tags for backend (only selected)
            const documentTags = {};
            selectedPlaceholders.forEach(placeholder => {
                const tagId = selectedMappings[placeholder.id];
                if (tagId) {
                    // ✅ FIX: Search in merged tags (including newly created)
                    const tag = allTagsIncludingNew.find(t => t.id === tagId);
                    if (tag) {
                        documentTags[tag.key] = tag.dataType || 'string';
                    }
                }
            });

            // Notify parent to update state with fillable PDF
            if (onMappingChange) {
                onMappingChange(mappings, {
                    documentTagsObject: documentTags,
                    modifiedPdfBytes: result.pdfBytes,
                    uploadedFile: fillableFile,
                });
            }

            // Mark applied to PDF
            const newApplied = new Set(appliedToPDF);
            selectedRows.forEach(id => newApplied.add(id));
            setAppliedToPDF(newApplied);

            message.success(`Đã tạo fillable PDF với ${Object.keys(selectedMappings).length} field(s)!`);

            // Clear selection after apply
            setSelectedRows([]);

        } catch (error) {
            message.destroy();
            console.error('Error creating fillable PDF:', error);
            message.error(`Lỗi khi tạo fillable PDF: ${error.message}`);
        }
    };


    // NEW: Export fillable PDF (download only)
    const exportFillablePDF = async () => {
        if (!filePreviewRef?.current?.getCurrentFile) {
            message.warning('Chức năng xuất PDF chưa sẵn sàng');
            return;
        }

        try {
            message.loading('Đang tạo fillable PDF...', 0);

            // Get current PDF file
            const fileResult = filePreviewRef.current.getCurrentFile();
            if (!fileResult || !fileResult.success || !fileResult.file) {
                message.destroy();
                message.error('Không tìm thấy file PDF');
                return;
            }

            const currentFile = fileResult.file;

            // Read file as ArrayBuffer
            const arrayBuffer = await currentFile.arrayBuffer();

            // Import the createFillablePDFFromMappings function
            const { createFillablePDFFromMappings, downloadPDF } = await import('../../../../libs/pdf/pdfEditor');

            if (stats.mapped === 0) {
                message.destroy();
                message.error('Chưa có mapping nào để tạo fillable PDF');
                return;
            }

            // Create fillable PDF
            const result = await createFillablePDFFromMappings(
                arrayBuffer,
                placeholders,
                mappings,
                effectiveTags,
                {
                    fillFields: false,        // Don't fill fields with default values
                    makeFieldsEditable: true, // Make fields editable
                    showBorders: true,        // Show field borders
                }
            );

            message.destroy();

            if (result.warnings && result.warnings.length > 0) {
                Modal.warning({
                    title: 'Có một số cảnh báo khi tạo fillable PDF',
                    content: (
                        <div>
                            <ul>
                                {result.warnings.map((w, i) => (
                                    <li key={i}>{w.fieldName}: {w.warning}</li>
                                ))}
                            </ul>
                        </div>
                    ),
                });
            }

            // Download the fillable PDF
            const filename = `fillable_${currentFile.name}`;
            downloadPDF(result.pdfBytes, filename);

            message.success('Đã tạo và tải xuống fillable PDF thành công!');

        } catch (error) {
            message.destroy();
            console.error('Error creating fillable PDF:', error);
            message.error(`Lỗi khi tạo fillable PDF: ${error.message}`);
        }
    };

    // Row selection removed - no longer needed with fillable PDF workflow

    //  OPTIMIZATION: Memoize columns to prevent re-creation on every render
    const columns = useMemo(() => [
        {
            title: 'Vị trí',
            dataIndex: 'original',
            key: 'original',
            width: 30,
            render: (text, record) => (
                <Tag color={record.isManual ? "orange" : "blue"} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {text}
                </Tag>
            )
        },
        {
            title: 'Map với Tag',
            dataIndex: 'mapping',
            key: 'mapping',
            render: (_, record) => {
                const selectedTagId = mappings[record.id];
                const isApplied = appliedToPDF.has(record.id);
                const isMapped = !!mappings[record.id];

                // Check both effectiveTags (from parent) and batchCreatedTags (local state)
                const selectedTag = effectiveTags.find(t => t.id === selectedTagId) ||
                    batchCreatedTags.find(t => t.id === selectedTagId);

                const local = tempInputs[record.id] || { key: '', dataType: effectiveTagDataTypes?.[0]?.value || 'string' };

                // CRITICAL: If applied to PDF, ALWAYS show tag view (never show input)
                if (isApplied) {
                    if (selectedTag) {
                        return (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Text strong style={{ display: 'block' }}>{selectedTag.key}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{selectedTag.dataTypeLabel}</Text>
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        // Applied but tag not found yet - show temp data from input
                        return (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Text strong style={{ display: 'block' }}>{local.key || 'Tag đã áp dụng'}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{local.dataType ? effectiveTagDataTypes.find(t => t.value === local.dataType)?.label : 'Đang tải...'}</Text>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                }

                // If mapped but not applied, show tag view
                if (selectedTag) {
                    return (
                        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Text strong style={{ display: 'block' }}>{selectedTag.key}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{selectedTag.dataTypeLabel}</Text>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Not mapped and not applied - show input form
                //  OPTIMIZATION: Use MappingInputCell with internal state to prevent Vietnamese IME lag
                const initialValue = tempInputs[record.id] || { key: '', dataType: effectiveTagDataTypes?.[0]?.value || 'string' };

                return (
                    <MappingInputCell
                        recordId={record.id}
                        initialValue={initialValue}
                        onInputChange={handleInputChange}
                        dataTypeOptions={dataTypeOptions}
                    />
                );
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 60,
            fixed: 'right',
            align: 'center',
            render: (_, record) => {
                const isApplied = appliedToPDF.has(record.id);
                const isMapped = !!mappings[record.id];

                if (isApplied) {
                    return (
                        <Tag icon={<CheckCircleOutlined />} color="success">
                            Đã áp dụng
                        </Tag>
                    );
                }

                if (isMapped) {
                    return (
                        <Tag icon={<CheckCircleOutlined />} color="processing">
                            Đã map
                        </Tag>
                    );
                }

                return (
                    <Tag icon={<ExclamationCircleOutlined />} color="warning">
                        Chưa map
                    </Tag>
                );
            }
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 40,
            fixed: 'right',
            align: 'center',
            render: (_, record) => {
                const isApplied = appliedToPDF.has(record.id);
                const isMapped = !!mappings[record.id];

                // Can only delete if not applied to PDF yet
                if (isApplied) {
                    return (
                        <Tooltip title="Không thể xóa vị trí đã áp dụng vào PDF">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                disabled
                                danger
                                size="small"
                            />
                        </Tooltip>
                    );
                }

                return (
                    <Popconfirm
                        title="Xóa vị trí placeholder?"
                        description={isMapped ? "Vị trí này đã được map. Bạn có chắc muốn xóa?" : "Bạn có chắc muốn xóa vị trí này?"}
                        onConfirm={() => handleDeletePlaceholder(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa vị trí placeholder">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                danger
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                );
            }
        }
    ], [mappings, appliedToPDF, batchCreatedTags, effectiveTags, tempInputs, effectiveTagDataTypes, handleInputChange, dataTypeOptions, handleDeletePlaceholder]);

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
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={applySelectedFillable}
                        disabled={selectedRows.length === 0}
                        size="middle"
                    >
                        Áp dụng ({selectedRows.length} vị trí)
                    </Button>
                    <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        onClick={exportFillablePDF}
                        disabled={stats.mapped === 0}
                        size="middle"
                    >
                        Tải xuống PDF
                    </Button>
                </Space>
            }
        >
            {/* Info Alert - Rules */}
            <Alert
                message={
                    <div>
                        <Text strong>
                            <InfoCircleOutlined /> Hướng dẫn sử dụng:
                        </Text>
                        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                            <li><strong>Bước 1:</strong> Điền tên trường (key) và chọn loại dữ liệu cho từng vị trí (1), (2)...</li>
                            <li><strong>Bước 2:</strong> Tick chọn các vị trí muốn áp dụng (có thể tick nhiều vị trí cùng lúc)</li>
                            <li><strong>Bước 3:</strong> Bấm nút <strong>"Áp dụng"</strong> để tạo fillable PDF cho các vị trí đã chọn</li>
                            <li><strong>Bước 4:</strong> Bấm <strong>"Tải xuống PDF"</strong> để xem trước fillable PDF cuối cùng</li>
                            <li><Text type="warning">⚠️ Lưu ý:</Text> Checkbox sẽ enable khi đã điền đủ thông tin (key + loại dữ liệu)</li>
                        </ul>
                    </div>
                }
                type="info"
                showIcon
                closable
                style={{ marginBottom: 16 }}
            />

            {/* Stats Alert */}
            <Alert
                message={
                    <Space>
                        <Text strong>Tiến độ:</Text>
                        <Tag color="blue">Vị trí: {stats.total}</Tag>
                        <Tag color="green">Đã map: {stats.mapped}</Tag>
                        <Tag color="orange">Chưa map: {stats.unmapped}</Tag>
                        <Tag color="success">Đã áp dụng PDF: {appliedToPDF.size}</Tag>
                        <Text type="secondary">
                            Áp dụng: {stats.total > 0 ? Math.round((appliedToPDF.size / stats.total) * 100) : 0}%
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
                rowSelection={{
                    selectedRowKeys: selectedRows,
                    onChange: (selectedRowKeys) => {
                        setSelectedRows(selectedRowKeys);
                    },
                    getCheckboxProps: (record) => {
                        // ✅ DISABLE khi đã áp dụng vào PDF
                        if (appliedToPDF.has(record.id)) {
                            return {
                                disabled: true,
                            };
                        }

                        // Enable khi:
                        // 1. Đã có mapping (tag đã tạo)
                        // 2. HOẶC đã điền input (key + dataType)
                        const hasMappedTag = !!mappings[record.id];
                        const hasInput = tempInputs[record.id]?.key && tempInputs[record.id]?.dataType;

                        return {
                            disabled: !hasMappedTag && !hasInput,
                        };
                    },
                }}
            />

            <Divider />
        </Card>
    );
};

// OPTIMIZATION: Wrap with memo to prevent unnecessary re-renders
const PlaceholderMappingPanel = memo(PlaceholderMappingPanelComponent);
PlaceholderMappingPanel.displayName = 'PlaceholderMappingPanel';

export default PlaceholderMappingPanel;
