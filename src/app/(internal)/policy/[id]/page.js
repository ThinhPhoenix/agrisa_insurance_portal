"use client";

import {
  BasicInfoDetail,
  ConfigurationDetail,
  CostSummary,
  TagsDetail,
} from "@/components/layout/policy/detail";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  message,
  Popconfirm,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import React from "react";
import mockData from "../mock..json";

const { Title, Text } = Typography;

const PolicyDetailPage = ({ params }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("basic");

  // Mock policy detail data - trong thực tế sẽ fetch từ API
  const policyDetail = {
    id: params.id || "policy_001",
    productName: "Bảo hiểm Lúa Mùa Đông 2025",
    productCode: "RICE_WINTER_2025",
    insuranceProviderId: "PARTNER_001",
    cropType: "rice",
    premiumBaseRate: 0.05,
    coverageDurationDays: 120,
    coverageAmount: 100000000, // 100 triệu
    status: "active",
    createdAt: "2025-01-15",
    updatedAt: "2025-01-20",
    description:
      "Chính sách bảo hiểm lúa cho vụ mùa đông 2025, bảo vệ nông dân khỏi rủi ro thiên tai và thời tiết bất lợi.",

    selectedDataSources: [
      {
        id: "770e8400-e29b-41d4-a716-446655440001",
        label: "Lượng mưa",
        parameterName: "rainfall",
        unit: "mm",
        baseCost: 62500,
        category: "weather",
        tier: "weather_tier_1",
        categoryLabel: "Weather",
        tierLabel: "Weather Tier 1",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        label: "Nhiệt độ",
        parameterName: "temperature",
        unit: "°C",
        baseCost: 50000,
        category: "weather",
        tier: "weather_tier_2",
        categoryLabel: "Weather",
        tierLabel: "Weather Tier 2",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440003",
        label: "Chỉ số NDVI",
        parameterName: "ndvi",
        unit: "index",
        baseCost: 125000,
        category: "satellite",
        tier: "satellite_tier_1",
        categoryLabel: "Satellite",
        tierLabel: "Satellite Tier 1",
      },
    ],

    configuration: {
      coverageType: "weather_index",
      riskLevel: "medium",
      logicalOperator: "AND",
      payoutPercentage: 80,
      maxPayoutAmount: 50000000,
      payoutMethod: "automatic",
      payoutCalculation: "linear",
      monitoringFrequency: "daily",
      alertTypes: ["email", "sms", "push"],

      triggerConditions: [
        {
          id: "condition_1",
          dataSourceId: "770e8400-e29b-41d4-a716-446655440001",
          aggregationFunction: "sum",
          timeWindow: 7,
          timeUnit: "days",
          thresholdOperator: "<",
          thresholdValue: 50,
          baselineValue: null,
        },
        {
          id: "condition_2",
          dataSourceId: "770e8400-e29b-41d4-a716-446655440002",
          aggregationFunction: "avg",
          timeWindow: 3,
          timeUnit: "days",
          thresholdOperator: ">",
          thresholdValue: 38,
          baselineValue: null,
        },
        {
          id: "condition_3",
          dataSourceId: "770e8400-e29b-41d4-a716-446655440003",
          aggregationFunction: "change",
          timeWindow: 14,
          timeUnit: "days",
          thresholdOperator: "change_lt",
          thresholdValue: -0.2,
          baselineValue: 0.7,
        },
      ],
    },

    tags: [
      {
        key: "region",
        label: "Khu vực",
        value: "Đồng bằng sông Cửu Long",
        dataType: "string",
      },
      {
        key: "season",
        label: "Mùa vụ",
        value: "Mùa đông",
        dataType: "string",
      },
      {
        key: "area_hectares",
        label: "Diện tích (ha)",
        value: "1000",
        dataType: "integer",
      },
      {
        key: "is_organic",
        label: "Canh tác hữu cơ",
        value: false,
        dataType: "boolean",
      },
      {
        key: "expected_yield",
        label: "Năng suất dự kiến (tấn/ha)",
        value: "6.5",
        dataType: "decimal",
      },
      {
        key: "contract_start",
        label: "Ngày bắt đầu hợp đồng",
        value: "2025-01-15",
        dataType: "date",
      },
    ],
  };

  const handleEdit = () => {
    message.info("Chuyển đến trang chỉnh sửa...");
    // router.push(`/policy/${params.id}/edit`);
  };

  const handleDelete = () => {
    message.success("Đã xóa chính sách thành công!");
    setTimeout(() => {
      router.push("/policy");
    }, 1500);
  };

  const handleBack = () => {
    router.push("/policy");
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: {
        color: "green",
        icon: <CheckCircleOutlined />,
        text: "Đang hoạt động",
      },
      pending: {
        color: "orange",
        icon: <ClockCircleOutlined />,
        text: "Chờ duyệt",
      },
      inactive: {
        color: "red",
        icon: <ClockCircleOutlined />,
        text: "Không hoạt động",
      },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const tabItems = [
    {
      key: "basic",
      label: (
        <Space>
          <FileTextOutlined />
          <span>Thông tin Cơ bản</span>
        </Space>
      ),
      children: (
        <BasicInfoDetail policyData={policyDetail} mockData={mockData} />
      ),
    },
    {
      key: "configuration",
      label: (
        <Space>
          <CheckCircleOutlined />
          <span>Cấu hình</span>
        </Space>
      ),
      children: (
        <ConfigurationDetail policyData={policyDetail} mockData={mockData} />
      ),
    },
    {
      key: "tags",
      label: (
        <Space>
          <FileTextOutlined />
          <span>Tags & Metadata</span>
        </Space>
      ),
      children: <TagsDetail policyData={policyDetail} mockData={mockData} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: 0, height: "auto" }}
              >
                Quay lại danh sách
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {policyDetail.productName}
              </Title>
              <Space>
                <Text type="secondary" code>
                  {policyDetail.productCode}
                </Text>
                {getStatusTag(policyDetail.status)}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Chỉnh sửa
              </Button>
              <Popconfirm
                title="Xóa chính sách"
                description="Bạn có chắc chắn muốn xóa chính sách này?"
                onConfirm={handleDelete}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={6}>
            <Text type="secondary">Ngày tạo:</Text>
            <br />
            <Text strong>{policyDetail.createdAt}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Cập nhật:</Text>
            <br />
            <Text strong>{policyDetail.updatedAt}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Thời hạn:</Text>
            <br />
            <Text strong>{policyDetail.coverageDurationDays} ngày</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Số tiền bảo hiểm:</Text>
            <br />
            <Text strong style={{ color: "#52c41a" }}>
              {policyDetail.coverageAmount?.toLocaleString()} ₫
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Row gutter={24}>
        {/* Left Content - Details Tabs */}
        <Col span={16}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Col>

        {/* Right Content - Cost Summary */}
        <Col span={8}>
          <div
            style={{
              position: "sticky",
              top: "24px",
              height: "fit-content",
            }}
          >
            <CostSummary policyData={policyDetail} mockData={mockData} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PolicyDetailPage;
