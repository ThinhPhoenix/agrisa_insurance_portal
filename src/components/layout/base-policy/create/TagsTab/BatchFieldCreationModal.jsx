import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Typography } from 'antd';
import { useCallback } from 'react';
import PDFViewerWithSelection from './PDFViewerWithSelection';
import StagingFieldsTable from './StagingFieldsTable';

const { Title, Text } = Typography;

/**
 * BatchFieldCreationModal Component
 *
 * Fullscreen modal for batch creating PDF fields.
 * Features:
 * - Left: PDF viewer with selection mode
 * - Right: Staging table for managing fields
 * - Single PDF rebuild when applying all fields
 *
 * @param {Boolean} visible - Modal visibility
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onApplyAll - Callback to apply all staged fields (receives stagedFields array)
 * @param {String} pdfUrl - URL of the PDF to display
 * @param {Array} stagedFields - Array of staged field objects
 * @param {Function} onAddStagedField - Callback to add new staged field
 * @param {Function} onUpdateStagedField - Callback to update staged field (tempId, updates)
 * @param {Function} onDeleteStagedField - Callback to delete staged field (tempId)
 * @param {Array} existingFieldKeys - Existing field keys for duplicate validation
 * @param {Array} tagDataTypes - Available data types
 * @param {Array} existingPlaceholders - Existing placeholders for duplicate position check
 */
const BatchFieldCreationModal = ({
  visible,
  onClose,
  onApplyAll,
  pdfUrl,
  stagedFields = [],
  onAddStagedField,
  onUpdateStagedField,
  onDeleteStagedField,
  existingFieldKeys = [],
  tagDataTypes = [],
  existingPlaceholders = []
}) => {
  // Handle cancel with confirmation if there are staged fields
  const handleCancel = useCallback(() => {
    if (stagedFields.length > 0) {
      Modal.confirm({
        title: 'Bạn có chắc muốn hủy?',
        content: `Bạn đang có ${stagedFields.length} trường chưa được áp dụng. Tất cả thay đổi sẽ bị mất.`,
        okText: 'Hủy bỏ',
        cancelText: 'Quay lại',
        okButtonProps: { danger: true },
        onOk: () => {
          onClose();
        }
      });
    } else {
      onClose();
    }
  }, [stagedFields.length, onClose]);

  // Handle apply all with confirmation
  const handleApplyAll = useCallback(() => {
    if (stagedFields.length === 0) {
      return;
    }

    // Check for empty fields
    const emptyFields = stagedFields.filter(f => !f.key || !f.dataType);
    if (emptyFields.length > 0) {
      Modal.warning({
        title: 'Thiếu thông tin',
        content: `Có ${emptyFields.length} trường chưa điền đầy đủ thông tin (tên trường hoặc loại dữ liệu). Vui lòng hoàn thiện trước khi áp dụng.`,
      });
      return;
    }

    Modal.confirm({
      title: 'Xác nhận áp dụng',
      content: `Bạn có chắc muốn thêm ${stagedFields.length} trường vào PDF?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        onApplyAll(stagedFields);
      }
    });
  }, [stagedFields, onApplyAll]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PlusOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              Tạo thẻ tài liệu
            </Title>
          </div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Quét nhiều vùng trước, sau đó áp dụng tất cả cùng lúc
          </Text>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width="95vw"
      style={{ top: 20, padding: 0 }}
      styles={{
        body: {
          height: '90vh',
          padding: 0,
          overflow: 'hidden'
        }
      }}
      centered
      destroyOnClose
      maskClosable={false}
      closeIcon={<CloseOutlined style={{ fontSize: 18 }} />}
    >
      <div style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Left Panel: PDF Viewer with Selection */}
        <div style={{
          flex: 1,
          borderRight: '1px solid #f0f0f0',
          overflow: 'hidden',
          background: '#fafafa'
        }}>
          <PDFViewerWithSelection
            pdfUrl={pdfUrl}
            isPlacementMode={true}
            isBatchMode={true}
            onScanComplete={onAddStagedField}
            stagedFields={stagedFields}
            placeholders={[...existingPlaceholders, ...stagedFields]}
            tagDataTypes={tagDataTypes}
          />
        </div>

        {/* Right Panel: Staging Table */}
        <div style={{
          width: '45%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          overflow: 'hidden'
        }}>
          {/* Table Container */}
          <div style={{
            flex: 1,
            padding: 16,
            overflow: 'auto'
          }}>
            <StagingFieldsTable
              stagedFields={stagedFields}
              onUpdate={onUpdateStagedField}
              onDelete={onDeleteStagedField}
              tagDataTypes={tagDataTypes}
              existingFieldKeys={existingFieldKeys}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: 16,
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa'
          }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {stagedFields.length > 0 ? (
                  <>
                    <Text strong style={{ color: '#1890ff' }}>{stagedFields.length}</Text> trường đã thêm
                  </>
                ) : (
                  'Chưa có trường nào'
                )}
              </Text>

              <Space>
                <Button size="large" onClick={handleCancel}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleApplyAll}
                  disabled={stagedFields.length === 0}
                  icon={<PlusOutlined />}
                >
                  Thêm ({stagedFields.length})
                </Button>
              </Space>
            </Space>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BatchFieldCreationModal;
