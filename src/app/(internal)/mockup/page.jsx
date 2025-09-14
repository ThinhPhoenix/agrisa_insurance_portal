"use client";

import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    PlusOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Layout, Popconfirm, Space, Tag, Typography } from "antd";
import CropDetailsModal from "./partials/CropDetailsModal";
import CropFormDrawer from "./partials/CropFormDrawer";
import { formatYield, getCropTypeColor, getWaterRequirementColor, useCropDataManagement } from "./usecase/mockupUseCase";

const { Title } = Typography;

export default function CropDataPage() {

    const {
        // State
        filteredData,
        loading,
        isDrawerVisible,
        currentRecord,
        drawerTitle,
        drawerMode,
        detailsModalVisible,
        detailsRecord,
        formRef,
        contextHolder,

        // Actions
        handleSearch,
        handleFilterChange,
        handleAdd,
        handleEdit,
        handleView,
        handleDelete,
        handleFormSubmit,
        applyFilters,
        closeDrawer,
        closeDetailsModal,

        // Data
        filterOptions,
    } = useCropDataManagement();

    // Filter columns with table's built-in filters
    const columns = [
        {
            title: "Ảnh đại diện",
            dataIndex: "avatar",
            key: "avatar",
            width: 100,
            render: (avatar) => (
                <img
                    src={avatar}
                    alt="crop"
                    style={{
                        width: '60px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #f0f0f0'
                    }}
                />
            ),
        },
        {
            title: "Tên cây trồng",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            ellipsis: true,
            render: (name, record) => (
                <div>
                    <Typography.Text strong>{name}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">{record.profile?.firstName}</Typography.Text>
                </div>
            ),
        },
        {
            title: "Tên người dùng",
            dataIndex: "username",
            key: "username",
            sorter: (a, b) => a.username.localeCompare(b.username),
        },
        {
            title: "Loại cây",
            dataIndex: ["cropDetails", "type"],
            key: "type",
            filters: filterOptions?.cropTypes?.map(option => ({
                text: option.label,
                value: option.value
            })) || [],
            onFilter: (value, record) => record.cropDetails.type === value,
            render: (type) => {
                return <Tag color={getCropTypeColor(type)}>{type}</Tag>;
            },
        },
        {
            title: "Tháng trồng",
            dataIndex: ["cropDetails", "plantingMonth"],
            key: "plantingMonth",
            sorter: (a, b) => a.cropDetails.plantingMonth.localeCompare(b.cropDetails.plantingMonth),
        },
        {
            title: "Tháng thu hoạch",
            dataIndex: ["cropDetails", "harvestMonth"],
            key: "harvestMonth",
            sorter: (a, b) => a.cropDetails.harvestMonth.localeCompare(b.cropDetails.harvestMonth),
        },
        {
            title: "Năng suất (tấn/công)",
            dataIndex: ["cropDetails", "yieldPerAcre"],
            key: "yieldPerAcre",
            sorter: (a, b) => a.cropDetails.yieldPerAcre - b.cropDetails.yieldPerAcre,
            render: (yieldValue) => formatYield(yieldValue),
        },
        {
            title: "Nhu cầu nước",
            dataIndex: ["cropDetails", "waterRequirement"],
            key: "waterRequirement",
            filters: filterOptions?.waterRequirements?.map(option => ({
                text: option.label,
                value: option.value
            })) || [],
            onFilter: (value, record) => record.cropDetails.waterRequirement === value,
            render: (requirement) => {
                return <Tag color={getWaterRequirementColor(requirement)}>{requirement}</Tag>;
            },
        },
        {
            title: "Thao tác",
            key: "action",
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="dashed"
                        size="small"
                        style={{
                            backgroundColor: '#e6f4ff',
                            borderColor: '#91caff',
                            color: '#0958d9'
                        }}
                        onClick={() => handleView(record)}
                    >
                        <EyeOutlined style={{ fontSize: 14 }} />
                    </Button>
                    <Button
                        type="dashed"
                        size="small"
                        style={{
                            backgroundColor: '#fff7e6',
                            borderColor: '#ffd591',
                            color: '#d46b08'
                        }}
                        onClick={() => handleEdit(record)}
                    >
                        <EditOutlined style={{ fontSize: 14 }} />
                    </Button>
                    <Popconfirm
                        title="Xóa cây trồng"
                        description="Bạn có chắc muốn xóa cây trồng này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button
                            type="dashed"
                            size="small"
                            style={{
                                backgroundColor: '#fff1f0',
                                borderColor: '#ffa39e',
                                color: '#cf1322'
                            }}
                        >
                            <DeleteOutlined style={{ fontSize: 14 }} />
                        </Button>
                    </Popconfirm>
                </Space>
            ),
            fixed: "right",
            width: 150,
        },
    ];

    // Search fields for custom form
    const searchFields = [
        {
            name: "name",
            label: "Tên cây trồng",
            type: "input",
            placeholder: "Tên cây trồng",
        },
        {
            name: "username",
            label: "Tên người dùng",
            type: "input",
            placeholder: "Tên người dùng",
        },
        {
            name: "cropType",
            label: "Loại cây",
            type: "combobox",
            placeholder: "Chọn loại cây trồng",
            options: filterOptions?.cropTypes || [],
        },
        {
            name: "waterRequirement",
            label: "Nhu cầu nước",
            type: "combobox",
            placeholder: "Chọn nhu cầu nước",
            options: filterOptions?.waterRequirements || [],
        },
        {
            name: "search",
            label: " ",
            type: "button",
            variant: "primary",
            buttonText: "Tìm kiếm",
            startContent: <SearchOutlined size={14} />,
            isSubmit: true,
        },
        {
            name: "clear",
            label: " ",
            type: "button",
            variant: "dashed",
            buttonText: "Xóa bộ lọc",
            startContent: <FilterOutlined size={14} />,
        },
        {
            name: "add",
            label: " ",
            type: "button",
            variant: "primary",
            buttonText: "Thêm cây trồng",
            startContent: <PlusOutlined size={14} />,
        },
    ];

    return (
        <Layout.Content style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Title level={3} style={{ marginBottom: 4 }}>
                        Quản lý dữ liệu cây trồng
                    </Title>
                    <Typography.Text type="secondary">
                        Tổng số: <Typography.Text strong>{filteredData.length}</Typography.Text> cây trồng
                    </Typography.Text>
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
                                    gridColumns="1fr 1fr 1fr 1fr"
                                    gap="10px"
                                />
                            ),
                        },
                    ]}
                />

                <div style={{ overflowX: 'auto' }}>
                    <CustomTable
                        dataSource={filteredData}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        scroll={{ x: true }}
                        size="middle"
                    />
                </div>
            </Space>

            {/* Modals and Drawers */}
            <CropDetailsModal
                visible={detailsModalVisible}
                data={detailsRecord}
                onClose={closeDetailsModal}
            />

            <CropFormDrawer
                visible={isDrawerVisible}
                title={drawerTitle}
                mode={drawerMode}
                formRef={formRef}
                initialValues={currentRecord}
                onClose={closeDrawer}
                onSubmit={handleFormSubmit}
            />

            {contextHolder}
        </Layout.Content>
    );
}