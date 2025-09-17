"use client";

import { CustomForm } from "@/components/custom-form";
import { useApplicationDetail } from "@/services/hooks/applications/use-applications";
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

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function PendingApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { application, satelliteData, farmAnalysis } = useApplicationDetail(
    params.id
  );
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

  const getStatusText = (status) => {
    console.log("Status value:", status); // Debug log
    switch (status) {
      case "approved":
        return "Đã phê duyệt";
      case "rejected":
        return "Đã từ chối";
      case "awaiting_assessment":
        return "Đang chờ đánh giá";
      case "under_assessment":
        return "Đang được đánh giá";
      case "pending":
        return "Đang chờ xử lý";
      default:
        return status;
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

  if (!application) {
    return (
      <Layout.Content
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </Layout.Content>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>Chi tiết đơn đăng ký: {application.id}</Title>

      <Row gutter={16} style={{ alignItems: "stretch", marginBottom: "24px" }}>
        <Col xs={24} lg={14} style={{ display: "flex" }}>
          <Card
            title="Thông tin cơ bản"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            bodyStyle={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                padding: "8px",
                borderRadius: "6px",
              }}
            >
              <Avatar
                size={48}
                src={application.farmer_photo}
                alt={`Ảnh của ${application.farmer_name}`}
                style={{ marginRight: "12px" }}
              />
              <div>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                  {application.farmer_name}
                </div>
                <div style={{ color: "#666", fontSize: "12px" }}>
                  Mã: {application.id}
                </div>
              </div>
            </div>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Loại cây trồng">
                {application.crop_type}
              </Descriptions.Item>
              <Descriptions.Item label="Diện tích">
                {application.area} ha
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                {application.region}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">
                {new Date(application.submission_date).toLocaleDateString(
                  "vi-VN"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền bảo hiểm" span={2}>
                {application.insured_amount.toLocaleString()} VND
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
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
            </Descriptions>

            {/* Vị trí trang trại */}
            <Divider
              orientation="left"
              style={{ margin: "12px 0 6px 0", fontSize: "14px" }}
            >
              <EnvironmentOutlined /> Vị trí trang trại
            </Divider>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {application.farm_location_map && (
                <Button
                  type="link"
                  icon={<EnvironmentOutlined />}
                  onClick={() =>
                    window.open(application.farm_location_map, "_blank")
                  }
                  style={{ padding: 0, height: "auto", fontSize: "12px" }}
                  size="small"
                >
                  Xem bản đồ vị trí
                </Button>
              )}

              {application.gps_coordinates && (
                <div
                  style={{
                    background: "rgba(232, 245, 240, 0.7)", // primary-100 with transparency
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)", // Safari support
                    padding: "8px 12px",
                    borderRadius: "2px",
                    fontSize: "11px",
                    lineHeight: "1.3",
                  }}
                >
                  <Text strong style={{ fontSize: "11px", color: "#18573f" }}>
                    GPS:{" "}
                  </Text>
                  {application.gps_coordinates.map((coord, index) => (
                    <span
                      key={index}
                      style={{ marginRight: "8px", color: "#124230" }}
                    >
                      [{coord[0]}, {coord[1]}]
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col
          xs={24}
          lg={10}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <Card title="Đánh giá rủi ro" style={{ marginBottom: "16px" }}>
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
          {satelliteData && (
            <Card title="Dữ liệu vệ tinh" style={{ flex: 1 }}>
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
        <Card title="Phân tích trang trại chi tiết" style={{ marginTop: "16px" }}>
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

      <Card title="Hình ảnh bằng chứng" style={{ marginTop: "16px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Title level={4}>Giấy chứng nhận quyền sử dụng đất</Title>
            <Image.PreviewGroup>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {application.land_use_certificate_images?.map(
                  (image, index) => (
                    <Image
                      key={index}
                      width={150}
                      height={100}
                      src={image}
                      alt={`Giấy chứng nhận quyền sử dụng đất ${index + 1}`}
                      style={{
                        objectFit: "cover",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {application.land_images?.map((image, index) => (
                  <Image
                    key={index}
                    width={150}
                    height={100}
                    src={image}
                    alt={`Hình ảnh đất đai ${index + 1}`}
                    style={{
                      objectFit: "cover",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
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
      <Card title="Tài liệu đơn đăng ký" style={{ marginTop: "16px" }}>
        <Row gutter={[16, 16]}>
          {application.application_documents?.map((doc, index) => {
            const fileName = doc.split("/").pop();
            const fileType = fileName.split(".").pop().toUpperCase();
            return (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card
                  size="small"
                  style={{
                    textAlign: "center",
                    border: "1px dashed #d9d9d9",
                    cursor: "pointer",
                  }}
                  hoverable
                  onClick={() => window.open(doc, "_blank")}
                >
                  <div style={{ padding: "16px" }}>
                    <DownloadOutlined
                      style={{
                        fontSize: "24px",
                        color: "#1890ff",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      {fileType}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                      {fileName}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Divider />

      <Space>
        <Button type="primary" onClick={() => handleDecision("approve")}>
          Chấp thuận đơn đăng ký
        </Button>
        <Button danger onClick={() => handleDecision("reject")}>
          Từ chối đơn đăng ký
        </Button>
        <Button onClick={() => router.push("/applications")}>Quay lại</Button>
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
