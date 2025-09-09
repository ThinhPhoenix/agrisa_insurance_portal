import {
    Button,
    Drawer,
    Select,
    Space
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
    return (
        <Drawer
            title="Bộ lọc"
            placement="bottom"
            onClose={() => setMobileFilterVisible(false)}
            open={mobileFilterVisible}
            height="auto"
            extra={
                <Space>
                    <Button onClick={() => setMobileFilterVisible(false)}>Hủy</Button>
                    <Button
                        type="primary"
                        onClick={() => {
                            applyFilters(searchText, filters);
                            setMobileFilterVisible(false);
                        }}
                    >
                        Áp dụng
                    </Button>
                </Space>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại cây</label>
                    <Select
                        placeholder="Chọn loại cây trồng"
                        style={{ width: '100%' }}
                        allowClear
                        onChange={(value) => handleFilterChange('type', value)}
                        size="large"
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
                        size="large"
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
                        size="large"
                    >
                        {filterOptions?.plantingMonths?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>
            </div>
        </Drawer>
    );
};

export default MobileFilterDrawer;
