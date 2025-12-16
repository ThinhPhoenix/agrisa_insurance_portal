import React, { useState, memo, useCallback } from 'react';
import { Form, Input, Select, Button, Space, Popconfirm, Tag, Typography, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomTable from '@/components/custom-table';

const { Text } = Typography;

/**
 * StagingFieldsTable Component
 *
 * Displays a table of staged fields with inline editing capabilities.
 * User can edit field key and dataType before applying to PDF.
 *
 * @param {Array} stagedFields - Array of staged field objects
 * @param {Function} onUpdate - Callback when field is updated (tempId, updates)
 * @param {Function} onDelete - Callback when field is deleted (tempId)
 * @param {Array} tagDataTypes - Available data types for dropdown
 * @param {Array} existingFieldKeys - Existing field keys for duplicate validation
 */
const StagingFieldsTable = memo(({
  stagedFields = [],
  onUpdate,
  onDelete,
  tagDataTypes = [],
  existingFieldKeys = []
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm] = Form.useForm();

  // Handle edit button click
  const handleEdit = useCallback((record) => {
    setEditingId(record.tempId);
    editForm.setFieldsValue({
      key: record.key,
      dataType: record.dataType
    });
  }, [editForm]);

  // Handle save (confirm) button click
  const handleSave = useCallback(async (tempId) => {
    try {
      const values = await editForm.validateFields();

      // Validate duplicate key (check against existing keys)
      if (existingFieldKeys.includes(values.key)) {
        message.error(`Tên trường "${values.key}" đã tồn tại. Vui lòng chọn tên khác.`);
        return;
      }

      // Validate duplicate within staged fields (excluding current field)
      const duplicateInStaged = stagedFields.find(
        (field) => field.tempId !== tempId && field.key === values.key
      );

      if (duplicateInStaged) {
        message.error(`Tên trường "${values.key}" đã tồn tại trong danh sách. Vui lòng chọn tên khác.`);
        return;
      }

      // Call parent update handler
      onUpdate(tempId, values);
      setEditingId(null);
      message.success('Đã cập nhật trường thành công');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [editForm, existingFieldKeys, stagedFields, onUpdate]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    editForm.resetFields();
  }, [editForm]);

  // Table columns configuration
  const columns = [
    {
      title: 'STT',
      dataIndex: 'position',
      key: 'position',
      width: 70,
      align: 'center',
      render: (pos) => <Tag color="blue">({pos})</Tag>
    },
    {
      title: 'Tên trường',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text, record) => {
        if (editingId === record.tempId) {
          return (
            <Form.Item
              name="key"
              style={{ margin: 0 }}
              rules={[
                { required: true, message: 'Vui lòng nhập tên trường' },
                {
                  pattern: /^[^A-Z!@#$%^&*()+=\[\]{};':"\\|,.<>?\/]*$/,
                  message: 'Không được chứa chữ hoa hoặc ký tự đặc biệt'
                }
              ]}
            >
              <Input
                autoFocus
                placeholder="Nhập tên trường..."
                onPressEnter={() => handleSave(record.tempId)}
              />
            </Form.Item>
          );
        }
        return text ? (
          <Text>{text}</Text>
        ) : (
          <Text type="secondary" italic>Chưa nhập</Text>
        );
      }
    },
    {
      title: 'Loại dữ liệu',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 150,
      render: (text, record) => {
        if (editingId === record.tempId) {
          return (
            <Form.Item name="dataType" style={{ margin: 0 }}>
              <Select placeholder="Chọn loại dữ liệu">
                {tagDataTypes.map(type => (
                  <Select.Option key={type.value} value={type.value}>
                    {type.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          );
        }
        const typeLabel = tagDataTypes.find(t => t.value === text)?.label || text;
        return <Text>{typeLabel}</Text>;
      }
    },
    {
      title: 'Trang',
      dataIndex: 'page',
      key: 'page',
      width: 80,
      align: 'center',
      render: (page) => <Text>{page}</Text>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => {
        if (editingId === record.tempId) {
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                onClick={() => handleSave(record.tempId)}
              >
                Xác nhận
              </Button>
              <Button
                type="link"
                size="small"
                onClick={handleCancelEdit}
              >
                Hủy
              </Button>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xóa trường này?"
              description="Thao tác này không thể hoàn tác."
              onConfirm={() => onDelete(record.tempId)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>Danh sách trường đã thêm ({stagedFields.length})</Text>
      </div>

      <Form form={editForm}>
        <CustomTable
          columns={columns}
          dataSource={stagedFields}
          rowKey="tempId"
          pagination={false}
          scroll={{ y: 500 }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0', color: '#999' }}>
                <Text type="secondary">Chưa có trường nào được thêm.</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Quét vùng trên PDF để thêm trường mới.
                </Text>
              </div>
            )
          }}
        />
      </Form>
    </div>
  );
});

StagingFieldsTable.displayName = 'StagingFieldsTable';

export default StagingFieldsTable;
