import { message } from "antd";
import { useState } from "react";
import contractOptions from "../../../libs/mockdata/contract-options.json";

export const useContract = () => {
  const [selectedFields, setSelectedFields] = useState({});

  const [selectedSections, setSelectedSections] = useState([]);

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sidebar states
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedFieldType, setSelectedFieldType] = useState("text");

  // Modal states
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [tempSelectedSections, setTempSelectedSections] = useState([]);

  const addFieldToSection = (sectionId, field) => {
    setSelectedFields((prev) => ({
      ...prev,
      [sectionId]: [...prev[sectionId], { ...field, instanceId: Date.now() }],
    }));
  };

  const removeFieldFromSection = (sectionId, instanceId) => {
    setSelectedFields((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(
        (field) => field.instanceId !== instanceId
      ),
    }));
  };

  const updateFormData = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Contract data submitted:", { selectedFields, formData });
      setSubmitted(true);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    // Mock PDF generation
    console.log("Generating PDF preview for contract");
    // In real app, this would call an API to generate PDF
  };

  // Sidebar functions
  const openSidebar = (sectionId = null) => {
    setCurrentSection(sectionId);
    setSelectedSection(sectionId);
    setSelectedField(null);
    setSelectedFieldType("text");
    setSidebarVisible(true);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
    setCurrentSection(null);
    setSelectedSection(null);
    setSelectedField(null);
    setSelectedFieldType("text");
  };

  const selectSection = (sectionId) => {
    setSelectedSection(sectionId);
    setSelectedField(null);
  };

  const selectField = (field) => {
    setSelectedField(field);
    setSelectedFieldType(field.type);
  };

  const addCustomField = () => {
    if (selectedSection && selectedField) {
      const customField = {
        ...selectedField,
        type: selectedFieldType,
        instanceId: Date.now(),
      };
      addFieldToSection(selectedSection, customField);
      closeSidebar();
    }
  };

  const saveContract = () => {
    console.log("Contract saved:", { selectedFields, formData });
    message.success("Hợp đồng đã được lưu!");
  };

  const cancelContract = () => {
    setSelectedFields({});
    setSelectedSections([]);
    setFormData({});
    message.info("Đã hủy tạo hợp đồng!");
  };

  // Section management functions
  const openSectionModal = () => {
    setTempSelectedSections([...selectedSections]);
    setSectionModalVisible(true);
  };

  const closeSectionModal = () => {
    setSectionModalVisible(false);
    setTempSelectedSections([]);
  };

  const toggleTempSection = (sectionId) => {
    setTempSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const confirmSections = () => {
    setSelectedSections(tempSelectedSections);
    // Initialize selectedFields for new sections
    const newSelectedFields = { ...selectedFields };
    tempSelectedSections.forEach((sectionId) => {
      if (!newSelectedFields[sectionId]) {
        newSelectedFields[sectionId] = [];
      }
    });
    setSelectedFields(newSelectedFields);
    setSectionModalVisible(false);
    message.success("Đã thêm các mục bảo hiểm!");
  };

  const removeSection = (sectionId) => {
    setSelectedSections((prev) => prev.filter((id) => id !== sectionId));
    setSelectedFields((prev) => {
      const newFields = { ...prev };
      delete newFields[sectionId];
      return newFields;
    });
    message.success("Đã xóa mục bảo hiểm!");
  };

  return {
    selectedFields,
    selectedSections,
    formData,
    addFieldToSection,
    removeFieldFromSection,
    updateFormData,
    handleSubmit,
    generatePDF,
    loading,
    submitted,
    fieldLibrary: contractOptions.fieldLibrary,
    sections: contractOptions.sections,
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
  };
};
