"use client";

import {
  CheckCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Card,
  Col,
  Divider,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import configurationData from "../../../../libs/mockdata/assessment_configuration.json";
import "../insurance-configuration.css";

const { Title, Text, Paragraph } = Typography;

export default function SystemOverviewPage() {
  const { system_info } = configurationData.insurance_assessment_configuration;

  // Transform the data to match the expected structure
  const system_overview = {
    system_info: {
      version: system_info.version,
      database_version: "PostgreSQL 14.2",
      environment: "Production",
      last_updated: system_info.last_updated,
    },
    data_sources: [
      {
        name: "Vệ tinh Quan sát Trái đất",
        status: "hoạt động",
        description:
          "Dữ liệu ảnh vệ tinh từ Landsat, Sentinel và các nguồn khác",
        last_sync: "2024-09-27T10:30:00Z",
      },
      {
        name: "API Thời tiết",
        status: "hoạt động",
        description: "Dữ liệu thời tiết thời gian thực và dự báo",
        last_sync: "2024-09-27T11:00:00Z",
      },
      {
        name: "Cơ sở dữ liệu Đất",
        status: "hoạt động",
        description: "Thông tin về chất lượng đất và đặc tính nông nghiệp",
        last_sync: "2024-09-27T09:15:00Z",
      },
    ],
    compliance_standards: system_info.compliance_standards.map((standard) => ({
      standard_name: standard,
      compliance_level: "cao",
      description: `Tuân thủ tiêu chuẩn ${standard} cho đánh giá rủi ro nông nghiệp`,
      version: "2024.1",
    })),
  };

  const systemInfoCards = [
    {
      title: "Phiên bản Hệ thống",
      value: system_overview.system_info.version,
      icon: <SettingOutlined />,
      color: "#1890ff",
    },
    {
      title: "Cơ sở Dữ liệu",
      value: system_overview.system_info.database_version,
      icon: <DatabaseOutlined />,
      color: "#52c41a",
    },
    {
      title: "Môi trường",
      value: system_overview.system_info.environment,
      icon: <CloudServerOutlined />,
      color: "#722ed1",
    },
    {
      title: "Cập nhật lần cuối",
      value: new Date(
        system_overview.system_info.last_updated
      ).toLocaleDateString("vi-VN"),
      icon: <CheckCircleOutlined />,
      color: "#fa8c16",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "hoạt động":
        return "success";
      case "bảo trì":
        return "warning";
      case "lỗi":
        return "error";
      default:
        return "default";
    }
  };

  const getComplianceIcon = (level) => {
    switch (level) {
      case "cao":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "trung bình":
        return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
      case "thấp":
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <SafetyCertificateOutlined />;
    }
  };

  return (
    <div className="system-overview-container">
      {/* System Info Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        {systemInfoCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="system-info-card">
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

      <Row gutter={[16, 16]}>
        {/* Data Sources */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined />
                <span>Nguồn Dữ liệu</span>
              </Space>
            }
            className="data-sources-card"
          >
            <List
              dataSource={system_overview.data_sources}
              renderItem={(source) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{source.name}</Text>
                        <Tag color={getStatusColor(source.status)}>
                          {source.status}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {source.description}
                        </Paragraph>
                        <Text type="secondary">
                          Cập nhật:{" "}
                          {new Date(source.last_sync).toLocaleString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                          })}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Compliance Standards */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>Tiêu chuẩn Tuân thủ</span>
              </Space>
            }
            className="compliance-card"
          >
            <List
              dataSource={system_overview.compliance_standards}
              renderItem={(standard) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getComplianceIcon(standard.compliance_level)}
                    title={
                      <Space>
                        <Text strong>{standard.standard_name}</Text>
                        <Badge
                          count={standard.compliance_level}
                          style={{
                            backgroundColor:
                              standard.compliance_level === "cao"
                                ? "#52c41a"
                                : standard.compliance_level === "trung bình"
                                ? "#faad14"
                                : "#ff4d4f",
                          }}
                        />
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {standard.description}
                        </Paragraph>
                        <Text type="secondary">
                          Phiên bản: {standard.version}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* System Configuration Summary */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card
            title={
              <Space>
                <SettingOutlined />
                <span>Tóm tắt Cấu hình Hệ thống</span>
              </Space>
            }
            className="system-config-summary"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <div className="config-item">
                  <Title level={5}>Thông tin Hệ thống</Title>
                  <div className="config-details">
                    <div className="config-row">
                      <Text type="secondary">Phiên bản:</Text>
                      <Text strong>{system_overview.system_info.version}</Text>
                    </div>
                    <div className="config-row">
                      <Text type="secondary">Môi trường:</Text>
                      <Tag color="blue">
                        {system_overview.system_info.environment}
                      </Tag>
                    </div>
                    <div className="config-row">
                      <Text type="secondary">Cơ sở dữ liệu:</Text>
                      <Text strong>
                        {system_overview.system_info.database_version}
                      </Text>
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className="config-item">
                  <Title level={5}>Nguồn Dữ liệu</Title>
                  <div className="config-details">
                    <Text type="secondary">
                      Tổng số nguồn:{" "}
                      <Text strong>{system_overview.data_sources.length}</Text>
                    </Text>
                    <Divider type="vertical" />
                    <Text type="secondary">
                      Hoạt động:{" "}
                      <Text strong style={{ color: "#52c41a" }}>
                        {
                          system_overview.data_sources.filter(
                            (s) => s.status === "hoạt động"
                          ).length
                        }
                      </Text>
                    </Text>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className="config-item">
                  <Title level={5}>Tuân thủ</Title>
                  <div className="config-details">
                    <Text type="secondary">
                      Tiêu chuẩn:{" "}
                      <Text strong>
                        {system_overview.compliance_standards.length}
                      </Text>
                    </Text>
                    <Divider type="vertical" />
                    <Text type="secondary">
                      Mức cao:{" "}
                      <Text strong style={{ color: "#52c41a" }}>
                        {
                          system_overview.compliance_standards.filter(
                            (s) => s.compliance_level === "cao"
                          ).length
                        }
                      </Text>
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
