"use client";
import { Button, Result } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    // Get error info from URL params
    const orderId = searchParams.get("orderId") || searchParams.get("order_id");
    const errorCode =
      searchParams.get("error") || searchParams.get("errorCode");
    const errorMessage =
      searchParams.get("message") || searchParams.get("errorMessage");
    const reason = searchParams.get("reason");

    if (orderId || errorCode || errorMessage || reason) {
      setErrorInfo({
        orderId,
        errorCode,
        errorMessage,
        reason,
      });
    }
  }, [searchParams]);

  const getSubTitle = () => {
    if (errorInfo?.errorMessage) {
      return `Error: ${errorInfo.errorMessage}`;
    }
    if (errorInfo?.reason) {
      return `Reason: ${errorInfo.reason} / Lý do: ${errorInfo.reason}`;
    }
    if (errorInfo?.orderId) {
      return `Order ID: ${errorInfo.orderId}${
        errorInfo.errorCode ? ` | Error Code: ${errorInfo.errorCode}` : ""
      }`;
    }
    return "Giao dịch không thể xử lý. Vui lòng thử lại. / Your payment could not be processed. Please try again.";
  };

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
        status="error"
        title="Thanh toán thất bại / Payment Failed!"
        subTitle={getSubTitle()}
        extra={[
          <Button type="primary" key="retry" onClick={() => router.back()}>
            Try Again / Thử lại
          </Button>,
          <Button key="home" onClick={() => router.push("/")}>
            Go Home / Về trang chủ
          </Button>,
          <Button key="support" onClick={() => router.push("/support")}>
            Contact Support / Liên hệ hỗ trợ
          </Button>,
        ]}
      />
    </div>
  );
}
