import { useCreateDeletionRequest } from "@/services/hooks/profile/use-partner-deletion";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Alert, Form, Input, message, Modal, Space, Typography } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

export default function DeletionRequestModal({ visible, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const { createDeletionRequest, isLoading } = useCreateDeletionRequest();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const payload = {
      detailed_explanation: values.detailed_explanation || "",
    };

    const result = await createDeletionRequest(payload);

    if (result.success) {
      message.success(
        result.message || "Yêu cầu hủy hồ sơ đã được gửi thành công"
      );
      form.resetFields();
      onSuccess && onSuccess(result.data);
      onClose();
    } else {
      message.error(result.message);
    }
    setSubmitting(false);
  };

  return (
    <Modal
      title={
        <Space>
          <DeleteOutlined style={{ color: "#ff4d4f" }} />
          <span>Yêu cầu hủy hồ sơ công ty</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      okText="Gửi yêu cầu"
      cancelText="Hủy"
      okButtonProps={{
        danger: true,
        loading: submitting || isLoading,
        icon: <DeleteOutlined />,
      }}
      onOk={() => form.submit()}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Alert
          message="Cảnh báo quan trọng"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph style={{ marginBottom: 8 }}>
                Việc hủy hồ sơ công ty là một quyết định quan trọng và sẽ có các
                hậu quả sau:
              </Paragraph>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  Công ty sẽ ngưng cung cấp dịch vụ trong vòng 30 ngày sau khi
                  được duyệt
                </li>
                <li>
                  Tất cả các hợp đồng bảo hiểm đang hoạt động sẽ chuyển sang
                  trạng thái chờ hủy
                </li>
                <li>
                  Công ty có nghĩa vụ thanh toán tất cả khoản hoàn trả trước khi
                  hủy
                </li>
                <li>Các hợp đồng cơ bản sẽ được lưu trữ sau khi hủy</li>
              </ul>
            </Space>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />

        <Alert
          message="Thời gian hủy yêu cầu"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                Bạn có <strong>7 ngày</strong> kể từ khi gửi yêu cầu để có thể
                hủy lại yêu cầu này. Sau thời gian đó, chỉ quản trị viên mới có
                thể xử lý yêu cầu.
              </Text>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="detailed_explanation"
            label="Lý do hủy hồ sơ (không bắt buộc)"
            extra="Tối đa 1000 ký tự"
            rules={[
              {
                max: 1000,
                message: "Lý do phải có độ dài từ 1 đến 1000 ký tự",
              },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Vui lòng mô tả lý do bạn muốn hủy hồ sơ công ty (ví dụ: ngừng hoạt động kinh doanh, sáp nhập công ty, v.v.)"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>

        <Alert
          message="Lưu ý"
          description="Sau khi gửi yêu cầu, quản trị viên sẽ xem xét và đảm bảo rằng tất cả các nghĩa vụ tài chính đã được hoàn thành trước khi phê duyệt."
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
}
