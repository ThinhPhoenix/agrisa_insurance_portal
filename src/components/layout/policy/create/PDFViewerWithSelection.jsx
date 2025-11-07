import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Input, message, Modal, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';

/**
 * PDF Viewer with click-to-place tag functionality using PDF.js directly
 * User clicks on PDF -> See marker circle -> Confirm -> Choose tag -> Insert at clicked position
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
    const containerRef = useRef(null);
    const canvasRefs = useRef({});

    useEffect(() => {
        if (!pdfUrl) return;

        const loadPdf = async () => {
            try {
                // Load PDF.js from CDN if not already loaded
                if (!window.pdfjsLib) {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js';
                    script.async = true;
                    document.body.appendChild(script);

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });

                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
                }

                const pdfjsLib = window.pdfjsLib;
                const loadingTask = pdfjsLib.getDocument(pdfUrl);
                const pdfDoc = await loadingTask.promise;

                setNumPages(pdfDoc.numPages);

                // Calculate display scale to match iframe
                const firstPage = await pdfDoc.getPage(1);
                const baseViewport = firstPage.getViewport({ scale: 1.0 });
                const containerWidth = containerRef.current?.parentElement?.clientWidth || 800;
                const cssScale = Math.min(1.0, containerWidth / baseViewport.width);

                // Render all pages with scale 1.0 but store cssScale
                const pages = [];
                for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.0 });

                    pages.push({
                        pageNum,
                        page,
                        viewport,
                        width: viewport.width,
                        height: viewport.height,
                        cssScale // Store for coordinate conversion
                    });
                }

                setRenderedPages(pages);

                // Render to canvases after state update
                setTimeout(() => {
                    pages.forEach(({ pageNum, page, viewport }) => {
                        const canvas = canvasRefs.current[pageNum];
                        if (canvas) {
                            const context = canvas.getContext('2d');

                            // Clear canvas first to avoid "multiple render" error
                            context.clearRect(0, 0, canvas.width, canvas.height);

                            const renderContext = {
                                canvasContext: context,
                                viewport: viewport
                            };
                            page.render(renderContext);
                        }
                    });
                }, 100);

            } catch (error) {
                message.error('Lỗi khi tải PDF');
            }
        };

        loadPdf();
    }, [pdfUrl]);

    const handlePdfClick = async (e) => {
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

        // Fine-tune adjustment based on testing
        // Auto-detect uses left edge of text, manual placement tends to be ~50px to the right
        // Adjust X to match auto-detect behavior
        pdfX = pdfX - 50; // Move 50px to the left to match auto-detect
        pdfY = pdfY - 4;  // Small Y adjustment

        // Set clicked position with marker
        // Store absolute position within container (including scroll)
        setClickedPosition({
            screenX: clickX, // Absolute position in container
            screenY: clickY,
            pdfX,
            pdfY,
            page: clickedPage,
            viewport: pageData.viewport
        });
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
            width: 100,
            height: 10,
            fontSize: 10,
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
                onClick={handlePdfClick}
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
                {renderedPages.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
                        Đang tải PDF...
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

                {/* Marker circle at clicked position - FIXED within container */}
                {clickedPosition && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${clickedPosition.screenX - 8}px`,
                            top: `${clickedPosition.screenY - 8}px`,
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: '3px solid #ff4d4f',
                            background: 'rgba(255, 77, 79, 0.3)',
                            pointerEvents: 'none',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            zIndex: 999,
                            boxShadow: '0 0 10px rgba(255, 77, 79, 0.5)',
                            transform: 'translate(0, 0)' // Prevent movement
                        }}
                    />
                )}

                {/* Confirm/Cancel buttons - positioned below marker, FIXED */}
                {clickedPosition && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${clickedPosition.screenX - 70}px`,
                            top: `${clickedPosition.screenY + 25}px`,
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
