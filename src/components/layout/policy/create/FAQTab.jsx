import React from 'react';
import { Typography, Collapse, Card, Divider, Table, Tag, Space } from 'antd';
import {
    QuestionCircleOutlined,
    InfoCircleOutlined,
    CalculatorOutlined,
    DollarOutlined,
    ThunderboltOutlined,
    FileTextOutlined
} from '@ant-design/icons';

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
            field: 'Số tiền bồi thường cố định',
            englishTerm: 'Fixed Payout Amount',
            description: 'Số tiền bồi thường cố định khi xảy ra sự kiện bảo hiểm',
            example: '5,000,000 ₫',
            required: 'Có (nếu không dùng tỷ lệ bồi thường)'
        },
        {
            key: '2',
            field: 'Tỷ lệ bồi thường cơ bản',
            englishTerm: 'Payout Base Rate',
            description: 'Tỷ lệ phần trăm giá trị thiệt hại được bồi thường. PHẢI LỚN HƠN 0',
            example: '0.75 = bồi thường 75% thiệt hại',
            required: 'Có'
        },
        {
            key: '3',
            field: 'Trần bồi thường',
            englishTerm: 'Payout Cap',
            description: 'Số tiền tối đa được bồi thường cho một hợp đồng, dù thiệt hại có cao hơn',
            example: '10,000,000 ₫',
            required: 'Không'
        },
        {
            key: '4',
            field: 'Hệ số vượt ngưỡng',
            englishTerm: 'Over Threshold Multiplier',
            description: 'Hệ số nhân bổ sung khi mức độ thiệt hại vượt xa ngưỡng. PHẢI LỚN HƠN 0',
            example: '1.5 = tăng 50% bồi thường',
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
                                    <Text strong>Policy (Chính sách bảo hiểm) là gì?</Text>
                                </Space>
                            }
                            key="1"
                        >
                            <Paragraph>
                                <Text strong>Policy</Text> (tiếng Việt: Chính sách bảo hiểm) là một bản hợp đồng điện tử
                                quy định các điều khoản bảo hiểm cho cây trồng. Mỗi policy bao gồm:
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text strong>Thông tin cơ bản:</Text> Tên sản phẩm, loại cây trồng, thời hạn bảo hiểm
                                </li>
                                <li>
                                    <Text strong>Phí bảo hiểm (Premium):</Text> Số tiền người mua phải trả
                                </li>
                                <li>
                                    <Text strong>Bồi thường (Payout):</Text> Số tiền được chi trả khi xảy ra rủi ro
                                </li>
                                <li>
                                    <Text strong>Điều kiện kích hoạt (Trigger):</Text> Các điều kiện cần thỏa mãn để được bồi thường
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
                                    <Text strong>Quy trình tạo Policy bao gồm những bước nào?</Text>
                                </Space>
                            }
                            key="2"
                        >
                            <Paragraph>
                                Quy trình tạo policy được chia thành <Text strong>4 bước chính</Text>:
                            </Paragraph>
                            <ol>
                                <li>
                                    <Text strong>Thông tin cơ bản:</Text> Nhập tên, mã sản phẩm, loại cây trồng, cấu hình phí và bồi thường
                                </li>
                                <li>
                                    <Text strong>Cấu hình nâng cao:</Text> Thiết lập điều kiện kích hoạt (trigger) và các điều kiện giám sát
                                </li>
                                <li>
                                    <Text strong>Tài liệu & Trường thông tin:</Text> Upload mẫu hợp đồng PDF và map các trường dữ liệu
                                </li>
                                <li>
                                    <Text strong>Xem lại & Tạo:</Text> Kiểm tra toàn bộ thông tin và gửi tạo policy
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
                            <Title level={5}>📋 Thông tin sản phẩm</Title>
                            <Table
                                dataSource={basicFieldsData}
                                columns={basicFieldsColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}>💰 Cấu hình Phí bảo hiểm (Premium)</Title>
                            <Table
                                dataSource={premiumFieldsData}
                                columns={basicFieldsColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}>💵 Cấu hình Bồi thường (Payout)</Title>
                            <Table
                                dataSource={payoutFieldsData}
                                columns={basicFieldsColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />
                        </Panel>

                        {/* Phí và Bồi thường */}
                        <Panel
                            header={
                                <Space>
                                    <DollarOutlined style={{ color: '#fa8c16' }} />
                                    <Text strong>Phí bảo hiểm (Premium) và Bồi thường (Payout) khác nhau như thế nào?</Text>
                                </Space>
                            }
                            key="4"
                        >
                            <Paragraph>
                                <Text strong>Phí bảo hiểm (Premium)</Text> là số tiền mà <Text underline>người mua phải trả</Text> để
                                được tham gia bảo hiểm.
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Bồi thường (Payout)</Text> là số tiền mà <Text underline>công ty bảo hiểm chi trả</Text> cho
                                người mua khi xảy ra sự kiện rủi ro (như hạn hán, mưa lớn, nhiệt độ quá cao).
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
                                <Text strong>Bồi thường:</Text>
                            </Paragraph>
                            <ul>
                                <li>Nếu có <Text code>Bồi thường cố định</Text>: Bồi thường = Bồi thường cố định</li>
                                <li>
                                    Nếu không có bồi thường cố định: Bồi thường = Thiệt hại ước tính × Tỷ lệ bồi thường cơ bản × Hệ số vượt ngưỡng
                                </li>
                                <li>
                                    Nếu có <Text code>Trần bồi thường</Text>: Bồi thường tối đa = Trần bồi thường (không vượt quá giá trị này)
                                </li>
                            </ul>

                            <Divider />

                            <Title level={5}>📊 Ví dụ cụ thể</Title>
                            <Paragraph>
                                <Text strong>Ví dụ 1:</Text> Phí cố định
                            </Paragraph>
                            <ul>
                                <li>Phí bảo hiểm cố định: 1,000,000 ₫</li>
                                <li>→ Người mua trả: <Text mark>1,000,000 ₫</Text></li>
                            </ul>

                            <Paragraph>
                                <Text strong>Ví dụ 2:</Text> Bồi thường theo tỷ lệ
                            </Paragraph>
                            <ul>
                                <li>Thiệt hại ước tính: 8,000,000 ₫</li>
                                <li>Tỷ lệ bồi thường cơ bản: 0.75 (75%)</li>
                                <li>Hệ số vượt ngưỡng: 1.2 (do thiệt hại nghiêm trọng)</li>
                                <li>Trần bồi thường: 10,000,000 ₫</li>
                                <li>→ Bồi thường = 8,000,000 × 0.75 × 1.2 = 7,200,000 ₫</li>
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
                                <Text strong>Trigger (Điều kiện kích hoạt)</Text> là bộ quy tắc xác định khi nào policy sẽ chi trả bồi thường.
                                Trigger bao gồm:
                            </Paragraph>

                            <Title level={5}>⚙️ Các trường trong Trigger</Title>
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

                            <Title level={5}>🔍 Các trường trong Condition</Title>
                            <Table
                                dataSource={conditionFieldsData}
                                columns={triggerConditionColumns}
                                pagination={false}
                                size="small"
                                bordered
                            />

                            <Divider />

                            <Title level={5}>📊 Ví dụ cụ thể</Title>
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
                                → Policy sẽ kích hoạt và chi trả bồi thường.
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

                            <Title level={5}>🧮 Công thức tính chi phí</Title>
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

                            <Title level={5}>📊 Ví dụ cụ thể</Title>
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
                                    tính khi policy được kích hoạt.
                                </Text>
                            </Paragraph>
                        </Panel>

                        {/* Lưu ý quan trọng */}
                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#f5222d' }} />
                                    <Text strong>Những lưu ý quan trọng khi tạo Policy?</Text>
                                </Space>
                            }
                            key="7"
                        >
                            <Paragraph>
                                <Text strong type="danger">⚠️ Các quy tắc bắt buộc:</Text>
                            </Paragraph>
                            <ul>
                                <li>
                                    <Text strong>Tỷ lệ phí cơ bản (Premium Base Rate):</Text> PHẢI {'>'} 0 nếu không có phí cố định.
                                    Vì nếu = 0 thì nhân với giá trị nào cũng = 0, không hợp lý về nghiệp vụ.
                                </li>
                                <li>
                                    <Text strong>Tỷ lệ bồi thường cơ bản (Payout Base Rate):</Text> PHẢI {'>'} 0.
                                    Tương tự, nếu = 0 thì không có bồi thường.
                                </li>
                                <li>
                                    <Text strong>Hệ số vượt ngưỡng (Over Threshold Multiplier):</Text> PHẢI {'>'} 0 nếu được nhập.
                                    Giá trị {'<'}= 0 sẽ làm số tiền bồi thường không hợp lệ.
                                </li>
                                <li>
                                    <Text strong>Hệ số nhóm và Hệ số gói (Category/Tier Multiplier):</Text> PHẢI {'>'} 0.
                                    Đây là các hệ số nhân nên phải dương.
                                </li>
                                <li>
                                    <Text strong>Nguồn dữ liệu:</Text> Mỗi nguồn chỉ được chọn 1 lần trong cùng một policy.
                                    Hệ thống sẽ tự động loại bỏ các nguồn đã chọn khỏi danh sách.
                                </li>
                            </ul>

                            <Divider />

                            <Paragraph>
                                <Text strong>📅 Thời gian:</Text>
                            </Paragraph>
                            <ul>
                                <li>Ngày kết thúc đăng ký phải trước hoặc bằng ngày bắt đầu hiệu lực bảo hiểm</li>
                                <li>Ngày bắt đầu hiệu lực phải trước ngày kết thúc hiệu lực</li>
                                <li>Tất cả các ngày phải là ngày trong tương lai (không được chọn ngày quá khứ)</li>
                            </ul>

                            <Divider />

                            <Paragraph>
                                <Text strong>💡 Khuyến nghị:</Text>
                            </Paragraph>
                            <ul>
                                <li>Nên nhập đầy đủ mô tả sản phẩm để người dùng dễ hiểu</li>
                                <li>Kiểm tra kỹ các công thức tính toán trước khi tạo policy</li>
                                <li>Test policy với nhiều kịch bản khác nhau để đảm bảo hoạt động đúng</li>
                                <li>Sử dụng mã sản phẩm dễ nhớ và có ý nghĩa (VD: RICE_WINTER_2025)</li>
                            </ul>
                        </Panel>

                        {/* Thuật ngữ tiếng Anh */}
                        <Panel
                            header={
                                <Space>
                                    <InfoCircleOutlined style={{ color: '#2f54eb' }} />
                                    <Text strong>Bảng thuật ngữ tiếng Anh - tiếng Việt</Text>
                                </Space>
                            }
                            key="8"
                        >
                            <Table
                                dataSource={[
                                    { key: '1', english: 'Policy', vietnamese: 'Chính sách bảo hiểm', category: 'Tổng quan' },
                                    { key: '2', english: 'Premium', vietnamese: 'Phí bảo hiểm', category: 'Phí' },
                                    { key: '3', english: 'Payout', vietnamese: 'Bồi thường', category: 'Bồi thường' },
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
