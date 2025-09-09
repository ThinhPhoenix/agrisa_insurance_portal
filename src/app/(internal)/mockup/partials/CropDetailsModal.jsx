import { EditOutlined } from "@ant-design/icons";
import { Avatar, Button, Divider, Grid, Modal, Tag } from "antd";
import { formatDate, formatYield, getCropTypeColor, getWaterRequirementColor } from "../usecase/mockupUseCase";

const { useBreakpoint } = Grid;

const CropDetailsModal = ({
    detailsModalVisible,
    detailsRecord,
    closeDetailsModal,
    handleEdit
}) => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <Modal
            title={detailsRecord?.name}
            open={detailsModalVisible}
            onCancel={closeDetailsModal}
            footer={[
                <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
                    closeDetailsModal();
                    handleEdit(detailsRecord);
                }}>
                    Chỉnh sửa
                </Button>,
                <Button key="close" onClick={closeDetailsModal}>
                    Đóng
                </Button>
            ]}
            width={isMobile ? "95%" : 700}
            centered={!isMobile}
            bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
        >
            {detailsRecord && (
                <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex flex-col md:flex-row gap-6'}`}>
                    <div className={`${isMobile ? 'w-full text-center' : 'w-full md:w-1/3'}`}>
                        <div className="flex flex-col items-center">
                            <Avatar src={detailsRecord.avatar} size={isMobile ? 80 : 120} className="mb-4" />
                            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-1`}>{detailsRecord.name}</h3>
                            <p className="text-gray-500 mb-3">{detailsRecord.profile.firstName}</p>
                            <Tag color="blue" className="mb-2">{detailsRecord.username}</Tag>
                            <p className="text-xs text-gray-400">ID: {detailsRecord.id.substring(0, 8)}...</p>
                        </div>
                    </div>

                    <div className={`${isMobile ? 'w-full' : 'w-full md:w-2/3'}`}>
                        <Divider orientation="left" className={isMobile ? 'text-sm' : ''}>Thông tin canh tác</Divider>

                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
                            <div>
                                <p className="text-gray-500 mb-1">Loại cây:</p>
                                <p className="font-medium">
                                    <Tag color={getCropTypeColor(detailsRecord.cropDetails.type)}>
                                        {detailsRecord.cropDetails.type}
                                    </Tag>
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-1">Nhu cầu nước:</p>
                                <p className="font-medium">
                                    <Tag color={getWaterRequirementColor(detailsRecord.cropDetails.waterRequirement)}>
                                        {detailsRecord.cropDetails.waterRequirement}
                                    </Tag>
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-1">Tháng trồng:</p>
                                <p className="font-medium">{detailsRecord.cropDetails.plantingMonth}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-1">Tháng thu hoạch:</p>
                                <p className="font-medium">{detailsRecord.cropDetails.harvestMonth}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-1">Năng suất:</p>
                                <p className="font-medium text-green-600">{formatYield(detailsRecord.cropDetails.yieldPerAcre)}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-1">Ngày tạo:</p>
                                <p className="font-medium">{formatDate(detailsRecord.createdAt)}</p>
                            </div>
                        </div>

                        <Divider orientation="left" className={isMobile ? 'text-sm mt-4' : 'mt-6'}>Thông tin chi tiết</Divider>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p className="text-gray-500 mb-1">Tên giống:</p>
                                <p className="font-medium">{detailsRecord.profile.firstName}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-1">Mô tả:</p>
                                <p className="font-medium">{detailsRecord.profile.lastName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CropDetailsModal;
