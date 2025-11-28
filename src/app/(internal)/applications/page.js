"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { useApplications } from "@/services/hooks/policy/use-pending-policies";
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
    "owner_id",
    "farm_name",
    "crop_type",
    "province",
    "created_at",
    "status",
    "action", // Always visible
  ]);

  const columns = [
    {
      title: "Mã đơn đăng ký",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id.localeCompare(b.id),
      ellipsis: true,
    },
    {
      title: "Mã chủ sở hữu",
      dataIndex: "owner_id",
      key: "owner_id",
      sorter: (a, b) => a.owner_id.localeCompare(b.owner_id),
    },
    {
      title: "Tên trang trại",
      dataIndex: "farm_name",
      key: "farm_name",
      sorter: (a, b) => a.farm_name.localeCompare(b.farm_name),
    },
    {
      title: "Loại cây trồng",
      dataIndex: "crop_type",
      key: "crop_type",
      filters: (filterOptions.cropTypes || []).map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.crop_type === value,
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Tỉnh",
      dataIndex: "province",
      key: "province",
      filters: (filterOptions.provinces || []).map((province) => ({
        text: province,
        value: province,
      })),
      onFilter: (value, record) => record.province === value,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
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
      options: (filterOptions.cropTypes || []).map((type) => ({
        label: type,
        value: type,
      })),
      value: filters.cropType,
    },
    {
      name: "province",
      label: "Tỉnh",
      type: "combobox",
      placeholder: "Chọn tỉnh",
      options: (filterOptions.provinces || []).map((province) => ({
        label: province,
        value: province,
      })),
      value: filters.province,
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
