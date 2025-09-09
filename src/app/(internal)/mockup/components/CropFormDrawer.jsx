import {
    CloseOutlined,
    SaveOutlined
} from "@ant-design/icons";
import {
    Button,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Space
} from "antd";

const { Option } = Select;

const CropFormDrawer = ({
    isDrawerVisible,
    drawerTitle,
    drawerMode,
    closeDrawer,
    handleFormSubmit,
    formRef,
    filterOptions
}) => {
    return (
        <Drawer
            title={drawerTitle}
            placement="right"
            width={520}
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
        >
            <Form
                ref={formRef}
                layout="vertical"
                onFinish={handleFormSubmit}
                initialValues={{
                    waterRequirement: "Trung bình",
                }}
            >
                <Divider orientation="left">Thông tin cơ bản</Divider>

                <Form.Item
                    name="name"
                    label="Tên cây trồng"
                    rules={[{ required: true, message: 'Vui lòng nhập tên cây trồng!' }]}
                >
                    <Input placeholder="Ví dụ: Lúa Jasmine" />
                </Form.Item>

                <Form.Item
                    name="username"
                    label="Tên người dùng"
                    rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
                >
                    <Input placeholder="Ví dụ: nguyen_van_an" />
                </Form.Item>

                <Form.Item
                    name="firstName"
                    label="Tên giống"
                    rules={[{ required: true, message: 'Vui lòng nhập tên giống!' }]}
                >
                    <Input placeholder="Ví dụ: ST25" />
                </Form.Item>

                <Form.Item
                    name="lastName"
                    label="Mô tả ngắn"
                >
                    <Input placeholder="Ví dụ: Lúa Jasmine" />
                </Form.Item>

                <Divider orientation="left">Thông tin canh tác</Divider>

                <Form.Item
                    name="type"
                    label="Loại cây"
                    rules={[{ required: true, message: 'Vui lòng chọn loại cây!' }]}
                >
                    <Select placeholder="Chọn loại cây trồng">
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
                    <Select placeholder="Chọn tháng trồng">
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
                    <Input placeholder="Ví dụ: Tháng 11" />
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
                    />
                </Form.Item>

                <Form.Item
                    name="waterRequirement"
                    label="Nhu cầu nước"
                    rules={[{ required: true, message: 'Vui lòng chọn nhu cầu nước!' }]}
                >
                    <Select placeholder="Chọn nhu cầu nước">
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
