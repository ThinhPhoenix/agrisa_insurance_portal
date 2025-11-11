"use client";
import axiosInstance from "@/libs/axios-instance";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const { Title, Text, Paragraph } = Typography;

export default function TestPaymentPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);

  // Note: We don't need mockUserId anymore because axiosInstance automatically adds Authorization header
  // Lưu ý: Không cần mockUserId nữa vì axiosInstance tự động thêm Authorization header

  // Function to format VND currency
  // Hàm format tiền VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Function to generate random order code (8 digits)
  // Hàm tạo order code ngẫu nhiên (8 chữ số)
  const generateOrderCode = () => {
    return Math.floor(10000000 + Math.random() * 90000000);
  };

  // Function to handle form submission
  // Hàm xử lý submit form (VN) / Handle form submit (EN)
  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setPaymentResult(null);

    try {
      const { amount } = values;

      // Chuẩn bị payload theo document (VN) / Prepare payload according to document (EN)
      // Note: description must be without special characters, accents (like bank transfer description)
      const payload = {
        amount: Number(amount),
        description: `Thanh toan test`, // No accents, no special chars
        return_url: `https://agrisa-insurance-portal.phrimp.io.vn/payment/success`,
        cancel_url: `https://agrisa-insurance-portal.phrimp.io.vn/payment/fail`,
        type: "hop_hong",
        items: [
          {
            name: "Goi test thanh toan PayOS", // No accents
            price: Number(amount),
            quantity: 1,
          },
        ],
      };

      // Call API to create payment link (axiosInstance auto-adds Authorization header)
      // Gọi API tạo payment link (axiosInstance tự động thêm Authorization header)
      const response = await axiosInstance.post(
        "/payment/protected/link",
        payload
      );

      console.log("📥 Payment API Response:", response.data);

      // Response format: { success: true, data: { checkout_url: "..." } }
      if (response.data && response.data.success) {
        const responseData = response.data.data;

        setPaymentResult({
          success: true,
          data: responseData,
        });

        // Auto-open checkout link in new tab
        // Tự động mở link thanh toán trong tab mới
        const checkoutUrl =
          responseData?.checkout_url || responseData?.checkoutUrl;
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
        }
      } else {
        throw new Error(
          response.data?.message || "Failed to create payment link"
        );
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi tạo liên kết thanh toán" // VN: fallback message / EN: fallback message
      );
    } finally {
      setLoading(false);
    }
  };

  // Check payment status function
  // Hàm kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async (orderId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/payment/protected/link/${orderId}`
      );

      console.log("📥 Check Status Response:", response.data);

      if (response.data && response.data.success) {
        setPaymentResult({
          success: true,
          data: response.data.data,
          statusChecked: true,
        });
      } else {
        throw new Error(
          response.data?.message || "Failed to check payment status"
        );
      }
    } catch (err) {
      console.error("Check status error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Cannot check payment status / Không thể kiểm tra trạng thái thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  // Cancel payment function
  // Hàm hủy thanh toán
  const cancelPayment = async (orderId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.delete(
        `/payment/protected/link/${orderId}`,
        {
          data: {
            cancellation_reason:
              "Test payment cancellation / Test hủy thanh toán",
          },
        }
      );

      console.log("📥 Cancel Payment Response:", response.data);

      if (response.data && response.data.success) {
        setPaymentResult({
          success: true,
          cancelled: true,
          data: response.data.data,
        });
      } else {
        throw new Error(response.data?.message || "Failed to cancel payment");
      }
    } catch (err) {
      console.error("Cancel payment error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Cannot cancel payment / Không thể hủy thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>
        <CreditCard size={32} style={{ marginRight: "12px" }} />
        Test Thanh Toán PayOS / PayOS Payment Test
      </Title>
      <Paragraph type="secondary">
        Trang test chức năng thanh toán qua PayOS theo tài liệu backend / Test
        page for PayOS payment functionality following backend docs
      </Paragraph>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          {/* Form nhập số tiền (VN) / Amount input form (EN) */}
          <Card
            title={
              <Space>
                <DollarSign size={20} />
                <span>Tạo Thanh Toán Mới / Create New Payment</span>
              </Space>
            }
            bordered={false}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                amount: 50000,
              }}
            >
              <Form.Item
                label="Số tiền thanh toán (VND) / Amount to pay (VND)"
                name="amount"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số tiền! / Please enter an amount!",
                  },
                  {
                    type: "number",
                    min: 1000,
                    message:
                      "Số tiền phải lớn hơn 1,000 VND / Amount must be at least 1,000 VND",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Nhập số tiền / Enter amount"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VND"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<CreditCard size={20} />}
                >
                  {loading
                    ? "Đang xử lý... / Processing..."
                    : "Tạo Link Thanh Toán / Create Payment Link"}
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Alert
              message="Thông tin API / API Info"
              description={
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text>
                    <strong>Endpoint:</strong> /payment/protected/link
                  </Text>
                  <Text>
                    <strong>Auth:</strong> Token from localStorage (auto-added
                    by axiosInstance)
                  </Text>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Following payos-backend-integration.md / Theo tài liệu
                    payos-backend-integration.md
                  </Text>
                </Space>
              }
              type="info"
              showIcon
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {/* Kết quả thanh toán / Payment result */}
          <Card
            title={
              <Space>
                {paymentResult?.success ? (
                  <CheckCircle size={20} color="#52c41a" />
                ) : (
                  <XCircle size={20} color="#ff4d4f" />
                )}
                <span>Kết Quả / Result</span>
              </Space>
            }
            bordered={false}
          >
            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <Paragraph style={{ marginTop: "16px" }}>
                  Đang xử lý... / Processing...
                </Paragraph>
              </div>
            )}

            {error && !loading && (
              <Alert
                message="Lỗi / Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
              />
            )}

            {paymentResult && !loading && (
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                {paymentResult.cancelled ? (
                  <Alert
                    message="Thanh toán đã được hủy / Payment cancelled"
                    type="warning"
                    showIcon
                  />
                ) : (
                  <Alert
                    message="Tạo link thanh toán thành công! / Payment link created successfully!"
                    type="success"
                    showIcon
                  />
                )}

                <div>
                  <Title level={5}>Thông tin thanh toán / Payment info:</Title>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {paymentResult.data?.orderCode && (
                      <div>
                        <Text strong>Order Code: </Text>
                        <Tag color="blue">{paymentResult.data.orderCode}</Tag>
                      </div>
                    )}

                    {paymentResult.data?.amount && (
                      <div>
                        <Text strong>Số tiền: </Text>
                        <Text type="success">
                          {formatVND(paymentResult.data.amount)}
                        </Text>
                      </div>
                    )}

                    {paymentResult.data?.status && (
                      <div>
                        <Text strong>Trạng thái / Status: </Text>
                        <Tag
                          color={
                            paymentResult.data.status === "PAID"
                              ? "success"
                              : paymentResult.data.status === "CANCELLED"
                              ? "error"
                              : "processing"
                          }
                        >
                          {paymentResult.data.status}
                        </Tag>
                      </div>
                    )}

                    {(paymentResult.data?.checkout_url ||
                      paymentResult.data?.checkoutUrl) && (
                      <div>
                        <Text strong>Link thanh toán / Checkout link: </Text>
                        <br />
                        <Button
                          type="link"
                          icon={<ExternalLink size={16} />}
                          href={
                            paymentResult.data.checkout_url ||
                            paymentResult.data.checkoutUrl
                          }
                          target="_blank"
                          style={{ padding: 0 }}
                        >
                          Mở link thanh toán / Open checkout link
                        </Button>
                      </div>
                    )}
                  </Space>
                </div>

                {paymentResult.data?.orderCode && !paymentResult.cancelled && (
                  <Space>
                    <Button
                      onClick={() =>
                        checkPaymentStatus(paymentResult.data.orderCode)
                      }
                      icon={<Loader size={16} />}
                    >
                      Kiểm tra trạng thái / Check status
                    </Button>
                    <Button
                      danger
                      onClick={() =>
                        cancelPayment(paymentResult.data.orderCode)
                      }
                      icon={<XCircle size={16} />}
                    >
                      Hủy thanh toán / Cancel payment
                    </Button>
                  </Space>
                )}

                <Divider />

                <div>
                  <Text strong>Response từ API / API response:</Text>
                  <pre
                    style={{
                      background: "#f5f5f5",
                      padding: "12px",
                      borderRadius: "4px",
                      overflow: "auto",
                      maxHeight: "300px",
                      fontSize: "12px",
                    }}
                  >
                    {JSON.stringify(paymentResult.data, null, 2)}
                  </pre>
                </div>
              </Space>
            )}

            {!paymentResult && !loading && !error && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Text type="secondary">
                  Nhập số tiền và nhấn "Tạo Link Thanh Toán" để bắt đầu / Enter
                  an amount and click "Create Payment Link" to start
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* API Endpoints Information */}
      <Card
        title="API Endpoints (According to payos-backend-integration.md)"
        bordered={false}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Tag color="green">POST</Tag>
            <Text code>/payment/protected/link</Text>
            <Text type="secondary">
              {" "}
              - Create payment link / Tạo link thanh toán
            </Text>
          </div>
          <div>
            <Tag color="blue">GET</Tag>
            <Text code>/payment/protected/link/:order_id</Text>
            <Text type="secondary">
              {" "}
              - Get payment info / Lấy thông tin thanh toán
            </Text>
          </div>
          <div>
            <Tag color="red">DELETE</Tag>
            <Text code>/payment/protected/link/:order_id</Text>
            <Text type="secondary">
              {" "}
              - Cancel payment link / Hủy link thanh toán
            </Text>
          </div>
          <div>
            <Tag color="orange">POST</Tag>
            <Text code>/payment/webhook</Text>
            <Text type="secondary">
              {" "}
              - Webhook verify payment / Webhook xác nhận thanh toán
            </Text>
          </div>
          <div>
            <Tag color="purple">GET</Tag>
            <Text code>/payment/protected/orders</Text>
            <Text type="secondary">
              {" "}
              - Get orders list / Lấy danh sách đơn hàng
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
