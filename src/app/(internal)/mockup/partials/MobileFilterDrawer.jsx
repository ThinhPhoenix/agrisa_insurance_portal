import {
    Button,
    Drawer,
    Select
} from "antd";

const { Option } = Select;

const MobileFilterDrawer = ({
    mobileFilterVisible,
    setMobileFilterVisible,
    filterOptions,
    handleFilterChange,
    applyFilters,
    searchText,
    filters
}) => {
    const handleClearFilters = () => {
        handleFilterChange('type', null);
        handleFilterChange('waterRequirement', null);
        handleFilterChange('plantingMonth', null);
    };

    return (
        <Drawer
            title="Bộ lọc tìm kiếm"
            placement="bottom"
            onClose={() => setMobileFilterVisible(false)}
            open={mobileFilterVisible}
            height="60vh"
            bodyStyle={{ paddingBottom: 80 }}
            footer={
                <div className="flex space-x-2 p-4 bg-white border-t">
                    <Button
                        size="large"
                        className="flex-1"
                        onClick={handleClearFilters}
                    >
                        Xóa bộ lọc
                    </Button>
                    <Button
                        size="large"
                        onClick={() => setMobileFilterVisible(false)}
                        className="flex-1"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        className="flex-1"
                        onClick={() => {
                            applyFilters(searchText, filters);
                            setMobileFilterVisible(false);
                        }}
                    >
                        Áp dụng
                    </Button>
                </div>
            }
        >
            <div className="space-y-6 pb-20">
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-700 m-0">
                        Chọn các tiêu chí bên dưới để lọc danh sách cây trồng
                    </p>
                </div>

                <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">Loại cây trồng</label>
                    <Select
                        placeholder="Chọn loại cây trồng"
                        style={{ width: '100%' }}
                        allowClear
                        onChange={(value) => handleFilterChange('type', value)}
                        size="large"
                        value={filters.type}
                    >
                        {filterOptions?.cropTypes?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">Nhu cầu nước</label>
                    <Select
                        placeholder="Chọn mức nhu cầu nước"
                        style={{ width: '100%' }}
                        allowClear
                        onChange={(value) => handleFilterChange('waterRequirement', value)}
                        size="large"
                        value={filters.waterRequirement}
                    >
                        {filterOptions?.waterRequirements?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">Tháng trồng</label>
                    <Select
                        placeholder="Chọn tháng trồng"
                        style={{ width: '100%' }}
                        allowClear
                        onChange={(value) => handleFilterChange('plantingMonth', value)}
                        size="large"
                        value={filters.plantingMonth}
                    >
                        {filterOptions?.plantingMonths?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>

                {/* Filter Status */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Bộ lọc hiện tại:</p>
                    <div className="flex flex-wrap gap-1">
                        {filters.type && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Loại: {filters.type}
                            </span>
                        )}
                        {filters.waterRequirement && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                Nước: {filters.waterRequirement}
                            </span>
                        )}
                        {filters.plantingMonth && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                Tháng: {filters.plantingMonth}
                            </span>
                        )}
                        {!filters.type && !filters.waterRequirement && !filters.plantingMonth && (
                            <span className="text-gray-500 text-xs italic">Chưa có bộ lọc nào</span>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default MobileFilterDrawer;
