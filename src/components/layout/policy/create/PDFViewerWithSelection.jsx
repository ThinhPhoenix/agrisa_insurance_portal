import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Input, message, Modal, Space, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';

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
    placeholders = [] // NEW: to check for duplicate positions
}) => {
    const [numPages, setNumPages] = useState(null);
    const [clickedPosition, setClickedPosition] = useState(null);
    const [renderedPages, setRenderedPages] = useState([]);
    const [nextPlaceholderNum, setNextPlaceholderNum] = useState(1); // Auto-increment placeholder number
    const [positionModalVisible, setPositionModalVisible] = useState(false);
    const [positionValue, setPositionValue] = useState('');
    const [loading, setLoading] = useState(true); // Loading state for PDF
    const containerRef = useRef(null);
    const canvasRefs = useRef({});

    // NEW: Drag selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);

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

                // Track render tasks to cancel them if component unmounts
                const renderTasks = new Map();

                // ✅ OPTIMIZATION: Render initial pages first, then lazy-load remaining
                setTimeout(() => {
                    pages.forEach(({ pageNum, page, viewport, isRendered }) => {
                        const canvas = canvasRefs.current[pageNum];
                        if (canvas && isRendered) {
                            const context = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance

                            // Cancel any existing render task for this canvas
                            const existingTask = renderTasks.get(pageNum);
                            if (existingTask) {
                                try {
                                    existingTask.cancel();
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
                            renderTasks.set(pageNum, renderTask);
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
                                        const existingTask = renderTasks.get(pageNum);
                                        if (existingTask) {
                                            try {
                                                existingTask.cancel();
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
                                        renderTasks.set(pageNum, renderTask);
                                    }
                                }
                            });
                        }, 500); // Delay lazy-loading by 500ms
                    }
                }, 50); // Reduced from 100ms to 50ms for faster initial render

                setLoading(false); // Finish loading

            } catch (error) {
                message.error('Lỗi khi tải PDF');
                setLoading(false);
            }
        };

        loadPdf();
    }, [pdfUrl]);

    // NEW: Handle mouse down to start drag selection
    const handleMouseDown = async (e) => {
        if (!isPlacementMode) return;

        // Get scroll offsets
        const scrollContainer = containerRef.current.parentElement;
        const scrollX = scrollContainer.scrollLeft;
        const scrollY = scrollContainer.scrollTop;

        // Get click position relative to viewport
        const containerRect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - containerRect.left + scrollX;
        const clickY = e.clientY - containerRect.top + scrollY;

        // Calculate which page was clicked and position relative to that page
        let clickedPage = 1;
        let pageRelativeY = 0;
        let currentY = 0;

        for (const pageData of renderedPages) {
            // Use CSS-scaled height for click detection
            const displayHeight = pageData.height * pageData.cssScale;
            const pageHeight = displayHeight + 10; // Small gap

            if (clickY >= currentY && clickY < currentY + displayHeight) {
                clickedPage = pageData.pageNum;
                pageRelativeY = clickY - currentY;
                break;
            }

            currentY += pageHeight;
        }

        // Find the page data
        const pageData = renderedPages.find(p => p.pageNum === clickedPage);
        if (!pageData) {
            message.error('Không tìm thấy trang PDF');
            return;
        }

        // Calculate X offset because PDF is centered (using CSS-scaled width)
        const containerWidth = containerRect.width;
        const displayWidth = pageData.width * pageData.cssScale;

        // IMPORTANT: If PDF is smaller than container, it's centered, so we need to subtract offset
        // If PDF is larger, there's no centering, xOffset should be 0
        const xOffset = displayWidth < containerWidth ? (containerWidth - displayWidth) / 2 : 0;

        // Adjust X coordinate for centering (in display coordinates)
        const displayX = clickX - xOffset;

        // CORRECT APPROACH: Calculate click position relative to CANVAS, not container
        const canvas = canvasRefs.current[clickedPage];
        const canvasRect = canvas?.getBoundingClientRect();

        // Click position relative to canvas (in viewport coordinates)
        const canvasClickX = e.clientX - canvasRect.left;
        const canvasClickY = e.clientY - canvasRect.top;

        // Convert canvas click position to PDF coordinates
        // Canvas is displayed with CSS scaling, so divide by cssScale to get PDF coords
        let pdfX = canvasClickX / pageData.cssScale;

        // Y coordinate: Canvas Y is from top, PDF Y is from bottom
        const pdfYFromTop = canvasClickY / pageData.cssScale;
        let pdfY = pageData.viewport.height - pdfYFromTop;

        // Store drag start position
        setIsDragging(true);
        setDragStart({
            screenX: clickX,
            screenY: clickY,
            pdfX,
            pdfY,
            page: clickedPage,
            viewport: pageData.viewport,
            canvasRect,
            cssScale: pageData.cssScale
        });
        setDragEnd(null);
    };

    // NEW: Handle mouse move during drag
    const handleMouseMove = (e) => {
        if (!isDragging || !dragStart) return;

        // Get scroll offsets
        const scrollContainer = containerRef.current.parentElement;
        const scrollX = scrollContainer.scrollLeft;
        const scrollY = scrollContainer.scrollTop;

        // Get current position
        const containerRect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left + scrollX;
        const currentY = e.clientY - containerRect.top + scrollY;

        // ✅ FIX: Recalculate canvas rect dynamically (handles fullscreen vs component view)
        const canvas = canvasRefs.current[dragStart.page];
        const canvasRect = canvas?.getBoundingClientRect();
        if (!canvasRect) return;

        // Calculate PDF coordinates for current position
        const canvasCurrentX = e.clientX - canvasRect.left;
        const canvasCurrentY = e.clientY - canvasRect.top;

        const pdfCurrentX = canvasCurrentX / dragStart.cssScale;
        const pdfYFromTop = canvasCurrentY / dragStart.cssScale;
        const pdfCurrentY = dragStart.viewport.height - pdfYFromTop;

        setDragEnd({
            screenX: currentX,
            screenY: currentY,
            pdfX: pdfCurrentX,
            pdfY: pdfCurrentY
        });
    };

    // NEW: Handle mouse up to complete drag selection
    const handleMouseUp = (e) => {
        if (!isDragging || !dragStart) return;

        // Get final position
        const scrollContainer = containerRef.current.parentElement;
        const scrollX = scrollContainer.scrollLeft;
        const scrollY = scrollContainer.scrollTop;

        const containerRect = containerRef.current.getBoundingClientRect();
        const endX = e.clientX - containerRect.left + scrollX;
        const endY = e.clientY - containerRect.top + scrollY;

        // ✅ FIX: Recalculate canvas rect dynamically (handles fullscreen vs component view)
        const canvas = canvasRefs.current[dragStart.page];
        const canvasRect = canvas?.getBoundingClientRect();
        if (!canvasRect) {
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            return;
        }

        // Calculate PDF coordinates
        const canvasEndX = e.clientX - canvasRect.left;
        const canvasEndY = e.clientY - canvasRect.top;

        const pdfEndX = canvasEndX / dragStart.cssScale;
        const pdfYFromTop = canvasEndY / dragStart.cssScale;
        const pdfEndY = dragStart.viewport.height - pdfYFromTop;

        // Calculate field dimensions (both width AND height from drag)
        const fieldStartX = Math.min(dragStart.pdfX, pdfEndX);
        const fieldEndX = Math.max(dragStart.pdfX, pdfEndX);
        const fieldWidth = fieldEndX - fieldStartX;

        // Calculate height from drag selection (Y distance)
        const fieldStartY = Math.min(dragStart.pdfY, pdfEndY);
        const fieldEndY = Math.max(dragStart.pdfY, pdfEndY);
        const fieldHeight = fieldEndY - fieldStartY;

        // Minimum dimension checks
        if (fieldWidth < 20) {
            message.warning('Vùng chọn quá hẹp. Vui lòng kéo rộng hơn.');
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            return;
        }

        if (fieldHeight < 8) {
            message.warning('Vùng chọn quá thấp. Vui lòng kéo cao hơn.');
            setIsDragging(false);
            setDragStart(null);
            setDragEnd(null);
            return;
        }

        // Use center position (both X and Y)
        const centerY = (fieldStartY + fieldEndY) / 2;

        // Calculate fontSize based on height (reverse of auto-detection formula: height = fontSize * 1.2)
        const fontSize = fieldHeight / 1.2;

        // Store selected field area
        setClickedPosition({
            screenX: Math.min(dragStart.screenX, endX),
            screenY: Math.min(dragStart.screenY, endY),
            screenWidth: Math.abs(endX - dragStart.screenX),
            screenHeight: Math.abs(endY - dragStart.screenY),
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

        // Open modal to input position
        setPositionModalVisible(true);
    };

    const handlePositionSubmit = () => {
        const posNum = parseInt(positionValue);
        if (!posNum || posNum <= 0) {
            message.error('Vui lòng nhập vị trí hợp lệ (> 0)');
            return;
        }

        // Check for duplicate positions
        const existingPositions = placeholders.map(p => {
            const match = p.original.match(/\((\d+)\)/);
            return match ? parseInt(match[1]) : null;
        }).filter(Boolean);

        if (existingPositions.includes(posNum)) {
            message.error(`Vị trí (${posNum}) đã tồn tại. Vui lòng chọn vị trí khác.`);
            return;
        }

        const newPlaceholder = {
            id: `manual-${Date.now()}`,
            original: `(${posNum})`,
            fullText: `(${posNum})`,
            page: clickedPosition.page,
            x: clickedPosition.pdfX,
            y: clickedPosition.pdfY,
            width: clickedPosition.pdfWidth, // Dynamic width from drag
            height: clickedPosition.pdfHeight, // Dynamic height from drag
            backgroundX: clickedPosition.pdfX, // Full field area
            backgroundWidth: clickedPosition.pdfWidth,
            fontSize: clickedPosition.fontSize, // Dynamic fontSize calculated from height
            isManual: true // Mark as manual for different color
        };

        // Call parent callback to add to PlaceholderMappingPanel
        if (onCreatePlaceholder) {
            onCreatePlaceholder(newPlaceholder);
        }

        message.success(`Đã tạo placeholder (${posNum}) tại trang ${clickedPosition.page}`);

        // Reset state
        setPositionModalVisible(false);
        setPositionValue('');
        setClickedPosition(null);

        // Exit placement mode after successful placement
        if (onExitPlacementMode) {
            onExitPlacementMode();
        }
    };

    const handleCancelPosition = () => {
        setClickedPosition(null);
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

                {/* Show drag selection rectangle */}
                {isDragging && dragStart && dragEnd && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${Math.min(dragStart.screenX, dragEnd.screenX)}px`,
                            top: `${Math.min(dragStart.screenY, dragEnd.screenY)}px`,
                            width: `${Math.abs(dragEnd.screenX - dragStart.screenX)}px`,
                            height: `${Math.abs(dragEnd.screenY - dragStart.screenY)}px`,
                            border: '2px dashed #1890ff',
                            background: 'rgba(24, 144, 255, 0.1)',
                            pointerEvents: 'none',
                            zIndex: 998
                        }}
                    />
                )}

                {/* Show selected field area after drag complete */}
                {clickedPosition && clickedPosition.screenWidth && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${clickedPosition.screenX}px`,
                            top: `${clickedPosition.screenY}px`,
                            width: `${clickedPosition.screenWidth}px`,
                            height: `${clickedPosition.screenHeight}px`,
                            border: '3px solid #ff4d4f',
                            background: 'rgba(255, 77, 79, 0.2)',
                            pointerEvents: 'none',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            zIndex: 999,
                            boxShadow: '0 0 10px rgba(255, 77, 79, 0.5)',
                            transform: 'translate(0, 0)' // Prevent movement
                        }}
                    />
                )}

                {/* Confirm/Cancel buttons - positioned below selected area */}
                {clickedPosition && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${clickedPosition.screenX}px`,
                            top: `${clickedPosition.screenY + (clickedPosition.screenHeight || 20) + 10}px`,
                            zIndex: 1000,
                            background: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            pointerEvents: 'auto', // Allow clicking buttons
                            transform: 'translate(0, 0)' // Prevent movement
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent triggering parent click
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

            {/* Position Input Modal */}
            <Modal
                title="Nhập vị trí placeholder"
                open={positionModalVisible}
                onOk={handlePositionSubmit}
                onCancel={() => {
                    setPositionModalVisible(false);
                    setPositionValue('');
                }}
                okText="Tạo"
                cancelText="Hủy"
            >
                <div style={{ padding: '20px 0' }}>
                    <p>Vị trí phải là số nguyên dương (&gt; 0) và không trùng với các vị trí hiện có.</p>
                    <Input
                        type="number"
                        placeholder="Nhập vị trí (VD: 1, 2, 3...)"
                        value={positionValue}
                        onChange={(e) => setPositionValue(e.target.value)}
                        min={1}
                        style={{ marginTop: '8px' }}
                        onPressEnter={handlePositionSubmit}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PDFViewerWithSelection;
