"use client";

import { CustomForm } from "@/components/custom-form";
import OpenStreetMapWithPolygon from "@/components/map-polygon";
import { useInsurancePolicyDetail } from "@/services/hooks/policy/use-aproval";
import { DownloadOutlined, EnvironmentOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Image,
  Input,
  Layout,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import "../approval.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function InsurancePolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { policy, farm, satelliteData, farmAnalysis, loading } =
    useInsurancePolicyDetail(params.id);
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [decisionType, setDecisionType] = useState(null); // 'approve' or 'reject'
  const [form] = Form.useForm();
  const formRef = useRef();

  // Pagination state for photos
  const [currentPhotoPage, setCurrentPhotoPage] = useState(1);
  const photosPerPage = 12;

  const handleDecision = (type) => {
    setDecisionType(type);
    setDecisionModalVisible(true);
  };

  const handleDecisionSubmit = (values) => {
    // Simulate API call
    message.success(
      `${
        decisionType === "approve" ? "Chấp thuận" : "Từ chối"
      } đơn bảo hiểm thành công!`
    );
    setDecisionModalVisible(false);
    form.resetFields();
    // Redirect back to list
    router.push("/insurance/approval");
  };

  const handleFormSubmit = async () => {
    try {
      const values = await formRef.current?.validateFields();
      if (values) {
        handleDecisionSubmit(values);
      }
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  const getDecisionFormFields = () => {
    const baseFields = [];

    if (decisionType === "approve") {
      baseFields.push({
        name: "note",
        label: "Ghi chú duyệt",
        type: "textarea",
        placeholder: "Nhập ghi chú (nếu có)",
        required: false,
      });
    } else if (decisionType === "reject") {
      baseFields.push({
        name: "reason",
        label: "Lý do từ chối",
        type: "textarea",
        placeholder: "Nhập lý do từ chối đơn bảo hiểm",
        required: true,
      });
    }

    return baseFields;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "rejected":
        return "red";
      case "pending_review":
        return "orange";
      case "pending":
        return "blue";
      default:
        return "default";
    }
  };

  const formatUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `https://${url}`;
  };

  // Pagination logic
  const indexOfLastPhoto = currentPhotoPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos =
    farm?.farm_photos?.slice(indexOfFirstPhoto, indexOfLastPhoto) || [];

  const handlePageChange = (page) => {
    setCurrentPhotoPage(page);
  };

  if (loading || !policy) {
    return (
      <Layout.Content className="application-loading">
        <Spin size="large" tip="Đang tải thông tin đơn bảo hiểm..." />
      </Layout.Content>
    );
  }

  return (
    <div className="insurance-content">
      <div className="insurance-space">
        <Title level={2}>Chi tiết đơn bảo hiểm: {policy.policy_number}</Title>

        {/* Thông tin cơ bản - Full width */}
        <Row gutter={16} className="application-row">
          <Col xs={24} className="application-col-full">
            <Card title="Thông tin bảo hiểm" className="application-card-basic">
              <Row gutter={24}>
                <Col xs={24} lg={12}>
                  <Descriptions
                    column={1}
                    size="small"
                    className="application-descriptions"
                  >
                    <Descriptions.Item label="Số hợp đồng">
                      {policy.policy_number}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã nông dân">
                      {policy.farmer_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số tiền bảo hiểm">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(policy.coverage_amount)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phí bảo hiểm">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(policy.total_farmer_premium)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày trồng">
                      {new Date(policy.planting_date * 1000).toLocaleDateString(
                        "vi-VN"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày kết thúc bảo hiểm">
                      {new Date(
                        policy.coverage_end_date * 1000
                      ).toLocaleDateString("vi-VN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                      {new Date(policy.created_at).toLocaleDateString("vi-VN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={getStatusColor(policy.status)}>
                        {policy.status === "pending_review"
                          ? "Chờ duyệt"
                          : policy.status === "active"
                          ? "Đang hoạt động"
                          : policy.status}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>

                  {/* Thông tin trang trại */}
                  <Divider orientation="left" className="application-divider">
                    <EnvironmentOutlined /> Thông tin trang trại
                  </Divider>

                  {farm ? (
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Tên trang trại">
                        {farm.farm_name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ">
                        {farm.address}, {farm.commune}, {farm.district},{" "}
                        {farm.province}
                      </Descriptions.Item>
                      <Descriptions.Item label="Diện tích">
                        {(farm.area_sqm / 10000).toFixed(2)} ha
                      </Descriptions.Item>
                      <Descriptions.Item label="Loại cây trồng">
                        {farm.crop_type}
                      </Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Text type="secondary">
                      Không tìm thấy thông tin trang trại
                    </Text>
                  )}
                </Col>
                <Col xs={24} lg={12}>
                  {farm && (
                    <div style={{ height: "100%", minHeight: "400px" }}>
                      <OpenStreetMapWithPolygon
                        boundary={farm.boundary}
                        centerLocation={farm.center_location}
                      />
                    </div>
                  )}
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Phân tích trang trại (nếu có) */}
        {farmAnalysis && (
          <Card
            title="Phân tích trang trại chi tiết"
            className="application-card-analysis mt-4"
          >
            <Row gutter={16}>
              <Col span={8}>
                <Title level={4}>Sức khỏe cây trồng</Title>
                <Text>
                  NDVI trung bình: {farmAnalysis.crop_health.average_ndvi}
                </Text>
                <br />
                <Text>
                  Tỷ lệ che phủ: {farmAnalysis.crop_health.coverage_rate}%
                </Text>
                <br />
                <Text>
                  Giai đoạn tăng trưởng: {farmAnalysis.crop_health.growth_stage}
                </Text>
              </Col>
              <Col span={8}>
                <Title level={4}>Điều kiện đất đai</Title>
                <Text>Loại đất: {farmAnalysis.soil_conditions.soil_type}</Text>
                <br />
                <Text>Độ ẩm: {farmAnalysis.soil_conditions.moisture}</Text>
                <br />
                <Text>pH: {farmAnalysis.soil_conditions.ph_level}</Text>
              </Col>
              <Col span={8}>
                <Title level={4}>Mô hình thời tiết</Title>
                <Text>
                  Nhiệt độ trung bình:{" "}
                  {farmAnalysis.weather_model.average_temperature}°C
                </Text>
                <br />
                <Text>Độ ẩm: {farmAnalysis.weather_model.humidity}%</Text>
                <br />
                <Text>
                  Lượng mưa 30 ngày:{" "}
                  {farmAnalysis.weather_model.rainfall_30days} mm
                </Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* Hình ảnh bằng chứng */}
        {(farm?.land_certificate_url ||
          (farm?.farm_photos && farm.farm_photos.length > 0)) && (
          <Card
            title="Hình ảnh bằng chứng"
            className="application-card-images mt-4"
          >
            <div className="space-y-6">
              {/* Giấy chứng nhận */}
              {farm?.land_certificate_url && (
                <div>
                  <Title level={5} className="mb-3">
                    Giấy chứng nhận quyền sử dụng đất
                  </Title>
                  <Image.PreviewGroup>
                    <Row gutter={[16, 16]}>
                      {farm.land_certificate_url
                        .split("|")
                        .map((url, index) => (
                          <Col
                            xs={12}
                            sm={8}
                            md={6}
                            lg={4}
                            key={`cert-${index}`}
                          >
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <Image
                                width="100%"
                                height={150}
                                src={formatUrl(url)}
                                alt={`Giấy chứng nhận ${index + 1}`}
                                style={{ objectFit: "cover" }}
                                className="w-full"
                              />
                            </div>
                          </Col>
                        ))}
                    </Row>
                  </Image.PreviewGroup>
                </div>
              )}

              {farm?.land_certificate_url &&
                farm?.farm_photos &&
                farm.farm_photos.length > 0 && <Divider />}

              {/* Ảnh vệ tinh/thực địa */}
              {farm?.farm_photos && farm.farm_photos.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Title level={5} className="mb-0">
                      Hình ảnh vệ tinh & thực địa ({farm.farm_photos.length}{" "}
                      ảnh)
                    </Title>
                  </div>

                  <Image.PreviewGroup>
                    <Row gutter={[16, 16]}>
                      {currentPhotos.map((photo, index) => (
                        <Col
                          xs={12}
                          sm={8}
                          md={6}
                          lg={4}
                          key={photo.id || index}
                        >
                          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                            <div className="relative pt-[75%]">
                              {" "}
                              {/* 4:3 Aspect Ratio */}
                              <div className="absolute inset-0">
                                <Image
                                  width="100%"
                                  height="100%"
                                  src={formatUrl(photo.photo_url)}
                                  alt={`Ảnh ${photo.photo_type}`}
                                  style={{ objectFit: "cover" }}
                                  className="w-full h-full"
                                />
                              </div>
                            </div>
                            <div className="p-2 bg-gray-50 border-t border-gray-100 flex-1">
                              <div className="flex justify-between items-start">
                                <Tag
                                  color={
                                    photo.photo_type === "satellite"
                                      ? "blue"
                                      : "green"
                                  }
                                  className="mr-0 mb-1 text-[10px]"
                                >
                                  {photo.photo_type === "satellite"
                                    ? "Vệ tinh"
                                    : "Thực địa"}
                                </Tag>
                              </div>
                              <Text type="secondary" className="text-xs block">
                                {new Date(
                                  photo.taken_at * 1000
                                ).toLocaleDateString("vi-VN")}
                              </Text>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Image.PreviewGroup>

                  {farm.farm_photos.length > photosPerPage && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        current={currentPhotoPage}
                        total={farm.farm_photos.length}
                        pageSize={photosPerPage}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showQuickJumper
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tài liệu (nếu có) */}
        {policy.signed_policy_document_url && (
          <Card title="Tài liệu" className="application-card-documents mt-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card
                  size="small"
                  className="application-doc-card border border-gray-200"
                  onClick={() =>
                    window.open(policy.signed_policy_document_url, "_blank")
                  }
                >
                  <div className="application-doc-content">
                    <DownloadOutlined className="application-doc-icon" />
                    <div className="application-doc-type">PDF</div>
                    <div className="application-doc-name">
                      Hợp đồng bảo hiểm đã ký
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        <Divider />

        <Space className="application-actions">
          <Button onClick={() => router.push("/insurance/approval")}>
            Quay lại
          </Button>
          <Button danger onClick={() => handleDecision("reject")}>
            Từ chối đơn
          </Button>
          <Button type="primary" onClick={() => handleDecision("approve")}>
            Chấp thuận đơn
          </Button>
        </Space>

        <Modal
          title={
            decisionType === "approve"
              ? "Chấp thuận đơn bảo hiểm"
              : "Từ chối đơn bảo hiểm"
          }
          open={decisionModalVisible}
          onCancel={() => setDecisionModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setDecisionModalVisible(false)}>
              Hủy
            </Button>,
            <Button key="submit" type="primary" onClick={handleFormSubmit}>
              Xác nhận
            </Button>,
          ]}
          width={600}
        >
          <CustomForm
            ref={formRef}
            fields={getDecisionFormFields()}
            onSubmit={handleDecisionSubmit}
            gridColumns="1fr"
            gap="16px"
          />
        </Modal>
      </div>
    </div>
  );
}
