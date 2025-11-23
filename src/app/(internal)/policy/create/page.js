"use client";

import React, { useCallback, useMemo } from "react";
import "./create-policy.css";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Space, Tabs, Typography } from "antd";
import { useRouter } from "next/navigation";

// Components - Lazy loaded for code splitting
import BasicTab from "@/components/layout/policy/create/BasicTab";
import ConfigurationTab from "@/components/layout/policy/create/ConfigurationTab";
import EstimatedCosts from "@/components/layout/policy/create/EstimatedCosts";
import FileUploadPreview from "@/components/layout/policy/create/FileUploadPreview";
import ReviewTab from "@/components/layout/policy/create/ReviewTab";
import TagsTab from "@/components/layout/policy/create/TagsTab";

// Hook
import useCreatePolicy from "@/services/hooks/policy/use-create-policy";

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
      // Redirect to policy list page immediately
      router.push("/policy");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push("/policy");
  };

  // Handle file upload - Memoized to prevent unnecessary re-renders
  const handleFileUpload = useCallback((file, url) => {
    setUploadedFile(file);
    setFileUrl(url);

    // ✅ Update tagsData with uploaded file
    handleTagsDataChange({
      uploadedFile: file,
      // Note: modifiedPdfBytes will be set later by TagsTab when tags are applied
    });
  }, [handleTagsDataChange]);

  // Handle file remove - Memoized to prevent unnecessary re-renders
  const handleFileRemove = useCallback(() => {
    // Clear local preview state
    setUploadedFile(null);
    setFileUrl(null);

    // Clear detected placeholders
    setDetectedPlaceholders([]);

    // ✅ Clear file data from tagsData
    handleTagsDataChange({
      uploadedFile: null,
      modifiedPdfBytes: null,
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

  // ✅ NEW: Handle manual placeholder creation from click-to-place - Memoized
  const handleCreatePlaceholder = useCallback((newPlaceholder) => {
    console.log("📍 Adding manual placeholder to list:", newPlaceholder);
    setDetectedPlaceholders((prev) => [...prev, newPlaceholder]);
  }, []);

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
      key: TABS.BASIC,
      label: (
        <Space>
          <InfoCircleOutlined />
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
          <SettingOutlined />
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
          <TagOutlined />
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
          filePreviewRef={filePreviewRef}
        />
      ),
    },
    {
      key: TABS.REVIEW,
      label: (
        <Space>
          <FileTextOutlined />
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
