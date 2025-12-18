import MonitoringDataView from "@/components/layout/policy/detail/monitoring-data-view";
import { BarChartOutlined } from "@ant-design/icons";
import { Card, Empty, Space, Typography } from "antd";

const { Text, Title } = Typography;

export default function MonitoringDataTab({ monitoringData }) {
  if (!monitoringData || monitoringData.length === 0) {
    return (
      <Card>
        <Empty
          description="Không có dữ liệu giám sát"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" className="w-full">
      {monitoringData.map((item, idx) => (
        <Card key={idx}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {item.dataSource?.display_name_vi || item.parameterName.toUpperCase()}
                </Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  {item.dataSource?.description_vi}
                </Text>
              </div>
            </div>
            <Text strong style={{ fontSize: '14px', color: '#096dd9' }}>
              {item.monitoringData?.count || 0} bản ghi
            </Text>
          </div>
          <MonitoringDataView item={item} />
        </Card>
      ))}
    </Space>
  );
}
