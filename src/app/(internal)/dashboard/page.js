"use client";

import { usePartnerDashboard } from "@/services/hooks/dashboard";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  ClearOutlined,
  DollarOutlined,
  FilterOutlined,
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
  Collapse,
  DatePicker,
  Empty,
  Layout,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { Chart as ChartJS, registerables } from "chart.js";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./dashboard.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Register Chart.js components
ChartJS.register(...registerables);

// Set dayjs locale to Vietnamese
dayjs.locale("vi");

export default function DashboardPage() {
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

  // Handle clear filters - reset to default 30 days
  const handleClearFilters = () => {
    dashboard.resetFiltersToDefault();
    // Update UI date range to match
    const now = dayjs();
    const thirtyDaysAgo = now.subtract(30, "day");
    setDateRange([thirtyDaysAgo, now]);
  };

  // Loading state
  if (dashboard.loading && !dashboard.data) {
    return (
      <Layout.Content className="dashboard-content">
        <div className="dashboard-loading">
          <Spin size="large" tip="Đang tải dữ liệu tổng quan..." />
        </div>
      </Layout.Content>
    );
  }

  // Error state
  if (dashboard.error) {
    return (
      <Layout.Content className="dashboard-content">
        <Card>
          <Empty
            description={
              <Space direction="vertical" align="center" size="large">
                <Text type="danger" strong style={{ fontSize: 16 }}>
                  Không thể tải dữ liệu dashboard
                </Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {dashboard.error}
                </Text>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                  >
                    Thử lại
                  </Button>
                  <Button
                    type="default"
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                  >
                    Đặt lại bộ lọc
                  </Button>
                </Space>
              </Space>
            }
          />
        </Card>
      </Layout.Content>
    );
  }

  const data = dashboard.data;

  // No data state
  if (!data) {
    return (
      <Layout.Content className="dashboard-content">
        <Card>
          <Empty description="Không có dữ liệu để hiển thị" />
        </Card>
      </Layout.Content>
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

  // Calculate metrics
  const netIncome = data?.financial_summary?.net_income || 0;
  const profitMargin = data?.financial_summary?.profit_margin_percent || 0;
  const isProfit = netIncome > 0;
  const totalPremium = data?.financial_summary?.total_premium || 0;
  const totalPayout = data?.financial_summary?.total_payout || 0;
  const totalDataCost = data?.financial_summary?.total_data_cost || 0;

  // Growth indicator for summary card
  const growthIndicator = {
    isPositive: isProfit,
    color: isProfit ? "#52c41a" : "#ff4d4f",
    text: `${profitMargin.toFixed(2)}%`,
  };

  // Financial Summary Doughnut Chart
  const financialSummaryChart = {
    labels: ["Phí bảo hiểm", "Chi trả bồi thường", "Chi phí dữ liệu"],
    datasets: [
      {
        data: [totalPremium, totalPayout, totalDataCost],
        backgroundColor: ["#a5d7be", "#ffccc7", "#d3adf7"],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 10,
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
          labels: data.monthly_loss_ratio_trend.map((item) =>
            formatMonth(item.month)
          ),
          datasets: [
            {
              label: "Tỷ lệ tổn thất (%)",
              data: data.monthly_loss_ratio_trend.map(
                (item) => item.loss_ratio_percent || 0
              ),
              borderColor: "#ff7875",
              backgroundColor: "rgba(255, 120, 117, 0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 4,
            },
          ],
        }
      : null;

  // Premium Growth MoM Chart
  const premiumGrowthMoMChart =
    data?.premium_growth_mom && data.premium_growth_mom.length > 0
      ? {
          labels: data.premium_growth_mom.map((item) =>
            formatMonth(item.month)
          ),
          datasets: [
            {
              label: "Tháng hiện tại",
              data: data.premium_growth_mom.map(
                (item) => item.current_month_premium || 0
              ),
              backgroundColor: "#a5d7be",
              borderWidth: 0,
              borderRadius: 4,
            },
            {
              label: "Tháng trước",
              data: data.premium_growth_mom.map(
                (item) => item.previous_month_premium || 0
              ),
              backgroundColor: "#91d5ff",
              borderWidth: 0,
              borderRadius: 4,
            },
          ],
        }
      : null;

  // Growth Rate Chart (YoY)
  const growthRateYoYChart =
    data?.premium_growth_yoy && data.premium_growth_yoy.length > 0
      ? {
          labels: data.premium_growth_yoy.map((item) =>
            formatMonth(item.month)
          ),
          datasets: [
            {
              label: "Tăng trưởng YoY (%)",
              data: data.premium_growth_yoy.map((item) => {
                const rate = item.yoy_growth_rate_percent;
                return rate !== null && rate !== undefined ? rate : 0;
              }),
              backgroundColor: data.premium_growth_yoy.map((item) => {
                const rate = item.yoy_growth_rate_percent;
                if (rate === null || rate === undefined) return "#91d5ff";
                return rate >= 0 ? "#95de64" : "#ff7875";
              }),
              borderWidth: 0,
              borderRadius: 4,
            },
          ],
        }
      : null;

  // Payout Per Claim Trend Chart
  const payoutPerClaimChart =
    data?.monthly_payout_per_claim_trend &&
    data.monthly_payout_per_claim_trend.length > 0
      ? {
          labels: data.monthly_payout_per_claim_trend.map((item) =>
            formatMonth(item.month)
          ),
          datasets: [
            {
              label: "Chi trả TB mỗi bồi thường",
              data: data.monthly_payout_per_claim_trend.map(
                (item) => item.avg_payout_per_claim || 0
              ),
              borderColor: "#18573f",
              backgroundColor: "rgba(165, 215, 190, 0.1)",
              fill: true,
              tension: 0.3,
              yAxisID: "y",
            },
            {
              label: "Số lượng bồi thường",
              data: data.monthly_payout_per_claim_trend.map(
                (item) => item.total_paid_claims || 0
              ),
              borderColor: "#faad14",
              backgroundColor: "rgba(250, 173, 20, 0.1)",
              fill: true,
              tension: 0.3,
              yAxisID: "y1",
            },
          ],
        }
      : null;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 12 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          callback: (value) => dashboard.formatCompactNumber(value) + " ₫",
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const dualAxisOptions = {
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
          padding: 10,
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
    <Layout.Content className="dashboard-content">
      <div className="dashboard-space">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <Title level={2} className="dashboard-title">
              Tổng quan đối tác
            </Title>
            <Text className="dashboard-subtitle">
              Thống kê tài chính và hiệu suất kinh doanh bảo hiểm
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            type="default"
            size="large"
            loading={dashboard.loading}
          >
            Làm mới
          </Button>
        </div>

        {/* Filter Section with Collapse */}
        <Card className="dashboard-filter-card">
          <Collapse
            defaultActiveKey={["1"]}
            ghost
            items={[
              {
                key: "1",
                label: (
                  <Space>
                    <FilterOutlined
                      style={{ fontSize: 16, color: "#18573f" }}
                    />
                    <Text strong style={{ fontSize: 15 }}>
                      Bộ lọc dữ liệu
                    </Text>
                    {dateRange && dateRange[0] && dateRange[1] && (
                      <Tag color="blue">
                        {dateRange[1].diff(dateRange[0], "day")} ngày
                      </Tag>
                    )}
                  </Space>
                ),
                children: (
                  <div className="dashboard-filter-form">
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} sm={12} md={8}>
                        <Space direction="vertical" size="small" className="w-full">
                          <Text type="secondary" className="text-xs">
                            Khoảng thời gian
                          </Text>
                          <RangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            format="DD/MM/YYYY"
                            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                            style={{ width: "100%" }}
                          />
                        </Space>
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <Space direction="vertical" size="small">
                          <Text type="secondary" className="text-xs">
                            &nbsp;
                          </Text>
                          <Space>
                            <Button
                              type="dashed"
                              icon={<ClearOutlined />}
                              onClick={handleClearFilters}
                            >
                              Đặt lại
                            </Button>
                          </Space>
                        </Space>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Summary Cards with Icons */}
        <div className="dashboard-summary-row">
          <Tooltip title="Tổng phí bảo hiểm thu được từ nông dân trong khoảng thời gian đã chọn">
            <div className="dashboard-summary-card-compact">
              <div className="dashboard-summary-icon total">
                <WalletOutlined />
              </div>
              <div className="dashboard-summary-content">
                <div className="dashboard-summary-value-compact">
                  {dashboard.formatCurrency(totalPremium)}
                </div>
                <div className="dashboard-summary-label-compact">
                  Tổng phí bảo hiểm
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Tổng tiền chi trả bồi thường cho nông dân khi có thiệt hại">
            <div className="dashboard-summary-card-compact">
              <div className="dashboard-summary-icon warning">
                <DollarOutlined />
              </div>
              <div className="dashboard-summary-content">
                <div className="dashboard-summary-value-compact">
                  {dashboard.formatCurrency(totalPayout)}
                </div>
                <div className="dashboard-summary-label-compact">
                  Tổng chi trả
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Chi phí sử dụng dữ liệu vệ tinh, thời tiết và phân tích">
            <div className="dashboard-summary-card-compact">
              <div className="dashboard-summary-icon pending">
                <LineChartOutlined />
              </div>
              <div className="dashboard-summary-content">
                <div className="dashboard-summary-value-compact">
                  {dashboard.formatCurrency(totalDataCost)}
                </div>
                <div className="dashboard-summary-label-compact">
                  Chi phí dữ liệu
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip
            title={
              isProfit
                ? "Lợi nhuận ròng dương - kinh doanh hiệu quả"
                : "Lợi nhuận ròng âm - cần xem xét lại chiến lược"
            }
          >
            <div className="dashboard-summary-card-compact">
              <div
                className={`dashboard-summary-icon ${
                  isProfit ? "active" : "warning"
                }`}
              >
                {isProfit ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              </div>
              <div className="dashboard-summary-content">
                <div
                  className="dashboard-summary-value-compact"
                  style={{ color: growthIndicator.color }}
                >
                  {dashboard.formatCurrency(netIncome)}
                </div>
                <div className="dashboard-summary-label-compact">
                  Lợi nhuận ròng
                </div>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Phí đã thu"
                value={data?.total_premium_collected || 0}
                valueStyle={{ color: "#18573f", fontSize: 20 }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Từ nông dân
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Đã chi trả"
                value={data?.total_payout_disbursed || 0}
                valueStyle={{ color: "#ff4d4f", fontSize: 20 }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cho nông dân
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Phí TB mỗi đơn"
                value={data?.average_premium_per_policy || 0}
                valueStyle={{ fontSize: 20, color: "#18573f" }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Trung bình
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Tỷ suất lợi nhuận"
                value={profitMargin}
                precision={2}
                valueStyle={{
                  color: isProfit ? "#52c41a" : "#ff4d4f",
                  fontSize: 20,
                }}
                suffix="%"
                prefix={<RiseOutlined />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Profit Margin
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Secondary Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card className="dashboard-card">
              <Statistic
                title="Phí nợ"
                value={data?.outstanding_premium || 0}
                valueStyle={{ fontSize: 18, color: "#faad14" }}
                formatter={(value) => dashboard.formatCurrency(value)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chưa thanh toán
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="dashboard-card">
              <Statistic
                title="Tỷ lệ tổn thất"
                value={
                  data?.monthly_loss_ratio_trend &&
                  data.monthly_loss_ratio_trend.length > 0
                    ? data.monthly_loss_ratio_trend[0].loss_ratio_percent
                    : 0
                }
                precision={2}
                suffix="%"
                valueStyle={{ fontSize: 18, color: "#ff4d4f" }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hiện tại
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="dashboard-card">
              <Statistic
                title="Số bồi thường"
                value={
                  data?.monthly_payout_per_claim_trend &&
                  data.monthly_payout_per_claim_trend.length > 0
                    ? data.monthly_payout_per_claim_trend[0].total_paid_claims
                    : 0
                }
                valueStyle={{ fontSize: 18, color: "#722ed1" }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đã xử lý
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <PieChartOutlined style={{ color: "#18573f" }} />
                  <span>Phân bổ tài chính</span>
                </Space>
              }
            >
              <div style={{ height: 280 }}>
                <Doughnut
                  data={financialSummaryChart}
                  options={doughnutOptions}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <LineChartOutlined style={{ color: "#18573f" }} />
                  <span>Xu hướng tỷ lệ tổn thất</span>
                </Space>
              }
              extra={<Tag color="error">Tháng gần đây</Tag>}
            >
              {lossRatioChart ? (
                <div style={{ height: 280 }}>
                  <Line data={lossRatioChart} options={lineChartOptions} />
                </div>
              ) : (
                <Empty
                  description="Không có dữ liệu"
                  style={{ padding: "40px 0" }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <RiseOutlined style={{ color: "#18573f" }} />
                  <span>So sánh phí theo tháng</span>
                </Space>
              }
              extra={<Tag color="processing">Tháng/Tháng</Tag>}
            >
              {premiumGrowthMoMChart ? (
                <div style={{ height: 280 }}>
                  <Bar data={premiumGrowthMoMChart} options={barChartOptions} />
                </div>
              ) : (
                <Empty
                  description="Không có dữ liệu"
                  style={{ padding: "40px 0" }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <RiseOutlined style={{ color: "#18573f" }} />
                  <span>Tăng trưởng theo năm</span>
                </Space>
              }
              extra={<Tag color="success">Năm/Năm</Tag>}
            >
              {growthRateYoYChart ? (
                <div style={{ height: 280 }}>
                  <Bar data={growthRateYoYChart} options={barChartOptions} />
                </div>
              ) : (
                <Empty
                  description="Không có dữ liệu"
                  style={{ padding: "40px 0" }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts Row 3 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <LineChartOutlined style={{ color: "#18573f" }} />
                  <span>Xu hướng chi trả bồi thường</span>
                </Space>
              }
              extra={<Tag color="purple">Theo tháng</Tag>}
            >
              {payoutPerClaimChart ? (
                <div style={{ height: 280 }}>
                  <Line data={payoutPerClaimChart} options={dualAxisOptions} />
                </div>
              ) : (
                <Empty
                  description="Không có dữ liệu"
                  style={{ padding: "40px 0" }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Layout.Content>
  );
}
