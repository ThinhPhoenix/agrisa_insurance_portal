// Project thật cần để global để nhiều trang sử dụng
//Hook dùng cho 1 trang

import { message } from "antd";
import { useEffect, useRef, useState } from "react";
import testData from "../testdata.json";

export const useCropDataManagement = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    waterRequirement: "",
    plantingMonth: "",
  });
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerMode, setDrawerMode] = useState("view"); // "view", "add", "edit"
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);
  const formRef = useRef(null);

  const [messageApi, contextHolder] = message.useMessage();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setTimeout(() => {
      setData(testData.data);
      setFilteredData(testData.data);
      setLoading(false);
    }, 500);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    applyFilters(value, filters);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    applyFilters(searchText, newFilters);
  };

  const handleAdd = () => {
    setDrawerMode("add");
    setDrawerTitle("Thêm cây trồng mới");
    setCurrentRecord(null);
    setIsDrawerVisible(true);
    if (formRef.current) {
      formRef.current.resetFields();
    }
  };

  const handleEdit = (record) => {
    setDrawerMode("edit");
    setDrawerTitle("Chỉnh sửa cây trồng");
    setCurrentRecord(record);
    setIsDrawerVisible(true);

    // Wait for drawer to be visible and form to be initialized
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        name: record.name,
        username: record.username,
        firstName: record.profile.firstName,
        lastName: record.profile.lastName,
        type: record.cropDetails.type,
        plantingMonth: record.cropDetails.plantingMonth,
        harvestMonth: record.cropDetails.harvestMonth,
        yieldPerAcre: record.cropDetails.yieldPerAcre,
        waterRequirement: record.cropDetails.waterRequirement,
      });
    }, 100);
  };

  const handleView = (record) => {
    setDetailsRecord(record);
    setDetailsModalVisible(true);
  };

  const handleDelete = (id) => {
    // In a real app, this would call an API
    const newData = data.filter((item) => item.id !== id);
    setData(newData);
    setFilteredData(filteredData.filter((item) => item.id !== id));
    messageApi.success("Đã xóa cây trồng thành công!");
  };

  const handleFormSubmit = (values) => {
    if (drawerMode === "add") {
      addCropRecord(values);
    } else if (drawerMode === "edit") {
      updateCropRecord(values);
    }
    setIsDrawerVisible(false);
  };

  const addCropRecord = (values) => {
    // Generate a new unique ID
    const newId = `new-${Date.now()}`;

    // Create new record
    const newRecord = {
      id: newId,
      createdAt: new Date().toISOString(),
      name: values.name,
      avatar:
        "https://api-static.bacsicayxanh.vn/pictures/0003987_lua-nuoc_500.png.webp", // Default image
      username: values.username,
      knownIps: [],
      profile: {
        firstName: values.firstName,
        lastName: values.lastName,
        staticData: [100, 200, 300], // Default data
      },
      cropDetails: {
        type: values.type,
        plantingMonth: values.plantingMonth,
        harvestMonth: values.harvestMonth,
        yieldPerAcre: values.yieldPerAcre,
        waterRequirement: values.waterRequirement,
      },
    };

    // Add to data arrays
    const updatedData = [...data, newRecord];
    setData(updatedData);
    setFilteredData([...filteredData, newRecord]);
    messageApi.success("Đã thêm cây trồng thành công!");
  };

  const updateCropRecord = (values) => {
    // Update existing record
    const updatedData = data.map((item) => {
      if (item.id === currentRecord.id) {
        return {
          ...item,
          name: values.name,
          username: values.username,
          profile: {
            ...item.profile,
            firstName: values.firstName,
            lastName: values.lastName,
          },
          cropDetails: {
            type: values.type,
            plantingMonth: values.plantingMonth,
            harvestMonth: values.harvestMonth,
            yieldPerAcre: values.yieldPerAcre,
            waterRequirement: values.waterRequirement,
          },
        };
      }
      return item;
    });

    setData(updatedData);

    // Also update filtered data
    const updatedFilteredData = filteredData.map((item) => {
      if (item.id === currentRecord.id) {
        return {
          ...item,
          name: values.name,
          username: values.username,
          profile: {
            ...item.profile,
            firstName: values.firstName,
            lastName: values.lastName,
          },
          cropDetails: {
            type: values.type,
            plantingMonth: values.plantingMonth,
            harvestMonth: values.harvestMonth,
            yieldPerAcre: values.yieldPerAcre,
            waterRequirement: values.waterRequirement,
          },
        };
      }
      return item;
    });

    setFilteredData(updatedFilteredData);
    messageApi.success("Đã cập nhật cây trồng thành công!");
  };

  const applyFilters = (searchValue, currentFilters) => {
    let filtered = [...data];

    // Apply search filter
    if (searchValue.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.username.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.cropDetails.type
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          item.cropDetails.plantingMonth
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          item.cropDetails.harvestMonth
            .toLowerCase()
            .includes(searchValue.toLowerCase())
      );
    }

    // Apply category filters
    if (currentFilters.type) {
      filtered = filtered.filter(
        (item) => item.cropDetails.type === currentFilters.type
      );
    }
    if (currentFilters.waterRequirement) {
      filtered = filtered.filter(
        (item) =>
          item.cropDetails.waterRequirement === currentFilters.waterRequirement
      );
    }
    if (currentFilters.plantingMonth) {
      filtered = filtered.filter(
        (item) =>
          item.cropDetails.plantingMonth === currentFilters.plantingMonth
      );
    }

    setFilteredData(filtered);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
  };

  return {
    // State
    data,
    filteredData,
    loading,
    searchText,
    filters,
    isDrawerVisible,
    currentRecord,
    drawerTitle,
    drawerMode,
    detailsModalVisible,
    detailsRecord,
    formRef,
    contextHolder,

    // Actions
    handleSearch,
    handleFilterChange,
    handleAdd,
    handleEdit,
    handleView,
    handleDelete,
    handleFormSubmit,
    applyFilters,
    closeDrawer,
    closeDetailsModal,

    // Data
    filterOptions: testData.filterOptions,
  };
};

// Utility functions for data processing
export const getCropTypeColor = (type) => {
  const colors = {
    Lúa: "blue",
    "Cây công nghiệp": "orange",
    "Cây ăn quả": "red",
    "Gia vị": "purple",
    "Rau màu": "green",
    "Dược liệu": "cyan",
  };
  return colors[type] || "default";
};

export const getWaterRequirementColor = (requirement) => {
  const colors = {
    Thấp: "green",
    "Trung bình": "orange",
    Cao: "red",
  };
  return colors[requirement] || "default";
};

export const formatYield = (yieldValue) => {
  return `${yieldValue} tấn`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};
