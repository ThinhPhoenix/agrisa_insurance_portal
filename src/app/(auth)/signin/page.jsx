"use client";
import Assets from "@/assets";
import { GoogleOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, Typography } from "antd";
import "./signin.css";

const { Title, Text } = Typography;

const SigninPage = () => {
    const onFinish = (values) => {
        console.log('Received values of form: ', values);
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
                {/* <div className="absolute inset-0 bg-gradient-to-b from-primary-900/70 to-primary-500/70 flex flex-col justify-center items-center p-12">
                    <div className="bg-white bg-opacity-95 p-8 rounded-lg shadow-lg max-w-md transform transition-all duration-500 hover:scale-105">
                        <img
                            src={Assets.Agrisa.src}
                            alt="Agrisa Logo"
                            className="h-14 mb-6 mx-auto"
                        />
                        <h2 className="text-primary-500 text-2xl font-bold mb-4 text-center">
                            Nền tảng bảo hiểm nông nghiệp hàng đầu
                        </h2>
                        <p className="text-primary-700 mb-6 text-center">
                            Bảo vệ hoạt động canh tác nông nghiệp của bạn với giải pháp bảo hiểm toàn diện từ Agrisa
                        </p>
                    </div>
                </div> */}
            </div>

            {/* Right side - Form */}
            <div className="flex-1 lg:w-3/5 flex flex-col">
                {/* Header */}
                <header className="w-full py-4 px-6 border-b border-secondary-200">
                    <div className="flex justify-between items-center max-w-6xl mx-auto">
                        <div className="flex items-center">
                            <img
                                src={Assets.Agrisa.src}
                                alt="Agrisa Logo"
                                className="h-10 w-auto"
                            />
                        </div>
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
                        <div className="text-center mb-6">
                            <img
                                src={Assets.Agrisa.src}
                                alt="Agrisa Logo"
                                className="h-12 w-auto mx-auto mb-4 mobile-logo hidden md:hidden lg:hidden sm:block xs:block"
                            />
                            <Title level={3} className="text-primary-900 mb-2">
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
                                icon={<GoogleOutlined />}
                                size="large"
                                className="w-full flex items-center justify-center gap-2 border border-primary-300 rounded-md hover:bg-primary-500 hover:text-secondary-100 transition-colors"
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
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: "Vui lòng nhập tên tài khoản!" }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-primary-400" />}
                                    placeholder="Tên tài khoản"
                                    size="large"
                                    className="rounded-md"
                                    autoComplete="username"
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