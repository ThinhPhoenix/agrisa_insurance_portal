import { getErrorMessage } from "@/libs/message/common-message";
import { Button, Layout, Result } from "antd";
import { useRouter } from "next/navigation";

/**
 * ErrorResult Component - Reusable error display component
 *
 * @param {Object} props
 * @param {string} props.status - Error status (403, 404, 500, etc.)
 * @param {string} props.title - Title to display (defaults to status)
 * @param {string} props.subTitle - Subtitle/error message
 * @param {string} props.backUrl - URL to navigate back (default: "/")
 * @param {string} props.backText - Text for back button (default: "Quay lại")
 * @param {boolean} props.showBackButton - Whether to show back button (default: true)
 * @param {React.ReactNode} props.extra - Custom extra content/buttons
 */
export default function ErrorResult({
  status = "404",
  title,
  subTitle,
  backUrl = "/",
  backText = "Quay lại",
  showBackButton = true,
  extra,
}) {
  const router = useRouter();

  // Default titles based on status
  const getDefaultTitle = () => {
    switch (status) {
      case "403":
        return "403";
      case "404":
        return "404";
      case "500":
        return "500";
      default:
        return status;
    }
  };

  // Default subtitles based on status
  const getDefaultSubTitle = () => {
    switch (status) {
      case "403":
        return getErrorMessage("FORBIDDEN");
      case "404":
        return getErrorMessage("NOT_FOUND");
      case "500":
        return getErrorMessage("SERVER_ERROR");
      default:
        return "Đã xảy ra lỗi";
    }
  };

  const displayTitle = title || getDefaultTitle();
  const displaySubTitle = subTitle || getDefaultSubTitle();

  const defaultExtra = showBackButton ? (
    <Button type="primary" onClick={() => router.push(backUrl)}>
      {backText}
    </Button>
  ) : null;

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        <Result
          status={status}
          title={displayTitle}
          subTitle={displaySubTitle}
          extra={extra || defaultExtra}
        />
      </div>
    </Layout.Content>
  );
}
