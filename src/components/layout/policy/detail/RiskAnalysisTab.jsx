import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  BugOutlined,
  BarChartOutlined,
  CodeOutlined
} from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Space, Typography, Collapse, Tag, Divider, List, Progress } from "antd";

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

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

  const getRiskCategoryText = (category) => {
    switch (category) {
      case "agronomic_risk":
        return "Rủi ro nông học";
      case "data_quality_risk":
        return "Rủi ro chất lượng dữ liệu";
      case "fraud_risk":
        return "Rủi ro gian lận";
      case "policy_structure_risk":
        return "Rủi ro cấu trúc chính sách";
      case "geographic_risk":
        return "Rủi ro địa lý";
      case "infrastructure_risk":
        return "Rủi ro cơ sở hạ tầng";
      case "other":
        return "Rủi ro khác";
      default:
        return category;
    }
  };

  const getFarmCharacteristicText = (key) => {
    switch (key) {
      case "crop_viability":
        return "Khả năng sinh trưởng cây trồng";
      case "geographic_risk":
        return "Rủi ro địa lý";
      case "infrastructure_quality":
        return "Chất lượng cơ sở hạ tầng";
      default:
        return key;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#52c41a';
    if (score >= 40) return '#faad14';
    return '#ff4d4f';
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
              <Descriptions.Item label="Số lượng đánh giá">
                <Text strong style={{ fontSize: '14px', color: riskAnalysis.count > 0 ? '#096dd9' : '#d46b08' }}>
                  {riskAnalysis.count} đánh giá
                </Text>
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
                      <Text strong style={{
                        fontSize: '13px',
                        color: getAnalysisStatusColor(analysis.analysis_status) === 'green' ? '#18573f' :
                               getAnalysisStatusColor(analysis.analysis_status) === 'red' ? '#cf1322' :
                               getAnalysisStatusColor(analysis.analysis_status) === 'orange' ? '#d46b08' : '#595959'
                      }}>
                        {getAnalysisStatusText(analysis.analysis_status)}
                      </Text>
                      <Text strong style={{
                        fontSize: '13px',
                        color: getRiskLevelColor(analysis.overall_risk_level) === 'green' ? '#18573f' :
                               getRiskLevelColor(analysis.overall_risk_level) === 'red' ? '#cf1322' :
                               getRiskLevelColor(analysis.overall_risk_level) === 'orange' ? '#d46b08' :
                               getRiskLevelColor(analysis.overall_risk_level) === 'gold' ? '#d48806' : '#595959'
                      }}>
                        {getRiskLevelText(analysis.overall_risk_level)}
                      </Text>
                    </Space>
                  </div>
                  <Space direction="vertical" size="middle" className="w-full">
                    {/* Basic Info */}
                    <Descriptions column={{ xs: 1, sm: 2 }} size="small" labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item
                        label="Loại phân tích"
                        span={1}
                      >
                        <Text strong style={{ fontSize: '13px', color: '#096dd9' }}>
                          {getAnalysisTypeText(analysis.analysis_type)}
                        </Text>
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

                    {/* Detailed Risk Analysis Sections */}
                    {analysis.raw_output && (
                      <Collapse
                        defaultActiveKey={[]}
                        ghost
                        expandIconPosition="end"
                        className="risk-analysis-collapse"
                      >
                        {/* Identified Risks Panel */}
                        {analysis.identified_risks && Object.keys(analysis.identified_risks).length > 0 && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <BugOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />
                                <Text strong style={{ fontSize: '14px' }}>Rủi ro đã phát hiện</Text>
                                <Tag color="red">{Object.keys(analysis.identified_risks).length} loại</Tag>
                              </div>
                            }
                            key="identified_risks"
                          >
                            <Space direction="vertical" size="middle" className="w-full">
                              {Object.entries(analysis.identified_risks).map(([category, riskData]) => (
                                <Card key={category} size="small" type="inner">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <Text strong style={{ fontSize: '14px' }}>
                                        {getRiskCategoryText(category)}
                                      </Text>
                                      <div className="mt-1">
                                        <Tag color={getRiskLevelColor(riskData.risk_level)}>
                                          {getRiskLevelText(riskData.risk_level)}
                                        </Tag>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Text type="secondary" style={{ fontSize: '12px' }}>Điểm rủi ro</Text>
                                      <div>
                                        <Text strong style={{
                                          fontSize: '20px',
                                          color: riskData.risk_score > 70 ? '#ff4d4f' :
                                                 riskData.risk_score > 40 ? '#faad14' : '#52c41a'
                                        }}>
                                          {riskData.risk_score}
                                        </Text>
                                        <Text type="secondary">/100</Text>
                                      </div>
                                      <Progress
                                        percent={riskData.risk_score}
                                        showInfo={false}
                                        strokeColor={
                                          riskData.risk_score > 70 ? '#ff4d4f' :
                                          riskData.risk_score > 40 ? '#faad14' : '#52c41a'
                                        }
                                        size="small"
                                      />
                                    </div>
                                  </div>
                                  {riskData.factors && riskData.factors.length > 0 && (
                                    <List
                                      size="small"
                                      dataSource={riskData.factors}
                                      renderItem={(factor) => (
                                        <List.Item>
                                          <div className="w-full">
                                            <div className="flex justify-between items-start mb-2">
                                              <Text strong style={{ fontSize: '13px' }}>
                                                {factor.factor}
                                              </Text>
                                              <Tag color="orange">+{factor.score_impact}</Tag>
                                            </div>
                                            <Paragraph
                                              type="secondary"
                                              style={{ fontSize: '12px', marginBottom: 8 }}
                                            >
                                              {factor.details}
                                            </Paragraph>
                                            <div className="bg-gray-50 p-2 rounded">
                                              <Text
                                                type="secondary"
                                                style={{ fontSize: '11px', fontStyle: 'italic' }}
                                              >
                                                <strong>Bằng chứng:</strong> {factor.evidence}
                                              </Text>
                                            </div>
                                          </div>
                                        </List.Item>
                                      )}
                                    />
                                  )}
                                </Card>
                              ))}
                            </Space>
                          </Panel>
                        )}

                        {/* Recommendations Panel */}
                        {analysis.recommendations && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <FileTextOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                                <Text strong style={{ fontSize: '14px' }}>Khuyến nghị & Hành động</Text>
                              </div>
                            }
                            key="recommendations"
                          >
                            <Space direction="vertical" size="middle" className="w-full">
                              {/* Underwriting Decision */}
                              {analysis.recommendations.underwriting_decision && (
                                <Card size="small" type="inner">
                                  <div className="flex items-center gap-2 mb-3">
                                    <CheckCircleOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                                    <Text strong>Quyết định bảo lãnh</Text>
                                  </div>
                                  <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Khuyến nghị">
                                      <Tag
                                        color={getRecommendationColor(
                                          analysis.recommendations.underwriting_decision.recommendation
                                        )}
                                        style={{ fontSize: '13px', fontWeight: 500 }}
                                      >
                                        {getRecommendationText(
                                          analysis.recommendations.underwriting_decision.recommendation
                                        )}
                                      </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Độ tin cậy">
                                      <Progress
                                        percent={analysis.recommendations.underwriting_decision.confidence}
                                        size="small"
                                        status={
                                          analysis.recommendations.underwriting_decision.confidence > 80
                                            ? 'success'
                                            : analysis.recommendations.underwriting_decision.confidence > 60
                                              ? 'normal'
                                              : 'exception'
                                        }
                                      />
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Lý do">
                                      <Paragraph style={{ fontSize: '12px', marginBottom: 0 }}>
                                        {analysis.recommendations.underwriting_decision.reasoning}
                                      </Paragraph>
                                    </Descriptions.Item>
                                  </Descriptions>
                                </Card>
                              )}

                              {/* Suggested Actions */}
                              {analysis.recommendations.suggested_actions &&
                                analysis.recommendations.suggested_actions.length > 0 && (
                                  <Card size="small" type="inner">
                                    <Text strong style={{ fontSize: '13px' }}>Hành động đề xuất</Text>
                                    <List
                                      size="small"
                                      dataSource={analysis.recommendations.suggested_actions}
                                      renderItem={(action) => (
                                        <List.Item>
                                          <Text style={{ fontSize: '12px' }}>• {action}</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </Card>
                                )}

                              {/* Required Verifications */}
                              {analysis.recommendations.required_verifications &&
                                analysis.recommendations.required_verifications.length > 0 && (
                                  <Card size="small" type="inner">
                                    <Text strong style={{ fontSize: '13px' }}>Xác minh bắt buộc</Text>
                                    <List
                                      size="small"
                                      dataSource={analysis.recommendations.required_verifications}
                                      renderItem={(verification) => (
                                        <List.Item>
                                          <Text style={{ fontSize: '12px' }}>• {verification}</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </Card>
                                )}

                              {/* Trigger Adjustments */}
                              {analysis.recommendations.trigger_adjustments &&
                                analysis.recommendations.trigger_adjustments.length > 0 && (
                                  <Card size="small" type="inner">
                                    <div className="flex items-center gap-2 mb-3">
                                      <ThunderboltOutlined style={{ fontSize: '16px', color: '#faad14' }} />
                                      <Text strong style={{ fontSize: '13px' }}>Điều chỉnh Trigger</Text>
                                    </div>
                                    <List
                                      size="small"
                                      dataSource={analysis.recommendations.trigger_adjustments}
                                      renderItem={(trigger) => (
                                        <List.Item>
                                          <div className="w-full">
                                            <div className="mb-2">
                                              <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                                                {trigger.condition_id}
                                              </Tag>
                                              <Tag color="orange">{trigger.recommendation}</Tag>
                                            </div>
                                            <Paragraph
                                              type="secondary"
                                              style={{ fontSize: '12px', marginBottom: 0 }}
                                            >
                                              {trigger.reasoning}
                                            </Paragraph>
                                          </div>
                                        </List.Item>
                                      )}
                                    />
                                  </Card>
                                )}

                              {/* Monitoring Recommendations */}
                              {analysis.recommendations.monitoring_recommendations &&
                                analysis.recommendations.monitoring_recommendations.length > 0 && (
                                  <Card size="small" type="inner">
                                    <Text strong style={{ fontSize: '13px' }}>Khuyến nghị giám sát</Text>
                                    <List
                                      size="small"
                                      dataSource={analysis.recommendations.monitoring_recommendations}
                                      renderItem={(monitoring) => (
                                        <List.Item>
                                          <Text style={{ fontSize: '12px' }}>• {monitoring}</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </Card>
                                )}

                              {/* Premium Adjustment */}
                              {analysis.recommendations.premium_adjustment && (
                                <Card size="small" type="inner">
                                  <Text strong style={{ fontSize: '13px' }}>Điều chỉnh phí bảo hiểm</Text>
                                  <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                                    <Descriptions.Item label="Khuyến nghị">
                                      <Tag>{analysis.recommendations.premium_adjustment.recommendation}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Thay đổi">
                                      <Text
                                        strong
                                        style={{
                                          color:
                                            analysis.recommendations.premium_adjustment.percentage_change > 0
                                              ? '#ff4d4f'
                                              : analysis.recommendations.premium_adjustment.percentage_change < 0
                                                ? '#52c41a'
                                                : '#595959'
                                        }}
                                      >
                                        {analysis.recommendations.premium_adjustment.percentage_change > 0 && '+'}
                                        {analysis.recommendations.premium_adjustment.percentage_change}%
                                      </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Lý do">
                                      <Text style={{ fontSize: '12px' }}>
                                        {analysis.recommendations.premium_adjustment.reasoning}
                                      </Text>
                                    </Descriptions.Item>
                                  </Descriptions>
                                </Card>
                              )}
                            </Space>
                          </Panel>
                        )}

                        {/* Trigger Simulation Panel */}
                        {analysis.raw_output.trigger_simulation && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <ThunderboltOutlined style={{ fontSize: '16px', color: '#722ed1' }} />
                                <Text strong style={{ fontSize: '14px' }}>Mô phỏng Trigger</Text>
                              </div>
                            }
                            key="trigger_simulation"
                          >
                            <Card size="small">
                              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                                <Descriptions.Item label="Tổng số lần vi phạm">
                                  <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
                                    {analysis.raw_output.trigger_simulation.total_historical_breaches || 0}
                                  </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Đánh giá độ nhạy">
                                  <Tag
                                    color={
                                      analysis.raw_output.trigger_simulation.sensitivity_assessment?.includes('Too Tight')
                                        ? 'red'
                                        : analysis.raw_output.trigger_simulation.sensitivity_assessment?.includes(
                                            'Balanced'
                                          )
                                          ? 'green'
                                          : 'orange'
                                    }
                                  >
                                    {analysis.raw_output.trigger_simulation.sensitivity_assessment}
                                  </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Phân tích logic" span={2}>
                                  <Paragraph style={{ fontSize: '12px', marginBottom: 0 }}>
                                    {analysis.raw_output.trigger_simulation.logic_analysis}
                                  </Paragraph>
                                </Descriptions.Item>
                              </Descriptions>
                              {analysis.raw_output.trigger_simulation.breach_details &&
                                analysis.raw_output.trigger_simulation.breach_details.length > 0 && (
                                  <div className="mt-4">
                                    <Text strong style={{ fontSize: '13px' }}>Chi tiết vi phạm</Text>
                                    <List
                                      size="small"
                                      dataSource={analysis.raw_output.trigger_simulation.breach_details}
                                      renderItem={(breach) => (
                                        <List.Item>
                                          <Text style={{ fontSize: '12px' }}>{JSON.stringify(breach)}</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </div>
                                )}
                            </Card>
                          </Panel>
                        )}

                        {/* Farm Characteristics Analysis */}
                        {analysis.raw_output.farm_characteristics_analysis && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <BarChartOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                                <Text strong style={{ fontSize: '14px' }}>Phân tích đặc điểm trang trại</Text>
                              </div>
                            }
                            key="farm_characteristics"
                          >
                            <Space direction="vertical" size="small" className="w-full">
                              {Object.entries(analysis.raw_output.farm_characteristics_analysis)
                                .filter(([key]) => key !== 'weighted_score')
                                .map(([key, value]) => (
                                  <Card key={key} size="small" type="inner">
                                    <div className="flex justify-between items-start mb-2">
                                      <Text strong style={{ fontSize: '13px' }}>
                                        {getFarmCharacteristicText(key)}
                                      </Text>
                                      <div className="text-right">
                                        <Text strong style={{ fontSize: '16px', color: getScoreColor(value.score) }}>
                                          {value.score}
                                        </Text>
                                        <Text type="secondary">/100</Text>
                                      </div>
                                    </div>
                                    <Progress
                                      percent={value.score}
                                      showInfo={false}
                                      strokeColor={getScoreColor(value.score)}
                                      size="small"
                                    />
                                    <Paragraph
                                      type="secondary"
                                      style={{ fontSize: '12px', marginTop: 8, marginBottom: 0 }}
                                    >
                                      {value.notes}
                                    </Paragraph>
                                  </Card>
                                ))}
                              <Divider style={{ margin: '12px 0' }} />
                              <div className="flex justify-between items-center">
                                <Text strong>Điểm trọng số tổng hợp</Text>
                                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                  {analysis.raw_output.farm_characteristics_analysis.weighted_score}
                                </Text>
                              </div>
                            </Space>
                          </Panel>
                        )}

                        {/* Historical Performance Analysis */}
                        {analysis.raw_output.historical_performance_analysis && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <BarChartOutlined style={{ fontSize: '16px', color: '#13c2c2' }} />
                                <Text strong style={{ fontSize: '14px' }}>Phân tích hiệu suất lịch sử</Text>
                              </div>
                            }
                            key="historical_performance"
                          >
                            <Space direction="vertical" size="middle" className="w-full">
                              {/* Data Quality Assessment */}
                              {analysis.raw_output.historical_performance_analysis.data_quality_assessment && (
                                <Card size="small" type="inner">
                                  <Text strong style={{ fontSize: '13px' }}>Đánh giá chất lượng dữ liệu</Text>
                                  <Descriptions column={{ xs: 1, sm: 2 }} size="small" style={{ marginTop: 8 }}>
                                    <Descriptions.Item label="Dữ liệu khả dụng">
                                      <Progress
                                        percent={
                                          analysis.raw_output.historical_performance_analysis.data_quality_assessment
                                            .usable_data_percentage
                                        }
                                        size="small"
                                        status={
                                          analysis.raw_output.historical_performance_analysis.data_quality_assessment
                                            .usable_data_percentage > 60
                                            ? 'success'
                                            : analysis.raw_output.historical_performance_analysis.data_quality_assessment
                                                  .usable_data_percentage > 30
                                              ? 'normal'
                                              : 'exception'
                                        }
                                      />
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Chất lượng kém">
                                      <Text
                                        strong
                                        style={{
                                          color:
                                            analysis.raw_output.historical_performance_analysis.data_quality_assessment
                                              .poor_quality_percentage > 50
                                              ? '#ff4d4f'
                                              : '#faad14'
                                        }}
                                      >
                                        {
                                          analysis.raw_output.historical_performance_analysis.data_quality_assessment
                                            .poor_quality_percentage
                                        }
                                        %
                                      </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Độ phủ mây TB">
                                      <Text>
                                        {analysis.raw_output.historical_performance_analysis.data_quality_assessment.average_cloud_cover?.toFixed(
                                          1
                                        )}
                                        %
                                      </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ghi chú" span={2}>
                                      <Paragraph style={{ fontSize: '12px', marginBottom: 0 }}>
                                        {
                                          analysis.raw_output.historical_performance_analysis.data_quality_assessment
                                            .notes
                                        }
                                      </Paragraph>
                                    </Descriptions.Item>
                                  </Descriptions>
                                </Card>
                              )}

                              {/* Parameter Analysis */}
                              {analysis.raw_output.historical_performance_analysis.parameter_analysis &&
                                analysis.raw_output.historical_performance_analysis.parameter_analysis.length > 0 && (
                                  <Card size="small" type="inner">
                                    <Text strong style={{ fontSize: '13px' }}>Phân tích tham số</Text>
                                    <Space direction="vertical" size="small" className="w-full" style={{ marginTop: 8 }}>
                                      {analysis.raw_output.historical_performance_analysis.parameter_analysis.map(
                                        (param) => (
                                          <div key={param.parameter}>
                                            <Text strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                                              {param.parameter}
                                            </Text>
                                            <Descriptions column={{ xs: 2, sm: 4 }} size="small" style={{ marginTop: 4 }}>
                                              <Descriptions.Item label="Min">
                                                <Text style={{ fontSize: '11px' }}>{param.min?.toFixed(3)}</Text>
                                              </Descriptions.Item>
                                              <Descriptions.Item label="Max">
                                                <Text style={{ fontSize: '11px' }}>{param.max?.toFixed(3)}</Text>
                                              </Descriptions.Item>
                                              <Descriptions.Item label="Mean">
                                                <Text style={{ fontSize: '11px' }}>{param.mean?.toFixed(3)}</Text>
                                              </Descriptions.Item>
                                              <Descriptions.Item label="Median">
                                                <Text style={{ fontSize: '11px' }}>{param.median?.toFixed(3)}</Text>
                                              </Descriptions.Item>
                                            </Descriptions>
                                            {param.notes && (
                                              <Paragraph
                                                type="secondary"
                                                style={{ fontSize: '11px', marginTop: 4, marginBottom: 0 }}
                                              >
                                                {param.notes}
                                              </Paragraph>
                                            )}
                                            <Divider style={{ margin: '8px 0' }} />
                                          </div>
                                        )
                                      )}
                                    </Space>
                                  </Card>
                                )}
                            </Space>
                          </Panel>
                        )}

                        {/* Fraud Analysis */}
                        {analysis.raw_output.fraud_analysis && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <BugOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />
                                <Text strong style={{ fontSize: '14px' }}>Phân tích gian lận</Text>
                                <Tag color="red">
                                  {analysis.raw_output.fraud_analysis.total_fraud_score} điểm
                                </Tag>
                              </div>
                            }
                            key="fraud_analysis"
                          >
                            <Card size="small">
                              <div className="flex justify-between items-center mb-3">
                                <Text strong>Mức độ rủi ro gian lận</Text>
                                <Tag
                                  color={
                                    analysis.raw_output.fraud_analysis.fraud_risk_level === 'critical'
                                      ? 'red'
                                      : analysis.raw_output.fraud_analysis.fraud_risk_level === 'high'
                                        ? 'orange'
                                        : 'green'
                                  }
                                  style={{ fontSize: '13px', fontWeight: 500 }}
                                >
                                  {getRiskLevelText(analysis.raw_output.fraud_analysis.fraud_risk_level)}
                                </Tag>
                              </div>
                              {analysis.raw_output.fraud_analysis.indicators_found &&
                                analysis.raw_output.fraud_analysis.indicators_found.length > 0 && (
                                  <div>
                                    <Text strong style={{ fontSize: '13px' }}>Dấu hiệu phát hiện</Text>
                                    <List
                                      size="small"
                                      dataSource={analysis.raw_output.fraud_analysis.indicators_found}
                                      renderItem={(indicator) => (
                                        <List.Item>
                                          <Text style={{ fontSize: '12px' }}>• {indicator}</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </div>
                                )}
                            </Card>
                          </Panel>
                        )}

                        {/* Photo Analysis */}
                        {analysis.raw_output.photo_analysis && (
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <FileTextOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                                <Text strong style={{ fontSize: '14px' }}>Phân tích ảnh</Text>
                              </div>
                            }
                            key="photo_analysis"
                          >
                            <Card size="small">
                              <Paragraph style={{ fontSize: '12px' }}>
                                {analysis.raw_output.photo_analysis.summary}
                              </Paragraph>
                              {analysis.raw_output.photo_analysis.inconsistencies &&
                                analysis.raw_output.photo_analysis.inconsistencies.length > 0 && (
                                  <div className="mt-3">
                                    <Text strong style={{ fontSize: '13px', color: '#ff4d4f' }}>
                                      Sự mâu thuẫn
                                    </Text>
                                    <List
                                      size="small"
                                      dataSource={analysis.raw_output.photo_analysis.inconsistencies}
                                      renderItem={(inconsistency) => (
                                        <List.Item>
                                          <Text style={{ fontSize: '12px' }}>{inconsistency}</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </div>
                                )}
                            </Card>
                          </Panel>
                        )}

                        {/* Raw Output Debug Panel */}
                        <Panel
                          header={
                            <div className="flex items-center gap-2">
                              <CodeOutlined style={{ fontSize: '16px', color: '#8c8c8c' }} />
                              <Text strong style={{ fontSize: '14px' }}>Dữ liệu thô (Debug)</Text>
                              <Tag color="default">JSON</Tag>
                            </div>
                          }
                          key="raw_output_debug"
                        >
                          <Card size="small" style={{ backgroundColor: '#1f1f1f' }}>
                            <pre style={{
                              fontSize: '11px',
                              color: '#d4d4d4',
                              margin: 0,
                              maxHeight: '400px',
                              overflow: 'auto',
                              fontFamily: 'Monaco, Consolas, monospace'
                            }}>
                              {JSON.stringify(analysis.raw_output, null, 2)}
                            </pre>
                          </Card>
                        </Panel>
                      </Collapse>
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
