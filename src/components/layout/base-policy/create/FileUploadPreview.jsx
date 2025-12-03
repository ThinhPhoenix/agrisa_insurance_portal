import {
    getPdfError,
    getPdfInfo,
    getPdfSuccess,
    getTagsError,
    getTagsSuccess
} from '@/libs/message';
import {
    AimOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EyeOutlined,
    UploadOutlined
} from '@ant-design/icons';
import {
    Button,
    message,
    Modal,
    Progress,
    Space,
    Spin,
    Tooltip,
    Typography,
    Upload
} from 'antd';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { analyzePDFForPlaceholders } from '../../../../libs/pdf/PDFPlaceholderDetector';
import PDFViewerWithSelection from './PDFViewerWithSelection';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUploadPreview = forwardRef(({
    tagsData,
    onFileUpload,
    onFileRemove,
    onPlaceholdersDetected,
    onCreatePlaceholder, //  NEW: Callback for placeholder creation (placement mode)
    onCreateAndApplyField, // NEW: Callback to create field and apply AcroForm immediately
    placeholders: detectedPlaceholders = [], // NEW: Detected placeholders (renamed to avoid conflict)
    tagDataTypes = [], // NEW: Available data types
    compactButtons = false,
    tags = [], //  NEW: Tags for manual placement
    // allow parent to control/persist uploaded file across unmounts
    uploadedFile: uploadedFileProp = null,
    fileUrl: fileUrlProp = null
}, ref) => {
    useImperativeHandle(ref, () => ({
        openFullscreen: () => handleFullscreenOpen(),

        //  NEW: Update with fillable PDF (called from PlaceholderMappingPanel after createFillablePDF)
        updateFillablePDF: async (fillableFile, fillableBytes) => {
            try {
                console.log('🔄 updateFillablePDF called with file:', fillableFile.name, fillableFile.size);

                // Cleanup old URL first
                if (fileUrl) {
                    console.log('🗑️ Revoking old URL:', fileUrl);
                    URL.revokeObjectURL(fileUrl);
                }

                // Create new blob URL for fillable PDF with cache-busting timestamp
                const blob = new Blob([fillableFile], { type: 'application/pdf' });
                const newUrl = URL.createObjectURL(blob);
                const urlWithTimestamp = `${newUrl}#t=${Date.now()}`; // Add timestamp to force reload
                console.log('🆕 Created new URL:', urlWithTimestamp);

                // Update state to show fillable PDF in iframe
                setUploadedFile(fillableFile);
                setFileUrl(urlWithTimestamp);
                setModifiedPdfBytes(fillableBytes);
                setIframeKey(Date.now()); // 🆕 Force iframe to reload

                // Notify parent
                if (onFileUpload) {
                    onFileUpload(fillableFile, urlWithTimestamp);
                }

                console.log('✅ Fillable PDF updated in FileUploadPreview, iframe will reload with key:', Date.now());

                return {
                    success: true,
                    url: urlWithTimestamp,
                    file: fillableFile
                };
            } catch (error) {
                console.error('❌ Error updating fillable PDF:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        //  Apply replacements - OVERWRITE uploadedFile (In-place Editing)
        applyReplacements: async (replacements) => {
            if (!uploadedFile) {
                return { success: false, error: 'No file uploaded' };
            }

            try {
                setAnalyzing(true);
                message.loading(getPdfInfo('APPLYING'), 0);

                // Read current file
                const arrayBuffer = await uploadedFile.arrayBuffer();

                // Validate arrayBuffer
                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    throw new Error('Invalid PDF file: ArrayBuffer is empty');
                }

                // Dynamic import pdf-lib (code splitting)
                const { replacePlaceholdersInPDF } = await import('../../../../libs/pdf/pdfEditor');

                // Apply replacements
                const result = await replacePlaceholdersInPDF(arrayBuffer, replacements);

                //  Extract pdfBytes from result object
                const modifiedBytes = result.pdfBytes || result; // Backward compatibility
                const warnings = result.warnings || [];

                // Validate modifiedBytes
                if (!modifiedBytes || modifiedBytes.byteLength === 0) {
                    throw new Error('Invalid modified PDF: Bytes are empty');
                }

                // ⭐ OVERWRITE: Convert bytes to File object
                const newFile = new File(
                    [modifiedBytes],  //  Now correctly contains Uint8Array
                    uploadedFile.name,
                    { type: 'application/pdf' }
                );

                // ⭐ OVERWRITE: Create new blob URL first (BEFORE setState)
                const newUrl = URL.createObjectURL(newFile);

                // ⭐ OVERWRITE: Update uploadedFile state
                setUploadedFile(newFile);

                // ⭐ OVERWRITE: Notify parent to update fileUrl
                if (onFileUpload) {
                    onFileUpload(newFile, newUrl);  // Pass newUrl, not null!
                }

                // ⭐ OVERWRITE: Update LOCAL fileUrl state (will trigger iframe reload)
                // Note: Parent will also update fileUrl via callback, which syncs back via useEffect
                setFileUrl(newUrl);

                // ⭐ Cleanup old blob URL after a delay (prevent race condition)
                if (fileUrl) {
                    setTimeout(() => {
                        URL.revokeObjectURL(fileUrl);
                    }, 500);
                }

                // Store bytes for download/submit
                setModifiedPdfBytes(modifiedBytes);

                message.destroy();
                message.success(getPdfSuccess('APPLIED_TO_PDF'));

                return {
                    success: true,
                    url: newUrl,
                    bytes: modifiedBytes,
                    file: newFile
                };
            } catch (error) {
                message.destroy();
                message.error(getPdfError('APPLY_FAILED'));
                console.error('[FileUploadPreview] PDF apply error:', error);

                return {
                    success: false,
                    error: error.message
                };
            } finally {
                setAnalyzing(false);
            }
        },

        //  Get current file (for backend submission)
        getCurrentFile: () => {
            if (!uploadedFile) {
                return {
                    success: false,
                    error: 'No file available'
                };
            }

            return {
                success: true,
                file: uploadedFile,
                url: fileUrl
            };
        },

        // 🆕 Get original unmodified file (for rebuild after delete)
        getOriginalFile: () => {
            if (!originalFile) {
                return {
                    success: false,
                    error: 'No original file available'
                };
            }

            return {
                success: true,
                file: originalFile
            };
        }
    }));

    const [uploadedFile, setUploadedFile] = useState(null);
    const [originalFile, setOriginalFile] = useState(null); // Store original unmodified PDF
    const [fileUrl, setFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [iframeKey, setIframeKey] = useState(Date.now()); // 🆕 Force iframe reload

    //  Sync fileUrlProp from parent into local state
    useEffect(() => {
        if (fileUrlProp !== null && fileUrlProp !== fileUrl) {
            setFileUrl(fileUrlProp);
        }
    }, [fileUrlProp]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pdfError, setPdfError] = useState(null);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [placeholders, setPlaceholders] = useState([]);
    const [isPlacementMode, setIsPlacementMode] = useState(false);
    const [modifiedText, setModifiedText] = useState(null);
    const [modifiedTextUrl, setModifiedTextUrl] = useState(null);
    const fileInputRef = useRef(null);

    // State for modified PDF bytes (for in-place editing)
    const [modifiedPdfBytes, setModifiedPdfBytes] = useState(null);

    // Helper: convert File to base64 data URL
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });

    // Sync with parent-controlled uploaded file (preserve across unmounts)
    useEffect(() => {
        if (uploadedFileProp) {
            // parent has a file; adopt it
            setUploadedFile(uploadedFileProp);

            // ✅ CRITICAL FIX: Only set originalFile if it's not already set
            // originalFile should NEVER be updated after initial upload
            // because it must remain the TRUE original PDF (not fillable PDF)
            setOriginalFile(prev => {
                if (!prev) {
                    console.log('📦 Setting originalFile from parent (first time):', {
                        name: uploadedFileProp.name,
                        size: uploadedFileProp.size
                    });
                    return uploadedFileProp;
                } else {
                    console.log('⏭️ Skipping originalFile update - already set:', {
                        original: { name: prev.name, size: prev.size },
                        newFile: { name: uploadedFileProp.name, size: uploadedFileProp.size }
                    });
                    return prev; // Keep original
                }
            });

            setFileUrl(fileUrlProp);
        } else {
            // parent cleared file
            setUploadedFile(null);
            setOriginalFile(null);
            setFileUrl(null);
            setPlaceholders([]);
            setPdfError(null);
        }
        // only respond to explicit prop changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFileProp, fileUrlProp]);

    //  OPTIMIZATION: Memoize handleRemoveFile
    const handleRemoveFile = useCallback(() => {
        if (fileUrl) {
            URL.revokeObjectURL(fileUrl);
        }
        setUploadedFile(null);
        setOriginalFile(null); // Clear original file
        setFileUrl(null);
        setPdfError(null);
        setPlaceholders([]);
        if (onFileRemove) {
            onFileRemove();
        }
        message.success(getPdfSuccess('REMOVED'));
    }, [fileUrl, onFileRemove]);

    //  OPTIMIZATION: Memoize analyzePDF to prevent re-creation
    const analyzePDF = useCallback(async (file) => {
        setAnalyzing(true);
        try {
            //  OPTIMIZATION: Delay analysis for large files to allow UI to render first
            const fileSizeMB = file.size / 1024 / 1024;
            if (fileSizeMB > 5) {
                // For files > 5MB, delay analysis by 500ms to allow UI to render
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const result = await analyzePDFForPlaceholders(file);

            if (result && result.placeholders) {
                setPlaceholders(result.placeholders);

                // Notify parent
                if (onPlaceholdersDetected) {
                    onPlaceholdersDetected(result.placeholders);
                }
            }
        } catch (error) {
            console.error('[FileUploadPreview] PDF analysis error:', error);
            message.error(getPdfError('ANALYSIS_FAILED'));
        } finally {
            setAnalyzing(false);
        }
    }, [onPlaceholdersDetected]);

    //  OPTIMIZATION: Memoize uploadProps to prevent re-creation
    // IMPORTANT: Must be defined AFTER analyzePDF
    const uploadProps = useMemo(() => ({
        name: 'file',
        multiple: false,
        accept: '.pdf',
        showUploadList: false,
        beforeUpload: async (file) => {
            // Validate file type - only PDF
            const validExtensions = ['.pdf'];
            const fileName = file.name.toLowerCase();
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

            const validMimeTypes = ['application/pdf'];
            const hasValidMimeType = validMimeTypes.includes(file.type);

            if (!hasValidExtension && !hasValidMimeType) {
                message.error(getPdfError('INVALID_FILE_TYPE'));
                return false;
            }

            // Validate file size (max 10MB)
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error(getPdfError('FILE_TOO_LARGE', { maxSize: 10 }));
                return false;
            }

            try {
                setLoading(true);
                setUploadProgress(50);

                const url = URL.createObjectURL(file);
                setFileUrl(url);
                setUploadedFile(file);
                setOriginalFile(file); // 🆕 Store original unmodified PDF

                // Convert file to base64 and log the string (data URL)
                try {
                    const base64 = await fileToBase64(file);
                    // Log only the base64/data URL string as requested
                } catch (convErr) {
                }

                setUploadProgress(100);
                if (onFileUpload) onFileUpload(file, url);

                // Auto analyze PDF for placeholders
                analyzePDF(file);
            } catch (error) {
                console.error('[FileUploadPreview] File processing error:', error);
                message.error(getPdfError('UPLOAD_FAILED'));
            } finally {
                setLoading(false);
                setUploadProgress(0);
            }

            return false; // Prevent auto upload
        },
        onChange: (info) => {
            if (info.fileList.length === 0) {
                setUploadedFile(null);
                setFileUrl(null);
                setPdfError(null);
                if (onFileRemove) onFileRemove();
            }
        },
        onRemove: () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
            setUploadedFile(null);
            setFileUrl(null);
            setPdfError(null);
            if (onFileRemove) onFileRemove();
        }
    }), [analyzePDF, onFileUpload, onFileRemove, fileUrl]);

    //  OPTIMIZATION: Memoize handleDownloadFile
    const handleDownloadFile = useCallback(() => {
        if (fileUrl && uploadedFile) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = uploadedFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [fileUrl, uploadedFile]);

    // PDF callbacks - Not needed with iframe
    const onPdfLoad = () => {
        setPdfError(null);
    };

    const onPdfError = () => {
        const errorMsg = getPdfError('FILE_CORRUPTED');
        setPdfError(errorMsg);
        message.error(errorMsg);
    };

    //  OPTIMIZATION: Memoize fullscreen handlers
    const handleFullscreenOpen = useCallback(() => {
        setFullscreenVisible(true);
    }, []);

    const handleFullscreenClose = useCallback(() => {
        setFullscreenVisible(false);
    }, []);

    //  OPTIMIZATION: Memoize placement mode handlers
    const handleEnterPlacementMode = useCallback(() => {
        setIsPlacementMode(true);
        setFullscreenVisible(true); // Auto-open fullscreen for better drag selection
        message.info({
            content: 'Chế độ quét đã bật. Kéo chuột để chọn vùng trường trên PDF.',
            duration: 4,
            icon: <AimOutlined style={{ color: '#1890ff' }} />
        });
    }, []);

    const handleExitPlacementMode = useCallback(() => {
        setIsPlacementMode(false);
        // Removed success message - silent exit from scan mode
    }, []);

    const handleTagPlaced = async ({ tag, coordinates }) => {
        try {
            message.loading('Đang ghi tag vào PDF...', 0);

            // Apply tag to PDF using existing replacement logic
            const replacement = {
                page: coordinates.page,
                x: coordinates.x,
                y: coordinates.y,
                width: coordinates.width,
                height: coordinates.height,
                oldText: '', // No old text to replace
                newText: tag.key,
                fontSize: coordinates.height || 10
            };

            // Get current PDF bytes
            const arrayBuffer = await uploadedFile.arrayBuffer();

            // Apply replacement
            const modifiedBytes = await applyPDFReplacements(arrayBuffer, [replacement]);

            // Create new File object
            const modifiedBlob = new Blob([modifiedBytes], { type: 'application/pdf' });
            const modifiedFile = new File([modifiedBlob], uploadedFile.name, { type: 'application/pdf' });

            // Update state
            setUploadedFile(modifiedFile);
            setModifiedPdfBytes(modifiedBytes);

            // Create new URL for modified file
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
            const newUrl = URL.createObjectURL(modifiedFile);
            setFileUrl(newUrl);

            message.destroy();
            message.success(getTagsSuccess('MAPPED'));
        } catch (error) {
            message.destroy();
            message.error(getTagsError('CREATION_FAILED'));
            console.error('[FileUploadPreview] Tag write error:', error);
        }
    };

    const renderUploadArea = () => (
        <div style={{ padding: '20px' }}>
            <Dragger {...uploadProps} disabled={loading}>
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <Title level={4} style={{ marginBottom: '8px' }}>
                        Tải lên file PDF mẫu hợp đồng
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        Kéo thả file PDF vào đây, hoặc click để chọn file
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        • Hỗ trợ: PDF<br />
                        • Dung lượng tối đa: 10MB<br />
                        • File sẽ được xử lý để phát hiện các trường thông tin tự động
                    </Text>
                </div>
            </Dragger>

            {loading && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '12px' }}>
                        <Text>Đang xử lý file...</Text>
                        <Progress percent={uploadProgress} size="small" style={{ marginTop: '8px' }} />
                    </div>
                </div>
            )}
        </div>
    );

    const renderFilePreview = () => (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* File Info Header */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                            <Text
                                strong
                                style={{
                                    display: 'block',
                                    maxWidth: '48vw',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                                title={uploadedFile?.name}
                            >
                                {uploadedFile?.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                {placeholders.length > 0 && (
                                    <> • {placeholders.length} placeholders được phát hiện</>
                                )}
                            </Text>
                        </div>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <Space>
                            <Tooltip title={isPlacementMode ? "Thoát chế độ quét" : "Chế độ quét - Tạo trường thông tin"}>
                                <Button
                                    type={isPlacementMode ? "primary" : "default"}
                                    icon={<AimOutlined />}
                                    onClick={isPlacementMode ? handleExitPlacementMode : handleEnterPlacementMode}
                                    size="small"
                                    danger={isPlacementMode}
                                >
                                    {isPlacementMode ? "Thoát chế độ quét" : "Chế độ quét"}
                                </Button>
                            </Tooltip>

                            <Tooltip title="Toàn màn hình">
                                <Button
                                    icon={<EyeOutlined />}
                                    onClick={handleFullscreenOpen}
                                    size="small"
                                />
                            </Tooltip>

                            <Tooltip title="Tải xuống">
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={handleDownloadFile}
                                    size="small"
                                />
                            </Tooltip>

                            <Tooltip title="Xóa file">
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleRemoveFile}
                                    size="small"
                                />
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>

            {/* PDF Preview */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}>
                <div style={{
                    height: '100%',
                    overflow: 'auto',
                    background: '#f5f5f5',
                    // padding: '20px'
                }}>
                    {fileUrl ? (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'white',
                            border: '1px solid #d9d9d9',
                            overflow: 'hidden',
                            minHeight: '600px'
                        }}>
                            {pdfError ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '400px',
                                    color: '#ff4d4f',
                                    textAlign: 'center',
                                    background: 'white',
                                    padding: '20px',
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <Text type="danger" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                                            {pdfError}
                                        </Text>
                                        <Text type="secondary">
                                            Vui lòng thử tải lại file hoặc kiểm tra định dạng PDF
                                        </Text>
                                    </div>
                                </div>
                            ) : isPlacementMode ? (
                                <PDFViewerWithSelection
                                    pdfUrl={fileUrl}
                                    tags={tags}
                                    onTagPlaced={handleTagPlaced}
                                    isPlacementMode={isPlacementMode}
                                    onExitPlacementMode={handleExitPlacementMode}
                                    onCreatePlaceholder={onCreatePlaceholder}
                                    onCreateAndApplyField={onCreateAndApplyField}
                                    placeholders={detectedPlaceholders}
                                    tagDataTypes={tagDataTypes}
                                    onCloseFullscreen={handleFullscreenClose}
                                />
                            ) : (
                                <iframe
                                    key={`pdf-${iframeKey}`}
                                    src={`${fileUrl}#toolbar=0`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '600px',
                                        border: 'none'
                                    }}
                                    title="Xem trước PDF"
                                    onLoad={onPdfLoad}
                                    onError={onPdfError}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            background: 'white',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px'
                        }}>
                            <Text type="secondary">Chưa có file PDF nào được tải lên</Text>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Normal mode
    return (
        <>
            <div style={{
                height: '100%',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {!uploadedFile ? renderUploadArea() : renderFilePreview()}
            </div>

            {/* Fullscreen Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {isPlacementMode ? (
                                <AimOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                            ) : (
                                <EyeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                            )}
                            <span>{uploadedFile?.name} {isPlacementMode && '- Chế độ quét'}</span>
                        </div>
                        {isPlacementMode && (
                            <Button
                                type="primary"
                                danger
                                onClick={handleExitPlacementMode}
                            >
                                Thoát chế độ quét
                            </Button>
                        )}
                    </div>
                }
                open={fullscreenVisible}
                onCancel={() => {
                    handleFullscreenClose();
                    if (isPlacementMode) {
                        handleExitPlacementMode();
                    }
                }}
                footer={null}
                width="95vw"
                style={{ top: 20, padding: 0 }}
                styles={{ body: { height: '90vh', padding: 0 } }}
                centered
                destroyOnClose
            >
                {isPlacementMode ? (
                    <PDFViewerWithSelection
                        pdfUrl={fileUrl}
                        tags={tags}
                        onTagPlaced={handleTagPlaced}
                        isPlacementMode={isPlacementMode}
                        onExitPlacementMode={() => {
                            handleExitPlacementMode();
                            handleFullscreenClose();
                        }}
                        onCreatePlaceholder={onCreatePlaceholder}
                        onCreateAndApplyField={onCreateAndApplyField}
                        placeholders={detectedPlaceholders}
                        tagDataTypes={tagDataTypes}
                        onCloseFullscreen={handleFullscreenClose}
                    />
                ) : (
                    <iframe
                        key={`pdf-fullscreen-${iframeKey}`}
                        src={fileUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                        }}
                        title="Xem toàn màn hình PDF"
                    />
                )}
            </Modal>
        </>
    );
});

export default FileUploadPreview;