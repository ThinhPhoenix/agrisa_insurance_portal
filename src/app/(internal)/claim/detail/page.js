"use client";

import useClaim from "@/services/hooks/claim/use-claim";
import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Layout,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Table,
} from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "../../policy/policy.css";

const { Title, Text } = Typography;

export default function ClaimDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("id");

  const { claimDetail, claimDetailLoading, claimDetailError, fetchClaimDetail } =
    useClaim();

  // States for related data
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [basePolicy, setBasePolicy] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!claimId) return;

      try {
        // 1. Fetch claim detail first
        await fetchClaimDetail(claimId);
      } catch (error) {
        console.error("Error fetching claim detail:", error);
      }
    };

    fetchAllData();
  }, [claimId, fetchClaimDetail]);

  // Fetch related data when claimDetail is loaded
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!claimDetail) return;

      setAllDataLoaded(false);

      try {
        // Fetch all related data in parallel
        const promises = [];

        // Fetch policy detail
        if (claimDetail.registered_policy_id) {
          promises.push(
            axiosInstance
              .get(endpoints.policy.policy.detail(claimDetail.registered_policy_id))
              .then((response) => {
                if (response.data.success) {
                  setPolicy(response.data.data);
                  return response.data.data;
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching policy:", error);
                return null;
              })
          );
        }

        // Fetch farm detail
        if (claimDetail.farm_id) {
          promises.push(
            axiosInstance
              .get(endpoints.applications.detail(claimDetail.farm_id))
              .then((response) => {
                if (response.data.success) {
                  setFarm(response.data.data);
                }
                return null;
              })
              .catch((error) => {
                console.error("Error fetching farm:", error);
                return null;
              })
          );
        }

        // Wait for policy to get insurance_provider_id
        const results = await Promise.all(promises);
        const policyData = results[0];

        // Fetch base policy detail after we have policy data
        if (claimDetail.base_policy_id && policyData?.insurance_provider_id) {
          try {
            const basePolicyUrl = endpoints.policy.base_policy.get_detail(
              claimDetail.base_policy_id,
              {
                provider_id: policyData.insurance_provider_id,
              }
            );
            const basePolicyResponse = await axiosInstance.get(basePolicyUrl);
            if (basePolicyResponse.data.success) {
              setBasePolicy(basePolicyResponse.data.data.base_policy);
            }
          } catch (error) {
            console.error("Error fetching base policy:", error);
          }
        }
      } finally {
        setAllDataLoaded(true);
      }
    };

    fetchRelatedData();
  }, [claimDetail]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "generated":
        return "default";
      case "pending_partner_review":
        return "orange";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "paid":
        return "blue";
      default:
        return "default";
    }
  };

  // Get status text (tiếng Việt)
  const getStatusText = (status) => {
    switch (status) {
      case "generated":
        return "Đã tạo";
      case "pending_partner_review":
        return "Chờ đối tác xem xét";
      case "approved":
        return "Đã phê duyệt";
      case "rejected":
        return "Đã từ chối";
      case "paid":
        return "Đã thanh toán";
      default:
        return status;
    }
  };

  // Format date from epoch timestamp or ISO string
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    let date;
    if (typeof timestamp === 'string') {
      // ISO string format
      date = new Date(timestamp);
    } else {
      // Unix timestamp
      date = timestamp < 5000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    }
    return date.toLocaleString("vi-VN", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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

  if (claimDetailLoading || !allDataLoaded) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Đang tải thông tin bồi thường..." />
        </div>
      </Layout.Content>
    );
  }

  if (claimDetailError) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="danger">Lỗi: {claimDetailError}</Text>
        </div>
      </Layout.Content>
    );
  }

  if (!claimDetail) {
    return (
      <Layout.Content className="insurance-content">
        <div className="flex justify-center items-center h-96">
          <Text type="secondary">Không tìm thấy thông tin bồi thường</Text>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="insurance-content">
      <div className="insurance-space">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="insurance-title !mb-0">
              Chi Tiết Bồi Thường
            </Title>
            <Space className="insurance-subtitle">
              <Text>Mã: {claimDetail.claim_number}</Text>
              <Text>|</Text>
              <Text>Trạng thái:</Text>
              <Tag color={getStatusColor(claimDetail.status)} style={{ fontSize: '13px' }}>
                {getStatusText(claimDetail.status)}
              </Tag>
              {claimDetail.auto_generated && (
                <Tag color="blue" icon={<InfoCircleOutlined />}>
                  Tự động
                </Tag>
              )}
            </Space>
          </div>

          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
            >
              Quay lại
            </Button>
            {claimDetail.status === "pending_partner_review" && (
              <>
                <Button
                  danger
                  size="large"
                  onClick={() => {/* TODO: Handle reject */}}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => {/* TODO: Handle approve */}}
                >
                  Chấp nhận
                </Button>
              </>
            )}
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {/* Thông tin cơ bản */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Thông Tin Cơ Bản</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Mã bồi thường">
                  <Text strong>{claimDetail.claim_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Đơn bảo hiểm">
                  {policy ? (
                    <Link href={`/policy/policy-detail?id=${policy.id}&type=active`}>
                      <Text style={{ color: '#1890ff' }}>{policy.policy_number}</Text>
                    </Link>
                  ) : (
                    <Text type="secondary">{claimDetail.registered_policy_id}</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Gói bảo hiểm">
                  {basePolicy ? (
                    <Text>{basePolicy.product_name || basePolicy.name || basePolicy.policy_name}</Text>
                  ) : (
                    <Text type="secondary">{claimDetail.base_policy_id}</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trang trại">
                  {farm ? (
                    <Text>{farm.farm_name || "Trang trại"}</Text>
                  ) : (
                    <Text type="secondary">{claimDetail.farm_id}</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian kích hoạt">
                  {formatDate(claimDetail.trigger_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {formatDate(claimDetail.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatDate(claimDetail.updated_at)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin tài chính */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Thông Tin Tài Chính</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Tổng số tiền bồi thường">
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {formatCurrency(claimDetail.claim_amount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Bồi thường cố định">
                  {formatCurrency(claimDetail.calculated_fix_payout)}
                </Descriptions.Item>
                <Descriptions.Item label="Bồi thường theo ngưỡng">
                  {formatCurrency(claimDetail.calculated_threshold_payout)}
                </Descriptions.Item>
                <Descriptions.Item label="Giá trị vượt ngưỡng">
                  {claimDetail.over_threshold_value
                    ? `${claimDetail.over_threshold_value.toFixed(2)}%`
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin đánh giá của đối tác */}
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  <span>Thông Tin Đánh Giá Của Đối Tác</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Thời gian đánh giá" span={1}>
                  {formatDate(claimDetail.partner_review_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="Quyết định" span={1}>
                  {claimDetail.partner_decision ? (
                    <Tag
                      color={
                        claimDetail.partner_decision === "approved"
                          ? "green"
                          : "red"
                      }
                    >
                      {claimDetail.partner_decision === "approved"
                        ? "Chấp thuận"
                        : "Từ chối"}
                    </Tag>
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Người đánh giá" span={1}>
                  {claimDetail.reviewed_by || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú của đối tác" span={2}>
                  {claimDetail.partner_notes || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Bằng chứng */}
          {claimDetail.evidence_summary && (
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <WarningOutlined />
                    <span>Bằng Chứng Kích Hoạt Bồi Thường</span>
                  </Space>
                }
                bordered={false}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Phương thức tạo" span={1}>
                      <Tag color={claimDetail.evidence_summary.generation_method === 'automatic' ? 'blue' : 'default'}>
                        {claimDetail.evidence_summary.generation_method === 'automatic' ? 'Tự động' : 'Thủ công'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điều kiện kích hoạt" span={1}>
                      <Text strong>{claimDetail.evidence_summary.conditions_count || 0}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời điểm kích hoạt" span={2}>
                      {formatDate(claimDetail.evidence_summary.triggered_at)}
                    </Descriptions.Item>
                  </Descriptions>

                  {claimDetail.evidence_summary.conditions && claimDetail.evidence_summary.conditions.length > 0 && (
                    <>
                      <Text strong style={{ fontSize: '14px', marginTop: '16px', display: 'block' }}>
                        Chi tiết các điều kiện:
                      </Text>
                      <Table
                        dataSource={claimDetail.evidence_summary.conditions}
                        rowKey={(record, index) => record.condition_id || index}
                        pagination={false}
                        size="small"
                        bordered
                        columns={[
                          {
                            title: 'Tham số',
                            dataIndex: 'parameter',
                            key: 'parameter',
                            width: 120,
                            render: (text) => <Tag color="blue">{text?.toUpperCase()}</Tag>,
                          },
                          {
                            title: 'Điều kiện',
                            key: 'condition',
                            width: 180,
                            render: (_, record) => (
                              <Text>
                                Giá trị đo được {record.operator} {record.threshold_value}%
                              </Text>
                            ),
                          },
                          {
                            title: 'Giá trị baseline',
                            dataIndex: 'baseline_value',
                            key: 'baseline_value',
                            width: 120,
                            render: (val) => val ? val.toFixed(4) : '-',
                          },
                          {
                            title: 'Giá trị đo được',
                            dataIndex: 'measured_value',
                            key: 'measured_value',
                            width: 120,
                            render: (val) => val ? val.toFixed(4) : '-',
                          },
                          {
                            title: 'Ngưỡng cảnh báo sớm',
                            dataIndex: 'early_warning_threshold',
                            key: 'early_warning_threshold',
                            width: 140,
                            render: (val) => val ? `${val}%` : '-',
                          },
                          {
                            title: 'Cảnh báo sớm',
                            dataIndex: 'is_early_warning',
                            key: 'is_early_warning',
                            width: 120,
                            render: (val) => (
                              <Tag color={val ? 'orange' : 'green'}>
                                {val ? 'Có' : 'Không'}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Thời điểm đo',
                            dataIndex: 'timestamp',
                            key: 'timestamp',
                            width: 150,
                            render: (timestamp) => formatDate(timestamp),
                          },
                        ]}
                      />
                    </>
                  )}
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </Layout.Content>
  );
}
