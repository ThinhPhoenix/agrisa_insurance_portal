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
import useDictionary from '@/services/hooks/common/use-dictionary';

const FAQTab = () => {
    const dict = useDictionary();
    // Bảng giải thích các trường cơ bản
    const basicFieldsData = [
        {
            key: '1',
            field: dict.getFieldLabel('BasePolicy', 'product_name') || 'Tên sản phẩm',
            englishTerm: 'Product Name',
            description: 'Tên hiển thị để người mua nhận diện gói bảo hiểm.',
            example: dict.getFieldNote('BasePolicy', 'product_name') || 'Bảo hiểm lúa mùa đông 2025',
            required: 'Bắt buộc'
        },
        {
            key: '2',
            field: dict.getFieldLabel('BasePolicy', 'product_code') || 'Mã sản phẩm',
            englishTerm: 'Product Code',
            description: 'Mã ngắn gọn, chỉ gồm chữ, số và dấu gạch dưới.',
            example: 'RICE_WINTER_2025',
            required: 'Bắt buộc'
        },
        {
            key: '3',
            field: dict.getFieldLabel('BasePolicy', 'crop_type') || 'Loại cây trồng',
            englishTerm: 'Crop Type',
            description: 'Loại cây trồng áp dụng cho gói bảo hiểm.',
            example: 'Lúa, Ngô, Cà phê',
            required: 'Bắt buộc'
        },
        {
            key: '4',
            field: dict.getFieldLabel('BasePolicy', 'coverage_duration_days') || 'Thời hạn bảo hiểm',
            englishTerm: 'Coverage Duration',
            description: 'Số ngày hợp đồng có hiệu lực (ví dụ: 120 ngày).',
            example: '120 ngày',
            required: 'Bắt buộc'
        },
    ];

    const premiumFieldsData = [
        {
            key: '1',
            field: dict.getFieldLabel('BasePolicy', 'fix_premium_amount') || 'Phí bảo hiểm cố định',
            englishTerm: 'Fixed Premium Amount',
            description: 'Số tiền cố định người mua phải trả (nếu sử dụng).',
            example: '1,000,000 ₫',
            required: 'Tùy chọn'
        },
        {
            key: '2',
            field: dict.getFieldLabel('BasePolicy', 'premium_base_rate') || 'Tỷ lệ phí cơ bản',
            englishTerm: 'Premium Base Rate',
            description: 'Tỷ lệ dùng để tính phí theo diện tích hoặc giá trị.',
            example: '0.05 = 5%',
            required: 'Tùy chọn'
        },
        {
            key: '3',
            field: dict.getFieldLabel('BasePolicy', 'cancel_premium_rate') || 'Tỷ lệ hoàn phí khi hủy',
            englishTerm: 'Cancel Premium Rate',
            description: 'Tỷ lệ phí được hoàn lại khi hợp đồng bị hủy.',
            example: '0.8 = hoàn 80%',
            required: 'Không'
        },
    ];

    const payoutFieldsData = [
        {
            key: '1',
            field: dict.getFieldLabel('BasePolicy', 'fix_payout_amount') || 'Số tiền chi trả cố định',
            englishTerm: 'Fixed Payout Amount',
            description: 'Số tiền cố định trả khi sự kiện bảo hiểm xảy ra.',
            example: '5,000,000 ₫',
            required: 'Tùy chọn'
        },
        {
            key: '2',
            field: dict.getFieldLabel('BasePolicy', 'payout_base_rate') || 'Tỷ lệ chi trả cơ bản',
            englishTerm: 'Payout Base Rate',
            description: 'Phần trăm thiệt hại được chi trả (ví dụ: 0.75 = 75%).',
            example: '0.75',
            required: 'Bắt buộc'
        },
        {
            key: '3',
            field: dict.getFieldLabel('BasePolicy', 'payout_cap') || 'Trần chi trả',
            englishTerm: 'Payout Cap',
            description: 'Giới hạn tối đa số tiền được chi trả cho hợp đồng.',
            example: '10,000,000 ₫',
            required: 'Không'
        },
        {
            key: '4',
            field: dict.getFieldLabel('BasePolicy', 'over_threshold_multiplier') || 'Hệ số vượt ngưỡng',
            englishTerm: 'Over Threshold Multiplier',
            description: 'Hệ số nhân thêm khi mức vượt ngưỡng rất lớn.',
            example: '1.5 = tăng 50% chi trả',
            required: 'Không'
        },
    ];

    const triggerFieldsData = [
        {
            key: '1',
            field: dict.getFieldLabel('BasePolicyTrigger', 'logical_operator') || 'Toán tử logic',
            englishTerm: 'Logical Operator',
            description: 'Cách kết hợp nhiều điều kiện (AND = tất cả, OR = bất kỳ).',
            options: 'AND / OR',
            required: 'Bắt buộc'
        },
        {
            key: '2',
            field: dict.getFieldLabel('BasePolicyTrigger', 'monitor_interval') || 'Tần suất giám sát',
            englishTerm: 'Monitor Interval',
            description: 'Tần suất kiểm tra dữ liệu (kèm đơn vị: giờ/ngày/tuần).',
            example: '1 ngày',
            required: 'Bắt buộc'
        },
        {
            key: '3',
            field: dict.getFieldLabel('BasePolicyTriggerCondition', 'data_source_id') || 'Nguồn dữ liệu',
            englishTerm: 'Data Source',
            description: 'Nguồn dữ liệu theo dõi (ví dụ: lượng mưa, cảm biến). Mỗi nguồn chọn tối đa 1 lần.',
            example: 'Rainfall',
            required: 'Ít nhất 1'
        },
    ];

    const conditionFieldsData = [
        {
            key: '1',
            field: dict.getFieldLabel('BasePolicyTriggerCondition', 'threshold_operator') || 'Toán tử ngưỡng',
            englishTerm: 'Threshold Operator',
            description: 'Phép so sánh dùng để so với ngưỡng (>, <, >=, <=, ==, !=).',
            options: '<, >, <=, >=, ==, !=',
            required: 'Bắt buộc'
        },
        {
            key: '2',
            field: dict.getFieldLabel('BasePolicyTriggerCondition', 'threshold_value') || 'Giá trị ngưỡng',
            englishTerm: 'Threshold Value',
            description: 'Giá trị tham chiếu để so sánh (ví dụ: mm mưa hoặc °C).',
            example: '50 (mm mưa)',
            required: 'Bắt buộc'
        },
        {
            key: '3',
            field: dict.getFieldLabel('BasePolicyTriggerCondition', 'aggregation_function') || 'Hàm tổng hợp',
            englishTerm: 'Aggregation Function',
            description: 'Cách tính trên khoảng dữ liệu (avg, sum, min, max).',
            options: 'avg, sum, min, max, change',
            required: 'Bắt buộc'
        },
        {
            key: '4',
            field: dict.getFieldLabel('BasePolicyTriggerCondition', 'aggregation_window_days') || 'Cửa sổ tổng hợp',
            englishTerm: 'Aggregation Window',
            description: 'Số ngày dùng để tính hàm tổng hợp (ví dụ: 7 ngày).',
            example: '7 ngày',
            required: 'Bắt buộc'
        },
        {
            key: '5',
            field: dict.ui?.dataQuality || 'Chất lượng dữ liệu',
            englishTerm: 'Data Quality',
            description: 'Đánh giá độ tin cậy của nguồn dữ liệu (good/acceptable/poor).',
            options: 'good, acceptable, poor',
            required: 'Tùy chọn'
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
                                    <Text strong>Gói bảo hiểm là gì?</Text>
                                </Space>
                            }
                            key="1"
                        >
                            <Paragraph>
                                <Text strong>Gói bảo hiểm</Text>là một bản hợp đồng điện tử
                                quy định các điều khoản bảo hiểm cho cây trồng. Mỗi gói bảo hiểm bao gồm:
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
                                    <Text strong>Quy trình tạo gói bảo hiểm bao gồm những bước nào?</Text>
                                </Space>
                            }
                            key="2"
                        >
                            <Paragraph>
                                Quy trình tạo gói bảo hiểm được chia thành <Text strong>4 bước chính</Text>:
                            </Paragraph>
                            <ol>
                                <li>
                                    <Text strong>Thông tin cơ bản:</Text> Nhập tên, mã sản phẩm, loại cây trồng, cấu hình phí và chi trả
                                </li>
                                <li>
                                    <Text strong>Cấu hình nâng cao:</Text> Thiết lập điều kiện kích hoạt (trigger) và các điều kiện giám sát
                                </li>
                                <li>
                                    <Text strong>Hợp đồng và thẻ tài liệu:</Text> Upload mẫu hợp đồng PDF và thêm các thẻ tài liệu
                                </li>
                                <li>
                                    <Text strong>Xem lại & Tạo:</Text> Kiểm tra toàn bộ thông tin và gửi tạo gói bảo hiểm
                                </li>
                            </ol>
                        </Panel>

                        {/* Giải thích các thẻ tài liệu cơ bản */}
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
                                <Text strong>Trigger (Điều kiện kích hoạt)</Text> là bộ quy tắc xác định khi nào gói bảo hiểm sẽ chi trả bảo hiểm.
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
                                        <li>Nguồn dữ liệu: Rainfall</li>
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
                                → Gói bảo hiểm sẽ kích hoạt và chi trả bảo hiểm.
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
                                    <Text strong>Giá cơ bản (Base Cost):</Text> Chi phí cơ sở của nguồn dữ liệu (VD: 200,000 ₫/tháng)
                                </li>
                                <li>
                                    <Text strong>Hệ số danh mục (Category Multiplier):</Text> Hệ số theo loại dữ liệu (VD: Weather = 1.0, Soil = 1.2).
                                    <Text type="danger"> PHẢI LỚN HƠN 0</Text>
                                </li>
                                <li>
                                    <Text strong>Hệ số cấp độ (Tier Multiplier):</Text> Hệ số theo gói dịch vụ (VD: Basic = 1.0, Premium = 1.5).
                                    <Text type="danger"> PHẢI LỚN HƠN 0</Text>
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><BarChartOutlined /> Ví dụ cụ thể</Title>
                            <Paragraph>
                                <Text strong>Ví dụ:</Text> Chọn nguồn dữ liệu NASA Rainfall
                            </Paragraph>
                            <ul>
                                <li>Base Cost: 200,000 ₫/tháng</li>
                                <li>Category (Weather): 1.0</li>
                                <li>Tier (Premium): 1.5</li>
                                <li>→ Chi phí = 200,000 × 1.0 × 1.5 = <Text mark>300,000 ₫/tháng</Text></li>
                            </ul>

                            <Paragraph>
                                <Text type="secondary">
                                    Lưu ý: Chi phí ước tính hiển thị trên giao diện chỉ mang tính tham khảo, chi phí thực tế sẽ được
                                    tính khi gói bảo hiểm được kích hoạt.
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
                                    <Text strong>Ngày bắt đầu {'<'} Ngày kết thúc:</Text> Ngày bắt đầu phải nhỏ hơn ngày kết thúc.
                                </li>
                                <li>
                                    <Text strong>Nằm trong vùng hiệu lực:</Text> Các giai đoạn phải nằm trong khoảng ngày bắt đầu và kết thúc hiệu lực bảo hiểm.
                                </li>
                                <li>
                                    <Text strong type="danger">Không trùng lặp:</Text> Các giai đoạn không được trùng hoặc giao nhau
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}><ThunderboltOutlined /> Kịch bản xử lý</Title>
                            <Paragraph>
                                <Text strong>Ngày 05/01/2025 (Trong giai đoạn gieo hạt):</Text>
                            </Paragraph>
                            <ul>
                                <li>✅ Lượng mưa {'<'} 50mm (Điều kiện kích hoạt thỏa mãn)</li>
                                <li>❌ Ngày nằm trong blackout period (01/01 đến 07/01)</li>
                                <li>→ <Text strong type="danger">KẾT QUẢ: Không kích hoạt chi trả</Text> (Blackout có độ ưu tiên cao hơn)</li>
                            </ul>

                            <Paragraph>
                                <Text strong>Ngày 15/02/2025 (Giai đoạn sinh trưởng chính):</Text>
                            </Paragraph>
                            <ul>
                                <li>✅ Lượng mưa {'<'} 50mm (Điều kiện kích hoạt thỏa mãn)</li>
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
                                Với các toán tử khác (<Text code>{'<'}</Text>, <Text code>{'>'}</Text>, <Text code>{'<='}</Text>, <Text code>{'>='}</Text>), sẽ không cần baseline.
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
                                    Bạn không cần điền phần tham chiếu (baseline).
                                </li>
                                <li>
                                    <Text strong>Với toán tử change_gt, change_lt:</Text>
                                    Cần điền đủ 2 mục tham chiếu: thời gian tham chiếu và cách tính (baseline_window_days, baseline_function).
                                </li>
                                <li>
                                    <Text strong>Khi đổi toán tử:</Text> Nếu chuyển từ change_gt/change_lt sang toán tử khác, vui lòng kiểm tra lại phần tham chiếu vì nội dung này có thể không còn áp dụng.
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
                                <Text strong>Data Quality</Text> (tiếng Việt: Chất lượng Dữ liệu) đánh giá mức độ tin cậy, chính xác và hoàn chỉnh của nguồn dữ liệu được sử dụng trong điều kiện trigger. Đây là thông tin quan trọng giúp bạn hiểu rõ độ tin cậy của dữ liệu khi ra quyết định chi trả.
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
                                    <Text strong>Minh bạch:</Text> Người mua bảo hiểm hiểu rõ nguồn gốc và chất lượng dữ liệu giám sát
                                </li>
                            </ul>

                            <Divider />

                            {/* <Title level={5}><BulbOutlined /> Cách sử dụng</Title>
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
                                    <Tag color="red">poor</Tag> - Nếu dùng dữ liệu thử nghiệm, không chính thức
                                </li>
                            </ul> */}

                            <Divider />

                            <Title level={5}><WarningOutlined /> Lưu ý</Title>
                            <ul>
                                <li>Mặc định, Data Quality được set là <Tag color="green">good</Tag> nếu không chọn</li>
                                <li>Nên chọn chất lượng phù hợp với thực tế để tránh tranh chấp sau này</li>
                                <li>Gói bảo hiểm với nhiều điều kiện <Tag color="red">poor</Tag> có thể bị từ chối phê duyệt</li>
                                <li>Data Quality hiển thị trong bảng điều kiện để dễ theo dõi</li>
                            </ul>
                        </Panel>

                        {/* Lưu ý quan trọng */}
                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#f5222d' }} />
                                    <Text strong>Những lưu ý quan trọng khi tạo gói bảo hiểm?</Text>
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
                                    Vì nếu = 0 thì nhân với giá trị nào cũng = 0, không thế tính chi phí dịch vụ mua bảo hiểm của nông dân.
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
                                    <Text strong>Nguồn dữ liệu:</Text> Mỗi nguồn chỉ được chọn 1 lần trong cùng một gói bảo hiểm.
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
                                <li>Kiểm tra kỹ các công thức tính toán trước khi tạo gói bảo hiểm</li>
                                <li>Kiểm tra gói bảo hiểm với nhiều kịch bản khác nhau để đảm bảo hoạt động đúng</li>
                                <li>Sử dụng mã sản phẩm dễ nhớ và có ý nghĩa (VD: RICE_WINTER_2025)</li>
                            </ul>
                        </Panel>

                        {/* Tab PDF & Tags - Hướng dẫn chi tiết */}
                        <Panel
                            header={
                                <Space>
                                    <FileTextOutlined style={{ color: '#fa8c16' }} />
                                    <Text strong>Hướng dẫn tạo thẻ tài liệu trên PDF</Text>
                                </Space>
                            }
                            key="8"
                        >
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <div>
                                    <Title level={5}><FileTextOutlined /> Bước 1: Tải lên file PDF mẫu hợp đồng</Title>
                                    <Paragraph>
                                        Tải lên file PDF mẫu hợp đồng bảo hiểm mà bạn muốn thêm các thẻ tài liệu.
                                    </Paragraph>
                                    <ul>
                                        <li><strong>Định dạng:</strong> Chỉ chấp nhận file PDF</li>
                                        <li><strong>Kích thước tối đa:</strong> 10 MB</li>
                                        <li><strong>Vị trí:</strong> Click nút <Tag color="blue">Chọn file</Tag> để upload</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><EditOutlined /> Bước 2: Mở chế độ tạo thẻ tài liệu</Title>
                                    <Paragraph>
                                        Sau khi tải PDF lên, click nút <Tag color="purple">tạo thẻ tài liệu</Tag> để mở giao diện tạo thẻ.
                                    </Paragraph>
                                    <Paragraph>
                                        <Text strong>Giao diện gồm 2 phần:</Text>
                                    </Paragraph>
                                    <ul>
                                        <li><strong>Bên trái:</strong> Hiển thị PDF để bạn click chọn vùng cần tạo thẻ</li>
                                        <li><strong>Bên phải:</strong> Bảng danh sách các trường đã tạo, cho phép chỉnh sửa và xóa</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><EnvironmentOutlined /> Bước 3: Click vào PDF để chọn vùng tạo thẻ</Title>
                                    <Paragraph>
                                        <Text strong>Cách thao tác:</Text>
                                    </Paragraph>
                                    <ol style={{ lineHeight: '2' }}>
                                        <li>
                                            <strong>Click vào vị trí trên PDF</strong> mà bạn muốn tạo thẻ tài liệu (ví dụ: vị trí họ tên, CMND...)
                                        </li>
                                        <li>
                                            <strong>Popup hiện ra</strong> yêu cầu bạn nhập 3 thông tin:
                                            <ul>
                                                <li><Text code>Vị trí (Position)</Text>: Số thứ tự của trường (tự động gợi ý số tiếp theo)</li>
                                                <li><Text code>Tên trường</Text>: Viết bằng chữ thường tiếng Việt có dấu, không viết hoa, không ký tự đặc biệt (ví dụ: họ và tên, số căn cước)</li>
                                                <li><Text code>Loại dữ liệu (Data Type)</Text>: Chọn loại dữ liệu phù hợp (string, number, date...)</li>
                                            </ul>
                                        </li>
                                        <li>
                                            <strong>Click OK</strong> để thêm trường vào danh sách
                                        </li>
                                    </ol>

                                    <Paragraph type="warning">
                                        <InfoCircleOutlined /> <strong>Lưu ý quan trọng:</strong>
                                    </Paragraph>
                                    <ul>
                                        <li><Text strong>Vị trí (Position) không được trùng:</Text> Mỗi số vị trí chỉ dùng 1 lần duy nhất</li>
                                        <li><Text strong>Tên trường (Key) không được trùng:</Text> Mỗi tên trường chỉ dùng 1 lần duy nhất</li>
                                        <li><Text strong>Tự động gợi ý:</Text> Số vị trí tiếp theo sẽ tự động tăng (1 → 2 → 3...)</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><TagOutlined /> Bước 4: Kiểm tra và chỉnh sửa trường trong bảng</Title>
                                    <Paragraph>
                                        Sau khi tạo các trường, bạn có thể xem danh sách tất cả các trường ở <Text strong>bảng bên phải</Text>.
                                    </Paragraph>
                                    <Paragraph>
                                        <Text strong>Các thao tác có thể thực hiện:</Text>
                                    </Paragraph>
                                    <ul>
                                        <li><strong>Xem thông tin:</strong> Xem vị trí, tên trường, loại dữ liệu, trang PDF của từng trường</li>
                                        <li><strong>Chỉnh sửa:</strong> Click nút <Tag color="blue">Sửa</Tag> để thay đổi thông tin trường</li>
                                        <li><strong>Xóa:</strong> Click nút <Tag color="red">Xóa</Tag> để loại bỏ trường không cần thiết</li>
                                        <li><strong>Visual markers:</strong> Các hình chữ nhật màu xanh hiển thị trên PDF cho biết vị trí các trường đã tạo</li>
                                    </ul>

                                    <Paragraph type="success">
                                        <CheckCircleOutlined /> <Text strong>Mẹo:</Text> Bạn có thể tạo nhiều trường liên tục trước khi áp dụng, giúp tiết kiệm thời gian
                                    </Paragraph>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><ThunderboltOutlined /> Bước 5: Áp dụng tất cả trường</Title>
                                    <Paragraph>
                                        Sau khi tạo đủ các trường cần thiết, click nút <Tag color="green">Áp dụng tất cả</Tag> ở góc dưới bên phải.
                                    </Paragraph>
                                    <Paragraph>
                                        <Text strong>Điều gì sẽ xảy ra:</Text>
                                    </Paragraph>
                                    <ul>
                                        <li>Tất cả các trường bạn đã tạo sẽ được thêm vào PDF</li>
                                        <li>PDF sẽ có các ô nhập liệu tại các vị trí bạn đã chọn</li>
                                        <li>Modal sẽ tự động đóng lại</li>
                                        <li>Bạn có thể tải xuống PDF để kiểm tra kết quả</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><BarChartOutlined /> Các loại dữ liệu (Data Types)</Title>
                                    <Paragraph>
                                        Khi tạo thẻ, bạn cần chọn loại dữ liệu phù hợp với thông tin cần điền:
                                    </Paragraph>
                                    <Table
                                        dataSource={[
                                            { key: '1', field: 'Chuỗi/Text', englishTerm: 'string', example: 'Nguyễn Văn A, TP.HCM', usage: 'Họ tên, địa chỉ, mô tả ngắn' },
                                            { key: '2', field: 'Văn bản dài', englishTerm: 'textarea', example: 'Địa chỉ chi tiết gồm 2-3 dòng', usage: 'Mô tả dài, ghi chú' },
                                            { key: '3', field: 'Số nguyên', englishTerm: 'integer', example: '25, 100, 1990', usage: 'Tuổi, năm sinh, số lượng' },
                                            { key: '4', field: 'Số thực', englishTerm: 'float', example: '3.14, 99.9', usage: 'Diện tích, giá trị có số thập phân' },
                                            { key: '5', field: 'Ngày tháng', englishTerm: 'date', example: '01/01/2025', usage: 'Ngày sinh, ngày ký hợp đồng' },
                                            { key: '6', field: 'Ngày giờ', englishTerm: 'datetime', example: '01/01/2025 14:30', usage: 'Thời điểm chính xác' },
                                            { key: '7', field: 'Giờ phút', englishTerm: 'time', example: '14:30', usage: 'Giờ hẹn, giờ làm việc' },
                                        ]}
                                        columns={[
                                            { title: 'Loại dữ liệu', dataIndex: 'field', key: 'field', width: '18%', render: (text) => <Text strong>{text}</Text> },
                                            { title: 'Thuật ngữ', dataIndex: 'englishTerm', key: 'englishTerm', width: '12%', render: (text) => <Tag color="purple">{text}</Tag> },
                                            { title: 'Ví dụ', dataIndex: 'example', key: 'example', width: '30%', render: (text) => <Text type="secondary">{text}</Text> },
                                            { title: 'Dùng cho', dataIndex: 'usage', key: 'usage', width: '40%' },
                                        ]}
                                        pagination={false}
                                        size="small"
                                        bordered
                                    />
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><BulbOutlined /> Lời khuyên khi tạo thẻ</Title>
                                    <Paragraph>
                                        <Text strong type="success">✅ NÊN:</Text>
                                    </Paragraph>
                                    <ul style={{ lineHeight: '2' }}>
                                        <li>Đặt tên trường ngắn gọn, dễ hiểu: <Text code>họ và tên</Text>, <Text code>số căn cước</Text></li>
                                        <li>Đặt tên trường bằng chữ thường tiếng Việt có dấu, dùng khoảng trắng; không dùng ký tự đặc biệt</li>
                                        <li>Chọn loại dữ liệu chính xác (string cho text, integer cho số nguyên...)</li>
                                        <li>Tạo nhiều trường cùng lúc trước khi áp dụng (tiết kiệm thời gian)</li>
                                        <li>Kiểm tra kỹ visual markers (hình chữ nhật xanh) xem có đúng vị trí không</li>
                                        <li>Sử dụng chức năng sửa/xóa trong bảng nếu cần điều chỉnh</li>
                                    </ul>

                                    <Paragraph>
                                        <Text strong type="danger">❌ TRÁNH:</Text>
                                    </Paragraph>
                                    <ul style={{ lineHeight: '2' }}>
                                        <li>Đặt tên trường có ký tự đặc biệt: <Text delete>họ&tên</Text>, <Text delete>số-cmnd</Text></li>
                                        <li>Để trùng số vị trí (sẽ báo lỗi và không cho tạo)</li>
                                        <li>Để trùng tên trường (sẽ báo lỗi khi áp dụng)</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <Title level={5}><WarningOutlined /> Xử lý lỗi thường gặp</Title>
                                    <Table
                                        dataSource={[
                                            {
                                                key: '1',
                                                error: 'Vị trí đã tồn tại',
                                                reason: 'Bạn đã tạo thẻ với số vị trí này rồi',
                                                solution: 'Dùng số vị trí khác (hệ thống tự động gợi ý)'
                                            },
                                            {
                                                key: '2',
                                                error: 'Tên trường đã tồn tại',
                                                reason: 'Tên trường bị trùng với trường khác',
                                                solution: 'Đặt tên trường khác, ví dụ: họ và tên 2'
                                            },
                                            {
                                                key: '3',
                                                error: 'Tên trường không hợp lệ',
                                                reason: 'Có chữ in hoa hoặc ký tự đặc biệt',
                                                solution: 'Dùng chữ thường tiếng Việt có dấu, có thể dùng khoảng trắng; không dùng ký tự đặc biệt'
                                            },
                                        ]}
                                        columns={[
                                            { title: 'Lỗi', dataIndex: 'error', key: 'error', width: '25%', render: (text) => <Text type="danger" strong>{text}</Text> },
                                            { title: 'Nguyên nhân', dataIndex: 'reason', key: 'reason', width: '35%' },
                                            { title: 'Cách xử lý', dataIndex: 'solution', key: 'solution', width: '40%', render: (text) => <Text type="success">{text}</Text> },
                                        ]}
                                        pagination={false}
                                        size="small"
                                        bordered
                                    />
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
