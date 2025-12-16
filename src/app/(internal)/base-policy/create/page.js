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
  message,
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
import { createFillablePDFFromMappings } from "@/libs/pdf/pdfAcroFormEditor";
import useCreatePolicy from "@/services/hooks/base-policy/use-create-policy";

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
    handleAddBlackoutPeriod,
    handleRemoveBlackoutPeriod,
    handleUpdateBlackoutPeriod,
    handleTagsDataChange,
    handleAddTag,
    handleRemoveTag,
    handleUpdateTag,
    handleAddStagedField,
    handleUpdateStagedField,
    handleDeleteStagedField,
    handleCreatePolicy,
    handleReset,
    fetchCategories,
    fetchTiersByCategory,
    fetchDataSourcesByTier,

    // Utilities
    getAvailableDataSourcesForTrigger,
  } = useCreatePolicy();

  // Xử lý tạo policy thành công
  const handlePolicyCreated = async () => {
    const success = await handleCreatePolicy();
    if (success) {
      // Đợi hiển thị thông báo thành công trước khi chuyển hướng
      setTimeout(() => {
        window.location.href = "/base-policy";
      }, 1500); // Delay 1.5 giây để hiển thị thông báo
    }
  };

  // Xử lý hủy
  const handleCancel = () => {
    router.push("/base-policy");
  };

  // Xử lý upload file
  const handleFileUpload = useCallback(
    (file, url) => {
      setUploadedFile(file);
      setFileUrl(url);

      // Cập nhật tagsData với file đã upload
      handleTagsDataChange({
        uploadedFile: file,
        // Lưu ý: modifiedPdfBytes sẽ được set sau bởi TagsTab khi áp dụng tags
      });
    },
    [handleTagsDataChange]
  );

  // Xử lý xóa file
  const handleFileRemove = useCallback(() => {
    // Xóa state local của preview
    setUploadedFile(null);
    setFileUrl(null);

    // Xóa placeholders đã phát hiện
    setDetectedPlaceholders([]);

    // QUAN TRỌNG: Xóa TẤT CẢ dữ liệu liên quan đến PDF từ tagsData
    handleTagsDataChange({
      uploadedFile: null,
      modifiedPdfBytes: null,
      placeholders: [],
      mappings: {},
      documentTags: {},
      pdfData: null,
    });

    // Xóa tất cả tags khi PDF bị xóa để tránh mappings cũ
    try {
      if (
        tagsData &&
        Array.isArray(tagsData.tags) &&
        tagsData.tags.length > 0
      ) {
        // Copy ids để tránh mutation trong lúc iteration
        const ids = tagsData.tags.map((t) => t.id);
        ids.forEach((id) => {
          try {
            handleRemoveTag(id);
          } catch (e) {
            // Bỏ qua lỗi xóa từng tag
          }
        });
      }
    } catch (e) {
      // Bỏ qua lỗi khi xóa tags
    }
  }, [handleTagsDataChange, handleRemoveTag, tagsData]);

  const handlePlaceholdersDetected = useCallback((placeholders) => {
    setDetectedPlaceholders(placeholders || []);
  }, []);

  // Xử lý tạo placeholder thủ công từ chế độ click-to-place
  const handleCreatePlaceholder = useCallback((newPlaceholder) => {
    setDetectedPlaceholders((prev) => [...prev, newPlaceholder]);
  }, []);

  // Xử lý xóa placeholder
  const handleDeletePlaceholder = useCallback((placeholderId) => {
    setDetectedPlaceholders((prev) =>
      prev.filter((p) => p.id !== placeholderId)
    );
  }, []);

  // Xử lý tạo trường từ chế độ quét và áp dụng AcroForm ngay lập tức
  const handleCreateAndApplyField = useCallback(
    async (placeholder, fieldData) => {
      try {
        // 1. Thêm placeholder vào danh sách đã phát hiện
        setDetectedPlaceholders((prev) => [...prev, placeholder]);

        // 2. Tạo tag tạm thời cho trường này
        const tempTag = {
          id: `tag-${Date.now()}`,
          key: fieldData.key,
          dataType: fieldData.dataType,
          dataTypeLabel:
            mockData.tagDataTypes?.find((t) => t.value === fieldData.dataType)
              ?.label || fieldData.dataType,
          defaultValue: fieldData.key, // Đặt tên trường làm giá trị mặc định để hiển thị trong PDF
          createdFromScan: true,
        };

        // 3. Thêm tag vào tagsData
        handleTagsDataChange((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), tempTag],
        }));

        // 4. Tạo mapping cho trường này
        const mapping = { [placeholder.id]: tempTag.id };

        // 5. Đợi state được cập nhật
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 6. Gọi createFillablePDFFromMappings để thêm AcroForm
        if (!uploadedFile) {
          throw new Error("Không tìm thấy file PDF");
        }

        // Chuyển File sang ArrayBuffer
        const arrayBuffer = await uploadedFile.arrayBuffer();

        const result = await createFillablePDFFromMappings(
          arrayBuffer,
          [placeholder],
          mapping,
          [tempTag],
          {
            tagDataTypes: mockData.tagDataTypes || [],
            fillFields: true, // Điền trường với giá trị mặc định (tên trường)
            makeFieldsEditable: true, // Giữ trường có thể chỉnh sửa
          }
        );

        // 7. Tạo File mới từ PDF bytes
        const newFile = new File(
          [result.pdfBytes],
          uploadedFile?.name || "contract.pdf",
          { type: "application/pdf" }
        );

        // 8. Tạo blob URL mới để xem trước
        const newUrl = URL.createObjectURL(newFile);

        // 9. Cập nhật state local (uploadedFile, fileUrl)
        setUploadedFile(newFile);
        setFileUrl(newUrl);

        // 10. Cập nhật tagsData với PDF mới và mapping
        handleTagsDataChange((prev) => ({
          ...prev,
          modifiedPdfBytes: result.pdfBytes,
          uploadedFile: newFile,
          mappings: {
            ...prev.mappings,
            ...mapping,
          },
          documentTagsObject: {
            ...prev.documentTagsObject,
            [fieldData.key]: tempTag.dataType, // Chỉ lưu giá trị dataType, không phải toàn bộ object
          },
        }));

        // 11. Buộc refresh thông qua FileUploadPreview imperative handle
        setTimeout(() => {
          if (filePreviewRef?.current?.updateFillablePDF) {
            filePreviewRef.current.updateFillablePDF(newFile, result.pdfBytes);
          }
        }, 300);
      } catch (error) {
        console.error("❌ Lỗi khi tạo AcroForm:", error);
        throw error;
      }
    },
    [
      uploadedFile,
      mockData.tagDataTypes,
      handleTagsDataChange,
      filePreviewRef,
      setUploadedFile,
      setFileUrl,
    ]
  );

  // 🆕 BATCH MODE: Xử lý tạo nhiều trường cùng lúc với single PDF rebuild
  const handleBatchCreateFields = useCallback(
    async (stagedFields) => {
      try {
        message.loading({
          content: "Đang tạo tất cả trường thông tin...",
          key: "batch-create",
          duration: 0,
        });

        // 1. Validate all fields
        const existingKeys = tagsData.tags.map((t) => t.key);
        const newKeys = stagedFields.map((f) => f.key);

        // Check duplicates within staged fields
        const duplicates = newKeys.filter((k, i) => newKeys.indexOf(k) !== i);
        if (duplicates.length > 0) {
          message.destroy("batch-create");
          message.error(`Tên trường trùng lặp: ${duplicates.join(", ")}`);
          return false;
        }

        // Check conflicts with existing
        const conflicts = newKeys.filter((k) => existingKeys.includes(k));
        if (conflicts.length > 0) {
          message.destroy("batch-create");
          message.error(`Tên trường đã tồn tại: ${conflicts.join(", ")}`);
          return false;
        }

        // Check empty fields
        const empty = stagedFields.filter((f) => !f.key || !f.dataType);
        if (empty.length > 0) {
          message.destroy("batch-create");
          message.error(`Có ${empty.length} trường chưa điền đầy đủ thông tin`);
          return false;
        }

        // 2. Convert stagedFields → placeholders + tags + mappings
        const newPlaceholders = [];
        const newTags = [];
        const newMappings = {};

        stagedFields.forEach((field) => {
          const placeholderId = `batch-${Date.now()}-${field.position}`;
          const tagId = `tag-batch-${Date.now()}-${field.position}`;

          newPlaceholders.push({
            id: placeholderId,
            original: `(${field.position})`,
            fullText: `(${field.position})`,
            page: field.page,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            backgroundX: field.backgroundX,
            backgroundWidth: field.backgroundWidth,
            fontSize: field.fontSize,
            isManual: true,
            mappedKey: field.key,
            mappedDataType: field.dataType,
          });

          newTags.push({
            id: tagId,
            key: field.key,
            dataType: field.dataType,
            dataTypeLabel:
              mockData.tagDataTypes?.find((t) => t.value === field.dataType)
                ?.label || field.dataType,
            defaultValue: field.key,
            createdFromScan: true,
          });

          newMappings[placeholderId] = tagId;
        });

        // 3. Call createFillablePDFFromMappings ONCE with ALL fields
        if (!uploadedFile) {
          throw new Error("Không tìm thấy file PDF");
        }

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const result = await createFillablePDFFromMappings(
          arrayBuffer,
          newPlaceholders, // All placeholders
          newMappings, // All mappings
          newTags, // All tags
          {
            tagDataTypes: mockData.tagDataTypes || [],
            fillFields: true,
            makeFieldsEditable: true,
          }
        );

        // 4. Create new File
        const newFile = new File(
          [result.pdfBytes],
          uploadedFile?.name || "contract.pdf",
          { type: "application/pdf" }
        );

        const newUrl = URL.createObjectURL(newFile);

        // 5. Update states
        setUploadedFile(newFile);
        setFileUrl(newUrl);

        // 6. Update tagsData with ALL new data
        handleTagsDataChange((prev) => ({
          ...prev,
          tags: [...prev.tags, ...newTags],
          modifiedPdfBytes: result.pdfBytes,
          uploadedFile: newFile,
          placeholders: [...prev.placeholders, ...newPlaceholders],
          mappings: { ...prev.mappings, ...newMappings },
          documentTagsObject: {
            ...prev.documentTagsObject,
            ...Object.fromEntries(
              newTags.map((tag) => [tag.key, tag.dataType])
            ),
          },
          stagedFields: [], // Clear staging
          batchMode: false, // Exit batch mode
        }));

        setDetectedPlaceholders((prev) => [...prev, ...newPlaceholders]);

        // 7. Refresh preview
        setTimeout(() => {
          if (filePreviewRef?.current?.updateFillablePDF) {
            filePreviewRef.current.updateFillablePDF(newFile, result.pdfBytes);
          }
        }, 300);

        message.destroy("batch-create");
        message.success(
          `Đã tạo thành công ${stagedFields.length} trường thông tin!`
        );
        return true;
      } catch (error) {
        message.destroy("batch-create");
        message.error(`Lỗi khi tạo trường: ${error.message}`);
        console.error("❌ Batch create error:", error);
        return false;
      }
    },
    [
      uploadedFile,
      mockData.tagDataTypes,
      handleTagsDataChange,
      tagsData.tags,
      filePreviewRef,
      setUploadedFile,
      setFileUrl,
    ]
  );

  // Lấy index của bước hiện tại
  const getCurrentStepIndex = () => {
    const tabs = Object.values(TABS);
    return tabs.findIndex((tab) => tab === currentTab);
  };

  // Kiểm tra tab đã hoàn thành chưa
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

  // Lấy thông báo validation cho tab hiện tại
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

  // Cấu hình các tab
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
          basicData={basicData}
          onDataChange={handleConfigurationDataChange}
          onAddTriggerCondition={handleAddTriggerCondition}
          onRemoveTriggerCondition={handleRemoveTriggerCondition}
          onUpdateTriggerCondition={handleUpdateTriggerCondition}
          onAddBlackoutPeriod={handleAddBlackoutPeriod}
          onRemoveBlackoutPeriod={handleRemoveBlackoutPeriod}
          onUpdateBlackoutPeriod={handleUpdateBlackoutPeriod}
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
          handleBatchCreateFields={handleBatchCreateFields}
          handleAddStagedField={handleAddStagedField}
          handleUpdateStagedField={handleUpdateStagedField}
          handleDeleteStagedField={handleDeleteStagedField}
          uploadedFile={uploadedFile}
          fileUrl={fileUrl}
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
          Tạo Hợp đồng mẫu Bảo hiểm Nông nghiệp Mới
        </Title>
        <Text type="secondary">
          Tạo hợp đồng mẫu bảo hiểm tham số được hỗ trợ bởi vệ tinh
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
          <Card style={{ padding: 0, border: "1px solid #f0f0f0" }}>
            <Tabs
              activeKey={currentTab}
              onChange={handleTabChange}
              items={tabItems}
              size="large"
              type="card"
              tabBarStyle={{
                margin: 0,
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
              }}
              moreIcon={
                <Space style={{ marginLeft: "auto", flexShrink: 0 }}>
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
