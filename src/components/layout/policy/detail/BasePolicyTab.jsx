import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyOutlined,
  StopOutlined,
  ThunderboltOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Button, Card, Descriptions, Divider, Space, Tag, Typography } from "antd";
import CustomTable from '../../../custom-table';

const { Text, Title } = Typography;

const getStatusTag = (status) => {
  const statusConfig = {
    draft: {
      color: "processing",
      icon: <ClockCircleOutlined />,
      text: "Chờ duyệt",
    },
    active: {
      color: "success",
      icon: <CheckCircleOutlined />,
      text: "Đang hoạt động",
    },
    closed: {
      color: "error",
      icon: <StopOutlined />,
      text: "Đã đóng",
    },
    archived: {
      color: "default",
      icon: <FileTextOutlined />,
      text: "Đã lưu trữ",
    },
    pending_review: {
      color: "warning",
      icon: <ClockCircleOutlined />,
      text: "Chờ duyệt",
    },
  };

  const config = statusConfig[status] || {
    color: "default",
    icon: null,
    text: status,
  };

  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  );
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
    <>
      <Card>
        {/* Product Info Section */}
        <div className="flex items-center gap-2 mb-4">
          <SafetyOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Thông tin sản phẩm</Title>
        </div>
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="small"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Tên sản phẩm" span={2}>
            <Text strong style={{ fontSize: '15px' }}>{basePolicy.base_policy?.product_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Mã sản phẩm">
            <Tag color="blue" style={{ fontSize: '13px', padding: '4px 10px' }}>
              {basePolicy.base_policy?.product_code}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {getStatusTag(basePolicy.base_policy?.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Loại cây trồng">
            <Tag color="green" style={{ fontSize: '13px', padding: '4px 10px' }}>
              {CROP_TYPE_LABELS[basePolicy.base_policy?.crop_type] ||
                basePolicy.base_policy?.crop_type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả sản phẩm" span={2}>
            <Text type="secondary">{basePolicy.base_policy?.product_description}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Premium Info Section */}
        <div className="flex items-center gap-2 mb-4">
          <WalletOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
          <Title level={4} style={{ margin: 0 }}>Phí bảo hiểm</Title>
        </div>
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="small"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Phí cố định">
            <Text strong style={{ color: '#52c41a' }}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: basePolicy.base_policy?.coverage_currency || "VND",
              }).format(basePolicy.base_policy?.fix_premium_amount || 0)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tỷ lệ phí cơ bản">
            <Tag color="blue">{(basePolicy.base_policy?.premium_base_rate * 100).toFixed(2)}%</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tính theo hecta">
            <Tag color={basePolicy.base_policy?.is_per_hectare ? "green" : "orange"}>
              {basePolicy.base_policy?.is_per_hectare ? "Có" : "Không"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tỷ lệ phí hủy">
            <Tag color="volcano">{(basePolicy.base_policy?.cancel_premium_rate * 100).toFixed(2)}%</Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Payout Info Section */}
        <div className="flex items-center gap-2 mb-4">
          <WalletOutlined style={{ fontSize: '20px', color: '#faad14' }} />
          <Title level={4} style={{ margin: 0 }}>Bồi thường</Title>
        </div>
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="small"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Số tiền cố định">
            <Text strong style={{ color: '#faad14' }}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: basePolicy.base_policy?.coverage_currency || "VND",
              }).format(basePolicy.base_policy?.fix_payout_amount || 0)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tỷ lệ chi trả">
            <Tag color="gold">{(basePolicy.base_policy?.payout_base_rate * 100).toFixed(2)}%</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Chi trả theo hecta">
            <Tag color={basePolicy.base_policy?.is_payout_per_hectare ? "green" : "orange"}>
              {basePolicy.base_policy?.is_payout_per_hectare ? "Có" : "Không"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Hệ số vượt ngưỡng">
            <Tag color="purple">{basePolicy.base_policy?.over_threshold_multiplier}x</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Giới hạn tối đa" span={2}>
            <Text strong style={{ color: '#ff4d4f' }}>
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: basePolicy.base_policy?.coverage_currency || "VND",
              }).format(basePolicy.base_policy?.payout_cap || 0)}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Coverage Duration Section */}
        <div className="flex items-center gap-2 mb-4">
          <CalendarOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
          <Title level={4} style={{ margin: 0 }}>Thời hạn bảo hiểm</Title>
        </div>
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="small"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Thời hạn BH">
            <Tag color="purple" style={{ fontSize: '14px', padding: '4px 12px' }}>
              {basePolicy.base_policy?.coverage_duration_days} ngày
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Đăng ký: Bắt đầu">
            {new Date(
              basePolicy.base_policy?.enrollment_start_day * 1000
            ).toLocaleDateString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Đăng ký: Kết thúc">
            {new Date(
              basePolicy.base_policy?.enrollment_end_day * 1000
            ).toLocaleDateString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Hiệu lực: Bắt đầu">
            {new Date(
              basePolicy.base_policy?.insurance_valid_from_day * 1000
            ).toLocaleDateString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Hiệu lực: Kết thúc">
            {new Date(
              basePolicy.base_policy?.insurance_valid_to_day * 1000
            ).toLocaleDateString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Renewal & Document Section */}
        <div className="flex items-center gap-2 mb-4">
          <ReloadOutlined style={{ fontSize: '20px', color: '#13c2c2' }} />
          <Title level={4} style={{ margin: 0 }}>Gia hạn & Tài liệu</Title>
        </div>
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="small"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label="Tự động gia hạn">
            <Tag color={basePolicy.base_policy?.auto_renewal ? "green" : "red"}>
              {basePolicy.base_policy?.auto_renewal ? "Có" : "Không"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Giảm giá gia hạn">
            <Tag color="cyan">
              {(basePolicy.base_policy?.renewal_discount_rate * 100).toFixed(2)}%
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Xác thực tài liệu">
            <Tag color={basePolicy.base_policy?.document_validation_status === "passed" ? "green" : "orange"}>
              {basePolicy.base_policy?.document_validation_status === "passed" ? "Đã xác thực" : "Chờ xác thực"}
            </Tag>
          </Descriptions.Item>
          {basePolicy.base_policy?.important_additional_information && (
            <Descriptions.Item label="Thông tin bổ sung" span={2}>
              <Text type="secondary">{basePolicy.base_policy.important_additional_information}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {basePolicy?.document?.presigned_url && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Space direction="vertical" size="small">
              <Text strong><FileTextOutlined /> Hợp đồng gốc (Template)</Text>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(basePolicy.document.presigned_url, "_blank")}
                >
                  Xem PDF
                </Button>
                <Text type="secondary">
                  {(basePolicy.document.file_size_bytes / 1024).toFixed(2)} KB
                </Text>
              </Space>
            </Space>
          </>
        )}
      </Card>

      {/* Triggers Section */}
      {basePolicy.triggers && basePolicy.triggers.length > 0 && (
        <Card style={{ marginTop: '16px' }}>
          <div className="flex items-center gap-2 mb-4">
            <ThunderboltOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
            <Title level={4} style={{ margin: 0 }}>
              Điều kiện kích hoạt ({basePolicy.triggers.length})
            </Title>
          </div>
          <Space direction="vertical" size="middle" className="w-full">
            {basePolicy.triggers.map((trigger, idx) => (
              <Card
                key={trigger.id || idx}
                size="small"
                type="inner"
                title={
                  <Space>
                    <Text strong>Trigger #{idx + 1}</Text>
                    <Tag color="purple">{trigger.logical_operator}</Tag>
                    <Tag color="blue">{trigger.conditions?.length || 0} điều kiện</Tag>
                  </Space>
                }
              >
                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  size="small"
                  className="mb-3"
                  labelStyle={{ fontWeight: 500 }}
                >
                  <Descriptions.Item label="Giai đoạn sinh trưởng">
                    <Tag color="green">{trigger.growth_stage || "Tất cả"}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tần suất giám sát">
                    <Tag color="cyan">
                      {trigger.monitor_interval}{" "}
                      {trigger.monitor_frequency_unit === "day" ? "ngày" : trigger.monitor_frequency_unit}
                    </Tag>
                  </Descriptions.Item>
                  {trigger.blackout_periods?.periods?.length > 0 && (
                    <Descriptions.Item label="Giai đoạn không kích hoạt" span={2}>
                      <Space size="small" wrap>
                        {trigger.blackout_periods.periods.map((period, index) => {
                          const formatDate = (dateStr) => {
                            if (!dateStr) return dateStr;
                            const [month, day] = dateStr.split('-');
                            return `${day}/${month}`;
                          };
                          return (
                            <Tag key={index} color="red" style={{ fontSize: '13px', padding: '4px 10px' }}>
                              {formatDate(period.start)} đến {formatDate(period.end)}
                            </Tag>
                          );
                        })}
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>

                {trigger.conditions && trigger.conditions.length > 0 && (
                  <div>
                    <Text strong className="block mb-2">
                      Chi tiết điều kiện:
                    </Text>
                    <CustomTable
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
                          title: "Chu kỳ tổng hợp",
                          dataIndex: "aggregation_window_days",
                          key: "agg_window",
                          width: 130,
                          render: (val) => `${val} ngày`,
                        },
                        {
                          title: "Phí tính toán",
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
        </Card>
      )}

      {/* Metadata Section */}
      {basePolicy.metadata && (
        <Card style={{ marginTop: '16px' }}>
          <div className="flex items-center gap-2 mb-4">
            <InfoCircleOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />
            <Title level={4} style={{ margin: 0 }}>Thống kê</Title>
          </div>
          <Descriptions
            column={{ xs: 1, sm: 2, md: 4 }}
            size="small"
            labelStyle={{ fontWeight: 500 }}
          >
            <Descriptions.Item label="Tổng triggers">
              <Tag color="blue">{basePolicy.metadata.total_triggers}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng điều kiện">
              <Tag color="cyan">{basePolicy.metadata.total_conditions}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nguồn dữ liệu">
              <Tag color="purple">{basePolicy.metadata.data_source_count}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Chi phí dữ liệu">
              <Text strong style={{ color: '#52c41a' }}>
                {new Intl.NumberFormat("vi-VN").format(basePolicy.metadata.total_data_cost)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </>
  );
}
