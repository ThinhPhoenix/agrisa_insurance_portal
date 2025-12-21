"use client";

import SelectedColumn from "@/components/column-selector";
import { CustomForm } from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import { getApprovalInfo } from "@/libs/message";
import { CANCEL_REQUEST_MESSAGES } from "@/libs/message/cancel-request-message";
import { useActivePolicies } from "@/services/hooks/policy/use-active-policies";
import { useCancelPolicy } from "@/services/hooks/policy/use-cancel-policy";
import { useImgBBUpload } from "@/services/hooks/common/use-imgbb-upload";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  SafetyOutlined,
  SearchOutlined,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Form,
  Image,
  Input,
  Layout,
  message,
  Modal,
  Radio,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  Upload,
} from "antd";
import Link from "next/link";
import { useRef, useState } from "react";
import "../policy.css";

const { Title, Text } = Typography;

export default function ActivePoliciesPage() {
  const {
    paginatedData,
    allPolicies,
    searchText,
    handleFormSubmit,
    handleClearFilters,
    paginationConfig,
    loading,
  } = useActivePolicies();

  const { createCancelRequest } = useCancelPolicy();
  const { uploadImageToImgBB } = useImgBBUpload();

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState([
    "policy_number",
    "farmer_id",
    "status",
    "underwriting_status",
    "created_at",
  ]);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [imageFieldCount, setImageFieldCount] = useState(1);
  const cancelFormRef = useRef(null);
  const imageFormRef = useRef(null);

  // File upload states
  const [imageUploadMode, setImageUploadMode] = useState([]); // Array of 'file' or 'url' for each image field
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of File objects
  const [filePreviewUrls, setFilePreviewUrls] = useState([]); // Array of blob URLs for preview

  // Calculate summary stats using allPolicies (unpaginated)
  const summaryStats = {
    totalPolicies: allPolicies.length,
    activePolicies: allPolicies.filter((p) => p.status === "active").length,
    totalPremium: allPolicies.reduce(
      (sum, p) => sum + (p.total_farmer_premium || 0),
      0
    ),
    totalCoverage: allPolicies.reduce(
      (sum, p) => sum + (p.coverage_amount || 0),
      0
    ),
  };

  // Handle form submit
  const handleFormSubmitWrapper = (formData) => {
    handleFormSubmit(formData);
  };

  // Handle clear filters
  const handleClearFiltersWrapper = () => {
    handleClearFilters();
  };

  // Handle cancel request
  const handleCancelRequest = (policy) => {
    setSelectedPolicy(policy);
    setCancelModalVisible(true);

    // Initialize upload states - default to 'file' mode
    setImageUploadMode(Array(imageFieldCount).fill('file'));
    setSelectedFiles([]);
    setFilePreviewUrls([]);
  };

  // Handle file selection for a specific image index
  const handleFileSelect = (index, file) => {
    if (!file) return;

    // Update selected files
    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles[index] = file;
    setSelectedFiles(newSelectedFiles);

    // Create and store preview URL
    const newPreviewUrls = [...filePreviewUrls];
    // Revoke old URL if exists to prevent memory leak
    if (newPreviewUrls[index]) {
      URL.revokeObjectURL(newPreviewUrls[index]);
    }
    newPreviewUrls[index] = URL.createObjectURL(file);
    setFilePreviewUrls(newPreviewUrls);
  };

  // Handle mode change for a specific image index
  const handleModeChange = (index, mode) => {
    const newModes = [...imageUploadMode];
    newModes[index] = mode;
    setImageUploadMode(newModes);

    // Clear file and preview if switching to URL mode
    if (mode === 'url') {
      const newSelectedFiles = [...selectedFiles];
      newSelectedFiles[index] = null;
      setSelectedFiles(newSelectedFiles);

      const newPreviewUrls = [...filePreviewUrls];
      if (newPreviewUrls[index]) {
        URL.revokeObjectURL(newPreviewUrls[index]);
        newPreviewUrls[index] = null;
      }
      setFilePreviewUrls(newPreviewUrls);
    }
  };

  const handleSubmitCancelRequest = async () => {
    try {
      // Validate main form (Tab 1)
      const mainFormValues = await cancelFormRef.current.validateFields();

      // Validate image form (Tab 2)
      const imageFormValues = await imageFormRef.current.validateFields();

      Modal.confirm({
        title: "Xác nhận gửi yêu cầu hủy",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Bạn có chắc chắn muốn gửi yêu cầu hủy hợp đồng này không?</p>
            <p className="mt-2 text-sm text-gray-500">
              Hợp đồng sẽ chuyển sang trạng thái "Chờ hủy" và chờ bên bảo hiểm
              xem xét.
            </p>
          </div>
        ),
        okText: "Xác nhận gửi",
        cancelText: "Hủy",
        onOk: async () => {
          setSubmittingCancel(true);
          try {
            // Step 1: Upload images to ImgBB (if any files are selected)
            const images = [];
            const hasFilesToUpload = selectedFiles.some(file => file);

            if (hasFilesToUpload) {
              message.loading({
                content: CANCEL_REQUEST_MESSAGES.INFO.UPLOADING_IMAGES,
                key: 'uploading',
                duration: 0,
              });
            }

            for (let i = 0; i < imageFieldCount; i++) {
              const mode = imageUploadMode[i] || 'file';
              const comment = imageFormValues[`image_${i}_comment`];
              let finalUrl = null;

              if (mode === 'file' && selectedFiles[i]) {
                // Upload file to ImgBB
                const uploadResult = await uploadImageToImgBB(selectedFiles[i]);

                if (!uploadResult.success) {
                  message.destroy('uploading');
                  message.error(
                    uploadResult.error || CANCEL_REQUEST_MESSAGES.ERROR.IMAGE_UPLOAD_FAILED
                  );
                  setSubmittingCancel(false);
                  return; // Stop if upload fails
                }

                finalUrl = uploadResult.url;
              } else if (mode === 'url') {
                // Use URL from form input
                finalUrl = imageFormValues[`image_${i}_url`];
              }

              // Add to images array if we have a URL
              if (finalUrl && finalUrl.trim()) {
                images.push({
                  url: finalUrl.trim(),
                  comment: comment ? comment.trim() : "",
                });
              }
            }

            // Destroy uploading message
            message.destroy('uploading');

            // Step 2: Create cancel request with image URLs
            message.loading({
              content: CANCEL_REQUEST_MESSAGES.INFO.CREATING,
              key: 'creating',
              duration: 0,
            });

            const evidence = {
              description: mainFormValues.evidence_description || "",
              images: images,
            };

            const result = await createCancelRequest(selectedPolicy.id, {
              cancel_request_type: mainFormValues.cancel_request_type,
              reason: mainFormValues.reason,
              evidence: evidence,
            });

            message.destroy('creating');

            if (result.success) {
              message.success(CANCEL_REQUEST_MESSAGES.SUCCESS.CREATED);
              setCancelModalVisible(false);
              // Reset states
              setImageFieldCount(1);
              setImageUploadMode([]);
              setSelectedFiles([]);
              // Revoke all preview URLs
              filePreviewUrls.forEach(url => {
                if (url) URL.revokeObjectURL(url);
              });
              setFilePreviewUrls([]);
              // Refresh the list
              window.location.reload();
            } else {
              message.error(result.error || CANCEL_REQUEST_MESSAGES.ERROR.CREATE_FAILED);
            }
          } catch (error) {
            console.error("Error submitting cancel request:", error);
            message.destroy('uploading');
            message.destroy('creating');
            message.error(error.message || CANCEL_REQUEST_MESSAGES.ERROR.UNKNOWN_ERROR);
          } finally {
            setSubmittingCancel(false);
          }
        },
      });
    } catch (error) {
      // Form validation failed - errors are shown by Form component
      return;
    }
  };

  // Get status color for policy status
  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "default";
      case "pending_review":
        return "orange";
      case "pending_payment":
        return "gold";
      case "active":
        return "green";
      case "expired":
        return "volcano";
      case "cancelled":
        return "red";
      case "rejected":
        return "red";
      case "dispute":
        return "volcano";
      case "pending_cancel":
        return "orange";
      default:
        return "default";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "draft":
        return "Bản nháp";
      case "pending_review":
        return "Chờ duyệt";
      case "pending_payment":
        return "Chờ thanh toán";
      case "active":
        return "Đang hoạt động";
      case "expired":
        return "Hết hạn";
      case "cancelled":
        return "Đã hủy";
      case "rejected":
        return "Đã từ chối";
      case "dispute":
        return "Tranh chấp";
      case "pending_cancel":
        return "Chờ hủy";
      default:
        return status;
    }
  };

  // Get underwriting status color
  const getUnderwritingStatusColor = (underwritingStatus) => {
    switch (underwritingStatus) {
      case "pending":
        return "gold";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  // Get underwriting status text
  const getUnderwritingStatusText = (underwritingStatus) => {
    switch (underwritingStatus) {
      case "pending":
        return "Chờ thẩm định";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return underwritingStatus;
    }
  };

  // Table columns
  const columns = [
    {
      title: "Số hợp đồng",
      dataIndex: "policy_number",
      key: "policy_number",
      width: 150,
      render: (_, record) => (
        <div className="insurance-package-id">{record.policy_number}</div>
      ),
    },
    // {
    //   title: "Mã nông dân",
    //   dataIndex: "farmer_id",
    //   key: "farmer_id",
    //   width: 150,
    //   render: (_, record) => (
    //     <div className="insurance-package-name">{record.farmer_id}</div>
    //   ),
    // },
    {
      title: "Trạng thái đơn",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (_, record) => (
        <Tag
          color={getStatusColor(record.status)}
          className="insurance-status-tag"
        >
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: "Trạng thái bảo hiểm",
      dataIndex: "underwriting_status",
      key: "underwriting_status",
      width: 150,
      render: (_, record) => (
        <Tag
          color={getUnderwritingStatusColor(record.underwriting_status)}
          className="insurance-status-tag"
        >
          {getUnderwritingStatusText(record.underwriting_status)}
        </Tag>
      ),
    },
    {
      title: "Số tiền bảo hiểm",
      dataIndex: "coverage_amount",
      key: "coverage_amount",
      width: 150,
      render: (val) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(val),
    },
    {
      title: "Phí bảo hiểm",
      dataIndex: "total_farmer_premium",
      key: "total_farmer_premium",
      width: 150,
      render: (val) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(val),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (_, record) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">
            {new Date(record.created_at).toLocaleDateString("vi-VN")}
          </div>
        </div>
      ),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "coverage_end_date",
      key: "coverage_end_date",
      width: 120,
      render: (_, record) => (
        <div className="insurance-statistics">
          <div className="insurance-stat-item">
            {new Date(record.coverage_end_date * 1000).toLocaleDateString(
              "vi-VN"
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <div className="insurance-actions-cell">
          <Space size="small">
            <Link href={`/policy/policy-detail?id=${record.id}&type=active`}>
              <Button
                type="dashed"
                size="small"
                className="insurance-action-btn !bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
              >
                <EyeOutlined size={14} />
                Xem
              </Button>
            </Link>
            {record.status === "active" && (
              <Button
                type="dashed"
                size="small"
                danger
                onClick={() => handleCancelRequest(record)}
                className="insurance-action-btn"
              >
                <CloseCircleOutlined size={14} />
                Yêu cầu hủy
              </Button>
            )}
          </Space>
        </div>
      ),
    },
  ];

  // Generate cancel form fields
  const generateCancelFormFields = () => {
    return [
      {
        name: "cancel_request_type",
        type: "select",
        label: "Loại yêu cầu",
        required: true,
        options: [
          { label: "Yêu cầu từ đối tác", value: "policyholder_request" },
          { label: "Vi phạm hợp đồng", value: "contract_violation" },
          { label: "Khác", value: "other" },
        ],
      },
      {
        name: "reason",
        type: "textarea",
        label: "Lý do hủy",
        placeholder: "Nhập lý do chi tiết yêu cầu hủy hợp đồng...",
        required: true,
      },
      {
        name: "evidence_description",
        type: "textarea",
        label: "Mô tả bằng chứng",
        placeholder: "Mô tả chi tiết các bằng chứng đính kèm (tùy chọn)",
      },
    ];
  };

  // Render single image field with URL/File toggle
  const renderImageField = (index) => {
    const mode = imageUploadMode[index] || 'file';
    const previewUrl = filePreviewUrls[index];

    return (
      <div key={index} className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <label className="font-medium">Hình ảnh {index + 1}</label>
          <Radio.Group
            value={mode}
            onChange={(e) => handleModeChange(index, e.target.value)}
            size="small"
          >
            <Radio.Button value="file">Tải file</Radio.Button>
            <Radio.Button value="url">Nhập URL</Radio.Button>
          </Radio.Group>
        </div>

        {mode === 'file' ? (
          <div className="space-y-2">
            {!previewUrl ? (
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileSelect(index, file);
                  return false; // Prevent auto-upload
                }}
              >
                <Button icon={<UploadOutlined />} block>
                  Chọn hình ảnh
                </Button>
              </Upload>
            ) : (
              <div className="space-y-2">
                {/* Preview với Image component của Ant Design (có zoom) */}
                <div className="relative border border-gray-300 rounded-lg p-2 bg-white">
                  {/* Nút xóa ở góc trên phải */}
                  <Button
                    danger
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      // Xóa ảnh đã chọn
                      const newSelectedFiles = [...selectedFiles];
                      newSelectedFiles[index] = null;
                      setSelectedFiles(newSelectedFiles);

                      // Revoke và xóa preview URL
                      if (filePreviewUrls[index]) {
                        URL.revokeObjectURL(filePreviewUrls[index]);
                      }
                      const newPreviewUrls = [...filePreviewUrls];
                      newPreviewUrls[index] = null;
                      setFilePreviewUrls(newPreviewUrls);
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      zIndex: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Image
                    src={previewUrl}
                    alt={`Preview ${index + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    preview={{
                      mask: 'Xem ảnh',
                    }}
                  />
                  {selectedFiles[index] && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {selectedFiles[index].name}
                    </p>
                  )}
                </div>
                {/* Nút thay đổi ảnh */}
                <Upload
                  accept="image/*"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleFileSelect(index, file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} size="small" block type="dashed">
                    Thay đổi ảnh
                  </Button>
                </Upload>
              </div>
            )}
          </div>
        ) : (
          <Input
            placeholder="https://example.com/image.jpg"
            onChange={(e) => {
              // Update form value for URL mode
              if (imageFormRef.current) {
                imageFormRef.current.setFieldsValue({
                  [`image_${index}_url`]: e.target.value,
                });
              }
            }}
          />
        )}

        <div className="space-y-1">
          <label className="text-sm text-gray-600">Ghi chú</label>
          <Input
            placeholder="Ví dụ: Hình hôm 20/12/2025 thửa ruộng bị xới"
            onChange={(e) => {
              // Update form value for comment
              if (imageFormRef.current) {
                imageFormRef.current.setFieldsValue({
                  [`image_${index}_comment`]: e.target.value,
                });
              }
            }}
          />
        </div>
      </div>
    );
  };

  // Search fields - no status filter needed as we already filter active policies
  const searchFields = [
    {
      name: "search",
      label: "Tìm kiếm",
      type: "input",
      placeholder: "Tìm theo số HĐ...",
      value: searchText,
    },
    {
      name: "searchButton",
      label: " ",
      type: "button",
      variant: "primary",
      buttonText: "Tìm kiếm",
      startContent: <SearchOutlined size={14} />,
      isSubmit: true,
    },
    {
      name: "clearButton",
      label: " ",
      type: "button",
      variant: "dashed",
      buttonText: "Xóa bộ lọc",
      startContent: <FilterOutlined size={14} />,
      onClick: handleClearFiltersWrapper,
    },
  ];

  if (loading) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip={getApprovalInfo("LOADING_LIST")} />
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="insurance-header">
          <div>
            <Title level={2} className="insurance-title">
              Đơn Bảo Hiểm Đang Hoạt Động
            </Title>
            <Text className="insurance-subtitle">
              Quản lý và theo dõi các đơn bảo hiểm nông nghiệp đang hoạt động
            </Text>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="insurance-summary-row">
          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon total">
              <FileTextOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.totalPolicies}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng đơn hoạt động
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon active">
              <CheckCircleOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {summaryStats.activePolicies}
              </div>
              <div className="insurance-summary-label-compact">
                Đang hiệu lực
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon policies">
              <SafetyOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(summaryStats.totalCoverage)}
              </div>
              <div className="insurance-summary-label-compact">
                Tổng số tiền BH
              </div>
            </div>
          </div>

          <div className="insurance-summary-card-compact">
            <div className="insurance-summary-icon satisfaction">
              <StarOutlined />
            </div>
            <div className="insurance-summary-content">
              <div className="insurance-summary-value-compact">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(summaryStats.totalPremium)}
              </div>
              <div className="insurance-summary-label-compact">Tổng phí BH</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="insurance-filters">
          <Collapse
            items={[
              {
                key: "1",
                label: (
                  <Space>
                    <FilterOutlined />
                    Bộ lọc tìm kiếm
                  </Space>
                ),
                children: (
                  <div className="insurance-filter-form">
                    <div className="space-y-4">
                      <CustomForm
                        fields={searchFields}
                        gridColumns="1fr 1fr 1fr"
                        gap="16px"
                        onSubmit={handleFormSubmitWrapper}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Table */}
        <div className="insurance-table-wrapper">
          <div className="flex justify-start items-center gap-2 mb-2">
            <Button icon={<DownloadOutlined />}>Xuất excel</Button>
            <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
            <SelectedColumn
              columns={columns}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
            />
          </div>

          <CustomTable
            columns={columns}
            dataSource={paginatedData}
            visibleColumns={visibleColumns}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={paginationConfig}
          />
        </div>

        {/* Cancel Request Modal */}
        <Modal
          title="Yêu cầu hủy hợp đồng bảo hiểm"
          open={cancelModalVisible}
          onOk={handleSubmitCancelRequest}
          onCancel={() => {
            // Revoke all blob URLs to prevent memory leaks
            filePreviewUrls.forEach(url => {
              if (url) URL.revokeObjectURL(url);
            });
            // Reset all states
            setCancelModalVisible(false);
            setImageFieldCount(1);
            setImageUploadMode([]);
            setSelectedFiles([]);
            setFilePreviewUrls([]);
          }}
          confirmLoading={submittingCancel}
          okText="Gửi yêu cầu"
          cancelText="Hủy"
          width={800}
        >
          {selectedPolicy && (
            <div className="space-y-4">
              {/* <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p>
                  <strong>Số hợp đồng:</strong> {selectedPolicy.policy_number}
                </p>
                <p>
                  <strong>Mã nông dân:</strong> {selectedPolicy.farmer_id}
                </p>
              </div> */}

              <Tabs
                items={[
                  {
                    key: "1",
                    label: "Thông tin chung",
                    children: (
                      <CustomForm
                        ref={cancelFormRef}
                        fields={generateCancelFormFields()}
                        gridColumns="1fr"
                        gap="16px"
                      />
                    ),
                  },
                  {
                    key: "2",
                    label: "Bằng chứng hình ảnh",
                    children: (
                      <div className="space-y-4">
                        <Form ref={imageFormRef}>
                          {Array.from({ length: imageFieldCount }).map((_, i) =>
                            renderImageField(i)
                          )}
                        </Form>
                        <div className="flex gap-2">
                          <Button
                            type="dashed"
                            onClick={() => {
                              const newCount = imageFieldCount + 1;
                              setImageFieldCount(newCount);
                              // Extend upload mode array with default 'file'
                              setImageUploadMode([...imageUploadMode, 'file']);
                            }}
                          >
                            + Thêm hình ảnh
                          </Button>
                          {imageFieldCount > 1 && (
                            <Button
                              danger
                              type="dashed"
                              onClick={() => {
                                const newCount = imageFieldCount - 1;
                                setImageFieldCount(newCount);
                                // Remove last item from arrays
                                setImageUploadMode(imageUploadMode.slice(0, newCount));
                                const newFiles = selectedFiles.slice(0, newCount);
                                setSelectedFiles(newFiles);
                                // Revoke last preview URL
                                if (filePreviewUrls[imageFieldCount - 1]) {
                                  URL.revokeObjectURL(filePreviewUrls[imageFieldCount - 1]);
                                }
                                setFilePreviewUrls(filePreviewUrls.slice(0, newCount));
                              }}
                            >
                              - Xóa hình ảnh cuối
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Bạn có thể tải file hình ảnh lên hoặc nhập URL trực tiếp.
                          Có thể thêm nhiều hình ảnh minh họa cho yêu cầu.
                        </p>
                      </div>
                    ),
                  },
                ]}
              />

              <p className="text-sm text-gray-500 mt-4">
                Sau khi gửi yêu cầu, hợp đồng sẽ chuyển sang trạng thái "Chờ
                hủy" và bên bảo hiểm sẽ xem xét trong vòng 24-48 giờ.
              </p>
            </div>
          )}
        </Modal>
      </div>
    </Layout.Content>
  );
}
