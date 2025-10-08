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
  Form,
  Row,
  Space,
  Switch,
  Tabs,
} from "antd";

const ContractForm = ({
  form,
  selectedSections,
  sections,
  selectedFields,
  farmerFillFields,
  dataMonitoringTiers,
  selectedTriggers,
  monitoringTiersData,
  fieldLibrary,
  onFinish,
  saveContract,
  cancelContract,
  generatePDF,
  loading,
  openSectionModal,
  removeSection,
  openSidebar,
  removeTrigger,
  updateDataMonitoringTier,
  toggleFarmerFill,
  removeFieldFromSection,
  renderField,
  selectedField,
  selectField,
  selectedFieldType,
  setSelectedFieldType,
  addCustomField,
  setTriggerModalVisible,
  setActiveTab,
}) => {
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
                                      setActiveTab("weather");
                                      setTriggerModalVisible(true);
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
                                      setActiveTab("satellite");
                                      setTriggerModalVisible(true);
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
                                      setActiveTab("combined");
                                      setTriggerModalVisible(true);
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
    </div>
  );
};

export default ContractForm;
