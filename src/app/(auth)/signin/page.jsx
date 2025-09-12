"use client";
import Assets from "@/assets";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/libs/message/commonMessage";
import "@/styles/signin.css";
import { GoogleOutlined, LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, Radio, Typography, message } from "antd";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

const SigninPage = () => {
    const [loginType, setLoginType] = useState('email');
    const [googleIconLoaded, setGoogleIconLoaded] = useState(false);

    // Use auth hook
    const { signIn, isLoading } = useAuth();

    useEffect(() => {
        const img = new Image();
        img.onload = () => setGoogleIconLoaded(true);
        img.src = "https://www.svgrepo.com/show/303108/google-icon-logo.svg";
    }, []);

    const onFinish = async (values) => {
        try {
            // Call auth hook to handle validation, API and state update
            const result = await signIn(
                values.identifier,
                values.password,
                loginType
            );

            if (result.success) {
                message.success(result.message);
                // TODO: Redirect to dashboard or home
                console.log('Login successful:', result.data);
            } else {
                // Handle validation errors
                if (result.errors) {
                    result.errors.forEach(error => message.error(error.message));
                } else {
                    message.error(result.message);
                }
            }
        } catch (error) {
            message.error(getErrorMessage('GENERIC_ERROR'));
            console.error('Unexpected error:', error);
        }
    };

    return (
        <div className="min-h-screen flex bg-secondary-100 signin-container">
            {/* Left side - Background Image with Overlay */}
            <div className="hidden lg:block lg:w-2/5 relative">
                <img
                    src="https://vca.org.vn/upload/images/2020/20_5_2020/26.5.4.jpg"
                    alt="Agriculture Background"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Right side - Form */}
            <div className="flex-1 lg:w-3/5 flex flex-col">
                {/* Header */}
                <header className="w-full py-4 px-6 border-b border-secondary-200">
                    <div className="flex justify-end items-center max-w-6xl mx-auto">
                        <nav className="hidden md:flex items-center space-x-8">
                            <a
                                href="/"
                                className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                            >
                                Trang chủ
                            </a>
                            <a
                                href="/about"
                                className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                            >
                                Về chúng tôi
                            </a>
                            <a
                                href="/pricing"
                                className="text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                            >
                                Bảng giá
                            </a>
                        </nav>
                    </div>
                </header>

                {/* TODO: Wait Custom Form by Thinh */}

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md p-6 backdrop-blur-sm rounded-lg">
                        {/* Title */}
                        <div className="flex flex-col items-center justify-center mb-6 space-y-4 signin-title-section">
                            <img
                                src={Assets.Agrisa.src}
                                alt="Agrisa Logo"
                                className="h-20 w-auto"
                            />
                            <Title level={3} className="text-primary-900">
                                Chào mừng bạn trở lại Agrisa
                            </Title>
                            <Text className="text-primary-600">
                                Đăng nhập để tiếp tục sử dụng dịch vụ
                            </Text>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="mb-6">
                            <Button
                                type="default"
                                icon={
                                    googleIconLoaded ? (
                                        <img
                                            src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
                                            alt="Google"
                                            className="google-logo-icon"
                                            onLoad={() => setGoogleIconLoaded(true)}
                                            onError={() => setGoogleIconLoaded(false)}
                                        />
                                    ) : (
                                        <GoogleOutlined className="google-icon" />
                                    )
                                }
                                size="large"
                                className="w-full flex items-center justify-center gap-2 border border-primary-300 rounded-md transition-colors google-login-btn"
                                onClick={() => {
                                    if (!googleIconLoaded) {
                                        // Try to load the image when button is clicked
                                        const img = new Image();
                                        img.onload = () => setGoogleIconLoaded(true);
                                        img.src = "https://www.svgrepo.com/show/303108/google-icon-logo.svg";
                                    }
                                }}
                            >
                                Đăng nhập với Google
                            </Button>
                        </div>

                        {/* Divider */}
                        <Divider className="text-primary-400">hoặc đăng nhập với</Divider>

                        {/* Form */}
                        <Form
                            name="signin"
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="on"
                            requiredMark={false}
                            id="signin-form"
                        >
                            {/* Login Type Selection */}
                            <Form.Item className="text-center">
                                <Radio.Group
                                    value={loginType}
                                    onChange={(e) => setLoginType(e.target.value)}
                                    className="justify-center"
                                >
                                    <Radio value="email" className="mr-4">Email</Radio>
                                    <Radio value="phone">Số điện thoại</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                name="identifier"
                                rules={[
                                    {
                                        required: true,
                                        message: loginType === 'email' ? "Vui lòng nhập email!" : "Vui lòng nhập số điện thoại!"
                                    },
                                    loginType === 'email'
                                        ? { type: 'email', message: 'Email không hợp lệ!' }
                                        : {
                                            pattern: /^(\+84|0)[3-9]\d{8}$/,
                                            message: 'Số điện thoại không hợp lệ! (VD: 0987654321 hoặc +84987654321)'
                                        }
                                ]}
                            >
                                <Input
                                    prefix={
                                        loginType === 'email'
                                            ? <MailOutlined className="text-primary-400" />
                                            : <PhoneOutlined className="text-primary-400" />
                                    }
                                    placeholder={loginType === 'email' ? "Email" : "Số điện thoại"}
                                    size="large"
                                    className="rounded-md"
                                    autoComplete={loginType === 'email' ? "email" : "tel"}
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                                className="mb-2"
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-primary-400" />}
                                    placeholder="Mật khẩu"
                                    size="large"
                                    className="rounded-md"
                                    autoComplete="current-password"
                                />
                            </Form.Item>

                            {/* Forgot Password Link */}
                            <div className="text-right mb-4">
                                <a
                                    href="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-800"
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={isLoading}
                                    className="w-full rounded-md bg-primary-500 hover:bg-primary-600 transition-all btn-signin"
                                >
                                    Đăng nhập
                                </Button>
                            </Form.Item>
                        </Form>

                        {/* Sign Up Link */}
                        <div className="text-center">
                            <Text className="text-primary-600">
                                Chưa có tài khoản?{" "}
                                <a
                                    href="/signup"
                                    className="font-medium text-primary-500 hover:text-primary-700"
                                >
                                    Đăng ký tại đây
                                </a>
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Footer Links */}
                <footer className="w-full py-4 px-6 border-t border-secondary-200">
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-500 max-w-6xl mx-auto">
                        <a href="/legal/help" className="hover:text-primary-700 transition-colors">
                            Trợ giúp
                        </a>
                        <a href="/legal/contact" className="hover:text-primary-700 transition-colors">
                            Liên hệ
                        </a>
                        <a href="/legal/terms-of-services" className="hover:text-primary-700 transition-colors">
                            Điều khoản sử dụng
                        </a>
                        <a href="/legal/privacy-policy" className="hover:text-primary-700 transition-colors">
                            Chính sách bảo mật
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SigninPage;