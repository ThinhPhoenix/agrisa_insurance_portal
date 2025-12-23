"use client";

import CustomTable from "@/components/custom-table";
import { usePartnerDashboard } from "@/services/hooks/dashboard/use-fetch-dashboard";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  ClearOutlined,
  CompressOutlined,
  DollarOutlined,
  ExpandOutlined,
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
  Tag,
  Typography,
} from "antd";
import { Chart as ChartJS, registerables } from "chart.js";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
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

  // Quick date range presets
  const [activePreset, setActivePreset] = useState("30days");

  // Chart view preferences
  const [lossRatioChartType, setLossRatioChartType] = useState("line"); // line or bar
  const [payoutChartType, setPayoutChartType] = useState("line"); // line or bar
  const [momChartType, setMomChartType] = useState("bar"); // bar or line
  const [yoyChartType, setYoyChartType] = useState("bar"); // bar or line
  const [expandedChart, setExpandedChart] = useState(null); // tracks which chart is expanded

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
      setActivePreset("custom");
      dashboard.updateFilters({
        start_date: dates[0].unix(),
        end_date: dates[1].unix(),
      });
    }
  };

  // Handle quick preset selection
  const handlePresetChange = (preset) => {
    setActivePreset(preset);
    const now = dayjs();
    let start;

    switch (preset) {
      case "7days":
        start = now.subtract(7, "day");
        break;
      case "30days":
        start = now.subtract(30, "day");
        break;
      case "90days":
        start = now.subtract(90, "day");
        break;
      case "1year":
        start = now.subtract(1, "year");
        break;
      default:
        start = now.subtract(30, "day");
    }

    setDateRange([start, now]);
    dashboard.updateFilters({
      start_date: start.unix(),
      end_date: now.unix(),
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    dashboard.refetch();
  };

  // Handle refresh with default filters (for error recovery)
  const handleRefreshWithDefaults = () => {
    dashboard.resetFiltersToDefault();
    setActivePreset("30days");
    const now = dayjs();
    const thirtyDaysAgo = now.subtract(30, "day");
    setDateRange([thirtyDaysAgo, now]);
  };

  // Translate error messages to Vietnamese
  const translateError = (errorMessage) => {
    if (!errorMessage) return "Đã xảy ra lỗi không xác định";

    const errorMap = {
      "Failed to fetch dashboard data": "Không thể tải dữ liệu dashboard",
      "No data available": "Không có dữ liệu",
      "Network Error": "Lỗi kết nối mạng",
      "Request failed with status code 500":
        "Lỗi máy chủ (500) - Vui lòng thử lại sau",
      "Request failed with status code 404": "Không tìm thấy dữ liệu (404)",
      "Request failed with status code 403": "Không có quyền truy cập (403)",
      "Request failed with status code 401": "Phiên đăng nhập hết hạn (401)",
      timeout: "Hết thời gian chờ - Vui lòng thử lại",
    };

    // Check for exact match
    if (errorMap[errorMessage]) {
      return errorMap[errorMessage];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return value;
      }
    }

    // Return original message with prefix if no translation found
    return `Lỗi: ${errorMessage}`;
  };

  // Handle clear filters - reset to default 30 days
  const handleClearFilters = () => {
    dashboard.resetFiltersToDefault();
    setActivePreset("30days");
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
              <Space
                direction="vertical"
                align="center"
                size="large"
                style={{ padding: "40px 20px" }}
              >
                <Text type="danger" strong style={{ fontSize: 18 }}>
                  Không thể tải dữ liệu dashboard
                </Text>

                {/* Translated error message */}
                <Text type="danger" style={{ fontSize: 14 }}>
                  {translateError(dashboard.error)}
                </Text>

                {/* Action buttons */}
                <Space size="middle">
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleRefreshWithDefaults}
                    size="large"
                  >
                    Làm mới với giá trị mặc định
                  </Button>
                  <Button
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                  >
                    Thử lại với bộ lọc hiện tại
                  </Button>
                </Space>

                <Text
                  type="secondary"
                  style={{ fontSize: 12, fontStyle: "italic" }}
                >
                  Lưu ý: Bấm "Làm mới với giá trị mặc định" để reset về khoảng
                  30 ngày gần nhất
                </Text>
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

        {/* Filter Section with Quick Presets */}
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
                    <Row gutter={[16, 16]}>
                      {/* Quick Presets */}
                      <Col xs={24}>
                        <Space
                          direction="vertical"
                          size="small"
                          style={{ width: "100%" }}
                        >
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Chọn nhanh
                          </Text>
                          <Space wrap>
                            <Button
                              type={
                                activePreset === "7days" ? "primary" : "default"
                              }
                              onClick={() => handlePresetChange("7days")}
                              size="small"
                            >
                              7 ngày
                            </Button>
                            <Button
                              type={
                                activePreset === "30days"
                                  ? "primary"
                                  : "default"
                              }
                              onClick={() => handlePresetChange("30days")}
                              size="small"
                            >
                              30 ngày
                            </Button>
                            <Button
                              type={
                                activePreset === "90days"
                                  ? "primary"
                                  : "default"
                              }
                              onClick={() => handlePresetChange("90days")}
                              size="small"
                            >
                              90 ngày
                            </Button>
                            <Button
                              type={
                                activePreset === "1year" ? "primary" : "default"
                              }
                              onClick={() => handlePresetChange("1year")}
                              size="small"
                            >
                              1 năm
                            </Button>
                          </Space>
                        </Space>
                      </Col>

                      {/* Custom Date Range */}
                      <Col xs={24} sm={16} md={12} lg={8}>
                        <Space
                          direction="vertical"
                          size="small"
                          style={{ width: "100%" }}
                        >
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Hoặc chọn tùy chỉnh
                          </Text>
                          <RangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            format="DD/MM/YYYY"
                            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                            style={{ width: "100%" }}
                            disabledDate={(current) => {
                              // Không cho chọn ngày tương lai
                              return current && current > dayjs().endOf("day");
                            }}
                            allowClear={false}
                          />
                        </Space>
                      </Col>

                      <Col xs={24} sm={8} md={6} lg={4}>
                        <Space direction="vertical" size="small">
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            &nbsp;
                          </Text>
                          <Button
                            type="dashed"
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                            block
                          >
                            Đặt lại
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Hero Section - Net Income & Profit Margin */}
        <Card
          className="dashboard-card"
          style={{
            marginBottom: 24,
            background: isProfit
              ? "linear-gradient(135deg, #e8f5f0 0%, #ffffff 100%)"
              : "linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)",
          }}
        >
          <Row gutter={24} align="middle">
            <Col xs={24} md={12}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Lợi nhuận ròng trong kỳ
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: growthIndicator.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {dashboard.formatCurrency(netIncome)}
                  </div>
                  {isProfit ? (
                    <ArrowUpOutlined
                      style={{ fontSize: 32, color: "#52c41a" }}
                    />
                  ) : (
                    <ArrowDownOutlined
                      style={{ fontSize: 32, color: "#ff4d4f" }}
                    />
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  = Tổng phí thu - Chi trả - Chi phí dữ liệu
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ textAlign: "right" }}>
                <Space direction="vertical" size="small" align="end">
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    Tỷ suất lợi nhuận
                  </Text>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 700,
                      color: growthIndicator.color,
                      lineHeight: 1,
                    }}
                  >
                    {profitMargin.toFixed(1)}%
                  </div>
                  <Tag
                    color={
                      profitMargin > 50
                        ? "success"
                        : profitMargin > 20
                        ? "processing"
                        : profitMargin > 0
                        ? "warning"
                        : "error"
                    }
                    style={{ fontSize: 13, padding: "4px 12px" }}
                  >
                    {profitMargin > 50
                      ? "Xuất sắc"
                      : profitMargin > 20
                      ? "Tốt"
                      : profitMargin > 0
                      ? "Cần cải thiện"
                      : "Lỗ"}
                  </Tag>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Financial Flow - Visual Breakdown */}
        <Card
          className="dashboard-card"
          title={
            <Space>
              <PieChartOutlined style={{ color: "#18573f" }} />
              <span>Dòng tiền tài chính</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <WalletOutlined
                  style={{
                    fontSize: 32,
                    color: "#18573f",
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{ fontSize: 20, fontWeight: 600, color: "#18573f" }}
                >
                  {dashboard.formatCurrency(totalPremium)}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Phí bảo hiểm thu
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={1} style={{ textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 20 }}>
                −
              </Text>
            </Col>

            <Col xs={24} sm={5}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <DollarOutlined
                  style={{
                    fontSize: 28,
                    color: "#ff4d4f",
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#ff4d4f" }}
                >
                  {dashboard.formatCurrency(totalPayout)}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chi trả bồi thường
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={1} style={{ textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 20 }}>
                −
              </Text>
            </Col>

            <Col xs={24} sm={5}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <LineChartOutlined
                  style={{
                    fontSize: 28,
                    color: "#722ed1",
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#722ed1" }}
                >
                  {dashboard.formatCurrency(totalDataCost)}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chi phí dữ liệu
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={1} style={{ textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 20 }}>
                =
              </Text>
            </Col>

            <Col xs={24} sm={5}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                {isProfit ? (
                  <ArrowUpOutlined
                    style={{
                      fontSize: 28,
                      color: "#52c41a",
                      marginBottom: 8,
                    }}
                  />
                ) : (
                  <ArrowDownOutlined
                    style={{
                      fontSize: 28,
                      color: "#ff4d4f",
                      marginBottom: 8,
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: growthIndicator.color,
                  }}
                >
                  {dashboard.formatCurrency(netIncome)}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Lợi nhuận ròng
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Key Metrics Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} lg={4}>
            <Card className="dashboard-card" bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Phí đã thu
                </Text>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#18573f" }}
                >
                  {dashboard.formatCurrency(data?.total_premium_collected || 0)}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Từ nông dân
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <Card className="dashboard-card" bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Đã chi trả
                </Text>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#ff4d4f" }}
                >
                  {dashboard.formatCurrency(data?.total_payout_disbursed || 0)}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Bồi thường
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <Card className="dashboard-card" bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  TB mỗi đơn
                </Text>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#18573f" }}
                >
                  {dashboard.formatCurrency(
                    data?.average_premium_per_policy || 0
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Phí BH
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <Card className="dashboard-card" bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Phí nợ
                </Text>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#faad14" }}
                >
                  {dashboard.formatCurrency(data?.outstanding_premium || 0)}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Chưa thu
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <Card className="dashboard-card" bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tỷ lệ tổn thất
                </Text>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#ff4d4f" }}
                >
                  {data?.monthly_loss_ratio_trend &&
                  data.monthly_loss_ratio_trend.length > 0
                    ? `${data.monthly_loss_ratio_trend[0].loss_ratio_percent.toFixed(
                        1
                      )}%`
                    : "0%"}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Loss Ratio
                </Text>
              </Space>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <Card className="dashboard-card" bodyStyle={{ padding: 16 }}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Số chi trả
                </Text>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#722ed1" }}
                >
                  {data?.monthly_payout_per_claim_trend &&
                  data.monthly_payout_per_claim_trend.length > 0
                    ? data.monthly_payout_per_claim_trend[0].total_paid_claims
                    : 0}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Đã chi trả
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Charts Section - Organized by Category */}

        {/* Loss Ratio Analysis */}
        <Card
          className="dashboard-card"
          title={
            <Space>
              <LineChartOutlined style={{ color: "#18573f" }} />
              <span>Phân tích tỷ lệ tổn thất</span>
            </Space>
          }
          extra={
            <Space size="small">
              {lossRatioChart && (
                <Space size={0}>
                  <Button
                    size="small"
                    type={lossRatioChartType === "line" ? "primary" : "default"}
                    icon={<LineChartOutlined />}
                    onClick={() => setLossRatioChartType("line")}
                    style={{
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  />
                  <Button
                    size="small"
                    type={lossRatioChartType === "bar" ? "primary" : "default"}
                    icon={<BarChartOutlined />}
                    onClick={() => setLossRatioChartType("bar")}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      marginLeft: -1,
                    }}
                  />
                </Space>
              )}
              <Button
                size="small"
                icon={
                  expandedChart === "lossRatio" ? (
                    <CompressOutlined />
                  ) : (
                    <ExpandOutlined />
                  )
                }
                onClick={() =>
                  setExpandedChart(
                    expandedChart === "lossRatio" ? null : "lossRatio"
                  )
                }
                type={expandedChart === "lossRatio" ? "primary" : "default"}
              />
              <Tag
                color={
                  data?.monthly_loss_ratio_trend &&
                  data.monthly_loss_ratio_trend.length > 0
                    ? data.monthly_loss_ratio_trend[0].loss_ratio_percent < 30
                      ? "success"
                      : data.monthly_loss_ratio_trend[0].loss_ratio_percent < 60
                      ? "warning"
                      : "error"
                    : "default"
                }
              >
                {data?.monthly_loss_ratio_trend &&
                data.monthly_loss_ratio_trend.length > 0
                  ? data.monthly_loss_ratio_trend[0].loss_ratio_percent < 30
                    ? "Tốt"
                    : data.monthly_loss_ratio_trend[0].loss_ratio_percent < 60
                    ? "Trung bình"
                    : "Cần cải thiện"
                  : "Chưa có dữ liệu"}
              </Tag>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {lossRatioChart ? (
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 13, display: "block", marginBottom: 16 }}
              >
                Tỷ lệ chi trả trên tổng phí thu. Mức &lt; 30% là tốt, 30-60%
                trung bình, &gt; 60% cần xem xét lại.
              </Text>
              <div
                style={{
                  height: expandedChart === "lossRatio" ? 500 : 300,
                  transition: "height 0.3s ease",
                }}
              >
                {lossRatioChartType === "line" ? (
                  <Line
                    data={lossRatioChart}
                    options={{
                      ...lineChartOptions,
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            padding: 10,
                            font: { size: 12 },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return `${
                                context.dataset.label
                              }: ${context.parsed.y.toFixed(2)}%`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(0, 0, 0, 0.05)" },
                          ticks: {
                            callback: (value) => `${value}%`,
                          },
                        },
                        x: {
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                ) : (
                  <Bar
                    data={{
                      ...lossRatioChart,
                      datasets: lossRatioChart.datasets.map((dataset) => ({
                        ...dataset,
                        backgroundColor: "rgba(255, 120, 117, 0.6)",
                        borderColor: "#ff7875",
                        borderWidth: 1,
                        borderRadius: 4,
                      })),
                    }}
                    options={{
                      ...barChartOptions,
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            padding: 10,
                            font: { size: 12 },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return `${
                                context.dataset.label
                              }: ${context.parsed.y.toFixed(2)}%`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(0, 0, 0, 0.05)" },
                          ticks: {
                            callback: (value) => `${value}%`,
                          },
                        },
                        x: {
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <Empty
              description="Chưa có dữ liệu tỷ lệ tổn thất"
              style={{ padding: "60px 0" }}
            />
          )}
        </Card>

        {/* Premium Growth Analysis */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              className="dashboard-card"
              title={
                <Space>
                  <RiseOutlined style={{ color: "#18573f" }} />
                  <span>Tăng trưởng tháng/tháng</span>
                </Space>
              }
              extra={
                <Space size="small">
                  {premiumGrowthMoMChart &&
                    data?.premium_growth_mom &&
                    data.premium_growth_mom.length > 0 && (
                      <Space size={0}>
                        <Button
                          size="small"
                          type={momChartType === "bar" ? "primary" : "default"}
                          icon={<BarChartOutlined />}
                          onClick={() => setMomChartType("bar")}
                          style={{
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        />
                        <Button
                          size="small"
                          type={momChartType === "line" ? "primary" : "default"}
                          icon={<LineChartOutlined />}
                          onClick={() => setMomChartType("line")}
                          style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            marginLeft: -1,
                          }}
                        />
                      </Space>
                    )}
                  <Button
                    size="small"
                    icon={
                      expandedChart === "mom" ? (
                        <CompressOutlined />
                      ) : (
                        <ExpandOutlined />
                      )
                    }
                    onClick={() =>
                      setExpandedChart(expandedChart === "mom" ? null : "mom")
                    }
                    type={expandedChart === "mom" ? "primary" : "default"}
                  />
                  {data?.premium_growth_mom &&
                  data.premium_growth_mom.length > 0 &&
                  data.premium_growth_mom[0].mom_growth_rate_percent !==
                    null ? (
                    <Tag
                      color={
                        data.premium_growth_mom[0].mom_growth_rate_percent >= 5
                          ? "success"
                          : data.premium_growth_mom[0]
                              .mom_growth_rate_percent >= 0
                          ? "processing"
                          : "error"
                      }
                    >
                      {data.premium_growth_mom[0].mom_growth_rate_percent >= 0
                        ? "+"
                        : ""}
                      {data.premium_growth_mom[0].mom_growth_rate_percent.toFixed(
                        2
                      )}
                      %
                    </Tag>
                  ) : (
                    <Tag color="default">Chưa đủ dữ liệu</Tag>
                  )}
                </Space>
              }
            >
              {premiumGrowthMoMChart &&
              data?.premium_growth_mom &&
              data.premium_growth_mom.length > 0 ? (
                <div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 13, display: "block", marginBottom: 16 }}
                  >
                    So sánh phí bảo hiểm thu được giữa các tháng liên tiếp
                  </Text>
                  <div
                    style={{
                      height: expandedChart === "mom" ? 500 : 280,
                      transition: "height 0.3s ease",
                    }}
                  >
                    {momChartType === "bar" ? (
                      <Bar
                        data={premiumGrowthMoMChart}
                        options={barChartOptions}
                      />
                    ) : (
                      <Line
                        data={{
                          labels: premiumGrowthMoMChart.labels,
                          datasets: premiumGrowthMoMChart.datasets.map(
                            (dataset, index) => ({
                              ...dataset,
                              borderColor: index === 0 ? "#a5d7be" : "#91d5ff",
                              backgroundColor:
                                index === 0
                                  ? "rgba(165, 215, 190, 0.2)"
                                  : "rgba(145, 213, 255, 0.2)",
                              fill: true,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                            })
                          ),
                        }}
                        options={{
                          ...lineChartOptions,
                          plugins: {
                            legend: {
                              display: true,
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
                                callback: (value) =>
                                  dashboard.formatCompactNumber(value) + " ₫",
                              },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <Empty
                  description={
                    <Space direction="vertical" align="center">
                      <Text type="secondary">Cần ít nhất 2 tháng dữ liệu</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        để hiển thị tăng trưởng tháng/tháng
                      </Text>
                    </Space>
                  }
                  style={{ padding: "60px 0" }}
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
                  <span>Tăng trưởng năm/năm</span>
                </Space>
              }
              extra={
                <Space size="small">
                  {growthRateYoYChart &&
                    data?.premium_growth_yoy &&
                    data.premium_growth_yoy.length > 0 &&
                    data.premium_growth_yoy.some(
                      (item) => item.yoy_growth_rate_percent !== null
                    ) && (
                      <Space size={0}>
                        <Button
                          size="small"
                          type={yoyChartType === "bar" ? "primary" : "default"}
                          icon={<BarChartOutlined />}
                          onClick={() => setYoyChartType("bar")}
                          style={{
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        />
                        <Button
                          size="small"
                          type={yoyChartType === "line" ? "primary" : "default"}
                          icon={<LineChartOutlined />}
                          onClick={() => setYoyChartType("line")}
                          style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            marginLeft: -1,
                          }}
                        />
                      </Space>
                    )}
                  <Button
                    size="small"
                    icon={
                      expandedChart === "yoy" ? (
                        <CompressOutlined />
                      ) : (
                        <ExpandOutlined />
                      )
                    }
                    onClick={() =>
                      setExpandedChart(expandedChart === "yoy" ? null : "yoy")
                    }
                    type={expandedChart === "yoy" ? "primary" : "default"}
                  />
                  {data?.premium_growth_yoy &&
                  data.premium_growth_yoy.length > 0 &&
                  data.premium_growth_yoy[0].yoy_growth_rate_percent !==
                    null ? (
                    <Tag
                      color={
                        data.premium_growth_yoy[0].yoy_growth_rate_percent >= 15
                          ? "success"
                          : data.premium_growth_yoy[0]
                              .yoy_growth_rate_percent >= 0
                          ? "processing"
                          : "error"
                      }
                    >
                      {data.premium_growth_yoy[0].yoy_growth_rate_percent >= 0
                        ? "+"
                        : ""}
                      {data.premium_growth_yoy[0].yoy_growth_rate_percent.toFixed(
                        2
                      )}
                      %
                    </Tag>
                  ) : (
                    <Tag color="default">Chưa đủ dữ liệu</Tag>
                  )}
                </Space>
              }
            >
              {growthRateYoYChart &&
              data?.premium_growth_yoy &&
              data.premium_growth_yoy.length > 0 &&
              data.premium_growth_yoy.some(
                (item) => item.yoy_growth_rate_percent !== null
              ) ? (
                <div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 13, display: "block", marginBottom: 16 }}
                  >
                    So sánh với cùng kỳ năm trước, loại bỏ yếu tố mùa vụ
                  </Text>
                  <div
                    style={{
                      height: expandedChart === "yoy" ? 500 : 280,
                      transition: "height 0.3s ease",
                    }}
                  >
                    {yoyChartType === "bar" ? (
                      <Bar
                        data={growthRateYoYChart}
                        options={barChartOptions}
                      />
                    ) : (
                      <Line
                        data={{
                          labels: growthRateYoYChart.labels,
                          datasets: growthRateYoYChart.datasets.map(
                            (dataset) => ({
                              ...dataset,
                              borderColor:
                                dataset.backgroundColor.map((color) =>
                                  color === "#95de64" ? "#52c41a" : "#ff4d4f"
                                )[0] || "#52c41a",
                              backgroundColor: "rgba(82, 196, 26, 0.2)",
                              fill: true,
                              tension: 0.3,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                              pointBackgroundColor: dataset.backgroundColor,
                            })
                          ),
                        }}
                        options={{
                          ...lineChartOptions,
                          plugins: {
                            legend: {
                              display: true,
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
                                callback: (value) => `${value}%`,
                              },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <Empty
                  description={
                    <Space direction="vertical" align="center">
                      <Text type="secondary">Cần dữ liệu năm trước</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        để so sánh tăng trưởng năm/năm
                      </Text>
                    </Space>
                  }
                  style={{ padding: "60px 0" }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Payout Analysis */}
        <Card
          className="dashboard-card"
          title={
            <Space>
              <LineChartOutlined style={{ color: "#18573f" }} />
              <span>Phân tích chi trả bồi thường</span>
            </Space>
          }
          extra={
            <Space size="small">
              {payoutPerClaimChart && (
                <Space size={0}>
                  <Button
                    size="small"
                    type={payoutChartType === "line" ? "primary" : "default"}
                    icon={<LineChartOutlined />}
                    onClick={() => setPayoutChartType("line")}
                    style={{
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  />
                  <Button
                    size="small"
                    type={payoutChartType === "bar" ? "primary" : "default"}
                    icon={<BarChartOutlined />}
                    onClick={() => setPayoutChartType("bar")}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      marginLeft: -1,
                    }}
                  />
                </Space>
              )}
              <Button
                size="small"
                icon={
                  expandedChart === "payout" ? (
                    <CompressOutlined />
                  ) : (
                    <ExpandOutlined />
                  )
                }
                onClick={() =>
                  setExpandedChart(expandedChart === "payout" ? null : "payout")
                }
                type={expandedChart === "payout" ? "primary" : "default"}
              />
              {data?.monthly_payout_per_claim_trend &&
              data.monthly_payout_per_claim_trend.length > 0 ? (
                <Tag color="purple">
                  TB:{" "}
                  {dashboard.formatCurrency(
                    data.monthly_payout_per_claim_trend[0].avg_payout_per_claim
                  )}
                  /chi trả
                </Tag>
              ) : null}
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {payoutPerClaimChart ? (
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 13, display: "block", marginBottom: 16 }}
              >
                Theo dõi giá trị trung bình mỗi claim và số lượng claim được xử
                lý theo tháng
              </Text>
              <div
                style={{
                  height: expandedChart === "payout" ? 500 : 300,
                  transition: "height 0.3s ease",
                }}
              >
                {payoutChartType === "line" ? (
                  <Line data={payoutPerClaimChart} options={dualAxisOptions} />
                ) : (
                  <Bar
                    data={{
                      labels: payoutPerClaimChart.labels,
                      datasets: [
                        {
                          label: "Chi trả TB mỗi bồi thường",
                          data: payoutPerClaimChart.datasets[0].data,
                          backgroundColor: "rgba(24, 87, 63, 0.6)",
                          borderColor: "#18573f",
                          borderWidth: 1,
                          borderRadius: 4,
                          yAxisID: "y",
                        },
                        {
                          label: "Số lượng bồi thường",
                          data: payoutPerClaimChart.datasets[1].data,
                          backgroundColor: "rgba(250, 173, 20, 0.6)",
                          borderColor: "#faad14",
                          borderWidth: 1,
                          borderRadius: 4,
                          yAxisID: "y1",
                        },
                      ],
                    }}
                    options={dualAxisOptions}
                  />
                )}
              </div>
            </div>
          ) : (
            <Empty
              description="Chưa có dữ liệu chi trả bồi thường"
              style={{ padding: "60px 0" }}
            />
          )}
        </Card>

        {/* Data Summary Table */}
        <Card
          className="dashboard-card"
          title={
            <Space>
              <PieChartOutlined style={{ color: "#18573f" }} />
              <span>Tóm tắt theo tháng</span>
            </Space>
          }
        >
          {data?.monthly_loss_ratio_trend &&
          data.monthly_loss_ratio_trend.length > 0 ? (
            <CustomTable
              dataSource={data.monthly_loss_ratio_trend.map((item, index) => {
                const payoutData = data.monthly_payout_per_claim_trend?.find(
                  (p) => p.month === item.month
                );
                return {
                  key: index,
                  month: item.month,
                  monthly_premium: item.monthly_premium,
                  monthly_payout: item.monthly_payout,
                  loss_ratio_percent: item.loss_ratio_percent,
                  total_paid_claims: payoutData?.total_paid_claims || 0,
                  avg_payout_per_claim: payoutData?.avg_payout_per_claim || 0,
                };
              })}
              columns={[
                {
                  title: "Tháng",
                  dataIndex: "month",
                  key: "month",
                  render: (month) => formatMonth(month),
                },
                {
                  title: "Phí thu",
                  dataIndex: "monthly_premium",
                  key: "monthly_premium",
                  align: "right",
                  render: (value) => (
                    <span style={{ color: "#18573f", fontWeight: 500 }}>
                      {dashboard.formatCurrency(value)}
                    </span>
                  ),
                },
                {
                  title: "Chi trả",
                  dataIndex: "monthly_payout",
                  key: "monthly_payout",
                  align: "right",
                  render: (value) => (
                    <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                      {dashboard.formatCurrency(value)}
                    </span>
                  ),
                },
                {
                  title: "Tỷ lệ tổn thất",
                  dataIndex: "loss_ratio_percent",
                  key: "loss_ratio_percent",
                  align: "right",
                  render: (value) => (
                    <span
                      style={{
                        color:
                          value < 30
                            ? "#52c41a"
                            : value < 60
                            ? "#faad14"
                            : "#ff4d4f",
                        fontWeight: 500,
                      }}
                    >
                      {value.toFixed(2)}%
                    </span>
                  ),
                },
                {
                  title: "Số chi trả",
                  dataIndex: "total_paid_claims",
                  key: "total_paid_claims",
                  align: "right",
                  render: (value) => (
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  ),
                },
                {
                  title: "TB/chi trả",
                  dataIndex: "avg_payout_per_claim",
                  key: "avg_payout_per_claim",
                  align: "right",
                  render: (value) =>
                    value > 0 ? (
                      <span style={{ color: "#722ed1", fontWeight: 500 }}>
                        {dashboard.formatCurrency(value)}
                      </span>
                    ) : (
                      "-"
                    ),
                },
              ]}
              pagination={false}
            />
          ) : (
            <Empty
              description="Chưa có dữ liệu theo tháng"
              style={{ padding: "40px 0" }}
            />
          )}
        </Card>
      </div>
    </Layout.Content>
  );
}
