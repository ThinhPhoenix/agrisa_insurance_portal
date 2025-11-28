"use client";

import { CustomForm } from "@/components/custom-form";
import OpenStreetMapWithPolygon from "@/components/map-polygon";
import { useApplicationDetail } from "@/services/hooks/policy/use-pending-policies";
import { DownloadOutlined, EnvironmentOutlined } from "@ant-design/icons";
import {
  Avatar,
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
import "../applications.css";
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function PendingApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { application, satelliteData, farmAnalysis, loading } =
    useApplicationDetail(params.id);
  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [decisionType, setDecisionType] = useState(null); // 'approve' or 'reject'
  const [form] = Form.useForm();
  const formRef = useRef();

  const handleDecision = (type) => {
    setDecisionType(type);
    setDecisionModalVisible(true);
  };

  const handleDecisionSubmit = (values) => {
    // Simulate API call
    message.success(
      `${
        decisionType === "approve" ? "Chấp thuận" : "Từ chối"
      } đơn đăng ký thành công!`
    );
    setDecisionModalVisible(false);
    form.resetFields();
    // Redirect back to list
    router.push("/applications");
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
      baseFields.push(
        {
          name: "premium_rate",
          label: "Tỷ lệ phí bảo hiểm (%)",
          type: "number",
          placeholder: "Nhập tỷ lệ phí bảo hiểm",
          required: true,
          min: 0,
          max: 100,
          step: 0.01,
        },
        {
          name: "coverage_terms",
          label: "Điều khoản bảo hiểm",
          type: "textarea",
          placeholder: "Nhập điều khoản bảo hiểm chi tiết",
          required: true,
        }
      );
    } else if (decisionType === "reject") {
      baseFields.push({
        name: "reason",
        label: "Lý do từ chối",
        type: "textarea",
        placeholder: "Nhập lý do từ chối đơn đăng ký",
        required: true,
      });
    }

    return baseFields;
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "Thấp":
      case "Low":
        return "green";
      case "Trung bình":
      case "Medium":
        return "orange";
      case "Cao":
      case "High":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã phê duyệt":
      case "approved":
        return "green";
      case "Đã từ chối":
      case "rejected":
        return "red";
      case "Đang chờ đánh giá":
      case "awaiting_assessment":
        return "orange";
      case "Đang được đánh giá":
      case "under_assessment":
        return "purple";
      case "Đang chờ xử lý":
      case "pending":
        return "blue";
      default:
        return "default";
    }
  };

  const getRiskText = (riskLevel) => {
    switch (riskLevel) {
      case "Low":
        return "Thấp";
      case "Medium":
        return "Trung bình";
      case "High":
        return "Cao";
      default:
        return riskLevel;
    }
  };

  const getHealthStatusText = (healthStatus) => {
    switch (healthStatus) {
      case "good":
        return "Tốt";
      case "average":
        return "Trung bình";
      case "poor":
        return "Kém";
      case "excellent":
        return "Xuất sắc";
      default:
        return healthStatus;
    }
  };

  if (loading || !application) {
    return (
      <Layout.Content className="application-loading">
        <Spin size="large" tip="Đang tải thông tin đơn đăng ký..." />
      </Layout.Content>
    );
  }

  return (
    <div className="application-main">
      <Title level={2}>Chi tiết đơn đăng ký: {application.id}</Title>

      {/* Thông tin cơ bản - Full width */}
      <Row gutter={16} className="application-row">
        <Col xs={24} className="application-col-full">
          <Card title="Thông tin cơ bản" className="application-card-basic">
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <div className="application-farmer-info">
                  <Avatar
                    size={48}
                    src={application.farmer_photo}
                    alt={`Ảnh của ${application.farmer_name}`}
                    className="application-avatar"
                  />
                  <div>
                    <div className="application-farmer-name">
                      {application.farm_name}
                    </div>
                    <div className="application-farmer-id">
                      Mã chủ sở hữu: {application.owner_id}
                    </div>
                  </div>
                </div>
                <Descriptions
                  column={1}
                  size="small"
                  className="application-descriptions"
                >
                  <Descriptions.Item label="Loại cây trồng">
                    {application.crop_type}
                  </Descriptions.Item>
                  <Descriptions.Item label="Diện tích">
                    {(application.area_sqm / 10000).toFixed(2)} ha
                  </Descriptions.Item>
                  <Descriptions.Item label="Tỉnh">
                    {application.province}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {new Date(application.created_at).toLocaleDateString(
                      "vi-VN"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={getStatusColor(application.status)}>
                      {application.status === "awaiting_assessment"
                        ? "Đang chờ đánh giá"
                        : application.status === "under_assessment"
                        ? "Đang được đánh giá"
                        : application.status === "approved"
                        ? "Đã phê duyệt"
                        : application.status === "rejected"
                        ? "Đã từ chối"
                        : application.status === "pending"
                        ? "Đang chờ xử lý"
                        : application.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tọa độ GPS">
                    {application.gps_coordinates && (
                      <div
                        className="application-gps-container"
                        style={{ display: "block" }}
                      >
                        {application.gps_coordinates.map((coord, index) => (
                          <span key={index} className="application-gps-coord">
                            [{coord[0]}, {coord[1]}]
                          </span>
                        ))}
                      </div>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} lg={12}>
                {/* Vị trí trang trại */}
                <Divider orientation="left" className="application-divider">
                  <EnvironmentOutlined /> Vị trí trang trại
                </Divider>

                <Space
                  direction="vertical"
                  size="middle"
                  className="application-farm-location"
                  style={{ width: "100%" }}
                >
                  {/* OpenStreetMap with Polygon */}
                  <OpenStreetMapWithPolygon
                    boundary={application.boundary}
                    centerLocation={application.center_location}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Đánh giá rủi ro và Dữ liệu vệ tinh - Horizontal layout */}
      <Row gutter={16} className="application-row">
        <Col xs={24} lg={12}>
          <Card title="Đánh giá rủi ro" className="application-card-risk">
            <Descriptions column={1}>
              <Descriptions.Item label="Điểm rủi ro">
                {application.risk_score}
              </Descriptions.Item>
              <Descriptions.Item label="Mức độ rủi ro">
                <Tag color={getRiskColor(application.risk_level)}>
                  {getRiskText(application.risk_level)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tóm tắt">
                {application.risk_summary}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          {satelliteData && (
            <Card
              title="Dữ liệu vệ tinh"
              className="application-card-satellite"
            >
              <Descriptions column={1}>
                <Descriptions.Item label="NDVI">
                  {satelliteData.ndvi_index}
                </Descriptions.Item>
                <Descriptions.Item label="Tình trạng sức khỏe">
                  {getHealthStatusText(satelliteData.crop_health_status)}
                </Descriptions.Item>
                <Descriptions.Item label="Diện tích thực tế">
                  {satelliteData.actual_area} ha
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>

      {farmAnalysis && (
        <Card
          title="Phân tích trang trại chi tiết"
          className="application-card-analysis"
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
                Lượng mưa 30 ngày: {farmAnalysis.weather_model.rainfall_30days}{" "}
                mm
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      <Card title="Hình ảnh bằng chứng" className="application-card-images">
        <Row gutter={16}>
          <Col span={12}>
            <Title level={4}>Giấy chứng nhận quyền sử dụng đất</Title>
            <Image.PreviewGroup>
              <div className="application-image-group">
                {application.land_use_certificate_images?.map(
                  (image, index) => (
                    <Image
                      key={index}
                      width={150}
                      height={100}
                      src={image}
                      alt={`Giấy chứng nhận quyền sử dụng đất ${index + 1}`}
                      className="application-image"
                      preview={{
                        mask: "Xem chi tiết",
                      }}
                    />
                  )
                )}
              </div>
            </Image.PreviewGroup>
          </Col>
          <Col span={12}>
            <Title level={4}>Hình ảnh đất đai</Title>
            <Image.PreviewGroup>
              <div className="application-image-group">
                {application.land_images?.map((image, index) => (
                  <Image
                    key={index}
                    width={150}
                    height={100}
                    src={image}
                    alt={`Hình ảnh đất đai ${index + 1}`}
                    className="application-image"
                    preview={{
                      mask: "Xem chi tiết",
                    }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </Col>
        </Row>
      </Card>

      {/* Tài liệu đơn đăng ký */}
      <Card title="Tài liệu đơn đăng ký" className="application-card-documents">
        <Row gutter={[16, 16]}>
          {application.application_documents?.map((doc, index) => {
            const fileName = doc.split("/").pop();
            const fileType = fileName.split(".").pop().toUpperCase();
            return (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card
                  size="small"
                  className="application-doc-card"
                  hoverable
                  onClick={() => window.open(doc, "_blank")}
                >
                  <div className="application-doc-content">
                    <DownloadOutlined className="application-doc-icon" />
                    <div className="application-doc-type">{fileType}</div>
                    <div className="application-doc-name">{fileName}</div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Divider />

      <Space className="application-actions">
        <Button onClick={() => router.push("/applications")}>Quay lại</Button>
        <Button danger onClick={() => handleDecision("reject")}>
          Từ chối đơn đăng ký
        </Button>
        <Button type="primary" onClick={() => handleDecision("approve")}>
          Chấp thuận đơn đăng ký
        </Button>
      </Space>

      <Modal
        title={
          decisionType === "approve"
            ? "Chấp thuận đơn đăng ký"
            : "Từ chối đơn đăng ký"
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
  );
}
