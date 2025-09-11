"use client";
import {
    AppstoreOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    PlusOutlined,
    SearchOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    Grid,
    Input,
    Pagination,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography
} from "antd";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CropDetailsModal from "./partials/CropDetailsModal";
import CropFormDrawer from "./partials/CropFormDrawer";
import MobileFilterDrawer from "./partials/MobileFilterDrawer";
import MobileListView from "./partials/MobileListView";
import { formatYield, getCropTypeColor, getWaterRequirementColor, useCropDataManagement } from "./usecase/mockupUseCase";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function CropDataPage() {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = screens.md && !screens.lg;

    // Add view state (table, card, or list for mobile)
    const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'table');
    const [mobileFilterVisible, setMobileFilterVisible] = useState(false);

    // Update view mode when screen size changes
    useEffect(() => {
        if (isMobile && viewMode === 'table') {
            setViewMode('list');
        } else if (!isMobile && viewMode === 'list') {
            setViewMode('table');
        }
    }, [isMobile, viewMode]);

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
            dataIndex: "image",
            key: "image",
            width: 100,
            render: (image) => <img src={image} alt="avatar" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '2px' }} />,
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
        <div className="min-h-full bg-secondary-50">
            {/* Mobile Header - Fixed */}
            {isMobile && (
                <div>
                    <div className="px-4 py-3">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-900 m-0 mb-1">
                                    Quản lý cây trồng
                                </h2>
                                <p className="text-sm text-gray-600 m-0">
                                    {filteredData.length} cây trồng
                                </p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                                <Button
                                    icon={<FilterOutlined />}
                                    onClick={() => setMobileFilterVisible(true)}
                                    size="small"
                                >
                                    Lọc
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={handleAdd}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                        {/* Mobile Search */}
                        <Search
                            placeholder="Tìm kiếm cây trồng..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="default"
                            onSearch={handleSearch}
                            value={searchText}
                        />
                    </div>
                </div>
            )}

            <div className={`${isMobile ? 'pt-0' : 'p-6 pt-8'} ${isMobile ? '' : 'space-y-3'}`}>
                {contextHolder}

                {/* Desktop Title và Action */}
                {!isMobile && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <Title level={3} className="!mb-1 text-primary">
                                    Quản lý dữ liệu cây trồng
                                </Title>
                                <p className="text-gray-600 text-sm">
                                    Tổng số: <span className="font-semibold">{filteredData.length}</span> cây trồng
                                </p>
                            </div>
                        </div>

                        {/* Desktop Search & Filter Section */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-base font-semibold">
                                    Tìm kiếm & Bộ lọc
                                </h3>
                                <div className="flex space-x-2">
                                    <Button.Group>
                                        <Tooltip title="Xem dạng bảng">
                                            <Button
                                                type={viewMode === 'table' ? 'primary' : 'default'}
                                                icon={<UnorderedListOutlined />}
                                                onClick={() => setViewMode('table')}
                                            />
                                        </Tooltip>
                                        <Tooltip title="Xem dạng thẻ">
                                            <Button
                                                type={viewMode === 'card' ? 'primary' : 'default'}
                                                icon={<AppstoreOutlined />}
                                                onClick={() => setViewMode('card')}
                                            />
                                        </Tooltip>
                                    </Button.Group>

                                    <Button
                                        type="primary"
                                        icon={<FilterOutlined />}
                                        className="shadow-sm hover:shadow-md transition-all"
                                        onClick={() => applyFilters(searchText, filters)}
                                    >
                                        Áp dụng bộ lọc
                                    </Button>

                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        className="shadow-sm hover:shadow-md transition-all"
                                        onClick={handleAdd}
                                    >
                                        Thêm cây trồng
                                    </Button>
                                </div>
                            </div>

                            {/* Desktop Search Bar */}
                            <div className="mb-3">
                                <Search
                                    placeholder="Tìm kiếm theo tên cây trồng, tên người dùng, loại cây hoặc tháng trồng/thu hoạch..."
                                    allowClear
                                    enterButton={<SearchOutlined />}
                                    size="default"
                                    onSearch={handleSearch}
                                    value={searchText}
                                    className="mb-3"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Filters */}
                {!isMobile && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-2 rounded-md">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Loại cây</label>
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
                        <div className="p-2 rounded-md">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nhu cầu nước</label>
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
                        <div className="p-2 rounded-md">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tháng trồng</label>
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
                )}

                {/* Mobile Content */}
                {isMobile && (
                    <div className="px-4 pb-4">
                        <MobileListView
                            filteredData={filteredData}
                            loading={loading}
                            handleView={handleView}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                        />
                    </div>
                )}

                {/* Desktop Data Display Section */}
                {!isMobile && viewMode === 'table' ? (
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 8,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} cây trồng`,
                            pageSizeOptions: ["8", "15", "30"],
                            size: "default"
                        }}
                        scroll={{ x: 800 }}
                        size="middle"
                        className="border border-gray-200 rounded-md"
                    />
                ) : !isMobile && viewMode === 'card' ? (
                    <div className="grid-view">
                        <Row gutter={[16, 16]} className="mb-4">
                            {loading ? (
                                Array(8).fill(null).map((_, index) => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={`loading-${index}`}>
                                        <Card loading={true} className="h-full" />
                                    </Col>
                                ))
                            ) : (
                                filteredData.map(record => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={record.id}>
                                        <Card
                                            hoverable
                                            className="h-full flex flex-col shadow-sm"
                                            cover={
                                                <div className="p-4 bg-gray-50 flex justify-center">
                                                    <img
                                                        src={record.avatar}
                                                        alt={record.name}
                                                        className="w-full h-48 object-cover rounded-md"
                                                    />
                                                </div>
                                            }
                                            size="default"
                                            actions={[
                                                <Tooltip title="Xem chi tiết" key="view">
                                                    <EyeOutlined onClick={() => handleView(record)} />
                                                </Tooltip>,
                                                <Tooltip title="Chỉnh sửa" key="edit">
                                                    <EditOutlined onClick={() => handleEdit(record)} />
                                                </Tooltip>,
                                                <Popconfirm
                                                    key="delete"
                                                    title="Xóa cây trồng"
                                                    description="Bạn có chắc muốn xóa cây trồng này?"
                                                    onConfirm={() => handleDelete(record.id)}
                                                    okText="Có"
                                                    cancelText="Không"
                                                >
                                                    <DeleteOutlined />
                                                </Popconfirm>
                                            ]}
                                        >
                                            <div className="mb-auto">
                                                <Card.Meta
                                                    title={
                                                        <span className="text-lg font-semibold line-clamp-2">
                                                            {record.name}
                                                        </span>
                                                    }
                                                    description={
                                                        <span className="text-sm text-gray-600">
                                                            {record.username}
                                                        </span>
                                                    }
                                                    className="mb-3"
                                                />
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-500">Loại:</span>
                                                        <Tag
                                                            color={getCropTypeColor(record.cropDetails.type)}
                                                            className="m-0"
                                                        >
                                                            {record.cropDetails.type}
                                                        </Tag>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Trồng:</span>
                                                        <span className="text-sm font-medium">
                                                            {record.cropDetails.plantingMonth}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Năng suất:</span>
                                                        <span className="text-sm font-medium text-green-600">
                                                            {formatYield(record.cropDetails.yieldPerAcre)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))
                            )}
                        </Row>
                        {filteredData.length > 0 && (
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    total={filteredData.length}
                                    showSizeChanger={true}
                                    showQuickJumper={true}
                                    showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} cây trồng`}
                                    pageSizeOptions={["12", "24", "48"]}
                                    defaultPageSize={24}
                                    size="default"
                                />
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Summary Footer - Desktop only */}
                {!isMobile && viewMode === 'table' && (
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                            <i className="text-gray-400">Hiển thị: Ảnh đại diện, Tên cây trồng, Tên người dùng, Loại cây, Tháng trồng, Tháng thu hoạch, Năng suất, Nhu cầu nước</i>
                        </span>
                        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                            Tổng cộng: {filteredData.length} cây trồng
                        </span>
                    </div>
                )}



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

                {/* Mobile Filter Drawer */}
                <MobileFilterDrawer
                    mobileFilterVisible={mobileFilterVisible}
                    setMobileFilterVisible={setMobileFilterVisible}
                    filterOptions={filterOptions}
                    handleFilterChange={handleFilterChange}
                    applyFilters={applyFilters}
                    searchText={searchText}
                    filters={filters}
                />
            </div>
        </div>
    );
}