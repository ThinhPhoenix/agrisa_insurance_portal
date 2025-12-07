"use client";

import { useSubscribe } from "@/services/hooks/noti/use-subscribe";
import { useUnsubscribe } from "@/services/hooks/noti/use-unsubscribe";
import { useValidateSubscription } from "@/services/hooks/noti/use-validate";
import {
    CheckCircleOutlined,
    CloudServerOutlined,
    DatabaseOutlined,
    ExclamationCircleOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import {
    Badge,
    Card,
    Col,
    Divider,
    List,
    Row,
    Space,
    Statistic,
    Switch,
    Tag,
    Typography,
} from "antd";
import { useEffect, useState } from "react";
import configurationData from "../../../../libs/mockdata/assessment_configuration.json";
import "../insurance-configuration.css";

const { Title, Text, Paragraph } = Typography;

export default function SystemOverviewPage() {
    const { system_info } =
        configurationData.insurance_assessment_configuration;

    const [enableNotifications, setEnableNotifications] = useState(false);
    const [validating, setValidating] = useState(true);
    const { subscribe } = useSubscribe();
    const { unsubscribe } = useUnsubscribe();
    const { validate } = useValidateSubscription();

    const urlBase64ToUint8Array = (base64String) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    useEffect(() => {
        const checkValidation = async () => {
            setValidating(true);
            const result = await validate();
            if (result.success && result.data) {
                setEnableNotifications(result.data.value);
            } else {
                setEnableNotifications(false);
            }
            setValidating(false);
        };
        checkValidation();
    }, []); // Chỉ chạy một lần khi mount

    const handleNotificationToggle = async (checked) => {
        console.log("=== Toggling notifications to:", checked);

        if (checked) {
            // Subscribe
            if (!"serviceWorker" in navigator) {
                console.error("Service Worker not supported");
                setEnableNotifications(false);
                return;
            }

            if (!"PushManager" in window) {
                console.error("Push Manager not supported");
                setEnableNotifications(false);
                return;
            }

            try {
                // Request permission if not granted
                console.log("Current permission:", Notification.permission);
                if (Notification.permission !== "granted") {
                    console.log("Requesting notification permission...");
                    const permission = await Notification.requestPermission();
                    console.log("Permission result:", permission);
                    if (permission !== "granted") {
                        console.error("Notification permission denied");
                        setEnableNotifications(false);
                        return;
                    }
                }

                console.log("Registering service worker...");
                const registration = await navigator.serviceWorker.register(
                    "/sw.js"
                );
                await navigator.serviceWorker.ready;
                console.log(
                    "Service worker registered and ready:",
                    registration
                );

                // Check if already subscribed
                let subscription =
                    await registration.pushManager.getSubscription();

                if (!subscription) {
                    console.log(
                        "No existing subscription, creating new one..."
                    );
                    console.log(
                        "VAPID key:",
                        process.env.NEXT_PUBLIC_VAPID_KEY
                    );

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(
                            process.env.NEXT_PUBLIC_VAPID_KEY
                        ),
                    });
                    console.log("New subscription created:", subscription);
                } else {
                    console.log("Using existing subscription:", subscription);
                }

                console.log("Subscription endpoint:", subscription.endpoint);

                // Convert ArrayBuffer keys to base64 strings
                const subscriptionData = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64(
                            subscription.getKey("p256dh")
                        ),
                        auth: arrayBufferToBase64(subscription.getKey("auth")),
                    },
                };

                console.log("Subscription data prepared:", subscriptionData);
                console.log("Calling subscribe hook...");
                const result = await subscribe(subscriptionData);
                console.log("Subscribe result:", result);

                if (result.success) {
                    setEnableNotifications(true);
                } else {
                    setEnableNotifications(false);
                }
            } catch (error) {
                console.error("Subscription failed with error:", error);
                console.error("Error stack:", error.stack);
                setEnableNotifications(false);
            }
        } else {
            // Unsubscribe
            try {
                console.log("=== Unsubscribing...");
                const result = await unsubscribe();
                console.log("Unsubscribe result:", result);

                if (result.success) {
                    setEnableNotifications(false);
                }
            } catch (error) {
                console.error("Unsubscription failed:", error);
            }
        }
    };

    // Transform the data to match the expected structure
    const system_overview = {
        system_info: {
            version: system_info.version,
            database_version: "PostgreSQL 14.2",
            environment: "Production",
            last_updated: system_info.last_updated,
        },
        data_sources: [
            {
                name: "Vệ tinh Quan sát Trái đất",
                status: "hoạt động",
                description:
                    "Dữ liệu ảnh vệ tinh từ Landsat, Sentinel và các nguồn khác",
                last_sync: "2024-09-27T10:30:00Z",
            },
            {
                name: "API Thời tiết",
                status: "hoạt động",
                description: "Dữ liệu thời tiết thời gian thực và dự báo",
                last_sync: "2024-09-27T11:00:00Z",
            },
            {
                name: "Cơ sở dữ liệu Đất",
                status: "hoạt động",
                description:
                    "Thông tin về chất lượng đất và đặc tính nông nghiệp",
                last_sync: "2024-09-27T09:15:00Z",
            },
        ],
        compliance_standards: system_info.compliance_standards.map(
            (standard) => ({
                standard_name: standard,
                compliance_level: "cao",
                description: `Tuân thủ tiêu chuẩn ${standard} cho đánh giá rủi ro nông nghiệp`,
                version: "2024.1",
            })
        ),
    };

    const systemInfoCards = [
        {
            title: "Phiên bản Hệ thống",
            value: system_overview.system_info.version,
            icon: <SettingOutlined />,
            color: "#1890ff",
        },
        {
            title: "Cơ sở Dữ liệu",
            value: system_overview.system_info.database_version,
            icon: <DatabaseOutlined />,
            color: "#52c41a",
        },
        {
            title: "Môi trường",
            value: system_overview.system_info.environment,
            icon: <CloudServerOutlined />,
            color: "#722ed1",
        },
        {
            title: "Cập nhật lần cuối",
            value: new Date(
                system_overview.system_info.last_updated
            ).toLocaleDateString("vi-VN"),
            icon: <CheckCircleOutlined />,
            color: "#fa8c16",
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "hoạt động":
                return "success";
            case "bảo trì":
                return "warning";
            case "lỗi":
                return "error";
            default:
                return "default";
        }
    };

    const getComplianceIcon = (level) => {
        switch (level) {
            case "cao":
                return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
            case "trung bình":
                return (
                    <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                );
            case "thấp":
                return (
                    <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
                );
            default:
                return <SafetyCertificateOutlined />;
        }
    };

    return (
        <div className="system-overview-container">
            {/* System Info Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                {systemInfoCards.map((card, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card className="system-info-card">
                            <Statistic
                                title={card.title}
                                value={card.value}
                                prefix={
                                    <span style={{ color: card.color }}>
                                        {card.icon}
                                    </span>
                                }
                                valueStyle={{ color: card.color }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                {/* Data Sources */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <DatabaseOutlined />
                                <span>Nguồn Dữ liệu</span>
                            </Space>
                        }
                        className="data-sources-card"
                    >
                        <List
                            dataSource={system_overview.data_sources}
                            renderItem={(source) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                <Text strong>
                                                    {source.name}
                                                </Text>
                                                <Tag
                                                    color={getStatusColor(
                                                        source.status
                                                    )}
                                                >
                                                    {source.status}
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <div>
                                                <Paragraph
                                                    ellipsis={{ rows: 2 }}
                                                >
                                                    {source.description}
                                                </Paragraph>
                                                <Text type="secondary">
                                                    Cập nhật:{" "}
                                                    {new Date(
                                                        source.last_sync
                                                    ).toLocaleString("vi-VN", {
                                                        timeZone:
                                                            "Asia/Ho_Chi_Minh",
                                                    })}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* Compliance Standards */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <SafetyCertificateOutlined />
                                <span>Tiêu chuẩn Tuân thủ</span>
                            </Space>
                        }
                        className="compliance-card"
                    >
                        <List
                            dataSource={system_overview.compliance_standards}
                            renderItem={(standard) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={getComplianceIcon(
                                            standard.compliance_level
                                        )}
                                        title={
                                            <Space>
                                                <Text strong>
                                                    {standard.standard_name}
                                                </Text>
                                                <Badge
                                                    count={
                                                        standard.compliance_level
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            standard.compliance_level ===
                                                            "cao"
                                                                ? "#52c41a"
                                                                : standard.compliance_level ===
                                                                  "trung bình"
                                                                ? "#faad14"
                                                                : "#ff4d4f",
                                                    }}
                                                />
                                            </Space>
                                        }
                                        description={
                                            <div>
                                                <Paragraph
                                                    ellipsis={{ rows: 2 }}
                                                >
                                                    {standard.description}
                                                </Paragraph>
                                                <Text type="secondary">
                                                    Phiên bản:{" "}
                                                    {standard.version}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {/* System Configuration Summary */}
            <Row gutter={[16, 16]} className="mt-6">
                <Col span={24}>
                    <Card
                        title={
                            <Space>
                                <SettingOutlined />
                                <span>Tóm tắt Cấu hình Hệ thống</span>
                            </Space>
                        }
                        className="system-config-summary"
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <div className="config-item">
                                    <Title level={5}>Thông tin Hệ thống</Title>
                                    <div className="config-details">
                                        <div className="config-row">
                                            <Text type="secondary">
                                                Phiên bản:
                                            </Text>
                                            <Text strong>
                                                {
                                                    system_overview.system_info
                                                        .version
                                                }
                                            </Text>
                                        </div>
                                        <div className="config-row">
                                            <Text type="secondary">
                                                Môi trường:
                                            </Text>
                                            <Tag color="blue">
                                                {
                                                    system_overview.system_info
                                                        .environment
                                                }
                                            </Tag>
                                        </div>
                                        <div className="config-row">
                                            <Text type="secondary">
                                                Cơ sở dữ liệu:
                                            </Text>
                                            <Text strong>
                                                {
                                                    system_overview.system_info
                                                        .database_version
                                                }
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} md={8}>
                                <div className="config-item">
                                    <Title level={5}>Nguồn Dữ liệu</Title>
                                    <div className="config-details">
                                        <Text type="secondary">
                                            Tổng số nguồn:{" "}
                                            <Text strong>
                                                {
                                                    system_overview.data_sources
                                                        .length
                                                }
                                            </Text>
                                        </Text>
                                        <Divider type="vertical" />
                                        <Text type="secondary">
                                            Hoạt động:{" "}
                                            <Text
                                                strong
                                                style={{ color: "#52c41a" }}
                                            >
                                                {
                                                    system_overview.data_sources.filter(
                                                        (s) =>
                                                            s.status ===
                                                            "hoạt động"
                                                    ).length
                                                }
                                            </Text>
                                        </Text>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} md={8}>
                                <div className="config-item">
                                    <Title level={5}>Tuân thủ</Title>
                                    <div className="config-details">
                                        <Text type="secondary">
                                            Tiêu chuẩn:{" "}
                                            <Text strong>
                                                {
                                                    system_overview
                                                        .compliance_standards
                                                        .length
                                                }
                                            </Text>
                                        </Text>
                                        <Divider type="vertical" />
                                        <Text type="secondary">
                                            Mức cao:{" "}
                                            <Text
                                                strong
                                                style={{ color: "#52c41a" }}
                                            >
                                                {
                                                    system_overview.compliance_standards.filter(
                                                        (s) =>
                                                            s.compliance_level ===
                                                            "cao"
                                                    ).length
                                                }
                                            </Text>
                                        </Text>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title="Cài đặt thông báo" bordered={false}>
                        <Space direction="vertical" size="middle">
                            <div>
                                <Text strong>Bật thông báo đẩy</Text>
                                <br />
                                <Text type="secondary">
                                    Cho phép ứng dụng gửi thông báo đẩy khi có
                                    cập nhật quan trọng.
                                </Text>
                            </div>
                            <Switch
                                checked={enableNotifications}
                                onChange={handleNotificationToggle}
                                checkedChildren="Bật"
                                unCheckedChildren="Tắt"
                                disabled={validating}
                            />
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
