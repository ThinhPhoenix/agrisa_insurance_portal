"use client";
import {
    AppstoreOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    MenuOutlined,
    PlusOutlined,
    SearchOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import {
    Avatar,
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
        <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
            {contextHolder}

            {/* Phần 1: Title và Action */}
            <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex justify-between items-center'}`}>
                <div>
                    <Title level={isMobile ? 3 : 2} className="!mb-1 text-primary">
                        {isMobile ? 'Quản lý cây trồng' : 'Quản lý dữ liệu cây trồng'}
                    </Title>
                    <p className="text-gray-600 text-sm">
                        Tổng số: <span className="font-semibold">{filteredData.length}</span> cây trồng
                    </p>
                </div>

                {isMobile && (
                    <div className="flex justify-between items-center">
                        <Button
                            icon={<MenuOutlined />}
                            onClick={() => setMobileFilterVisible(true)}
                            size="large"
                        >
                            Bộ lọc
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAdd}
                        >
                            Thêm
                        </Button>
                    </div>
                )}
            </div>

            {/* Phần 2: Tìm kiếm và Bộ lọc */}
            <div className="mb-6">
                <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-center mb-4'}`}>
                    <h3 className={`${isMobile ? 'text-base font-semibold' : 'text-lg font-semibold'}`}>
                        Tìm kiếm & Bộ lọc
                    </h3>

                    {!isMobile && (
                        <div className="flex space-x-3">
                            <Button.Group>
                                <Tooltip title="Xem dạng bảng">
                                    <Button
                                        type={viewMode === 'table' ? 'primary' : 'default'}
                                        icon={<UnorderedListOutlined />}
                                        onClick={() => setViewMode('table')}
                                        size="large"
                                    />
                                </Tooltip>
                                <Tooltip title="Xem dạng thẻ">
                                    <Button
                                        type={viewMode === 'card' ? 'primary' : 'default'}
                                        icon={<AppstoreOutlined />}
                                        onClick={() => setViewMode('card')}
                                        size="large"
                                    />
                                </Tooltip>
                            </Button.Group>

                            <Button
                                type="primary"
                                icon={<FilterOutlined />}
                                size="large"
                                className="shadow-md hover:shadow-lg transition-all"
                                onClick={() => applyFilters(searchText, filters)}
                            >
                                Áp dụng bộ lọc
                            </Button>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                className="shadow-md hover:shadow-lg transition-all"
                                onClick={handleAdd}
                            >
                                Thêm cây trồng
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <Search
                        placeholder={isMobile ? "Tìm kiếm..." : "Tìm kiếm theo tên cây trồng, tên người dùng, loại cây hoặc tháng trồng/thu hoạch..."}
                        allowClear
                        enterButton={<SearchOutlined />}
                        size={isMobile ? "default" : "large"}
                        onSearch={handleSearch}
                        value={searchText}
                        className="mb-4"
                    />
                </div>

                {!isMobile && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-md">
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
                        <div className="p-3 rounded-md">
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
                        <div className="p-3 rounded-md">
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
                )}
            </div>


            {/* Phần 3: Bảng dữ liệu / Card Grid / List View */}
            {viewMode === 'table' ? (
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: isMobile ? 5 : 10,
                        showSizeChanger: !isMobile,
                        showQuickJumper: !isMobile,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} cây trồng`,
                        pageSizeOptions: isMobile ? ["5", "10"] : ["5", "10", "20", "50"],
                    }}
                    scroll={{ x: isMobile ? 600 : 800 }}
                    size={isMobile ? "small" : "middle"}
                    className="border border-gray-200 rounded-md"
                />
            ) : viewMode === 'card' ? (
                <div className="grid-view">
                    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} className="mb-4">
                        {loading ? (
                            Array(isMobile ? 4 : 8).fill(null).map((_, index) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={`loading-${index}`}>
                                    <Card loading={true} className="h-full" />
                                </Col>
                            ))
                        ) : (
                            filteredData.map(record => (
                                <Col xs={24} sm={12} md={8} lg={6} key={record.id}>
                                    <Card
                                        hoverable
                                        className="h-full flex flex-col"
                                        cover={
                                            <div className={`${isMobile ? 'p-2' : 'p-4'} bg-gray-50 flex justify-center`}>
                                                <img
                                                    src={record.avatar}
                                                    alt={record.name}
                                                    className={`${isMobile ? 'w-full h-32' : 'w-full h-48'} object-cover rounded-md`}
                                                />
                                            </div>
                                        }
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
                                                title={<span className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>{record.name}</span>}
                                                description={record.username}
                                                className="mb-3"
                                            />
                                            <div className={`${isMobile ? 'mt-2 space-y-1' : 'mt-3 space-y-2'}`}>
                                                <div className="flex justify-between">
                                                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Loại cây:</span>
                                                    <Tag color={getCropTypeColor(record.cropDetails.type)} className={isMobile ? 'text-xs' : ''}>
                                                        {record.cropDetails.type}
                                                    </Tag>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Tháng trồng:</span>
                                                    <span className={isMobile ? 'text-xs' : ''}>{record.cropDetails.plantingMonth}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Năng suất:</span>
                                                    <span className={`${isMobile ? 'text-xs' : ''} font-medium`}>{formatYield(record.cropDetails.yieldPerAcre)}</span>
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
                                showSizeChanger={!isMobile}
                                showQuickJumper={!isMobile}
                                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} cây trồng`}
                                pageSizeOptions={isMobile ? ["8", "16"] : ["8", "16", "24", "48"]}
                                defaultPageSize={isMobile ? 8 : 16}
                                size={isMobile ? "small" : "default"}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <MobileListView
                    filteredData={filteredData}
                    loading={loading}
                    handleView={handleView}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                />
            )}

            {viewMode === 'table' && (
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
    );
}