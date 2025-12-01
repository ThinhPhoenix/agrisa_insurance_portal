import { Card, Space, Tag, Typography } from "antd";
import { LineChartOutlined } from "@ant-design/icons";
import MonitoringDataView from "@/components/layout/policy/detail/monitoring-data-view";

const { Text } = Typography;

export default function MonitoringDataTab({ monitoringData }) {
  if (!monitoringData || monitoringData.length === 0) {
    return (
      <Card>
        <Text type="secondary">Không có dữ liệu giám sát</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" className="w-full">
      {monitoringData.map((item, idx) => (
        <Card
          key={idx}
          title={
            <div className="flex justify-between items-center">
              <span>
                <LineChartOutlined />{" "}
                {item.dataSource?.display_name_vi ||
                  item.parameterName.toUpperCase()}
                {" - "}
                <Text type="secondary">
                  {item.dataSource?.description_vi}
                </Text>
              </span>
              <Tag color="blue">
                {item.monitoringData?.count || 0} bản ghi
              </Tag>
            </div>
          }
        >
          <MonitoringDataView item={item} />
        </Card>
      ))}
    </Space>
  );
}
