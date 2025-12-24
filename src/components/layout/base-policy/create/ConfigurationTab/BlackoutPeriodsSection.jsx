import useDictionary from '@/services/hooks/common/use-dictionary';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, DatePicker, Form, Popconfirm, Row, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { memo } from 'react';

const { Title, Text } = Typography;

const BlackoutPeriodsSection = memo(({
    configurationData,
    basicData,
    onAddBlackoutPeriod,
    onRemoveBlackoutPeriod
}) => {
    const [blackoutPeriodForm] = Form.useForm();
    const dict = useDictionary();

    return (
        <>
            {(!basicData?.insuranceValidFrom || !basicData?.insuranceValidTo) ? (
                <Alert
                    message="Chưa xác định khoảng thời gian bảo hiểm"
                    description="Vui lòng điền 'Bảo hiểm có hiệu lực từ' và 'Bảo hiểm có hiệu lực đến' ở tab 'Thông tin Cơ bản' trước khi thiết lập giai đoạn không kích hoạt."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            ) : (
                <>
                    <Alert
                        message="Giai đoạn Không Kích hoạt (Blackout Periods)"
                        description="Đây là các giai đoạn trong chu kỳ bảo hiểm mà hệ thống KHÔNG được phép kích hoạt chi trả, dù các điều kiện đều thỏa mãn. Ví dụ: giai đoạn gieo hạt, giai đoạn nảy mầm sớm, hoặc giai đoạn thu hoạch."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Card style={{ marginBottom: 16 }}>
                        <Title level={5}>Thêm Giai đoạn Mới</Title>
                        <Form
                            form={blackoutPeriodForm}
                            layout="vertical"
                            onFinish={(values) => {
                                const startDate = values.start;
                                const endDate = values.end;

                                // If either date missing, do not proceed
                                if (!startDate || !endDate) {
                                    message.warning('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc để thêm giai đoạn.');
                                    return;
                                }

                                // Validation 1: Kiểm tra start < end
                                if (startDate.isAfter(endDate) || startDate.isSame(endDate)) {
                                    message.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!');
                                    return;
                                }

                                // Validation 2: Kiểm tra nằm trong valid date range (xử lý trường hợp vượt năm)
                                const validFrom = basicData?.insuranceValidFrom ? dayjs(basicData.insuranceValidFrom) : null;
                                const validTo = basicData?.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;

                                if (validFrom && validTo) {
                                    const validFromMD = validFrom.format('MM-DD');
                                    const validToMD = validTo.format('MM-DD');
                                    const startMD = values.start.format('MM-DD');
                                    const endMD = values.end.format('MM-DD');
                                    const isValidRangeAcrossYear = validFromMD > validToMD; // e.g., "12-01" > "06-01"

                                    let isValid = false;
                                    if (isValidRangeAcrossYear) {
                                        // Valid range crosses year: start >= validFrom OR start <= validTo AND end >= validFrom OR end <= validTo
                                        const startValid = startMD >= validFromMD || startMD <= validToMD;
                                        const endValid = endMD >= validFromMD || endMD <= validToMD;
                                        isValid = startValid && endValid;
                                    } else {
                                        // Normal range within same year
                                        isValid = startMD >= validFromMD && endMD <= validToMD;
                                    }

                                    if (!isValid) {
                                        message.error(`Giai đoạn phải nằm trong khoảng hiệu lực bảo hiểm (${validFrom.format('DD/MM')} - ${validTo.format('DD/MM')})!`);
                                        return;
                                    }
                                }

                                // Validation 3: Kiểm tra không trùng lặp (xử lý vượt năm)
                                const newStart = values.start.format('MM-DD');
                                const newEnd = values.end.format('MM-DD');
                                const isNewAcrossYear = newStart > newEnd;

                                const hasOverlap = configurationData.blackoutPeriods?.periods?.some(period => {
                                    const existingStart = period.start; // MM-DD format
                                    const existingEnd = period.end;
                                    const isExistingAcrossYear = existingStart > existingEnd;

                                    // Helper: Check if a date falls within a range
                                    const isDateInRange = (date, rangeStart, rangeEnd, rangeAcrossYear) => {
                                        if (rangeAcrossYear) {
                                            return date >= rangeStart || date <= rangeEnd;
                                        } else {
                                            return date >= rangeStart && date <= rangeEnd;
                                        }
                                    };

                                    // Check if ranges overlap
                                    const newStartInExisting = isDateInRange(newStart, existingStart, existingEnd, isExistingAcrossYear);
                                    const newEndInExisting = isDateInRange(newEnd, existingStart, existingEnd, isExistingAcrossYear);
                                    const existingStartInNew = isDateInRange(existingStart, newStart, newEnd, isNewAcrossYear);
                                    const existingEndInNew = isDateInRange(existingEnd, newStart, newEnd, isNewAcrossYear);

                                    return newStartInExisting || newEndInExisting || existingStartInNew || existingEndInNew;
                                });

                                if (hasOverlap) {
                                    message.error('Giai đoạn này trùng lặp với giai đoạn đã có. Vui lòng chọn khoảng thời gian khác!');
                                    return;
                                }

                                // Add the blackout period
                                onAddBlackoutPeriod({
                                    start: newStart,
                                    end: newEnd
                                });

                                blackoutPeriodForm.resetFields();
                                message.success('Đã thêm giai đoạn không kích hoạt thành công!');
                            }}
                        >
                            <Row gutter={16}>
                                <Col span={10}>
                                    <Form.Item
                                        name="start"
                                        label={dict.getFieldLabel('BasePolicyTrigger', 'blackout_periods') || 'Ngày bắt đầu'}
                                        tooltip="Ngày bắt đầu giai đoạn không kích hoạt (chỉ chọn được trong khoảng thời gian bảo hiểm có hiệu lực)"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày bắt đầu"
                                            size="large"
                                            style={{ width: '100%' }}
                                            disabledDate={(current) => {
                                                if (!current) return false;
                                                const validFrom = basicData?.insuranceValidFrom ? dayjs(basicData.insuranceValidFrom) : null;
                                                const validTo = basicData?.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;

                                                if (!validFrom || !validTo) return false;

                                                // Disable dates outside valid range (xử lý vượt năm)
                                                const currentMD = current.format('MM-DD');
                                                const validFromMD = validFrom.format('MM-DD');
                                                const validToMD = validTo.format('MM-DD');
                                                const isValidRangeAcrossYear = validFromMD > validToMD; // e.g., "12-01" > "06-01"

                                                let isOutsideValidRange = false;
                                                if (isValidRangeAcrossYear) {
                                                    // Range crosses year: current must be >= validFrom OR <= validTo
                                                    isOutsideValidRange = !(currentMD >= validFromMD || currentMD <= validToMD);
                                                } else {
                                                    // Normal range: current must be >= validFrom AND <= validTo
                                                    isOutsideValidRange = currentMD < validFromMD || currentMD > validToMD;
                                                }

                                                if (isOutsideValidRange) {
                                                    return true;
                                                }

                                                // Disable dates that overlap with existing blackout periods
                                                const existingPeriods = configurationData.blackoutPeriods?.periods || [];
                                                const isInExistingPeriod = existingPeriods.some(period => {
                                                    const periodStart = period.start; // MM-DD format
                                                    const periodEnd = period.end;
                                                    const isExistingAcrossYear = periodStart > periodEnd;

                                                    if (isExistingAcrossYear) {
                                                        return currentMD >= periodStart || currentMD <= periodEnd;
                                                    } else {
                                                        return currentMD >= periodStart && currentMD <= periodEnd;
                                                    }
                                                });

                                                return isInExistingPeriod;
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        name="end"
                                        label={dict.getFieldLabel('BasePolicyTrigger', 'blackout_periods') || 'Ngày kết thúc'}
                                        tooltip="Ngày kết thúc giai đoạn không kích hoạt (phải sau ngày bắt đầu và trong khoảng thời gian bảo hiểm có hiệu lực)"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày kết thúc"
                                            size="large"
                                            style={{ width: '100%' }}
                                            disabledDate={(current) => {
                                                if (!current) return false;
                                                const validFrom = basicData?.insuranceValidFrom ? dayjs(basicData.insuranceValidFrom) : null;
                                                const validTo = basicData?.insuranceValidTo ? dayjs(basicData.insuranceValidTo) : null;
                                                const startDate = blackoutPeriodForm.getFieldValue('start');

                                                if (!validFrom || !validTo) return false;

                                                // Disable dates outside valid range (xử lý vượt năm)
                                                const currentMD = current.format('MM-DD');
                                                const validFromMD = validFrom.format('MM-DD');
                                                const validToMD = validTo.format('MM-DD');
                                                const isValidRangeAcrossYear = validFromMD > validToMD; // e.g., "12-01" > "06-01"

                                                let isOutsideValidRange = false;
                                                if (isValidRangeAcrossYear) {
                                                    // Range crosses year: current must be >= validFrom OR <= validTo
                                                    isOutsideValidRange = !(currentMD >= validFromMD || currentMD <= validToMD);
                                                } else {
                                                    // Normal range: current must be >= validFrom AND <= validTo
                                                    isOutsideValidRange = currentMD < validFromMD || currentMD > validToMD;
                                                }

                                                if (isOutsideValidRange) {
                                                    return true;
                                                }

                                                // Disable dates before or equal to start date
                                                if (startDate && (current.isBefore(startDate, 'day') || current.isSame(startDate, 'day'))) {
                                                    return true;
                                                }

                                                // Disable dates that overlap with existing blackout periods
                                                const existingPeriods = configurationData.blackoutPeriods?.periods || [];
                                                const isInExistingPeriod = existingPeriods.some(period => {
                                                    const periodStart = period.start; // MM-DD format
                                                    const periodEnd = period.end;
                                                    const isExistingAcrossYear = periodStart > periodEnd;

                                                    if (isExistingAcrossYear) {
                                                        return currentMD >= periodStart || currentMD <= periodEnd;
                                                    } else {
                                                        return currentMD >= periodStart && currentMD <= periodEnd;
                                                    }
                                                });

                                                return isInExistingPeriod;
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item label=" ">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<PlusOutlined />}
                                            size="large"
                                            style={{ width: '100%' }}
                                        >
                                            Thêm
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    {/* comments */}
                    {/* Blackout Periods Table */}
                    {configurationData.blackoutPeriods?.periods?.length > 0 && (
                        <Table
                            dataSource={configurationData.blackoutPeriods.periods.map((period, index) => ({
                                key: index,
                                index: index + 1,
                                start: period.start,
                                end: period.end
                            }))}
                            columns={[
                                {
                                    title: '#',
                                    dataIndex: 'index',
                                    key: 'index',
                                    width: 60,
                                    render: (num) => <Tag color="purple">{num}</Tag>
                                },
                                {
                                    title: 'Ngày bắt đầu',
                                    dataIndex: 'start',
                                    key: 'start',
                                    render: (text) => {
                                        if (!text) return <Text type="secondary">-</Text>;
                                        // Convert MM-DD to DD/MM for display
                                        const parts = text.split('-');
                                        if (parts.length < 2) return <Text strong>{text}</Text>;
                                        const [month, day] = parts;
                                        return <Text strong>{day}/{month}</Text>;
                                    }
                                },
                                {
                                    title: 'Ngày kết thúc',
                                    dataIndex: 'end',
                                    key: 'end',
                                    render: (text) => {
                                        if (!text) return <Text type="secondary">-</Text>;
                                        // Convert MM-DD to DD/MM for display
                                        const parts = text.split('-');
                                        if (parts.length < 2) return <Text strong>{text}</Text>;
                                        const [month, day] = parts;
                                        return <Text strong>{day}/{month}</Text>;
                                    }
                                },
                                {
                                    title: 'Hành động',
                                    key: 'action',
                                    width: 100,
                                    render: (_, record) => (
                                        <Popconfirm
                                            title="Xóa giai đoạn"
                                            description="Bạn có chắc chắn muốn xóa giai đoạn này?"
                                            onConfirm={() => {
                                                onRemoveBlackoutPeriod(record.key);
                                                message.success('Đã xóa giai đoạn!');
                                            }}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button type="text" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    )
                                }
                            ]}
                            pagination={false}
                            size="small"
                        />
                    )}
                </>
            )}
        </>
    );
});

BlackoutPeriodsSection.displayName = 'BlackoutPeriodsSection';

export default BlackoutPeriodsSection;
