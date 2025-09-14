import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Checkbox,
  Radio,
  Upload,
  Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const CustomForm = forwardRef(function CustomForm(
  {
    fields,
    initialValues,
    onSubmit,
    onValuesChange,
    formStyle,
    gridColumns = "1fr",
    gap = "0px",
  },
  ref
) {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    validateFields: () => form.validateFields(),
    getFieldsValue: () => form.getFieldsValue(),
    resetFields: () => form.resetFields(),
    setFieldsValue: (values) => form.setFieldsValue(values),
  }));

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleValuesChange = (changedValues, allValues) => {
    onValuesChange && onValuesChange(allValues);
  };

  const handleSubmit = (values) => {
    onSubmit && onSubmit(values);
  };

  const renderField = (field) => {
    let rules = [];

    // If field has custom rules, use them
    if (field.rules) {
      rules = [...field.rules];
    } else {
      // Only add default required rule if no custom rules provided
      if (field.required) {
        rules.push({
          required: true,
          message: `Vui lòng ${
            field.type === "select" || field.type === "multiselect"
              ? "chọn"
              : "nhập"
          } ${field.label.toLowerCase()}!`,
        });
      }

      if (field.maxLength) {
        rules.push({
          max: field.maxLength,
          message: `${field.label} không được vượt quá ${field.maxLength} ký tự!`,
        });
      }
    }

    switch (field.type) {
      case "input":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Input
              placeholder={field.placeholder}
              style={field.inputStyle ?? field.style}
              className={field.className}
              disabled={field.disabled}
              prefix={field.startContent}
              suffix={field.endContent}
              onChange={(e) => {
                field?.onChange && field.onChange(e.target.value, form);
              }}
            />
          </Form.Item>
        );
      case "password":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Input.Password
              placeholder={field.placeholder}
              style={field.inputStyle ?? field.style}
              className={field.className}
              disabled={field.disabled}
              prefix={field.startContent}
              suffix={field.endContent}
              onChange={(e) => {
                field?.onChange && field.onChange(e.target.value, form);
              }}
            />
          </Form.Item>
        );
      case "number":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <InputNumber
              placeholder={field.placeholder}
              style={{ width: "100%", ...(field.inputStyle ?? field.style) }}
              className={field.className}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(value) => {
                field?.onChange && field.onChange(value, form);
              }}
            />
          </Form.Item>
        );
      case "select":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Select
              placeholder={field.placeholder}
              style={field.inputStyle ?? field.style}
              className={field.className}
              disabled={field.disabled}
              showSearch={field.showSearch}
              allowClear={field.allowClear !== false}
              loading={field.loading}
              filterOption={
                field.filterOption ||
                ((input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase()))
              }
              onChange={(value) => {
                field?.onChange && field.onChange(value, form);
              }}
              onSearch={(value) => {
                field?.onSearch && field.onSearch(value);
              }}
              notFoundContent={
                field?.loading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "12px 0",
                    }}
                  >
                    <Spin size="small" />
                  </div>
                ) : null
              }
            >
              {field.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      case "multiselect":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Select
              mode="multiple"
              placeholder={field.placeholder}
              style={field.inputStyle ?? field.style}
              className={field.className}
              disabled={field.disabled}
              showSearch={field.showSearch}
              allowClear={field.allowClear !== false}
              loading={field.loading}
              filterOption={
                field.filterOption ||
                ((input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase()))
              }
              onChange={(value) => {
                field?.onChange && field.onChange(value, form);
              }}
              onSearch={(value) => {
                field?.onSearch && field.onSearch(value);
              }}
              maxTagCount="responsive"
              notFoundContent={
                field?.loading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "12px 0",
                    }}
                  >
                    <Spin size="small" />
                  </div>
                ) : null
              }
            >
              {field.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      case "action":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Button
              type="primary"
              loading={field.buttonLoading || false}
              disabled={field.disabled || false}
              onClick={() => {
                if (typeof field.onAction === "function") {
                  field.onAction(form.getFieldsValue(), form);
                }
              }}
              style={{
                width: field.fullWidth === false ? "auto" : "100%",
                ...(field.style ?? {}),
              }}
              className={field.className}
              icon={field.startContent}
            >
              {field.endContent ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {field.buttonText || field.label || "Action"}
                  {field.endContent}
                </span>
              ) : (
                field.buttonText || field.label || "Action"
              )}
            </Button>
          </Form.Item>
        );
      case "file":
      case "image":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Upload
              name={field.name}
              listType={field.listType || "text"}
              maxCount={field.maxCount || 1}
              accept={field.accept}
              onChange={(info) => {
                if (info.file.status === "done") {
                  form.setFieldsValue({ [field.name]: info.fileList });
                  field?.onChange && field.onChange(info.fileList, form);
                }
              }}
              showUploadList={field.showUploadList !== false}
              style={field.style}
              className={field.className}
            >
              <Button icon={<UploadOutlined />}>
                {field.buttonText ||
                  `Upload ${field.type === "image" ? "Image" : "File"}`}
              </Button>
            </Upload>
          </Form.Item>
        );
      case "button":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn, // Remove default "1 / -1" to allow button to fit in grid
              ...(field.itemStyle ?? {}),
            }}
            className={field.itemClassName ?? field.className}
          >
            <Button
              type={field.variant || "default"}
              size={field.size || "middle"}
              loading={field.loading || false} // Loading state for button spinner
              disabled={field.disabled || field.loading || false} // Auto-disable when loading
              htmlType={field.isSubmit ? "submit" : "button"}
              onClick={field.isSubmit ? undefined : field.onClick}
              style={{
                width: field.fullWidth === false ? "auto" : "100%",
                ...(field.style ?? {}),
              }}
              className={field.className}
              icon={field.startContent}
            >
              {field.endContent ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {field.buttonText || field.label || "Button"}
                  {field.endContent}
                </span>
              ) : (
                field.buttonText || field.label || "Button"
              )}
            </Button>
          </Form.Item>
        );
      case "textarea":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{
              gridColumn: field.gridColumn,
              ...(field.itemStyle ?? field.style),
            }}
            className={field.itemClassName ?? field.className}
          >
            <TextArea
              placeholder={field.placeholder}
              rows={4}
              style={field.inputStyle ?? field.style}
              className={field.className}
              onChange={(e) => {
                field?.onChange && field.onChange(e.target.value, form);
              }}
            />
          </Form.Item>
        );
      case "datepicker":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{ gridColumn: field.gridColumn, ...field.style }}
          >
            <DatePicker
              placeholder={field.placeholder}
              format={field.dateFormat || "DD/MM/YYYY"}
              style={{ width: "100%", ...field.inputStyle }}
              disabled={field.disabled}
              showTime={field.showTime || false}
              onChange={(date) => {
                field?.onChange && field.onChange(date, form);
              }}
            />
          </Form.Item>
        );
      case "datetimepicker":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{ gridColumn: field.gridColumn, ...field.style }}
          >
            <DatePicker
              placeholder={field.placeholder}
              format={field.dateFormat || "DD/MM/YYYY HH:mm:ss"}
              style={{ width: "100%", ...field.inputStyle }}
              disabled={field.disabled}
              showTime={{ format: "HH:mm:ss" }}
              onChange={(date) => {
                field?.onChange && field.onChange(date, form);
              }}
            />
          </Form.Item>
        );
      case "daterangepicker":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{ gridColumn: field.gridColumn, ...field.style }}
          >
            <RangePicker
              placeholder={field.rangePlaceholder || ["Từ ngày", "Đến ngày"]}
              format={field.dateFormat || "DD/MM/YYYY"}
              style={{ width: "100%", ...field.inputStyle }}
              onChange={(dates) => {
                field?.onChange && field.onChange(dates, form);
              }}
            />
          </Form.Item>
        );
      case "switch":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            valuePropName="checked"
            rules={rules}
            style={{ gridColumn: field.gridColumn, ...field.style }}
          >
            <Switch
              onChange={(checked) => {
                field?.onChange && field.onChange(checked, form);
              }}
            />
          </Form.Item>
        );
      case "checkbox":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            valuePropName="checked"
            rules={rules}
            style={{ gridColumn: field.gridColumn, ...field.style }}
          >
            <Checkbox
              onChange={(e) => {
                field?.onChange && field.onChange(e.target.checked, form);
              }}
            >
              {field.label}
            </Checkbox>
          </Form.Item>
        );
      case "radioGroup":
        return (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={rules}
            style={{ gridColumn: field.gridColumn, ...field.style }}
          >
            <Radio.Group
              style={field.inputStyle}
              disabled={field.disabled}
              onChange={(e) => {
                field?.onChange && field.onChange(e.target.value, form);
              }}
            >
              {field.options?.map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const gridFields = fields.filter(
    (field) =>
      field.type !== "textarea" &&
      field.type !== "file" &&
      field.type !== "image"
  );

  const fullWidthFields = fields.filter(
    (field) =>
      field.type === "textarea" ||
      field.type === "file" ||
      field.type === "image"
  );

  return (
    <>
      <style jsx global>{`
        .ant-form-item-explain,
        .ant-form-item-extra {
          margin: 0;
          padding: 0;
          line-height: 1;
          min-height: 0;
          height: auto;
        }

        .ant-form-item-explain::before,
        .ant-form-item-explain::after {
          content: none !important;
        }
      `}</style>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        style={{
          maxWidth: "2400px",
          width: "100%",
          margin: "0 auto",
          background: "#fff",
          padding: "24px",
          borderRadius: "6px",
          position: "relative",
          ...formStyle,
        }}
      >
        {gridFields.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              gap: gap,
            }}
          >
            {gridFields.map(renderField)}
          </div>
        )}
        {fullWidthFields.map(renderField)}
      </Form>
    </>
  );
});

export default CustomForm;
