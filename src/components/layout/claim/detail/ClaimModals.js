"use client";

import { InboxOutlined, InfoCircleOutlined } from "@ant-design/icons";
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
  Tabs,
  Tooltip,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";

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
  const [fileList, setFileList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    if (rejectForm) {
      // keep form field in sync with selected files (store minimal metadata + any notes)
      rejectForm.setFieldValue(
        "evidence_documents",
        fileList.map((f) => ({
          uid: f.uid,
          name: f.name,
          type: f.type,
          size: f.size,
          note: f.note || "",
        }))
      );
    }
  }, [fileList, rejectForm]);

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file) => {
    const fileObj = file.originFileObj || file;
    if (!fileObj) return message.info("Không có file để xem trước");

    if ((file.type || fileObj.type || "").startsWith("image")) {
      const src = await getBase64(fileObj);
      setPreviewImage(src);
      setPreviewVisible(true);
      setPreviewTitle(file.name || file.uid);
    } else {
      // open other file types in new tab if possible
      const url = URL.createObjectURL(fileObj);
      window.open(url, "_blank");
    }
  };

  const handleRemove = (file) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  const handleBeforeUpload = (file) => {
    // add custom metadata holder for notes
    const wrapped = Object.assign(file, {
      uid: file.uid || file.name + Date.now(),
      note: "",
    });
    setFileList((prev) => [...prev, wrapped]);
    // prevent auto upload
    return false;
  };

  const handleNoteChange = (uid, value) => {
    setFileList((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, note: value } : f))
    );
  };

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
            name="partner_notes"
            label="Ghi chú chi tiết"
            rules={[
              { required: true, message: "Vui lòng nhập ghi chú" },
              { max: 1000, message: "Tối đa 1000 ký tự" },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập các ghi chú chi tiết về quá trình xem xét, bằng chứng đã kiểm tra, lý do phê duyệt..."
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
        width={800}
        style={{ maxHeight: "80vh" }}
        bodyStyle={{ maxHeight: "calc(80vh - 110px)", overflowY: "auto" }}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={onRejectSubmit}
          style={{ paddingLeft: 10, paddingRight: 10 }}
        >
          <Tabs defaultActiveKey="1">
            {/* Tab 1: Thông Tin Từ Chối (Bắt buộc) */}
            <Tabs.TabPane tab="Thông Tin Từ Chối (Bắt buộc)" key="1">
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
                    <Option
                      key={type.value}
                      value={type.value}
                      title={type.desc}
                    >
                      <span>{type.label}</span>
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
                  rows={3}
                  placeholder="Ví dụ: Dữ liệu lượng mưa báo cáo không khớp với dữ liệu vệ tinh..."
                  maxLength={500}
                />
              </Form.Item>

              {/* <Form.Item
                name="validated_by"
                label="Người Đánh Giá"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên người đánh giá",
                  },
                  { max: 200, message: "Tối đa 200 ký tự" },
                ]}
                style={{ marginBottom: 12 }}
              >
                <Input
                  placeholder="Ví dụ: Nguyễn Văn A - Chuyên viên thẩm định"
                  size="large"
                />
              </Form.Item> */}

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
                  rows={3}
                  placeholder="Sau khi xem xét kỹ lưỡng hình ảnh vệ tinh..."
                  maxLength={1000}
                />
              </Form.Item>
            </Tabs.TabPane>

            {/* Tab 2: Bằng Chứng Chi Tiết (Tùy chọn) */}
            <Tabs.TabPane tab="Bằng Chứng Chi Tiết (Tùy chọn)" key="2">
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
                        <Tooltip title="Tải lên ảnh hoặc tài liệu (pdf, docx, xlsx, csv...).">
                          <InfoCircleOutlined
                            style={{ color: "#1890ff", fontSize: "12px" }}
                          />
                        </Tooltip>
                      </span>
                    }
                    extra="Tải lên các file cần làm bằng chứng. Bạn có thể xem trước (ảnh), chỉnh sửa ghi chú và xóa file trước khi gửi."
                    style={{ marginBottom: 0 }}
                  >
                    <Upload.Dragger
                      multiple
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      beforeUpload={handleBeforeUpload}
                      onRemove={handleRemove}
                      fileList={fileList}
                      showUploadList={false}
                      style={{ width: "100%" }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Kéo thả file vào đây hoặc nhấn để chọn
                      </p>
                      <p className="ant-upload-hint">
                        Hỗ trợ nhiều định dạng: ảnh, pdf, docx, xlsx, csv...
                      </p>
                    </Upload.Dragger>

                    {fileList.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        {fileList.map((f) => (
                          <Card
                            key={f.uid}
                            size="small"
                            style={{ marginBottom: 8 }}
                            bodyStyle={{ padding: 8 }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div style={{ fontWeight: 600 }}>{f.name}</div>
                                <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                                  {(f.size / 1024).toFixed(1)} KB •{" "}
                                  {f.type || "-"}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <Button
                                  size="small"
                                  onClick={() => handlePreview(f)}
                                >
                                  Xem
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  onClick={() => handleRemove(f)}
                                >
                                  Xóa
                                </Button>
                              </div>
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <Input.TextArea
                                value={f.note}
                                onChange={(e) =>
                                  handleNoteChange(f.uid, e.target.value)
                                }
                                placeholder="Ghi chú (ví dụ: trang chứa bằng chứng, mô tả ngắn)"
                                autoSize={{ minRows: 1, maxRows: 4 }}
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <Modal
                      open={previewVisible}
                      title={previewTitle}
                      footer={null}
                      onCancel={() => setPreviewVisible(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="preview"
                        style={{ width: "100%" }}
                        src={previewImage}
                      />
                    </Modal>
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>
          </Tabs>

          {/* Action Buttons */}
          <Form.Item className="mb-0" style={{ marginTop: 16 }}>
            <Space
              className="w-full justify-end"
              size="middle"
              style={{ paddingRight: 16 }}
            >
              <Button onClick={onRejectCancel} type="dashed" size="large">
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
