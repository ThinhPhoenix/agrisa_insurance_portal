import { Typography } from "antd";

const { Text } = Typography;

/**
 * GlassmorphismBadge - A minimal glassmorphism badge with pastel colors
 * Used for status displays with a clean, modern aesthetic
 */
export default function GlassmorphismBadge({ status, className = "", size = "md", style = {} }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "draft":
        return {
          background: "rgba(24, 144, 255, 0.12)",
          border: "1px solid rgba(24, 144, 255, 0.3)",
          color: "#096dd9",
          text: "Bản nháp",
        };
      case "pending_review":
        return {
          background: "rgba(250, 173, 20, 0.12)",
          border: "1px solid rgba(250, 173, 20, 0.3)",
          color: "#d46b08",
          text: "Chờ duyệt",
        };
      case "pending_payment":
        return {
          background: "rgba(250, 219, 20, 0.12)",
          border: "1px solid rgba(250, 219, 20, 0.3)",
          color: "#d48806",
          text: "Chờ thanh toán",
        };
      case "active":
        return {
          background: "rgba(82, 196, 154, 0.12)",
          border: "1px solid rgba(82, 196, 154, 0.3)",
          color: "#18573f",
          text: "Đang có hiệu lực",
        };
      case "closed":
        return {
          background: "rgba(140, 140, 140, 0.12)",
          border: "1px solid rgba(140, 140, 140, 0.3)",
          color: "#595959",
          text: "Đã đóng (kết thúc)",
        };
      case "archived":
        return {
          background: "rgba(10, 25, 47, 0.06)",
          border: "1px solid rgba(10,25,47,0.08)",
          color: "#404040",
          text: "Lưu trữ (lưu lịch sử)",
        };
      case "payout":
        return {
          background: "rgba(82, 196, 154, 0.12)",
          border: "1px solid rgba(82, 196, 154, 0.3)",
          color: "#18573f",
          text: "Đang chi trả",
        };
      case "expired":
        return {
          background: "rgba(140, 140, 140, 0.12)",
          border: "1px solid rgba(140, 140, 140, 0.3)",
          color: "#595959",
          text: "Hết hạn",
        };
      case "pending_cancel":
        return {
          background: "rgba(250, 173, 20, 0.12)",
          border: "1px solid rgba(250, 173, 20, 0.3)",
          color: "#d46b08",
          text: "Chờ hủy",
        };
      case "cancelled":
        return {
          background: "rgba(255, 87, 34, 0.12)",
          border: "1px solid rgba(255, 87, 34, 0.3)",
          color: "#d4380d",
          text: "Đã hủy",
        };
      case "rejected":
        return {
          background: "rgba(255, 77, 79, 0.12)",
          border: "1px solid rgba(255, 77, 79, 0.3)",
          color: "#cf1322",
          text: "Đã từ chối",
        };
      case "dispute":
        return {
          background: "rgba(255, 77, 79, 0.12)",
          border: "1px solid rgba(255, 77, 79, 0.3)",
          color: "#cf1322",
          text: "Tranh chấp",
        };
      case "cancelled_pending_payment":
        return {
          background: "rgba(255, 87, 34, 0.12)",
          border: "1px solid rgba(255, 87, 34, 0.3)",
          color: "#d4380d",
          text: "Đã hủy (Chờ thanh toán)",
        };
      default:
        return {
          background: "rgba(140, 140, 140, 0.12)",
          border: "1px solid rgba(140, 140, 140, 0.3)",
          color: "#595959",
          text: status,
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeStyles =
    size === "sm"
      ? { padding: "4px 8px", fontSize: "12px", borderRadius: "6px" }
      : { padding: "6px 12px", fontSize: "14px", borderRadius: "10px" };

  return (
    <span
      className={`inline-block backdrop-blur-sm ${className}`}
      style={{
        background: config.background,
        border: config.border,
        fontWeight: 500,
        transition: "all 0.2s ease-in-out",
        display: "inline-block",
        ...sizeStyles,
        ...style,
      }}
    >
      <Text style={{ color: config.color, fontWeight: 500, fontSize: sizeStyles.fontSize }}>
        {config.text}
      </Text>
    </span>
  );
}
