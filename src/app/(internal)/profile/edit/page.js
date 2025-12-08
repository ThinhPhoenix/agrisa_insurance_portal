"use client";
import {
  useGetPartnerProfile,
  useUpdatePartnerProfile,
} from "@/services/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth-store";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Spin,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title, Text } = Typography;

export default function ProfileEditPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const {
    getPartnerProfile,
    isLoading: partnerLoading,
    data: partnerData,
  } = useGetPartnerProfile();
  const { updatePartnerProfile, isLoading: updateLoading } =
    useUpdatePartnerProfile();

  useEffect(() => {
    const fetchProfile = async () => {
      let partnerId = null;
      try {
        const meData = localStorage.getItem("me");
        if (meData) {
          const me = JSON.parse(meData);
          partnerId = me.partner_id;
        }
      } catch (e) {}

      if (!partnerId) {
        partnerId = user?.user?.partner_id || user?.profile?.partner_id;
      }

      if (!partnerId) {
        message.error("Không tìm thấy thông tin đối tác");
        return;
      }

      const result = await getPartnerProfile(partnerId);
      if (result.success && result.data) {
        form.setFieldsValue(result.data);
      } else {
        message.error(result.message || "Không thể tải thông tin công ty");
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (values) => {
    // Ensure partner_id is included in payload
    const payload = {
      ...values,
      partner_id: partnerData?.partner_id || user?.user?.partner_id || "",
    };

    const result = await updatePartnerProfile(payload);
    if (result.success) {
      message.success("Cập nhật thông tin công ty thành công");
      router.push("/profile");
    } else {
      message.error(result.message || "Cập nhật không thành công");
    }
  };

  if (partnerLoading && !partnerData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin tip="Đang tải thông tin công ty..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Card style={{ marginBottom: 24 }}>
        <Title level={3}>Chỉnh sửa thông tin công ty</Title>
        <Text type="secondary">
          Cập nhật các thông tin liên quan đến công ty bảo hiểm
        </Text>
      </Card>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="partner_display_name"
                label="Tên hiển thị"
                rules={[
                  { required: true, message: "Vui lòng nhập tên hiển thị" },
                ]}
              >
                <Input placeholder="Tên công ty" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="partner_tagline" label="Khẩu hiệu">
                <Input placeholder="Khẩu hiệu/Slogan" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="partner_description" label="Mô tả">
                <Input.TextArea
                  rows={4}
                  placeholder="Mô tả chi tiết về công ty"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="partner_phone" label="Số điện thoại">
                <Input placeholder="Số điện thoại chính thức" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="partner_official_email" label="Email chính thức">
                <Input type="email" placeholder="Email" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="customer_service_hotline"
                label="Hotline hỗ trợ khách hàng"
              >
                <Input placeholder="Hotline" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="support_hours" label="Giờ hỗ trợ">
                <Input placeholder="Ví dụ: Mon-Fri 8:00-17:00" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="partner_website" label="Website">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="fax_number" label="Fax">
                <Input placeholder="Số fax" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="head_office_address"
                label="Địa chỉ văn phòng đại diện"
              >
                <Input placeholder="Địa chỉ" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="province_name" label="Tỉnh/Thành phố">
                <Input placeholder="Tỉnh/Thành phố" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="ward_name" label="Phường/Xã">
                <Input placeholder="Phường/Xã" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="confirmation_timeline"
                label="Thời gian xác nhận"
              >
                <Input placeholder="Ví dụ: 24-48 giờ" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="average_payout_time"
                label="Thời gian thanh toán trung bình"
              >
                <Input placeholder="Ví dụ: 3 ngày" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="coverage_areas" label="Khu vực phục vụ">
                <Input placeholder="Ví dụ: Toàn quốc" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="year_established" label="Năm thành lập">
                <Input type="number" placeholder="Năm" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="legal_company_name" label="Tên pháp lý">
                <Input placeholder="Tên pháp lý của công ty" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="partner_trading_name" label="Tên gọi kinh doanh">
                <Input placeholder="Tên kinh doanh" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="tax_identification_number" label="Mã số thuế">
                <Input placeholder="MST" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="business_registration_number"
                label="Số giấy phép kinh doanh"
              >
                <Input placeholder="Số giấy phép" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="insurance_license_number"
                label="Số giấy phép bảo hiểm"
              >
                <Input placeholder="Số giấy phép" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="company_type" label="Loại công ty">
                <Input placeholder="domestic/foreign" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item>
                <Row gutter={8}>
                  <Col>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updateLoading}
                    >
                      Lưu thay đổi
                    </Button>
                  </Col>
                  <Col>
                    <Button onClick={() => router.push("/profile")}>Hủy</Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
