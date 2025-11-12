"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { useApplications } from "@/services/hooks/applications/use-applications";
import { EyeOutlined, FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Collapse, Layout, Select, Space, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import "./applications.css";

const { Title } = Typography;
const { Option } = Select;

export default function PendingApplicationsPage() {
  const router = useRouter();
  const {
    filteredData,
    filterOptions,
    searchText,
    filters,
    loading,
    handleFormSubmit,
    handleClearFilters,
  } = useApplications();

  // Visible columns state - action column is always visible
  const [visibleColumns, setVisibleColumns] = useState([
    "id",
    "farmer_name",
    "crop_type",
    "region",
    "submission_date",
    "risk_summary",
    "action", // Always visible
  ]);

  // Search fields for custom form
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm kiếm theo mã đơn, tên nông dân, loại cây trồng...",
      value: searchText,
    },
    {
      name: "cropType",
      label: "Loại cây trồng",
      type: "combobox",
      placeholder: "Chọn loại cây trồng",
      options: filterOptions.cropTypes.map((type) => ({
        label: type,
        value: type,
      })),
      value: filters.cropType,
    },
    {
      name: "region",
      label: "Khu vực",
      type: "combobox",
      placeholder: "Chọn khu vực",
      options: filterOptions.regions.map((region) => ({
        label: region,
        value: region,
      })),
      value: filters.region,
    },
    {
      name: "riskLevel",
      label: "Mức độ rủi ro",
      type: "combobox",
      placeholder: "Chọn mức độ rủi ro",
      options: filterOptions.riskLevels.map((level) => ({
        label: level,
        value: level,
      })),
      value: filters.riskLevel,
    },
    {
      name: "searchButton",
      label: " ",
      type: "button",
      variant: "primary",
      buttonText: "Tìm kiếm",
      startContent: <SearchOutlined size={14} />,
      isSubmit: true,
    },
    {
      name: "clearButton",
      label: " ",
      type: "button",
      variant: "dashed",
      buttonText: "Xóa bộ lọc",
      startContent: <FilterOutlined size={14} />,
      onClick: handleClearFilters,
    },
  ];

  const getRiskColor = (level) => {
    switch (level) {
      case "Low":
        return "green";
      case "Medium":
        return "orange";
      case "High":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Mã đơn đăng ký",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
      ellipsis: true,
    },
    {
      title: "Tên nông dân",
      dataIndex: "farmer_name",
      key: "farmer_name",
      sorter: (a, b) => a.farmer_name.localeCompare(b.farmer_name),
    },
    {
      title: "Loại cây trồng",
      dataIndex: "crop_type",
      key: "crop_type",
      filters: filterOptions.cropTypes.map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.crop_type === value,
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Vị trí trang trại",
      dataIndex: "region",
      key: "region",
      filters: filterOptions.regions.map((region) => ({
        text: region,
        value: region,
      })),
      onFilter: (value, record) => record.region === value,
    },
    {
      title: "Ngày gửi",
      dataIndex: "submission_date",
      key: "submission_date",
      sorter: (a, b) =>
        new Date(a.submission_date) - new Date(b.submission_date),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tóm tắt rủi ro",
      dataIndex: "risk_summary",
      key: "risk_summary",
      filters: filterOptions.riskLevels.map((level) => ({
        text: level,
        value: level,
      })),
      onFilter: (value, record) => record.risk_level === value,
      render: (summary, record) => (
        <Tag color={getRiskColor(record.risk_level)}>{summary}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/applications/${record.id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Layout.Content className="applications-content">
      <Space direction="vertical" size="large" className="applications-space">
        <Space direction="vertical" className="applications-space">
          <div className="applications-header">
            <div>
              <Title level={3} className="applications-title">
                Đơn đăng ký bảo hiểm đang chờ xử lý
              </Title>
              <Typography.Text type="secondary">
                Tổng số:{" "}
                <Typography.Text strong>{filteredData.length}</Typography.Text>{" "}
                đơn đăng ký
              </Typography.Text>
            </div>
          </div>
        </Space>

        <Collapse
          size="small"
          items={[
            {
              key: "1",
              label: (
                <Space>
                  <SearchOutlined />
                  Bộ lọc & Tìm kiếm
                </Space>
              ),
              children: (
                <CustomForm
                  fields={searchFields}
                  gridColumns="1fr 1fr 1fr 1fr 1fr 1fr"
                  gap="10px"
                  onSubmit={handleFormSubmit}
                />
              ),
            },
          ]}
        />

        <div className="applications-overflow">
          <div className="flex justify-end items-center gap-2 mb-2">
            <SelectedColumn
              columns={columns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>
          <CustomTable
            dataSource={filteredData}
            columns={columns}
            visibleColumns={visibleColumns}
            rowKey="id"
            scroll={{ x: true }}
            size="middle"
            pagination={true}
            loading={loading}
          />
        </div>
      </Space>
    </Layout.Content>
  );
}
