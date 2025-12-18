"use client";

import { usePartnerDashboard } from "@/services/hooks/dashboard";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  DollarOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  RiseOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { Chart as ChartJS, registerables } from "chart.js";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Register Chart.js components
ChartJS.register(...registerables);

// Set dayjs locale to Vietnamese
dayjs.locale("vi");

export default function PartnerDashboardPage() {
  const dashboard = usePartnerDashboard();

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    if (dashboard.filters.start_date && dashboard.filters.end_date) {
      return [
        dayjs.unix(dashboard.filters.start_date),
        dayjs.unix(dashboard.filters.end_date),
      ];
    }
    return [dayjs().subtract(30, "day"), dayjs()];
  });

  // Sync initial dateRange with hook filters
  useEffect(() => {
    if (dashboard.filters.start_date && dashboard.filters.end_date) {
      setDateRange([
        dayjs.unix(dashboard.filters.start_date),
        dayjs.unix(dashboard.filters.end_date),
      ]);
    }
  }, [dashboard.filters.start_date, dashboard.filters.end_date]);

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      dashboard.updateFilters({
        start_date: dates[0].unix(),
        end_date: dates[1].unix(),
      });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    dashboard.refetch();
  };

  // Loading state
  if (dashboard.loading && !dashboard.data) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh", background: "#f0f2f5" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
        </div>
      </div>
    );
  }

  // Error state
  if (dashboard.error) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh", background: "#f0f2f5" }}>
        <Card>
          <Empty
            description={
              <Space direction="vertical" align="center">
                <Text type="danger" strong>
                  {dashboard.error}
                </Text>
                <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh}>
                  Thử lại
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  const data = dashboard.data;

  // No data state
  if (!data) {
    return (
      <div style={{ padding: "24px", minHeight: "100vh", background: "#f0f2f5" }}>
        <Card>
          <Empty description="Không có dữ liệu để hiển thị" />
        </Card>
      </div>
    );
  }

  // Helper function to format month
  const formatMonth = (monthStr) => {
    try {
      const date = dayjs(monthStr);
      return date.format("MM/YYYY");
    } catch (error) {
      return monthStr;
    }
  };

  // Calculate growth indicators
  const netIncome = data?.financial_summary?.net_income || 0;
  const profitMargin = data?.financial_summary?.profit_margin_percent || 0;
  const isProfit = netIncome > 0;

  // Chart configurations
  const chartColors = {
    primary: "#18573f",
    success: "#52c41a",
    warning: "#faad14",
    danger: "#ff4d4f",
    info: "#1890ff",
    purple: "#722ed1",
  };

  // Financial Summary Doughnut Chart
  const financialSummaryChart =
    data?.financial_summary
      ? {
          labels: ["Tổng phí bảo hiểm", "Tổng chi trả", "Chi phí dữ liệu"],
          datasets: [
            {
              data: [
                data.financial_summary.total_premium || 0,
                data.financial_summary.total_payout || 0,
                data.financial_summary.total_data_cost || 0,
              ],
              backgroundColor: [
                `${chartColors.primary}DD`,
                `${chartColors.danger}DD`,
                `${chartColors.purple}DD`,
              ],
              borderColor: [chartColors.primary, chartColors.danger, chartColors.purple],
              borderWidth: 2,
            },
          ],
        }
      : null;

  const financialSummaryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = dashboard.formatCurrency(context.parsed);
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  // Loss Ratio Trend Chart
  const lossRatioChart =
    data?.monthly_loss_ratio_trend && data.monthly_loss_ratio_trend.length > 0
      ? {
          labels: data.monthly_loss_ratio_trend.map((item) => formatMonth(item.month)),
          datasets: [
            {
              label: "Tỷ lệ tổn thất (%)",
              data: data.monthly_loss_ratio_trend.map((item) => item.loss_ratio_percent || 0),
              borderColor: chartColors.danger,
              backgroundColor: `${chartColors.danger}20`,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        }
      : null;

  const lossRatioOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Tỷ lệ tổn thất: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  // Premium Growth MoM Chart
  const premiumGrowthMoMChart =
    data?.premium_growth_mom && data.premium_growth_mom.length > 0
      ? {
          labels: data.premium_growth_mom.map((item) => formatMonth(item.month)),
          datasets: [
            {
              label: "Tăng trưởng MoM (%)",
              data: data.premium_growth_mom.map((item) => item.mom_growth_rate_percent ?? 0),
              backgroundColor: data.premium_growth_mom.map((item) =>
                (item.mom_growth_rate_percent ?? 0) >= 0
                  ? `${chartColors.success}CC`
                  : `${chartColors.danger}CC`
              ),
              borderColor: data.premium_growth_mom.map((item) =>
                (item.mom_growth_rate_percent ?? 0) >= 0 ? chartColors.success : chartColors.danger
              ),
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        }
      : null;

  const growthChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Tăng trưởng: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  // Premium Growth YoY Chart
  const premiumGrowthYoYChart =
    data?.premium_growth_yoy && data.premium_growth_yoy.length > 0
      ? {
          labels: data.premium_growth_yoy.map((item) => formatMonth(item.month)),
          datasets: [
            {
              label: "Tăng trưởng YoY (%)",
              data: data.premium_growth_yoy.map((item) => item.yoy_growth_rate_percent ?? 0),
              backgroundColor: data.premium_growth_yoy.map((item) =>
                (item.yoy_growth_rate_percent ?? 0) >= 0
                  ? `${chartColors.primary}CC`
                  : `${chartColors.danger}CC`
              ),
              borderColor: data.premium_growth_yoy.map((item) =>
                (item.yoy_growth_rate_percent ?? 0) >= 0 ? chartColors.primary : chartColors.danger
              ),
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        }
      : null;

  // Payout Per Claim Trend Chart
  const payoutPerClaimChart =
    data?.monthly_payout_per_claim_trend && data.monthly_payout_per_claim_trend.length > 0
      ? {
          labels: data.monthly_payout_per_claim_trend.map((item) => formatMonth(item.month)),
          datasets: [
            {
              label: "Chi trả TB/khiếu nại",
              data: data.monthly_payout_per_claim_trend.map((item) => item.avg_payout_per_claim || 0),
              borderColor: chartColors.primary,
              backgroundColor: `${chartColors.primary}20`,
              fill: true,
              tension: 0.4,
              yAxisID: "y",
            },
            {
              label: "Số khiếu nại",
              data: data.monthly_payout_per_claim_trend.map((item) => item.total_paid_claims || 0),
              borderColor: chartColors.warning,
              backgroundColor: `${chartColors.warning}20`,
              fill: true,
              tension: 0.4,
              yAxisID: "y1",
            },
          ],
        }
      : null;

  const payoutPerClaimOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.datasetIndex === 0) {
              return `Chi trả TB: ${dashboard.formatCurrency(context.parsed.y)}`;
            }
            return `Số khiếu nại: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        ticks: {
          callback: (value) => dashboard.formatCompactNumber(value) + " ₫",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "#f0f2f5" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Space direction="vertical" size={0}>
                <Title level={2} style={{ margin: 0, color: chartColors.primary }}>
                  Dashboard Đối tác Bảo hiểm
                </Title>
                <Text type="secondary">Tổng quan tài chính và hiệu suất kinh doanh</Text>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={dashboard.loading}
                size="large"
                style={{ background: chartColors.primary, borderColor: chartColors.primary }}
              >
                Làm mới
              </Button>
            </Col>
          </Row>
        </div>

        {/* Filter Section */}
        <Card
          style={{ marginBottom: 24, borderRadius: 8 }}
          bodyStyle={{ padding: "16px 24px" }}
        >
          <Row gutter={16} align="middle">
            <Col>
              <Space>
                <CalendarOutlined style={{ fontSize: 18, color: chartColors.primary }} />
                <Text strong style={{ fontSize: 15 }}>
                  Khoảng thời gian:
                </Text>
              </Space>
            </Col>
            <Col flex="auto">
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                style={{ width: "100%", maxWidth: 360 }}
                size="large"
              />
            </Col>
            {dateRange && dateRange[0] && dateRange[1] && (
              <Col>
                <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                  {dateRange[1].diff(dateRange[0], "day")} ngày
                </Tag>
              </Col>
            )}
          </Row>
        </Card>

        {/* Main KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderTop: `4px solid ${chartColors.primary}`,
                borderRadius: 8,
                height: "100%",
              }}
            >
              <Statistic
                title={
                  <Space>
                    <WalletOutlined style={{ color: chartColors.primary }} />
                    <span>Tổng phí bảo hiểm</span>
                  </Space>
                }
                value={data?.total_premium_collected || 0}
                valueStyle={{ color: chartColors.primary, fontSize: 24, fontWeight: 600 }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Phí đã thu từ nông dân
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderTop: `4px solid ${chartColors.danger}`,
                borderRadius: 8,
                height: "100%",
              }}
            >
              <Statistic
                title={
                  <Space>
                    <DollarOutlined style={{ color: chartColors.danger }} />
                    <span>Tổng chi trả</span>
                  </Space>
                }
                value={data?.total_payout_disbursed || 0}
                valueStyle={{ color: chartColors.danger, fontSize: 24, fontWeight: 600 }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Đã chi trả cho nông dân
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderTop: `4px solid ${isProfit ? chartColors.success : chartColors.danger}`,
                borderRadius: 8,
                height: "100%",
              }}
            >
              <Statistic
                title={
                  <Space>
                    <RiseOutlined style={{ color: isProfit ? chartColors.success : chartColors.danger }} />
                    <span>Lợi nhuận ròng</span>
                  </Space>
                }
                value={netIncome}
                valueStyle={{
                  color: isProfit ? chartColors.success : chartColors.danger,
                  fontSize: 24,
                  fontWeight: 600,
                }}
                prefix={isProfit ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Phí - Chi trả - Chi phí dữ liệu
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{
                borderTop: `4px solid ${isProfit ? chartColors.success : chartColors.danger}`,
                borderRadius: 8,
                height: "100%",
              }}
            >
              <Statistic
                title={
                  <Space>
                    <PieChartOutlined style={{ color: isProfit ? chartColors.success : chartColors.danger }} />
                    <span>Tỷ lệ lợi nhuận</span>
                  </Space>
                }
                value={profitMargin}
                precision={2}
                valueStyle={{
                  color: isProfit ? chartColors.success : chartColors.danger,
                  fontSize: 24,
                  fontWeight: 600,
                }}
                suffix="%"
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tỷ suất lợi nhuận
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Secondary Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 8, height: "100%" }}>
              <Statistic
                title="Phí bảo hiểm TB/đơn"
                value={data?.average_premium_per_policy || 0}
                valueStyle={{ fontSize: 20, fontWeight: 600 }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 8, height: "100%" }}>
              <Statistic
                title="Phí bảo hiểm nợ"
                value={data?.outstanding_premium || 0}
                valueStyle={{ fontSize: 20, fontWeight: 600, color: chartColors.warning }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chưa thanh toán
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 8, height: "100%" }}>
              <Statistic
                title="Chi phí dữ liệu"
                value={data?.financial_summary?.total_data_cost || 0}
                valueStyle={{ fontSize: 20, fontWeight: 600, color: chartColors.purple }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Vệ tinh, thời tiết
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <PieChartOutlined style={{ color: chartColors.primary }} />
                  <span>Tổng quan tài chính</span>
                </Space>
              }
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}
            >
              {financialSummaryChart ? (
                <div style={{ height: 300 }}>
                  <Doughnut data={financialSummaryChart} options={financialSummaryOptions} />
                </div>
              ) : (
                <Empty description="Không có dữ liệu" style={{ padding: "40px 0" }} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <LineChartOutlined style={{ color: chartColors.danger }} />
                  <span>Xu hướng tỷ lệ tổn thất</span>
                </Space>
              }
              extra={<Tag color="error">Loss Ratio</Tag>}
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}
            >
              {lossRatioChart ? (
                <div style={{ height: 300 }}>
                  <Line data={lossRatioChart} options={lossRatioOptions} />
                </div>
              ) : (
                <Empty description="Không có dữ liệu" style={{ padding: "40px 0" }} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <RiseOutlined style={{ color: chartColors.success }} />
                  <span>Tăng trưởng phí bảo hiểm (MoM)</span>
                </Space>
              }
              extra={<Tag color="processing">Month-over-Month</Tag>}
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}
            >
              {premiumGrowthMoMChart ? (
                <div style={{ height: 300 }}>
                  <Bar data={premiumGrowthMoMChart} options={growthChartOptions} />
                </div>
              ) : (
                <Empty description="Không có dữ liệu" style={{ padding: "40px 0" }} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <RiseOutlined style={{ color: chartColors.primary }} />
                  <span>Tăng trưởng phí bảo hiểm (YoY)</span>
                </Space>
              }
              extra={<Tag color="success">Year-over-Year</Tag>}
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}
            >
              {premiumGrowthYoYChart ? (
                <div style={{ height: 300 }}>
                  <Bar data={premiumGrowthYoYChart} options={growthChartOptions} />
                </div>
              ) : (
                <Empty description="Không có dữ liệu" style={{ padding: "40px 0" }} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts Row 3 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <LineChartOutlined style={{ color: chartColors.primary }} />
                  <span>Xu hướng chi trả trung bình theo tháng</span>
                </Space>
              }
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: "24px" }}
            >
              {payoutPerClaimChart ? (
                <div style={{ height: 300 }}>
                  <Line data={payoutPerClaimChart} options={payoutPerClaimOptions} />
                </div>
              ) : (
                <Empty description="Không có dữ liệu" style={{ padding: "40px 0" }} />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
