"use client";
import CustomTable from "@/components/custom-table";
import CreateEmployeeModal from "@/components/layout/profile/CreateEmployeeModal";
import DeletionRequestModal from "@/components/layout/profile/DeletionRequestModal";
import DeletionRequestStatus from "@/components/layout/profile/DeletionRequestStatus";
import { useGetDeletionRequests } from "@/services/hooks/profile/use-partner-deletion";
import {
  useAccountProfile,
  useGetPartnerProfile,
} from "@/services/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth-store";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HistoryOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined,
  StopOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Image,
  Input,
  message,
  Modal,
  Rate,
  Row,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import "./profile.css";
import { Utils } from "@/utils/utils";

const { Title, Text, Paragraph } = Typography;

// Account Edit Modal Component
function AccountEditModal({ visible, onClose, data, onSave, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && data) {
      const init = { ...data };
      if (init.date_of_birth) {
        try {
          init.date_of_birth = new Date(init.date_of_birth)
            .toISOString()
            .slice(0, 10);
        } catch (e) {}
      }
      form.setFieldsValue(init);
    }
  }, [visible, data, form]);

  const handleSubmit = async (values) => {
    const payload = { ...values };
    if (payload.date_of_birth) {
      try {
        const d = new Date(payload.date_of_birth);
        payload.date_of_birth = d.toISOString();
      } catch (e) {}
    }
    const result = await onSave(payload);
    if (result.success) {
      message.success("Cập nhật thông tin tài khoản thành công");
      onClose();
    } else {
      message.error(result.message || "Cập nhật không thành công");
    }
  };

  return (
    <Modal
      title="Chỉnh sửa thông tin tài khoản"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="full_name"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
            >
              <Input placeholder="Họ và tên" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="date_of_birth" label="Ngày sinh">
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="gender" label="Giới tính">
              <Input placeholder="M/F" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="nationality" label="Quốc tịch">
              <Input placeholder="VN" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="primary_phone"
              label="Số điện thoại chính"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
              ]}
            >
              <Input placeholder="0867801057" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="alternate_phone" label="Số điện thoại phụ">
              <Input placeholder="0867801058" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="permanent_address" label="Địa chỉ thường trú">
              <Input placeholder="Địa chỉ" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="current_address" label="Địa chỉ hiện tại">
              <Input placeholder="Địa chỉ" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="province_code" label="Mã tỉnh">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="district_code" label="Mã huyện">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="ward_code" label="Mã xã">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="postal_code" label="Mã bưu chính">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="province_name" label="Tỉnh/Thành">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="district_name" label="Quận/Huyện">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="ward_name" label="Phường/Xã">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="account_number" label="Số tài khoản">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="account_name" label="Tên chủ tài khoản">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="bank_code" label="Mã ngân hàng">
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Lưu thay đổi
                </Button>
                <Button onClick={onClose}>Hủy</Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// Account Info Tab Content
