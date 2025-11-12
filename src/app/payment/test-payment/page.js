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

  // Lưu ý: Không cần mockUserId nữa vì axiosInstance tự động thêm Authorization header

  // Hàm format tiền VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Hàm tạo order code ngẫu nhiên (8 chữ số)
  const generateOrderCode = () => {
    return Math.floor(10000000 + Math.random() * 90000000);
  };

  // Hàm xử lý submit form
  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setPaymentResult(null);

    try {
      const { amount } = values;

      // Lưu ý: description không được chứa ký tự đặc biệt, dấu, dưới 30 ký tự (giống như nội dung chuyển khoản ngân hàng)
      const payload = {
        amount: Number(amount),
        description: `thanh toan test`,
        return_url: `https://agrisa-insurance-portal.phrimp.io.vn/payment/success`,
        cancel_url: `https://agrisa-insurance-portal.phrimp.io.vn/payment/fail`,
        type: "hop_hong",
        items: [
          {
            name: "Goi test thanh toan PayOS",
            price: Number(amount),
            quantity: 1,
          },
        ],
      };

      // Gọi API tạo payment link (axiosInstance tự động thêm Authorization header)
      const response = await axiosInstance.post(
        "/payment/protected/link",
        payload
      );

      console.log("📥 Phản hồi API thanh toán:", response.data);

      // Định dạng response: { success: true, data: { checkout_url: "..." } }
      if (response.data && response.data.success) {
        const responseData = response.data.data;

        setPaymentResult({
          success: true,
          data: responseData,
        });

        // Tự động mở link thanh toán trong tab mới
        const checkoutUrl =
          responseData?.checkout_url || responseData?.checkoutUrl;
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
        }
      } else {
        throw new Error(
          response.data?.message || "Không thể tạo liên kết thanh toán"
        );
      }
    } catch (err) {
      console.error("Lỗi thanh toán:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi tạo liên kết thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  // Hàm kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async (orderId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/payment/protected/link/${orderId}`
      );

      console.log("📥 Phản hồi kiểm tra trạng thái:", response.data);

      if (response.data && response.data.success) {
        setPaymentResult({
          success: true,
          data: response.data.data,
          statusChecked: true,
        });
      } else {
        throw new Error(
          response.data?.message || "Không thể kiểm tra trạng thái thanh toán"
        );
      }
    } catch (err) {
      console.error("Lỗi kiểm tra trạng thái:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể kiểm tra trạng thái thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  // Hàm hủy thanh toán
  const cancelPayment = async (orderId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.delete(
        `/payment/protected/link/${orderId}`,
        {
          data: {
            cancellation_reason: "Test hủy thanh toán",
          },
        }
      );

      console.log("📥 Phản hồi hủy thanh toán:", response.data);

      if (response.data && response.data.success) {
        setPaymentResult({
          success: true,
          cancelled: true,
          data: response.data.data,
        });
      } else {
        throw new Error(response.data?.message || "Không thể hủy thanh toán");
      }
    } catch (err) {
      console.error("Lỗi hủy thanh toán:", err);
      setError(
        err.response?.data?.message || err.message || "Không thể hủy thanh toán"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>
        <CreditCard size={32} style={{ marginRight: "12px" }} />
        Test Thanh Toán PayOS
      </Title>
      <Paragraph type="secondary">
        Trang test chức năng thanh toán qua PayOS
      </Paragraph>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          {/* Form nhập số tiền */}
          <Card
            title={
              <Space>
                <DollarSign size={20} />
                <span>Tạo Thanh Toán Mới</span>
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
                label="Số tiền thanh toán (VND)"
                name="amount"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số tiền!",
                  },
                  {
                    type: "number",
                    min: 1000,
                    message: "Số tiền phải lớn hơn 1,000 VND!",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Nhập số tiền"
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
                  {loading ? "Đang xử lý..." : "Tạo Link Thanh Toán"}
                </Button>
              </Form.Item>
            </Form>

            <Divider />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {/* Kết quả thanh toán */}
          <Card
            title={
              <Space>
                {paymentResult?.success ? (
                  <CheckCircle size={20} color="#52c41a" />
                ) : (
                  <XCircle size={20} color="#ff4d4f" />
                )}
                <span>Kết Quả</span>
              </Space>
            }
            bordered={false}
          >
            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <Paragraph style={{ marginTop: "16px" }}>
                  Đang xử lý...
                </Paragraph>
              </div>
            )}

            {error && !loading && (
              <Alert
                message="Lỗi"
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
                    message="Thanh toán đã được hủy"
                    type="warning"
                    showIcon
                  />
                ) : (
                  <Alert
                    message="Tạo link thanh toán thành công!"
                    type="success"
                    showIcon
                  />
                )}

                <div>
                  <Title level={5}>Thông tin thanh toán:</Title>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {paymentResult.data?.orderCode && (
                      <div>
                        <Text strong>Mã đơn hàng: </Text>
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
                        <Text strong>Trạng thái: </Text>
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
                        <Text strong>Link thanh toán: </Text>
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
                          Mở link thanh toán
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
                      Kiểm tra trạng thái
                    </Button>
                    <Button
                      danger
                      onClick={() =>
                        cancelPayment(paymentResult.data.orderCode)
                      }
                      icon={<XCircle size={16} />}
                    >
                      Hủy thanh toán
                    </Button>
                  </Space>
                )}

                <Divider />

                <div>
                  <Text strong>Phản hồi từ API:</Text>
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
                  Nhập số tiền và nhấn "Tạo Link Thanh Toán" để bắt đầu
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />
    </div>
  );
}
