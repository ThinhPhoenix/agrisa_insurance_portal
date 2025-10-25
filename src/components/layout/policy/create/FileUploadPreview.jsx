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
    Tabs,
    Typography,
    Upload
} from 'antd';
import { useRef, useState } from 'react';
import { analyzePDFForPlaceholders } from './PDFPlaceholderDetector';
import PlaceholderMappingPanel from './PlaceholderMappingPanel';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUploadPreview = ({
    tagsData,
    onFileUpload,
    onFileRemove,
    onPlaceholdersDetected
}) => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pdfError, setPdfError] = useState(null);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [placeholders, setPlaceholders] = useState([]);
    const [activeTab, setActiveTab] = useState('preview');
    const [pasteTextModalVisible, setPasteTextModalVisible] = useState(false);
    const [pastedText, setPastedText] = useState('');
    const [modifiedText, setModifiedText] = useState(null);
    const [modifiedTextUrl, setModifiedTextUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Upload props for Ant Design Upload component
    const uploadProps = {
        name: 'file',
        multiple: false,
        accept: '.pdf',
        showUploadList: false,
        beforeUpload: async (file) => {
            console.log('📁 Starting file upload process...', file.name);

            // Validate file type - only PDF
            const validExtensions = ['.pdf'];
            const fileName = file.name.toLowerCase();
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

            const validMimeTypes = [
                'application/pdf'
            ];
            const hasValidMimeType = validMimeTypes.includes(file.type);

            console.log('✅ File validation:', {
                hasValidExtension,
                hasValidMimeType,
                fileType: file.type,
                fileName: file.name
            });

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

            console.log('⏳ Processing file...');

            // Process the file directly here
            try {
                setLoading(true);
                setUploadProgress(50);

                // Create file URL for preview
                const url = URL.createObjectURL(file);
                console.log('🔗 Created URL:', url);

                setFileUrl(url);
                setUploadedFile(file);

                console.log('💾 State updated:', {
                    uploadedFile: file.name,
                    fileUrl: url
                });

                setUploadProgress(100);
                message.success(`${file.name} đã được tải lên thành công`);

                // Call parent callback if provided
                if (onFileUpload) {
                    console.log('📤 Calling parent callback...');
                    onFileUpload(file, url);
                }

                console.log('✅ Upload complete!');

                // Auto analyze PDF for placeholders
                analyzePDF(file);

            } catch (error) {
                console.error('❌ File processing error:', error);
                message.error('Có lỗi xảy ra khi xử lý file: ' + error.message);
            } finally {
                setLoading(false);
                setUploadProgress(0);
            }

            return false; // Prevent auto upload
        },
        onChange: (info) => {
            // Handle file removal
            if (info.fileList.length === 0) {
                setUploadedFile(null);
                setFileUrl(null);
                setPdfError(null);
                if (onFileRemove) {
                    onFileRemove();
                }
            }
        },
        onRemove: () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
            setUploadedFile(null);
            setFileUrl(null);
            setNumPages(null);
            setPageNumber(1);
            setPdfError(null);
            if (onFileRemove) {
                onFileRemove();
            }
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
        setActiveTab('preview');
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

                // Switch to mapping tab if placeholders found
                if (result.placeholders.length > 0) {
                    setActiveTab('mapping');
                }

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
                setActiveTab('mapping');

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

    // Handle mapping changes
    const handleMappingChange = async (mappings) => {
        console.log('📊 Mappings updated:', mappings);

        // Check if we have complete mappings
        const mappedCount = Object.values(mappings).filter(Boolean).length;

        if (mappedCount > 0 && uploadedFile) {
            // Generate preview with mappings
            await updatePreviewWithMappings(mappings);
        }
    };

    // Update preview with mappings applied
    const updatePreviewWithMappings = async (mappings) => {
        try {
            setAnalyzing(true);

            // Import function
            const { replacePlaceholdersInPDF } = await import('./PDFPlaceholderDetector');

            // Generate new text with replacements
            const result = await replacePlaceholdersInPDF(
                uploadedFile,
                mappings,
                tagsData?.tags || []
            );

            if (result.success) {
                setModifiedText(result.modifiedText);
                setModifiedTextUrl(result.modifiedTextUrl);

                message.success(
                    `✅ Đã thay thế ${result.replacements?.length || 0} placeholders! Xem tab "Modified Text" để preview.`
                );

                // Switch to modified text tab if available
                setActiveTab('modified');
            }
        } catch (error) {
            console.error('Error updating preview:', error);
            message.error('Không thể cập nhật preview: ' + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // Handle schema export
    const handleExportSchema = (schema) => {
        console.log('📤 Schema exported:', schema);
    };

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <EyeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div>
                        <Text strong style={{ display: 'block' }}>
                            {uploadedFile?.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {(uploadedFile?.size / 1024 / 1024).toFixed(2)} MB
                            {placeholders.length > 0 && (
                                <> • {placeholders.length} placeholders được phát hiện</>
                            )}
                        </Text>
                    </div>
                </div>

                <Space wrap>
                    {analyzing && (
                        <Space>
                            <Spin size="small" />
                            <Text type="secondary">Đang phân tích...</Text>
                        </Space>
                    )}
                    <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={handleOpenPasteModal}
                    >
                        Paste Text từ PDF
                    </Button>
                    {placeholders.length > 0 && (
                        <Button
                            type="primary"
                            icon={<FileSearchOutlined />}
                            onClick={() => setActiveTab('mapping')}
                        >
                            Xem Placeholders ({placeholders.length})
                        </Button>
                    )}
                    <Button
                        icon={<EyeOutlined />}
                        onClick={handleFullscreenOpen}
                    >
                        Toàn màn hình
                    </Button>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadFile}
                    >
                        Tải xuống
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleRemoveFile}
                    >
                        Xóa file
                    </Button>
                </Space>
            </div>

            {/* Tabs: Preview & Mapping */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                items={[
                    {
                        key: 'preview',
                        label: 'PDF Preview',
                        children: (
                            <div style={{
                                height: '100%',
                                overflow: 'auto',
                                background: '#f5f5f5',
                                padding: '20px'
                            }}>
                                {fileUrl ? (
                                    <div style={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        background: 'white',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '8px',
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
                        )
                    },
                    {
                        key: 'mapping',
                        label: (
                            <Space>
                                <FileSearchOutlined />
                                Placeholder Mapping
                                {placeholders.length > 0 && (
                                    <span style={{
                                        background: '#1890ff',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '12px'
                                    }}>
                                        {placeholders.length}
                                    </span>
                                )}
                            </Space>
                        ),
                        children: (
                            <div style={{ padding: '20px', background: '#f5f5f5' }}>
                                {analyzing ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <Spin size="large" />
                                        <div style={{ marginTop: '16px' }}>
                                            <Text>Đang phân tích PDF để tìm placeholders...</Text>
                                        </div>
                                    </div>
                                ) : (
                                    <PlaceholderMappingPanel
                                        placeholders={placeholders}
                                        tags={tagsData?.tags || []}
                                        onMappingChange={handleMappingChange}
                                        onExportSchema={handleExportSchema}
                                    />
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'modified',
                        label: (
                            <Space>
                                <FileSearchOutlined />
                                Modified Text
                                {modifiedText && (
                                    <span style={{
                                        background: '#52c41a',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '12px'
                                    }}>
                                        ✓
                                    </span>
                                )}
                            </Space>
                        ),
                        children: (
                            <div style={{ padding: '20px', background: '#f5f5f5' }}>
                                {modifiedText ? (
                                    <div>
                                        <Alert
                                            message="Text đã được thay thế thành công!"
                                            description="Placeholders đã được thay thế bằng {{tagKey}}. Download text này và gửi cho backend để generate PDF mới."
                                            type="success"
                                            showIcon
                                            style={{ marginBottom: 16 }}
                                            action={
                                                <Button
                                                    type="primary"
                                                    icon={<DownloadOutlined />}
                                                    onClick={() => {
                                                        const a = document.createElement('a');
                                                        a.href = modifiedTextUrl;
                                                        a.download = uploadedFile.name.replace('.pdf', '_modified.txt');
                                                        a.click();
                                                    }}
                                                >
                                                    Download Text
                                                </Button>
                                            }
                                        />
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            maxHeight: '600px',
                                            overflow: 'auto',
                                            fontFamily: 'monospace',
                                            fontSize: '13px',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {modifiedText}
                                        </div>
                                    </div>
                                ) : (
                                    <Alert
                                        message="Chưa có text được thay thế"
                                        description="Map placeholders với tags trong tab 'Placeholder Mapping' để generate modified text."
                                        type="info"
                                        showIcon
                                    />
                                )}
                            </div>
                        )
                    }
                ]}
            />

            {/* Status Bar */}
            <div style={{
                padding: '12px 24px',
                borderTop: '1px solid #f0f0f0',
                background: '#fafafa'
            }}>
                <Alert
                    message="File đã tải lên thành công"
                    description={`File: ${uploadedFile?.name} (${(uploadedFile?.size / 1024 / 1024).toFixed(2)} MB)${placeholders.length > 0 ? ` • ${placeholders.length} placeholders được phát hiện` : ''}`}
                    type="success"
                    showIcon
                    style={{ margin: 0 }}
                />
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
};

export default FileUploadPreview;