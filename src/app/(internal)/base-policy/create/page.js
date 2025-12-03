"use client";

import React, { useCallback } from "react";
import "./create-policy.css";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";

// Components - Lazy loaded for code splitting
import BasicTab from "@/components/layout/base-policy/create/BasicTab";
import ConfigurationTab from "@/components/layout/base-policy/create/ConfigurationTab";
import EstimatedCosts from "@/components/layout/base-policy/create/EstimatedCosts";
import FAQTab from "@/components/layout/base-policy/create/FAQTab";
import FileUploadPreview from "@/components/layout/base-policy/create/FileUploadPreview";
import ReviewTab from "@/components/layout/base-policy/create/ReviewTab";
import TagsTab from "@/components/layout/base-policy/create/TagsTab";

// Hook
import useCreatePolicy from "@/services/hooks/base-policy/use-create-policy";
import { createFillablePDFFromMappings } from "@/libs/pdf/pdfAcroFormEditor";

const { Title, Text } = Typography;

const CreatePolicyPage = () => {
  const router = useRouter();
  const [contractPreviewVisible, setContractPreviewVisible] =
    React.useState(true);
  const [uploadedFile, setUploadedFile] = React.useState(null);
  const [fileUrl, setFileUrl] = React.useState(null);
  const filePreviewRef = React.useRef(null);
  const [detectedPlaceholders, setDetectedPlaceholders] = React.useState([]);
  const {
    // State
    currentTab,
    basicData,
    configurationData,
    tagsData,
    validationStatus,
    loading,
    estimatedCosts,
    categories,
    categoriesLoading,
    tiers,
    tiersLoading,
    dataSources,
    dataSourcesLoading,

    // Constants
    TABS,
    mockData,

    // Actions
    handleTabChange,
    handleNext,
    handlePrevious,
    handleBasicDataChange,
    handleAddDataSource,
    handleRemoveDataSource,
    handleConfigurationDataChange,
    handleAddTriggerCondition,
    handleRemoveTriggerCondition,
    handleUpdateTriggerCondition,
    handleTagsDataChange,
    handleAddTag,
    handleRemoveTag,
    handleUpdateTag,
    handleCreatePolicy,
    handleReset,
    fetchCategories,
    fetchTiersByCategory,
    fetchDataSourcesByTier,

    // Utilities
    getAvailableDataSourcesForTrigger,
  } = useCreatePolicy();

  // Handle successful policy creation
  const handlePolicyCreated = async () => {
    const success = await handleCreatePolicy();
    if (success) {
      // Wait for success message to be visible before redirecting
      setTimeout(() => {
        window.location.href = "/base-policy";
      }, 1500); // 1.5 seconds delay to show success message
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/base-policy");
  };

  // Handle file upload - Memoized to prevent unnecessary re-renders
  const handleFileUpload = useCallback(
    (file, url) => {
      setUploadedFile(file);
      setFileUrl(url);

      //  Update tagsData with uploaded file
      handleTagsDataChange({
        uploadedFile: file,
        // Note: modifiedPdfBytes will be set later by TagsTab when tags are applied
      });
    },
    [handleTagsDataChange]
  );

  // Handle file remove - Memoized to prevent unnecessary re-renders
  const handleFileRemove = useCallback(() => {
    // Clear local preview state
    setUploadedFile(null);
    setFileUrl(null);

    // Clear detected placeholders
    setDetectedPlaceholders([]);

    //  CRITICAL: Clear ALL PDF-related data from tagsData
    handleTagsDataChange({
      uploadedFile: null,
      modifiedPdfBytes: null,
      placeholders: [],
      mappings: {},
      documentTags: {},
      pdfData: null,
    });

    // Remove all tags when PDF is deleted to avoid stale mappings
    try {
      if (
        tagsData &&
        Array.isArray(tagsData.tags) &&
        tagsData.tags.length > 0
      ) {
        // copy ids to avoid mutation during iteration
        const ids = tagsData.tags.map((t) => t.id);
        ids.forEach((id) => {
          try {
            handleRemoveTag(id);
          } catch (e) {
            // ignore individual remove errors
            console.warn("Error removing tag", id, e);
          }
        });
      }
    } catch (e) {
      console.warn("Error clearing tags on file remove", e);
    }
  }, [handleTagsDataChange, handleRemoveTag, tagsData]);

  const handlePlaceholdersDetected = useCallback((placeholders) => {
    setDetectedPlaceholders(placeholders || []);
  }, []);

  //  NEW: Handle manual placeholder creation from click-to-place - Memoized
  const handleCreatePlaceholder = useCallback((newPlaceholder) => {
    console.log("📍 Adding manual placeholder to list:", newPlaceholder);
    setDetectedPlaceholders((prev) => [...prev, newPlaceholder]);
  }, []);

  // 🆕 Handle placeholder deletion
  const handleDeletePlaceholder = useCallback((placeholderId) => {
    console.log("🗑️ Deleting placeholder from list:", placeholderId);
    setDetectedPlaceholders((prev) =>
      prev.filter((p) => p.id !== placeholderId)
    );
  }, []);

  // 🆕 Handle create field from scan mode and immediately apply AcroForm
  const handleCreateAndApplyField = useCallback(async (placeholder, fieldData) => {
    try {
      console.log('🔧 Page.js - Creating field from scan mode:', { placeholder, fieldData });

      // 1. Add placeholder to detected list
      setDetectedPlaceholders(prev => [...prev, placeholder]);

      // 2. Create temp tag for this field
      const tempTag = {
        id: `tag-${Date.now()}`,
        key: fieldData.key,
        dataType: fieldData.dataType,
        dataTypeLabel: mockData.tagDataTypes?.find(t => t.value === fieldData.dataType)?.label || fieldData.dataType,
        defaultValue: fieldData.key, // Set field name as default value to display in PDF
        createdFromScan: true
      };

      // 3. Add tag to tagsData
      handleTagsDataChange(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tempTag]
      }));

      // 4. Create mapping
      const mapping = { [placeholder.id]: tempTag.id };

      // 5. Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));

      // 6. Call createFillablePDFFromMappings to add AcroForm
      if (!uploadedFile) {
        throw new Error('Không tìm thấy file PDF');
      }

      // Convert File to ArrayBuffer
      const arrayBuffer = await uploadedFile.arrayBuffer();

      console.log('📄 Calling createFillablePDFFromMappings with:', {
        placeholder,
        mapping,
        tag: tempTag,
        hasFile: !!uploadedFile,
        arrayBufferSize: arrayBuffer.byteLength
      });

      const result = await createFillablePDFFromMappings(
        arrayBuffer,
        [placeholder],
        mapping,
        [tempTag],
        {
          tagDataTypes: mockData.tagDataTypes || [],
          fillFields: true, // Fill field with default value (field name)
          makeFieldsEditable: true // Keep fields editable
        }
      );

      console.log('✅ AcroForm created successfully, result:', {
        hasPdfBytes: !!result?.pdfBytes,
        bytesLength: result?.pdfBytes?.length
      });

      // 7. Create new File from PDF bytes
      const newFile = new File([result.pdfBytes], uploadedFile?.name || 'contract.pdf', { type: 'application/pdf' });

      // 8. Create new blob URL for preview
      const newUrl = URL.createObjectURL(newFile);

      // 9. Update local state (uploadedFile, fileUrl)
      setUploadedFile(newFile);
      setFileUrl(newUrl);

      // 10. Update tagsData with new PDF and mapping
      handleTagsDataChange(prev => ({
        ...prev,
        modifiedPdfBytes: result.pdfBytes,
        uploadedFile: newFile,
        mappings: {
          ...prev.mappings,
          ...mapping
        },
        documentTagsObject: {
          ...prev.documentTagsObject,
          [fieldData.key]: tempTag
        }
      }));

      // 11. Force refresh via FileUploadPreview imperative handle
      setTimeout(() => {
        if (filePreviewRef?.current?.updateFillablePDF) {
          console.log('🔄 Calling updateFillablePDF to refresh preview');
          filePreviewRef.current.updateFillablePDF(newFile, result.pdfBytes);
        }
      }, 300);

      console.log(`✅ Field "${fieldData.key}" added to PDF with AcroForm`);
    } catch (error) {
      console.error('❌ Failed to create AcroForm:', error);
      throw error;
    }
  }, [uploadedFile, mockData.tagDataTypes, handleTagsDataChange, filePreviewRef, setUploadedFile, setFileUrl]);

  // Get current step index
  const getCurrentStepIndex = () => {
    const tabs = Object.values(TABS);
    return tabs.findIndex((tab) => tab === currentTab);
  };

  // Check if tab is completed
  const isTabCompleted = (tab) => {
    switch (tab) {
      case TABS.BASIC:
        return validationStatus.basic;
      case TABS.CONFIGURATION:
        return validationStatus.configuration;
      case TABS.TAGS:
        return validationStatus.tags;
      case TABS.REVIEW:
        return validationStatus.review;
      default:
        return false;
    }
  };

  // Get validation alert for current tab
  const getValidationAlert = () => {
    let message = "";
    let type = "info";

    switch (currentTab) {
      case TABS.BASIC:
        if (!validationStatus.basic) {
          message =
            "Vui lòng hoàn thành thông tin cơ bản và thêm ít nhất một nguồn dữ liệu";
          type = "warning";
        } else {
          message = "Thông tin cơ bản đã hoàn thành";
          type = "success";
        }
        break;
      case TABS.CONFIGURATION:
        if (!validationStatus.configuration) {
          message = "Vui lòng thêm ít nhất một điều kiện kích hoạt";
          type = "warning";
        } else {
          message = "Cấu hình điều kiện đã hoàn thành";
          type = "success";
        }
        break;
      case TABS.TAGS:
        message = "Tags là tùy chọn, bạn có thể bỏ qua hoặc thêm metadata";
        type = "info";
        break;
      case TABS.REVIEW:
        if (!validationStatus.review) {
          message = "Vui lòng hoàn thành các tab trước để có thể tạo policy";
          type = "error";
        } else {
          message = "Policy đã sẵn sàng để tạo";
          type = "success";
        }
        break;
    }

    return { message, type };
  };

  // Tabs configuration
  const tabItems = [
    {
      key: TABS.FAQ,
      label: (
        <Space>
          <Tooltip title="FAQ/Hướng dẫn" placement="bottom">
            <QuestionCircleOutlined />
          </Tooltip>
          <span>FAQ/Hướng dẫn</span>
        </Space>
      ),
      children: <FAQTab />,
    },
    {
      key: TABS.BASIC,
      label: (
        <Space>
          <Tooltip title="Thông tin Cơ bản" placement="bottom">
            <InfoCircleOutlined />
          </Tooltip>
          <span>Thông tin Cơ bản</span>
          {isTabCompleted(TABS.BASIC) ? (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          ) : (
            currentTab !== TABS.BASIC && (
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            )
          )}
        </Space>
      ),
      children: (
        <BasicTab
          basicData={basicData}
          mockData={mockData}
          onDataChange={handleBasicDataChange}
          onAddDataSource={handleAddDataSource}
          onRemoveDataSource={handleRemoveDataSource}
          estimatedCosts={estimatedCosts}
          categories={categories}
          categoriesLoading={categoriesLoading}
          tiers={tiers}
          tiersLoading={tiersLoading}
          dataSources={dataSources}
          dataSourcesLoading={dataSourcesLoading}
          fetchTiersByCategory={fetchTiersByCategory}
          fetchDataSourcesByTier={fetchDataSourcesByTier}
        />
      ),
    },
    {
      key: TABS.CONFIGURATION,
      label: (
        <Space>
          <Tooltip title="Cấu hình nâng cao" placement="bottom">
            <SettingOutlined />
          </Tooltip>
          <span>Cấu hình nâng cao</span>
          {isTabCompleted(TABS.CONFIGURATION) ? (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          ) : (
            currentTab !== TABS.CONFIGURATION && (
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            )
          )}
        </Space>
      ),
      children: (
        <ConfigurationTab
          configurationData={configurationData}
          mockData={mockData}
          onDataChange={handleConfigurationDataChange}
          onAddTriggerCondition={handleAddTriggerCondition}
          onRemoveTriggerCondition={handleRemoveTriggerCondition}
          onUpdateTriggerCondition={handleUpdateTriggerCondition}
          getAvailableDataSourcesForTrigger={getAvailableDataSourcesForTrigger}
        />
      ),
    },
    {
      key: TABS.TAGS,
      label: (
        <Space>
          <Tooltip title="Tài liệu & Trường thông tin" placement="bottom">
            <TagOutlined />
          </Tooltip>
          <span>Tài liệu & Trường thông tin</span>
          {isTabCompleted(TABS.TAGS) && (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          )}
        </Space>
      ),
      children: (
        <TagsTab
          tagsData={tagsData}
          mockData={mockData}
          onDataChange={handleTagsDataChange}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onUpdateTag={handleUpdateTag}
          previewVisible={contractPreviewVisible}
          onPreviewVisibleChange={setContractPreviewVisible}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          onOpenPaste={() =>
            filePreviewRef.current?.openPasteModal &&
            filePreviewRef.current.openPasteModal()
          }
          onOpenFullscreen={() =>
            filePreviewRef.current?.openFullscreen &&
            filePreviewRef.current.openFullscreen()
          }
          placeholders={detectedPlaceholders}
          onDeletePlaceholder={handleDeletePlaceholder}
          filePreviewRef={filePreviewRef}
        />
      ),
    },
    {
      key: TABS.REVIEW,
      label: (
        <Space>
          <Tooltip title="Xem lại & Tạo" placement="bottom">
            <FileTextOutlined />
          </Tooltip>
          <span>Xem lại & Tạo</span>
          {isTabCompleted(TABS.REVIEW) ? (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          ) : (
            currentTab !== TABS.REVIEW &&
            !validationStatus.basic &&
            !validationStatus.configuration && (
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            )
          )}
        </Space>
      ),
      children: (
        <ReviewTab
          basicData={basicData}
          configurationData={configurationData}
          tagsData={tagsData}
          estimatedCosts={estimatedCosts}
          validationStatus={validationStatus}
          loading={loading}
          onCreatePolicy={handlePolicyCreated}
        />
      ),
    },
  ];

  const validationAlert = getValidationAlert();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Tạo Policy Bảo hiểm Nông nghiệp Mới
        </Title>
        <Text type="secondary">
          Tạo policy bảo hiểm tham số được hỗ trợ bởi vệ tinh
        </Text>
      </div>

      {/* Validation Alert */}
      <Alert
        message={validationAlert.message}
        type={validationAlert.type}
        showIcon
        closable={false}
      />

      {/* Main Content */}
      <Row gutter={24} style={{ position: "relative" }}>
        {/* Left Content - Tabs */}
        <Col span={16}>
          <Card>
            <Tabs
              activeKey={currentTab}
              onChange={handleTabChange}
              items={tabItems}
              size="large"
              type="card"
              tabBarGutter={8}
              tabBarStyle={{
                marginBottom: 0,
                paddingLeft: 8,
                paddingRight: 8,
              }}
              moreIcon={
                <Space>
                  <span>Thêm</span>
                  <InfoCircleOutlined />
                </Space>
              }
            />
          </Card>
        </Col>

        {/* Right Content - Estimated Costs or Contract Preview */}
        <Col span={8}>
          <div
            style={{
              position: "sticky",
              top: "24px",
              height: "fit-content",
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
              zIndex: 100,
            }}
          >
            {currentTab === TABS.TAGS && contractPreviewVisible ? (
              <FileUploadPreview
                ref={filePreviewRef}
                tagsData={tagsData}
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                uploadedFile={uploadedFile}
                fileUrl={fileUrl}
                onPlaceholdersDetected={handlePlaceholdersDetected}
                onCreatePlaceholder={handleCreatePlaceholder}
                onCreateAndApplyField={handleCreateAndApplyField}
                placeholders={detectedPlaceholders}
                tagDataTypes={mockData.tagDataTypes || []}
                compactButtons={true}
              />
            ) : (
              <EstimatedCosts
                estimatedCosts={estimatedCosts}
                basicData={basicData}
                configurationData={configurationData}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* Footer Navigation */}
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button onClick={handleCancel} icon={<CloseOutlined />}>
                Hủy bỏ
              </Button>
              <Button onClick={handleReset} type="dashed">
                Đặt lại
              </Button>
            </Space>
          </Col>

          <Col>
            <Space>
              <Button
                onClick={handlePrevious}
                disabled={getCurrentStepIndex() === 0}
                icon={<ArrowLeftOutlined />}
              >
                Quay lại
              </Button>

              {currentTab === TABS.REVIEW ? (
                <Button
                  type="primary"
                  onClick={handlePolicyCreated}
                  loading={loading}
                  disabled={!validationStatus.review}
                >
                  {loading ? "Đang tạo..." : "Tạo Policy"}
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleNext}
                  icon={<ArrowRightOutlined />}
                >
                  Tiếp theo
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CreatePolicyPage;
