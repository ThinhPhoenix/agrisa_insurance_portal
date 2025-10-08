import { CustomForm } from "@/components/custom-form";
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
} from "antd";
import TriggerForm from "../trigger-form";

const { Option } = Select;

const TriggerConditionsModal = ({
  triggerModalVisible,
  setTriggerModalVisible,
  customTriggerForm,
  handleCustomTriggerSubmit,
  type = "weather",
}) => {
  const renderContent = () => {
    switch (type) {
      case "weather":
        return (
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                marginBottom: 16,
                color: "#666",
                fontSize: "14px",
              }}
            >
              Tạo điều kiện kích hoạt dựa trên dữ liệu thời tiết
            </div>
            <Form
              form={customTriggerForm}
              layout="vertical"
              onFinish={(values) =>
                handleCustomTriggerSubmit({
                  ...values,
                  type: "weather",
                })
              }
            >
              <TriggerForm
                type="weather"
                form={customTriggerForm}
                onFinish={(values) =>
                  handleCustomTriggerSubmit({
                    ...values,
                    type: "weather",
                  })
                }
              />
            </Form>
          </div>
        );

      case "satellite":
        return (
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                marginBottom: 16,
                color: "#666",
                fontSize: "14px",
              }}
            >
              Tạo điều kiện kích hoạt dựa trên dữ liệu vệ tinh
            </div>
            <Form
              form={customTriggerForm}
              layout="vertical"
              onFinish={(values) =>
                handleCustomTriggerSubmit({
                  ...values,
                  type: "satellite",
                })
              }
            >
              <TriggerForm
                type="satellite"
                form={customTriggerForm}
                onFinish={(values) =>
                  handleCustomTriggerSubmit({
                    ...values,
                    type: "satellite",
                  })
                }
              />
            </Form>
          </div>
        );

      case "combined":
        return (
          <div style={{ padding: "16px 0" }}>
            <div
              style={{
                marginBottom: 16,
                color: "#666",
                fontSize: "14px",
              }}
            >
              Tạo điều kiện kích hoạt kết hợp dữ liệu thời tiết và vệ tinh
            </div>
            <Form
              form={customTriggerForm}
              layout="vertical"
              onFinish={(values) =>
                handleCustomTriggerSubmit({
                  ...values,
                  type: "combined",
                })
              }
            >
              <CustomForm
                ref={customTriggerForm}
                fields={[
                  {
                    name: "triggerName",
                    label: "Tên điều kiện",
                    type: "input",
                    required: true,
                    placeholder: "Ví dụ: Mưa lớn + NDVI thấp",
                    gridColumn: "1fr",
                  },
                  {
                    name: "payoutPercent",
                    label: "Phần trăm bồi thường (%)",
                    type: "number",
                    required: true,
                    placeholder: "Ví dụ: 90",
                    min: 0,
                    max: 100,
                    endContent: "%",
                    gridColumn: "1fr",
                  },
                  {
                    name: "description",
                    label: "Mô tả",
                    type: "textarea",
                    required: true,
                    placeholder:
                      "Mô tả chi tiết về điều kiện kích hoạt kết hợp",
                    gridColumn: "1 / -1",
                  },
                ]}
                onSubmit={(values) =>
                  handleCustomTriggerSubmit({
                    ...values,
                    type: "combined",
                  })
                }
                formStyle={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              />

              <Divider>Điều kiện thời tiết</Divider>
              <Form.List name="weatherConditions">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <Card
                        key={key}
                        size="small"
                        style={{ marginBottom: 16 }}
                        extra={
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => remove(name)}
                          >
                            <CloseOutlined /> Xóa
                          </Button>
                        }
                      >
                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "metric"]}
                              label="Chỉ số thời tiết"
                              rules={[
                                {
                                  required: true,
                                  message: "Chọn chỉ số",
                                },
                              ]}
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
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              {...restField}
                              name={[name, "operator"]}
                              label="Toán tử"
                              rules={[
                                {
                                  required: true,
                                  message: "Chọn toán tử",
                                },
                              ]}
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
                              rules={[
                                {
                                  required: true,
                                  message: "Nhập ngưỡng",
                                },
                              ]}
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
                        Thêm điều kiện thời tiết
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Divider>Điều kiện vệ tinh</Divider>
              <Form.List name="satelliteConditions">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <Card
                        key={key}
                        size="small"
                        style={{ marginBottom: 16 }}
                        extra={
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => remove(name)}
                          >
                            <CloseOutlined /> Xóa
                          </Button>
                        }
                      >
                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, "metric"]}
                              label="Chỉ số vệ tinh"
                              rules={[
                                {
                                  required: true,
                                  message: "Chọn chỉ số",
                                },
                              ]}
                            >
                              <Select placeholder="Chọn chỉ số">
                                <Option value="ndvi">
                                  NDVI (Chỉ số thực vật)
                                </Option>
                                <Option value="evi">
                                  EVI (Chỉ số thực vật nâng cao)
                                </Option>
                                <Option value="soil_moisture">Độ ẩm đất</Option>
                                <Option value="crop_health">
                                  Sức khỏe cây trồng
                                </Option>
                                <Option value="flood_risk">
                                  Nguy cơ ngập lụt
                                </Option>
                                <Option value="drought_index">
                                  Chỉ số khô hạn
                                </Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              {...restField}
                              name={[name, "operator"]}
                              label="Toán tử"
                              rules={[
                                {
                                  required: true,
                                  message: "Chọn toán tử",
                                },
                              ]}
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
                              rules={[
                                {
                                  required: true,
                                  message: "Nhập ngưỡng",
                                },
                              ]}
                            >
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Ví dụ: 0.3"
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
                                <Option value="1d">1 ngày</Option>
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
                        Thêm điều kiện vệ tinh
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Divider>Logic kết hợp</Divider>
              <Form.Item
                name="combinationLogic"
                label="Logic kết hợp điều kiện"
                rules={[{ required: true, message: "Chọn logic kết hợp" }]}
              >
                <Select placeholder="Chọn logic kết hợp">
                  <Option value="AND">VÀ (Tất cả điều kiện phải đúng)</Option>
                  <Option value="OR">HOẶC (Ít nhất một điều kiện đúng)</Option>
                  <Option value="CUSTOM">
                    Tùy chỉnh (Sử dụng biểu thức logic)
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Tạo điều kiện kết hợp
                </Button>
              </Form.Item>
            </Form>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "weather":
        return "Thêm điều kiện kích hoạt thời tiết";
      case "satellite":
        return "Thêm điều kiện kích hoạt vệ tinh";
      case "combined":
        return "Thêm điều kiện kích hoạt kết hợp";
      default:
        return "Thêm điều kiện kích hoạt";
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={triggerModalVisible}
      onCancel={() => setTriggerModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setTriggerModalVisible(false)}>
          Đóng
        </Button>,
      ]}
      width={800}
      destroyOnClose
    >
      <div style={{ padding: "8px 0", maxHeight: "70vh", overflowY: "auto" }}>
        {renderContent()}
      </div>
    </Modal>
  );
};

export default TriggerConditionsModal;
