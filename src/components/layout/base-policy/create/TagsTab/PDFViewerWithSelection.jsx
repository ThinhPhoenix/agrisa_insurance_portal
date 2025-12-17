import {
    getPdfError
} from '@/libs/message';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, message, Modal, Select, Space, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import VisualMarkerOverlay from '../VisualMarkerOverlay'; // 🆕 BATCH MODE: Visual markers

/**
 * Convert screen coordinates to PDF coordinates with accurate scaling
 * Handles browser zoom, canvas scaling, and coordinate transformation
 * Works accurately at any zoom level (97%, 100%, 125%, etc.)
 */
const screenToPDFCoords = (screenX, screenY, canvasRect, viewport, cssScale) => {
    // Get browser zoom level
    const browserZoom = window.devicePixelRatio;

    // Calculate position relative to canvas element
    const canvasX = screenX;
    const canvasY = screenY;

    // Get actual canvas display size
    const displayWidth = canvasRect.width;
    const displayHeight = canvasRect.height;

    // Get PDF page size (in PDF units)
    const pdfWidth = viewport.width;
    const pdfHeight = viewport.height;

    // Calculate the actual scale ratio from display to PDF
    const scaleX = pdfWidth / displayWidth;
    const scaleY = pdfHeight / displayHeight;

    // Convert to PDF coordinates
    const pdfX = canvasX * scaleX;
    const pdfYFromTop = canvasY * scaleY;

    // Flip Y coordinate (PDF Y is from bottom, canvas Y is from top)
    const pdfY = pdfHeight - pdfYFromTop;

    return { pdfX, pdfY };
};

/**
 * PDF Viewer with drag-to-select field functionality using PDF.js directly
 * User drags across PDF to select field area -> See rectangle outline -> Confirm -> Enter position number -> Create placeholder
 * Field width is captured from drag selection (startX to endX), height is fixed like auto-detection
 */
