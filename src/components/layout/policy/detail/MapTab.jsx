import { Card, Typography } from "antd";
import OpenStreetMapWithPolygon from "@/components/map-polygon";

const { Text } = Typography;

export default function MapTab({ farm }) {
  return (
    <Card>
      {farm ? (
        <div style={{ height: "600px" }}>
          <OpenStreetMapWithPolygon
            boundary={farm.boundary}
            centerLocation={farm.center_location}
          />
        </div>
      ) : (
        <Text type="secondary">Không có thông tin bản đồ</Text>
      )}
    </Card>
  );
}
