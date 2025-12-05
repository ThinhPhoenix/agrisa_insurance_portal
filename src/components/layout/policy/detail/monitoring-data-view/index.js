import CustomTable from "@/components/custom-table";
import {
  Card,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  InputNumber,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Quality translation
const QUALITY_LABELS = {
  excellent: "Xuất sắc",
  good: "Tốt",
  fair: "Trung bình",
  poor: "Kém",
  acceptable: "Chấp nhận được",
};

// Status translation
const STATUS_LABELS = {
  active: "Đang hoạt động",
  pending_review: "Chờ duyệt",
};

// Update frequency translation
const UPDATE_FREQUENCY_LABELS = {
  hourly: "Theo giờ (Hourly)",
  daily: "Theo ngày (Daily)",
  weekly: "Theo tuần (Weekly)",
  monthly: "Theo tháng (Monthly)",
  yearly: "Theo năm (Yearly)",
};

export default function MonitoringDataView({ item }) {
  const records = item.monitoringData?.monitoring_data || [];
  const count = item.monitoringData?.count || 0;

  // State for chart filters
  const [chartSampleSize, setChartSampleSize] = useState(30);
  const [dateRange, setDateRange] = useState(null);

  // Calculate statistics
  const avgValue =
    records.length > 0
      ? (
          records.reduce((sum, r) => sum + (r.measured_value || 0), 0) /
          records.length
        ).toFixed(4)
      : 0;
  const maxValue =
    records.length > 0
      ? Math.max(...records.map((r) => r.measured_value || 0)).toFixed(4)
      : 0;
  const minValue =
    records.length > 0
      ? Math.min(...records.map((r) => r.measured_value || 0)).toFixed(4)
      : 0;
  const avgConfidence =
    records.length > 0
      ? (
          (records.reduce((sum, r) => sum + (r.confidence_score || 0), 0) /
            records.length) *
          100
        ).toFixed(1)
      : 0;

  // Data quality distribution
  const qualityCount = records.reduce((acc, r) => {
    acc[r.data_quality] = (acc[r.data_quality] || 0) + 1;
    return acc;
  }, {});

  // Sort by timestamp for chart
  const sortedRecords = [...records].sort(
    (a, b) => a.measurement_timestamp - b.measurement_timestamp
  );

  // Filter records by date range if selected
  let filteredRecords = sortedRecords;
  if (dateRange && dateRange[0] && dateRange[1]) {
    const startTimestamp = dateRange[0].startOf("day").valueOf() / 1000;
    const endTimestamp = dateRange[1].endOf("day").valueOf() / 1000;
    filteredRecords = sortedRecords.filter(
      (r) =>
        r.measurement_timestamp >= startTimestamp &&
        r.measurement_timestamp <= endTimestamp
    );
  }

  // Prepare chart data - show last N points based on sample size
  const chartRecords = filteredRecords.slice(-chartSampleSize);
  const lineChartData = {
    labels: chartRecords.map((r) =>
      new Date(r.measurement_timestamp * 1000).toLocaleDateString("vi-VN", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: `${item.dataSource?.display_name_vi || item.parameterName} (${
          item.dataSource?.unit
        })`,
        data: chartRecords.map((r) => r.measured_value),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const confidenceChartData = {
    labels: chartRecords.map((r) =>
      new Date(r.measurement_timestamp * 1000).toLocaleDateString("vi-VN", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Độ tin cậy (%)",
        data: chartRecords.map((r) => (r.confidence_score * 100).toFixed(1)),
        backgroundColor: "rgba(147, 51, 234, 0.6)",
        borderColor: "rgb(147, 51, 234)",
        borderWidth: 1,
      },
    ],
  };

  // Cloud cover chart data
  const cloudCoverChartData = {
    labels: chartRecords.map((r) =>
      new Date(r.measurement_timestamp * 1000).toLocaleDateString("vi-VN", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Mây che phủ (%)",
        data: chartRecords.map(
          (r) => r.cloud_cover_percentage?.toFixed(1) || 0
        ),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  // Data quality pie chart data
  const qualityColors = {
    excellent: "rgba(34, 197, 94, 0.8)", // green
    good: "rgba(59, 130, 246, 0.8)", // blue
    acceptable: "rgba(251, 146, 60, 0.8)", // orange
    fair: "rgba(251, 146, 60, 0.8)", // orange
    poor: "rgba(239, 68, 68, 0.8)", // red
  };

  const pieChartData = {
    labels: Object.keys(qualityCount).map((q) => QUALITY_LABELS[q] || q),
    datasets: [
      {
        label: "Số bản ghi",
        data: Object.values(qualityCount),
        backgroundColor: Object.keys(qualityCount).map(
          (q) => qualityColors[q] || "rgba(156, 163, 175, 0.8)"
        ),
        borderColor: Object.keys(qualityCount).map((q) => {
          const bg = qualityColors[q] || "rgba(156, 163, 175, 0.8)";
          return bg.replace("0.8", "1");
        }),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const cloudCoverOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + "%";
          },
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} bản ghi (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Data Source Info */}
      <Card size="small" className="mb-4" title="Thông tin nguồn dữ liệu">
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Nguồn dữ liệu">
            {item.dataSource?.data_source}
          </Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">
            {item.dataSource?.data_provider}
          </Descriptions.Item>
          <Descriptions.Item label="Tên tham số">
            <Tag color="blue">{item.parameterName}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị">
            {item.dataSource?.unit}
          </Descriptions.Item>
          <Descriptions.Item label="Tần suất cập nhật">
            {UPDATE_FREQUENCY_LABELS[item.dataSource?.update_frequency] ||
              item.dataSource?.update_frequency}
          </Descriptions.Item>
          <Descriptions.Item label="Độ phân giải">
            {item.dataSource?.spatial_resolution}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng số bản ghi">
            <Tag color="purple">{count} bản ghi</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Statistics Summary */}
      <Card size="small" className="mb-4" title="Thống kê tổng quan">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" className="text-center">
              <Text type="secondary" className="text-xs block">
                Giá trị trung bình
              </Text>
              <div className="text-xl font-bold text-blue-600 my-2">
                {avgValue}
              </div>
              <Text type="secondary" className="text-xs">
                {item.dataSource?.unit}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" className="text-center">
              <Text type="secondary" className="text-xs block">
                Giá trị tối đa
              </Text>
              <div className="text-xl font-bold text-green-600 my-2">
                {maxValue}
              </div>
              <Text type="secondary" className="text-xs">
                {item.dataSource?.unit}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" className="text-center">
              <Text type="secondary" className="text-xs block">
                Giá trị tối thiểu
              </Text>
              <div className="text-xl font-bold text-orange-600 my-2">
                {minValue}
              </div>
              <Text type="secondary" className="text-xs">
                {item.dataSource?.unit}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" className="text-center">
              <Text type="secondary" className="text-xs block">
                Độ tin cậy TB
              </Text>
              <div className="text-xl font-bold text-purple-600 my-2">
                {avgConfidence}%
              </div>
              <Text type="secondary" className="text-xs">
                Confidence
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Chart Controls */}
      <Card size="small" className="mb-4" title="Bộ lọc biểu đồ">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" className="w-full">
              <Text type="secondary" className="text-xs">
                Số lượng mẫu hiển thị
              </Text>
              <InputNumber
                min={10}
                max={filteredRecords.length}
                value={chartSampleSize}
                onChange={(value) => setChartSampleSize(value || 30)}
                style={{ width: "100%" }}
                placeholder="Nhập số mẫu"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Space direction="vertical" size="small" className="w-full">
              <Text type="secondary" className="text-xs">
                Khoảng thời gian
              </Text>
              <RangePicker
                format="DD/MM/YYYY"
                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                onChange={(dates) => setDateRange(dates)}
                style={{ width: "100%" }}
              />
            </Space>
          </Col>
        </Row>
        {dateRange && (
          <div className="mt-2">
            <Tag color="blue">
              Hiển thị {chartRecords.length} mẫu trong khoảng thời gian đã chọn
            </Tag>
          </div>
        )}
      </Card>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-4">
        {/* Main trend chart - full width on top */}
        <Col xs={24}>
          <Card
            size="small"
            title={`Biểu đồ xu hướng ${
              item.dataSource?.display_name_vi || item.parameterName
            } (${chartRecords.length} mẫu gần nhất)`}
          >
            <div style={{ height: "320px" }}>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        {/* Three charts in a row below */}
        <Col xs={24} md={8}>
          <Card size="small" title={`Độ tin cậy (${chartRecords.length} mẫu)`}>
            <div style={{ height: "280px" }}>
              <Bar data={confidenceChartData} options={barChartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title={`Mây che phủ (${chartRecords.length} mẫu)`}>
            <div style={{ height: "280px" }}>
              <Line data={cloudCoverChartData} options={cloudCoverOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title="Tỉ trọng chất lượng dữ liệu">
            <div style={{ height: "280px" }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Data Quality Distribution */}
      <Card size="small" className="mb-4" title="Phân bố chất lượng dữ liệu">
        <Space wrap>
          {Object.entries(qualityCount).map(([quality, count]) => (
            <Tag
              key={quality}
              color={
                quality === "excellent"
                  ? "green"
                  : quality === "good"
                  ? "blue"
                  : quality === "fair"
                  ? "orange"
                  : quality === "poor"
                  ? "red"
                  : "default"
              }
              className="text-sm py-1 px-3"
            >
              {QUALITY_LABELS[quality] || quality}: <strong>{count}</strong> bản
              ghi
            </Tag>
          ))}
        </Space>
      </Card>

      {/* Monitoring Data Table */}
      <Collapse
        items={[
          {
            key: "monitoring-data",
            label: `Chi tiết dữ liệu giám sát (${count} bản ghi)`,
            children:
              records.length > 0 ? (
                <CustomTable
                  dataSource={records}
                  rowKey={(record, index) => `${record.id}-${index}`}
                  size="small"
                  scroll={{ x: 1400 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} của ${total} mục`,
                    position: ["bottomCenter"],
                  }}
                  columns={[
                    {
                      title: "Thời gian đo",
                      dataIndex: "measurement_timestamp",
                      key: "timestamp",
                      width: 170,
                      fixed: "left",
                      sorter: (a, b) =>
                        a.measurement_timestamp - b.measurement_timestamp,
                      defaultSortOrder: "descend",
                      render: (val) => (
                        <span className="text-xs">
                          {new Date(val * 1000).toLocaleString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                          })}
                        </span>
                      ),
                    },
                    {
                      title: "Giá trị đo",
                      dataIndex: "measured_value",
                      key: "value",
                      width: 130,
                      sorter: (a, b) => a.measured_value - b.measured_value,
                      render: (val, record) => (
                        <span className="font-semibold text-blue-600">
                          {val?.toFixed(4)}{" "}
                          <Text type="secondary" className="text-xs">
                            {record.unit}
                          </Text>
                        </span>
                      ),
                    },
                    {
                      title: "Chất lượng",
                      dataIndex: "data_quality",
                      key: "quality",
                      width: 120,
                      filters: [
                        { text: "Xuất sắc", value: "excellent" },
                        { text: "Tốt", value: "good" },
                        { text: "Trung bình", value: "fair" },
                        { text: "Kém", value: "poor" },
                      ],
                      onFilter: (value, record) =>
                        record.data_quality === value,
                      render: (quality) => (
                        <Tag
                          color={
                            quality === "excellent"
                              ? "green"
                              : quality === "good"
                              ? "blue"
                              : quality === "fair"
                              ? "orange"
                              : quality === "poor"
                              ? "red"
                              : "default"
                          }
                        >
                          {QUALITY_LABELS[quality] || quality}
                        </Tag>
                      ),
                    },
                    {
                      title: "Độ tin cậy",
                      dataIndex: "confidence_score",
                      key: "confidence",
                      width: 110,
                      sorter: (a, b) => a.confidence_score - b.confidence_score,
                      render: (val) => (
                        <span className="text-purple-600 font-medium">
                          {(val * 100).toFixed(1)}%
                        </span>
                      ),
                    },
                    {
                      title: "Mây che phủ",
                      dataIndex: "cloud_cover_percentage",
                      key: "cloud",
                      width: 110,
                      sorter: (a, b) =>
                        a.cloud_cover_percentage - b.cloud_cover_percentage,
                      render: (val) => (
                        <span
                          className={
                            val > 50 ? "text-red-500" : "text-green-600"
                          }
                        >
                          {val?.toFixed(1)}%
                        </span>
                      ),
                    },
                    {
                      title: "Thống kê thành phần",
                      key: "stats",
                      width: 200,
                      render: (_, record) => {
                        const stats = record.component_data?.statistics;
                        return stats ? (
                          <div className="text-xs space-y-1">
                            <div>
                              <Text type="secondary">Tối đa:</Text>{" "}
                              <strong>{stats.max?.toFixed(4)}</strong>
                            </div>
                            <div>
                              <Text type="secondary">Trung vị:</Text>{" "}
                              <strong>{stats.median?.toFixed(4)}</strong>
                            </div>
                            <div>
                              <Text type="secondary">Tối thiểu:</Text>{" "}
                              <strong>{stats.min?.toFixed(4)}</strong>
                            </div>
                            <div>
                              <Text type="secondary">Độ lệch:</Text>{" "}
                              {stats.stddev?.toFixed(4)}
                            </div>
                          </div>
                        ) : (
                          "-"
                        );
                      },
                    },
                    {
                      title: "Nguồn đo",
                      dataIndex: "measurement_source",
                      key: "source",
                      width: 150,
                      ellipsis: true,
                    },
                    {
                      title: "Số hợp đồng",
                      dataIndex: "policy_number",
                      key: "policy",
                      width: 140,
                    },
                    {
                      title: "Trạng thái HĐ",
                      dataIndex: "policy_status",
                      key: "status",
                      width: 130,
                      filters: [
                        { text: "Đang hoạt động", value: "active" },
                        { text: "Chờ duyệt", value: "pending_review" },
                      ],
                      onFilter: (value, record) =>
                        record.policy_status === value,
                      render: (status) => (
                        <Tag color={status === "active" ? "green" : "orange"}>
                          {STATUS_LABELS[status] || status}
                        </Tag>
                      ),
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">Chưa có dữ liệu giám sát</Text>
              ),
          },
        ]}
      />
    </div>
  );
}
