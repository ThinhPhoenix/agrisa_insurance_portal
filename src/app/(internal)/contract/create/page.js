"use client";

import {
  CloseOutlined,
  FilePdfOutlined,
  MinusOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
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
  Typography,
  Upload,
} from "antd";
import { useContract } from "../use-contract";
import "./page.css";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

export default function CreateContractPage() {
  const {
    selectedFields,
    selectedSections,
    farmerFillFields,
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
    openSectionModal,
    closeSectionModal,
    toggleTempSection,
    confirmSections,
    removeSection,
    toggleFarmerFill,
  } = useContract();

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    await handleSubmit();
    message.success("Hợp đồng đã được tạo và gửi cho admin thẩm định!");
  };

  const renderField = (field, isFarmerFill = false) => {
    const key = `${field.id}_${field.instanceId}`;
    const value = formData[key] || "";

    // If field is fixed, display the fixed content
    if (field.mode === "fixed") {
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
    switch (field.type) {
      case "text":
        return (
          <Form.Item
            key={key}
            label={field.label}
            name={key}
            rules={field.required ? [{ required: true }] : []}
          >
            <Input
              value={value}
              onChange={(e) => updateFormData(key, e.target.value)}
              readOnly={field.readOnly}
            />
          </Form.Item>
        );
      case "textarea":
        return (
          <Form.Item
            key={key}
            label={field.label}
            name={key}
            rules={field.required ? [{ required: true }] : []}
          >
            <TextArea
              value={value}
              onChange={(e) => updateFormData(key, e.target.value)}
              rows={3}
            />
          </Form.Item>
        );
      case "number":
        return (
          <Form.Item
            key={key}
            label={field.label}
            name={key}
            rules={field.required ? [{ required: true }] : []}
          >
            <Input
              type="number"
              value={value}
              onChange={(e) => updateFormData(key, e.target.value)}
              readOnly={field.readOnly}
            />
          </Form.Item>
        );
      case "date":
        return (
          <Form.Item
            key={key}
            label={field.label}
            name={key}
            rules={field.required ? [{ required: true }] : []}
          >
            <DatePicker
              value={value}
              onChange={(date) => updateFormData(key, date)}
            />
          </Form.Item>
        );
      case "select":
        return (
          <Form.Item
            key={key}
            label={field.label}
            name={key}
            rules={field.required ? [{ required: true }] : []}
          >
            <Select value={value} onChange={(val) => updateFormData(key, val)}>
              {field.options?.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      case "checkbox-group":
        return (
          <Form.Item key={key} label={field.label} name={key}>
            <Checkbox.Group
              options={field.options}
              value={value}
              onChange={(vals) => updateFormData(key, vals)}
            />
          </Form.Item>
        );
      case "file":
        return (
          <Form.Item
            key={key}
            label={field.label}
            name={key}
            rules={field.required ? [{ required: true }] : []}
          >
            <Upload
              accept={field.accept}
              multiple={field.multiple}
              beforeUpload={() => false}
              onChange={(info) => updateFormData(key, info.fileList)}
            >
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          </Form.Item>
        );
      default:
        return null;
    }
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
                    }
                  >
                    {selectedFields[sectionId]?.length === 0 ? (
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
                  <Select
                    value={selectedFieldType}
                    onChange={(value) => setSelectedFieldType(value)}
                    style={{ width: 140 }}
                    size="small"
                  >
                    <Option value="text">Văn bản</Option>
                    <Option value="textarea">Văn bản dài</Option>
                    <Option value="number">Số</Option>
                    <Option value="date">Ngày tháng</Option>
                    <Option value="select">Lựa chọn</Option>
                    <Option value="checkbox-group">Nhiều lựa chọn</Option>
                    <Option value="file">Tập tin</Option>
                  </Select>
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
          <List
            dataSource={sections}
            renderItem={(section) => (
              <List.Item
                style={{
                  cursor: "pointer",
                  backgroundColor: tempSelectedSections.includes(section.id)
                    ? "#f0f8ff"
                    : "transparent",
                  borderRadius: "4px",
                  padding: "12px",
                  marginBottom: "8px",
                  border: tempSelectedSections.includes(section.id)
                    ? "1px solid #bae6fd"
                    : "1px solid #f0f0f0",
                }}
                onClick={() => toggleTempSection(section.id)}
              >
                <List.Item.Meta
                  avatar={
                    <Checkbox
                      checked={tempSelectedSections.includes(section.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTempSection(section.id);
                      }}
                    />
                  }
                  title={
                    <span
                      style={{
                        fontWeight: tempSelectedSections.includes(section.id)
                          ? "bold"
                          : "normal",
                        color: tempSelectedSections.includes(section.id)
                          ? "#1e40af"
                          : "inherit",
                      }}
                    >
                      {section.name}
                    </span>
                  }
                  description={
                    <div>
                      {section.id === "general" &&
                        "Thông tin cơ bản của hợp đồng như tên sản phẩm, thời hạn, phạm vi địa lý"}
                      {section.id === "personal" &&
                        "Thông tin cá nhân của người được bảo hiểm"}
                      {section.id === "contact" &&
                        "Thông tin liên lạc và địa chỉ"}
                      {section.id === "occupation" &&
                        "Thông tin về nghề nghiệp và thu nhập"}
                      {section.id === "identification" &&
                        "Giấy tờ tùy thân như CMND/CCCD, hộ chiếu"}
                      {section.id === "land" &&
                        "Thông tin về đất đai, diện tích, vị trí"}
                      {section.id === "crop" &&
                        "Thông tin về cây trồng và mùa vụ"}
                      {section.id === "insurance" &&
                        "Thông tin về bảo hiểm, phí, quyền lợi"}
                      {section.id === "beneficiary" &&
                        "Thông tin người thụ hưởng"}
                      {section.id === "documents" && "Tài liệu đính kèm, hồ sơ"}
                      {section.id === "confirmation" && "Xác nhận và cam kết"}
                      {section.id === "monitoring" &&
                        "Giám sát dữ liệu và điều kiện kích hoạt"}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
}
