import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Card,
    Pagination,
    Popconfirm,
    Tag
} from "antd";
import { formatYield, getCropTypeColor } from "../usecase/mockupUseCase";

const MobileListView = ({
    filteredData,
    loading,
    handleView,
    handleEdit,
    handleDelete
}) => {
    return (
        <div className="space-y-2">
            {loading ? (
                Array(6).fill(null).map((_, index) => (
                    <Card key={`loading-${index}`} loading={true} className="w-full" />
                ))
            ) : (
                <>
                    {filteredData.map(record => (
                        <Card
                            key={record.id}
                            className="w-full hover:shadow-sm transition-shadow"
                            bodyStyle={{ padding: '8px' }}
                        >
                            <div className="flex items-center">
                                <div className="mr-2">
                                    <Avatar
                                        src={record.avatar}
                                        size={40}
                                        className="border border-gray-200"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-sm truncate mr-2">{record.name}</h4>
                                        <Tag color={getCropTypeColor(record.cropDetails.type)} size="small">
                                            {record.cropDetails.type}
                                        </Tag>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                            <span className="inline-flex items-center">
                                                <span className="mr-1">🌱</span> {record.cropDetails.plantingMonth}
                                            </span>
                                            <span className="inline-flex items-center">
                                                <span className="mr-1">⚡</span> {formatYield(record.cropDetails.yieldPerAcre)}
                                            </span>
                                        </div>
                                        <div className="flex space-x-1">
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => handleView(record)}
                                                className="text-blue-500 h-6 w-6 p-0"
                                            />
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => handleEdit(record)}
                                                className="text-green-500 h-6 w-6 p-0"
                                            />
                                            <Popconfirm
                                                title="Xóa cây trồng"
                                                description="Bạn có chắc muốn xóa cây trồng này?"
                                                onConfirm={() => handleDelete(record.id)}
                                                okText="Có"
                                                cancelText="Không"
                                                placement="leftTop"
                                            >
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    className="h-6 w-6 p-0"
                                                />
                                            </Popconfirm>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredData.length > 0 && (
                        <div className="flex justify-center mt-3">
                            <Pagination
                                total={filteredData.length}
                                showSizeChanger={false}
                                showQuickJumper={false}
                                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total}`}
                                pageSizeOptions={["8", "16"]}
                                defaultPageSize={8}
                                size="small"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MobileListView;
