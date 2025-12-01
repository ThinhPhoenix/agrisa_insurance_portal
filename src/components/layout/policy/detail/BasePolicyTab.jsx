import { Card, Descriptions, Space, Tag, Typography, Button, Table } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

const STATUS_LABELS = {
  active: "Đang hoạt động",
  pending_review: "Chờ duyệt",
};

const CROP_TYPE_LABELS = {
  rice: "Lúa",
  coffee: "Cà phê",
  corn: "Ngô",
  wheat: "Lúa mì",
  tea: "Chè",
};

export default function BasePolicyTab({ basePolicy, dataSourceNames }) {
  if (!basePolicy) {
    return (
      <Card>
        <Text type="secondary">Không có thông tin gói bảo hiểm</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" size="large" className="w-full">
        {/* Product Info Section */}
        <div>
          <Text strong className="text-base block mb-3">
            Thông tin sản phẩm
          </Text>
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "50%" }}
            contentStyle={{ width: "50%" }}
          >
            <Descriptions.Item label="Tên sản phẩm">
              <Text strong>{basePolicy.base_policy?.product_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã sản phẩm">
              <Tag color="blue">{basePolicy.base_policy?.product_code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả sản phẩm">
              {basePolicy.base_policy?.product_description}
            </Descriptions.Item>
            <Descriptions.Item label="Loại cây trồng">
              <Tag color="green">
                {CROP_TYPE_LABELS[basePolicy.base_policy?.crop_type] ||
                  basePolicy.base_policy?.crop_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  basePolicy.base_policy?.status === "active"
                    ? "green"
                    : "orange"
                }
              >
                {STATUS_LABELS[basePolicy.base_policy?.status] ||
                  basePolicy.base_policy?.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Premium Info Section */}
        <div>
          <Text strong className="text-base block mb-3">
            Thông tin phí bảo hiểm
          </Text>
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "50%" }}
            contentStyle={{ width: "50%" }}
          >
            <Descriptions.Item label="Phí cố định">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency:
                  basePolicy.base_policy?.coverage_currency || "VND",
              }).format(basePolicy.base_policy?.fix_premium_amount || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Tính theo hecta">
              <Tag
                color={
                  basePolicy.base_policy?.is_per_hectare
                    ? "green"
                    : "orange"
                }
              >
                {basePolicy.base_policy?.is_per_hectare ? "Có" : "Không"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ phí cơ bản">
              {(basePolicy.base_policy?.premium_base_rate * 100).toFixed(2)}
              %
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian gia hạn thanh toán tối đa">
              {basePolicy.base_policy?.max_premium_payment_prolong} ngày
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ phí hủy">
              {(basePolicy.base_policy?.cancel_premium_rate * 100).toFixed(
                2
              )}
              %
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Payout Info Section */}
        <div>
          <Text strong className="text-base block mb-3">
            Thông tin chi trả bồi thường
          </Text>
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "50%" }}
            contentStyle={{ width: "50%" }}
          >
            <Descriptions.Item label="Số tiền chi trả cố định">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency:
                  basePolicy.base_policy?.coverage_currency || "VND",
              }).format(basePolicy.base_policy?.fix_payout_amount || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Chi trả theo hecta">
              <Tag
                color={
                  basePolicy.base_policy?.is_payout_per_hectare
                    ? "green"
                    : "orange"
                }
              >
                {basePolicy.base_policy?.is_payout_per_hectare
                  ? "Có"
                  : "Không"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hệ số nhân vượt ngưỡng">
              {basePolicy.base_policy?.over_threshold_multiplier}x
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ chi trả cơ bản">
              {(basePolicy.base_policy?.payout_base_rate * 100).toFixed(2)}%
            </Descriptions.Item>
            <Descriptions.Item label="Giới hạn chi trả tối đa">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency:
                  basePolicy.base_policy?.coverage_currency || "VND",
              }).format(basePolicy.base_policy?.payout_cap || 0)}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Coverage Duration Section */}
        <div>
          <Text strong className="text-base block mb-3">
            Thời hạn bảo hiểm
          </Text>
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "50%" }}
            contentStyle={{ width: "50%" }}
          >
            <Descriptions.Item label="Thời hạn bảo hiểm">
              {basePolicy.base_policy?.coverage_duration_days} ngày
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu đăng ký">
              {new Date(
                basePolicy.base_policy?.enrollment_start_day * 1000
              ).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc đăng ký">
              {new Date(
                basePolicy.base_policy?.enrollment_end_day * 1000
              ).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu hiệu lực">
              {new Date(
                basePolicy.base_policy?.insurance_valid_from_day * 1000
              ).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc hiệu lực">
              {new Date(
                basePolicy.base_policy?.insurance_valid_to_day * 1000
              ).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Renewal & Document Section */}
        <div>
          <Text strong className="text-base block mb-3">
            Gia hạn & Tài liệu
          </Text>
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "50%" }}
            contentStyle={{ width: "50%" }}
          >
            <Descriptions.Item label="Tự động gia hạn">
              <Tag
                color={
                  basePolicy.base_policy?.auto_renewal ? "green" : "red"
                }
              >
                {basePolicy.base_policy?.auto_renewal ? "Có" : "Không"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ giảm giá khi gia hạn">
              {(
                basePolicy.base_policy?.renewal_discount_rate * 100
              ).toFixed(2)}
              %
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái xác thực tài liệu">
              <Tag
                color={
                  basePolicy.base_policy?.document_validation_status ===
                  "passed"
                    ? "green"
                    : "orange"
                }
              >
                {basePolicy.base_policy?.document_validation_status ===
                "passed"
                  ? "Đã xác thực"
                  : "Chờ xác thực"}
              </Tag>
            </Descriptions.Item>
            {basePolicy.base_policy?.important_additional_information && (
              <Descriptions.Item label="Thông tin bổ sung quan trọng">
                {basePolicy.base_policy.important_additional_information}
              </Descriptions.Item>
            )}
          </Descriptions>

          {basePolicy?.document?.presigned_url && (
            <div className="mt-4">
              <Text strong className="block mb-2">
                Hợp đồng gốc (Template):
              </Text>
              <Space direction="vertical" size="small">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    window.open(basePolicy.document.presigned_url, "_blank")
                  }
                >
                  Xem hợp đồng gốc (PDF)
                </Button>
                <Text type="secondary" className="text-xs">
                  Kích thước:{" "}
                  {(basePolicy.document.file_size_bytes / 1024).toFixed(2)}{" "}
                  KB
                </Text>
              </Space>
            </div>
          )}
        </div>

        {/* Triggers Section */}
        {basePolicy.triggers && basePolicy.triggers.length > 0 && (
          <div>
            <Text strong className="text-base block mb-3">
              Điều kiện kích hoạt bồi thường ({basePolicy.triggers.length}{" "}
              trigger)
            </Text>
            <Space direction="vertical" size="middle" className="w-full">
              {basePolicy.triggers.map((trigger, idx) => (
                <Card
                  key={trigger.id || idx}
                  size="small"
                  type="inner"
                  title={`Trigger ${idx + 1}`}
                >
                  <Descriptions
                    column={1}
                    size="small"
                    bordered
                    className="mb-3"
                  >
                    <Descriptions.Item label="Toán tử logic">
                      <Tag color="purple">{trigger.logical_operator}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Giai đoạn sinh trưởng">
                      {trigger.growth_stage || "Tất cả"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tần suất giám sát">
                      {trigger.monitor_interval}{" "}
                      {trigger.monitor_frequency_unit === "day"
                        ? "ngày"
                        : trigger.monitor_frequency_unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điều kiện">
                      <Tag color="blue">
                        {trigger.conditions?.length || 0} điều kiện
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>

                  {trigger.conditions && trigger.conditions.length > 0 && (
                    <div>
                      <Text strong className="block mb-2">
                        Chi tiết điều kiện:
                      </Text>
                      <Table
                        size="small"
                        dataSource={trigger.conditions}
                        rowKey={(record) => record.id}
                        pagination={false}
                        columns={[
                          {
                            title: "Thứ tự",
                            dataIndex: "condition_order",
                            key: "order",
                            width: 80,
                            render: (val) => <Tag color="blue">#{val}</Tag>,
                          },
                          {
                            title: "Nguồn dữ liệu",
                            dataIndex: "data_source_id",
                            key: "data_source",
                            ellipsis: true,
                            render: (dataSourceId) => (
                              <span>
                                {dataSourceNames?.[dataSourceId] || (
                                  <Text
                                    type="secondary"
                                    className="text-xs"
                                  >
                                    Đang tải...
                                  </Text>
                                )}
                              </span>
                            ),
                          },
                          {
                            title: "Toán tử",
                            dataIndex: "threshold_operator",
                            key: "operator",
                            width: 100,
                            render: (val) => (
                              <Tag color="orange">{val}</Tag>
                            ),
                          },
                          {
                            title: "Giá trị ngưỡng",
                            dataIndex: "threshold_value",
                            key: "threshold",
                            width: 120,
                            render: (val) => <Text strong>{val}</Text>,
                          },
                          {
                            title: "Cảnh báo sớm",
                            dataIndex: "early_warning_threshold",
                            key: "warning",
                            width: 120,
                            render: (val) => <Tag color="gold">{val}</Tag>,
                          },
                          {
                            title: "Hàm tổng hợp",
                            dataIndex: "aggregation_function",
                            key: "agg_func",
                            width: 120,
                          },
                          {
                            title: "Cửa sổ tổng hợp",
                            dataIndex: "aggregation_window_days",
                            key: "agg_window",
                            width: 130,
                            render: (val) => `${val} ngày`,
                          },
                          {
                            title: "Chi phí tính toán",
                            dataIndex: "calculated_cost",
                            key: "cost",
                            width: 120,
                            render: (val) => (
                              <Text type="success">
                                {new Intl.NumberFormat("vi-VN").format(val)}
                              </Text>
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </Space>
          </div>
        )}

        {/* Metadata Section */}
        {basePolicy.metadata && (
          <div>
            <Text strong className="text-base block mb-3">
              Metadata
            </Text>
            <Descriptions
              column={1}
              size="small"
              bordered
              labelStyle={{ width: "50%" }}
              contentStyle={{ width: "50%" }}
            >
              <Descriptions.Item label="Tổng số triggers">
                <Tag color="blue">{basePolicy.metadata.total_triggers}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng số điều kiện">
                <Tag color="cyan">
                  {basePolicy.metadata.total_conditions}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng chi phí dữ liệu">
                <Text type="success" strong>
                  {new Intl.NumberFormat("vi-VN").format(
                    basePolicy.metadata.total_data_cost
                  )}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng nguồn dữ liệu">
                <Tag color="purple">
                  {basePolicy.metadata.data_source_count}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian truy xuất">
                {new Date(basePolicy.metadata.retrieved_at).toLocaleString(
                  "vi-VN"
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Space>
    </Card>
  );
}
