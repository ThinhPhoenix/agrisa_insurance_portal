import {
    CheckCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    LinkOutlined,
    WarningOutlined
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
        { label: 'Văn bản dài', value: 'textarea' },
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

    const setTempInput = (id, value) => {
        setTempInputs(prev => ({ ...prev, [id]: value }));
    };

    //  NEW: Check if text will overflow field (conservative check)
    const checkTextOverflow = (text, fieldWidth, fontSize = 10) => {
        // Approximate: 1 character ≈ 0.7 * fontSize
        const estimatedTextWidth = text.length * fontSize * 0.7;

        // Very conservative: warn if text > 40% of fieldWidth
        // This accounts for dots/underscores taking up space
        const safeFieldWidth = fieldWidth * 0.4;

        return {
            willOverflow: estimatedTextWidth > safeFieldWidth,
            estimatedTextWidth,
            fieldWidth,
            safeFieldWidth,
            overflow: Math.max(0, estimatedTextWidth - safeFieldWidth)
        };
    };

    //  NEW: Apply single placeholder replacement (for inline creation)
    const applySingleReplacement = async (placeholderId, tagIdOrTag, skipWarning = false) => {
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

        // Calculate appropriate font size
        const originalFontSize = placeholder.fontSize || 12;
        const adjustedFontSize = Math.max(8, Math.min(10, originalFontSize * 0.8));

        //  Check if text will overflow
        const overflowCheck = checkTextOverflow(tag.key, placeholder.width, adjustedFontSize);

        console.log(`🔍 Overflow check for "${tag.key}":`, {
            textLength: tag.key.length,
            fieldWidth: placeholder.width,
            fontSize: adjustedFontSize,
            ...overflowCheck
        });

        if (!skipWarning && overflowCheck.willOverflow) {
            console.log(`⚠️ Showing overflow warning modal for "${tag.key}"`);

            // Show warning modal
            Modal.confirm({
                title: 'Nội dung có thể vượt quá kích thước ô trống',
                icon: <WarningOutlined style={{ color: '#faad14' }} />,
                content: (
                    <div>
                        <p>Văn bản <strong>"{tag.key}"</strong> có thể vượt quá kích thước ô trống <strong>{placeholder.original}</strong></p>
                        <ul>
                            <li>Độ rộng văn bản (ước tính): ~{overflowCheck.estimatedTextWidth.toFixed(0)}px</li>
                            <li>Độ rộng field an toàn: ~{overflowCheck.safeFieldWidth.toFixed(0)}px</li>
                            <li>Vượt quá: ~{overflowCheck.overflow.toFixed(0)}px</li>
                        </ul>
                        <Alert
                            message="Bạn có muốn tiếp tục áp dụng? Text có thể làm vỡ bố cục file PDF."
                            type="warning"
                            showIcon
                        />
                    </div>
                ),
                okText: 'Chấp nhận và áp dụng',
                cancelText: 'Hủy và điều chỉnh lại',
                onOk: () => {
                    // Retry with skipWarning = true
                    applySingleReplacement(placeholderId, tagIdOrTag, true);
                },
                onCancel: () => {
                    //  Unmapping to allow re-input
                    console.log(`🔙 User cancelled - unmapping placeholder ${placeholderId}`);

                    // Remove mapping
                    const newMappings = { ...mappings };
                    delete newMappings[placeholderId];
                    setMappings(newMappings);

                    // Remove tag from parent
                    if (onMappingChange) {
                        const documentTags = buildDocumentTags();
                        // Remove this tag from documentTags
                        delete documentTags[tag.key];

                        onMappingChange(newMappings, {
                            documentTagsObject: documentTags
                        });
                    }

                    // Clear temp input
                    setTempInput(placeholderId, { key: '', dataType: effectiveTagDataTypes?.[0]?.value || 'string' });

                    message.info('Đã hủy mapping. Vui lòng nhập lại.');
                }
            });
            return;
        }

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
            // Mark as applied to PDF
            setAppliedToPDF(prev => new Set([...prev, placeholderId]));
        } else {
            message.error(`Lỗi: ${result.error}`);
        }
    };

    //  NEW: Apply selected placeholders in batch
    const applySelectedBatch = async () => {
        if (selectedRows.length === 0) {
            message.warning('Vui lòng chọn ít nhất một vị trí để áp dụng');
            return;
        }

        if (!filePreviewRef?.current?.applyReplacements) {
            message.warning('Chức năng chỉnh sửa PDF chưa sẵn sàng');
            return;
        }

        const replacements = [];
        const appliedIds = [];
        const createdTagsInBatch = []; // Track newly created tags in this batch

        // Process each selected placeholder
        for (let i = 0; i < selectedRows.length; i++) {
            const placeholderId = selectedRows[i];
            const placeholder = placeholders.find(p => p.id === placeholderId);

            if (!placeholder) continue;

            // Check if already mapped
            let tagId = mappings[placeholderId];
            let tag = tagId ? effectiveTags.find(t => t.id === tagId) : null;
            let newlyCreatedTag = null;

            // If not mapped, prepare tag data from temp input
            if (!tag) {
                const local = tempInputs[placeholderId];

                if (!local || !local.key || !local.dataType) {
                    continue; // Skip if not filled
                }

                // Prepare new tag (but don't create yet)
                const dataTypeLabel = effectiveTagDataTypes.find(t => t.value === local.dataType)?.label || local.dataType;
                tag = {
                    key: local.key,
                    dataType: local.dataType,
                    dataTypeLabel,
                    value: ''
                };
                newlyCreatedTag = tag;
            }

            const originalFontSize = placeholder.fontSize || 12;
            const adjustedFontSize = Math.max(8, Math.min(10, originalFontSize * 0.8));

            // Check overflow
            const overflowCheck = checkTextOverflow(tag.key, placeholder.width, adjustedFontSize);

            if (overflowCheck.willOverflow) {
                // Show warning and wait for user decision
                const userContinues = await new Promise((resolve) => {
                    Modal.confirm({
                        title: 'Nội dung có thể vượt quá kích thước ô trống',
                        icon: <WarningOutlined style={{ color: '#faad14' }} />,
                        content: (
                            <div>
                                <p>Đang áp dụng: <strong>{replacements.length + 1}/{selectedRows.length}</strong></p>
                                <p>Văn bản <strong>"{tag.key}"</strong> có thể vượt quá ô trống <strong>{placeholder.original}</strong></p>
                                <ul>
                                    <li>Độ rộng văn bản: ~{overflowCheck.estimatedTextWidth.toFixed(0)}px</li>
                                    <li>Độ rộng an toàn: ~{overflowCheck.safeFieldWidth.toFixed(0)}px</li>
                                    <li>Vượt quá: ~{overflowCheck.overflow.toFixed(0)}px</li>
                                </ul>
                                <Alert message="Text có thể làm vỡ bố cục PDF." type="warning" showIcon />
                                <Alert message={`Còn ${selectedRows.length - replacements.length - 1} vị trí.`} type="info" showIcon style={{ marginTop: 8 }} />
                            </div>
                        ),
                        okText: 'Tiếp tục',
                        cancelText: 'Dừng lại',
                        onOk: () => resolve(true),
                        onCancel: () => resolve(false)
                    });
                });

                if (!userContinues) {
                    message.info(`Đã dừng. Đã áp dụng ${replacements.length} vị trí.`);
                    break; // Stop here - tag won't be created
                }
            }

            // NOW create tag and map (after user confirmed or no overflow)
            if (newlyCreatedTag) {
                const newId = `local-${Date.now()}-${replacements.length}`;
                const fullTag = {
                    id: newId,
                    ...newlyCreatedTag,
                    index: effectiveTags.length + createdTagsInBatch.length + 1
                };

                // Notify parent to add tag
                if (onCreateTag) {
                    onCreateTag(fullTag);
                }

                // Map placeholder
                handleMapPlaceholder(placeholderId, newId, fullTag);

                // Track this tag locally (don't update state here - batch update later)
                createdTagsInBatch.push(fullTag);

                tag = fullTag; // Update tag reference
            }            // Add to replacements
            replacements.push({
                page: placeholder.page || 1,
                x: placeholder.x,
                y: placeholder.y,
                width: placeholder.width,
                height: placeholder.height,
                backgroundX: placeholder.backgroundX,
                backgroundWidth: placeholder.backgroundWidth,
                oldText: placeholder.fullText || placeholder.original,
                newText: tag.key,
                fontSize: adjustedFontSize
            });
            appliedIds.push(placeholderId);
        }

        if (replacements.length === 0) {
            message.warning('Không có vị trí nào để áp dụng. Vui lòng điền thông tin cho các vị trí đã chọn.');
            return;
        }

        // Update state with all created tags at once
        if (createdTagsInBatch.length > 0) {
            setBatchCreatedTags(prev => [...prev, ...createdTagsInBatch]);
        }

        // Apply all collected replacements
        const result = await filePreviewRef.current.applyReplacements(replacements);

        if (result.success) {
            const newApplied = new Set(appliedToPDF);
            appliedIds.forEach(id => newApplied.add(id));
            setAppliedToPDF(newApplied);

            message.success(`Đã áp dụng ${replacements.length} vị trí vào PDF!`);
            setSelectedRows([]);
        } else {
            message.error(`Lỗi: ${result.error}`);
        }
    };

    //  NEW: Apply all mapped placeholders
    const applyAllMapped = async () => {
        if (!filePreviewRef?.current?.applyReplacements) {
            message.warning('Chức năng chỉnh sửa PDF chưa sẵn sàng');
            return;
        }

        const replacements = [];
        const appliedIds = [];
        const createdTagsInBatch = []; // Track newly created tags in this batch

        // Process ALL placeholders (create tag if needed)
        for (let i = 0; i < sortedPlaceholders.length; i++) {
            const placeholder = sortedPlaceholders[i];
            const placeholderId = placeholder.id;

            // Check if already mapped
            let tagId = mappings[placeholderId];
            let tag = tagId ? effectiveTags.find(t => t.id === tagId) : null;

            // If not mapped, try to create from temp input
            if (!tag) {
                const local = tempInputs[placeholderId];

                if (!local || !local.key || !local.dataType) {
                    continue; // Skip if not filled
                }

                // Create new tag
                const newId = `local-${Date.now()}-${replacements.length}`;
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
                handleMapPlaceholder(placeholderId, newId, tag);

                // Track this tag locally (don't update state here - batch update later)
                createdTagsInBatch.push(tag);
            }

            const originalFontSize = placeholder.fontSize || 12;
            const adjustedFontSize = Math.max(8, Math.min(10, originalFontSize * 0.8));

            // Check overflow
            const overflowCheck = checkTextOverflow(tag.key, placeholder.width, adjustedFontSize);

            if (overflowCheck.willOverflow) {
                // Show warning and wait for user decision
                const userContinues = await new Promise((resolve) => {
                    Modal.confirm({
                        title: 'Nội dung có thể vượt quá kích thước ô trống',
                        icon: <WarningOutlined style={{ color: '#faad14' }} />,
                        content: (
                            <div>
                                <p>Đang áp dụng: <strong>{i + 1}/{allMappedIds.length}</strong></p>
                                <p>Văn bản <strong>"{tag.key}"</strong> có thể vượt quá ô trống <strong>{placeholder.original}</strong></p>
                                <ul>
                                    <li>Độ rộng văn bản: ~{overflowCheck.estimatedTextWidth.toFixed(0)}px</li>
                                    <li>Độ rộng an toàn: ~{overflowCheck.safeFieldWidth.toFixed(0)}px</li>
                                    <li>Vượt quá: ~{overflowCheck.overflow.toFixed(0)}px</li>
                                </ul>
                                <Alert message="Text có thể làm vỡ bố cục PDF." type="warning" showIcon />
                                <Alert message={`Còn ${allMappedIds.length - i - 1} vị trí.`} type="info" showIcon style={{ marginTop: 8 }} />
                            </div>
                        ),
                        okText: 'Tiếp tục',
                        cancelText: 'Dừng lại',
                        onOk: () => resolve(true),
                        onCancel: () => resolve(false)
                    });
                });

                if (!userContinues) {
                    message.info(`Đã dừng. Đã áp dụng ${replacements.length} vị trí.`);
                    break; // Stop here
                }
            }

            // Add to replacements
            replacements.push({
                page: placeholder.page || 1,
                x: placeholder.x,
                y: placeholder.y,
                width: placeholder.width,
                height: placeholder.height,
                backgroundX: placeholder.backgroundX,
                backgroundWidth: placeholder.backgroundWidth,
                oldText: placeholder.fullText || placeholder.original,
                newText: tag.key,
                fontSize: adjustedFontSize
            });
            appliedIds.push(placeholderId);
        }

        if (replacements.length === 0) {
            message.warning('Không có vị trí nào để áp dụng. Vui lòng điền thông tin cho các vị trí trước.');
            return;
        }

        // Update state with all created tags at once
        if (createdTagsInBatch.length > 0) {
            setBatchCreatedTags(prev => [...prev, ...createdTagsInBatch]);
        }

        // Apply all collected replacements
        const result = await filePreviewRef.current.applyReplacements(replacements);

        if (result.success) {
            const newApplied = new Set(appliedToPDF);
            appliedIds.forEach(id => newApplied.add(id));
            setAppliedToPDF(newApplied);

            message.success(`Đã áp dụng ${replacements.length} vị trí vào PDF!`);

            // Notify parent about modified PDF
            const documentTags = buildDocumentTags();
            if (onMappingChange) {
                onMappingChange(mappings, {
                    documentTagsObject: documentTags,
                    modifiedPdfBytes: result.bytes,
                    uploadedFile: result.file
                });
            }
        } else {
            message.error(`Lỗi: ${result.error}`);
        }
    };

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

    // Handle row selection
    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (selectedRowKeys) => {
            setSelectedRows(selectedRowKeys);
        },
        getCheckboxProps: (record) => ({
            disabled: appliedToPDF.has(record.id), // Disable checkbox if already applied to PDF
        }),
    };

    // Table columns
    const columns = [
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
                return (
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
                        <Input
                            placeholder="Tên trường (key)"
                            value={local.key}
                            onChange={(e) => setTempInput(record.id, { ...local, key: e.target.value.toLowerCase() })}
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

                        <Tooltip title="Tạo tag mới và áp dụng ngay vào PDF">
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

                                    // 2. Map placeholder with tag - Pass newTag to avoid race condition
                                    handleMapPlaceholder(record.id, newId, newTag);

                                    // 3. Auto-replace on PDF (realtime!) - Pass tag object directly
                                    await applySingleReplacement(record.id, newTag);

                                    // 4. Clear temp input
                                    setTempInput(record.id, { key: '', dataType: effectiveTagDataTypes?.[0]?.value || 'string' });

                                    // 5. Remove from selection if it was selected
                                    setSelectedRows(prev => prev.filter(id => id !== record.id));
                                }}
                            >
                                Áp dụng
                            </Button>
                        </Tooltip>
                    </div>
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
                <Space>
                    <Button
                        type="default"
                        icon={<CheckCircleOutlined />}
                        onClick={applySelectedBatch}
                        disabled={selectedRows.length === 0}
                        size="middle"
                    >
                        Áp dụng đã chọn ({selectedRows.length})
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
                            <li> <strong>Tick chọn</strong> các vị trí cần áp dụng, sau đó nhấn <strong>"Áp dụng đã chọn"</strong> để áp dụng hàng loạt</li>
                            <li><strong>Xóa vị trí:</strong> Chỉ có thể xóa vị trí chưa được áp dụng vào PDF</li>
                            <li><strong>Cảnh báo kích thước:</strong> Nếu văn bản vượt quá kích thước ô trống, hệ thống sẽ cảnh báo. Bạn có thể chấp nhận hoặc điều chỉnh lại</li>
                            <li>Khi áp dụng hàng loạt, nếu gặp văn bản quá kích thước, tiến trình sẽ dừng để bạn quyết định tiếp tục hay điều chỉnh</li>
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
                rowSelection={rowSelection}
                pagination={false}
                scroll={{ x: tableX, y: 400 }}
            />

            <Divider />
        </Card>
    );
};

export default PlaceholderMappingPanel;
