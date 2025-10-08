import { CustomForm } from "@/components/custom-form";
import { Button, Drawer, List, Space, Typography } from "antd";

const { Title } = Typography;

const FieldSelectionDrawer = ({
  sidebarVisible,
  closeSidebar,
  currentSection,
  sections,
  fieldLibrary,
  selectedField,
  selectField,
  selectedFieldType,
  setSelectedFieldType,
  addCustomField,
}) => (
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
                  selectedField?.id === field.id ? "#f0f8ff" : "transparent",
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
);

export default FieldSelectionDrawer;
