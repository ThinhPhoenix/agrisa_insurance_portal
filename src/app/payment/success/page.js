"use client";
import { Button, Result } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    // Get payment info from URL params
    const orderId = searchParams.get("orderId") || searchParams.get("order_id");
    const amount = searchParams.get("amount");
    const status = searchParams.get("status");

    if (orderId || amount || status) {
      setOrderInfo({
        orderId,
        amount,
        status,
      });
    }
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <Result
        status="success"
        title=" Thanh toán thành công / Payment Successful! !"
        subTitle={
          orderInfo?.orderId
            ? `Order ID: ${orderInfo.orderId}${
                orderInfo.amount ? ` | Amount: ${orderInfo.amount} VND` : ""
              }`
            : "Giao dịch của bạn đã được xử lý thành công. / Your payment has been processed successfully. "
        }
        extra={[
          <Button type="primary" key="home" onClick={() => router.push("/")}>
            Go Home / Về trang chủ
          </Button>,
          <Button key="orders" onClick={() => router.push("/orders")}>
            View Orders / Xem đơn hàng
          </Button>,
        ]}
      />
    </div>
  );
}
