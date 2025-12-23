"use client";

import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Spin,
  Typography,
} from "antd";

const { Text } = Typography;

export default function PayoutQRModal({
  visible,
  onCancel,
  onVerify,
  loading,
  qrData,
  selectedPayout,
  claimNumber,
  formatCurrency,
  paymentType = "policy_payout_payment", // Default to payout payment
}) {
  // Determine modal title and description based on payment type
  const isCompensation = paymentType === "policy_compensation_payment";
  const modalTitle = isCompensation ? "Thanh toán Hoàn tiền" : "Thanh toán Chi trả";
  const descriptionPrefix = isCompensation ? "Hoàn tiền bảo hiểm" : "Chi trả bảo hiểm";

  return (
    <Modal
      title={
        <Space>
          <WalletOutlined style={{ color: "#52c41a" }} />
          <span>{modalTitle}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={500}
      footer={null}
      centered
    >
      {loading && !qrData ? (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" tip="Đang tạo mã QR..." />
        </div>
      ) : qrData ? (
        <div className="space-y-4">
          {/* Payout Info */}
          <Card size="small" className="bg-blue-50">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Số tiền chi trả">
                <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                  {formatCurrency(selectedPayout?.payout_amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã chi trả">
                <Text style={{ fontSize: "12px", fontFamily: "monospace" }}>
                  {selectedPayout?.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                <Text type="secondary">{descriptionPrefix} {claimNumber}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
              <img
                src={qrData.qr}
                alt="QR Code"
                style={{ width: "280px", height: "280px" }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <Text style={{ fontSize: "13px", display: "block" }}>
              <InfoCircleOutlined
                style={{ color: "#faad14", marginRight: "8px" }}
              />
              <strong>Hướng dẫn:</strong>
            </Text>
            <ul className="ml-6 mt-2 space-y-1" style={{ fontSize: "12px" }}>
              <li>Mở ứng dụng ngân hàng trên điện thoại</li>
              <li>Quét mã QR trên để chuyển khoản</li>
              <li>Xác nhận giao dịch trong ứng dụng ngân hàng</li>
              <li>
                Sau khi chuyển khoản thành công, nhấn "Xác nhận thanh toán"
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button size="large" onClick={onCancel} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={onVerify}
              loading={loading}
            >
              Xác nhận thanh toán
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Text type="danger">Không thể tạo mã QR thanh toán</Text>
        </div>
      )}
    </Modal>
  );
}
