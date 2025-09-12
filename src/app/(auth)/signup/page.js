"use client";
import Assets from "@/assets";
import { GoogleOutlined } from "@ant-design/icons";
import { Button, Divider, Typography } from "antd";
import CustomForm from "@/components/custom-form";
import "./signup.css";
import Link from "next/link";
import { Lock, LogIn, User, Mail, CheckCircle2, Phone } from "lucide-react";

const { Title, Text } = Typography;

const SignupPage = () => {
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
      name: "email",
      label: "Email",
      type: "input",
      placeholder: "Email",
      startContent: <Mail size={15} />,
      rules: [
        { required: true, message: "Vui lòng nhập email!" },
        { type: "email", message: "Email không hợp lệ!" },
      ],
    },
    {
      name: "phone",
      label: "Số điện thoại",
      type: "input",
      placeholder: "Số điện thoại",
      startContent: <Phone size={15} />,
      rules: [
        { required: true, message: "Vui lòng nhập số điện thoại!" },
        { type: "phone", message: "Số điện thoại không hợp lệ!" },
      ],
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
      name: "confirmPassword",
      label: "Xác nhận mật khẩu",
      type: "password",
      startContent: <Lock size={15} />,
      placeholder: "Xác nhận mật khẩu",
      rules: [
        { required: true, message: "Vui lòng xác nhận mật khẩu!" },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue("password") === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
          },
        }),
      ],
    },
    {
      name: "signup",
      type: "button",
      variant: "primary",
      isSubmit: true,
      endContent: <CheckCircle2 size={15} />,
      buttonText: "Đăng ký",
    },
  ];

  return (
    <div className="signup-main">
      <div className="signup-form-container">
        <div className="signup-header">
          <img
            src={Assets.Agrisa.src}
            alt="Agrisa Logo"
            className="signup-logo"
          />
          <Title level={3} className="signup-title">
            Tạo tài khoản Agrisa
          </Title>
          <Text className="signup-subtitle">
            Đăng ký để bắt đầu sử dụng dịch vụ
          </Text>
        </div>

        <div className="signup-google-btn-container">
          <Button
            type="default"
            icon={<GoogleOutlined />}
            className="signup-google-btn"
          >
            Đăng ký với Google
          </Button>
        </div>

        <Divider className="signup-divider">hoặc đăng ký với</Divider>

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

        <div className="signup-signin">
          <div className="signup-signin-text">
            Đã có tài khoản? <Link href="/signin">Đăng nhập tại đây</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
