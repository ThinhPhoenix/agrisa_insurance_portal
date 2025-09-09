import {
    CloseOutlined,
    SaveOutlined
} from "@ant-design/icons";
import {
    Button,
    Divider,
    Drawer,
    Form,
    Grid,
    Input,
    InputNumber,
    Select,
    Space
} from "antd";

const { Option } = Select;
const { useBreakpoint } = Grid;

const CropFormDrawer = ({
    isDrawerVisible,
    drawerTitle,
    drawerMode,
    closeDrawer,
    handleFormSubmit,
    formRef,
    filterOptions
}) => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <Drawer
            title={drawerTitle}
            placement={isMobile ? "bottom" : "right"}
            width={isMobile ? "100%" : 520}
            height={isMobile ? "90%" : undefined}
            onClose={closeDrawer}
            open={isDrawerVisible}
            extra={
                <Space>
                    <Button onClick={closeDrawer} icon={<CloseOutlined />}>
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => formRef.current?.submit()}
                        icon={<SaveOutlined />}
                    >
                        {drawerMode === "add" ? "Thêm" : "Lưu"}
                    </Button>
                </Space>
            }
            bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
        >
            <Form
                ref={formRef}
                layout="vertical"
                onFinish={handleFormSubmit}
                initialValues={{
                    waterRequirement: "Trung bình",
                }}
            >
                <Divider orientation="left" className={isMobile ? 'text-sm' : ''}>Thông tin cơ bản</Divider>

                <Form.Item
                    name="name"
                    label="Tên cây trồng"
                    rules={[{ required: true, message: 'Vui lòng nhập tên cây trồng!' }]}
                >
                    <Input placeholder="Ví dụ: Lúa Jasmine" size={isMobile ? "large" : "default"} />
                </Form.Item>

                <Form.Item
                    name="username"
                    label="Tên người dùng"
                    rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
                >
                    <Input placeholder="Ví dụ: nguyen_van_an" size={isMobile ? "large" : "default"} />
                </Form.Item>

                <Form.Item
                    name="firstName"
                    label="Tên giống"
                    rules={[{ required: true, message: 'Vui lòng nhập tên giống!' }]}
                >
                    <Input placeholder="Ví dụ: ST25" size={isMobile ? "large" : "default"} />
                </Form.Item>

                <Form.Item
                    name="lastName"
                    label="Mô tả ngắn"
                >
                    <Input placeholder="Ví dụ: Lúa Jasmine" size={isMobile ? "large" : "default"} />
                </Form.Item>

                <Divider orientation="left" className={isMobile ? 'text-sm' : ''}>Thông tin canh tác</Divider>

                <Form.Item
                    name="type"
                    label="Loại cây"
                    rules={[{ required: true, message: 'Vui lòng chọn loại cây!' }]}
                >
                    <Select placeholder="Chọn loại cây trồng" size={isMobile ? "large" : "default"}>
                        {filterOptions?.cropTypes?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="plantingMonth"
                    label="Tháng trồng"
                    rules={[{ required: true, message: 'Vui lòng chọn tháng trồng!' }]}
                >
                    <Select placeholder="Chọn tháng trồng" size={isMobile ? "large" : "default"}>
                        {filterOptions?.plantingMonths?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="harvestMonth"
                    label="Tháng thu hoạch"
                    rules={[{ required: true, message: 'Vui lòng nhập tháng thu hoạch!' }]}
                >
                    <Input placeholder="Ví dụ: Tháng 11" size={isMobile ? "large" : "default"} />
                </Form.Item>

                <Form.Item
                    name="yieldPerAcre"
                    label="Năng suất (tấn/công)"
                    rules={[{ required: true, message: 'Vui lòng nhập năng suất!' }]}
                >
                    <InputNumber
                        min={0.1}
                        max={100}
                        step={0.1}
                        style={{ width: '100%' }}
                        placeholder="Ví dụ: 6.8"
                        size={isMobile ? "large" : "default"}
                    />
                </Form.Item>

                <Form.Item
                    name="waterRequirement"
                    label="Nhu cầu nước"
                    rules={[{ required: true, message: 'Vui lòng chọn nhu cầu nước!' }]}
                >
                    <Select placeholder="Chọn nhu cầu nước" size={isMobile ? "large" : "default"}>
                        {filterOptions?.waterRequirements?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Drawer>
    );
};

export default CropFormDrawer;
