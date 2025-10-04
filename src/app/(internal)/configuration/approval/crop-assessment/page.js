"use client";

import {
  AlertOutlined,
  BranchesOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import configurationData from "../../../../../libs/mockdata/assessment_configuration.json";
import "../../insurance-configuration.css";

const { Title, Text } = Typography;

export default function CropAssessmentPage() {
  const { assessment_criteria } =
    configurationData.insurance_assessment_configuration;

  // Transform the data to match the expected structure
  const crop_assessment = {
    crop_thresholds: [
      {
        crop_type: "lúa",
        healthy_ndvi: { min: "0.6", max: "0.9" },
        stress_ndvi: { min: "0.3", max: "0.6" },
        damage_ndvi: { min: "0.1", max: "0.3" },
        risk_level: "trung bình",
      },
      {
        crop_type: "ngô",
        healthy_ndvi: { min: "0.7", max: "0.9" },
        stress_ndvi: { min: "0.4", max: "0.7" },
        damage_ndvi: { min: "0.1", max: "0.4" },
        risk_level: "thấp",
      },
      {
        crop_type: "đậu tương",
        healthy_ndvi: { min: "0.6", max: "0.8" },
        stress_ndvi: { min: "0.3", max: "0.6" },
        damage_ndvi: { min: "0.1", max: "0.3" },
        risk_level: "cao",
      },
      {
        crop_type: "cà phê",
        healthy_ndvi: { min: "0.5", max: "0.8" },
        stress_ndvi: { min: "0.2", max: "0.5" },
        damage_ndvi: { min: "0.1", max: "0.2" },
        risk_level: "cao",
      },
      {
        crop_type: "cao su",
        healthy_ndvi: { min: "0.6", max: "0.9" },
        stress_ndvi: { min: "0.3", max: "0.6" },
        damage_ndvi: { min: "0.1", max: "0.3" },
        risk_level: "thấp",
      },
    ],
    weather_parameters: [
      {
        parameter: "Lượng mưa",
        warning_threshold: ">200mm/tuần",
        critical_threshold: ">300mm/tuần",
        unit: "mm",
      },
      {
        parameter: "Nhiệt độ",
        warning_threshold: "<5°C hoặc >40°C",
        critical_threshold: "<0°C hoặc >45°C",
        unit: "°C",
      },
      {
        parameter: "Độ ẩm",
        warning_threshold: "<30% hoặc >90%",
        critical_threshold: "<20% hoặc >95%",
        unit: "%",
      },
      {
        parameter: "Tốc độ gió",
        warning_threshold: ">50km/h",
        critical_threshold: ">80km/h",
        unit: "km/h",
      },
    ],
  };

  const getCropColor = (cropType) => {
    const colors = {
      lúa: "#52c41a",
      ngô: "#faad14",
      "đậu tương": "#722ed1",
      "cà phê": "#8c4a2f",
      "cao su": "#096dd9",
    };
    return colors[cropType] || "#1890ff";
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "thấp":
        return "success";
      case "trung bình":
        return "warning";
      case "cao":
        return "error";
      default:
        return "default";
    }
  };

  const thresholdColumns = [
    {
      title: "Loại cây trồng",
      dataIndex: "crop_type",
      key: "crop_type",
      render: (text) => (
        <Space>
          <BranchesOutlined style={{ color: getCropColor(text) }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "NDVI Khỏe mạnh",
      dataIndex: "healthy_ndvi",
      key: "healthy_ndvi",
      render: (range) => (
        <Tag color="green">
          {range.min} - {range.max}
        </Tag>
      ),
    },
    {
      title: "NDVI Căng thẳng",
      dataIndex: "stress_ndvi",
      key: "stress_ndvi",
      render: (range) => (
        <Tag color="orange">
          {range.min} - {range.max}
        </Tag>
      ),
    },
    {
      title: "NDVI Thiệt hại",
      dataIndex: "damage_ndvi",
      key: "damage_ndvi",
      render: (range) => (
        <Tag color="red">
          {range.min} - {range.max}
        </Tag>
      ),
    },
    {
      title: "Mức độ Rủi ro",
      dataIndex: "risk_level",
      key: "risk_level",
      render: (risk) => <Tag color={getRiskColor(risk)}>{risk}</Tag>,
    },
  ];

  const weatherColumns = [
    {
      title: "Thông số",
      dataIndex: "parameter",
      key: "parameter",
      render: (text) => (
        <Space>
          <AlertOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Ngưỡng Cảnh báo",
      dataIndex: "warning_threshold",
      key: "warning_threshold",
      render: (threshold) => <Tag color="orange">{threshold}</Tag>,
    },
    {
      title: "Ngưỡng Nguy hiểm",
      dataIndex: "critical_threshold",
      key: "critical_threshold",
      render: (threshold) => <Tag color="red">{threshold}</Tag>,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      render: (unit) => <Text type="secondary">{unit}</Text>,
    },
  ];

  const statisticCards = [
    {
      title: "Loại Cây trồng",
      value: crop_assessment.crop_thresholds.length,
      icon: <BranchesOutlined />,
      color: "#52c41a",
    },
    {
      title: "Thông số Thời tiết",
      value: crop_assessment.weather_parameters.length,
      icon: <AlertOutlined />,
      color: "#faad14",
    },
    {
      title: "Cây trồng Rủi ro Cao",
      value: crop_assessment.crop_thresholds.filter(
        (c) => c.risk_level === "cao"
      ).length,
      icon: <TrophyOutlined />,
      color: "#ff4d4f",
    },
    {
      title: "Độ chính xác Trung bình",
      value: "94.2%",
      icon: <EnvironmentOutlined />,
      color: "#1890ff",
    },
  ];

  return (
    <div className="crop-assessment-container">
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

      {/* Crop Thresholds Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <BranchesOutlined />
                <span>Ngưỡng theo Cây trồng</span>
              </Space>
            }
            className="crop-thresholds-card"
          >
            <Table
              columns={thresholdColumns}
              dataSource={crop_assessment.crop_thresholds.map(
                (crop, index) => ({
                  ...crop,
                  key: index,
                })
              )}
              pagination={false}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Weather Parameters */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card
            title={
              <Space>
                <AlertOutlined />
                <span>Thông số Thời tiết</span>
              </Space>
            }
            className="weather-parameters-card"
          >
            <Table
              columns={weatherColumns}
              dataSource={crop_assessment.weather_parameters.map(
                (param, index) => ({
                  ...param,
                  key: index,
                })
              )}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
