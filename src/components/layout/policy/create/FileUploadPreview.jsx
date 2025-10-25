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
    const fileInputRef = useRef(null);

    // Upload props for Ant Design Upload component
    const uploadProps = {
        name: 'file',
        multiple: false,
        accept: '.pdf',
        showUploadList: false,
        beforeUpload: (file) => {
            // Validate file type - only PDF
            const validExtensions = ['.pdf'];
            const fileName = file.name.toLowerCase();
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

            const validMimeTypes = [
                'application/pdf'
            ];
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

            return false; // Prevent auto upload
        },
        onChange: async (info) => {
            const { file } = info;

            if (file.status === 'uploading') {
                setLoading(true);
                setUploadProgress(0);
                return;
            }

            if (file.status === 'done' || file.originFileObj) {
                try {
                    setLoading(true);
                    setUploadProgress(50);

                    // Create file URL for preview
                    const fileToProcess = file.originFileObj || file;
                    const url = URL.createObjectURL(fileToProcess);
                    setFileUrl(url);
                    setUploadedFile(fileToProcess);

                    setUploadProgress(100);
                    message.success(`${fileToProcess.name} đã được tải lên thành công`);

                    // Call parent callback if provided
                    if (onFileUpload) {
                        onFileUpload(fileToProcess, url);
                    }

                } catch (error) {
                    console.error('File processing error:', error);
                    message.error('Có lỗi xảy ra khi xử lý file: ' + error.message);
                } finally {
                    setLoading(false);
                    setUploadProgress(0);
                }
            } else if (file.status === 'error') {
                console.error('Upload error:', file.error);
                message.error('Tải file thất bại');
                setLoading(false);
                setUploadProgress(0);
            }
        },
        onRemove: () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
            setUploadedFile(null);
            setFileUrl(null);
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
                    <FilePdfOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
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
                        onClick={() => window.open(fileUrl, '_blank')}
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
                    <iframe
                        src={fileUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            background: 'white'
                        }}
                        title="PDF Preview"
                    />
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
    return (
        <div style={{
            height: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {!uploadedFile ? renderUploadArea() : renderFilePreview()}
        </div>
    );
};

export default FileUploadPreview;