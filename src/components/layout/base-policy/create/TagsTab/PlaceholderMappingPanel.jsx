import {
    getPdfError,
    getPdfSuccess,
    getPdfWarning,
    getPlaceholderError,
    getPlaceholderSuccess,
    getTagsWarning
} from '@/libs/message';
import {
    CheckCircleOutlined,
    DeleteOutlined,
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
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import CustomTable from '../../../../custom-table';

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
                style={{ flex: '1', maxWidth: 150 }}
                size="middle"
            />

            <Select
                value={localDataType}
                onChange={handleDataTypeChange}
                style={{ flex: '1', maxWidth: 150 }}
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
const PlaceholderMappingPanelComponent = forwardRef(({
    placeholders = [],
    tags = [],
    tagDataTypes = [],
    initialMappings = {},  // 🆕 Receive mappings from parent (tagsData.mappings)
    onCreateTag,
    onMappingChange,
    onExportSchema,
    filePreviewRef,  //  NEW - to call applyReplacements
    onSelectedRowsChange,
    onDeletePlaceholder  // 🆕 Callback to notify parent to remove placeholder
}, ref) => {
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

    // 🔍 Debug: Track component lifecycle
    useEffect(() => {
        console.log('🎬 PlaceholderMappingPanel MOUNTED');
        return () => {
            console.log('💀 PlaceholderMappingPanel UNMOUNTED');
        };
    }, []);

    // 🔍 Debug: Track mappings state changes
    useEffect(() => {
        console.log('🗺️ Mappings state changed:', {
            keys: Object.keys(mappings),
            count: Object.keys(mappings).length,
            mappings
        });
    }, [mappings]);

    // 🆕 Sync initialMappings from parent into local state
    useEffect(() => {
        if (initialMappings && Object.keys(initialMappings).length > 0) {
            console.log('🔄 Syncing initialMappings from parent:', {
                initialMappings,
                currentMappings: mappings
            });
            setMappings(prevMappings => ({
                ...prevMappings,
                ...initialMappings
            }));
        }
    }, [initialMappings]);

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
                    console.warn(`Tag not found for id: ${mappedTagId}`);
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
                    content: ` PDF sau chỉnh sửa có kích thước lớn (${modifiedSizeMB} MB). Có thể gây lỗi khi gửi. Hãy thử compress PDF gốc trước khi upload.`,
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

    //  NEW: Delete placeholder and rebuild PDF
    const handleDeletePlaceholder = async (placeholderId) => {
        console.log('🗑️ handleDeletePlaceholder:', {
            placeholderId,
            appliedToPDFBefore: Array.from(appliedToPDF),
            mappingsBefore: mappings,
            mappingsKeys: Object.keys(mappings)
        });

        // Remove from mappings
        const newMappings = { ...mappings };
        delete newMappings[placeholderId];
        setMappings(newMappings);

        // Remove from applied set
        const newApplied = new Set(appliedToPDF);
        newApplied.delete(placeholderId);
        setAppliedToPDF(newApplied);

        // Remove from selection
        setSelectedRows(prev => prev.filter(id => id !== placeholderId));

        // ✅ In manual scan workflow, every placeholder has AcroForm immediately when created
        // So we always need to rebuild PDF when deleting (not just when wasApplied)
        const isMapped = !!mappings[placeholderId];

        if (isMapped && filePreviewRef?.current?.getOriginalFile) {
            try {
                console.log('🔨 Starting rebuild process...');
                message.loading('Đang rebuild PDF...', 0);

                // Get ORIGINAL PDF file (before any modifications)
                const fileResult = filePreviewRef.current.getOriginalFile();
                if (!fileResult || !fileResult.success || !fileResult.file) {
                    message.destroy();
                    message.error(getPdfError('FILE_NOT_FOUND'));
                    return;
                }

                const originalFile = fileResult.file;
                const arrayBuffer = await originalFile.arrayBuffer();

                // Import function - use pdfAcroFormEditor for manual scan workflow
                const { createFillablePDFFromMappings } = await import('../../../../../libs/pdf/pdfAcroFormEditor');
                const { pdfBytesToFile } = await import('../../../../../libs/pdf/pdfFormHelper');

                // ✅ FIX: Keep ALL placeholders except deleted one for form field creation
                const remainingPlaceholders = placeholders.filter(p => p.id !== placeholderId);

                // ✅ CRITICAL FIX: Build mappings for ALL remaining placeholders that have mappings
                // In manual scan workflow, every field is created immediately, so we rebuild with all remaining mapped fields
                const remainingMappings = {};
                remainingPlaceholders.forEach(p => {
                    // Include if: placeholder has mapping in newMappings
                    if (newMappings[p.id]) {
                        remainingMappings[p.id] = newMappings[p.id];
                    }
                });

                console.log('🔍 Rebuild analysis:', {
                    deletedId: placeholderId,
                    totalPlaceholders: placeholders.length,
                    remainingPlaceholdersCount: remainingPlaceholders.length,
                    appliedBeforeDelete: Array.from(appliedToPDF),
                    newAppliedSet: Array.from(newApplied),
                    allMappingsKeys: Object.keys(newMappings),
                    remainingAppliedMappingsKeys: Object.keys(remainingMappings),
                    remainingMappings: remainingMappings,
                    willRebuild: Object.keys(remainingMappings).length > 0 ? 'YES - with remaining fields' : 'NO - revert to original'
                });

                if (Object.keys(remainingMappings).length === 0) {
                    // No more applied placeholders, revert to original PDF
                    console.log('✅ No remaining mappings, reverting to original PDF');
                    console.log('📦 Original file info:', {
                        name: originalFile.name,
                        size: originalFile.size,
                        type: originalFile.type
                    });

                    // ✅ CRITICAL FIX: Create a completely fresh File from arrayBuffer
                    // to ensure we're reverting to TRUE original (not fillable PDF)
                    const freshOriginalFile = new File([arrayBuffer], originalFile.name, {
                        type: 'application/pdf',
                        lastModified: Date.now()
                    });

                    // Reload original PDF
                    if (filePreviewRef?.current?.updateFillablePDF) {
                        console.log('📄 Calling updateFillablePDF with fresh original file');
                        // Use fresh file from original arrayBuffer
                        await filePreviewRef.current.updateFillablePDF(freshOriginalFile, new Uint8Array(arrayBuffer));
                        console.log('✅ updateFillablePDF completed');
                    }

                    message.destroy();
                    message.success(getPlaceholderSuccess('DELETED') + ' - ' + getPdfSuccess('REBUILT'));

                    // 🆕 Notify parent to remove from placeholders array (AFTER PDF update)
                    if (onDeletePlaceholder) {
                        onDeletePlaceholder(placeholderId);
                    }
                } else {
                    // Rebuild PDF with remaining applied placeholders only
                    // Note: remainingMappings already built above with only applied placeholders

                    // Merge effectiveTags + batchCreatedTags
                    const allTagsIncludingNew = [...effectiveTags, ...batchCreatedTags];

                    console.log('🔨 Rebuilding PDF with:', {
                        totalPlaceholders: remainingPlaceholders.length,
                        appliedPlaceholders: Object.keys(remainingMappings).length,
                        remainingMappings: remainingMappings,
                        deletedId: placeholderId
                    });

                    // ✅ CRITICAL: Rebuild fillable PDF with remaining fields only
                    // Start from original PDF to ensure deleted fields are gone
                    const result = await createFillablePDFFromMappings(
                        arrayBuffer, // Original PDF
                        remainingPlaceholders, // Only create form fields for remaining placeholders
                        remainingMappings, // Only map remaining placeholders
                        allTagsIncludingNew, // All tags including newly created
                        {
                            fillFields: true, // Fill with default value (field name)
                            makeFieldsEditable: true, // Keep editable
                            showBorders: true, // Show field borders
                            removeOriginalText: true // Remove placeholder text from PDF
                        }
                    );

                    console.log('✅ createFillablePDFFromMappings completed, pdfBytes length:', result.pdfBytes?.length);

                    // Convert to File
                    const fillableFile = pdfBytesToFile(result.pdfBytes, originalFile.name);
                    console.log('📄 Converted to file:', fillableFile.name, fillableFile.size);

                    // Update preview
                    if (filePreviewRef?.current?.updateFillablePDF) {
                        console.log('📄 Calling updateFillablePDF with rebuilt PDF');
                        await filePreviewRef.current.updateFillablePDF(fillableFile, result.pdfBytes);
                        console.log('✅ updateFillablePDF completed');
                    }

                    message.destroy();
                    message.success(getPlaceholderSuccess('DELETED') + ' - ' + getPdfSuccess('REBUILT'));

                    // 🆕 Notify parent to remove from placeholders array (AFTER PDF update)
                    if (onDeletePlaceholder) {
                        onDeletePlaceholder(placeholderId);
                    }
                }

            } catch (error) {
                message.destroy();
                message.error(getPdfError('REBUILD_FAILED'));
                console.error('[PlaceholderMapping] Error rebuilding PDF:', error);
            }
        } else {
            message.success(getPlaceholderSuccess('DELETED'));

            // 🆕 Notify parent to remove from placeholders array (not applied case)
            if (onDeletePlaceholder) {
                onDeletePlaceholder(placeholderId);
            }
        }


        if (onMappingChange) {
            const documentTags = {};

            // Use placeholders array and explicitly filter out the deleted one
            const remainingPlaceholders = placeholders.filter(p => p.id !== placeholderId);

            remainingPlaceholders.forEach(placeholder => {
                const mappedTagId = newMappings[placeholder.id];
                if (!mappedTagId) return; // Skip unmapped placeholders

                const tag = effectiveTags.find(t => t.id === mappedTagId);
                if (!tag) return; // Skip if tag not found

                documentTags[tag.key] = tag.dataType || 'string';
            });

            onMappingChange(newMappings, {
                documentTagsObject: documentTags,
                shouldOverwriteDocumentTags: true // ✅ Flag: overwrite instead of merge when deleting
            });
        }
    };

    // NEW: Apply selected fillable fields only
    const applySelectedFillable = async () => {
        console.log('🔧 applySelectedFillable called:', {
            selectedRows,
            currentMappings: mappings,
            currentMappingsKeys: Object.keys(mappings)
        });

        if (selectedRows.length === 0) {
            message.warning(getPlaceholderError('NO_PLACEHOLDER_SELECTED'));
            return;
        }

        if (!filePreviewRef?.current?.getCurrentFile) {
            message.warning(getPdfError('PREVIEW_UNAVAILABLE'));
            return;
        }

        try {
            // Get current PDF file
            const fileResult = filePreviewRef.current.getCurrentFile();
            if (!fileResult || !fileResult.success || !fileResult.file) {
                message.error(getPdfError('FILE_NOT_FOUND'));
                return;
            }

            const currentFile = fileResult.file;
            const arrayBuffer = await currentFile.arrayBuffer();

            // Import functions - use pdfAcroFormEditor for manual scan workflow
            const { createFillablePDFFromMappings } = await import('../../../../../libs/pdf/pdfAcroFormEditor');
            const { pdfBytesToFile } = await import('../../../../../libs/pdf/pdfFormHelper');

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

                    // ❌ DON'T call handleMapPlaceholder here - it updates state in loop
                    // We'll update all mappings at once later
                    // handleMapPlaceholder(rowId, newId, tag);

                    createdTagsInBatch.push(tag);
                    tagId = newId;
                }

                selectedMappings[rowId] = tagId;
            }

            // ✅ CRITICAL FIX: Update mappings state ONCE with all new mappings
            // Build complete updated mappings object
            const updatedMappingsForState = { ...mappings };
            for (const rowId of selectedRows) {
                if (selectedMappings[rowId]) {
                    updatedMappingsForState[rowId] = selectedMappings[rowId];
                }
            }

            // Update state once (React will batch this)
            setMappings(updatedMappingsForState);

            console.log('🔄 Updated mappings state:', {
                oldKeys: Object.keys(mappings),
                newKeys: Object.keys(updatedMappingsForState),
                selectedKeys: Object.keys(selectedMappings)
            });

            if (Object.keys(selectedMappings).length === 0) {
                message.error(getTagsWarning('NO_MAPPING'));
                return;
            }

            // Update batch created tags state
            if (createdTagsInBatch.length > 0) {
                setBatchCreatedTags(prev => [...prev, ...createdTagsInBatch]);
            }

            //  Merge effectiveTags + createdTagsInBatch để tránh race condition
            const allTagsIncludingNew = [...effectiveTags, ...createdTagsInBatch];
            console.log('🔍 allTagsIncludingNew for fillable PDF:', allTagsIncludingNew);

            // Create fillable AcroForm fields
            const result = await createFillablePDFFromMappings(
                arrayBuffer, // Original PDF
                selectedPlaceholders, // Selected placeholders to create fields
                selectedMappings, // Mappings for selected placeholders
                allTagsIncludingNew, // All tags including newly created
                {
                    fillFields: true, // Fill with default value (field name)
                    makeFieldsEditable: true, // Keep editable
                    showBorders: true, // Show field borders
                    removeOriginalText: true // Remove placeholder text from PDF
                }
            );

            if (result.warnings && result.warnings.length > 0) {
                Modal.warning({
                    title: getPdfWarning('MODIFIED_PDF_LARGE').split('.')[0],
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

            //  Update FileUploadPreview to show fillable PDF in iframe
            if (filePreviewRef?.current?.updateFillablePDF) {
                await filePreviewRef.current.updateFillablePDF(fillableFile, result.pdfBytes);
            }

            // Build document_tags for backend (only selected)
            const documentTags = {};
            selectedPlaceholders.forEach(placeholder => {
                const tagId = selectedMappings[placeholder.id];
                if (tagId) {
                    //  FIX: Search in merged tags (including newly created)
                    const tag = allTagsIncludingNew.find(t => t.id === tagId);
                    if (tag) {
                        console.log(`🏷️ Adding to documentTags: "${tag.key}" = "${tag.dataType}"`, tag);
                        documentTags[tag.key] = tag.dataType || 'string';
                    }
                }
            });

            console.log('📦 Final documentTags object (MUST be { key: dataTypeValue }):', documentTags);

            console.log('📦 Final mappings to send to parent:', {
                oldMappings: Object.keys(mappings),
                updatedMappingsForState: Object.keys(updatedMappingsForState),
                selectedMappings: Object.keys(selectedMappings)
            });

            // Notify parent to update state with fillable PDF
            // Use updatedMappingsForState (already built above)
            if (onMappingChange) {
                onMappingChange(updatedMappingsForState, {
                    documentTagsObject: documentTags,
                    modifiedPdfBytes: result.pdfBytes,
                    uploadedFile: fillableFile,
                });
            }

            // Mark applied to PDF
            const newApplied = new Set(appliedToPDF);
            selectedRows.forEach(id => newApplied.add(id));
            setAppliedToPDF(newApplied);

            // Clear selection after apply
            setSelectedRows([]);

        } catch (error) {
            console.error('[PlaceholderMapping] Error creating fillable PDF:', error);
            message.error(getPdfError('FILLABLE_CREATION_FAILED'));
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
            title: 'Tên trường',
            dataIndex: 'mappedKey',
            key: 'mappedKey',
            render: (text, record) => {
                // Display field name if mapped
                if (record.mappedKey) {
                    return <Text strong>{record.mappedKey}</Text>;
                }
                return <Text type="secondary">Chưa có</Text>;
            }
        },
        {
            title: 'Loại dữ liệu',
            dataIndex: 'mappedDataType',
            key: 'mappedDataType',
            render: (text, record) => {
                // Display data type label if mapped
                if (record.mappedDataType) {
                    const dataTypeObj = effectiveTagDataTypes.find(t => t.value === record.mappedDataType);
                    const label = dataTypeObj?.label || record.mappedDataType;
                    return <Text type="secondary">{String(label)}</Text>;
                }
                return <Text type="secondary">Chưa có</Text>;
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

                // Build appropriate warning message
                let description = "Bạn có chắc muốn xóa vị trí này?";
                if (isApplied) {
                    description = "Vị trí này đã được áp dụng vào PDF. Xóa sẽ rebuild PDF và loại bỏ form field này. Bạn có chắc muốn xóa?";
                } else if (isMapped) {
                    description = "Vị trí này đã được map. Bạn có chắc muốn xóa?";
                }

                return (
                    <Popconfirm
                        title="Xóa vị trí placeholder?"
                        description={description}
                        onConfirm={() => handleDeletePlaceholder(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title={isApplied ? "Xóa và rebuild PDF" : "Xóa vị trí placeholder"}>
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

    // Notify parent when selectedRows changes
    useEffect(() => {
        onSelectedRowsChange?.(selectedRows.length);
    }, [selectedRows, onSelectedRowsChange]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        applySelectedFillable,
        selectedRows
    }));

    if (placeholders.length === 0) {
        return (
            <Card>
                <Empty
                    description="Không có vị trí nào được phát hiện"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Text type="secondary">
                        Tải lên file PDF có chứa vị trí dạng (1), (2)... hoặc {'{{key}}'}
                    </Text>
                </Empty>
            </Card>
        );
    }

    // NEW: Clear all placeholders and revert to original PDF
    const handleClearAll = async () => {
        try {
            console.log('🗑️ Clearing all placeholders and reverting to original PDF');
            message.loading('Đang xóa tất cả và khôi phục PDF gốc...', 0);

            // Get original PDF
            if (!filePreviewRef?.current?.getOriginalFile) {
                message.destroy();
                message.error('Không thể truy cập file PDF gốc');
                return;
            }

            const fileResult = filePreviewRef.current.getOriginalFile();
            if (!fileResult || !fileResult.success || !fileResult.file) {
                message.destroy();
                message.error(getPdfError('FILE_NOT_FOUND'));
                return;
            }

            const originalFile = fileResult.file;
            const arrayBuffer = await originalFile.arrayBuffer();

            // Create fresh file from original
            const freshOriginalFile = new File([arrayBuffer], originalFile.name, {
                type: 'application/pdf',
                lastModified: Date.now()
            });

            // Clear all local state
            setMappings({});
            setAppliedToPDF(new Set());
            setSelectedRows([]);
            setBatchCreatedTags([]);
            setTempInputs({});

            // Reload original PDF in preview
            if (filePreviewRef?.current?.updateFillablePDF) {
                await filePreviewRef.current.updateFillablePDF(freshOriginalFile, new Uint8Array(arrayBuffer));
            }

            // Notify parent to clear all placeholders
            if (onDeletePlaceholder) {
                // Delete all placeholders one by one
                placeholders.forEach(p => onDeletePlaceholder(p.id));
            }

            // Notify parent to reset tagsData
            if (onMappingChange) {
                onMappingChange({}, {
                    documentTagsObject: {},
                    shouldOverwriteDocumentTags: true,
                    modifiedPdfBytes: new Uint8Array(arrayBuffer),
                    uploadedFile: freshOriginalFile
                });
            }

            message.destroy();
            message.success('Đã xóa hết và khôi phục PDF gốc thành công');
        } catch (error) {
            message.destroy();
            message.error('Lỗi khi xóa hết: ' + error.message);
            console.error('❌ Error clearing all:', error);
        }
    };

    return (
        <Card
            title={
                <Space>
                    <LinkOutlined />
                    <span>Liên kết Vị trí với Trường thông tin</span>
                    <Badge
                        count={`${stats.mapped}/${stats.total}`}
                        style={{
                            backgroundColor: stats.mapped === stats.total ? '#52c41a' : '#faad14'
                        }}
                    />
                </Space>
            }
            extra={
                placeholders.length > 0 && (
                    <Popconfirm
                        title="Xóa hết trường thông tin?"
                        description="Thao tác này sẽ xóa tất cả các trường đã tạo và khôi phục PDF về trạng thái gốc. Bạn có chắc chắn?"
                        onConfirm={handleClearAll}
                        okText="Xóa hết"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="default"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            Xóa hết
                        </Button>
                    </Popconfirm>
                )
            }
        >
            {/* Info Alert - Rules */}
            <Alert
                message={
                    <div>
                        <Text strong>
                            <InfoCircleOutlined /> Bảng danh sách trường đã tạo
                        </Text>
                        <div style={{ marginTop: 8 }}>
                            Bảng này hiển thị các trường thông tin đã được tạo qua chế độ quét.
                            Sử dụng nút <strong>"Chế độ quét"</strong> bên trái để thêm trường mới.
                        </div>
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
                        <Text strong>Thống kê:</Text>
                        <Tag color="blue">Tổng số trường: {stats.total}</Tag>
                        <Tag color="success">Đã áp dụng vào PDF: {appliedToPDF.size}</Tag>
                        <Text type="secondary">
                            Tiến độ: {stats.total > 0 ? Math.round((appliedToPDF.size / stats.total) * 100) : 0}%
                        </Text>
                    </Space>
                }
                type={appliedToPDF.size === stats.total && stats.total > 0 ? 'success' : 'info'}
                showIcon
                style={{ marginBottom: 16 }}
            />

            {/* Mapping Table (display-only, no selection) */}
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
});

PlaceholderMappingPanelComponent.displayName = 'PlaceholderMappingPanel';

export default PlaceholderMappingPanelComponent;
