"use client";

import SelectedColumn from "@/components/column-selector";
import CustomTable from "@/components/custom-table";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PercentageOutlined,
  SafetyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Layout, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import mockData from "./mock..json";
import "./policy.css";

const { Title, Text } = Typography;

export default function PolicyPage() {
  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "productName",
    "productCode",
    "insuranceProviderId",
    "cropType",
    "premiumBaseRate",
    "coverageDurationDays",
  ]);

  // Calculate summary stats
  const summaryStats = {
    totalPolicies: mockData.policies.length,
    activePolicies: mockData.policies.length, // Assuming all are active
    uniqueProviders: new Set(
      mockData.policies.map((p) => p.insuranceProviderId)
    ).size,
    avgPremiumRate: (
      (mockData.policies.reduce((sum, p) => sum + p.premiumBaseRate, 0) /
        mockData.policies.length) *
      100
    ).toFixed(1),
  };

  // Get crop type label
  const getCropTypeLabel = (cropTypeValue) => {
    const cropType = mockData.cropTypes.find(
      (type) => type.value === cropTypeValue
    );
    return cropType ? cropType.label : cropTypeValue;
  };

  // Table columns
  const columns = [
    {
      title: "Tên Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 250,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Mã Sản phẩm",
      dataIndex: "productCode",
      key: "productCode",
      width: 200,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "Đối tác Bảo hiểm",
      dataIndex: "insuranceProviderId",
      key: "insuranceProviderId",
      width: 180,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Loại Cây trồng",
      dataIndex: "cropType",
      key: "cropType",
      width: 180,
      render: (text) => <Tag color="green">{getCropTypeLabel(text)}</Tag>,
    },
    {
      title: "Tỷ lệ Phí BH Cơ sở (%)",
      dataIndex: "premiumBaseRate",
      key: "premiumBaseRate",
      width: 200,
      render: (rate) => <Text>{(rate * 100).toFixed(2)}%</Text>,
    },
    {
      title: "Thời hạn Bảo hiểm (Ngày)",
      dataIndex: "coverageDurationDays",
      key: "coverageDurationDays",
      width: 200,
      render: (days) => <Text>{days} ngày</Text>,
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <div className="policy-actions-cell">
          <Link href={`/policy/${record.id}`}>
            <Button
              type="dashed"
              size="small"
              className="policy-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
            >
              <EyeOutlined size={14} />
            </Button>
          </Link>
          <Button
            type="dashed"
            size="small"
            className="policy-action-btn !bg-green-100 !border-green-200 !text-green-800 hover:!bg-green-200"
          >
            <EditOutlined size={14} />
          </Button>
          <Button
            type="dashed"
            size="small"
            className="policy-action-btn !bg-purple-100 !border-purple-200 !text-purple-800 hover:!bg-purple-200"
          >
            <DownloadOutlined size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout.Content className="policy-content">
      <div className="policy-space">
        {/* Header */}
        <div className="policy-header">
          <div>
            <Title level={2} className="policy-title">
              <SafetyOutlined className="policy-icon" />
              Quản lý Chính sách Bảo hiểm
            </Title>
            <Text type="secondary" className="policy-subtitle">
              Quản lý các chính sách bảo hiểm nông nghiệp
            </Text>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="policy-summary-row">
          <div className="policy-summary-card-compact">
            <div className="policy-summary-icon total">
              <FileTextOutlined />
            </div>
            <div className="policy-summary-content">
              <div className="policy-summary-value-compact">
                {summaryStats.totalPolicies}
              </div>
              <div className="policy-summary-label-compact">
                Tổng số chính sách
              </div>
            </div>
          </div>

          <div className="policy-summary-card-compact">
            <div className="policy-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="policy-summary-content">
              <div className="policy-summary-value-compact">
                {summaryStats.activePolicies}
              </div>
              <div className="policy-summary-label-compact">Đang hoạt động</div>
            </div>
          </div>

          <div className="policy-summary-card-compact">
            <div className="policy-summary-icon providers">
              <TeamOutlined />
            </div>
            <div className="policy-summary-content">
              <div className="policy-summary-value-compact">
                {summaryStats.uniqueProviders}
              </div>
              <div className="policy-summary-label-compact">
                Đối tác bảo hiểm
              </div>
            </div>
          </div>

          <div className="policy-summary-card-compact">
            <div className="policy-summary-icon premium">
              <PercentageOutlined />
            </div>
            <div className="policy-summary-content">
              <div className="policy-summary-value-compact">
                {summaryStats.avgPremiumRate}%
              </div>
              <div className="policy-summary-label-compact">Phí BH TB</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div>
          <div className="flex justify-start items-center gap-2 mb-2">
            <Link href="/policy/create">
              <Button type="primary" icon={<SafetyOutlined />}>
                Tạo mới
              </Button>
            </Link>
            <Button icon={<DownloadOutlined />}>Nhập excel</Button>
            <Button icon={<DownloadOutlined />}>Xuất excel</Button>
            <SelectedColumn
              columns={columns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>

          <CustomTable
            columns={columns}
            dataSource={mockData.policies}
            visibleColumns={visibleColumns}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              total: mockData.policies.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} chính sách`,
            }}
          />
        </div>
      </div>
    </Layout.Content>
  );
}
