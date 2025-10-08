import { message } from "antd";
import { useState } from "react";
import contractOptions from "../../../libs/mockdata/contract-options.json";

export const useContract = () => {
  const [selectedFields, setSelectedFields] = useState({});

  const [selectedSections, setSelectedSections] = useState([]);

  const [farmerFillFields, setFarmerFillFields] = useState({}); // field.instanceId -> boolean

  const [dataMonitoringTiers, setDataMonitoringTiers] = useState({
    weatherStations: null, // 'tier1', 'tier2', 'tier3'
    satellite: null, // 'tier1', 'tier2', 'tier3'
  });

  const [selectedTriggers, setSelectedTriggers] = useState([]); // array of trigger objects

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
    setFarmerFillFields({});
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
    const newSelectedFields = { ...selectedFields };
    const newFarmerFillFields = { ...farmerFillFields };

    // Add new sections to selectedFields if they don't exist
    tempSelectedSections.forEach((sectionId) => {
      if (!newSelectedFields[sectionId]) {
        newSelectedFields[sectionId] = [];
      }
    });

    setSelectedSections(tempSelectedSections);
    setSelectedFields(newSelectedFields);
    setFarmerFillFields(newFarmerFillFields);
    setTempSelectedSections([]);
    setSectionModalVisible(false);
    message.success("Đã thêm các mục bảo hiểm!");
  };

  const removeSection = (sectionId) => {
    setSelectedSections((prev) => prev.filter((id) => id !== sectionId));
    setSelectedFields((prev) => {
      const newFields = { ...prev };
      const fieldsToRemove = newFields[sectionId] || [];
      delete newFields[sectionId];

      // Remove farmer fill settings for fields in this section
      setFarmerFillFields((farmerPrev) => {
        const newFarmerFill = { ...farmerPrev };
        fieldsToRemove.forEach((field) => {
          delete newFarmerFill[field.instanceId];
        });
        return newFarmerFill;
      });

      return newFields;
    });

    message.success("Đã xóa mục bảo hiểm!");
  };

  const toggleFarmerFill = (instanceId) => {
    setFarmerFillFields((prev) => ({
      ...prev,
      [instanceId]: !prev[instanceId],
    }));
  };

  const updateDataMonitoringTier = (dataType, tier) => {
    setDataMonitoringTiers((prev) => ({
      ...prev,
      [dataType]: tier,
    }));
  };

  const addTrigger = (trigger) => {
    setSelectedTriggers((prev) => [...prev, { ...trigger, id: Date.now() }]);
  };

  const removeTrigger = (triggerId) => {
    setSelectedTriggers((prev) => prev.filter((t) => t.id !== triggerId));
  };

  const updateTrigger = (triggerId, updates) => {
    setSelectedTriggers((prev) =>
      prev.map((t) => (t.id === triggerId ? { ...t, ...updates } : t))
    );
  };

  // Custom trigger utility functions
  const getMetricDisplayName = (metric) => {
    const metricNames = {
      rainfall: "Lượng mưa",
      rainfall_accumulated: "Lượng mưa tích lũy",
      temperature_min: "Nhiệt độ tối thiểu",
      temperature_max: "Nhiệt độ tối đa",
      temperature_avg: "Nhiệt độ trung bình",
      humidity: "Độ ẩm",
      wind_speed: "Tốc độ gió",
      ndvi_change: "NDVI thay đổi",
      flood_index: "Chỉ số ngập lụt",
      soil_moisture: "Độ ẩm đất",
      evi: "EVI",
      lai: "LAI",
    };
    return metricNames[metric] || metric;
  };

  const getOperatorSymbol = (operator) => {
    const operators = {
      ">": ">",
      "<": "<",
      ">=": "≥",
      "<=": "≤",
      "=": "=",
      "!=": "≠",
    };
    return operators[operator] || operator;
  };

  const getTimeWindowText = (timeWindow) => {
    const timeWindows = {
      "1h": "1 giờ",
      "6h": "6 giờ",
      "24h": "24 giờ",
      "3d": "3 ngày",
      "7d": "7 ngày",
      "14d": "14 ngày",
      "30d": "30 ngày",
      "60d": "60 ngày",
      "90d": "90 ngày",
    };
    return timeWindows[timeWindow] || timeWindow;
  };

  const generateConditionText = (values) => {
    const conditions = values.conditions.map((condition, index) => {
      const metricName = getMetricDisplayName(condition.metric);
      const operatorSymbol = getOperatorSymbol(condition.operator);
      const timeWindowText = getTimeWindowText(condition.timeWindow);
      const logic = index > 0 ? ` ${values.logic} ` : "";

      return `${logic}${metricName} ${operatorSymbol} ${condition.threshold} trong ${timeWindowText}`;
    });

    return conditions.join("");
  };

  const handleCustomTriggerSubmit = (values, onSuccess) => {
    let conditions = [];
    let conditionText = "";

    if (values.type === "combined") {
      // Xử lý điều kiện kết hợp
      const weatherConditions = (values.weatherConditions || []).map(
        (condition, index) => ({
          id: `weather_condition_${index}`,
          type: "weather",
          metric: condition.metric,
          operator: condition.operator,
          threshold: condition.threshold,
          timeWindow: condition.timeWindow,
        })
      );

      const satelliteConditions = (values.satelliteConditions || []).map(
        (condition, index) => ({
          id: `satellite_condition_${index}`,
          type: "satellite",
          metric: condition.metric,
          operator: condition.operator,
          threshold: condition.threshold,
          timeWindow: condition.timeWindow,
        })
      );

      conditions = [...weatherConditions, ...satelliteConditions];

      // Tạo conditionText cho combined
      const weatherText =
        weatherConditions.length > 0
          ? `Thời tiết: ${generateConditionText({
              conditions: weatherConditions,
            })}`
          : "";
      const satelliteText =
        satelliteConditions.length > 0
          ? `Vệ tinh: ${generateConditionText({
              conditions: satelliteConditions,
            })}`
          : "";
      const logicText =
        values.combinationLogic === "AND"
          ? "VÀ"
          : values.combinationLogic === "OR"
          ? "HOẶC"
          : "Tùy chỉnh";

      conditionText = [weatherText, satelliteText]
        .filter(Boolean)
        .join(` ${logicText} `);
    } else {
      // Xử lý weather hoặc satellite
      conditions = (values.conditions || []).map((condition, index) => ({
        id: `${values.type}_condition_${index}`,
        type: values.type,
        metric: condition.metric,
        operator: condition.operator,
        threshold: condition.threshold,
        timeWindow: condition.timeWindow,
      }));

      conditionText = generateConditionText({ conditions });
    }

    const customTrigger = {
      id: `custom_${values.type}_${Date.now()}`,
      name: values.triggerName,
      description: values.description,
      type: values.type,
      logic: values.combinationLogic || "AND", // Default to AND for single type
      conditions: conditions,
      payoutPercent: values.payoutPercent,
      severity: "medium", // Default severity
      conditionText: conditionText,
    };

    addTrigger(customTrigger);
    onSuccess && onSuccess();
    message.success(
      `Điều kiện kích hoạt ${
        values.type === "weather"
          ? "thời tiết"
          : values.type === "satellite"
          ? "vệ tinh"
          : "kết hợp"
      } đã được thêm!`
    );
  };

  return {
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
    fieldLibrary: contractOptions.fieldLibrary,
    sections: contractOptions.sections,
    monitoringTiersData: contractOptions.dataMonitoringTiers,
    triggerConditions: contractOptions.triggerConditions,
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
  };
};
