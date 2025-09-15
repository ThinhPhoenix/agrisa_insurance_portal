"use client";

import { CustomForm } from "@/components/custom-form";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Layout, Space, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";
import { formatDate, useEditCrop } from "../../hooks/mockup";

const { Title, Text } = Typography;

export default function EditCropPage({ params }) {
    const router = useRouter();
    const { loading, saving, cropData, contextHolder, handleSubmit, filterOptions } = useEditCrop(params.id);

    const handleBack = () => {
        router.push("/mockup");
    };

    // Form fields configuration
    const formFields = [
        {
            name: "avatar",
            label: "Ảnh đại diện",
            type: "file",
            gridColumn: "span 4",
            accept: "image/*",
            placeholder: "Chọn ảnh đại diện cho cây trồng",
        },
        {
            name: "name",
            label: "Tên cây trồng",
            type: "input",
            placeholder: "Nhập tên cây trồng",
            rules: [
                { required: true, message: "Vui lòng nhập tên cây trồng!" },
                { min: 2, message: "Tên cây trồng phải có ít nhất 2 ký tự!" },
            ],
        },
        {
            name: "username",
            label: "Tên người dùng",
            type: "input",
            placeholder: "Nhập tên người dùng",
            rules: [
                { required: true, message: "Vui lòng nhập tên người dùng!" },
                { min: 3, message: "Tên người dùng phải có ít nhất 3 ký tự!" },
            ],
        },
        {
            name: "firstName",
            label: "Tên giống",
            type: "input",
            placeholder: "Nhập tên giống cây trồng",
            rules: [
                { required: true, message: "Vui lòng nhập tên giống!" },
            ],
        },
        {
            name: "lastName",
            label: "Mô tả",
            type: "textarea",
            placeholder: "Nhập mô tả về cây trồng",
            rows: 3,
            gridColumn: "span 2",
        },
        {
            name: "type",
            label: "Loại cây trồng",
            type: "select",
            placeholder: "Chọn loại cây trồng",
            options: filterOptions.cropTypes,
            rules: [
                { required: true, message: "Vui lòng chọn loại cây trồng!" },
            ],
            showSearch: true,
        },
        {
            name: "plantingMonth",
            label: "Tháng trồng",
            type: "select",
            placeholder: "Chọn tháng trồng",
            options: filterOptions.plantingMonths,
            rules: [
                { required: true, message: "Vui lòng chọn tháng trồng!" },
            ],
            showSearch: true,
        },
        {
            name: "harvestMonth",
            label: "Tháng thu hoạch",
            type: "input",
            placeholder: "Nhập tháng thu hoạch",
            rules: [
                { required: true, message: "Vui lòng nhập tháng thu hoạch!" },
            ],
        },
        {
            name: "yieldPerAcre",
            label: "Năng suất (tấn/công)",
            type: "number",
            placeholder: "Nhập năng suất",
            min: 0,
            step: 0.1,
            rules: [
                { required: true, message: "Vui lòng nhập năng suất!" },
                { type: "number", min: 0, message: "Năng suất phải lớn hơn 0!" },
            ],
        },
        {
            name: "waterRequirement",
            label: "Nhu cầu nước",
            type: "select",
            placeholder: "Chọn nhu cầu nước",
            options: filterOptions.waterRequirements,
            rules: [
                { required: true, message: "Vui lòng chọn nhu cầu nước!" },
            ],
        },
        {
            name: "submit",
            label: " ",
            type: "button",
            variant: "primary",
            buttonText: "Cập nhật",
            startContent: <SaveOutlined />,
            isSubmit: true,
            loading: saving,
            gridColumn: "span 2",
        },
        {
            name: "cancel",
            label: " ",
            type: "button",
            variant: "default",
            buttonText: "Hủy",
            onClick: handleBack,
            gridColumn: "span 2",
        },
    ];

    // Prepare initial values for the form
    const initialValues = cropData ? {
        avatar: cropData.avatar,
        name: cropData.name,
        username: cropData.username,
        firstName: cropData.profile?.firstName,
        lastName: cropData.profile?.lastName,
        type: cropData.cropDetails?.type,
        plantingMonth: cropData.cropDetails?.plantingMonth,
        harvestMonth: cropData.cropDetails?.harvestMonth,
        yieldPerAcre: cropData.cropDetails?.yieldPerAcre,
        waterRequirement: cropData.cropDetails?.waterRequirement,
    } : {};

    if (loading) {
        return (
            <Layout.Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </Layout.Content>
        );
    }

    if (!cropData) {
        return (
            <Layout.Content style={{ padding: '24px' }}>
                <Text>Không tìm thấy dữ liệu cây trồng.</Text>
            </Layout.Content>
        );
    }

    return (
        <Layout.Content style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBack}
                            type="text"
                        >
                            Quay lại
                        </Button>
                    </Space>

                    <div>
                        <Title level={3} style={{ marginBottom: 4 }}>
                            Chỉnh sửa cây trồng: {cropData.name}
                        </Title>
                        <Text type="secondary">
                            ID: {cropData.id} • Tạo ngày: {formatDate(cropData.createdAt)}
                        </Text>
                    </div>
                </Space>

                {/* Edit Form */}
                <Card>
                    <CustomForm
                        fields={formFields}
                        initialValues={initialValues}
                        onSubmit={handleSubmit}
                        gridColumns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                        gap="16px"
                        layout="vertical"
                    />
                </Card>
            </Space>
            {contextHolder}
        </Layout.Content>
    );
}