const PDFViewerWithSelection = ({
    pdfUrl,
    tags = [],
    onTagPlaced,
    isPlacementMode = false,
    onExitPlacementMode,
    onCreatePlaceholder, // NEW: callback to create placeholder in mapping panel
    placeholders = [], // NEW: to check for duplicate positions
    tagDataTypes = [], // NEW: available data types
    onCreateAndApplyField, // NEW: callback to create field and immediately apply AcroForm
    onCloseFullscreen, // NEW: callback to close fullscreen modal after field creation
    isBatchMode = false, // 🆕 BATCH MODE: Enable batch field creation
    onScanComplete, // 🆕 BATCH MODE: Callback when field scan is complete (for staging)
    stagedFields = [] // 🆕 BATCH MODE: Staged fields for visual markers
}) => {
    const [numPages, setNumPages] = useState(null);
    const [clickedPosition, setClickedPosition] = useState(null);
    const [renderedPages, setRenderedPages] = useState([]);
    const [fieldFormVisible, setFieldFormVisible] = useState(false);
    const [loading, setLoading] = useState(true); // Loading state for PDF
    const containerRef = useRef(null);
    const canvasRefs = useRef({});
    const renderTasksRef = useRef(new Map()); // ✅ Track render tasks for cleanup
    const [fieldForm] = Form.useForm();

    // NEW: Drag selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);

    // Zoom warning removed - coordinate system is now zoom-independent thanks to screenToPDFCoords()

    useEffect(() => {
        if (!pdfUrl) return;

        const loadPdf = async () => {
            setLoading(true); // Start loading
            try {
                // ✅ OPTIMIZATION: Load PDF.js from CDN if not already loaded
                if (!window.pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js';
                    script.async = true;
                    script.defer = true; // Defer loading for better performance
                    document.body.appendChild(script);

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });

                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
                }

                const pdfjsLib = window.pdfjsLib;

                // ✅ OPTIMIZATION: Use caching to speed up repeated loads
                const loadingTask = pdfjsLib.getDocument({
                    url: pdfUrl,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/cmaps/',
                    cMapPacked: true,
                    disableAutoFetch: false, // Enable progressive loading
                    disableStream: false // Enable streaming for faster loading
                });
                const pdfDoc = await loadingTask.promise;

                setNumPages(pdfDoc.numPages);

                // Calculate display scale to match iframe
                const firstPage = await pdfDoc.getPage(1);
                const baseViewport = firstPage.getViewport({ scale: 1.0 });
                const containerWidth = containerRef.current?.parentElement?.clientWidth || 800;
                const cssScale = Math.min(1.0, containerWidth / baseViewport.width);

                // ✅ OPTIMIZATION: Lazy load pages (render only first 3 pages initially)
                const pages = [];
                const maxInitialPages = Math.min(3, pdfDoc.numPages);

                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.0 });

                    pages.push({
                        pageNum,
                        page,
                        viewport,
                        width: viewport.width,
                        height: viewport.height,
                        cssScale, // Store for coordinate conversion
                        isRendered: pageNum <= maxInitialPages // Mark initial pages for rendering
                    });
                }

                setRenderedPages(pages);

                // ✅ OPTIMIZATION: Render initial pages first, then lazy-load remaining
                setTimeout(() => {
                    pages.forEach(({ pageNum, page, viewport, isRendered }) => {
                        const canvas = canvasRefs.current[pageNum];
                        if (canvas && isRendered) {
                            const context = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance

                            // Cancel any existing render task for this canvas
                            const existingTask = renderTasksRef.current.get(pageNum);
                            if (existingTask) {
                                try {
                                    existingTask.cancel();
                                    renderTasksRef.current.delete(pageNum);
                                } catch (e) {
                                    // Ignore cancel errors
                                }
                            }

                            // Clear canvas first to avoid "multiple render" error
                            context.clearRect(0, 0, canvas.width, canvas.height);

                            const renderContext = {
                                canvasContext: context,
                                viewport: viewport
                            };
                            const renderTask = page.render(renderContext);
                            renderTasksRef.current.set(pageNum, renderTask);

                            // Remove from map when complete to avoid memory leaks
                            renderTask.promise
                                .then(() => {
                                    renderTasksRef.current.delete(pageNum);
                                })
                                .catch(err => {
                                    // Ignore RenderingCancelledException - this is expected when cancelling
                                    if (err.name !== 'RenderingCancelledException') {
                                        console.error(`Error rendering page ${pageNum}:`, err);
                                    }
                                    renderTasksRef.current.delete(pageNum);
                                });
                        }
                    });

                    // Lazy-load remaining pages after a delay
                    if (pdfDoc.numPages > maxInitialPages) {
                        setTimeout(() => {
                            pages.forEach(({ pageNum, page, viewport, isRendered }) => {
                                if (!isRendered) {
                                    const canvas = canvasRefs.current[pageNum];
                                    if (canvas) {
                                        const context = canvas.getContext('2d', { alpha: false });

                                        // Cancel any existing render task for this canvas
                                        const existingTask = renderTasksRef.current.get(pageNum);
                                        if (existingTask) {
                                            try {
                                                existingTask.cancel();
                                                renderTasksRef.current.delete(pageNum);
                                            } catch (e) {
                                                // Ignore cancel errors
                                            }
                                        }

                                        context.clearRect(0, 0, canvas.width, canvas.height);
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport
                                        };
                                        const renderTask = page.render(renderContext);
                                        renderTasksRef.current.set(pageNum, renderTask);

                                        // Remove from map when complete
                                        renderTask.promise
                                            .then(() => {
                                                renderTasksRef.current.delete(pageNum);
                                            })
                                            .catch(err => {
                                                // Ignore RenderingCancelledException - this is expected when cancelling
                                                if (err.name !== 'RenderingCancelledException') {
                                                    console.error(`Error rendering page ${pageNum}:`, err);
                                                }
                                                renderTasksRef.current.delete(pageNum);
                                            });
                                    }
                                }
                            });
                        }, 500); // Delay lazy-loading by 500ms
                    }
                }, 50); // Reduced from 100ms to 50ms for faster initial render

                setLoading(false); // Finish loading

            } catch (error) {
                console.error('[PDFViewer] Error loading PDF:', error);
                message.error(getPdfError('FILE_CORRUPTED'));
                setLoading(false);
            }
        };

        loadPdf();

        // ✅ Cleanup: Cancel all render tasks when component unmounts or pdfUrl changes
        return () => {
            console.log('🧹 Cleaning up PDF render tasks...');
            renderTasksRef.current.forEach((task, pageNum) => {
                try {
                    task.cancel();
                    console.log(`✅ Cancelled render task for page ${pageNum}`);
                } catch (e) {
                    // Ignore cancel errors
                }
            });
            renderTasksRef.current.clear();
        };
    }, [pdfUrl]);

    // NEW: Handle mouse down to start drag selection
    const handleMouseDown = async (e) => {
        if (!isPlacementMode) return;

        // Find which canvas was clicked
        let clickedCanvas = null;
        let clickedPage = null;

        for (const pageData of renderedPages) {
            const canvas = canvasRefs.current[pageData.pageNum];
            if (!canvas) continue;

            const rect = canvas.getBoundingClientRect();
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                clickedCanvas = canvas;
                clickedPage = pageData;
                break;
            }
        }

        if (!clickedCanvas || !clickedPage) return;

        // Get position relative to canvas
        const canvasRect = clickedCanvas.getBoundingClientRect();
        const canvasClickX = e.clientX - canvasRect.left;
        const canvasClickY = e.clientY - canvasRect.top;

        // Convert to PDF coordinates using standardized function
        const { pdfX, pdfY } = screenToPDFCoords(
            canvasClickX,
            canvasClickY,
            canvasRect,
            clickedPage.viewport,
            clickedPage.cssScale
        );

        // Store drag start position
        setIsDragging(true);
        setDragStart({
            screenX: e.clientX,
            screenY: e.clientY,
            canvasX: canvasClickX,
            canvasY: canvasClickY,
            pdfX,
            pdfY,
            page: clickedPage.pageNum,
            viewport: clickedPage.viewport,
            canvasRect,
            cssScale: clickedPage.cssScale
        });
        setDragEnd(null);
    };

    // NEW: Handle mouse move during drag
    const handleMouseMove = (e) => {
        if (!isDragging || !dragStart) return;

        // Get canvas and recalculate rect (handles fullscreen changes)
        const canvas = canvasRefs.current[dragStart.page];
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();

        // Get current position relative to canvas
        const canvasCurrentX = e.clientX - canvasRect.left;
        const canvasCurrentY = e.clientY - canvasRect.top;

        // Convert to PDF coordinates using standardized function
        const { pdfX: pdfCurrentX, pdfY: pdfCurrentY } = screenToPDFCoords(
            canvasCurrentX,
            canvasCurrentY,
            canvasRect,
            dragStart.viewport,
            dragStart.cssScale
        );

        setDragEnd({
            screenX: e.clientX,
            screenY: e.clientY,
            canvasX: canvasCurrentX,
            canvasY: canvasCurrentY,
            pdfX: pdfCurrentX,
            pdfY: pdfCurrentY
        });
    };

    // NEW: Handle mouse up to complete drag selection
    const handleMouseUp = (e) => {
        if (!isDragging || !dragStart) return;

        // Get canvas and recalculate rect
        const canvas = canvasRefs.current[dragStart.page];
        if (!canvas) {
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            return;
        }

        const canvasRect = canvas.getBoundingClientRect();

        // Calculate final position relative to canvas
        const canvasEndX = e.clientX - canvasRect.left;
        const canvasEndY = e.clientY - canvasRect.top;

        // Convert to PDF coordinates using standardized function
        const { pdfX: pdfEndX, pdfY: pdfEndY } = screenToPDFCoords(
            canvasEndX,
            canvasEndY,
            canvasRect,
            dragStart.viewport,
            dragStart.cssScale
        );

        // Calculate field dimensions (both width AND height from drag)
        const fieldStartX = Math.min(dragStart.pdfX, pdfEndX);
        const fieldEndX = Math.max(dragStart.pdfX, pdfEndX);
        const fieldWidth = fieldEndX - fieldStartX;

        // Calculate height from drag selection (Y distance)
        const fieldStartY = Math.min(dragStart.pdfY, pdfEndY);
        const fieldEndY = Math.max(dragStart.pdfY, pdfEndY);
        const fieldHeight = fieldEndY - fieldStartY;

        // Minimum dimension checks - removed warnings, just silently ignore too small selections
        if (fieldWidth < 20 || fieldHeight < 8) {
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            return;
        }

        // Use center position (both X and Y)
        const centerY = (fieldStartY + fieldEndY) / 2;

        // Calculate fontSize based on height (reverse of auto-detection formula: height = fontSize * 1.2)
        const fontSize = fieldHeight / 1.2;

        // Store selected field area with canvas coordinates for accurate overlay
        setClickedPosition({
            canvasX: Math.min(dragStart.canvasX, canvasEndX),
            canvasY: Math.min(dragStart.canvasY, canvasEndY),
            canvasWidth: Math.abs(canvasEndX - dragStart.canvasX),
            canvasHeight: Math.abs(canvasEndY - dragStart.canvasY),
            pdfX: fieldStartX,
            pdfY: centerY,
            pdfWidth: fieldWidth,
            pdfHeight: fieldHeight, // Dynamic height from drag
            fontSize: fontSize, // Dynamic fontSize calculated from height
            page: dragStart.page,
            viewport: dragStart.viewport
        });

        // Reset drag state
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
    };

    const handleConfirmPosition = () => {
        if (!clickedPosition) return;

        // 🔧 FIX: Auto-suggest dựa trên cả existing placeholders VÀ staged fields
        const existingPositions = placeholders.map(p => {
            const original = (p && (typeof p.original === 'string' ? p.original : (typeof p.fullText === 'string' ? p.fullText : '')));
            const match = original ? original.match(/\((\d+)\)/) : null;
            return match ? parseInt(match[1]) : null;
        }).filter(Boolean);

        // 🆕 BATCH MODE: Include staged fields in position calculation
        const stagedPositions = stagedFields.map(f => f.position).filter(Boolean);
        const allPositions = [...existingPositions, ...stagedPositions];

        const nextPosition = allPositions.length > 0
            ? Math.max(...allPositions) + 1
            : 1;

        // Set default values
        fieldForm.setFieldsValue({
            position: nextPosition,
            key: '',
            dataType: 'string'
        });

        // Show form modal
        setFieldFormVisible(true);
    };

    const handleFieldFormSubmit = async () => {
        try {
            const values = await fieldForm.validateFields();
            const { position, key, dataType } = values;

            // 🔧 FIX: Check duplicate positions trong CẢ placeholders VÀ staged fields
            const existingPositions = placeholders.map(p => {
                const original = (p && (typeof p.original === 'string' ? p.original : (typeof p.fullText === 'string' ? p.fullText : '')));
                const match = original ? original.match(/\((\d+)\)/) : null;
                return match ? parseInt(match[1]) : null;
            }).filter(Boolean);

            // 🆕 BATCH MODE: Include staged fields
            const stagedPositions = stagedFields.map(f => f.position).filter(Boolean);
            const allPositions = [...existingPositions, ...stagedPositions];

            if (allPositions.includes(position)) {
                message.error(`Vị trí (${position}) đã tồn tại. Vui lòng chọn vị trí khác.`);
                return;
            }

            // Check for duplicate keys
            const existingKeys = placeholders.map(p => p.mappedKey).filter(Boolean);
            if (existingKeys.includes(key)) {
                message.error(`Tên trường "${key}" đã tồn tại. Vui lòng chọn tên khác.`);
                return;
            }

            const newPlaceholder = {
                id: `manual-${Date.now()}`,
                original: `(${position})`,
                fullText: `(${position})`,
                page: clickedPosition.page,
                x: clickedPosition.pdfX,
                y: clickedPosition.pdfY,
                width: clickedPosition.pdfWidth,
                height: clickedPosition.pdfHeight,
                backgroundX: clickedPosition.pdfX,
                backgroundWidth: clickedPosition.pdfWidth,
                fontSize: clickedPosition.fontSize,
                isManual: true,
                mappedKey: key,
                mappedDataType: dataType
            };

            // 🆕 BATCH MODE: Different behavior for batch vs normal mode
            if (isBatchMode) {
                // Batch mode: Add to staging area, don't apply to PDF yet
                console.log('🔵 [BATCH MODE] Adding field to staging:', { position, key, dataType });

                const stagedField = {
                    tempId: `staged-${Date.now()}`,
                    position,
                    key,
                    dataType,
                    page: clickedPosition.page,
                    x: clickedPosition.pdfX,
                    y: clickedPosition.pdfY,
                    width: clickedPosition.pdfWidth,
                    height: clickedPosition.pdfHeight,
                    backgroundX: clickedPosition.pdfX,
                    backgroundWidth: clickedPosition.pdfWidth,
                    fontSize: clickedPosition.fontSize,
                    isManual: true,
                    createdAt: Date.now(),
                    // 🔧 FIX: Store canvas coordinates for visual marker display
                    canvasX: clickedPosition.canvasX,
                    canvasY: clickedPosition.canvasY,
                    canvasWidth: clickedPosition.canvasWidth,
                    canvasHeight: clickedPosition.canvasHeight
                };

                if (onScanComplete) {
                    onScanComplete(stagedField);
                }

                message.success(`Đã thêm trường (${position}) vào danh sách`);

                // Reset form but stay in batch mode (don't close modal)
                setFieldFormVisible(false);
                fieldForm.resetFields();
                setClickedPosition(null);
            } else {
                // Normal mode: Create field and immediately apply AcroForm
                console.log('🔍 Callbacks available:', {
                    hasCreateAndApply: !!onCreateAndApplyField,
                    hasCreatePlaceholder: !!onCreatePlaceholder
                });

                if (onCreateAndApplyField) {
                    console.log('✅ Calling onCreateAndApplyField with:', { newPlaceholder, fieldData: { key, dataType } });
                    try {
                        await onCreateAndApplyField(newPlaceholder, { key, dataType });
                        console.log('✅ onCreateAndApplyField completed successfully');
                    } catch (error) {
                        console.error('❌ onCreateAndApplyField failed:', error);
                        message.error(`Không thể tạo AcroForm: ${error.message}`);
                        return; // Don't close modal if failed
                    }
                } else if (onCreatePlaceholder) {
                    // Fallback to old behavior
                    console.log('⚠️ Falling back to onCreatePlaceholder (no AcroForm)');
                    onCreatePlaceholder(newPlaceholder);
                }

                message.success(`Đã tạo trường (${position}) - ${key}`);

                // Reset state
                setFieldFormVisible(false);
                fieldForm.resetFields();
                setClickedPosition(null);

                // Close fullscreen modal and exit placement mode after successful field creation
                if (onCloseFullscreen) {
                    onCloseFullscreen();
                }
                if (onExitPlacementMode) {
                    onExitPlacementMode();
                }
            }
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    const handleCancelPosition = () => {
        setClickedPosition(null);
        setFieldFormVisible(false);
        fieldForm.resetFields();
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            overflowX: 'auto', // Enable horizontal scroll
            overflowY: 'auto'  // Enable vertical scroll
        }}>
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                    cursor: isPlacementMode ? 'crosshair' : 'default',
                    position: 'relative',
                    padding: '0', // No padding to match iframe
                    background: 'white',
                    minWidth: 'fit-content', // Allow content to extend beyond container
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center' // Center PDF like iframe
                }}
            >
                {loading ? (
                    <div style={{
                        padding: '60px',
                        textAlign: 'center',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <Spin size="large" />
                        <div style={{ color: '#666' }}>Đang tải PDF...</div>
                    </div>
                ) : renderedPages.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        Không thể tải PDF
                    </div>
                ) : (
                    renderedPages.map(({ pageNum, width, height, cssScale }) => {
                        // Use stored cssScale for consistent display
                        const displayWidth = width * cssScale;
                        const displayHeight = height * cssScale;

                        return (
                            <canvas
                                key={pageNum}
                                ref={el => canvasRefs.current[pageNum] = el}
                                width={width}
                                height={height}
                                style={{
                                    display: 'block',
                                    marginBottom: '10px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    background: 'white',
                                    width: `${displayWidth}px`,
                                    height: `${displayHeight}px`
                                }}
                            />
                        );
                    })
                )}

                {/* Show drag selection rectangle - positioned relative to canvas */}
                {isDragging && dragStart && dragEnd && (() => {
                    const canvas = canvasRefs.current[dragStart.page];
                    if (!canvas) return null;

                    const canvasRect = canvas.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();

                    // Calculate overlay position relative to container
                    const left = canvasRect.left - containerRect.left + Math.min(dragStart.canvasX, dragEnd.canvasX);
                    const top = canvasRect.top - containerRect.top + Math.min(dragStart.canvasY, dragEnd.canvasY);
                    const width = Math.abs(dragEnd.canvasX - dragStart.canvasX);
                    const height = Math.abs(dragEnd.canvasY - dragStart.canvasY);

                    return (
                        <div
                            style={{
                                position: 'absolute',
                                left: `${left}px`,
                                top: `${top}px`,
                                width: `${width}px`,
                                height: `${height}px`,
                                border: '2px dashed #1890ff',
                                background: 'rgba(24, 144, 255, 0.1)',
                                pointerEvents: 'none',
                                zIndex: 998
                            }}
                        />
                    );
                })()}

                {/* Show selected field area after drag complete */}
                {clickedPosition && clickedPosition.canvasWidth && (() => {
                    const canvas = canvasRefs.current[clickedPosition.page];
                    if (!canvas) return null;

                    const canvasRect = canvas.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();

                    // Calculate overlay position relative to container
                    const left = canvasRect.left - containerRect.left + clickedPosition.canvasX;
                    const top = canvasRect.top - containerRect.top + clickedPosition.canvasY;

                    return (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${left}px`,
                                    top: `${top}px`,
                                    width: `${clickedPosition.canvasWidth}px`,
                                    height: `${clickedPosition.canvasHeight}px`,
                                    border: '3px solid #ff4d4f',
                                    background: 'rgba(255, 77, 79, 0.2)',
                                    pointerEvents: 'none',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    zIndex: 999,
                                    boxShadow: '0 0 10px rgba(255, 77, 79, 0.5)'
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${left}px`,
                                    top: `${top + clickedPosition.canvasHeight + 10}px`,
                                    zIndex: 1000,
                                    background: 'white',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    pointerEvents: 'auto'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Space>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckOutlined />}
                                        onClick={handleConfirmPosition}
                                    >
                                        Xác nhận
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<CloseOutlined />}
                                        onClick={handleCancelPosition}
                                    >
                                        Hủy
                                    </Button>
                                </Space>
                            </div>
                        </>
                    );
                })()}

                {/* 🆕 BATCH MODE: Show visual markers for staged fields */}
                {isBatchMode && stagedFields.length > 0 && (
                    <VisualMarkerOverlay
                        stagedFields={stagedFields}
                        canvasRefs={canvasRefs}
                        containerRef={containerRef}
                        scale={1}
                    />
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.7;
                    }
                }
            `}</style>

            {/* Field Creation Form Modal */}
            <Modal
                title="Tạo trường thông tin"
                open={fieldFormVisible}
                onOk={handleFieldFormSubmit}
                onCancel={handleCancelPosition}
                okText="Tạo và áp dụng"
                cancelText="Hủy"
                width={500}
            >
                <Form
                    form={fieldForm}
                    layout="vertical"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        label="Số thứ tự"
                        name="position"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số thứ tự' },
                            { type: 'number', min: 1, message: 'Số thứ tự phải lớn hơn 0' }
                        ]}
                    >
                        <InputNumber
                            placeholder="Nhập số thứ tự (1, 2, 3...)"
                            style={{ width: '100%' }}
                            min={1}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tên trường"
                        name="key"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên trường' },
                            {
                                pattern: /^[^A-Z!@#$%^&*()+=\[\]{};':"\\|,.<>?\/]*$/,
                                message: 'Tên trường không được chứa chữ hoa hoặc ký tự đặc biệt'
                            }
                        ]}
                    >
                        <Input
                            placeholder="Ví dụ: họ và tên, mã hồ sơ, ngày sinh"
                            autoFocus
                        />
                    </Form.Item>

                    <Form.Item
                        label="Loại dữ liệu"
                        name="dataType"
                        rules={[{ required: true, message: 'Vui lòng chọn loại dữ liệu' }]}
                    >
                        <Select placeholder="Chọn loại dữ liệu">
                            {(tagDataTypes.length > 0 ? tagDataTypes : [
                                { label: 'Chuỗi/Text', value: 'string' },
                                { label: 'Văn bản dài', value: 'textarea' },
                                { label: 'Ngày tháng', value: 'date' },
                                { label: 'Số nguyên', value: 'integer' },
                                { label: 'Số thực', value: 'float' }
                            ]).map(type => (
                                <Select.Option key={type.value} value={type.value}>
                                    {type.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PDFViewerWithSelection;
