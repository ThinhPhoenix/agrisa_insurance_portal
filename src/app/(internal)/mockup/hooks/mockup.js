//TRang fake de hook day mot xoa het

import { getErrorMessage, getSuccessMessage } from "@/libs/message";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import testData from "../testdata.json";

export const useCropDataManagement = () => {
  const router = useRouter();
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

  // Navigation functions for CRUD pages
  const navigateToDetail = (id) => {
    router.push(`/mockup/${id}`);
  };

  const navigateToCreate = () => {
    router.push("/mockup/create");
  };

  const navigateToEdit = (id) => {
    router.push(`/mockup/edit/${id}`);
  };

  const handleDelete = (id) => {
    // In a real app, this would call an API
    const newData = data.filter((item) => item.id !== id);
    setData(newData);
    setFilteredData(filteredData.filter((item) => item.id !== id));
    messageApi.success(getSuccessMessage("DELETE_SUCCESS"));
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
    messageApi.success(getSuccessMessage("CREATE_SUCCESS"));
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
    messageApi.success(getSuccessMessage("UPDATE_SUCCESS"));
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

    // Navigation functions
    navigateToDetail,
    navigateToCreate,
    navigateToEdit,

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
  if (!dateString) return "Chưa có thông tin";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export const useCropDetail = (id) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cropData, setCropData] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      loadCropData();
    }
  }, [id]);

  const loadCropData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const crop = testData.data.find((item) => item.id === id);
      if (crop) {
        setCropData(crop);
      } else {
        messageApi.error(getErrorMessage("NOT_FOUND"));
        router.push("/mockup");
      }
    } catch (error) {
      messageApi.error(getErrorMessage("GENERIC_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    cropData,
    contextHolder,
    loadCropData, // In case manual reload is needed
  };
};

export const useCreateCrop = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real application, you would send this data to your backend
      console.log("Creating new crop with data:", values);

      messageApi.success(getSuccessMessage("CREATE_SUCCESS"));

      // Redirect to the list page after successful creation
      setTimeout(() => {
        router.push("/mockup");
      }, 1500);
    } catch (error) {
      messageApi.error(getErrorMessage("GENERIC_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    contextHolder,
    handleSubmit,
    filterOptions: testData.filterOptions,
  };
};

export const useEditCrop = (id) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cropData, setCropData] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      loadCropData();
    }
  }, [id]);

  const loadCropData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const crop = testData.data.find((item) => item.id === id);
      if (crop) {
        setCropData(crop);
      } else {
        messageApi.error(getErrorMessage("NOT_FOUND"));
        router.push("/mockup");
      }
    } catch (error) {
      messageApi.error(getErrorMessage("GENERIC_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real application, you would send this data to your backend
      console.log("Updating crop with data:", values);

      messageApi.success(getSuccessMessage("UPDATE_SUCCESS"));

      // Redirect to the detail page after successful update
      setTimeout(() => {
        router.push(`/mockup/${id}`);
      }, 1500);
    } catch (error) {
      messageApi.error(getErrorMessage("GENERIC_ERROR"));
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    cropData,
    contextHolder,
    handleSubmit,
    loadCropData, // In case manual reload is needed
    filterOptions: testData.filterOptions,
  };
};
