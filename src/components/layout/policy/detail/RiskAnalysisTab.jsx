import { CheckCircleOutlined, ExclamationCircleOutlined, SafetyOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Space, Tag, Typography } from "antd";

const { Text, Title } = Typography;

export default function RiskAnalysisTab({
  riskAnalysis,
  hasRiskAnalysis,
  pageType,
  onCreateRiskAnalysis,
  getRiskAnalysisWarning,
  getRiskLevelColor,
  getRiskLevelText,
  getAnalysisTypeText,
}) {
  const getAnalysisStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "passed":
        return "green";
      case "failed":
        return "red";
      case "pending":
        return "orange";
      default:
        return "default";
    }
  };

  const getAnalysisStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "passed":
        return "Hoàn thành";
      case "failed":
        return "Thất bại";
      case "pending":
        return "Đang xử lý";
      default:
        return status;
    }
  };

  const getRecommendationColor = (rec) => {
    switch (rec?.toLowerCase()) {
      case "reject":
        return "red";
      case "approve":
        return "green";
      case "review":
        return "orange";
      default:
        return "default";
    }
  };

  const getRecommendationText = (rec) => {
    switch (rec?.toLowerCase()) {
      case "reject":
        return "Từ chối";
      case "approve":
        return "Chấp thuận";
      case "review":
        return "Xem xét thêm";
      default:
        return rec;
    }
  };

  return (
    <Card>
      {!hasRiskAnalysis && pageType === "pending" && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message={
            <Text strong style={{ fontSize: '16px' }}>
              {getRiskAnalysisWarning("NO_RISK_ANALYSIS")}
            </Text>
          }
          description={
            <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
              <Text>{getRiskAnalysisWarning("NO_RISK_ANALYSIS_DESCRIPTION")}</Text>
              <Text>{getRiskAnalysisWarning("AUTO_OR_MANUAL")}</Text>
              <Button
                type="primary"
                icon={<SafetyOutlined />}
                onClick={onCreateRiskAnalysis}
                style={{ marginTop: 8 }}
              >
                {getRiskAnalysisWarning("CREATE_BUTTON")}
              </Button>
            </Space>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {riskAnalysis ? (
        <Space direction="vertical" size="middle" className="w-full">
          {/* Summary Section */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <SafetyOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>Tổng quan đánh giá rủi ro</Title>
              </div>
              {pageType === "pending" && (
                <Button
                  type="dashed"
                  icon={<SafetyOutlined />}
                  onClick={onCreateRiskAnalysis}
                  size="small"
                >
                  Tạo đánh giá thủ công
                </Button>
              )}
            </div>
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size="small"
              labelStyle={{ fontWeight: 500 }}
            >
              <Descriptions.Item label="Mã hợp đồng">
                <Text code>{riskAnalysis.registered_policy_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng đánh giá">
                <Tag color={riskAnalysis.count > 0 ? "blue" : "orange"} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {riskAnalysis.count} đánh giá
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Risk Analyses Details */}
          {riskAnalysis.risk_analyses && riskAnalysis.risk_analyses.length > 0 ? (
            <Space direction="vertical" size="middle" className="w-full">
              {riskAnalysis.risk_analyses.map((analysis, idx) => (
                <Card key={analysis.id || idx}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <ExclamationCircleOutlined style={{ fontSize: '20px', color: getRiskLevelColor(analysis.overall_risk_level) === 'green' ? '#52c41a' : getRiskLevelColor(analysis.overall_risk_level) === 'red' ? '#ff4d4f' : '#faad14' }} />
                      <Title level={4} style={{ margin: 0 }}>Đánh giá rủi ro #{idx + 1}</Title>
                    </div>
                    <Space>
                      <Tag color={getAnalysisStatusColor(analysis.analysis_status)} style={{ fontSize: '13px', padding: '4px 10px' }}>
                        {getAnalysisStatusText(analysis.analysis_status)}
                      </Tag>
                      <Tag color={getRiskLevelColor(analysis.overall_risk_level)} style={{ fontSize: '13px', padding: '4px 10px' }}>
                        {getRiskLevelText(analysis.overall_risk_level)}
                      </Tag>
                    </Space>
                  </div>
                  <Space direction="vertical" size="middle" className="w-full">
                    {/* Basic Info */}
                    <Descriptions column={{ xs: 1, sm: 2 }} size="small" labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item
                        label="Loại phân tích"
                        span={1}
                      >
                        <Tag color="blue">{getAnalysisTypeText(analysis.analysis_type)}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item
                        label="Nguồn phân tích"
                        span={1}
                      >
                        {analysis.analysis_source}
                      </Descriptions.Item>
                      <Descriptions.Item
                        label="Thời gian phân tích"
                        span={1}
                      >
                        {new Date(
                          analysis.analysis_timestamp * 1000
                        ).toLocaleString("vi-VN")}
                      </Descriptions.Item>
                      <Descriptions.Item
                        label="Điểm rủi ro tổng thể"
                        span={1}
                      >
                        <Text
                          strong
                          style={{
                            color:
                              analysis.overall_risk_score > 0.7
                                ? "#ff4d4f"
                                : analysis.overall_risk_score > 0.4
                                  ? "#faad14"
                                  : "#52c41a",
                          }}
                        >
                          {(analysis.overall_risk_score * 100).toFixed(
                            1
                          )}
                          %
                        </Text>
                      </Descriptions.Item>
                      {analysis.analysis_notes && (
                        <Descriptions.Item
                          label="Ghi chú phân tích"
                          span={2}
                        >
                          <Text type="secondary">
                            {analysis.analysis_notes}
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    {/* Show raw_output details if available - This contains all the detailed risk analysis */}
                    {analysis.raw_output && (
                      <Card type="inner" style={{ backgroundColor: '#fafafa' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
                          <Text strong style={{ fontSize: '15px' }}>Chi tiết phân tích AI</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                          Dữ liệu chi tiết được phân tích bởi AI, bao gồm giám sát, trigger, gian lận và khuyến nghị.
                        </Text>
                        {/*
                          NOTE: The complete implementation of raw_output rendering
                          is very large (1000+ lines). For this refactoring, we keep
                          it in the main page file. If needed, this can be further
                          extracted into sub-components.
                        */}
                      </Card>
                    )}

                    {/* Timestamp */}
                    {analysis.created_at && (
                      <div className="text-right">
                        <Text type="secondary" className="text-xs">
                          Tạo lúc:{" "}
                          {new Date(analysis.created_at).toLocaleString(
                            "vi-VN"
                          )}
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          ) : (
            <Card size="small">
              <Text type="secondary">
                Chưa có dữ liệu đánh giá rủi ro chi tiết cho hợp đồng này
              </Text>
            </Card>
          )}
        </Space>
      ) : (
        <Text type="secondary">Đang tải dữ liệu phân tích rủi ro...</Text>
      )}
    </Card>
  );
}