function AccountInfoTab() {
  const [modalVisible, setModalVisible] = useState(false);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const {
    getAccountProfile,
    updateAccountProfile,
    isLoading: accountLoading,
    data: accountData,
  } = useAccountProfile();

  // Check if user is admin_partner
  const isAdminPartner = () => {
    try {
      const meRaw = localStorage.getItem("me");
      if (meRaw) {
        const me = JSON.parse(meRaw);
        return me.role_id === "admin_partner";
      }
    } catch (e) {
      console.error("Failed to parse me data:", e);
    }
    return false;
  };

  useEffect(() => {
    getAccountProfile();
  }, []);

  if (accountLoading && !accountData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin tip="Đang tải thông tin tài khoản..." />
      </div>
    );
  }

  if (!accountData) {
    return <Text type="danger">Không thể tải thông tin tài khoản</Text>;
  }

  // Helper function to render icon-based field
  const renderField = (label, value, icon) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      {icon}
      <div style={{ flex: 1 }}>
        <Text type="secondary" style={{ fontSize: 12, color: "#999" }}>
          {label}
        </Text>
        <div
          style={{ fontSize: 16, fontWeight: 500, marginTop: 4, color: "#000" }}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );

  const primaryColor = "#18573f";
  const iconStyle = {
    fontSize: 20,
    color: primaryColor,
    flexShrink: 0,
    marginTop: 2,
  };

  return (
    <>
      <Card>
        <Row gutter={[16, 24]}>
          <Col xs={24} sm={12}>
            {renderField(
              "Họ và tên",
              accountData.full_name,
              <FileTextOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Ngày sinh",
              accountData.date_of_birth
                ? new Date(accountData.date_of_birth).toLocaleDateString(
                    "vi-VN"
                  )
                : null,
              <CalendarOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Giới tính",
              accountData.gender === "M"
                ? "Nam"
                : accountData.gender === "F"
                ? "Nữ"
                : accountData.gender,
              <TeamOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Quốc tịch",
              accountData.nationality,
              <GlobalOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Số điện thoại chính",
              accountData.primary_phone,
              <PhoneOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Số điện thoại phụ",
              accountData.alternate_phone,
              <PhoneOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Email",
              accountData.email,
              <MailOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Địa chỉ thường trú",
              accountData.permanent_address,
              <EnvironmentOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Địa chỉ hiện tại",
              accountData.current_address,
              <EnvironmentOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Tỉnh/Thành",
              accountData.province_name,
              <EnvironmentOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Quận/Huyện",
              accountData.district_name,
              <EnvironmentOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Phường/Xã",
              accountData.ward_name,
              <EnvironmentOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Mã bưu chính",
              accountData.postal_code,
              <FileTextOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Số tài khoản",
              accountData.account_number,
              <FileTextOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Tên chủ tài khoản",
              accountData.account_name,
              <FileTextOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24} sm={12}>
            {renderField(
              "Mã ngân hàng",
              accountData.bank_code,
              <FileTextOutlined style={iconStyle} />
            )}
          </Col>

          <Col xs={24}>
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Chỉnh sửa
              </Button>

              {isAdminPartner() && (
                <Button
                  type="default"
                  icon={<UserAddOutlined />}
                  onClick={() => setEmployeeModalVisible(true)}
                >
                  Tạo tài khoản nhân viên
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <AccountEditModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={accountData}
        onSave={updateAccountProfile}
        loading={accountLoading}
      />

      <CreateEmployeeModal
        visible={employeeModalVisible}
        onClose={() => setEmployeeModalVisible(false)}
        onSuccess={() => {
          message.success("Tài khoản nhân viên đã được tạo thành công!");
        }}
      />
    </>
  );
}

// Company Info Tab Content (View Only)
// Company Info Tab Content (View Only)
function CompanyInfoTab() {
  const { user } = useAuthStore();
  const { getPartnerProfile, isLoading, error, data } = useGetPartnerProfile();
  const {
    getDeletionRequests,
    isLoading: deletionLoading,
    data: deletionRequests,
  } = useGetDeletionRequests();
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [currentDeletionRequest, setCurrentDeletionRequest] = useState(null);

  const fetchDeletionRequests = async (userId) => {
    if (!userId) return;

    try {
      const result = await getDeletionRequests(userId);
      if (result.success && result.data && result.data.length > 0) {
        // Find the most recent pending request
        const pendingRequest = result.data.find((r) => r.status === "pending");
        if (pendingRequest) {
          setCurrentDeletionRequest(pendingRequest);
        } else {
          // If no pending, show the most recent one
          setCurrentDeletionRequest(result.data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch deletion requests:", e);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      let partnerId = null;
      let userId = null;

      try {
        const meData = localStorage.getItem("me");
        if (meData) {
          const me = JSON.parse(meData);
          partnerId = me.partner_id;
          userId = me.user_id;
        }
      } catch (e) {
        console.error("Failed to parse me data from localStorage:", e);
      }

      if (!partnerId) {
        partnerId = user?.user?.partner_id || user?.profile?.partner_id;
      }

      if (!userId) {
        userId = user?.user_id || user?.user?.id || user?.profile?.user_id;
      }

      if (!partnerId) {
        message.error("Không tìm thấy thông tin đối tác");
        return;
      }

      const result = await getPartnerProfile(partnerId);
      if (!result.success) {
        message.error(result.message || "Không thể tải thông tin đối tác");
      }

      // Fetch deletion requests
      if (userId) {
        await fetchDeletionRequests(userId);
      }
    };

    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin tip="Đang tải thông tin công ty..." />
      </div>
    );
  }

  if (!data) {
    return <Text type="danger">Không thể tải thông tin công ty</Text>;
  }

  const handleDeletionSuccess = async () => {
    // Refresh deletion requests
    let userId = null;
    try {
      const meData = localStorage.getItem("me");
      if (meData) {
        const me = JSON.parse(meData);
        userId = me.user_id;
      }
    } catch (e) {
      console.error("Failed to parse me data:", e);
    }

    if (!userId) {
      userId = user?.user_id || user?.user?.id || user?.profile?.user_id;
    }

    if (userId) {
      await fetchDeletionRequests(userId);
    }
  };

  const canRequestDeletion =
    !currentDeletionRequest || currentDeletionRequest.status !== "pending";

  return (
    <>
      {/* Deletion Request Status */}
      {currentDeletionRequest && (
        <DeletionRequestStatus
          request={currentDeletionRequest}
          onRefresh={handleDeletionSuccess}
        />
      )}
      {/* Cover Photo + Avatar Header */}
      <div
        style={{
          position: "relative",
          marginBottom: 24,
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#f0f2f5",
        }}
      >
        {/* Cover Photo Background */}
        <div
          style={{
            height: 280,
            backgroundImage: `url(${data.cover_photo_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "relative",
          }}
        >
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)",
            }}
          />
        </div>

        {/* Avatar + Info Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "24px",
            background:
              "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)",
            display: "flex",
            alignItems: "flex-end",
            gap: 20,
          }}
        >
          {/* Logo Avatar */}
          <div
            style={{
              flex: "0 0 auto",
            }}
          >
            {data.partner_logo_url ? (
              <Image
                src={data.partner_logo_url}
                alt={data.partner_display_name}
                preview={false}
                width={120}
                height={120}
                style={{
                  borderRadius: "12px",
                  objectFit: "cover",
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "12px",
                  backgroundColor: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  fontWeight: "bold",
                  color: "white",
                  border: "4px solid white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                {data.partner_display_name?.charAt(0) || "P"}
              </div>
            )}
          </div>

          {/* Title + Tagline */}
          <div style={{ flex: "1 1 auto", paddingBottom: 12 }}>
            <Title
              level={2}
              style={{ margin: 0, marginBottom: 8, color: "#000" }}
            >
              {data.partner_display_name}
            </Title>
            <Text style={{ fontSize: 16, color: "#595959" }}>
              {data.partner_tagline}
            </Text>
            <div style={{ marginTop: 12 }}>
              <Rate
                disabled
                value={data.partner_rating_score || 0}
                style={{ fontSize: 14 }}
              />
              <Text style={{ marginLeft: 12, color: "#8c8c8c" }}>
                {data.partner_rating_score?.toFixed(1) || "0"} (
                {data.partner_rating_count || 0} đánh giá)
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Metrics */}
      <Row gutter={12} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <CalendarOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <div style={{ fontSize: 14, color: "#8c8c8c", marginTop: 8 }}>
              Kinh nghiệm
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#000",
                marginTop: 4,
              }}
            >
              {data.trust_metric_experience} năm
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <TeamOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Khách hàng</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#000",
                marginTop: 4,
              }}
            >
              {(data.trust_metric_clients / 1000).toLocaleString("vi-VN", {
                maximumFractionDigits: 0,
              })}
              K
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Tỷ lệ chi trả</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#52c41a",
                marginTop: 4,
              }}
            >
              {data.trust_metric_claim_rate}%
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <StarOutlined style={{ fontSize: 20, color: "#faad14" }} />
            </div>
            <div style={{ fontSize: 14, color: "#8c8c8c" }}>Tổng chi trả</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#000",
                marginTop: 4,
              }}
            >
              {data.total_payouts}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content - Full Width Vertical Layout */}
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #f0f0f0",
        }}
      >
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          Giới thiệu
        </Title>
        <Typography.Paragraph
          style={{
            color: "#595959",
            lineHeight: 1.8,
            marginBottom: 16,
          }}
        >
          {data.partner_description}
        </Typography.Paragraph>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24}>
            <Text strong>Năm thành lập:</Text>
            <br />
            <Text style={{ color: "#8c8c8c" }}>
              {data.year_established || "—"}
            </Text>
          </Col>
          <Col xs={24} sm={24}>
            <Text strong>Tên pháp lý:</Text>
            <br />
            <Text style={{ color: "#8c8c8c" }}>
              {data.legal_company_name || "—"}
            </Text>
          </Col>
          <Col xs={24} sm={24}>
            <Text strong>Tên gọi kinh doanh:</Text>
            <br />
            <Text style={{ color: "#8c8c8c" }}>
              {data.partner_trading_name || "—"}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Service Details */}
      <Card style={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}>
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          Chi tiết dịch vụ
        </Title>

        <Row gutter={[16, 24]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <ClockCircleOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Thời gian xác nhận</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>
                {data.confirmation_timeline}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <CalendarOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Thời gian thanh toán TB</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>
                {data.average_payout_time}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <ClockCircleOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Giờ hỗ trợ</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>{data.support_hours}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <EnvironmentOutlined
                  style={{ marginRight: 8, color: "#1890ff" }}
                />
                <Text strong>Khu vực phục vụ</Text>
              </div>
              <Text style={{ color: "#8c8c8c" }}>{data.coverage_areas}</Text>
            </Space>
          </Col>
        </Row>

        {data.operating_provinces && data.operating_provinces.length > 0 && (
          <>
            <Divider style={{ margin: "24px 0" }} />
            <div>
              <Text strong>Tỉnh/Thành phố phục vụ:</Text>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {data.operating_provinces.map((province, index) => (
                  <Tag key={index} color="blue">
                    {province}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}

        {data.authorized_insurance_lines &&
          data.authorized_insurance_lines.length > 0 && (
            <>
              <Divider style={{ margin: "24px 0" }} />
              <div>
                <Text strong>Loại hình bảo hiểm được phép:</Text>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {data.authorized_insurance_lines.map((line, index) => (
                    <Tag key={index} color="cyan">
                      {line.replace(/_/g, " ").toUpperCase()}
                    </Tag>
                  ))}
                </div>
              </div>
            </>
          )}
      </Card>

      {/* Contact Information */}
      <Card
        title="Thông tin liên hệ"
        style={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MailOutlined
              style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                Email chính thức
              </div>
              <a
                href={`mailto:${data.partner_official_email}`}
                style={{ color: "#1890ff" }}
              >
                {data.partner_official_email}
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PhoneOutlined
              style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                Điện thoại
              </div>
              <a
                href={`tel:${data.partner_phone}`}
                style={{ color: "#1890ff" }}
              >
                {data.partner_phone}
              </a>
            </div>
          </div>

          {data.customer_service_hotline && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PhoneOutlined
                style={{ fontSize: 18, color: "#52c41a", flex: "0 0 auto" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}
                >
                  Hotline hỗ trợ khách hàng
                </div>
                <a
                  href={`tel:${data.customer_service_hotline}`}
                  style={{ color: "#52c41a" }}
                >
                  {data.customer_service_hotline}
                </a>
              </div>
            </div>
          )}

          {data.fax_number && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileTextOutlined
                style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}
                >
                  Fax
                </div>
                <Text style={{ color: "#595959" }}>{data.fax_number}</Text>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <EnvironmentOutlined
              style={{
                fontSize: 18,
                color: "#1890ff",
                flex: "0 0 auto",
                marginTop: 2,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                Văn phòng đại diện
              </div>
              <Text style={{ color: "#595959", lineHeight: 1.6 }}>
                {data.head_office_address}
              </Text>
              {data.province_name && (
                <>
                  <br />
                  <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                    {data.province_name}
                  </Text>
                </>
              )}
            </div>
          </div>

          {data.partner_website && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <GlobalOutlined
                style={{ fontSize: 18, color: "#1890ff", flex: "0 0 auto" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}
                >
                  Website
                </div>
                <a
                  href={data.partner_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1890ff" }}
                >
                  {data.partner_website}
                </a>
              </div>
            </div>
          )}
        </Space>
      </Card>

      {/* Company Information */}
      <Card
        title="Thông tin công ty"
        style={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text type="secondary">Mã số thuế:</Text>
            <br />
            <Text strong>{data.tax_identification_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Số giấy phép kinh doanh:</Text>
            <br />
            <Text strong>{data.business_registration_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Số giấy phép bảo hiểm:</Text>
            <br />
            <Text strong>{data.insurance_license_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Ngày cấp giấy phép:</Text>
            <br />
            <Text strong>
              {data.license_issue_date
                ? new Date(data.license_issue_date).toLocaleDateString("vi-VN")
                : "—"}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Ngày hết hạn giấy phép:</Text>
            <br />
            <Text strong>
              {data.license_expiry_date
                ? new Date(data.license_expiry_date).toLocaleDateString("vi-VN")
                : "—"}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">Loại công ty:</Text>
            <br />
            <Text strong>
              {data.company_type === "domestic"
                ? "Trong nước"
                : data.company_type}
            </Text>
          </Col>

          <Col xs={24}>
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => (window.location.href = "/profile/edit")}
              >
                Chỉnh sửa thông tin công ty
              </Button>

              {canRequestDeletion && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setDeletionModalVisible(true)}
                >
                  Yêu cầu hủy hồ sơ
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Deletion Requests History Table */}
      {deletionRequests && deletionRequests.length > 1 && (
        <Card
          title={
            <Space>
              <HistoryOutlined style={{ color: "#18573f", fontSize: 20 }} />
              <span>Lịch sử yêu cầu hủy hồ sơ</span>
            </Space>
          }
          style={{
            borderRadius: "8px",
            border: "1px solid #f0f0f0",
            marginTop: 24,
          }}
        >
          <CustomTable
            dataSource={deletionRequests}
            rowKey="request_id"
            columns={[
              {
                title: "Mã yêu cầu",
                dataIndex: "request_id",
                key: "request_id",
                render: (text) => (
                  <Text code copyable>
                    {text}
                  </Text>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status) => {
                  const statusConfig = {
                    pending: {
                      color: "warning",
                      icon: <ClockCircleOutlined />,
                      text: "Đang chờ xử lý",
                    },
                    approved: {
                      color: "error",
                      icon: <CheckCircleOutlined />,
                      text: "Được chấp thuận",
                    },
                    rejected: {
                      color: "default",
                      icon: <CloseCircleOutlined />,
                      text: "Bị từ chối",
                    },
                    cancelled: {
                      color: "default",
                      icon: <StopOutlined />,
                      text: "Đã hủy",
                    },
                    completed: {
                      color: "success",
                      icon: <CheckCircleOutlined />,
                      text: "Hoàn thành",
                    },
                  };
                  const config = statusConfig[status] || statusConfig.pending;
                  return (
                    <Tag color={config.color} icon={config.icon}>
                      {config.text}
                    </Tag>
                  );
                },
              },
              {
                title: "Ngày yêu cầu",
                dataIndex: "requested_at",
                key: "requested_at",
                render: (date) =>
                  Utils.formatStringVietnameseDateTime(date) || "—",
              },
              
              {
                title: "Người xử lý",
                dataIndex: "reviewed_by_name",
                key: "reviewed_by_name",
                render: (text) => text || "—",
              },
              {
                title: "Ngày xử lý",
                dataIndex: "reviewed_at",
                key: "reviewed_at",
                render: (date) =>
                  Utils.formatStringVietnameseDateTime(date) || "—",
              },
              {
                title: "Lý do",
                dataIndex: "detailed_explanation",
                key: "detailed_explanation",
                ellipsis: true,
                render: (text) => (
                  <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
                    {text || "—"}
                  </Text>
                ),
              },
            ]}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} yêu cầu`,
            }}
          />
        </Card>
      )}

      {/* Deletion Request Modal */}
      <DeletionRequestModal
        visible={deletionModalVisible}
        onClose={() => setDeletionModalVisible(false)}
        onSuccess={handleDeletionSuccess}
        targetPartnerId={data?.partner_id}
      />
    </>
  );
}

// Main Profile Page
export default function ProfilePage() {
  const tabItems = [
    {
      key: "company",
      label: "Thông tin công ty",
      children: <CompanyInfoTab />,
    },
    {
      key: "account",
      label: "Thông tin tài khoản",
      children: <AccountInfoTab />,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultActiveKey="company" items={tabItems} />
    </div>
  );
}
