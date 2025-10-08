import { FilePdfOutlined } from "@ant-design/icons";
import { Button, Card, Space } from "antd";

const SuccessView = ({ generatePDF }) => (
  <div className="contract-success">
    <Card title="Hợp đồng đã được tạo thành công">
      <p>Hợp đồng của bạn đã được gửi cho admin để thẩm định.</p>
      <Space>
        <Button type="primary" icon={<FilePdfOutlined />} onClick={generatePDF}>
          Xem PDF Preview
        </Button>
        <Button onClick={() => window.location.reload()}>
          Tạo hợp đồng mới
        </Button>
      </Space>
    </Card>
  </div>
);

export default SuccessView;
