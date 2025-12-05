"use client";

import { InfoCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tooltip,
} from "antd";

const { TextArea } = Input;
const { Option } = Select;

// Rejection types with Vietnamese labels (MUST match API enum exactly)
const rejectionTypes = [
  {
    value: "claim_data_incorrect",
    label: "Dữ liệu không chính xác",
    desc: "Dữ liệu người nông dân báo cáo khác với vệ tinh/thời tiết",
  },
  {
    value: "trigger_not_met",
    label: "Không đạt điều kiện kích hoạt",
    desc: "Điều kiện trigger không thực sự được thỏa mãn (ngưỡng chưa vượt)",
  },
  {
    value: "policy_not_active",
    label: "Hợp đồng không còn hiệu lực",
    desc: "Hợp đồng đã hủy, hết hạn hoặc chưa active",
  },
  {
    value: "location_mismatch",
    label: "Vị trí không khớp",
    desc: "Vị trí claim nằm ngoài vùng bảo hiểm",
  },
  {
    value: "duplicate_claim",
    label: "Yêu cầu trùng lặp",
    desc: "Đã có claim được duyệt cho cùng sự kiện này",
  },
  {
    value: "suspected_fraud",
    label: "Nghi ngờ gian lận",
    desc: "Phát hiện các pattern bất thường cần điều tra",
  },
  {
    value: "other",
    label: "Lý do khác",
    desc: "Trường hợp không thuộc các loại trên (bắt buộc giải thích chi tiết)",
  },
];

export default function ClaimModals({
  approveModalVisible,
  rejectModalVisible,
  approveForm,
  rejectForm,
  submitting,
  onApproveSubmit,
  onRejectSubmit,
  onApproveCancel,
  onRejectCancel,
}) {
  return (
    <>
      {/* Approve Modal */}
      <Modal
        title="Xác nhận duyệt chi trả"
        open={approveModalVisible}
        onCancel={onApproveCancel}
        footer={null}
        width={600}
      >
        <Form form={approveForm} layout="vertical" onFinish={onApproveSubmit}>
          <Form.Item
            name="partner_decision"
            label="Quyết định"
            rules={[
              { required: true, message: "Vui lòng nhập quyết định" },
              { max: 500, message: "Tối đa 500 ký tự" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Ví dụ: Yêu cầu chi trả đáp ứng đầy đủ các điều kiện. Đã xác minh tài liệu vào ngày..."
            />
          </Form.Item>

          <Form.Item
            name="partner_notes"
            label="Ghi chú chi tiết"
            rules={[
              { required: true, message: "Vui lòng nhập ghi chú" },
              { max: 1000, message: "Tối đa 1000 ký tự" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập các ghi chú chi tiết về quá trình xem xét, bằng chứng đã kiểm tra..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={onApproveCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Xác nhận duyệt
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối Yêu Cầu Chi Trả Bảo Hiểm"
        open={rejectModalVisible}
        onCancel={onRejectCancel}
        footer={null}
        width={900}
        style={{ maxHeight: "90vh" }}
        bodyStyle={{ maxHeight: "calc(90vh - 110px)", overflowY: "auto" }}
      >
        <Form form={rejectForm} layout="vertical" onFinish={onRejectSubmit}>
          {/* Section 1: Thông tin cơ bản từ chối */}
          <Card
            type="inner"
            title={
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                Thông Tin Từ Chối
              </span>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="claim_rejection_type"
              label={
                <span>
                  Loại Từ Chối{" "}
                  <Tooltip title="Chọn loại từ chối phù hợp nhất. Hover vào từng lựa chọn để xem mô tả chi tiết.">
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", cursor: "help" }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng chọn loại từ chối" },
              ]}
              style={{ marginBottom: 12 }}
              tooltip="Chỉ được chọn 1 trong 7 loại enum được định nghĩa bởi API"
            >
              <Select placeholder="Chọn loại từ chối..." size="large">
                {rejectionTypes.map((type) => (
                  <Option key={type.value} value={type.value} title={type.desc}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{type.label}</div>
                      <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                        {type.desc}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="reason"
              label="Lý Do Từ Chối"
              rules={[
                { required: true, message: "Vui lòng nhập lý do từ chối" },
                { max: 500, message: "Tối đa 500 ký tự" },
              ]}
              style={{ marginBottom: 12 }}
            >
              <TextArea
                rows={2}
                placeholder="Ví dụ: Dữ liệu lượng mưa báo cáo không khớp với dữ liệu vệ tinh..."
                maxLength={500}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="validated_by"
                  label="Người Đánh Giá"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập tên người đánh giá",
                    },
                    { max: 200, message: "Tối đa 200 ký tự" },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="Ví dụ: Nguyễn Văn A - Chuyên viên thẩm định"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="validation_notes"
                  label="Ghi Chú Chi Tiết"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập ghi chú chi tiết",
                    },
                    { max: 1000, message: "Tối đa 1000 ký tự" },
                  ]}
                  style={{ marginBottom: 0 }}
                  extra={
                    <span style={{ fontSize: "11px" }}>
                      Giải thích chi tiết lý do từ chối, bằng chứng đã xem xét
                    </span>
                  }
                >
                  <TextArea
                    rows={2}
                    placeholder="Sau khi xem xét kỹ lưỡng hình ảnh vệ tinh..."
                    maxLength={1000}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Section 2: Bằng chứng chi tiết */}
          <Card
            type="inner"
            title={
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                Bằng Chứng Chi Tiết (Tùy Chọn)
              </span>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="event_date"
                  label={
                    <span>
                      Ngày Sự Kiện{" "}
                      <Tooltip title="Ngày xảy ra sự kiện. Sẽ được chuyển sang format YYYY-MM-DD khi gửi API">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày sự kiện"
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="policy_clause"
                  label="Điều Khoản Chính Sách Không Hợp Lệ"
                  style={{ marginBottom: 12 }}
                >
                  <Input
                    placeholder="VD: Điều 2 - Mục 5: Bảo hiểm không áp dụng cho thiệt hại do lũ lụt"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="blackout_period_start"
                  label={
                    <span>
                      Khoảng Thời Gian Không Bảo Hiểm (Từ){" "}
                      <Tooltip title="Ngày bắt đầu của khoảng thời gian không được bảo hiểm. Sẽ được chuyển sang YYYY-MM-DD">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày bắt đầu"
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="blackout_period_end"
                  label={
                    <span>
                      Khoảng Thời Gian Không Bảo Hiểm (Đến){" "}
                      <Tooltip title="Ngày kết thúc của khoảng thời gian không được bảo hiểm. Sẽ được chuyển sang YYYY-MM-DD">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày kết thúc"
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="evidence_documents"
                  label={
                    <span>
                      Tên Tài Liệu Bằng Chứng{" "}
                      <Tooltip title="Nhập tên các file, cách nhau bởi dấu phẩy. Sẽ được chuyển thành array khi gửi API">
                        <InfoCircleOutlined
                          style={{ color: "#1890ff", fontSize: "12px" }}
                        />
                      </Tooltip>
                    </span>
                  }
                  extra="Nhập tên các file, cách nhau bởi dấu phẩy (ví dụ: file1.pdf, file2.pdf)"
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="VD: hopdong_v1.2.pdf, baocaoluongmua_2025.pdf"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Action Buttons */}
          <Form.Item className="mb-0" style={{ marginTop: 16 }}>
            <Space className="w-full justify-end" size="middle">
              <Button onClick={onRejectCancel} size="large">
                Hủy
              </Button>
              <Button
                danger
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
              >
                Xác Nhận Từ Chối
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
