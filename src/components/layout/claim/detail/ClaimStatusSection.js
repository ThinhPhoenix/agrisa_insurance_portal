"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import Link from "next/link";

const { Text } = Typography;

// Format date from epoch timestamp or ISO string
const formatDate = (timestamp) => {
  if (!timestamp) return "-";
  let date;
  if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else {
    date =
      timestamp < 5000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
  }
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format currency
const formatCurrency = (amount) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Get rejection type text
const getRejectionTypeText = (type) => {
  switch (type) {
    case "claim_data_incorrect":
      return "Dữ liệu không chính xác";
    case "trigger_not_met":
      return "Không đạt điều kiện kích hoạt";
    case "policy_not_active":
      return "Hợp đồng không còn hiệu lực";
    case "location_mismatch":
      return "Vị trí không khớp";
    case "duplicate_claim":
      return "Yêu cầu trùng lặp";
    case "suspected_fraud":
      return "Nghi ngờ gian lận";
    case "policy_exclusion":
      return "Nằm trong điều khoản loại trừ";
    case "other":
      return "Lý do khác";
    default:
      return type;
  }
};

export default function ClaimStatusSection({
  claimDetail,
  rejection,
  rejectionLoading,
  payoutsByPolicy,
  payoutsByPolicyLoading,
  onPayment,
}) {
  const payoutStatusConfig = {
    pending: {
      color: "default",
      text: "Chờ xử lý",
      icon: <ClockCircleOutlined />,
    },
    processing: {
      color: "orange",
      text: "Đang xử lý",
      icon: <ClockCircleOutlined />,
    },
    completed: {
      color: "green",
      text: "Hoàn tất",
      icon: <CheckCircleOutlined />,
    },
    failed: {
      color: "red",
      text: "Thất bại",
      icon: <CloseCircleOutlined />,
    },
  };

  const payoutColumns = [
    {
      title: "Mã chi trả",
      dataIndex: "id",
      key: "id",
      width: 280,
      render: (id) => (
        <Link href={`/payout/detail?id=${id}`}>
          <Text
            style={{
              color: "#1890ff",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            {id}
          </Text>
        </Link>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "payout_amount",
      key: "payout_amount",
      width: 150,
      render: (amount) => (
        <Text strong style={{ color: "#52c41a", fontSize: "14px" }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Loại tiền",
      dataIndex: "currency",
      key: "currency",
      width: 80,
      render: (currency) => <Tag color="blue">{currency || "VND"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const config = payoutStatusConfig[status] || payoutStatusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Thời gian khởi tạo",
      dataIndex: "initiated_at",
      key: "initiated_at",
      width: 150,
      render: (timestamp) => (
        <Text style={{ fontSize: "12px" }}>{formatDate(timestamp)}</Text>
      ),
    },
    {
      title: "Thời gian hoàn tất",
      dataIndex: "completed_at",
      key: "completed_at",
      width: 150,
      render: (timestamp) => (
        <Text style={{ fontSize: "12px" }}>{formatDate(timestamp)}</Text>
      ),
    },
    {
      title: "Xác nhận nông dân",
      dataIndex: "farmer_confirmed",
      key: "farmer_confirmed",
      width: 130,
      align: "center",
      render: (confirmed) => (
        <Tag
          color={confirmed ? "green" : "default"}
          icon={
            confirmed ? <CheckCircleOutlined /> : <ClockCircleOutlined />
          }
        >
          {confirmed ? "Đã xác nhận" : "Chưa xác nhận"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Thanh toán ngay khoản chi trả này">
            <Button
              type="primary"
              icon={<WalletOutlined />}
              size="small"
              onClick={() => onPayment(record)}
              disabled={record.status === "completed"}
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết khoản chi trả">
            <Link href={`/payout/detail?id=${record.id}`}>
              <Button type="link" icon={<EyeOutlined />} size="small" />
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Thông tin từ chối - Only show when status is rejected */}
      {claimDetail.status === "rejected" && (
        <Col xs={24}>
          <Card
            title={
              <Space>
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                <span>Chi Tiết Lý Do Từ Chối</span>
              </Space>
            }
            bordered={false}
            className="shadow-sm"
            style={{ borderLeft: "4px solid #ff4d4f" }}
          >
            {rejectionLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Đang tải thông tin từ chối..." />
              </div>
            ) : rejection ? (
              <>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Loại từ chối" span={2}>
                    <Tag color="red" style={{ fontSize: "14px" }}>
                      {getRejectionTypeText(rejection.claim_rejection_type)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Lý do từ chối" span={2}>
                    <Text strong>{rejection.reason}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Người đánh giá" span={1}>
                    <Text>{rejection.validated_by}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian đánh giá" span={1}>
                    <Text strong style={{ color: "#ff4d4f" }}>
                      {formatDate(rejection.validation_timestamp)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú chi tiết" span={2}>
                    <Text>{rejection.validation_notes}</Text>
                  </Descriptions.Item>
                </Descriptions>

                {/* Bằng chứng chi tiết */}
                {rejection.reason_evidence &&
                  Object.keys(rejection.reason_evidence).length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <Collapse
                        size="small"
                        items={[
                          {
                            key: "1",
                            label: (
                              <Text strong style={{ fontSize: "14px" }}>
                                Bằng chứng chi tiết
                              </Text>
                            ),
                            children: (
                              <div className="space-y-3">
                                {rejection.reason_evidence.event_date && (
                                  <div>
                                    <Text strong>Ngày sự kiện: </Text>
                                    <Text>
                                      {rejection.reason_evidence.event_date}
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence.policy_clause && (
                                  <div>
                                    <Text strong>Điều khoản chính sách: </Text>
                                    <Text>
                                      {rejection.reason_evidence.policy_clause}
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence.claimed_value && (
                                  <div>
                                    <Text strong>Giá trị yêu cầu: </Text>
                                    <Text>
                                      {rejection.reason_evidence.claimed_value}
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence.measured_value && (
                                  <div>
                                    <Text strong>Giá trị đo được: </Text>
                                    <Text>
                                      {rejection.reason_evidence.measured_value}
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence.threshold_value && (
                                  <div>
                                    <Text strong>Ngưỡng kích hoạt: </Text>
                                    <Text>
                                      {rejection.reason_evidence.threshold_value}
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence
                                  .blackout_period_start && (
                                  <div>
                                    <Text strong>
                                      Bắt đầu giai đoạn loại trừ:{" "}
                                    </Text>
                                    <Text>
                                      {
                                        rejection.reason_evidence
                                          .blackout_period_start
                                      }
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence
                                  .blackout_period_end && (
                                  <div>
                                    <Text strong>
                                      Kết thúc giai đoạn loại trừ:{" "}
                                    </Text>
                                    <Text>
                                      {
                                        rejection.reason_evidence
                                          .blackout_period_end
                                      }
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence
                                  .discrepancy_percent && (
                                  <div>
                                    <Text strong>Phần trăm chênh lệch: </Text>
                                    <Text>
                                      {
                                        rejection.reason_evidence
                                          .discrepancy_percent
                                      }
                                      %
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence.data_source && (
                                  <div>
                                    <Text strong>Nguồn dữ liệu: </Text>
                                    <Text>
                                      {rejection.reason_evidence.data_source}
                                    </Text>
                                  </div>
                                )}
                                {rejection.reason_evidence.evidence_documents &&
                                  rejection.reason_evidence.evidence_documents
                                    .length > 0 && (
                                    <div>
                                      <Text strong>Tài liệu bằng chứng: </Text>
                                      <ul className="ml-4 mt-1">
                                        {rejection.reason_evidence.evidence_documents.map(
                                          (doc, idx) => (
                                            <li key={idx}>
                                              <Text>{doc}</Text>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
              </>
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">
                  Không tìm thấy thông tin chi tiết về lý do từ chối
                </Text>
              </div>
            )}
          </Card>
        </Col>
      )}

      {/* Thông tin chi trả - Only show when status is approved or paid */}
      {(claimDetail.status === "approved" ||
        claimDetail.status === "paid") && (
        <Col xs={24}>
          <Card
            title={
              <Space>
                <WalletOutlined style={{ color: "#52c41a" }} />
                <span>Thông Tin Chi Trả</span>
              </Space>
            }
            bordered={false}
            className="shadow-sm"
            style={{ borderLeft: "4px solid #52c41a" }}
          >
            {payoutsByPolicyLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Đang tải thông tin chi trả..." />
              </div>
            ) : payoutsByPolicy && payoutsByPolicy.length > 0 ? (
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "13px",
                    display: "block",
                    marginBottom: "16px",
                  }}
                >
                  Tìm thấy {payoutsByPolicy.length} khoản chi trả cho đơn bảo
                  hiểm này
                </Text>
                <Table
                  dataSource={payoutsByPolicy.filter(
                    (payout) => payout.claim_id === claimDetail.id
                  )}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered
                  columns={payoutColumns}
                  scroll={{ x: 1200 }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <WalletOutlined
                  style={{
                    fontSize: 48,
                    color: "#d9d9d9",
                    marginBottom: "16px",
                  }}
                />
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Chưa có khoản chi trả nào cho yêu cầu bồi thường này
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Khoản chi trả sẽ được tạo sau khi yêu cầu được xử lý
                </Text>
              </div>
            )}
          </Card>
        </Col>
      )}

      {/* Bằng chứng */}
      {claimDetail.evidence_summary && (
        <Col xs={24}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: "#fa8c16" }} />
                <span>Bằng Chứng Kích Hoạt Bồi Thường</span>
              </Space>
            }
            bordered={false}
            className="shadow-sm"
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Summary Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <InfoCircleOutlined
                    style={{ fontSize: 24, color: "#1890ff" }}
                  />
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", display: "block" }}
                    >
                      Phương thức tạo
                    </Text>
                    <Tag
                      color={
                        claimDetail.evidence_summary.generation_method ===
                        "automatic"
                          ? "blue"
                          : "default"
                      }
                      style={{ marginTop: "4px" }}
                    >
                      {claimDetail.evidence_summary.generation_method ===
                      "automatic"
                        ? "Tự động"
                        : "Thủ công"}
                    </Tag>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircleOutlined
                    style={{ fontSize: 24, color: "#52c41a" }}
                  />
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", display: "block" }}
                    >
                      Số điều kiện kích hoạt
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: "20px", color: "#52c41a" }}
                    >
                      {claimDetail.evidence_summary.conditions_count || 0}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <ClockCircleOutlined
                    style={{ fontSize: 24, color: "#fa8c16" }}
                  />
                  <div>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", display: "block" }}
                    >
                      Thời điểm kích hoạt
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: "14px", color: "#fa8c16" }}
                    >
                      {formatDate(claimDetail.evidence_summary.triggered_at)}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Conditions Table */}
              {claimDetail.evidence_summary.conditions &&
                claimDetail.evidence_summary.conditions.length > 0 && (
                  <div>
                    <div className="mb-3 pb-2 border-b">
                      <Text
                        strong
                        style={{ fontSize: "15px", color: "#262626" }}
                      >
                        Chi tiết các điều kiện kích hoạt
                      </Text>
                    </div>
                    <Table
                      dataSource={claimDetail.evidence_summary.conditions}
                      rowKey={(record, index) =>
                        record.condition_id || index
                      }
                      pagination={false}
                      size="small"
                      bordered
                      scroll={{ x: 1000 }}
                      columns={[
                        {
                          title: "Tham số",
                          dataIndex: "parameter",
                          key: "parameter",
                          width: 100,
                          fixed: "left",
                          render: (text) => (
                            <Tag
                              color="blue"
                              style={{
                                fontSize: "13px",
                                fontWeight: "bold",
                              }}
                            >
                              {text?.toUpperCase()}
                            </Tag>
                          ),
                        },
                        {
                          title: "Điều kiện",
                          key: "condition",
                          width: 200,
                          render: (_, record) => (
                            <div>
                              <Text style={{ fontSize: "13px" }}>
                                Giá trị đo được{" "}
                                <Text strong style={{ color: "#fa8c16" }}>
                                  {record.operator}
                                </Text>{" "}
                                {record.threshold_value}%
                              </Text>
                            </div>
                          ),
                        },
                        {
                          title: "Giá trị baseline",
                          dataIndex: "baseline_value",
                          key: "baseline_value",
                          width: 130,
                          render: (val) => (
                            <Text
                              style={{
                                fontSize: "13px",
                                fontFamily: "monospace",
                              }}
                            >
                              {val ? val.toFixed(4) : "-"}
                            </Text>
                          ),
                        },
                        {
                          title: "Giá trị đo được",
                          dataIndex: "measured_value",
                          key: "measured_value",
                          width: 130,
                          render: (val) => (
                            <Text
                              strong
                              style={{
                                fontSize: "13px",
                                color: "#1890ff",
                                fontFamily: "monospace",
                              }}
                            >
                              {val ? val.toFixed(4) : "-"}
                            </Text>
                          ),
                        },
                        {
                          title: "Ngưỡng cảnh báo",
                          dataIndex: "early_warning_threshold",
                          key: "early_warning_threshold",
                          width: 130,
                          render: (val) => (
                            <Text style={{ fontSize: "13px" }}>
                              {val ? `${val}%` : "-"}
                            </Text>
                          ),
                        },
                        {
                          title: "Cảnh báo sớm",
                          dataIndex: "is_early_warning",
                          key: "is_early_warning",
                          width: 120,
                          align: "center",
                          render: (val) => (
                            <Tag
                              color={val ? "orange" : "green"}
                              style={{ fontSize: "12px" }}
                            >
                              {val ? "Có" : "Không"}
                            </Tag>
                          ),
                        },
                        {
                          title: "Thời điểm đo",
                          dataIndex: "timestamp",
                          key: "timestamp",
                          width: 150,
                          render: (timestamp) => (
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {formatDate(timestamp)}
                            </Text>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
            </Space>
          </Card>
        </Col>
      )}
    </>
  );
}
