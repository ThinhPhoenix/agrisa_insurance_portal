"use client";

import {
  CloudOutlined,
  GlobalOutlined,
  RadarChartOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import configurationData from "../../../../libs/mockdata/assessment_configuration.json";
import "../insurance-configuration.css";

const { Title, Text } = Typography;

export default function SatelliteConfigPage() {
  const { satellite_data_config } =
    configurationData.insurance_assessment_configuration;

  // Transform the data to match the expected structure
  const satellite_config = {
    satellites: [
      ...satellite_data_config.primary_sources.optical_imagery.satellites.map(
        (sat) => ({
          satellite_name: sat,
          resolution:
            satellite_data_config.primary_sources.optical_imagery.resolution,
          frequency:
            satellite_data_config.primary_sources.optical_imagery
              .revisit_frequency,
          status: "hoạt động",
          reliability: "95%",
        })
      ),
      ...satellite_data_config.primary_sources.sar_data.satellites.map(
        (sat) => ({
          satellite_name: sat,
          resolution: satellite_data_config.primary_sources.sar_data.resolution,
          frequency: "3-5 ngày",
          status: "hoạt động",
          reliability: "92%",
        })
      ),
    ],
    coverage_areas: [
      {
        region: "Đồng bằng sông Cửu Long",
        coverage_percentage: "98%",
        primary_satellites: ["Landsat 8/9", "Sentinel-2"],
      },
      {
        region: "Đồng bằng sông Hồng",
        coverage_percentage: "95%",
        primary_satellites: ["Sentinel-2", "GF-1"],
      },
      {
        region: "Tây Nguyên",
        coverage_percentage: "92%",
        primary_satellites: ["Sentinel-1", "ALOS PALSAR"],
      },
    ],
  };

  const getResolutionColor = (resolution) => {
    const value = parseFloat(resolution);
    if (value <= 1) return "#52c41a";
    if (value <= 5) return "#faad14";
    return "#ff4d4f";
  };

  const getFrequencyColor = (frequency) => {
    const match = frequency.match(/(\d+)/);
    const days = match ? parseInt(match[1]) : 30;
    if (days <= 3) return "#52c41a";
    if (days <= 7) return "#faad14";
    return "#ff4d4f";
  };

  const satelliteColumns = [
    {
      title: "Vệ tinh",
      dataIndex: "satellite_name",
      key: "satellite_name",
      render: (text) => (
        <Space>
          <RadarChartOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Độ phân giải",
      dataIndex: "resolution",
      key: "resolution",
      render: (resolution) => (
        <Tag color={getResolutionColor(resolution)}>{resolution}</Tag>
      ),
    },
    {
      title: "Tần suất chụp",
      dataIndex: "frequency",
      key: "frequency",
      render: (frequency) => (
        <Tag color={getFrequencyColor(frequency)}>{frequency}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "hoạt động" ? "success" : "error"}>{status}</Tag>
      ),
    },
    {
      title: "Độ tin cậy",
      dataIndex: "reliability",
      key: "reliability",
      render: (reliability) => {
        const value = parseFloat(reliability.replace("%", ""));
        return <Progress percent={value} size="small" />;
      },
    },
  ];

  const coverageColumns = [
    {
      title: "Vùng địa lý",
      dataIndex: "region",
      key: "region",
      render: (text) => (
        <Space>
          <GlobalOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Phạm vi phủ sóng",
      dataIndex: "coverage_percentage",
      key: "coverage_percentage",
      render: (percentage) => {
        const value = parseFloat(percentage.replace("%", ""));
        return <Progress percent={value} size="small" strokeColor="#52c41a" />;
      },
    },
    {
      title: "Vệ tinh chính",
      dataIndex: "primary_satellites",
      key: "primary_satellites",
      render: (satellites) => (
        <div>
          {satellites.map((sat, index) => (
            <Tag key={index} color="blue">
              {sat}
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  const statisticCards = [
    {
      title: "Tổng số Vệ tinh",
      value: satellite_config.satellites.length,
      icon: <RadarChartOutlined />,
      color: "#1890ff",
    },
    {
      title: "Vệ tinh Hoạt động",
      value: satellite_config.satellites.filter((s) => s.status === "hoạt động")
        .length,
      icon: <WifiOutlined />,
      color: "#52c41a",
    },
    {
      title: "Vùng Phủ sóng",
      value: satellite_config.coverage_areas.length,
      icon: <GlobalOutlined />,
      color: "#722ed1",
    },
    {
      title: "Độ phân giải Tốt nhất",
      value: "0.5m",
      icon: <CloudOutlined />,
      color: "#fa8c16",
    },
  ];

  return (
    <div className="satellite-config-container">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        {statisticCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="statistic-card">
              <Statistic
                title={card.title}
                value={card.value}
                prefix={<span style={{ color: card.color }}>{card.icon}</span>}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Satellites Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <RadarChartOutlined />
                <span>Danh sách Vệ tinh</span>
              </Space>
            }
            className="satellites-table-card"
          >
            <Table
              columns={satelliteColumns}
              dataSource={satellite_config.satellites.map((sat, index) => ({
                ...sat,
                key: index,
              }))}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Coverage Areas */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card
            title={
              <Space>
                <GlobalOutlined />
                <span>Vùng Phủ sóng</span>
              </Space>
            }
            className="coverage-table-card"
          >
            <Table
              columns={coverageColumns}
              dataSource={satellite_config.coverage_areas.map(
                (area, index) => ({
                  ...area,
                  key: index,
                })
              )}
              pagination={false}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
