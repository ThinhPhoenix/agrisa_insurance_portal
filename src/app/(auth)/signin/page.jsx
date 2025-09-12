"use client";
import Assets from "@/assets";
import { GoogleOutlined } from "@ant-design/icons";
import { Button, Divider, Typography } from "antd";
import CustomForm from "@/components/custom-form";
import "./signin.css";
import Link from "next/link";
import { Lock, LogIn, User } from "lucide-react";

const { Title, Text } = Typography;

const SigninPage = () => {
  const onFinish = (values) => {
    console.log("Received values of form: ", values);
  };

  const fields = [
    {
      name: "username",
      label: "Tên tài khoản",
      type: "input",
      placeholder: "Tên tài khoản",
      startContent: <User size={15} />,
      rules: [{ required: true, message: "Vui lòng nhập tên tài khoản!" }],
    },
    {
      name: "password",
      label: "Mật khẩu",
      type: "password",
      startContent: <Lock size={15} />,
      placeholder: "Mật khẩu",
      rules: [{ required: true, message: "Vui lòng nhập mật khẩu!" }],
    },
    {
      name: "signin",
      type: "button",
      variant: "primary",
      isSubmit: true,
      endContent: <LogIn size={15} />,
      buttonText: "Đăng nhập",
    },
  ];

  return (
    <div className="signin-main">
      <div className="signin-form-container">
        <div className="signin-header">
          <img
            src={Assets.Agrisa.src}
            alt="Agrisa Logo"
            className="signin-logo"
          />
          <Title level={3} className="signin-title">
            Chào mừng bạn trở lại Agrisa
          </Title>
          <Text className="signin-subtitle">
            Đăng nhập để tiếp tục sử dụng dịch vụ
          </Text>
        </div>

        <div className="signin-google-btn-container">
          <Button
            type="default"
            icon={<GoogleOutlined />}
            className="signin-google-btn"
          >
            Đăng nhập với Google
          </Button>
        </div>

        <Divider className="signin-divider">hoặc đăng nhập với</Divider>

        <CustomForm
          fields={fields}
          onSubmit={onFinish}
          gridColumns="1fr"
          labelPlacement="left"
          formStyle={{
            background: "transparent",
            padding: 0,
            boxShadow: "none",
          }}
        />

        <div className="signin-forgot">
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </div>

        <div className="signin-signup">
          <div className="signin-signup-text">
            Chưa có tài khoản? <Link href="/signup">Đăng ký tại đây</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
