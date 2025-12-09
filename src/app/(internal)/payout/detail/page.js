"use client";

import PayoutQRModal from "@/components/payout-qr-modal";
import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import usePayout from "@/services/hooks/payout/use-payout";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Layout,
  message,
  Rate,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "../../policy/policy.css";

const { Title, Text } = Typography;

export default function PayoutDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payoutId = searchParams.get("id");

  const {
    payoutDetail,
    payoutDetailLoading,
    payoutDetailError,
    fetchPayoutDetail,
  } = usePayout();

  // States for related data
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [claim, setClaim] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Payment modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!payoutId) return;

      try {
        // 1. Fetch payout detail first
        await fetchPayoutDetail(payoutId);
      } catch (error) {
        console.error("Error fetching payout detail:", error);
      }
    };

    fetchAllData();
  }, [payoutId, fetchPayoutDetail]);

  // Fetch related data when payoutDetail is loaded
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!payoutDetail) return;

      setAllDataLoaded(false);

      try {
        // Fetch all related data in parallel
        const promises = [];

        // Fetch policy detail
        if (payoutDetail.registered_policy_id) {
          promises.push(
            axiosInstance
              .get(
                endpoints.policy.policy.detail(
                  payoutDetail.registered_policy_id
                )
              )
              .then((response) => {
                if (response.data.success) {
                  setPolicy(response.data.data);
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching policy:", error);
                return null;
              })
          );
        }

        // Fetch farm detail
        if (payoutDetail.farm_id) {
          promises.push(
            axiosInstance
              .get(endpoints.applications.detail(payoutDetail.farm_id))
              .then((response) => {
                if (response.data.success) {
                  setFarm(response.data.data);
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching farm:", error);
                return null;
              })
          );
        }

        // Fetch claim detail
        if (payoutDetail.claim_id) {
          promises.push(
            axiosInstance
              .get(endpoints.claim.detail(payoutDetail.claim_id))
              .then((response) => {
                if (response.data.success) {
                  setClaim(response.data.data);
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching claim:", error);
                return null;
              })
          );
        }

        await Promise.all(promises);
      } finally {
        setAllDataLoaded(true);
      }
    };

    fetchRelatedData();
  }, [payoutDetail]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "default";
      case "processing":
        return "orange";
      case "completed":
        return "green";
      case "failed":
        return "red";
      default:
        return "default";
    }
  };

  // Get status text (tiếng Việt)
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "completed":
        return "Hoàn tất";
      case "failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockCircleOutlined />;
      case "processing":
        return <ClockCircleOutlined />;
      case "completed":
        return <CheckCircleOutlined />;
      case "failed":
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };

  // Format date from epoch timestamp or ISO string
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let date;
    if (typeof timestamp === "string") {
      // ISO string format
      date = new Date(timestamp);
    } else {
      // Unix timestamp
      date =
        timestamp < 5000000000
          ? new Date(timestamp * 1000)
          : new Date(timestamp);
    }
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Handle payment initiation
  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentModalVisible(true);

    try {
      const userId = payoutDetail.farmer_id || "test_id";

      // Fetch bank info for the user
      const bankInfoResponse = await axiosInstance.post(
        endpoints.profile.bank_info,
        {
          user_ids: [userId],
        }
      );

      let bankCode = "970423"; // Default bank code
      let accountNumber = "09073016692"; // Default account number

      // Extract bank info from response
      if (
        bankInfoResponse.data?.success &&
        bankInfoResponse.data?.data?.length > 0
      ) {
        const userBankInfo = bankInfoResponse.data.data[0];
        bankCode = userBankInfo.bank_code || bankCode;
        accountNumber = userBankInfo.account_number || accountNumber;
      }

      // Build payment request with new structure
      const paymentRequest = {
        amount: payoutDetail.payout_amount,
        bank_code: bankCode,
        account_number: accountNumber,
        user_id: userId,
        description: "Chi trả bảo hiểm",
        type: "policy_payout_payment",
        items: [
          {
            item_id: payoutDetail.registered_policy_id,
            name: `Chi tra ${policy?.policy_number || payoutDetail.id}`,
            price: payoutDetail.payout_amount,
          },
        ],
      };

      const response = await axiosInstance.post(
        endpoints.payment.createPayout,
        paymentRequest
      );

      if (response.data.success) {
        const payoutData = response.data.data?.data || response.data.data;
        setQrData(payoutData);
      } else {
        message.error("Không thể tạo mã QR thanh toán");
        setPaymentModalVisible(false);
      }
    } catch (error) {
      console.error("Error creating payout:", error);
      message.error("Có lỗi xảy ra khi tạo thanh toán");
      setPaymentModalVisible(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle payment verification
  const handleVerifyPayment = async () => {
    if (!qrData || !qrData.verify_hook) {
      message.error("Không tìm thấy thông tin xác thực");
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await axiosInstance.get(qrData.verify_hook);

      if (response.data.success) {
        message.success("Xác nhận thanh toán thành công!");
        setPaymentModalVisible(false);
        setQrData(null);
        // Refresh payout detail
        await fetchPayoutDetail(payoutId);
      } else {
        message.error("Xác nhận thanh toán thất bại");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      message.error("Có lỗi xảy ra khi xác nhận thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle close payment modal
  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setQrData(null);
  };

  if (payoutDetailLoading || !allDataLoaded) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Đang tải thông tin chi trả..." />
        </div>
      </Layout.Content>
    );
  }

  if (payoutDetailError) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Lỗi: {payoutDetailError}</Text>
        </div>
      </Layout.Content>
    );
  }

  if (!payoutDetail) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="secondary">Không tìm thấy thông tin chi trả</Text>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="insurance-title !mb-0">
              Chi Tiết Chi Trả
            </Title>
            <Space className="insurance-subtitle">
              <Text>Mã: {payoutDetail.id}</Text>
              <Text>|</Text>
              <Text>Trạng thái:</Text>
              <Tag
                color={getStatusColor(payoutDetail.status)}
                icon={getStatusIcon(payoutDetail.status)}
                style={{ fontSize: "13px" }}
              >
                {getStatusText(payoutDetail.status)}
              </Tag>
            </Space>
          </div>

          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
            >
              Quay lại
            </Button>
            {payoutDetail.status !== "completed" && (
              <Button
                type="primary"
                icon={<WalletOutlined />}
                size="large"
                onClick={handlePayment}
              >
                Thanh toán
              </Button>
            )}
          </Space>
        </div>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <WalletOutlined
                      style={{ fontSize: 32, color: "#1890ff" }}
                    />
                  </div>
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Số tiền chi trả
                </Text>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1890ff",
                    marginTop: "8px",
                  }}
                >
                  {formatCurrency(payoutDetail.payout_amount)}
                </div>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {payoutDetail.currency || "VND"}
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div
                    className={`p-4 rounded-full ${
                      payoutDetail.status === "completed"
                        ? "bg-green-100"
                        : payoutDetail.status === "processing"
                        ? "bg-orange-100"
                        : payoutDetail.status === "failed"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {getStatusIcon(payoutDetail.status) && (
                      <span
                        style={{
                          fontSize: 32,
                          color:
                            payoutDetail.status === "completed"
                              ? "#52c41a"
                              : payoutDetail.status === "processing"
                              ? "#fa8c16"
                              : payoutDetail.status === "failed"
                              ? "#ff4d4f"
                              : "#8c8c8c",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "60px",
                          height: "60px",
                        }}
                      >
                        {getStatusIcon(payoutDetail.status)}
                      </span>
                    )}
                  </div>
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Trạng thái
                </Text>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginTop: "8px",
                  }}
                >
                  {getStatusText(payoutDetail.status)}
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} className="shadow-sm">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div
                    className={`p-4 rounded-full ${
                      payoutDetail.farmer_confirmed
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <UserOutlined
                      style={{
                        fontSize: 32,
                        color: payoutDetail.farmer_confirmed
                          ? "#52c41a"
                          : "#8c8c8c",
                      }}
                    />
                  </div>
                </div>
                <Text
                  type="secondary"
                  style={{ fontSize: "13px", display: "block" }}
                >
                  Xác nhận nông dân
                </Text>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginTop: "8px",
                    color: payoutDetail.farmer_confirmed
                      ? "#52c41a"
                      : "#8c8c8c",
                  }}
                >
                  {payoutDetail.farmer_confirmed
                    ? "Đã xác nhận"
                    : "Chưa xác nhận"}
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Thông tin chi trả */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <WalletOutlined />
                  <span>Thông Tin Chi Trả</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
              style={{ height: "100%" }}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã chi trả">
                  <Text strong style={{ color: "#1890ff" }}>
                    {payoutDetail.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền">
                  <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
                    {formatCurrency(payoutDetail.payout_amount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Loại tiền">
                  {payoutDetail.currency || "VND"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag
                    color={getStatusColor(payoutDetail.status)}
                    icon={getStatusIcon(payoutDetail.status)}
                  >
                    {getStatusText(payoutDetail.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian khởi tạo">
                  {formatDate(payoutDetail.initiated_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian hoàn tất">
                  {formatDate(payoutDetail.completed_at)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin liên quan */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Thông Tin Liên Quan</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
              style={{ height: "100%" }}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Yêu cầu bồi thường">
                  {claim ? (
                    <Link href={`/claim/detail?id=${claim.id}`}>
                      <Text style={{ color: "#1890ff" }}>
                        {claim.claim_number}
                      </Text>
                    </Link>
                  ) : (
                    <Text type="secondary">{payoutDetail.claim_id}</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn bảo hiểm">
                  {policy ? (
                    <Link
                      href={`/policy/policy-detail?id=${policy.id}&type=active`}
                    >
                      <Text style={{ color: "#1890ff" }}>
                        {policy.policy_number}
                      </Text>
                    </Link>
                  ) : (
                    <Text type="secondary">
                      {payoutDetail.registered_policy_id}
                    </Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trang trại">
                  {farm ? (
                    <Text>{farm.farm_name || "Trang trại"}</Text>
                  ) : (
                    <Text type="secondary">{payoutDetail.farm_id}</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Nông dân">
                  <Text>{payoutDetail.farmer_id}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Phản hồi từ nông dân */}
          {payoutDetail.farmer_confirmed && (
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    <span>Phản Hồi Từ Nông Dân</span>
                  </Space>
                }
                bordered={false}
                className="shadow-sm"
              >
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Xác nhận" span={1}>
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Đã xác nhận
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian xác nhận" span={1}>
                    <Text strong>
                      {formatDate(payoutDetail.farmer_confirmation_timestamp)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Đánh giá" span={1}>
                    {payoutDetail.farmer_rating ? (
                      <Space>
                        <Rate
                          disabled
                          value={payoutDetail.farmer_rating}
                          style={{ fontSize: "16px" }}
                        />
                        <Text strong>({payoutDetail.farmer_rating}/5)</Text>
                      </Space>
                    ) : (
                      <Text type="secondary">Chưa đánh giá</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phản hồi" span={2}>
                    {payoutDetail.farmer_feedback ? (
                      <Text>{payoutDetail.farmer_feedback}</Text>
                    ) : (
                      <Text type="secondary">Không có phản hồi</Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          )}

          {/* Thông tin thời gian */}
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Lịch Sử Thời Gian</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Ngày tạo" span={1}>
                  {formatDate(payoutDetail.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Khởi tạo thanh toán" span={1}>
                  {formatDate(payoutDetail.initiated_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Hoàn tất thanh toán" span={1}>
                  {formatDate(payoutDetail.completed_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Nông dân xác nhận" span={1}>
                  {formatDate(payoutDetail.farmer_confirmation_timestamp)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Payment QR Modal */}
      <PayoutQRModal
        visible={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        onVerify={handleVerifyPayment}
        loading={paymentLoading}
        qrData={qrData}
        selectedPayout={payoutDetail}
        claimNumber={claim?.claim_number || payoutDetail.claim_id}
        formatCurrency={formatCurrency}
      />
    </Layout.Content>
  );
}
