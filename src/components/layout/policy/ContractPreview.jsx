import Assets from '@/assets';
import { DownloadOutlined, FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography, message } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

const ContractPreview = ({ tagsData, isFullscreen = false }) => {
    const [scale, setScale] = React.useState(1);
    const [pages, setPages] = React.useState([]);
    const containerRef = React.useRef(null);
    const contentRef = React.useRef(null);
    const measureRef = React.useRef(null);

    // A4 dimensions in pixels at 96 DPI
    const A4_WIDTH = 794; // 210mm = 794px
    const A4_HEIGHT = 1123; // 297mm = 1123px
    const PAGE_PADDING = 60; // Top and bottom padding
    const CONTENT_HEIGHT = A4_HEIGHT - PAGE_PADDING * 2 - 60; // Reserve space for footer and page number

    const sortedTags = [...tagsData.tags].sort((a, b) => a.index - b.index);

    // Calculate scale to fit container while maintaining A4 aspect ratio
    React.useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;

                // Calculate scale based on width (primary constraint)
                const scaleByWidth = (containerWidth - 32) / A4_WIDTH; // 32px = padding

                // Clamp scale between 0.1 and 1.5
                let finalScale = Math.max(0.1, Math.min(1.5, scaleByWidth));

                setScale(finalScale);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        // Observe container size changes
        const resizeObserver = new ResizeObserver(updateScale);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateScale);
            resizeObserver.disconnect();
        };
    }, []);

    // Group fields into rows based on width
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;

    sortedTags.forEach(tag => {
        // Textarea always takes full width (100%) - force new row
        if (tag.dataType === 'textarea') {
            if (currentRow.length > 0) {
                rows.push([...currentRow]);
                currentRow = [];
                currentRowWidth = 0;
            }
            rows.push([tag]); // Textarea in its own row
            return;
        }

        const fieldWidth = tag.width || 50;
        if (currentRowWidth + fieldWidth > 100 && currentRow.length > 0) {
            rows.push([...currentRow]);
            currentRow = [tag];
            currentRowWidth = fieldWidth;
        } else {
            currentRow.push(tag);
            currentRowWidth += fieldWidth;
        }
    });
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    // Measure and paginate content
    React.useEffect(() => {
        if (measureRef.current) {
            const elements = measureRef.current.querySelectorAll('.contract-row');
            const paginatedPages = [];
            let currentPage = {
                header: true,
                rows: [],
                height: 0
            };

            const HEADER_HEIGHT = 180; // Approximate header height
            const FOOTER_HEIGHT = 180; // Approximate footer height
            const ROW_MARGIN = 14; // Margin between rows

            let accumulatedHeight = HEADER_HEIGHT;

            elements.forEach((element, index) => {
                const rowHeight = element.offsetHeight + ROW_MARGIN;

                // Check if adding this row would exceed page height
                if (accumulatedHeight + rowHeight + FOOTER_HEIGHT > CONTENT_HEIGHT && currentPage.rows.length > 0) {
                    // Start new page
                    paginatedPages.push({ ...currentPage });
                    currentPage = {
                        header: false, // Only first page has header
                        rows: [index],
                        height: rowHeight
                    };
                    accumulatedHeight = rowHeight;
                } else {
                    currentPage.rows.push(index);
                    currentPage.height += rowHeight;
                    accumulatedHeight += rowHeight;
                }
            });

            // Add last page
            if (currentPage.rows.length > 0) {
                paginatedPages.push(currentPage);
            }

            // If no content, show single page with header
            if (paginatedPages.length === 0) {
                paginatedPages.push({ header: true, rows: [], height: 0 });
            }

            setPages(paginatedPages);
        }
    }, [sortedTags, rows]);

    // Render a single row of fields
    const renderRow = (row, rowIdx) => (
        <div key={rowIdx} className="contract-row" style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '14px',
            alignItems: 'flex-start'
        }}>
            {row.map((tag) => (
                <div key={tag.id} className="contract-field" style={{
                    flex: `0 0 calc(${tag.width || 50}% - 6px)`,
                    padding: '6px 8px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: tag.dataType === 'textarea' ? 'flex-start' : 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: tag.dataType === 'textarea' ? 'flex-start' : 'center',
                        gap: '6px',
                        width: '100%',
                        flexDirection: tag.dataType === 'textarea' ? 'column' : 'row'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: '100%'
                        }}>
                            <span style={{
                                fontSize: '9px',
                                color: '#1890ff',
                                fontWeight: 'bold'
                            }}>
                                {tag.index}.
                            </span>
                            <Text strong style={{ fontSize: '10px', color: '#333', whiteSpace: 'nowrap' }}>
                                {tag.key}:
                            </Text>
                            {tag.dataType === 'textarea' && (
                                <span style={{
                                    flex: 1,
                                    borderBottom: '1px solid #999',
                                    height: '14px',
                                    marginBottom: '2px'
                                }}></span>
                            )}
                        </div>
                        {tag.dataType === 'boolean' ? (
                            <div style={{ display: 'flex', gap: '12px', fontSize: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default' }}>
                                    <span style={{
                                        fontSize: '14px',
                                        border: '1.5px solid #666',
                                        width: '14px',
                                        height: '14px',
                                        display: 'inline-block',
                                        textAlign: 'center',
                                        lineHeight: '12px'
                                    }}>
                                        {tag.value === 'true' ? '✓' : ''}
                                    </span>
                                    <span>Có</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default' }}>
                                    <span style={{
                                        fontSize: '14px',
                                        border: '1.5px solid #666',
                                        width: '14px',
                                        height: '14px',
                                        display: 'inline-block',
                                        textAlign: 'center',
                                        lineHeight: '12px'
                                    }}>
                                        {tag.value === 'false' ? '✓' : ''}
                                    </span>
                                    <span>Không</span>
                                </label>
                            </div>
                        ) : tag.dataType === 'select' ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px', flex: 1 }}>
                                {tag.options && tag.options.length > 0 ? tag.options.map((option, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default' }}>
                                        <span style={{
                                            fontSize: '10px',
                                            border: '1.5px solid #666',
                                            width: '14px',
                                            height: '14px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: tag.isMultipleSelect ? '2px' : '50%'
                                        }}>
                                            {tag.isMultipleSelect ? (
                                                tag.value && tag.value.includes(option) ? '✓' : ''
                                            ) : (
                                                tag.value === option ? '●' : ''
                                            )}
                                        </span>
                                        <span>{option}</span>
                                    </label>
                                )) : (
                                    <span style={{ color: '#999' }}>___________________</span>
                                )}
                            </div>
                        ) : tag.dataType === 'date' ? (
                            <div style={{
                                flex: 1,
                                minWidth: '80px',
                                fontSize: '10px',
                                color: tag.value ? '#000' : '#999',
                                fontWeight: tag.value ? '500' : 'normal',
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '4px'
                            }}>
                                {tag.value || (
                                    <>
                                        <span style={{ display: 'inline-block', width: '30px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ lineHeight: '14px' }}>/</span>
                                        <span style={{ display: 'inline-block', width: '30px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ lineHeight: '14px' }}>/</span>
                                        <span style={{ display: 'inline-block', width: '50px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                    </>
                                )}
                            </div>
                        ) : tag.dataType === 'time' ? (
                            <div style={{
                                flex: 1,
                                minWidth: '60px',
                                fontSize: '10px',
                                color: tag.value ? '#000' : '#999',
                                fontWeight: tag.value ? '500' : 'normal',
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '4px'
                            }}>
                                {tag.value || (
                                    <>
                                        <span style={{ display: 'inline-block', width: '30px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ lineHeight: '14px' }}>:</span>
                                        <span style={{ display: 'inline-block', width: '30px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                    </>
                                )}
                            </div>
                        ) : tag.dataType === 'datetime' ? (
                            <div style={{
                                flex: 1,
                                minWidth: '120px',
                                fontSize: '10px',
                                color: tag.value ? '#000' : '#999',
                                fontWeight: tag.value ? '500' : 'normal',
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '4px'
                            }}>
                                {tag.value || (
                                    <>
                                        <span style={{ display: 'inline-block', width: '25px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ lineHeight: '14px' }}>/</span>
                                        <span style={{ display: 'inline-block', width: '25px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ lineHeight: '14px' }}>/</span>
                                        <span style={{ display: 'inline-block', width: '40px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ marginLeft: '4px', marginRight: '4px', lineHeight: '14px' }}>-</span>
                                        <span style={{ display: 'inline-block', width: '25px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                        <span style={{ lineHeight: '14px' }}>:</span>
                                        <span style={{ display: 'inline-block', width: '25px', borderBottom: '1px solid #999', height: '14px' }}></span>
                                    </>
                                )}
                            </div>
                        ) : tag.dataType === 'textarea' ? (
                            <div style={{
                                flex: 1,
                                width: '100%',
                                fontSize: '9px',
                                color: tag.value ? '#000' : '#999',
                                fontWeight: tag.value ? '400' : 'normal',
                                minHeight: tag.rows ? `${tag.rows * 20}px` : '60px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                {tag.value ? (
                                    <div style={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.6',
                                        padding: '6px',
                                        backgroundColor: '#fafafa',
                                        borderRadius: '2px',
                                        border: '1px solid #e0e0e0'
                                    }}>
                                        {tag.value}
                                    </div>
                                ) : (
                                    <>
                                        {Array.from({ length: (tag.rows || 3) - 1 }).map((_, idx) => (
                                            <span key={idx} style={{
                                                display: 'block',
                                                width: '100%',
                                                borderBottom: '1px solid #999',
                                                height: '18px'
                                            }}></span>
                                        ))}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                flex: 1,
                                minWidth: '100px',
                                fontSize: '10px',
                                color: tag.value ? '#000' : '#999',
                                fontWeight: tag.value ? '500' : 'normal',
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'flex-end'
                            }}>
                                {tag.value || (
                                    <span style={{ display: 'inline-block', width: '100%', borderBottom: '1px solid #999', height: '14px' }}></span>
                                )}
                            </div>
                        )}
                        {tag.dataType !== 'textarea' && <></>}
                    </div>
                </div>
            ))}
        </div>
    );

    // Render contract header
    const renderHeader = () => (
        <>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '3px double #1890ff'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <img
                            src={Assets.Agrisa.src}
                            alt="Agrisa Logo"
                            style={{ width: '32px', height: '32px' }}
                        />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
                                AGRISA IPP
                            </div>
                            <div style={{ fontSize: '9px', color: '#666' }}>
                                Insurance Partner Platform
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                        Số HĐ: <strong>AGRI-{new Date().getFullYear()}-XXXX</strong>
                    </div>
                    <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>
                        Ngày lập: {new Date().toLocaleDateString('vi-VN')}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                    HỢP ĐỒNG BẢO HIỂM NÔNG NGHIỆP
                </Title>
                <Text type="secondary" style={{ fontSize: '10px', fontStyle: 'italic' }}>
                    Agricultural Insurance Contract
                </Text>
            </div>
        </>
    );

    // Render contract footer (signatures)
    const renderFooter = () => (
        <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '2px solid #e8e8e8'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                        BÊN MUA BẢO HIỂM
                    </Text>
                    <Text type="secondary" style={{ fontSize: '9px', fontStyle: 'italic', display: 'block', marginBottom: '40px' }}>
                        (Ký, ghi rõ họ tên)
                    </Text>
                    <div style={{
                        borderTop: '1px solid #333',
                        paddingTop: '6px',
                        marginLeft: '30px',
                        marginRight: '30px'
                    }}>
                        <Text type="secondary" style={{ fontSize: '9px' }}></Text>
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                        BÊN BẢO HIỂM
                    </Text>
                    <Text type="secondary" style={{ fontSize: '9px', fontStyle: 'italic', display: 'block', marginBottom: '40px' }}>
                        (Ký, đóng dấu, ghi rõ họ tên)
                    </Text>
                    <div style={{
                        borderTop: '1px solid #333',
                        paddingTop: '6px',
                        marginLeft: '30px',
                        marginRight: '30px'
                    }}>
                        <Text type="secondary" style={{ fontSize: '9px' }}></Text>
                    </div>
                </div>
            </div>
        </div>
    );

    // Hidden measurement container
    const measurementContent = (
        <div
            ref={measureRef}
            style={{
                position: 'absolute',
                left: '-9999px',
                top: 0,
                width: `${A4_WIDTH}px`,
                padding: '60px 48px',
                visibility: 'hidden',
                pointerEvents: 'none'
            }}
        >
            {rows.map((row, rowIdx) => renderRow(row, rowIdx))}
        </div>
    );

    const content = (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f5f5f5',
                padding: '16px',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start'
            }}
        >
            {/* Scaled A4 Container */}
            <div style={{
                width: `${A4_WIDTH}px`,
                minHeight: 'auto',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out',
                marginBottom: `${A4_HEIGHT * scale - A4_HEIGHT}px` // Compensate for scale
            }}>
                {/* A4 Page Container - Fixed A4 size, content scales */}
                <div
                    ref={contentRef}
                    className="contract-preview-a4"
                    style={{
                        width: `${A4_WIDTH}px`,
                        minHeight: 'auto',
                        backgroundColor: 'white',
                        padding: '60px 48px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '11px',
                        position: 'relative',
                        boxSizing: 'border-box'
                    }}
                >
                    {renderHeader()}

                    {/* Contract Content - Dynamic Tags in responsive layout */}
                    <div style={{ marginTop: '20px', minHeight: '300px' }}>
                        {sortedTags.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#999',
                                border: '2px dashed #e0e0e0',
                                borderRadius: '8px'
                            }}>
                                <InfoCircleOutlined style={{ fontSize: '36px', marginBottom: '12px', color: '#d9d9d9' }} />
                                <div style={{ fontSize: '12px', fontWeight: '500' }}>Chưa có trường thông tin</div>
                                <div style={{ fontSize: '10px', marginTop: '6px', color: '#bbb' }}>
                                    Thêm các trường từ bên trái để xem trước hợp đồng
                                </div>
                            </div>
                        ) : (
                            <div>
                                {rows.map((row, rowIdx) => renderRow(row, rowIdx))}
                            </div>
                        )}
                    </div>

                    {renderFooter()}

                    {/* Footer note */}
                    <div style={{
                        marginTop: '20px',
                        padding: '8px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        fontSize: '8px',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        Hợp đồng này được tạo và quản lý thông qua nền tảng Agrisa Insurance Partner Platform
                    </div>
                </div>
            </div>
        </div>
    );

    // If used in sidebar, wrap in Card with export button in header
    return (
        <Card
            title={isFullscreen ? null : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Space size="small">
                        <FileTextOutlined />
                        <span style={{ fontSize: '14px' }}>Xem trước Hợp đồng</span>
                    </Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => message.info('Chức năng xuất PDF sẽ được triển khai sau')}
                        className="no-print"
                    >
                        Xuất
                    </Button>
                </div>
            )}
            size="small"
            style={{
                fontSize: '12px',
                maxHeight: '100%',
                overflow: 'hidden'
            }}
            bodyStyle={{
                padding: '0',
                height: 'calc(100vh - 200px)',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            {content}
        </Card>
    );
};

export default ContractPreview;