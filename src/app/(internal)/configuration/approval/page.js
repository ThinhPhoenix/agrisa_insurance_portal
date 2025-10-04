"use client";

import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import configurationData from "../../../../libs/mockdata/assessment_configuration.json";
import "../insurance-configuration.css";

const { Title, Text } = Typography;

export default function ApprovalProcessPage() {
  const { approval_workflows } =
    configurationData.insurance_assessment_configuration || {};

  // Transform the data to match the expected structure
  const approval_process = {
    approval_steps: [
      {
        step: "Bước 1: Xác minh Đơn đăng ký",
        description:
          "Kiểm tra tính đầy đủ và chính xác của thông tin đơn đăng ký",
        approval_type: "tự động",
        processing_time: "15 phút",
      },
      {
        step: "Bước 2: Đánh giá Rủi ro Sơ bộ",
        description: "Phân tích rủi ro dựa trên dữ liệu lịch sử và vệ tinh",
        approval_type: "tự động",
        processing_time: "30 phút",
      },
      {
        step: "Bước 3: Xác minh Thực địa",
        description: "Kiểm tra thông tin thực tế tại hiện trường nếu cần",
        approval_type: "thủ công",
        processing_time: "2-3 ngày",
      },
      {
        step: "Bước 4: Phê duyệt Cuối cùng",
        description: "Quyết định cuối cùng về việc chấp nhận bảo hiểm",
        approval_type: "kết hợp",
        processing_time: "1 ngày",
      },
    ],
    approval_roles: [
      {
        role: "Nhân viên Xử lý",
        permissions: ["Xem đơn", "Cập nhật trạng thái"],
        approval_limit: "< 50 triệu VND",
      },
      {
        role: "Trưởng nhóm",
        permissions: ["Phê duyệt", "Từ chối", "Yêu cầu bổ sung"],
        approval_limit: "< 200 triệu VND",
      },
      {
        role: "Quản lý Chi nhánh",
        permissions: ["Phê duyệt cao", "Quyết định cuối"],
        approval_limit: "< 1 tỷ VND",
      },
      {
        role: "Giám đốc",
        permissions: ["Phê duyệt đặc biệt", "Quyết định tối cao"],
        approval_limit: "Không giới hạn",
      },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "tự động":
        return "success";
      case "thủ công":
        return "warning";
      case "kết hợp":
        return "processing";
      default:
        return "default";
    }
  };

  const stepColumns = [
    {
      title: "Bước",
      dataIndex: "step",
      key: "step",
      render: (text) => (
        <Space>
          <AuditOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Loại phê duyệt",
      dataIndex: "approval_type",
      key: "approval_type",
      render: (type) => <Tag color={getStatusColor(type)}>{type}</Tag>,
    },
    {
      title: "Thời gian xử lý",
      dataIndex: "processing_time",
      key: "processing_time",
      render: (time) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{time}</Text>
        </Space>
      ),
    },
  ];

  const roleColumns = [
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Quyền hạn",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions) => (
        <div>
          {permissions.map((perm, index) => (
            <Tag key={index} color="blue">
              {perm}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Giới hạn phê duyệt",
      dataIndex: "approval_limit",
      key: "approval_limit",
      render: (limit) => <Tag color="green">{limit}</Tag>,
    },
  ];

  const statisticCards = [
    {
      title: "Tổng số Bước",
      value: approval_process.approval_steps.length,
      icon: <AuditOutlined />,
      color: "#1890ff",
    },
    {
      title: "Phê duyệt Tự động",
      value: approval_process.approval_steps.filter(
        (s) => s.approval_type === "tự động"
      ).length,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
    },
    {
      title: "Vai trò Phê duyệt",
      value: approval_process.approval_roles.length,
      icon: <UserOutlined />,
      color: "#722ed1",
    },
    {
      title: "Thời gian Trung bình",
      value: "2.5h",
      icon: <ClockCircleOutlined />,
      color: "#fa8c16",
    },
  ];

  return (
    <div className="approval-process-container">
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

      {/* Approval Steps */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <AuditOutlined />
                <span>Các Bước Phê duyệt</span>
              </Space>
            }
            className="approval-steps-card"
          >
            <Table
              columns={stepColumns}
              dataSource={approval_process.approval_steps.map(
                (step, index) => ({
                  ...step,
                  key: index,
                })
              )}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Approval Roles */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Vai trò Phê duyệt</span>
              </Space>
            }
            className="approval-roles-card"
          >
            <Table
              columns={roleColumns}
              dataSource={approval_process.approval_roles.map(
                (role, index) => ({
                  ...role,
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
