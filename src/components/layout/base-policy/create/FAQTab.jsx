import {
    AlertOutlined,
    BarChartOutlined,
    BulbOutlined,
    CalculatorOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    EditOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    LineChartOutlined,
    LinkOutlined,
    QuestionCircleOutlined,
    SearchOutlined,
    SettingOutlined,
    TagOutlined,
    ThunderboltOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { Card, Collapse, Divider, Space, Table, Tag, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Tab FAQ/Giải thích - Hướng dẫn chi tiết cho người dùng không chuyên
 *
 * Mục đích: Giải thích các khái niệm, công thức, và quy trình tạo policy
 * bằng tiếng Việt dễ hiểu, có chú thích tiếng Anh cho thuật ngữ chuyên sâu
 */
const FAQTab = () => {
    // Bảng giải thích các trường cơ bản
    const basicFieldsData = [
        {
            key: '1',
            field: 'Tên Sản phẩm',
            englishTerm: 'Product Name',
            description: 'Tên hiển thị của gói bảo hiểm, giúp người dùng dễ nhận biết',
            example: 'Bảo hiểm lúa mùa đông 2025',
            required: 'Có'
        },
        {
            key: '2',
            field: 'Mã Sản phẩm',
            englishTerm: 'Product Code',
            description: 'Mã định danh duy nhất trong hệ thống, chỉ chứa chữ, số và dấu gạch dưới',
            example: 'RICE_WINTER_2025',
            required: 'Có'
        },
        {
            key: '3',
            field: 'Loại Cây trồng',
            englishTerm: 'Crop Type',
            description: 'Loại cây trồng được áp dụng bảo hiểm',
            example: 'Lúa, Ngô, Cà phê',
            required: 'Có'
        },
        {
            key: '4',
            field: 'Thời hạn bảo hiểm',
            englishTerm: 'Coverage Duration',
            description: 'Số ngày mà hợp đồng bảo hiểm có hiệu lực',
            example: '120 ngày',
            required: 'Có'
        },
    ];

    const premiumFieldsData = [
        {
            key: '1',
            field: 'Phí bảo hiểm cố định',
            englishTerm: 'Fixed Premium Amount',
            description: 'Số tiền phí cố định mà người mua phải trả, không thay đổi theo diện tích hay điều kiện',
            example: '1,000,000 ₫',
            required: 'Có (nếu không dùng tỷ lệ phí)'
        },
        {
            key: '2',
            field: 'Tỷ lệ phí cơ bản',
            englishTerm: 'Premium Base Rate',
            description: 'Hệ số nhân để tính phí theo diện tích hoặc giá trị cây trồng. PHẢI LỚN HƠN 0 nếu không có phí cố định',
            example: '1.5 (tức 150%)',
            required: 'Có (nếu không có phí cố định)'
        },
        {
            key: '3',
            field: 'Tỷ lệ hoàn phí khi hủy',
            englishTerm: 'Cancel Premium Rate',
            description: 'Tỷ lệ hoàn lại phí khi người dùng hủy hợp đồng trước hạn',
            example: '0.8 = hoàn 80% phí',
            required: 'Không'
        },
    ];

    const payoutFieldsData = [
        {
            key: '1',
            field: 'Số tiền chi trả cố định',
            englishTerm: 'Fixed Payout Amount',
            description: 'Số tiền chi trả cố định khi xảy ra sự kiện kích hoạt bảo hiểm',
            example: '5,000,000 ₫',
            required: 'Có (nếu không dùng tỷ lệ chi trả)'
        },
        {
            key: '2',
            field: 'Tỷ lệ chi trả cơ bản',
            englishTerm: 'Payout Base Rate',
            description: 'Tỷ lệ phần trăm giá trị thiệt hại được chi trả. PHẢI LỚN HƠN 0',
            example: '0.75 = chi trả 75% thiệt hại',
            required: 'Có'
        },
        {
            key: '3',
            field: 'Trần chi trả',
            englishTerm: 'Payout Cap',
            description: 'Số tiền tối đa được chi trả cho một hợp đồng, dù thiệt hại có cao hơn',
            example: '10,000,000 ₫',
            required: 'Không'
        },
        {
            key: '4',
            field: 'Hệ số vượt ngưỡng',
            englishTerm: 'Over Threshold Multiplier',
            description: 'Hệ số nhân bổ sung khi mức độ thiệt hại vượt xa ngưỡng. PHẢI LỚN HƠN 0',
            example: '1.5 = tăng 50% chi trả',
            required: 'Không (mặc định: 1.0)'
        },
    ];

    const triggerFieldsData = [
        {
            key: '1',
            field: 'Toán tử Logic',
            englishTerm: 'Logical Operator',
            description: 'Cách kết hợp nhiều điều kiện',
            options: 'AND (tất cả đúng) hoặc OR (một trong các điều kiện đúng)',
            required: 'Có'
        },
        {
            key: '2',
            field: 'Tần suất giám sát',
            englishTerm: 'Monitor Interval',
            description: 'Số lần kiểm tra dữ liệu trong một khoảng thời gian',
            example: '1 ngày = kiểm tra mỗi ngày',
            required: 'Có'
        },
        {
            key: '3',
            field: 'Nguồn dữ liệu',
            englishTerm: 'Data Source',
            description: 'Nguồn dữ liệu vệ tinh hoặc cảm biến để theo dõi (mỗi nguồn chỉ được chọn 1 lần)',
            example: 'NASA Rainfall, Temperature Sensor',
            required: 'Có (ít nhất 1)'
        },
    ];

    const conditionFieldsData = [
        {
            key: '1',
            field: 'Toán tử ngưỡng',
            englishTerm: 'Threshold Operator',
            description: 'Phép so sánh với giá trị ngưỡng',
            options: '< (nhỏ hơn), > (lớn hơn), <= (nhỏ hơn hoặc bằng), >= (lớn hơn hoặc bằng), == (bằng), != (khác)',
            required: 'Có'
        },
        {
            key: '2',
            field: 'Giá trị ngưỡng',
            englishTerm: 'Threshold Value',
            description: 'Giá trị để so sánh với dữ liệu thực tế',
            example: '50 (mm mưa), 35 (độ C)',
            required: 'Có'
        },
        {
            key: '3',
            field: 'Hàm tổng hợp',
            englishTerm: 'Aggregation Function',
            description: 'Cách tính toán dữ liệu trong một khoảng thời gian',
            options: 'sum (tổng), avg (trung bình), min (nhỏ nhất), max (lớn nhất)',
            required: 'Có'
        },
        {
            key: '4',
            field: 'Cửa sổ tổng hợp',
            englishTerm: 'Aggregation Window',
            description: 'Số ngày dữ liệu được tính toán',
            example: '7 ngày = tính trung bình 7 ngày',
            required: 'Có'
        },
        {
            key: '5',
            field: 'Chất lượng dữ liệu',
            englishTerm: 'Data Quality',
            description: 'Mức độ tin cậy và chính xác của nguồn dữ liệu',
            options: 'good (tốt), acceptable (chấp nhận được), poor (kém)',
            required: 'Không (mặc định: good)'
        },
    ];

    const basicFieldsColumns = [
        {
            title: 'Tên trường',
            dataIndex: 'field',
            key: 'field',
            width: '20%',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Thuật ngữ Anh',
            dataIndex: 'englishTerm',
            key: 'englishTerm',
            width: '15%',
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Giải thích',
            dataIndex: 'description',
            key: 'description',
            width: '35%',
        },
        {
            title: 'Ví dụ',
            dataIndex: 'example',
            key: 'example',
            width: '20%',
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Bắt buộc',
            dataIndex: 'required',
            key: 'required',
            width: '10%',
            render: (text) => (
                <Tag color={text === 'Có' ? 'red' : 'default'}>
                    {text}
                </Tag>
            )
        },
    ];

    const triggerConditionColumns = [
        {
            title: 'Tên trường',
            dataIndex: 'field',
            key: 'field',
            width: '20%',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Thuật ngữ Anh',
            dataIndex: 'englishTerm',
            key: 'englishTerm',
            width: '20%',
            render: (text) => <Tag color="purple">{text}</Tag>
        },
        {
            title: 'Giải thích',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
        },
        {
            title: 'Tùy chọn / Ví dụ',
            key: 'optionsOrExample',
            width: '20%',
            render: (_, record) => (
                <Text type="secondary">
                    {record.options || record.example}
                </Text>
            )
        },
        {
            title: 'Bắt buộc',
            dataIndex: 'required',
            key: 'required',
            width: '10%',
            render: (text) => (
                <Tag color={text === 'Có' || text.includes('Có') ? 'red' : 'default'}>
                    {text}
                </Tag>
            )
        },
    ];

    return (
        <div style={{ padding: '16px 0' }}>
            <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Giới thiệu */}
                    <div>
                        <Title level={3}>
                            <QuestionCircleOutlined style={{ marginRight: 8 }} />
                            Hướng dẫn sử dụng - FAQ
                        </Title>
                        <Paragraph>
                            Trang này giải thích chi tiết các khái niệm, thuật ngữ và công thức trong hệ thống tạo
                            Policy Bảo hiểm Nông nghiệp. Mục đích là giúp người không chuyên có thể hiểu và sử dụng
                            hệ thống một cách dễ dàng.
                        </Paragraph>
                    </div>

                    <Divider />

                    {/* Các câu hỏi thường gặp */}
                    <Collapse
                        defaultActiveKey={['1']}
                        expandIconPosition="end"
                        size="large"
                    >
                        {/* Giải thích Policy là gì */}
                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                    <Text strong>Hợp đồng mẫu là gì?</Text>
                                </Space>
                            }
                            key="1"
                        >
                            <Paragraph>
                                <Text strong>Hợp đồng mẫu</Text> (Base Policy) là một bản hợp đồng điện tử
                                quy định các điều khoản bảo hiểm cho cây trồng. Mỗi hợp đồng mẫu bao gồm:
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text strong>Thông tin cơ bản:</Text> Tên sản phẩm, loại cây trồng, thời hạn bảo hiểm
                                </li>
                                <li>
                                    <Text strong>Phí bảo hiểm (Premium):</Text> Số tiền người mua phải trả
                                </li>
                                <li>
                                    <Text strong>Chi trả bảo hiểm (Payout):</Text> Số tiền được chi trả khi xảy ra sự kiện kích hoạt
                                </li>
                                <li>
                                    <Text strong>Điều kiện kích hoạt (Trigger):</Text> Các điều kiện cần thỏa mãn để được chi trả bảo hiểm
                                </li>
                                <li>
                                    <Text strong>Nguồn dữ liệu:</Text> Dữ liệu vệ tinh hoặc cảm biến dùng để theo dõi
                                </li>
                            </ul>
                        </Panel>

                        {/* Quy trình tạo Policy */}
                        <Panel
                            header={
                                <Space>
                                    <FileTextOutlined style={{ color: '#52c41a' }} />
                                    <Text strong>Quy trình tạo hợp đồng mẫu bao gồm những bước nào?</Text>
                                </Space>
                            }
                            key="2"
                        >
                            <Paragraph>
                                Quy trình tạo hợp đồng mẫu được chia thành <Text strong>4 bước chính</Text>:
                            </Paragraph>
                            <ol>
                                <li>
                                    <Text strong>Thông tin cơ bản:</Text> Nhập tên, mã sản phẩm, loại cây trồng, cấu hình phí và chi trả
                                </li>
                                <li>
                                    <Text strong>Cấu hình nâng cao:</Text> Thiết lập điều kiện kích hoạt (trigger) và các điều kiện giám sát
                                </li>
                                <li>
                                    <Text strong>Tài liệu & Trường thông tin:</Text> Upload mẫu hợp đồng PDF và map các trường dữ liệu
                                </li>
                                <li>
                                    <Text strong>Xem lại & Tạo:</Text> Kiểm tra toàn bộ thông tin và gửi tạo hợp đồng mẫu
                                </li>
                            </ol>
                        </Panel>

                        {/* Giải thích các trường Thông tin cơ bản */}
                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#722ed1' }} />
                                    <Text strong>Các trường trong "Thông tin cơ bản" có ý nghĩa gì?</Text>
                                </Space>
                            }
                            key="3"
                        >
                            <Title level={5}><InfoCircleOutlined /> Thông tin sản phẩm</Title>
                            <Table
                                dataSource={basicFieldsData}
                                columns={basicFieldsColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}><DollarOutlined /> Cấu hình Phí bảo hiểm (Premium)</Title>
                            <Table
                                dataSource={premiumFieldsData}
                                columns={basicFieldsColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}><DollarOutlined /> Cấu hình Chi trả (Payout)</Title>
                            <Table
                                dataSource={payoutFieldsData}
                                columns={basicFieldsColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />
                        </Panel>

                        {/* Phí và Chi trả */}
                        <Panel
                            header={
                                <Space>
                                    <DollarOutlined style={{ color: '#fa8c16' }} />
                                    <Text strong>Phí bảo hiểm (Premium) và Chi trả (Payout) khác nhau như thế nào?</Text>
                                </Space>
                            }
                            key="4"
                        >
                            <Paragraph>
                                <Text strong>Phí bảo hiểm (Premium)</Text> là số tiền mà <Text underline>người mua phải trả</Text> để
                                được tham gia bảo hiểm.
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Chi trả bảo hiểm (Payout)</Text> là số tiền mà <Text underline>công ty bảo hiểm chi trả</Text> cho
                                người tham gia khi <Text type="danger">điều kiện trigger được kích hoạt</Text> (như lượng mưa thấp, nhiệt độ quá cao, NDVI giảm).
                            </Paragraph>

                            <Divider />

                            <Title level={5}>🔢 Công thức tính</Title>
                            <Paragraph>
                                <Text strong>Phí bảo hiểm:</Text>
                            </Paragraph>
                            <ul>
                                <li>Nếu có <Text code>Phí cố định</Text>: Phí = Phí cố định</li>
                                <li>Nếu không có phí cố định: Phí = Diện tích × Tỷ lệ phí cơ bản × Giá trị cây trồng</li>
                            </ul>

                            <Paragraph>
                                <Text strong>Chi trả bảo hiểm:</Text>
                            </Paragraph>
                            <ul>
                                <li>Nếu có <Text code>Chi trả cố định</Text>: Chi trả = Chi trả cố định</li>
                                <li>
                                    Nếu không có chi trả cố định: Chi trả = Thiệt hại ước tính × Tỷ lệ chi trả cơ bản × Hệ số vượt ngưỡng
                                </li>
                                <li>
                                    Nếu có <Text code>Trần chi trả</Text>: Chi trả tối đa = Trần chi trả (không vượt quá giá trị này)
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><BarChartOutlined /> Ví dụ cụ thể</Title>
                            <Paragraph>
                                <Text strong>Ví dụ 1:</Text> Phí cố định
                            </Paragraph>
                            <ul>
                                <li>Phí bảo hiểm cố định: 1,000,000 ₫</li>
                                <li>→ Người mua trả: <Text mark>1,000,000 ₫</Text></li>
                            </ul>

                            <Paragraph>
                                <Text strong>Ví dụ 2:</Text> Chi trả theo tỷ lệ
                            </Paragraph>
                            <ul>
                                <li>Thiệt hại ước tính: 8,000,000 ₫</li>
                                <li>Tỷ lệ chi trả cơ bản: 0.75 (75%)</li>
                                <li>Hệ số vượt ngưỡng: 1.2 (do thiệt hại nghiêm trọng)</li>
                                <li>Trần chi trả: 10,000,000 ₫</li>
                                <li>→ Chi trả = 8,000,000 × 0.75 × 1.2 = 7,200,000 ₫</li>
                                <li>→ Người mua nhận: <Text mark>7,200,000 ₫</Text> (không vượt trần 10 triệu)</li>
                            </ul>
                        </Panel>

                        {/* Trigger và Condition */}
                        <Panel
                            header={
                                <Space>
                                    <ThunderboltOutlined style={{ color: '#eb2f96' }} />
                                    <Text strong>Trigger (Điều kiện kích hoạt) và Condition (Điều kiện giám sát) là gì?</Text>
                                </Space>
                            }
                            key="5"
                        >
                            <Paragraph>
                                <Text strong>Trigger (Điều kiện kích hoạt)</Text> là bộ quy tắc xác định khi nào hợp đồng mẫu sẽ chi trả bảo hiểm.
                                Trigger bao gồm:
                            </Paragraph>

                            <Title level={5}><SettingOutlined /> Các trường trong Trigger</Title>
                            <Table
                                dataSource={triggerFieldsData}
                                columns={triggerConditionColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Paragraph>
                                <Text strong>Condition (Điều kiện giám sát)</Text> là từng điều kiện cụ thể cần kiểm tra. Một trigger có thể có
                                nhiều conditions, và chúng được kết hợp bằng toán tử logic (AND/OR).
                            </Paragraph>

                            <Title level={5}><SearchOutlined /> Các trường trong Condition</Title>
                            <Table
                                dataSource={conditionFieldsData}
                                columns={triggerConditionColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}><BarChartOutlined /> Ví dụ cụ thể</Title>
                            <Paragraph>
                                <Text strong>Ví dụ:</Text> Bảo hiểm lúa chống hạn hán và nhiệt độ cao
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text strong>Toán tử logic:</Text> OR (chỉ cần 1 trong 2 điều kiện đúng là kích hoạt)
                                </li>
                                <li>
                                    <Text strong>Điều kiện 1:</Text> Lượng mưa trung bình 7 ngày {'<'} 10mm
                                    <ul>
                                        <li>Nguồn dữ liệu: NASA Rainfall Satellite</li>
                                        <li>Hàm tổng hợp: avg (trung bình)</li>
                                        <li>Cửa sổ tổng hợp: 7 ngày</li>
                                        <li>Toán tử ngưỡng: {'<'} (nhỏ hơn)</li>
                                        <li>Giá trị ngưỡng: 10 mm</li>
                                    </ul>
                                </li>
                                <li>
                                    <Text strong>Điều kiện 2:</Text> Nhiệt độ tối đa 3 ngày {'>'} 38°C
                                    <ul>
                                        <li>Nguồn dữ liệu: Temperature Sensor</li>
                                        <li>Hàm tổng hợp: max (lớn nhất)</li>
                                        <li>Cửa sổ tổng hợp: 3 ngày</li>
                                        <li>Toán tử ngưỡng: {'>'} (lớn hơn)</li>
                                        <li>Giá trị ngưỡng: 38°C</li>
                                    </ul>
                                </li>
                            </ul>
                            <Paragraph>
                                → Kết quả: Nếu lượng mưa 7 ngày {'<'} 10mm <Text strong>HOẶC</Text> nhiệt độ 3 ngày {'>'} 38°C
                                → Hợp đồng mẫu sẽ kích hoạt và chi trả bảo hiểm.
                            </Paragraph>
                        </Panel>

                        {/* Nguồn dữ liệu và Chi phí */}
                        <Panel
                            header={
                                <Space>
                                    <CalculatorOutlined style={{ color: '#13c2c2' }} />
                                    <Text strong>Chi phí Nguồn dữ liệu được tính như thế nào?</Text>
                                </Space>
                            }
                            key="6"
                        >
                            <Paragraph>
                                Mỗi nguồn dữ liệu (Data Source) có <Text strong>chi phí cơ sở</Text> (Base Cost) được nhà cung cấp quy định.
                                Chi phí thực tế sẽ được nhân với các hệ số:
                            </Paragraph>

                            <Title level={5}><CalculatorOutlined /> Công thức tính chi phí</Title>
                            <Paragraph>
                                <Text code>
                                    Chi phí = Base Cost × Category Multiplier × Tier Multiplier
                                </Text>
                            </Paragraph>

                            <ul>
                                <li>
                                    <Text strong>Base Cost:</Text> Chi phí cơ sở của nguồn dữ liệu (VD: 50 ₫/tháng)
                                </li>
                                <li>
                                    <Text strong>Category Multiplier (Hệ số nhóm):</Text> Hệ số theo loại dữ liệu (VD: Weather = 1.0, Soil = 1.2).
                                    <Text type="danger"> PHẢI LỚN HƠN 0</Text>
                                </li>
                                <li>
                                    <Text strong>Tier Multiplier (Hệ số gói):</Text> Hệ số theo gói dịch vụ (VD: Basic = 1.0, Premium = 1.5).
                                    <Text type="danger"> PHẢI LỚN HƠN 0</Text>
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><BarChartOutlined /> Ví dụ cụ thể</Title>
                            <Paragraph>
                                <Text strong>Ví dụ:</Text> Chọn nguồn dữ liệu NASA Rainfall
                            </Paragraph>
                            <ul>
                                <li>Base Cost: 50 ₫/tháng</li>
                                <li>Category (Weather): 1.0</li>
                                <li>Tier (Premium): 1.5</li>
                                <li>→ Chi phí = 50 × 1.0 × 1.5 = <Text mark>75 ₫/tháng</Text></li>
                            </ul>

                            <Paragraph>
                                <Text type="secondary">
                                    Lưu ý: Chi phí ước tính hiển thị trên giao diện chỉ mang tính tham khảo, chi phí thực tế sẽ được
                                    tính khi hợp đồng mẫu được kích hoạt.
                                </Text>
                            </Paragraph>
                        </Panel>

                        {/* ✅ NEW: Blackout Periods */}
                        <Panel
                            header={
                                <Space>
                                    <AlertOutlined style={{ color: '#722ed1' }} />
                                    <Text strong>Giai đoạn Không Kích hoạt (Blackout Periods) là gì?</Text>
                                </Space>
                            }
                            key="6a"
                        >
                            <Paragraph>
                                <Text strong>Blackout Periods</Text> (tiếng Việt: Giai đoạn Không Kích hoạt) là các khoảng thời gian trong chu kỳ bảo hiểm mà hệ thống <Text strong type="danger">KHÔNG ĐƯỢC PHÉP</Text> kích hoạt chi trả, dù tất cả các điều kiện trigger đều đã thỏa mãn.
                            </Paragraph>

                            <Divider />

                            <Title level={5}><QuestionCircleOutlined /> Tại sao cần Blackout Periods?</Title>
                            <Paragraph>
                                Trong chu kỳ sinh trưởng của cây trồng, có những giai đoạn mà rủi ro chưa thực sự nghiêm trọng hoặc cây trồng có thể tự phục hồi:
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text strong>Giai đoạn gieo hạt (0-7 ngày):</Text> Cây chưa phát triển, chưa cần bảo hiểm
                                </li>
                                <li>
                                    <Text strong>Giai đoạn nảy mầm sớm (7-21 ngày):</Text> Cây có thể tự phục hồi nếu gặp điều kiện không thuận lợi nhẹ
                                </li>
                                <li>
                                    <Text strong>Giai đoạn thu hoạch (90-120 ngày):</Text> Cây đã chín, không cần bảo hiểm nữa
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><SettingOutlined /> Cách hoạt động</Title>
                            <ul>
                                <li>
                                    <Text strong>Ngày bắt đầu:</Text> Chọn ngày bắt đầu giai đoạn không kích hoạt (hiển thị: <Text code>dd/mm/yyyy</Text>, VD: 15/01/2024)
                                </li>
                                <li>
                                    <Text strong>Ngày kết thúc:</Text> Chọn ngày kết thúc giai đoạn không kích hoạt (hiển thị: <Text code>dd/mm/yyyy</Text>, VD: 10/02/2024)
                                </li>
                                <li>
                                    <Text strong>Lưu trữ backend:</Text> Hệ thống tự động chuyển sang format <Text code>MM-DD</Text> (tháng-ngày) để lưu vào database
                                </li>
                                <li>
                                    <Text strong>Hiển thị trong bảng:</Text> Format <Text code>dd/mm</Text> (VD: 15/01) để dễ đọc
                                </li>
                                <li>
                                    Có thể thêm nhiều giai đoạn khác nhau
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><BulbOutlined /> Ví dụ thực tế</Title>
                            <Paragraph>
                                <Text strong>Bảo hiểm lúa với chu kỳ 120 ngày:</Text>
                            </Paragraph>
                            <ul>
                                <li>Ngày gieo hạt: 01/01/2025</li>
                                <li>Ngày thu hoạch dự kiến: 01/05/2025</li>
                            </ul>

                            <Paragraph>
                                <Text strong>Blackout Periods được thiết lập:</Text>
                            </Paragraph>
                            <Table
                                dataSource={[
                                    {
                                        key: '1',
                                        period: 'Giai đoạn gieo hạt',
                                        start: '01/01',
                                        end: '07/01',
                                        reason: 'Cây chưa phát triển, chưa cần bảo hiểm'
                                    },
                                    {
                                        key: '2',
                                        period: 'Giai đoạn nảy mầm',
                                        start: '08/01',
                                        end: '22/01',
                                        reason: 'Cây có thể tự phục hồi'
                                    },
                                    {
                                        key: '3',
                                        period: 'Giai đoạn thu hoạch',
                                        start: '30/03',
                                        end: '01/05',
                                        reason: 'Cây đã chín, không cần bảo hiểm'
                                    }
                                ]}
                                columns={[
                                    {
                                        title: 'Giai đoạn',
                                        dataIndex: 'period',
                                        key: 'period',
                                        render: (text) => <Text strong>{text}</Text>
                                    },
                                    {
                                        title: 'Từ ngày',
                                        dataIndex: 'start',
                                        key: 'start',
                                        render: (text) => <Tag color="purple">{text}</Tag>
                                    },
                                    {
                                        title: 'Đến ngày',
                                        dataIndex: 'end',
                                        key: 'end',
                                        render: (text) => <Tag color="purple">{text}</Tag>
                                    },
                                    {
                                        title: 'Lý do',
                                        dataIndex: 'reason',
                                        key: 'reason',
                                        render: (text) => <Text type="secondary">{text}</Text>
                                    }
                                ]}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}><CheckCircleOutlined /> Các ràng buộc quan trọng</Title>
                            <ul>
                                <li>
                                    <Text strong>Ngày bắt đầu {'<'} Ngày kết thúc:</Text> Ngày bắt đầu phải nhỏ hơn ngày kết thúc (hệ thống tự động disable)
                                </li>
                                <li>
                                    <Text strong>Nằm trong vùng hiệu lực:</Text> Các giai đoạn phải nằm trong khoảng ngày bắt đầu và kết thúc hiệu lực bảo hiểm (hệ thống tự động disable ngày ngoài phạm vi)
                                </li>
                                <li>
                                    <Text strong type="danger">Không trùng lặp:</Text> Các giai đoạn không được trùng hoặc giao nhau - <Text mark>Hệ thống tự động disable các ngày đã nằm trong blackout periods khác</Text>
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><ThunderboltOutlined /> Kịch bản xử lý</Title>
                            <Paragraph>
                                <Text strong>Ngày 05/01/2025 (Trong giai đoạn gieo hạt):</Text>
                            </Paragraph>
                            <ul>
                                <li>✅ Lượng mưa {'<'} 50mm (Điều kiện trigger thỏa mãn)</li>
                                <li>❌ Ngày nằm trong blackout period (01/01 đến 07/01)</li>
                                <li>→ <Text strong type="danger">KẾT QUẢ: Không kích hoạt chi trả</Text> (Blackout có độ ưu tiên cao hơn)</li>
                            </ul>

                            <Paragraph>
                                <Text strong>Ngày 15/02/2025 (Giai đoạn sinh trưởng chính):</Text>
                            </Paragraph>
                            <ul>
                                <li>✅ Lượng mưa {'<'} 50mm (Điều kiện trigger thỏa mãn)</li>
                                <li>✅ Ngày KHÔNG nằm trong blackout period</li>
                                <li>→ <Text strong type="success">KẾT QUẢ: Kích hoạt chi trả</Text></li>
                            </ul>
                        </Panel>

                        {/* ✅ NEW: Baseline Fields */}
                        <Panel
                            header={
                                <Space>
                                    <LineChartOutlined style={{ color: '#13c2c2' }} />
                                    <Text strong>Chu kỳ Tham chiếu và Hàm tính Tham chiếu (Baseline) là gì?</Text>
                                </Space>
                            }
                            key="6b"
                        >
                            <Paragraph>
                                <Text strong>Baseline Fields</Text> (tiếng Việt: Trường Tham chiếu) được sử dụng khi bạn muốn so sánh <Text strong>thay đổi</Text> của dữ liệu hiện tại với dữ liệu lịch sử (quá khứ), thay vì chỉ so sánh với một giá trị ngưỡng cố định.
                            </Paragraph>

                            <Divider />

                            <Title level={5}><QuestionCircleOutlined /> Khi nào cần Baseline?</Title>
                            <Paragraph>
                                Baseline <Text strong type="danger">CHỈ BẮT BUỘC</Text> khi bạn chọn toán tử ngưỡng là:
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text code>change_gt</Text> (Thay đổi lớn hơn): So sánh mức thay đổi có lớn hơn ngưỡng không
                                </li>
                                <li>
                                    <Text code>change_lt</Text> (Thay đổi nhỏ hơn): So sánh mức thay đổi có nhỏ hơn ngưỡng không
                                </li>
                            </ul>
                            <Paragraph>
                                Với các toán tử khác (<Text code>{'<'}</Text>, <Text code>{'>'}</Text>, <Text code>{'<='}</Text>, <Text code>{'>='}</Text>), baseline sẽ <Text strong>BỊ ẨN ĐI</Text> và tự động set về <Text code>null</Text>.
                            </Paragraph>

                            <Divider />

                            <Title level={5}><SettingOutlined /> Các trường Baseline</Title>
                            <Table
                                dataSource={[
                                    {
                                        key: '1',
                                        field: 'Chu kỳ tham chiếu',
                                        englishTerm: 'baseline_window_days',
                                        description: 'Số ngày dữ liệu lịch sử dùng để tính giá trị tham chiếu (baseline)',
                                        example: '365 ngày = lấy dữ liệu 1 năm trước',
                                        required: 'Có (nếu dùng change_gt/change_lt)'
                                    },
                                    {
                                        key: '2',
                                        field: 'Hàm tính tham chiếu',
                                        englishTerm: 'baseline_function',
                                        description: 'Phương pháp tính toán giá trị baseline từ dữ liệu lịch sử',
                                        example: 'avg, sum, min, max',
                                        required: 'Có (nếu dùng change_gt/change_lt)'
                                    }
                                ]}
                                columns={[
                                    {
                                        title: 'Tên trường',
                                        dataIndex: 'field',
                                        key: 'field',
                                        render: (text) => <Text strong>{text}</Text>
                                    },
                                    {
                                        title: 'Thuật ngữ Anh',
                                        dataIndex: 'englishTerm',
                                        key: 'englishTerm',
                                        render: (text) => <Tag color="cyan">{text}</Tag>
                                    },
                                    {
                                        title: 'Giải thích',
                                        dataIndex: 'description',
                                        key: 'description'
                                    },
                                    {
                                        title: 'Ví dụ',
                                        dataIndex: 'example',
                                        key: 'example',
                                        render: (text) => <Text type="secondary">{text}</Text>
                                    },
                                    {
                                        title: 'Bắt buộc',
                                        dataIndex: 'required',
                                        key: 'required',
                                        render: (text) => <Tag color="red">{text}</Tag>
                                    }
                                ]}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}><BulbOutlined /> Ví dụ thực tế với change_gt</Title>
                            <Paragraph>
                                <Text strong>Điều kiện:</Text> Kích hoạt chi trả khi NDVI (chỉ số thực vật) <Text strong>giảm mạnh</Text> so với mức bình thường
                            </Paragraph>
                            <ul>
                                <li>Toán tử ngưỡng: <Tag color="orange">change_lt</Tag> (Thay đổi nhỏ hơn)</li>
                                <li>Giá trị ngưỡng: <Text code>-0.4</Text> (giảm 0.4 điểm)</li>
                                <li>Chu kỳ tham chiếu: <Text code>365 ngày</Text> (1 năm)</li>
                                <li>Hàm tính tham chiếu: <Text code>avg</Text> (trung bình)</li>
                                <li>Chu kỳ tổng hợp: <Text code>7 ngày</Text></li>
                            </ul>

                            <Paragraph>
                                <Text strong>Cách hệ thống tính toán:</Text>
                            </Paragraph>
                            <ol>
                                <li>
                                    <Text strong>Tính baseline:</Text> Lấy dữ liệu NDVI của 365 ngày trước → Tính trung bình (avg) → Baseline = 0.6
                                </li>
                                <li>
                                    <Text strong>Tính giá trị hiện tại:</Text> Lấy dữ liệu NDVI của 7 ngày gần nhất → Tính trung bình → Current = 0.3
                                </li>
                                <li>
                                    <Text strong>Tính thay đổi:</Text> Change = Current - Baseline = 0.3 - 0.6 = -0.3
                                </li>
                                <li>
                                    <Text strong>So sánh với ngưỡng:</Text> -0.3 {'<'} -0.4? → KHÔNG (vì -0.3 lớn hơn -0.4)
                                </li>
                                <li>
                                    <Text strong>Kết quả:</Text> Không kích hoạt (giảm chưa đủ mạnh)
                                </li>
                            </ol>

                            <Paragraph>
                                <Text strong>Nếu Current = 0.15:</Text>
                            </Paragraph>
                            <ol>
                                <li>Change = 0.15 - 0.6 = -0.45</li>
                                <li>-0.45 {'<'} -0.4? → CÓ (vì -0.45 nhỏ hơn -0.4)</li>
                                <li><Text strong type="success">→ Kích hoạt chi trả!</Text> (giảm quá mạnh, cây có vấn đề)</li>
                            </ol>

                            <Divider />

                            <Title level={5}><CheckCircleOutlined /> Tương tác với các trường khác</Title>
                            <ul>
                                <li>
                                    <Text strong>Với toán tử {'<'}, {'>'}, {'<='}, {'>='}: </Text>
                                    Baseline fields sẽ <Text strong>tự động ẩn</Text> và set về <Text code>null</Text>. Không cần nhập.
                                </li>
                                <li>
                                    <Text strong>Với toán tử change_gt, change_lt:</Text>
                                    Baseline fields sẽ <Text strong>hiện ra</Text> và <Text strong type="danger">BẮT BUỘC</Text> phải nhập cả 2 trường (baseline_window_days và baseline_function).
                                </li>
                                <li>
                                    <Text strong>Khi đổi toán tử:</Text> Hệ thống tự động xóa giá trị baseline nếu chuyển từ change_gt/change_lt sang toán tử khác.
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><WarningOutlined /> Lưu ý quan trọng</Title>
                            <ul>
                                <li>
                                    Baseline chỉ ảnh hưởng đến <Text strong>toán tử change</Text> (change_gt, change_lt), không ảnh hưởng đến các toán tử khác
                                </li>
                                <li>
                                    Chu kỳ tham chiếu (baseline_window_days) phải {'>'} chu kỳ tổng hợp (aggregation_window_days) để có đủ dữ liệu lịch sử
                                </li>
                                <li>
                                    Hàm tính tham chiếu (baseline_function) nên phù hợp với loại dữ liệu:
                                    <ul>
                                        <li><Text code>avg</Text>: Phù hợp với nhiệt độ, NDVI, độ ẩm</li>
                                        <li><Text code>sum</Text>: Phù hợp với lượng mưa, bức xạ tích lũy</li>
                                        <li><Text code>max/min</Text>: Phù hợp khi quan tâm giá trị cực trị</li>
                                    </ul>
                                </li>
                            </ul>
                        </Panel>

                        {/* ✅ NEW: Data Quality */}
                        <Panel
                            header={
                                <Space>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    <Text strong>Chất lượng Dữ liệu (Data Quality) là gì?</Text>
                                </Space>
                            }
                            key="6c"
                        >
                            <Paragraph>
                                <Text strong>Data Quality</Text> (tiếng Việt: Chất lượng Dữ liệu) đánh giá mức độ tin cậy, chính xác và hoàn chỉnh của nguồn dữ liệu được sử dụng trong điều kiện trigger. Đây là thông tin quan trọng giúp hệ thống và người dùng hiểu rõ độ tin cậy của dữ liệu khi ra quyết định chi trả.
                            </Paragraph>

                            <Divider />

                            <Title level={5}><SettingOutlined /> Các mức chất lượng</Title>
                            <Table
                                dataSource={[
                                    {
                                        key: '1',
                                        value: 'good',
                                        label: 'Tốt (Good)',
                                        description: 'Dữ liệu chất lượng cao, độ chính xác trên 90%, ít nhiễu, cập nhật đầy đủ',
                                        example: 'Dữ liệu từ trạm khí tượng chính thức, vệ tinh độ phân giải cao',
                                        color: 'green'
                                    },
                                    {
                                        key: '2',
                                        value: 'acceptable',
                                        label: 'Chấp nhận được (Acceptable)',
                                        description: 'Dữ liệu đủ dùng, độ chính xác 70-90%, có thể thiếu một số điểm dữ liệu',
                                        example: 'Dữ liệu từ nguồn thứ cấp, vệ tinh độ phân giải trung bình',
                                        color: 'orange'
                                    },
                                    {
                                        key: '3',
                                        value: 'poor',
                                        label: 'Kém (Poor)',
                                        description: 'Dữ liệu chất lượng thấp, độ chính xác dưới 70%, nhiều lỗ hổng hoặc nhiễu',
                                        example: 'Dữ liệu từ nguồn không chính thức, cảm biến lỗi thời',
                                        color: 'red'
                                    }
                                ]}
                                columns={[
                                    {
                                        title: 'Giá trị',
                                        dataIndex: 'value',
                                        key: 'value',
                                        width: '12%',
                                        render: (text) => <Tag color="blue">{text}</Tag>
                                    },
                                    {
                                        title: 'Nhãn',
                                        dataIndex: 'label',
                                        key: 'label',
                                        width: '18%',
                                        render: (text, record) => <Tag color={record.color}>{text}</Tag>
                                    },
                                    {
                                        title: 'Mô tả',
                                        dataIndex: 'description',
                                        key: 'description',
                                        width: '35%'
                                    },
                                    {
                                        title: 'Ví dụ',
                                        dataIndex: 'example',
                                        key: 'example',
                                        width: '35%',
                                        render: (text) => <Text type="secondary">{text}</Text>
                                    }
                                ]}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}><QuestionCircleOutlined /> Tại sao cần Data Quality?</Title>
                            <ul>
                                <li>
                                    <Text strong>Đánh giá độ tin cậy:</Text> Giúp người dùng và hệ thống biết nguồn dữ liệu có đáng tin cậy không
                                </li>
                                <li>
                                    <Text strong>Quản lý rủi ro:</Text> Dữ liệu kém chất lượng có thể dẫn đến quyết định chi trả sai
                                </li>
                                <li>
                                    <Text strong>Điều chỉnh hệ số:</Text> Backend có thể điều chỉnh tính toán dựa trên chất lượng dữ liệu
                                </li>
                                <li>
                                    <Text strong>Minh bạch:</Text> Người mua bảo hiểm hiểu rõ nguồn gốc và chất lượng dữ liệu giám sát
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><BulbOutlined /> Cách sử dụng</Title>
                            <Paragraph>
                                Khi thêm điều kiện trigger, chọn Data Quality phù hợp với nguồn dữ liệu:
                            </Paragraph>
                            <ul>
                                <li>
                                    <Tag color="green">good</Tag> - Nếu dùng dữ liệu từ NASA, ESA, hoặc trạm khí tượng chính thức
                                </li>
                                <li>
                                    <Tag color="orange">acceptable</Tag> - Nếu dùng dữ liệu từ nguồn thương mại, có một số giới hạn
                                </li>
                                <li>
                                    <Tag color="red">poor</Tag> - Nếu dùng dữ liệu thử nghiệm, không chính thức (không khuyến khích cho production)
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><WarningOutlined /> Lưu ý</Title>
                            <ul>
                                <li>Mặc định, Data Quality được set là <Tag color="green">good</Tag> nếu không chọn</li>
                                <li>Nên chọn chất lượng phù hợp với thực tế để tránh tranh chấp sau này</li>
                                <li>Hợp đồng mẫu với nhiều điều kiện <Tag color="red">poor</Tag> có thể bị từ chối phê duyệt</li>
                                <li>Data Quality hiển thị trong bảng điều kiện để dễ theo dõi</li>
                            </ul>
                        </Panel>

                        {/* Lưu ý quan trọng */}
                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#f5222d' }} />
                                    <Text strong>Những lưu ý quan trọng khi tạo hợp đồng mẫu?</Text>
                                </Space>
                            }
                            key="7"
                        >
                            <Paragraph>
                                <Text strong type="danger"><WarningOutlined /> Các quy tắc bắt buộc:</Text>
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text strong>Tỷ lệ phí cơ bản (Premium Base Rate):</Text> PHẢI {'>'} 0 nếu không có phí cố định.
                                    Vì nếu = 0 thì nhân với giá trị nào cũng = 0, không hợp lý về nghiệp vụ.
                                </li>
                                <li>
                                    <Text strong>Tỷ lệ chi trả cơ bản (Payout Base Rate):</Text> PHẢI {'>'} 0.
                                    Tương tự, nếu = 0 thì không có chi trả.
                                </li>
                                <li>
                                    <Text strong>Hệ số vượt ngưỡng (Over Threshold Multiplier):</Text> PHẢI {'>'} 0 nếu được nhập.
                                    Giá trị {'<'}= 0 sẽ làm số tiền chi trả không hợp lệ.
                                </li>
                                <li>
                                    <Text strong>Hệ số nhóm và Hệ số gói (Category/Tier Multiplier):</Text> PHẢI {'>'} 0.
                                    Đây là các hệ số nhân nên phải dương.
                                </li>
                                <li>
                                    <Text strong>Nguồn dữ liệu:</Text> Mỗi nguồn chỉ được chọn 1 lần trong cùng một hợp đồng mẫu.
                                    Hệ thống sẽ tự động loại bỏ các nguồn đã chọn khỏi danh sách.
                                </li>
                            </ul>

                            <Divider />

                            <Paragraph>
                                <Text strong><CalendarOutlined /> Thời gian:</Text>
                            </Paragraph>
                            <ul>
                                <li>Ngày kết thúc đăng ký phải trước hoặc bằng ngày bắt đầu hiệu lực bảo hiểm</li>
                                <li>Ngày bắt đầu hiệu lực phải trước ngày kết thúc hiệu lực</li>
                                <li>Tất cả các ngày phải là ngày trong tương lai (không được chọn ngày quá khứ)</li>
                            </ul>

                            <Divider />

                            <Paragraph>
                                <Text strong><BulbOutlined /> Khuyến nghị:</Text>
                            </Paragraph>
                            <ul>
                                <li>Nên nhập đầy đủ mô tả sản phẩm để người dùng dễ hiểu</li>
                                <li>Kiểm tra kỹ các công thức tính toán trước khi tạo hợp đồng mẫu</li>
                                <li>Kiểm tra hợp đồng mẫu với nhiều kịch bản khác nhau để đảm bảo hoạt động đúng</li>
                                <li>Sử dụng mã sản phẩm dễ nhớ và có ý nghĩa (VD: RICE_WINTER_2025)</li>
                            </ul>
                        </Panel>

                        {/* Tab PDF & Tags - Hướng dẫn chi tiết */}
                        <Panel
                            header={
                                <Space>
                                    <FileTextOutlined style={{ color: '#fa8c16' }} />
                                    <Text strong>Hướng dẫn xử lý Tài liệu và Trường thông tin</Text>
                                </Space>
                            }
                            key="8"
                        >
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <div>
                                    <Title level={5}><FileTextOutlined /> 1. Tải lên file PDF mẫu hợp đồng</Title>
                                    <Paragraph>
                                        <Text strong>Mục đích:</Text> Tải lên (Upload) file PDF mẫu hợp đồng bảo hiểm để hệ thống tự động phát hiện các vị trí cần điền thông tin.
                                    </Paragraph>
                                    <ul>
                                        <li><strong>Định dạng:</strong> Chỉ chấp nhận file PDF</li>
                                        <li><strong>Kích thước tối đa:</strong> 10 MB</li>
                                        <li><strong>Phát hiện tự động:</strong> Hệ thống sẽ tìm các vị trí cần điền (Placeholder) dạng (1), (2), (3)...</li>
                                        <li><strong>Thêm vị trí thủ công:</strong> Có thể kéo thả trên PDF để chọn vùng và tạo vị trí mới</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><EnvironmentOutlined /> 2. Vị trí cần điền (Placeholder)</Title>
                                    <Paragraph>
                                        <Text strong>Khái niệm:</Text> Vị trí cần điền (Placeholder) là các vùng trên PDF sẽ được điền thông tin khi tạo hợp đồng.
                                    </Paragraph>
                                    <Table
                                        dataSource={[
                                            {
                                                key: '1',
                                                field: 'Vị trí cần điền',
                                                englishTerm: 'Placeholder',
                                                description: 'Vùng trên PDF sẽ được điền thông tin (VD: họ tên, CMND)',
                                                example: '(1), (2), (3)...'
                                            },
                                            {
                                                key: '2',
                                                field: 'Tự động phát hiện',
                                                englishTerm: 'Auto-detection',
                                                description: 'Hệ thống tự động tìm vị trí có số trong ngoặc đơn',
                                                example: 'Tìm (1), (2) trong PDF'
                                            },
                                            {
                                                key: '3',
                                                field: 'Đặt thủ công',
                                                englishTerm: 'Manual Placement',
                                                description: 'Kéo thả trên PDF để chọn vùng và nhập số vị trí',
                                                example: 'Kéo chọn vùng → Nhập (4)'
                                            },
                                        ]}
                                        columns={[
                                            { title: 'Tên trường', dataIndex: 'field', key: 'field', width: '25%', render: (text) => <Text strong>{text}</Text> },
                                            { title: 'Thuật ngữ Anh', dataIndex: 'englishTerm', key: 'englishTerm', width: '20%', render: (text) => <Tag color="orange">{text}</Tag> },
                                            { title: 'Giải thích', dataIndex: 'description', key: 'description', width: '35%' },
                                            { title: 'Ví dụ', dataIndex: 'example', key: 'example', width: '20%', render: (text) => <Text code>{text}</Text> },
                                        ]}
                                        pagination={false}
                                        size="small"
                                        bordered
                                    />
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><TagOutlined /> 3. Trường thông tin (Tags)</Title>
                                    <Paragraph>
                                        <Text strong>Khái niệm:</Text> Trường thông tin (Tag) là các trường dữ liệu cần thiết cho hợp đồng (họ tên, CMND, địa chỉ...).
                                    </Paragraph>
                                    <Table
                                        dataSource={[
                                            {
                                                key: '1',
                                                field: 'Tên trường',
                                                englishTerm: 'key',
                                                description: 'Tên định danh của trường, chỉ chứa chữ thường và dấu gạch dưới',
                                                example: 'họ và tên, số điện thoại',
                                                required: 'Có'
                                            },
                                            {
                                                key: '2',
                                                field: 'Loại dữ liệu',
                                                englishTerm: 'dataType',
                                                description: 'Kiểu dữ liệu của trường để hệ thống validate đúng',
                                                example: 'string, integer, date, textarea',
                                                required: 'Có'
                                            },
                                            {
                                                key: '3',
                                                field: 'Giá trị mặc định',
                                                englishTerm: 'value',
                                                description: 'Giá trị mẫu hoặc mặc định (có thể để trống)',
                                                example: 'Nguyễn Văn A, 01/01/1990',
                                                required: 'Không'
                                            },
                                        ]}
                                        columns={basicFieldsColumns}
                                        pagination={false}
                                        size="small"
                                        bordered
                                    />
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><LinkOutlined /> 4. Liên kết vị trí với trường thông tin (Mapping)</Title>
                                    <Paragraph>
                                        <Text strong>Quy trình:</Text> Liên kết (Mapping) mỗi vị trí cần điền với một trường thông tin để hệ thống biết điền dữ liệu gì vào đâu.
                                    </Paragraph>
                                    <ol style={{ lineHeight: '2' }}>
                                        <li><strong>Bước 1 - Nhập thông tin:</strong> Điền <Text code>key</Text> (tên trường) và chọn <Text code>dataType</Text> (loại dữ liệu) cho mỗi vị trí</li>
                                        <li><strong>Bước 2 - Chọn vị trí:</strong> Tick chọn các vị trí muốn áp dụng (có thể chọn nhiều cùng lúc)</li>
                                        <li><strong>Bước 3 - Áp dụng:</strong> Bấm nút <Tag color="blue">Áp dụng</Tag> để tạo PDF có thể điền (Fillable PDF)</li>
                                        <li><strong>Bước 4 - Xem trước:</strong> Bấm <Tag color="green">Tải xuống PDF</Tag> để xem kết quả cuối cùng</li>
                                    </ol>
                                    <Paragraph type="warning">
                                        <InfoCircleOutlined /> <strong>Lưu ý:</strong> Checkbox chỉ mở khi đã điền đủ key + dataType cho vị trí đó.
                                    </Paragraph>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><EditOutlined /> 5. PDF có thể điền (Fillable PDF)</Title>
                                    <Paragraph>
                                        <Text strong>Khái niệm:</Text> PDF có thể điền (Fillable PDF) là file PDF có các ô nhập liệu (Form Fields) mà hệ thống backend có thể tự động điền thông tin vào.
                                    </Paragraph>
                                    <ul>
                                        <li><strong>Ô nhập liệu (AcroForm Fields):</strong> Các ô input được tạo trên PDF tại vị trí đã chọn</li>
                                        <li><strong>Có thể chỉnh sửa (Editable):</strong> Backend có thể điền dữ liệu vào các ô này</li>
                                        <li><strong>Viền hiển thị (Borders):</strong> Hiển thị viền để dễ nhận biết vị trí ô nhập</li>
                                        <li><strong>Xóa text gốc:</strong> Text placeholder ban đầu (như (1), (2)) sẽ bị xóa đi</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><BarChartOutlined /> 6. Các loại dữ liệu (Data Types)</Title>
                                    <Table
                                        dataSource={[
                                            { key: '1', field: 'Chuỗi/Text', englishTerm: 'string', example: 'Nguyễn Văn A, TP.HCM', validation: 'Không giới hạn' },
                                            { key: '2', field: 'Văn bản dài', englishTerm: 'textarea', example: 'Địa chỉ chi tiết...', validation: 'Nhiều dòng' },
                                            { key: '3', field: 'Số nguyên', englishTerm: 'integer', example: '25, 100, 1990', validation: 'Chỉ số nguyên' },
                                            { key: '4', field: 'Số thực', englishTerm: 'float', example: '3.14, 99.9', validation: 'Số có dấu phẩy' },
                                            { key: '5', field: 'Ngày tháng', englishTerm: 'date', example: '01/01/2025', validation: 'Định dạng ngày' },
                                            { key: '6', field: 'Ngày giờ', englishTerm: 'datetime', example: '01/01/2025 14:30', validation: 'Ngày + giờ' },
                                            { key: '7', field: 'Giờ phút', englishTerm: 'time', example: '14:30', validation: 'Chỉ giờ' },
                                        ]}
                                        columns={[
                                            { title: 'Loại dữ liệu', dataIndex: 'field', key: 'field', width: '20%', render: (text) => <Text strong>{text}</Text> },
                                            { title: 'Thuật ngữ Anh', dataIndex: 'englishTerm', key: 'englishTerm', width: '15%', render: (text) => <Tag color="purple">{text}</Tag> },
                                            { title: 'Ví dụ', dataIndex: 'example', key: 'example', width: '30%' },
                                            { title: 'Quy tắc', dataIndex: 'validation', key: 'validation', width: '35%', render: (text) => <Text type="secondary">{text}</Text> },
                                        ]}
                                        pagination={false}
                                        size="small"
                                        bordered
                                    />
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><BulbOutlined /> 7. Lời khuyên khi sử dụng</Title>
                                    <ul style={{ lineHeight: '2' }}>
                                        <li>✅ Đặt tên trường ngắn gọn, dễ hiểu: <Text code>họ và tên</Text> thay vì <Text code>hvt</Text></li>
                                        <li>✅ Chọn loại dữ liệu (Data Type) chính xác để hệ thống kiểm tra đúng</li>
                                        <li>✅ Xem trước PDF trước khi hoàn tất</li>
                                        <li>✅ Xóa các vị trí không cần thiết để giảm dung lượng PDF</li>
                                        <li>❌ Tránh đặt tên trường có dấu tiếng Việt hoặc ký tự đặc biệt</li>
                                        <li>❌ Không liên kết nhiều vị trí vào cùng một trường thông tin</li>
                                        <li>❌ Không để trùng số vị trí (1), (2)...</li>
                                    </ul>
                                </div>
                            </Space>
                        </Panel>

                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#2f54eb' }} />
                                    <Text strong>Bảng thuật ngữ tiếng Anh - tiếng Việt</Text>
                                </Space>
                            }
                            key="9"
                        >
                            <Table
                                dataSource={[
                                    { key: '1', english: 'Policy', vietnamese: 'Chính sách bảo hiểm', category: 'Tổng quan' },
                                    { key: '2', english: 'Premium', vietnamese: 'Phí bảo hiểm', category: 'Phí' },
                                    { key: '3', english: 'Payout', vietnamese: 'Chi trả bảo hiểm', category: 'Chi trả' },
                                    { key: '4', english: 'Trigger', vietnamese: 'Điều kiện kích hoạt', category: 'Trigger' },
                                    { key: '5', english: 'Condition', vietnamese: 'Điều kiện giám sát', category: 'Trigger' },
                                    { key: '6', english: 'Data Source', vietnamese: 'Nguồn dữ liệu', category: 'Dữ liệu' },
                                    { key: '7', english: 'Base Cost', vietnamese: 'Chi phí cơ sở', category: 'Chi phí' },
                                    { key: '8', english: 'Multiplier', vietnamese: 'Hệ số nhân', category: 'Chi phí' },
                                    { key: '9', english: 'Threshold', vietnamese: 'Ngưỡng', category: 'Trigger' },
                                    { key: '10', english: 'Aggregation', vietnamese: 'Tổng hợp', category: 'Trigger' },
                                    { key: '11', english: 'Coverage Duration', vietnamese: 'Thời hạn bảo hiểm', category: 'Thời gian' },
                                    { key: '12', english: 'Enrollment Period', vietnamese: 'Thời gian đăng ký', category: 'Thời gian' },
                                    { key: '13', english: 'Crop Type', vietnamese: 'Loại cây trồng', category: 'Sản phẩm' },
                                    { key: '14', english: 'Monitor Interval', vietnamese: 'Tần suất giám sát', category: 'Trigger' },
                                    { key: '15', english: 'Logical Operator', vietnamese: 'Toán tử logic (AND/OR)', category: 'Trigger' },
                                ]}
                                columns={[
                                    {
                                        title: 'Thuật ngữ Anh',
                                        dataIndex: 'english',
                                        key: 'english',
                                        width: '30%',
                                        render: (text) => <Tag color="blue">{text}</Tag>
                                    },
                                    {
                                        title: 'Tiếng Việt',
                                        dataIndex: 'vietnamese',
                                        key: 'vietnamese',
                                        width: '40%',
                                        render: (text) => <Text strong>{text}</Text>
                                    },
                                    {
                                        title: 'Phân loại',
                                        dataIndex: 'category',
                                        key: 'category',
                                        width: '30%',
                                        render: (text) => <Tag>{text}</Tag>
                                    },
                                ]}
                                pagination={false}
                                size="small"
                                bordered
                            />
                        </Panel>
                    </Collapse>
                </Space>
            </Card>
        </div>
    );
};

export default FAQTab;
