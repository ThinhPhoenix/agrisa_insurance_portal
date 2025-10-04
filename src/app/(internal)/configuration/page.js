"use client";

import {
  CheckCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Tabs, Typography } from "antd";
import { usePathname, useRouter } from "next/navigation";
import "./insurance-configuration.css";

const { Title } = Typography;

export default function InsuranceConfigurationLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // Get active tab from pathname
  const getActiveKey = () => {
    if (pathname.includes("/overal")) return "system_overview";
    if (pathname.includes("/satellite")) return "satellite_config";
    if (pathname.includes("/crop-assessment")) return "crop_assessment";
    if (pathname.includes("/approval")) return "approval_process";
    if (pathname.includes("/fraud-detection")) return "fraud_detection";
    if (pathname.includes("/claims-automation")) return "claims_automation";
    if (pathname.includes("/partners")) return "partners";
    if (pathname.includes("/quality-compliance")) return "quality_compliance";
    return "system_overview";
  };

  // Handle tab change
  const handleTabChange = (key) => {
    const routes = {
      system_overview: "/insurance/configuration/overal",
      satellite_config: "/insurance/configuration/satellite",
      crop_assessment: "/insurance/configuration/crop-assessment",
      approval_process: "/insurance/configuration/approval",
      fraud_detection: "/insurance/configuration/fraud-detection",
      claims_automation: "/insurance/configuration/claims-automation",
      partners: "/insurance/configuration/partners",
      quality_compliance: "/insurance/configuration/quality-compliance",
    };

    router.push(routes[key]);
  };

  const tabItems = [
    {
      key: "system_overview",
      label: (
        <span>
          <SettingOutlined />
          Tổng quan Hệ thống
        </span>
      ),
    },
    {
      key: "satellite_config",
      label: (
        <span>
          <GlobalOutlined />
          Cấu hình Vệ tinh
        </span>
      ),
    },
    {
      key: "crop_assessment",
      label: (
        <span>
          <EnvironmentOutlined />
          Đánh giá theo Cây trồng
        </span>
      ),
    },
    {
      key: "approval_process",
      label: (
        <span>
          <CheckCircleOutlined />
          Quy trình Phê duyệt
        </span>
      ),
    },
    {
      key: "fraud_detection",
      label: (
        <span>
          <SecurityScanOutlined />
          Phát hiện Gian lận
        </span>
      ),
    },
    {
      key: "claims_automation",
      label: (
        <span>
          <ThunderboltOutlined />
          Tự động hóa Khiếu nại
        </span>
      ),
    },
    {
      key: "partners",
      label: (
        <span>
          <TeamOutlined />
          Tích hợp Đối tác
        </span>
      ),
    },
    {
      key: "quality_compliance",
      label: (
        <span>
          <SafetyCertificateOutlined />
          Chất lượng & Tuân thủ
        </span>
      ),
    },
  ];

  return (
    <div className="insurance-configuration-container">
      <div className="insurance-configuration-header">
        <Breadcrumb className="insurance-configuration-breadcrumb">
          <Breadcrumb.Item>
            <HomeOutlined />
            <span>Trang chủ</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Cài đặt</Breadcrumb.Item>
          <Breadcrumb.Item>Cấu hình Đánh giá</Breadcrumb.Item>
        </Breadcrumb>

        <Title level={2} className="insurance-configuration-title">
          Cấu hình Đánh giá Bảo hiểm
        </Title>
      </div>

      <Tabs
        className="configuration-tabs"
        items={tabItems}
        activeKey={getActiveKey()}
        onChange={handleTabChange}
        type="card"
        size="large"
      />
    </div>
  );
}
