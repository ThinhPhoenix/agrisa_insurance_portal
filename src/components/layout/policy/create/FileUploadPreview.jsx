import {
    CopyOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileSearchOutlined,
    UploadOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Input,
    message,
    Modal,
    Progress,
    Space,
    Spin,
    Tooltip,
    Typography,
    Upload
} from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { analyzePDFForPlaceholders } from './PDFPlaceholderDetector';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUploadPreview = forwardRef(({
    tagsData,
    onFileUpload,
    onFileRemove,
    onPlaceholdersDetected,
    compactButtons = false,
    // allow parent to control/persist uploaded file across unmounts
    uploadedFile: uploadedFileProp = null,
    fileUrl: fileUrlProp = null
}, ref) => {
    useImperativeHandle(ref, () => ({
        openPasteModal: () => handleOpenPasteModal(),
        openFullscreen: () => handleFullscreenOpen()
    }));

    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pdfError, setPdfError] = useState(null);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [placeholders, setPlaceholders] = useState([]);
    const [pasteTextModalVisible, setPasteTextModalVisible] = useState(false);
    const [pastedText, setPastedText] = useState('');
    const [modifiedText, setModifiedText] = useState(null);
    const [modifiedTextUrl, setModifiedTextUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Sync with parent-controlled uploaded file (preserve across unmounts)
    useEffect(() => {
        if (uploadedFileProp) {
            // parent has a file; adopt it
            setUploadedFile(uploadedFileProp);
            setFileUrl(fileUrlProp);
        } else {
            // parent cleared file
            setUploadedFile(null);
            setFileUrl(null);
            setPlaceholders([]);
            setPdfError(null);
        }
        // only respond to explicit prop changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFileProp, fileUrlProp]);

    // Upload props for Ant Design Upload component
    const uploadProps = {
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
                message.error(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận file PDF`);
                return false;
            }

            // Validate file size (max 10MB)
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File không được vượt quá 10MB');
                return false;
            }

            try {
                setLoading(true);
                setUploadProgress(50);

                const url = URL.createObjectURL(file);
                setFileUrl(url);
                setUploadedFile(file);

                setUploadProgress(100);
                message.success(`${file.name} đã được tải lên thành công`);

                if (onFileUpload) onFileUpload(file, url);

                // Auto analyze PDF for placeholders
                analyzePDF(file);
            } catch (error) {
                console.error('File processing error:', error);
                message.error('Có lỗi xảy ra khi xử lý file: ' + (error?.message || error));
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
    };


    const handleRemoveFile = () => {
        if (fileUrl) {
            URL.revokeObjectURL(fileUrl);
        }
        setUploadedFile(null);
        setFileUrl(null);
        setPdfError(null);
        setPlaceholders([]);
        if (onFileRemove) {
            onFileRemove();
        }
        message.success('File đã được xóa');
    };

    // Analyze PDF for placeholders
    const analyzePDF = async (file) => {
        setAnalyzing(true);
        try {
            const result = await analyzePDFForPlaceholders(file);

            if (result && result.placeholders) {
                setPlaceholders(result.placeholders);

                // Notify parent

                // Notify parent
                if (onPlaceholdersDetected) {
                    onPlaceholdersDetected(result.placeholders);
                }
            }
        } catch (error) {
            console.error('Error analyzing PDF:', error);
            message.error('Không thể phân tích PDF: ' + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // Handle paste text from PDF
    const handleOpenPasteModal = () => {
        setPasteTextModalVisible(true);
        setPastedText('');
    };

    const handlePasteTextSubmit = () => {
        if (!pastedText.trim()) {
            message.warning('Vui lòng paste nội dung PDF vào ô text');
            return;
        }

        setAnalyzing(true);
        setPasteTextModalVisible(false);

        try {
            // Detect placeholders from pasted text
            const { detectPlaceholders } = require('./PDFPlaceholderDetector');
            const detectedPlaceholders = detectPlaceholders(pastedText);

            setPlaceholders(detectedPlaceholders);

            if (detectedPlaceholders.length > 0) {
                message.success(`Tìm thấy ${detectedPlaceholders.length} placeholders!`);

                // Notify parent
                if (onPlaceholdersDetected) {
                    onPlaceholdersDetected(detectedPlaceholders);
                }
            } else {
                message.warning('Không tìm thấy placeholder nào. Vui lòng kiểm tra format: (1), (2)...');
            }
        } catch (error) {
            console.error('Error detecting placeholders:', error);
            message.error('Lỗi khi phân tích text: ' + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // Note: mapping and modified-text generation moved to TagsTab; preview only handles file display and placeholder detection

    const handleDownloadFile = () => {
        if (fileUrl && uploadedFile) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = uploadedFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // PDF callbacks - Not needed with iframe
    const onPdfLoad = () => {
        console.log('📄 PDF loaded successfully in iframe');
        setPdfError(null);
    };

    const onPdfError = () => {
        console.error('❌ PDF load error in iframe');
        setPdfError('Không thể tải PDF. File có thể bị hỏng hoặc không hợp lệ.');
        message.error('Không thể tải PDF. Vui lòng kiểm tra file.');
    };

    // Fullscreen handlers
    const handleFullscreenOpen = () => {
        setFullscreenVisible(true);
    };

    const handleFullscreenClose = () => {
        setFullscreenVisible(false);
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
                        • File sẽ được xử lý để phát hiện các placeholder tự động
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
                            {analyzing && (
                                <Space>
                                    <Spin size="small" />
                                    <Text type="secondary">Đang phân tích...</Text>
                                </Space>
                            )}

                            <Tooltip title="Paste text từ PDF">
                                <Button
                                    type="default"
                                    icon={<CopyOutlined />}
                                    onClick={handleOpenPasteModal}
                                    size="small"
                                />
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
                            ) : (
                                <iframe
                                    src={fileUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '600px',
                                        border: 'none'
                                    }}
                                    title="PDF Preview"
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
    console.log('🎨 Rendering FileUploadPreview, uploadedFile:', uploadedFile?.name || 'null');

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <EyeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span>{uploadedFile?.name} - Xem toàn màn hình</span>
                    </div>
                }
                open={fullscreenVisible}
                onCancel={handleFullscreenClose}
                footer={null}
                width="95vw"
                style={{ top: 20, padding: 0 }}
                bodyStyle={{ height: '90vh', padding: 0 }}
                centered
                destroyOnClose
            >
                <iframe
                    src={fileUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    }}
                    title="PDF Fullscreen Preview"
                />
            </Modal>

            {/* Paste Text Modal */}
            <Modal
                title={
                    <Space>
                        <CopyOutlined style={{ color: '#1890ff' }} />
                        <span>Paste nội dung từ PDF</span>
                    </Space>
                }
                open={pasteTextModalVisible}
                onCancel={() => setPasteTextModalVisible(false)}
                onOk={handlePasteTextSubmit}
                okText="Phát hiện Placeholders"
                cancelText="Hủy"
                width={800}
                okButtonProps={{ icon: <FileSearchOutlined /> }}
            >
                <Alert
                    message="Hướng dẫn"
                    description={
                        <div>
                            <p>1. Mở file PDF trong trình xem PDF (browser hoặc Adobe Reader)</p>
                            <p>2. Chọn toàn bộ nội dung (Ctrl+A) và copy (Ctrl+C)</p>
                            <p>3. Paste vào ô bên dưới (Ctrl+V)</p>
                            <p>4. Hệ thống sẽ tự động tìm các placeholders dạng: <code>(1)</code>, <code>(2)</code>, <code>{'{{key}}'}</code></p>
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Input.TextArea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste nội dung PDF vào đây...&#10;&#10;Ví dụ:&#10;Họ và tên: ...................(1)...................&#10;Ngày sinh: ...................(2)...................&#10;Địa chỉ: ...................(3)..................."
                    rows={15}
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
                <div style={{ marginTop: 12, color: '#666', fontSize: '12px' }}>
                    💡 Tip: Placeholders phải có format đúng: <code>(1)</code>, <code>(2)</code>... hoặc <code>{'{{name}}'}</code>
                </div>
            </Modal>
        </>
    );
});

export default FileUploadPreview;