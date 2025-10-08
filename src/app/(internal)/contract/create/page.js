"use client";

import { CustomForm } from "@/components/custom-form";
import FieldSelectionDrawer from "@/components/layout/contract/field-selection-drawer";
import SectionSelectionModal from "@/components/layout/contract/section-selection-modal";
import SuccessView from "@/components/layout/contract/success-view";
import { Form, Input, message, Select, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import ContractForm from "../../../../components/layout/contract/contract-form";
import CustomTriggerModal from "../../../../components/layout/contract/customer-trigger-modal";
import TriggerConditionsModal from "../../../../components/layout/contract/trigger-conditions-modal";
import { useContract } from "../use-contract";
import "./page.css";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

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
    return <SuccessView generatePDF={generatePDF} />;
  }

  return (
    <div>
      <ContractForm
        form={form}
        selectedSections={selectedSections}
        sections={sections}
        selectedFields={selectedFields}
        farmerFillFields={farmerFillFields}
        dataMonitoringTiers={dataMonitoringTiers}
        selectedTriggers={selectedTriggers}
        monitoringTiersData={monitoringTiersData}
        fieldLibrary={fieldLibrary}
        onFinish={onFinish}
        saveContract={saveContract}
        cancelContract={cancelContract}
        generatePDF={generatePDF}
        loading={loading}
        openSectionModal={openSectionModal}
        removeSection={removeSection}
        openSidebar={openSidebar}
        removeTrigger={removeTrigger}
        updateDataMonitoringTier={updateDataMonitoringTier}
        toggleFarmerFill={toggleFarmerFill}
        removeFieldFromSection={removeFieldFromSection}
        renderField={renderField}
        selectedField={selectedField}
        selectField={selectField}
        selectedFieldType={selectedFieldType}
        setSelectedFieldType={setSelectedFieldType}
        addCustomField={addCustomField}
        setTriggerModalVisible={setTriggerModalVisible}
        setActiveTab={setActiveTab}
      />

      <FieldSelectionDrawer
        sidebarVisible={sidebarVisible}
        closeSidebar={closeSidebar}
        currentSection={currentSection}
        sections={sections}
        fieldLibrary={fieldLibrary}
        selectedField={selectedField}
        selectField={selectField}
        selectedFieldType={selectedFieldType}
        setSelectedFieldType={setSelectedFieldType}
        addCustomField={addCustomField}
      />

      <SectionSelectionModal
        sectionModalVisible={sectionModalVisible}
        closeSectionModal={closeSectionModal}
        confirmSections={confirmSections}
        sections={sections}
        tempSelectedSections={tempSelectedSections}
        setTempSelectedSections={setTempSelectedSections}
      />

      {/* Trigger Conditions Modal */}
      <TriggerConditionsModal
        triggerModalVisible={triggerModalVisible}
        setTriggerModalVisible={setTriggerModalVisible}
        customTriggerForm={customTriggerForm}
        handleCustomTriggerSubmit={handleCustomTriggerSubmit}
        type={activeTab}
      />

      {/* Custom Trigger Modal */}
      <CustomTriggerModal
        customTriggerModalVisible={customTriggerModalVisible}
        closeCustomTriggerModal={closeCustomTriggerModal}
        customTriggerFormRef={customTriggerFormRef}
        customTriggerForm={customTriggerForm}
        customTriggerFields={customTriggerFields}
        handleCustomTriggerSubmit={handleCustomTriggerSubmit}
      />
    </div>
  );
}
