import CustomTable from '@/components/custom-table';
import useDictionary from '@/services/hooks/common/use-dictionary';
import { DeleteOutlined, EditOutlined, HolderOutlined } from '@ant-design/icons';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Button, Popconfirm, Space, Tag, Typography } from 'antd';
import { memo } from 'react';

const { Text: TypographyText } = Typography;

const ConditionsTable = memo(({ conditions, onEdit, onDelete, onDragEnd }) => {
    const dict = useDictionary();

    // Trigger conditions table columns
    const conditionsColumns = [
        {
            title: '#',
            dataIndex: 'conditionOrder',
            key: 'conditionOrder',
            width: 60,
            render: (order) => (
                <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {order || 1}
                </Tag>
            ),
        },
        {
            title: 'Nguồn dữ liệu',
            dataIndex: 'dataSourceLabel',
            key: 'dataSourceLabel',
            render: (text, record) => (
                <div>
                    <TypographyText strong>{text}</TypographyText>
                    <br />
                    <TypographyText type="secondary" style={{ fontSize: '12px' }}>
                        {record.parameterName} ({record.unit})
                    </TypographyText>
                </div>
            ),
        },
        {
            title: 'Hàm tổng hợp',
            dataIndex: 'aggregationFunctionLabel',
            key: 'aggregationFunctionLabel',
            render: (text, record) => (
                <div>
                    <Tag color="blue">{text}</Tag>
                    <br />
                    <TypographyText type="secondary" style={{ fontSize: '12px' }}>
                        {record.aggregationWindowDays} ngày
                        {record.baselineWindowDays && (
                            <> | Baseline: {record.baselineWindowDays} ngày ({record.baselineFunction})</>
                        )}
                        {record.validationWindowDays && (
                            <> | Kiểm tra: {record.validationWindowDays} ngày</>
                        )}
                        {record.dataQuality && (
                            <> | Chất lượng: <Tag color={record.dataQuality === 'good' ? 'green' : record.dataQuality === 'acceptable' ? 'orange' : 'red'} style={{ marginLeft: 4 }}>{record.dataQualityLabel}</Tag></>
                        )}
                    </TypographyText>
                </div>
            ),
        },
        {
            title: dict.ui.condition,
            key: 'condition',
            render: (_, record) => (
                <div>
                    <TypographyText>
                        {record.thresholdOperatorLabel} {record.thresholdValue} {record.unit}
                    </TypographyText>
                    {(record.consecutiveRequired || record.includeComponent) && (
                        <>
                            <br />
                            <TypographyText type="secondary" style={{ fontSize: '11px' }}>
                                {record.consecutiveRequired && 'Liên tiếp'}
                                {record.consecutiveRequired && record.includeComponent && ' | '}
                                {record.includeComponent && 'Bao gồm Component'}
                            </TypographyText>
                        </>
                    )}
                </div>
            ),
        },
        {
            title: 'Chi phí tính toán',
            key: 'calculatedCost',
            align: 'right',
            render: (_, record) => (
                <div>
                    <TypographyText strong style={{ color: '#52c41a' }}>
                        {(record.calculatedCost || 0).toLocaleString('vi-VN')} ₫
                    </TypographyText>
                    <br />
                    <TypographyText type="secondary" style={{ fontSize: '11px' }}>
                        {record.baseCost?.toLocaleString() || 0} × {record.categoryMultiplier || 1} × {record.tierMultiplier || 1}
                    </TypographyText>
                </div>
            ),
        },
        {
            title: 'Hành động',
            fixed: 'right',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <div className="flex gap-2">
                    <Button
                        type="dashed"
                        size="small"
                        className="!bg-orange-100 !border-orange-200 !text-orange-800 hover:!bg-orange-200"
                        onClick={() => onEdit(record)}
                        title="Chỉnh sửa"
                    >
                        <EditOutlined size={14} />
                    </Button>
                    <Popconfirm
                        title="Xóa điều kiện"
                        description="Bạn có chắc chắn muốn xóa điều kiện này?"
                        onConfirm={() => onDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            type="dashed"
                            size="small"
                            className="!bg-red-100 !border-red-200 !text-red-800 hover:!bg-red-200"
                            title="Xóa"
                        >
                            <DeleteOutlined size={14} />
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="conditions-table">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <CustomTable
                            columns={conditionsColumns}
                            dataSource={conditions}
                            pagination={false}
                            rowKey="id"
                            components={{
                                body: {
                                    wrapper: (props) => <tbody {...props}>{props.children}</tbody>,
                                    row: ({ children, ...props }) => {
                                        const index = conditions.findIndex(
                                            (x) => x.id === props['data-row-key']
                                        );
                                        return (
                                            <Draggable
                                                key={props['data-row-key']}
                                                draggableId={props['data-row-key']}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <tr
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...props}
                                                        style={{
                                                            ...props.style,
                                                            ...provided.draggableProps.style,
                                                            ...(snapshot.isDragging ? {
                                                                display: 'table',
                                                                background: '#fafafa'
                                                            } : {}),
                                                        }}
                                                    >
                                                        {children?.map((child, idx) => {
                                                            if (idx === 0) {
                                                                return (
                                                                    <td key={child.key} {...child.props}>
                                                                        <Space>
                                                                            <HolderOutlined
                                                                                {...provided.dragHandleProps}
                                                                                style={{ cursor: 'grab' }}
                                                                            />
                                                                            {child.props.children}
                                                                        </Space>
                                                                    </td>
                                                                );
                                                            }
                                                            return child;
                                                        })}
                                                    </tr>
                                                )}
                                            </Draggable>
                                        );
                                    },
                                },
                            }}
                        />
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
});

ConditionsTable.displayName = 'ConditionsTable';

export default ConditionsTable;
