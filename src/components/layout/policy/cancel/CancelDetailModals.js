"use client";

import { CustomForm } from "@/components/custom-form";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Typography,
} from "antd";

const { TextArea } = Input;
const { Text } = Typography;

export default function CancelDetailModals({
  // approve
  approveModalVisible,
  setApproveModalVisible,
  approveForm,
  onApproveSubmit,
  // deny
  denyModalVisible,
  setDenyModalVisible,
  denyForm,
  onDenySubmit,
  // resolve
  resolveModalVisible,
  setResolveModalVisible,
  resolveForm,
  onResolveSubmit,
  resolveAction,
  // partner resolve
  resolveDisputePartnerModalVisible,
  setResolveDisputePartnerModalVisible,
  resolveDisputePartnerFormRef,
  onResolveDisputePartnerSubmit,
  // common
  submitting,
}) {
  return (
    <>
      {/* Approve Modal */}
      <Modal
        title="Chấp thuận yêu cầu hủy"
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={approveForm} layout="vertical" onFinish={onApproveSubmit}>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <Space>
              <WarningOutlined style={{ color: "#faad14" }} />
              <Text>
                Sau khi chấp thuận, hợp đồng sẽ chuyển sang trạng thái "Đã hủy"
              </Text>
            </Space>
          </div>

          <Form.Item
            label="Số tiền bồi thường (nếu có)"
            name="compensate_amount"
            rules={[{ required: false }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            label="Ghi chú xem xét"
            name="review_notes"
            rules={[{ required: false }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập ghi chú về việc chấp thuận và thông tin bồi thường..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setApproveModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<CheckCircleOutlined />}
              >
                Xác nhận chấp thuận
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Deny Modal */}
      <Modal
        title="Từ chối yêu cầu hủy"
        open={denyModalVisible}
        onCancel={() => setDenyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={denyForm} layout="vertical" onFinish={onDenySubmit}>
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Space direction="vertical">
              <Space>
                <WarningOutlined style={{ color: "#ff4d4f" }} />
                <Text strong>
                  Sau khi từ chối, hợp đồng sẽ chuyển sang trạng thái "Tranh
                  chấp"
                </Text>
              </Space>
              <Text type="secondary" className="text-sm">
                Hai bên cần tự liên lạc offline để giải quyết. Vui lòng cung cấp
                thông tin liên lạc trong ghi chú.
              </Text>
            </Space>
          </div>

          <Form.Item
            label="Lý do từ chối và thông tin liên lạc"
            name="review_notes"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập lý do từ chối và thông tin liên lạc để giải quyết",
              },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Ví dụ: Yêu cầu hủy không hợp lệ vì hợp đồng đã vào hiệu lực hơn 1 tuần. Vui lòng liên hệ qua điện thoại: 0123-456-789 hoặc email: support@company.com để thảo luận thêm."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setDenyModalVisible(false)}>Hủy</Button>
              <Button
                danger
                htmlType="submit"
                loading={submitting}
                icon={<CloseCircleOutlined />}
              >
                Xác nhận từ chối
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Resolve Dispute Modal */}
      <Modal
        title={
          resolveAction === "approve"
            ? "Giải quyết tranh chấp - Hủy hợp đồng"
            : "Giải quyết tranh chấp - Giữ hợp đồng"
        }
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={resolveForm} layout="vertical" onFinish={onResolveSubmit}>
          <div
            className={`mb-4 p-3 border rounded ${
              resolveAction === "approve"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <Space direction="vertical">
              <Space>
                <ExclamationCircleOutlined
                  style={{
                    color: resolveAction === "approve" ? "#faad14" : "#1890ff",
                  }}
                />
                <Text strong>
                  {resolveAction === "approve"
                    ? "Sau khi xác nhận, hợp đồng sẽ chuyển sang trạng thái 'Đã hủy'"
                    : "Sau khi xác nhận, hợp đồng sẽ chuyển về trạng thái 'Đang hoạt động'"}
                </Text>
              </Space>
              <Text type="secondary" className="text-sm">
                Vui lòng ghi rõ thông tin thỏa thuận giữa hai bên sau khi liên
                lạc offline
              </Text>
            </Space>
          </div>

          <Form.Item
            label="Thông tin giải quyết"
            name="resolution_notes"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập thông tin giải quyết tranh chấp",
              },
            ]}
            extra="Ghi rõ nội dung thỏa thuận, ngày liên lạc, và kết quả thảo luận giữa hai bên"
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setResolveModalVisible(false)}>Hủy</Button>
              <Button
                type={resolveAction === "approve" ? "primary" : "default"}
                danger={resolveAction === "approve"}
                htmlType="submit"
                loading={submitting}
                icon={
                  resolveAction === "approve" ? (
                    <CloseCircleOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  )
                }
              >
                Xác nhận giải quyết
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Resolve Dispute Partner Modal */}
      <Modal
        title="Xử lý Tranh chấp"
        open={resolveDisputePartnerModalVisible}
        onCancel={() => {
          setResolveDisputePartnerModalVisible(false);
          resolveDisputePartnerFormRef.current?.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div className="mb-2">
          <Space direction="vertical" className="w-full">
            <Space>
              <ExclamationCircleOutlined />
              <Text strong>
                Vui lòng xác định quyết định cuối cùng cho tranh chấp này
              </Text>
            </Space>
            <Text type="secondary" className="text-sm">
              Ghi chú xem xét sẽ được gửi đến đối tác để thông báo quyết định.
            </Text>
          </Space>
        </div>

        <CustomForm
          ref={resolveDisputePartnerFormRef}
          fields={[
            {
              name: "review_notes",
              label: "Ghi chú xem xét",
              type: "textarea",
              required: true,
              rules: [
                {
                  required: true,
                  message: "Vui lòng nhập ghi chú xem xét",
                },
              ],
            },
            {
              name: "final_decision",
              label: "Quyết định cuối cùng",
              type: "select",
              required: true,
              rules: [
                {
                  required: true,
                  message: "Vui lòng chọn quyết định",
                },
              ],
              options: [
                { label: "Chấp thuận - Hủy hợp đồng", value: "approved" },
                { label: "Từ chối - Giữ hợp đồng", value: "denied" },
              ],
            },
          ]}
          onSubmit={onResolveDisputePartnerSubmit}
          gridColumns="1fr"
          gap="16px"
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={() => {
              setResolveDisputePartnerModalVisible(false);
              resolveDisputePartnerFormRef.current?.resetFields();
            }}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => resolveDisputePartnerFormRef.current?.submit()}
            icon={<CheckCircleOutlined />}
          >
            Xác nhận quyết định
          </Button>
        </div>
      </Modal>
    </>
  );
}
