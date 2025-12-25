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
      return `Lỗi: ${errorInfo.errorMessage}`;
    }
    if (errorInfo?.reason) {
      return `Lý do: ${errorInfo.reason}`;
    }
    if (errorInfo?.orderId) {
      return `Mã đơn hàng: ${errorInfo.orderId}${
        errorInfo.errorCode ? ` | Mã lỗi: ${errorInfo.errorCode}` : ""
      }`;
    }
    return "Giao dịch không thể xử lý. Vui lòng thử lại.";
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
        title="Thanh toán thất bại"
        subTitle={getSubTitle()}
        extra={[
          <Button type="primary" key="retry" onClick={() => router.back()}>
            Thử lại
          </Button>,
          <Button key="base" onClick={() => router.push("/base-policy")}>
            Về danh sách Gói bảo hiểm
          </Button>,
          <Button key="support" onClick={() => router.push("/support")}>
            Liên hệ hỗ trợ
          </Button>,
        ]}
      />
    </div>
  );
}
