import { useCreateDeletionRequest } from "@/services/hooks/profile/use-partner-deletion";
import { useGetAllPartners } from "@/services/hooks/profile/use-profile";
import {
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Image,
  Input,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text, Paragraph, Title } = Typography;

export default function DeletionRequestModal({
  visible,
  onClose,
  onSuccess,
  targetPartnerId,
}) {
  const [form] = Form.useForm();
  const { createDeletionRequest, isLoading } = useCreateDeletionRequest();
  const {
    getAllPartners,
    isLoading: partnersLoading,
    data: partnersData,
  } = useGetAllPartners();
  const [submitting, setSubmitting] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [partnerDetail, setPartnerDetail] = useState(null);

  // Lấy partner_id từ localStorage (fallback)
  const getCurrentPartnerId = () => {
    if (typeof window !== "undefined") {
      try {
        const meRaw = localStorage.getItem("me");
        if (meRaw) {
          const me = JSON.parse(meRaw);
          return me.partner_id;
        }
      } catch (e) {
        console.error("Failed to parse me data:", e);
      }
    }
    return null;
  };

  // partner being requested for deletion (passed from parent) or fallback to current user
  const subjectPartnerId = targetPartnerId || getCurrentPartnerId();

  const currentPartnerId = getCurrentPartnerId();

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedPartner(null);
    }
  }, [visible, form]);

  useEffect(() => {
    if (drawerVisible && !partnersData) {
      getAllPartners();
    }
  }, [drawerVisible, partnersData, getAllPartners]);

  const handleSubmit = async (values) => {
    if (!selectedPartner) {
      message.warning("Vui lòng chọn công ty bảo hiểm để chuyển giao hợp đồng");
      return;
    }

    setSubmitting(true);
    const payload = {
      detailed_explanation: values.detailed_explanation || "",
      transfer_partner_id: selectedPartner.partner_id,
    };

    const result = await createDeletionRequest(payload);

    if (result.success) {
      message.success(
        result.message || "Yêu cầu hủy hồ sơ đã được gửi thành công"
      );
      form.resetFields();
      setSelectedPartner(null);
      onSuccess && onSuccess(result.data);
      onClose();
    } else {
      message.error(result.message);
    }
    setSubmitting(false);
  };

  const handleSelectPartner = (partner) => {
    // Validate: Cannot select the same company as the subject partner
    if (!subjectPartnerId) {
      message.error("Không thể xác định công ty hiện tại");
      return;
    }

    if (partner.partner_id === subjectPartnerId) {
      message.error(
        "Không thể chọn chính công ty đang yêu cầu hủy để chuyển giao hợp đồng"
      );
      return;
    }

    setSelectedPartner(partner);
    setDrawerVisible(false);
    message.success(`Đã chọn ${partner.partner_display_name}`);
  };

  const handleViewDetail = (partner, e) => {
    e.stopPropagation(); // Prevent card click from selecting
    setPartnerDetail(partner);
    setDetailModalVisible(true);
  };

  // Exclude the subject partner (the company being requested for deletion)
  const filteredPartners =
    partnersData?.filter((p) => {
      return p.partner_id !== subjectPartnerId;
    }) || [];

  return (
    <Modal
      title={
        <Space>
          <DeleteOutlined style={{ color: "#ff4d4f" }} />
          <span>Yêu cầu hủy hồ sơ công ty</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      okText="Gửi yêu cầu"
      cancelText="Hủy"
      okButtonProps={{
        danger: true,
        loading: submitting || isLoading,
        icon: <DeleteOutlined />,
      }}
      onOk={() => form.submit()}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Alert
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph style={{ marginBottom: 8 }}>
                Khi bạn tạo yêu cầu hủy hồ sơ, quy trình sau sẽ diễn ra:
              </Paragraph>
              <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Chọn công ty bảo hiểm để chuyển giao hợp đồng</li>
                <li>Nông dân xác nhận chấp nhận chuyển giao hợp đồng</li>
                <li>
                  <strong>Nếu chấp nhận:</strong> Hợp đồng chuyển sang công ty
                  mới
                </li>
                <li>
                  <strong>Nếu không chấp nhận:</strong> Tạo yêu cầu hủy hợp đồng
                </li>
                <li>
                  Quản trị viên hệ thống chỉ xác nhận khi công ty không còn hợp
                  đồng nào đang hoạt động
                </li>
              </ol>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        {/* Partner Selection */}
        <Card
          style={{
            border: selectedPartner
              ? "2px solid #52c41a"
              : "2px dashed #d9d9d9",
            borderRadius: "8px",
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Space>
                <SwapOutlined style={{ fontSize: 18, color: "#18573f" }} />
                <Text strong>Công ty tiếp nhận hợp đồng</Text>
              </Space>
              <Button
                type="primary"
                onClick={() => setDrawerVisible(true)}
                icon={<BankOutlined />}
              >
                {selectedPartner ? "Thay đổi" : "Chọn công ty"}
              </Button>
            </div>

            {selectedPartner ? (
              <Card
                style={{
                  backgroundColor: "#f6ffed",
                  border: "1px solid #b7eb8f",
                }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row gutter={16} align="middle">
                  <Col flex="none">
                    {selectedPartner.partner_logo_url ? (
                      <Image
                        src={selectedPartner.partner_logo_url}
                        alt={selectedPartner.partner_display_name}
                        width={60}
                        height={60}
                        style={{
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                        preview={false}
                      />
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "8px",
                          backgroundColor: "#1890ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "white",
                        }}
                      >
                        {selectedPartner.partner_display_name?.charAt(0) || "P"}
                      </div>
                    )}
                  </Col>
                  <Col flex="auto">
                    <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                      {selectedPartner.partner_display_name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedPartner.partner_rating_score?.toFixed(1) || "0"}{" "}
                      ({selectedPartner.partner_rating_count || 0})
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Đã chọn
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </Card>
            ) : (
              <Alert
                message="Vui lòng chọn công ty bảo hiểm để chuyển giao hợp đồng"
                type="warning"
                showIcon
              />
            )}
          </Space>
        </Card>

        <Alert
          message="Cảnh báo quan trọng"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  Công ty sẽ ngưng cung cấp dịch vụ trong vòng 30 ngày sau khi
                  được duyệt
                </li>
                <li>
                  Công ty có nghĩa vụ thanh toán tất cả khoản hoàn trả trước khi
                  hủy
                </li>
                <li>Các hợp đồng cơ bản sẽ được lưu trữ sau khi hủy</li>
              </ul>
            </Space>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />

        <Alert
          message="Thời gian hủy yêu cầu"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                Bạn có <strong>7 ngày</strong> kể từ khi gửi yêu cầu để có thể
                hủy lại yêu cầu này. Sau thời gian đó, chỉ quản trị viên mới có
                thể xử lý yêu cầu.
              </Text>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="detailed_explanation"
            label="Lý do hủy hồ sơ (không bắt buộc)"
            extra="Tối đa 1000 ký tự"
            rules={[
              {
                max: 1000,
                message: "Lý do phải có độ dài từ 1 đến 1000 ký tự",
              },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Vui lòng mô tả lý do bạn muốn hủy hồ sơ công ty (ví dụ: ngừng hoạt động kinh doanh, sáp nhập công ty, v.v.)"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>

        <Alert
          message="Lưu ý"
          description="Sau khi gửi yêu cầu, quản trị viên sẽ xem xét và đảm bảo rằng tất cả các nghĩa vụ tài chính đã được hoàn thành trước khi phê duyệt."
          type="info"
          showIcon
        />
      </Space>

      {/* Insurance Partners Drawer */}
      <Drawer
        title={
          <Space>
            <BankOutlined style={{ color: "#18573f", fontSize: 20 }} />
            <span>Chọn công ty bảo hiểm tiếp nhận</span>
          </Space>
        }
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        bodyStyle={{ padding: "24px" }}
      >
        {partnersLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <Spin tip="Đang tải danh sách công ty bảo hiểm..." />
          </div>
        ) : filteredPartners.length === 0 ? (
          <Empty
            description="Không có công ty bảo hiểm nào khả dụng"
            style={{ marginTop: 100 }}
          />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Alert
              message="Chọn công ty để chuyển giao hợp đồng"
              description="Hợp đồng của bạn sẽ được chuyển giao sang công ty bảo hiểm được chọn. Nông dân sẽ nhận được thông báo để xác nhận chuyển giao."
              type="info"
              showIcon
            />

            <Row gutter={[16, 16]}>
              {filteredPartners.map((partner) => (
                <Col xs={24} key={partner.partner_id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: "8px",
                      border:
                        selectedPartner?.partner_id === partner.partner_id
                          ? "2px solid #52c41a"
                          : "1px solid #f0f0f0",
                    }}
                    onClick={() => handleSelectPartner(partner)}
                  >
                    <Row gutter={16} align="middle">
                      <Col flex="none">
                        {partner.partner_logo_url ? (
                          <Image
                            src={partner.partner_logo_url}
                            alt={partner.partner_display_name}
                            width={80}
                            height={80}
                            style={{
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                            preview={false}
                          />
                        ) : (
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: "8px",
                              backgroundColor: "#1890ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 32,
                              fontWeight: "bold",
                              color: "white",
                            }}
                          >
                            {partner.partner_display_name?.charAt(0) || "P"}
                          </div>
                        )}
                      </Col>
                      <Col flex="auto">
                        <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                          {partner.partner_display_name}
                        </Title>
                        {partner.partner_tagline && (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {partner.partner_tagline}
                          </Text>
                        )}
                        <div style={{ marginTop: 8 }}>
                          <Space size="middle">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {partner.partner_rating_score?.toFixed(1) || "0"}{" "}
                              ({partner.partner_rating_count || 0})
                            </Text>
                          </Space>
                        </div>
                        {partner.trust_metric_experience && (
                          <div style={{ marginTop: 8 }}>
                            <Space size="small" wrap>
                              <Tag color="blue">
                                {partner.trust_metric_experience} năm kinh
                                nghiệm
                              </Tag>
                              {partner.trust_metric_clients && (
                                <Tag color="green">
                                  {(
                                    partner.trust_metric_clients / 1000
                                  ).toLocaleString("vi-VN", {
                                    maximumFractionDigits: 0,
                                  })}
                                  K khách hàng
                                </Tag>
                              )}
                              {partner.trust_metric_claim_rate && (
                                <Tag color="orange">
                                  {partner.trust_metric_claim_rate}% tỷ lệ chi
                                  trả
                                </Tag>
                              )}
                            </Space>
                          </div>
                        )}
                        {selectedPartner?.partner_id === partner.partner_id && (
                          <div style={{ marginTop: 8 }}>
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              Đang chọn
                            </Tag>
                          </div>
                        )}
                        <div style={{ marginTop: 12 }}>
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={(e) => handleViewDetail(partner, e)}
                            style={{ padding: 0 }}
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </Space>
        )}
      </Drawer>

      {/* Partner Detail Modal */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: "#18573f", fontSize: 20 }} />
            <span>Chi tiết công ty bảo hiểm</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="select"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (partnerDetail) {
                handleSelectPartner(partnerDetail);
                setDetailModalVisible(false);
              }
            }}
          >
            Chọn công ty này
          </Button>,
        ]}
        width={900}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {partnerDetail && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Header with logo and name */}
            <Card>
              <Row gutter={16} align="middle">
                <Col flex="none">
                  {partnerDetail.partner_logo_url ? (
                    <Image
                      src={partnerDetail.partner_logo_url}
                      alt={partnerDetail.partner_display_name}
                      width={100}
                      height={100}
                      style={{
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                      preview={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: "8px",
                        backgroundColor: "#1890ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 40,
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {partnerDetail.partner_display_name?.charAt(0) || "P"}
                    </div>
                  )}
                </Col>
                <Col flex="auto">
                  <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
                    {partnerDetail.partner_display_name}
                  </Title>
                  {partnerDetail.partner_tagline && (
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {partnerDetail.partner_tagline}
                    </Text>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ marginLeft: 12, color: "#8c8c8c" }}>
                      {partnerDetail.partner_rating_score?.toFixed(1) || "0"} (
                      {partnerDetail.partner_rating_count || 0} đánh giá)
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Trust Metrics */}
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center" }}>
                  <CalendarOutlined
                    style={{ fontSize: 20, color: "#1890ff" }}
                  />
                  <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
                    Kinh nghiệm
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#000",
                      marginTop: 4,
                    }}
                  >
                    {partnerDetail.trust_metric_experience || 0} năm
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center" }}>
                  <TeamOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                  <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
                    Khách hàng
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#000",
                      marginTop: 4,
                    }}
                  >
                    {partnerDetail.trust_metric_clients
                      ? (
                          partnerDetail.trust_metric_clients / 1000
                        ).toLocaleString("vi-VN", {
                          maximumFractionDigits: 0,
                        }) + "K"
                      : "0"}
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center" }}>
                  <CheckCircleOutlined
                    style={{ fontSize: 20, color: "#52c41a" }}
                  />
                  <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
                    Tỷ lệ chi trả
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#52c41a",
                      marginTop: 4,
                    }}
                  >
                    {partnerDetail.trust_metric_claim_rate || 0}%
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
                    Tổng chi trả
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#000",
                      marginTop: 4,
                    }}
                  >
                    {partnerDetail.total_payouts || "—"}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Description */}
            {partnerDetail.partner_description && (
              <Card title="Giới thiệu">
                <Paragraph style={{ marginBottom: 0 }}>
                  {partnerDetail.partner_description}
                </Paragraph>
              </Card>
            )}

            {/* Company Info */}
            <Card title="Thông tin công ty">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Text strong>Năm thành lập:</Text>
                  <br />
                  <Text>{partnerDetail.year_established || "—"}</Text>
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong>Khu vực phục vụ:</Text>
                  <br />
                  <Text>{partnerDetail.coverage_areas || "—"}</Text>
                </Col>
              </Row>
            </Card>

            {/* Service Details */}
            <Card title="Chi tiết dịch vụ">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <ClockCircleOutlined
                        style={{ marginRight: 8, color: "#1890ff" }}
                      />
                      <Text strong>Thời gian xác nhận</Text>
                    </div>
                    <Text type="secondary">
                      {partnerDetail.confirmation_timeline || "—"}
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
                    <Text type="secondary">
                      {partnerDetail.average_payout_time || "—"}
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
                    <Text type="secondary">
                      {partnerDetail.support_hours || "—"}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Contact Info */}
            <Card title="Thông tin liên hệ">
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MailOutlined style={{ fontSize: 18, color: "#1890ff" }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      Email chính thức
                    </div>
                    <a
                      href={`mailto:${partnerDetail.partner_official_email}`}
                      style={{ color: "#1890ff" }}
                    >
                      {partnerDetail.partner_official_email || "—"}
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <PhoneOutlined style={{ fontSize: 18, color: "#1890ff" }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      Điện thoại
                    </div>
                    <a
                      href={`tel:${partnerDetail.partner_phone}`}
                      style={{ color: "#1890ff" }}
                    >
                      {partnerDetail.partner_phone || "—"}
                    </a>
                  </div>
                </div>

                {partnerDetail.customer_service_hotline && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <PhoneOutlined style={{ fontSize: 18, color: "#52c41a" }} />
                    <div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        Hotline hỗ trợ
                      </div>
                      <a
                        href={`tel:${partnerDetail.customer_service_hotline}`}
                        style={{ color: "#52c41a" }}
                      >
                        {partnerDetail.customer_service_hotline}
                      </a>
                    </div>
                  </div>
                )}

                {partnerDetail.fax_number && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <FileTextOutlined
                      style={{ fontSize: 18, color: "#1890ff" }}
                    />
                    <div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>Fax</div>
                      <Text>{partnerDetail.fax_number}</Text>
                    </div>
                  </div>
                )}

                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <EnvironmentOutlined
                    style={{ fontSize: 18, color: "#1890ff", marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      Văn phòng đại diện
                    </div>
                    <Text>{partnerDetail.head_office_address || "—"}</Text>
                    {partnerDetail.province_name && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {partnerDetail.province_name}
                        </Text>
                      </>
                    )}
                  </div>
                </div>

                {partnerDetail.partner_website && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <GlobalOutlined
                      style={{ fontSize: 18, color: "#1890ff" }}
                    />
                    <div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        Website
                      </div>
                      <a
                        href={partnerDetail.partner_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1890ff" }}
                      >
                        {partnerDetail.partner_website}
                      </a>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          </Space>
        )}
      </Modal>
    </Modal>
  );
}
