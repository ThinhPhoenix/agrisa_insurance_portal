import { Button, Card, Collapse, Descriptions, Space, Tag, Typography } from "antd";
import { SafetyOutlined, WarningOutlined } from "@ant-design/icons";
import {
  getFactorDescription,
  getFactorLevel,
  getFactorType,
  getRiskTitle,
  normalizeFraudAssessment,
  normalizeIdentifiedRisks,
  normalizeTriggerSimulation,
} from "@/components/layout/policy/detail/risk-analysis-normalizer";

const { Text } = Typography;

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
        <Card
          type="inner"
          style={{
            backgroundColor: "#fff7e6",
            borderColor: "#ffa940",
            borderLeft: "4px solid #fa8c16",
            marginBottom: "16px",
          }}
        >
          <Space direction="vertical" size="small" className="w-full">
            <div className="flex items-center gap-2">
              <WarningOutlined
                style={{ color: "#fa8c16", fontSize: "18px" }}
              />
              <Text strong style={{ color: "#d46b08", fontSize: "16px" }}>
                {getRiskAnalysisWarning("NO_RISK_ANALYSIS")}
              </Text>
            </div>
            <Text type="secondary">
              {getRiskAnalysisWarning("NO_RISK_ANALYSIS_DESCRIPTION")}
            </Text>
            <Text type="secondary">
              {getRiskAnalysisWarning("AUTO_OR_MANUAL")}
            </Text>
            <Button
              type="primary"
              icon={<SafetyOutlined />}
              onClick={onCreateRiskAnalysis}
              style={{ marginTop: "8px" }}
            >
              {getRiskAnalysisWarning("CREATE_BUTTON")}
            </Button>
          </Space>
        </Card>
      )}

      {riskAnalysis ? (
        <Space direction="vertical" size="large" className="w-full">
          {/* Summary Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Text strong className="text-base">
                Tổng quan đánh giá rủi ro
              </Text>
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
              column={1}
              size="small"
              bordered
              labelStyle={{ width: "50%" }}
              contentStyle={{ width: "50%" }}
            >
              <Descriptions.Item label="Mã hợp đồng đã đăng ký">
                <Text code>{riskAnalysis.registered_policy_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng đánh giá rủi ro">
                <Tag color={riskAnalysis.count > 0 ? "blue" : "orange"}>
                  {riskAnalysis.count} đánh giá
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Risk Analyses Details */}
          {riskAnalysis.risk_analyses &&
          riskAnalysis.risk_analyses.length > 0 ? (
            <Space direction="vertical" size="large" className="w-full">
              {riskAnalysis.risk_analyses.map((analysis, idx) => (
                <Card
                  key={analysis.id || idx}
                  title={
                    <div className="flex justify-between items-center">
                      <span>Đánh giá rủi ro #{idx + 1}</span>
                      <Space>
                        <Tag
                          color={getAnalysisStatusColor(
                            analysis.analysis_status
                          )}
                        >
                          {getAnalysisStatusText(
                            analysis.analysis_status
                          )}
                        </Tag>
                        <Tag
                          color={getRiskLevelColor(
                            analysis.overall_risk_level
                          )}
                        >
                          Mức độ:{" "}
                          {getRiskLevelText(analysis.overall_risk_level)}
                        </Tag>
                      </Space>
                    </div>
                  }
                >
                  <Space
                    direction="vertical"
                    size="large"
                    className="w-full"
                  >
                    {/* Basic Info */}
                    <div>
                      <Text strong className="text-base block mb-3">
                        Thông tin cơ bản
                      </Text>
                      <Descriptions column={2} size="small" bordered>
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
                    </div>

                    {/* Show raw_output details if available - This contains all the detailed risk analysis */}
                    {analysis.raw_output && (
                      <div>
                        <Text strong className="text-base block mb-3">
                          Chi tiết phân tích từ AI
                        </Text>
                        <Text type="secondary" className="block mb-3">
                          Dữ liệu chi tiết được phân tích bởi hệ thống AI, bao gồm phân tích dữ liệu giám sát, mô phỏng trigger, đánh giá gian lận và khuyến nghị.
                        </Text>
                        {/*
                          NOTE: The complete implementation of raw_output rendering
                          is very large (1000+ lines). For this refactoring, we keep
                          it in the main page file. If needed, this can be further
                          extracted into sub-components.
                        */}
                      </div>
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
