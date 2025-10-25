import {
    DeleteOutlined,
    DownloadOutlined,
    EyeOutlined,
    UploadOutlined
} from '@ant-design/icons';
import {
    Alert,
    Button,
    message,
    Modal,
    Progress,
    Space,
    Spin,
    Typography,
    Upload
} from 'antd';
import { useRef, useState } from 'react';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const FileUploadPreview = ({
    tagsData,
    onFileUpload,
    onFileRemove
}) => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pdfError, setPdfError] = useState(null);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
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
        if (onFileRemove) {
            onFileRemove();
        }
        message.success('File đã được xóa');
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
                        </Text>
                    </div>
                </div>

                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={handleFullscreenOpen}
                    >
                        Xem toàn màn hình
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

            {/* PDF Preview */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflow: 'auto',
                background: '#f5f5f5'
            }}>
                {fileUrl ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'white',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        {/* PDF Controls */}
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            background: '#fafafa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Alert
                                message="PDF Preview"
                                description="File PDF được hiển thị trực tiếp trong trình duyệt. Sử dụng các controls mặc định của trình duyệt để zoom và cuộn."
                                type="info"
                                showIcon
                                style={{ margin: 0 }}
                            />
                        </div>

                        {/* PDF Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '0',
                            minHeight: '500px',
                            background: '#525659'
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

            {/* Status Bar */}
            <div style={{
                padding: '12px 24px',
                borderTop: '1px solid #f0f0f0',
                background: '#fafafa'
            }}>
                <Alert
                    message="File đã tải lên thành công"
                    description={`File: ${uploadedFile?.name} (${(uploadedFile?.size / 1024 / 1024).toFixed(2)} MB)`}
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
        </>
    );
};

export default FileUploadPreview;