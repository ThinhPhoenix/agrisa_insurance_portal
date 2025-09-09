"use client";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    PlusOutlined,
    SearchOutlined
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Card,
    Input,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography
} from "antd";
import CropDetailsModal from "./partials/CropDetailsModal";
import CropFormDrawer from "./partials/CropFormDrawer";
import { formatYield, getCropTypeColor, getWaterRequirementColor, useCropDataManagement } from "./usecase/mockupUseCase";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function CropDataPage() {
    const {
        // State
        data,
        filteredData,
        loading,
        searchText,
        filters,
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

    const columns = [
        {
            title: "Ảnh đại diện",
            dataIndex: "avatar",
            key: "avatar",
            width: 80,
            render: (avatar) => <Avatar src={avatar} size="large" />,
        },
        {
            title: "Tên cây trồng",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, record) => (
                <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-gray-500">{record.profile.firstName}</div>
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
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                            className="text-blue-500 hover:text-blue-700"
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            className="text-green-500 hover:text-green-700"
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Xóa cây trồng"
                            description="Bạn có chắc muốn xóa cây trồng này?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {contextHolder}

            {/* Phần 1: Title và Search */}
            <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <Title level={2} className="!mb-1">Quản lý dữ liệu cây trồng</Title>
                        <p className="text-gray-600">
                            Xem và quản lý thông tin cây trồng với khả năng tìm kiếm và lọc dữ liệu.
                        </p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={handleAdd}
                    >
                        Thêm cây trồng
                    </Button>
                </div>
                <div className="mt-4">
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        <Search
                            placeholder="Tìm kiếm theo tên cây trồng, tên người dùng, loại cây hoặc tháng trồng/thu hoạch..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={handleSearch}
                            value={searchText}
                        />
                    </Space>
                </div>
            </Card>

            {/* Phần 2: Bộ lọc */}
            <Card className="shadow-sm">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-4">Bộ lọc</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loại cây</label>
                            <Select
                                placeholder="Chọn loại cây trồng"
                                style={{ width: '100%' }}
                                allowClear
                                onChange={(value) => handleFilterChange('type', value)}
                            >
                                {filterOptions?.cropTypes?.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nhu cầu nước</label>
                            <Select
                                placeholder="Chọn nhu cầu nước"
                                style={{ width: '100%' }}
                                allowClear
                                onChange={(value) => handleFilterChange('waterRequirement', value)}
                            >
                                {filterOptions?.waterRequirements?.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tháng trồng</label>
                            <Select
                                placeholder="Chọn tháng trồng"
                                style={{ width: '100%' }}
                                allowClear
                                onChange={(value) => handleFilterChange('plantingMonth', value)}
                            >
                                {filterOptions?.plantingMonths?.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button type="primary" icon={<FilterOutlined />} onClick={() => applyFilters(searchText, filters)}>
                            Áp dụng bộ lọc
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Phần 3: Bảng dữ liệu */}
            <Card className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} cây trồng`,
                        pageSizeOptions: ["5", "10", "20", "50"],
                    }}
                    scroll={{ x: 800 }}
                    size="middle"
                />

                <div className="mt-4 text-sm text-gray-500">
                    Tổng số cây trồng: {filteredData.length} | Hiển thị dữ liệu với 8 trường chính: Ảnh đại diện, Tên cây trồng, Tên người dùng, Loại cây, Tháng trồng, Tháng thu hoạch, Năng suất và Nhu cầu nước
                </div>
            </Card>

            {/* Drawer for Add/Edit */}
            <CropFormDrawer
                isDrawerVisible={isDrawerVisible}
                drawerTitle={drawerTitle}
                drawerMode={drawerMode}
                closeDrawer={closeDrawer}
                handleFormSubmit={handleFormSubmit}
                formRef={formRef}
                filterOptions={filterOptions}
            />

            {/* Modal for View Details */}
            <CropDetailsModal
                detailsModalVisible={detailsModalVisible}
                detailsRecord={detailsRecord}
                closeDetailsModal={closeDetailsModal}
                handleEdit={handleEdit}
            />
        </div>
    );
}