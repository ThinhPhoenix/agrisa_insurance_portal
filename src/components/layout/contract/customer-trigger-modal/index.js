import CustomForm from "@/components/custom-form";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Typography,
} from "antd";

const { Option } = Select;
const { Text } = Typography;

const CustomTriggerModal = ({
  customTriggerModalVisible,
  closeCustomTriggerModal,
  customTriggerFormRef,
  customTriggerForm,
  customTriggerFields,
  handleCustomTriggerSubmit,
}) => {
  return (
    <Modal
      title="Tạo điều kiện kích hoạt tùy chỉnh"
      open={customTriggerModalVisible}
      onCancel={closeCustomTriggerModal}
      onOk={() => {
        customTriggerFormRef.current?.validateFields().then(() => {
          const customFormValues =
            customTriggerFormRef.current?.getFieldsValue();
          const conditions =
            customTriggerForm.getFieldValue("conditions") || [];
          handleCustomTriggerSubmit(
            { ...customFormValues, conditions },
            closeCustomTriggerModal
          );
        });
      }}
      width={900}
      okText="Tạo điều kiện"
      cancelText="Hủy"
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Chọn mẫu có sẵn hoặc tạo tùy chỉnh:</Text>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <Button
            size="small"
            onClick={() => {
              customTriggerFormRef.current?.setFieldsValue({
                triggerName: "Hạn hán",
                description: "Kích hoạt khi thiếu mưa kéo dài",
                severity: "high",
                logic: "AND",
                payoutPercent: 50,
              });
              customTriggerForm.setFieldsValue({
                conditions: [
                  {
                    metric: "rainfall_accumulated",
                    operator: "<",
                    threshold: 50,
                    timeWindow: "30d",
                  },
                ],
              });
            }}
          >
            Hạn hán
          </Button>
          <Button
            size="small"
            onClick={() => {
              customTriggerFormRef.current?.setFieldsValue({
                triggerName: "Lũ lụt",
                description: "Kích hoạt khi mưa lớn và ngập úng",
                severity: "severe",
                logic: "AND",
                payoutPercent: 80,
              });
              customTriggerForm.setFieldsValue({
                conditions: [
                  {
                    metric: "rainfall",
                    operator: ">",
                    threshold: 150,
                    timeWindow: "24h",
                  },
                  {
                    metric: "flood_index",
                    operator: ">",
                    threshold: 0.7,
                    timeWindow: "24h",
                  },
                ],
              });
            }}
          >
            Lũ lụt
          </Button>
          <Button
            size="small"
            onClick={() => {
              customTriggerFormRef.current?.setFieldsValue({
                triggerName: "Rét hại",
                description: "Kích hoạt khi nhiệt độ xuống quá thấp",
                severity: "moderate",
                logic: "AND",
                payoutPercent: 40,
              });
              customTriggerForm.setFieldsValue({
                conditions: [
                  {
                    metric: "temperature_min",
                    operator: "<",
                    threshold: 15,
                    timeWindow: "3d",
                  },
                ],
              });
            }}
          >
            Rét hại
          </Button>
        </div>
      </div>

      <CustomForm
        ref={customTriggerFormRef}
        fields={customTriggerFields}
        initialValues={{
          triggerName: "",
          description: "",
          severity: "moderate",
          logic: "AND",
          payoutPercent: 50,
        }}
        onSubmit={(values) =>
          handleCustomTriggerSubmit(values, closeCustomTriggerModal)
        }
        gridColumns="1fr 1fr"
        gap="16px"
      />

      <Divider>Điều kiện kích hoạt</Divider>

      <Form form={customTriggerForm} layout="vertical">
        <Form.List
          name="conditions"
          rules={[
            {
              validator: async (_, conditions) => {
                if (!conditions || conditions.length < 1) {
                  return Promise.reject(
                    new Error("Phải có ít nhất 1 điều kiện")
                  );
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: 16 }}
                  extra={
                    fields.length > 1 ? (
                      <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => remove(name)}
                      >
                        <CloseOutlined /> Xóa
                      </Button>
                    ) : null
                  }
                >
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "metric"]}
                        label="Chỉ số"
                        rules={[{ required: true, message: "Chọn chỉ số" }]}
                      >
                        <Select placeholder="Chọn chỉ số">
                          <Option value="rainfall">Lượng mưa</Option>
                          <Option value="rainfall_accumulated">
                            Lượng mưa tích lũy
                          </Option>
                          <Option value="temperature_min">
                            Nhiệt độ tối thiểu
                          </Option>
                          <Option value="temperature_max">
                            Nhiệt độ tối đa
                          </Option>
                          <Option value="temperature_avg">
                            Nhiệt độ trung bình
                          </Option>
                          <Option value="humidity">Độ ẩm</Option>
                          <Option value="wind_speed">Tốc độ gió</Option>
                          <Option value="ndvi_change">NDVI thay đổi</Option>
                          <Option value="flood_index">Chỉ số ngập lụt</Option>
                          <Option value="soil_moisture">Độ ẩm đất</Option>
                          <Option value="evi">EVI</Option>
                          <Option value="lai">LAI</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "operator"]}
                        label="Toán tử"
                        rules={[{ required: true, message: "Chọn toán tử" }]}
                      >
                        <Select placeholder="Toán tử">
                          <Option value=">">&gt;</Option>
                          <Option value="<">&lt;</Option>
                          <Option value=">=">&ge;</Option>
                          <Option value="<=">&le;</Option>
                          <Option value="=">=</Option>
                          <Option value="!=">&ne;</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "threshold"]}
                        label="Ngưỡng"
                        rules={[{ required: true, message: "Nhập ngưỡng" }]}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ví dụ: 50"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "timeWindow"]}
                        label="Khoảng thời gian"
                        rules={[
                          {
                            required: true,
                            message: "Chọn khoảng thời gian",
                          },
                        ]}
                      >
                        <Select placeholder="Chọn khoảng thời gian">
                          <Option value="1h">1 giờ</Option>
                          <Option value="6h">6 giờ</Option>
                          <Option value="24h">24 giờ</Option>
                          <Option value="3d">3 ngày</Option>
                          <Option value="7d">7 ngày</Option>
                          <Option value="14d">14 ngày</Option>
                          <Option value="30d">30 ngày</Option>
                          <Option value="60d">60 ngày</Option>
                          <Option value="90d">90 ngày</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm điều kiện
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default CustomTriggerModal;
