import { CustomForm } from "@/components/custom-form";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";

const { Option } = Select;

// Trigger Form Component
const TriggerForm = ({ type, form, onFinish }) => {
  const basicFields = [
    {
      name: "triggerName",
      label: "Tên điều kiện",
      type: "input",
      required: true,
      placeholder:
        type === "weather"
          ? "Ví dụ: Mưa lớn"
          : type === "satellite"
          ? "Ví dụ: Thiệt hại cây trồng"
          : "Ví dụ: Mưa lớn + NDVI thấp",
    },
    {
      name: "payoutPercent",
      label: "Phần trăm bồi thường (%)",
      type: "number",
      required: true,
      placeholder:
        type === "weather"
          ? "Ví dụ: 50"
          : type === "satellite"
          ? "Ví dụ: 75"
          : "Ví dụ: 90",
      min: 0,
      max: 100,
      endContent: "%",
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
      required: true,
      placeholder: "Mô tả chi tiết về điều kiện kích hoạt",
    },
  ];

  if (type === "combined") {
    basicFields.push({
      name: "combinationLogic",
      label: "Logic kết hợp điều kiện",
      type: "select",
      required: true,
      options: [
        { label: "VÀ (Tất cả điều kiện phải đúng)", value: "AND" },
        { label: "HOẶC (Ít nhất một điều kiện đúng)", value: "OR" },
        { label: "Tùy chỉnh (Sử dụng biểu thức logic)", value: "CUSTOM" },
      ],
    });
  }

  return (
    <div>
      <CustomForm
        ref={form}
        fields={basicFields}
        onSubmit={onFinish}
        formStyle={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      />

      {type === "combined" ? (
        <>
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
                          rules={[{ required: true, message: "Chọn chỉ số" }]}
                        >
                          <Select placeholder="Chọn chỉ số">
                            <Option value="ndvi">NDVI (Chỉ số thực vật)</Option>
                            <Option value="evi">
                              EVI (Chỉ số thực vật nâng cao)
                            </Option>
                            <Option value="soil_moisture">Độ ẩm đất</Option>
                            <Option value="crop_health">
                              Sức khỏe cây trồng
                            </Option>
                            <Option value="flood_risk">Nguy cơ ngập lụt</Option>
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
        </>
      ) : (
        <>
          <Divider>
            Điều kiện {type === "weather" ? "thời tiết" : "vệ tinh"}
          </Divider>
          <Form.List name="conditions">
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
                          label={`Chỉ số ${
                            type === "weather" ? "thời tiết" : "vệ tinh"
                          }`}
                          rules={[{ required: true, message: "Chọn chỉ số" }]}
                        >
                          <Select placeholder="Chọn chỉ số">
                            {type === "weather" ? (
                              <>
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
                              </>
                            ) : (
                              <>
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
                              </>
                            )}
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
                            placeholder={
                              type === "weather" ? "Ví dụ: 50" : "Ví dụ: 0.3"
                            }
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
                            {type === "weather" ? (
                              <>
                                <Option value="1h">1 giờ</Option>
                                <Option value="6h">6 giờ</Option>
                                <Option value="24h">24 giờ</Option>
                                <Option value="3d">3 ngày</Option>
                                <Option value="7d">7 ngày</Option>
                                <Option value="14d">14 ngày</Option>
                                <Option value="30d">30 ngày</Option>
                                <Option value="60d">60 ngày</Option>
                                <Option value="90d">90 ngày</Option>
                              </>
                            ) : (
                              <>
                                <Option value="1d">1 ngày</Option>
                                <Option value="3d">3 ngày</Option>
                                <Option value="7d">7 ngày</Option>
                                <Option value="14d">7 ngày</Option>
                                <Option value="14d">14 ngày</Option>
                                <Option value="30d">30 ngày</Option>
                                <Option value="60d">60 ngày</Option>
                                <Option value="90d">90 ngày</Option>
                              </>
                            )}
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
                    Thêm điều kiện{" "}
                    {type === "weather" ? "thời tiết" : "vệ tinh"}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </>
      )}

      <Form.Item style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" block>
          Tạo điều kiện{" "}
          {type === "weather"
            ? "thời tiết"
            : type === "satellite"
            ? "vệ tinh"
            : "kết hợp"}
        </Button>
      </Form.Item>
    </div>
  );
};

export default TriggerForm;
