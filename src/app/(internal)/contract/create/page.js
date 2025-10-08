"use client";

import { CustomForm } from "@/components/custom-form";
import {
  CloseOutlined,
  FilePdfOutlined,
  MinusOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  List,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useContract } from "../use-contract";
import "./page.css";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

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

export default function CreateContractPage() {
  const {
    selectedFields,
    selectedSections,
    farmerFillFields,
    dataMonitoringTiers,
    selectedTriggers,
    formData,
    addFieldToSection,
    removeFieldFromSection,
    updateFormData,
    handleSubmit,
    generatePDF,
    loading,
    submitted,
    fieldLibrary,
    sections,
    monitoringTiersData,
    triggerConditions,
    // Sidebar states and functions
    sidebarVisible,
    currentSection,
    selectedSection,
    selectedField,
    selectedFieldType,
    openSidebar,
    closeSidebar,
    selectSection,
    selectField,
    setSelectedFieldType,
    addCustomField,
    saveContract,
    cancelContract,
    // Section modal states and functions
    sectionModalVisible,
    tempSelectedSections,
    setTempSelectedSections,
    openSectionModal,
    closeSectionModal,
    toggleTempSection,
    confirmSections,
    removeSection,
    toggleFarmerFill,
    updateDataMonitoringTier,
    addTrigger,
    removeTrigger,
    updateTrigger,
    // Custom trigger functions
    getMetricDisplayName,
    getOperatorSymbol,
    getTimeWindowText,
    generateConditionText,
    handleCustomTriggerSubmit,
  } = useContract();

  const [form] = Form.useForm();
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [customTriggerModalVisible, setCustomTriggerModalVisible] =
    useState(false);
  const [customTriggerForm] = Form.useForm();
  const customTriggerFormRef = useRef();
  const [activeTab, setActiveTab] = useState("weather");

  // Reset form when switching tabs
  useEffect(() => {
    if (customTriggerForm) {
      customTriggerForm.resetFields();
    }
  }, [activeTab]);

  // Custom trigger form fields configuration
  const customTriggerFields = [
    {
      name: "triggerName",
      label: "Tên điều kiện",
      type: "input",
      required: true,
      placeholder: "Ví dụ: Hạn hán nghiêm trọng",
    },
    {
      name: "severity",
      label: "Mức độ nghiêm trọng",
      type: "select",
      required: true,
      placeholder: "Chọn mức độ",
      options: [
        { value: "low", label: "Thấp" },
        { value: "moderate", label: "Trung bình" },
        { value: "high", label: "Cao" },
        { value: "severe", label: "Nghiêm trọng" },
      ],
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
      required: true,
      placeholder: "Mô tả chi tiết về điều kiện kích hoạt",
    },
    {
      name: "logic",
      label: "Logic kết hợp các điều kiện",
      type: "select",
      required: true,
      placeholder: "Chọn logic kết hợp",
      options: [
        { value: "AND", label: "TẤT CẢ điều kiện phải đúng (VÀ)" },
        { value: "OR", label: "Ít nhất 1 điều kiện đúng (HOẶC)" },
      ],
    },
    {
      name: "payoutPercent",
      label: "Phần trăm bồi thường (%)",
      type: "number",
      required: true,
      placeholder: "Ví dụ: 50",
      min: 0,
      max: 100,
      addonAfter: "%",
    },
  ];

  // Custom trigger configuration functions
  const openCustomTriggerModal = () => {
    setCustomTriggerModalVisible(true);
    customTriggerFormRef.current?.setFieldsValue({
      triggerName: "",
      description: "",
      severity: "moderate",
      logic: "AND",
      payoutPercent: 50,
    });
    customTriggerForm.setFieldsValue({
      conditions: [
        {
          metric: "rainfall",
          operator: ">",
          threshold: 2000,
          timeWindow: "7d",
        },
      ],
    });
  };

  const closeCustomTriggerModal = () => {
    setCustomTriggerModalVisible(false);
    customTriggerForm.resetFields();
  };

  const onFinish = async (values) => {
    await handleSubmit();
    message.success("Hợp đồng đã được tạo và gửi cho admin thẩm định!");
  };

  const renderField = (field, isFarmerFill = false) => {
    const key = `${field.id}_${field.instanceId}`;
    const value = formData[key] || "";

    // If field is fixed, display the fixed content or special components
    if (field.mode === "fixed") {
      // Handle special fixed fields
      if (field.id === "weather_tier") {
        return (
          <Form.Item key={key} label={field.label}>
            <Select
              placeholder="Chọn tier trạm thời tiết"
              style={{ width: "100%" }}
              value={dataMonitoringTiers.weatherStations}
              onChange={(value) =>
                updateDataMonitoringTier("weatherStations", value)
              }
            >
              {Object.entries(monitoringTiersData.weatherStations).map(
                ([tierKey, tier]) => (
                  <Option key={tierKey} value={tierKey}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{tier.name}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {tier.description} - {tier.price.toLocaleString()}
                        đ/tháng
                      </div>
                    </div>
                  </Option>
                )
              )}
            </Select>
            {dataMonitoringTiers.weatherStations && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                <div>
                  <strong>Chỉ số:</strong>{" "}
                  {monitoringTiersData.weatherStations[
                    dataMonitoringTiers.weatherStations
                  ]?.metrics?.join(", ")}
                </div>
                <div>
                  <strong>Tần suất:</strong>{" "}
                  {
                    monitoringTiersData.weatherStations[
                      dataMonitoringTiers.weatherStations
                    ]?.frequency
                  }
                </div>
              </div>
            )}
          </Form.Item>
        );
      }

      if (field.id === "satellite_tier") {
        return (
          <Form.Item key={key} label={field.label}>
            <Select
              placeholder="Chọn tier vệ tinh"
              style={{ width: "100%" }}
              value={dataMonitoringTiers.satellite}
              onChange={(value) => updateDataMonitoringTier("satellite", value)}
            >
              {Object.entries(monitoringTiersData.satellite).map(
                ([tierKey, tier]) => (
                  <Option key={tierKey} value={tierKey}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{tier.name}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {tier.description} - {tier.price.toLocaleString()}
                        đ/tháng
                      </div>
                    </div>
                  </Option>
                )
              )}
            </Select>
            {dataMonitoringTiers.satellite && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                <div>
                  <strong>Chỉ số:</strong>{" "}
                  {monitoringTiersData.satellite[
                    dataMonitoringTiers.satellite
                  ]?.metrics?.join(", ")}
                </div>
                <div>
                  <strong>Độ phân giải:</strong>{" "}
                  {
                    monitoringTiersData.satellite[dataMonitoringTiers.satellite]
                      ?.resolution
                  }
                </div>
              </div>
            )}
          </Form.Item>
        );
      }

      // Default fixed content display
      return (
        <Form.Item key={key} label={field.label}>
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f9f9f9",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              minHeight: "32px",
              whiteSpace: "pre-wrap",
            }}
          >
            {field.fixedContent || "Nội dung cố định chưa được nhập"}
          </div>
        </Form.Item>
      );
    }

    // If section is farmer-fill, show blank spaces for dynamic fields
    if (isFarmerFill) {
      return (
        <Form.Item key={key} label={field.label}>
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#fff",
              border: "1px dashed #d9d9d9",
              borderRadius: "4px",
              minHeight: "32px",
              color: "#999",
              fontStyle: "italic",
            }}
          >
            {field.type === "textarea"
              ? "Khoản trống để nông dân điền..."
              : "Trống để nông dân điền..."}
          </div>
        </Form.Item>
      );
    }

    // Dynamic fields - render as normal inputs
    const getCustomFormFieldConfig = (field, key, value) => {
      const baseConfig = {
        name: key,
        label: field.label,
        required: field.required,
      };

      switch (field.type) {
        case "text":
          return {
            ...baseConfig,
            type: "input",
            placeholder: field.placeholder,
            readOnly: field.readOnly,
          };
        case "textarea":
          return {
            ...baseConfig,
            type: "textarea",
            placeholder: field.placeholder,
            rows: 3,
          };
        case "number":
          return {
            ...baseConfig,
            type: "number",
            placeholder: field.placeholder,
            readOnly: field.readOnly,
          };
        case "date":
          return {
            ...baseConfig,
            type: "datepicker",
            placeholder: field.placeholder,
          };
        case "select":
          return {
            ...baseConfig,
            type: "select",
            placeholder: field.placeholder,
            options: field.options?.map((option) => ({
              value: option,
              label: option,
            })),
          };
        case "checkbox-group":
          return {
            ...baseConfig,
            type: "checkbox",
            options: field.options?.map((option) => ({
              value: option,
              label: option,
            })),
          };
        case "file":
          return {
            ...baseConfig,
            type: "file",
            accept: field.accept,
            multiple: field.multiple,
          };
        default:
          return null;
      }
    };

    const fieldConfig = getCustomFormFieldConfig(field, key, value);
    if (!fieldConfig) return null;

    return (
      <CustomForm
        key={key}
        fields={[fieldConfig]}
        initialValues={{ [key]: value }}
        onValuesChange={(values) => updateFormData(key, values[key])}
      />
    );
  };

  if (submitted) {
    return (
      <div className="contract-success">
        <Card title="Hợp đồng đã được tạo thành công">
          <p>Hợp đồng của bạn đã được gửi cho admin để thẩm định.</p>
          <Space>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={generatePDF}
            >
              Xem PDF Preview
            </Button>
            <Button onClick={() => window.location.reload()}>
              Tạo hợp đồng mới
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="contract-create-page">
      <Row>
        {/* Main Form Area */}
        <Col span={24}>
          <Card title="Tạo hợp đồng bảo hiểm" className="contract-card">
            {/* Add Section Button */}
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={openSectionModal}
                size="large"
                className="add-section-button"
                style={{ width: "100%", height: 48 }}
              >
                Thêm Mục hợp đồng
              </Button>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
              {selectedSections.map((sectionId) => {
                const section = sections.find((s) => s.id === sectionId);
                return (
                  <Card
                    key={sectionId}
                    title={section?.name || sectionId}
                    size="small"
                    className="section-card"
                    extra={
                      sectionId === "data-monitoring" ||
                      sectionId === "trigger-conditions" ? (
                        <Button
                          type="link"
                          size="small"
                          danger
                          onClick={() => removeSection(sectionId)}
                        >
                          <CloseOutlined /> Xóa mục
                        </Button>
                      ) : (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => openSidebar(sectionId)}
                          >
                            <PlusOutlined /> Thêm trường thông tin
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => removeSection(sectionId)}
                          >
                            <CloseOutlined /> Xóa mục
                          </Button>
                        </Space>
                      )
                    }
                  >
                    {sectionId === "trigger-conditions" ? (
                      // Special rendering for trigger conditions section
                      <div>
                        <Tabs
                          defaultActiveKey="weather"
                          items={[
                            {
                              key: "weather",
                              label: "Thời tiết",
                              children: (
                                <div style={{ padding: "16px 0" }}>
                                  <div
                                    style={{
                                      marginBottom: 16,
                                      color: "#666",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Tạo điều kiện kích hoạt dựa trên dữ liệu
                                    thời tiết (mưa, nhiệt độ, gió...)
                                  </div>
                                  <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                      setTriggerModalVisible(true);
                                      // Set modal to weather tab
                                    }}
                                  >
                                    Tạo điều kiện thời tiết
                                  </Button>
                                </div>
                              ),
                            },
                            {
                              key: "satellite",
                              label: "Vệ tinh",
                              children: (
                                <div style={{ padding: "16px 0" }}>
                                  <div
                                    style={{
                                      marginBottom: 16,
                                      color: "#666",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Tạo điều kiện kích hoạt dựa trên dữ liệu vệ
                                    tinh (NDVI, độ ẩm đất...)
                                  </div>
                                  <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                      setTriggerModalVisible(true);
                                      // Set modal to satellite tab
                                    }}
                                  >
                                    Tạo điều kiện vệ tinh
                                  </Button>
                                </div>
                              ),
                            },
                            {
                              key: "combined",
                              label: "Kết hợp",
                              children: (
                                <div style={{ padding: "16px 0" }}>
                                  <div
                                    style={{
                                      marginBottom: 16,
                                      color: "#666",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Kết hợp nhiều điều kiện từ thời tiết và vệ
                                    tinh
                                  </div>
                                  <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                      setTriggerModalVisible(true);
                                      // Set modal to combined tab
                                    }}
                                  >
                                    Tạo điều kiện kết hợp
                                  </Button>
                                </div>
                              ),
                            },
                          ]}
                        />

                        {selectedTriggers.length > 0 && (
                          <>
                            <Divider />
                            <div style={{ marginBottom: 16 }}>
                              <strong>Điều kiện đã tạo:</strong>
                            </div>
                            {selectedTriggers.map((trigger) => (
                              <Card
                                key={trigger.id}
                                size="small"
                                style={{ marginBottom: 8 }}
                                extra={
                                  <Button
                                    type="link"
                                    size="small"
                                    danger
                                    onClick={() => removeTrigger(trigger.id)}
                                  >
                                    <CloseOutlined /> Xóa
                                  </Button>
                                }
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      marginBottom: 4,
                                    }}
                                  >
                                    {trigger.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#666",
                                      marginBottom: 8,
                                    }}
                                  >
                                    {trigger.description}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1890ff",
                                    }}
                                  >
                                    {trigger.conditionText ||
                                      "Chưa cấu hình điều kiện"}
                                  </div>
                                  {trigger.logic && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#fa8c16",
                                        marginTop: 2,
                                      }}
                                    >
                                      Logic:{" "}
                                      {trigger.logic === "AND"
                                        ? "TẤT CẢ điều kiện"
                                        : "Ít nhất 1 điều kiện"}
                                    </div>
                                  )}
                                  {trigger.payoutPercent && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#52c41a",
                                        marginTop: 4,
                                      }}
                                    >
                                      Bồi thường: {trigger.payoutPercent}%
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </>
                        )}
                      </div>
                    ) : sectionId === "data-monitoring" ? (
                      // Special rendering for data monitoring section
                      <div>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Card title="Trạm thời tiết" size="small">
                              <CustomForm
                                fields={[
                                  {
                                    name: "weatherTier",
                                    type: "select",
                                    placeholder: "Chọn tier trạm thời tiết",
                                    options: Object.entries(
                                      monitoringTiersData.weatherStations
                                    ).map(([tierKey, tier]) => ({
                                      value: tierKey,
                                      label: `${tier.name} - ${
                                        tier.description
                                      } - ${tier.price.toLocaleString()}đ/tháng`,
                                    })),
                                  },
                                ]}
                                initialValues={{
                                  weatherTier:
                                    dataMonitoringTiers.weatherStations,
                                }}
                                onValuesChange={(values) =>
                                  updateDataMonitoringTier(
                                    "weatherStations",
                                    values.weatherTier
                                  )
                                }
                              />
                              {dataMonitoringTiers.weatherStations && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  <div>
                                    <strong>Chỉ số:</strong>{" "}
                                    {monitoringTiersData.weatherStations[
                                      dataMonitoringTiers.weatherStations
                                    ]?.metrics?.join(", ")}
                                  </div>
                                  <div>
                                    <strong>Tần suất:</strong>{" "}
                                    {
                                      monitoringTiersData.weatherStations[
                                        dataMonitoringTiers.weatherStations
                                      ]?.frequency
                                    }
                                  </div>
                                </div>
                              )}
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card title="Vệ tinh" size="small">
                              <CustomForm
                                fields={[
                                  {
                                    name: "satelliteTier",
                                    type: "select",
                                    placeholder: "Chọn tier vệ tinh",
                                    options: Object.entries(
                                      monitoringTiersData.satellite
                                    ).map(([tierKey, tier]) => ({
                                      value: tierKey,
                                      label: `${tier.name} - ${
                                        tier.description
                                      } - ${tier.price.toLocaleString()}đ/tháng`,
                                    })),
                                  },
                                ]}
                                initialValues={{
                                  satelliteTier: dataMonitoringTiers.satellite,
                                }}
                                onValuesChange={(values) =>
                                  updateDataMonitoringTier(
                                    "satellite",
                                    values.satelliteTier
                                  )
                                }
                              />
                              {dataMonitoringTiers.satellite && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  <div>
                                    <strong>Chỉ số:</strong>{" "}
                                    {monitoringTiersData.satellite[
                                      dataMonitoringTiers.satellite
                                    ]?.metrics?.join(", ")}
                                  </div>
                                  <div>
                                    <strong>Độ phân giải:</strong>{" "}
                                    {
                                      monitoringTiersData.satellite[
                                        dataMonitoringTiers.satellite
                                      ]?.resolution
                                    }
                                  </div>
                                </div>
                              )}
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    ) : selectedFields[sectionId]?.length === 0 ? (
                      <p
                        style={{
                          color: "#999",
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        Chưa có trường nào. Nhấn "Thêm trường" để bắt đầu.
                      </p>
                    ) : (
                      selectedFields[sectionId]?.map((field) => (
                        <div key={field.instanceId} className="field-item">
                          <Row align="middle" gutter={8}>
                            <Col flex="auto">
                              {renderField(
                                field,
                                farmerFillFields[field.instanceId]
                              )}
                            </Col>
                            <Col flex="none">
                              <Space>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span
                                    style={{ fontSize: "11px", color: "#666" }}
                                  >
                                    Nông dân điền
                                  </span>
                                  <Switch
                                    size="small"
                                    checked={
                                      farmerFillFields[field.instanceId] ||
                                      false
                                    }
                                    onChange={() =>
                                      toggleFarmerFill(field.instanceId)
                                    }
                                  />
                                </div>
                                <Button
                                  type="text"
                                  icon={<MinusOutlined />}
                                  onClick={() =>
                                    removeFieldFromSection(
                                      sectionId,
                                      field.instanceId
                                    )
                                  }
                                  danger
                                />
                              </Space>
                            </Col>
                          </Row>
                        </div>
                      ))
                    )}
                  </Card>
                );
              })}

              <Divider />

              {/* Action Buttons */}
              <Form.Item>
                <Space>
                  <Button
                    type="default"
                    icon={<SaveOutlined />}
                    onClick={saveContract}
                  >
                    Lưu hợp đồng
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    htmlType="submit"
                    loading={loading}
                  >
                    Gửi kiểm duyệt
                  </Button>
                  <Button
                    type="default"
                    icon={<CloseOutlined />}
                    onClick={cancelContract}
                    danger
                  >
                    Hủy
                  </Button>
                  <Button icon={<FilePdfOutlined />} onClick={generatePDF}>
                    Xem PDF Preview
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Field Selection Drawer */}
      <Drawer
        title={`Thêm trường cho ${
          sections.find((s) => s.id === currentSection)?.name || "Mục thông tin"
        }`}
        placement="right"
        width={400}
        onClose={closeSidebar}
        open={sidebarVisible}
        footer={
          <div>
            {selectedField && (
              <div className="drawer-footer-selected">
                <div className="selected-field-name">
                  Đã chọn: {selectedField.label}
                </div>
                <div className="field-type-selector">
                  <span>Kiểu dữ liệu:</span>
                  <CustomForm
                    fields={[
                      {
                        name: "fieldType",
                        type: "select",
                        placeholder: "Chọn kiểu",
                        options: [
                          { value: "text", label: "Văn bản" },
                          { value: "textarea", label: "Văn bản dài" },
                          { value: "number", label: "Số" },
                          { value: "date", label: "Ngày tháng" },
                          { value: "select", label: "Lựa chọn" },
                          { value: "checkbox-group", label: "Nhiều lựa chọn" },
                          { value: "file", label: "Tập tin" },
                        ],
                        style: { width: 140 },
                        size: "small",
                      },
                    ]}
                    initialValues={{ fieldType: selectedFieldType }}
                    onValuesChange={(values) =>
                      setSelectedFieldType(values.fieldType)
                    }
                  />
                </div>
              </div>
            )}
            <Space>
              <Button onClick={closeSidebar}>Đóng</Button>
              <Button
                type="primary"
                onClick={addCustomField}
                disabled={!selectedField}
              >
                Thêm trường
              </Button>
            </Space>
          </div>
        }
      >
        <div className="field-drawer-content">
          {/* Select Field */}
          <div className="drawer-section">
            <Title level={5}>Chọn trường thông tin</Title>
            <List
              size="small"
              dataSource={fieldLibrary[currentSection] || []}
              renderItem={(field) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedField?.id === field.id
                        ? "#f0f8ff"
                        : "transparent",
                    borderRadius: "4px",
                    padding: "8px",
                  }}
                  onClick={() => selectField(field)}
                >
                  <List.Item.Meta
                    title={field.label}
                    description={`Kiểu: ${field.type}${
                      field.required ? " (Bắt buộc)" : " (Tùy chọn)"
                    }`}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Drawer>

      {/* Section Selection Modal */}
      <Modal
        title="Chọn mục bảo hiểm"
        open={sectionModalVisible}
        onCancel={closeSectionModal}
        onOk={confirmSections}
        width={600}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ marginBottom: 16, color: "#666" }}>
            Chọn các mục thông tin cần thiết cho hợp đồng bảo hiểm:
          </p>
          <CustomForm
            fields={[
              {
                name: "selectedSections",
                type: "checkbox-group",
                label: "Mục bảo hiểm",
                options: sections.map((section) => ({
                  value: section.id,
                  label: section.name,
                  description: (() => {
                    switch (section.id) {
                      case "general":
                        return "Thông tin cơ bản của hợp đồng như tên sản phẩm, thời hạn, phạm vi địa lý";
                      case "personal":
                        return "Thông tin cá nhân của người được bảo hiểm";
                      case "contact":
                        return "Thông tin liên lạc và địa chỉ";
                      case "occupation":
                        return "Thông tin về nghề nghiệp và thu nhập";
                      case "identification":
                        return "Giấy tờ tùy thân như CMND/CCCD, hộ chiếu";
                      case "land":
                        return "Thông tin về đất đai, diện tích, vị trí";
                      case "crop":
                        return "Thông tin về cây trồng và mùa vụ";
                      case "insurance":
                        return "Thông tin về bảo hiểm, phí, quyền lợi";
                      case "beneficiary":
                        return "Thông tin người thụ hưởng";
                      case "documents":
                        return "Tài liệu đính kèm, hồ sơ";
                      case "confirmation":
                        return "Xác nhận và cam kết";
                      case "data-monitoring":
                        return "Cấu hình giám sát dữ liệu thời tiết và vệ tinh";
                      case "trigger-conditions":
                        return "Điều kiện kích hoạt bảo hiểm tự động";
                      default:
                        return "";
                    }
                  })(),
                })),
                required: true,
              },
            ]}
            initialValues={{ selectedSections: tempSelectedSections }}
            onValuesChange={(values) => {
              setTempSelectedSections(values.selectedSections || []);
            }}
          />
        </div>
      </Modal>

      {/* Trigger Conditions Modal */}
      <Modal
        title="Thêm điều kiện kích hoạt"
        open={triggerModalVisible}
        onCancel={() => setTriggerModalVisible(false)}
        onOk={() => setTriggerModalVisible(false)}
        width={800}
        okText="Đóng"
        cancelText="Hủy"
      >
        <div style={{ padding: "8px 0" }}>
          <Tabs
            defaultActiveKey="weather"
            onChange={setActiveTab}
            items={[
              {
                key: "weather",
                label: "Điều kiện thời tiết",
                children: (
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
                ),
              },
              {
                key: "satellite",
                label: "Điều kiện vệ tinh",
                children: (
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
                ),
              },
              {
                key: "combined",
                label: "Điều kiện kết hợp",
                children: (
                  <div style={{ padding: "16px 0" }}>
                    <div
                      style={{
                        marginBottom: 16,
                        color: "#666",
                        fontSize: "14px",
                      }}
                    >
                      Tạo điều kiện kích hoạt kết hợp dữ liệu thời tiết và vệ
                      tinh
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
                            {fields.map(
                              ({ key, name, ...restField }, index) => (
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
                                          <Option value="rainfall">
                                            Lượng mưa
                                          </Option>
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
                                          <Option value="humidity">
                                            Độ ẩm
                                          </Option>
                                          <Option value="wind_speed">
                                            Tốc độ gió
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
                              )
                            )}

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
                            {fields.map(
                              ({ key, name, ...restField }, index) => (
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
                                          <Option value="soil_moisture">
                                            Độ ẩm đất
                                          </Option>
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
                              )
                            )}

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
                        rules={[
                          { required: true, message: "Chọn logic kết hợp" },
                        ]}
                      >
                        <Select placeholder="Chọn logic kết hợp">
                          <Option value="AND">
                            VÀ (Tất cả điều kiện phải đúng)
                          </Option>
                          <Option value="OR">
                            HOẶC (Ít nhất một điều kiện đúng)
                          </Option>
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
                ),
              },
            ]}
          />
        </div>
      </Modal>

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
    </div>
  );
}
