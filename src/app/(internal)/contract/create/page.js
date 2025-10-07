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
  Radio,
  Row,
  Select,
  Space,
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
  } = useContract();

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    await handleSubmit();
    message.success("Hợp đồng đã được tạo và gửi cho admin thẩm định!");
  };

  const renderField = (field) => {
    const key = `${field.id}_${field.instanceId}`;
    const value = formData[key] || "";

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
            <Form form={form} layout="vertical" onFinish={onFinish}>
              {sections.map((section) => (
                <Card
                  key={section.id}
                  title={section.name}
                  size="small"
                  className="section-card"
                  extra={
                    <Button
                      type="link"
                      size="small"
                      onClick={() => openSidebar(section.id)}
                    >
                      <PlusOutlined /> Thêm trường
                    </Button>
                  }
                >
                  {selectedFields[section.id].length === 0 ? (
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
                    selectedFields[section.id].map((field) => (
                      <div key={field.instanceId} className="field-item">
                        <Row align="middle" gutter={8}>
                          <Col flex="auto">{renderField(field)}</Col>
                          <Col flex="none">
                            <Button
                              type="text"
                              icon={<MinusOutlined />}
                              onClick={() =>
                                removeFieldFromSection(
                                  section.id,
                                  field.instanceId
                                )
                              }
                              danger
                            />
                          </Col>
                        </Row>
                      </div>
                    ))
                  )}
                </Card>
              ))}

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
        title="Thêm trường thông tin"
        placement="right"
        width={400}
        onClose={closeSidebar}
        open={sidebarVisible}
        footer={
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
        }
      >
        <div className="field-drawer-content">
          {/* Step 1: Select Section */}
          <div className="drawer-section">
            <Title level={5}>1. Chọn mục thông tin</Title>
            <Radio.Group
              value={selectedSection}
              onChange={(e) => selectSection(e.target.value)}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {sections.map((section) => (
                  <Radio key={section.id} value={section.id}>
                    {section.name}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <Divider />

          {/* Step 2: Select Field */}
          {selectedSection && (
            <div className="drawer-section">
              <Title level={5}>2. Chọn trường thông tin</Title>
              <List
                size="small"
                dataSource={fieldLibrary[selectedSection] || []}
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
          )}

          <Divider />

          {/* Step 3: Select Field Type */}
          {selectedField && (
            <div className="drawer-section">
              <Title level={5}>3. Chọn kiểu dữ liệu</Title>
              <Radio.Group
                value={selectedFieldType}
                onChange={(e) => setSelectedFieldType(e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="text">Văn bản</Radio>
                  <Radio value="textarea">Văn bản dài</Radio>
                  <Radio value="number">Số</Radio>
                  <Radio value="date">Ngày tháng</Radio>
                  <Radio value="select">Lựa chọn</Radio>
                  <Radio value="checkbox-group">Nhiều lựa chọn</Radio>
                  <Radio value="file">Tập tin</Radio>
                </Space>
              </Radio.Group>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
