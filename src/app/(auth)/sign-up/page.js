"use client";
import Assets from "@/assets";
import { GoogleOutlined } from "@ant-design/icons";
import { Button, Divider, Typography, message } from "antd";
import CustomForm from "@/components/custom-form";
import "./signup.css";
import Link from "next/link";
import { Lock, User, Mail, CheckCircle2, Phone } from "lucide-react";
import { getRegisterValidation } from "@/libs/message";
import { useSignUp } from "@/services/hooks/auth/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title, Text } = Typography;

const SignupPage = () => {
  const { signUp, isLoading, error } = useSignUp();
  const router = useRouter();

  const onFinish = async (values) => {
    const result = await signUp(values);

    if (result.success) {
      message.success(result.message);
      router.push("/sign-in");
    } else {
      message.error(result.message);
    }
  };

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const fields = [
    {
      name: "username",
      label: "Tên tài khoản",
      type: "input",
      placeholder: "Tên tài khoản",
      startContent: <User size={15} />,
      rules: [
        {
          required: true,
          message: getRegisterValidation("FULL_NAME_REQUIRED"),
        },
        { min: 3, message: getRegisterValidation("FULL_NAME_INVALID") },
        {
          pattern: /^[a-zA-Z\s]+$/,
          message: getRegisterValidation("FULL_NAME_INVALID"),
        },
      ],
    },
    {
      name: "email",
      label: "Email",
      type: "input",
      placeholder: "Email",
      startContent: <Mail size={15} />,
      rules: [
        { required: true, message: getRegisterValidation("EMAIL_REQUIRED") },
        { type: "email", message: getRegisterValidation("EMAIL_INVALID") },
      ],
    },
    {
      name: "phone",
      label: "Số điện thoại",
      type: "input",
      placeholder: "Số điện thoại",
      startContent: <Phone size={15} />,
      rules: [
        { required: true, message: getRegisterValidation("PHONE_REQUIRED") },
        {
          pattern: /^(\+84|0)[3|5|7|8|9][0-9]{8}$/,
          message: getRegisterValidation("PHONE_INVALID"),
        },
      ],
    },
    {
      name: "password",
      label: "Mật khẩu",
      type: "password",
      startContent: <Lock size={15} />,
      placeholder: "Mật khẩu",
      rules: [
        { required: true, message: getRegisterValidation("PASSWORD_REQUIRED") },
        { min: 8, message: getRegisterValidation("PASSWORD_TOO_SHORT") },
        {
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message: getRegisterValidation("PASSWORD_TOO_WEAK"),
        },
      ],
    },
    {
      name: "confirmPassword",
      label: "Xác nhận mật khẩu",
      type: "password",
      startContent: <Lock size={15} />,
      placeholder: "Xác nhận mật khẩu",
      rules: [
        {
          required: true,
          message: getRegisterValidation("PASSWORD_CONFIRM_REQUIRED"),
        },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue("password") === value) {
              return Promise.resolve();
            }
            return Promise.reject(
              new Error(getRegisterValidation("PASSWORD_MISMATCH"))
            );
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
      buttonText: isLoading ? "Đang đăng ký..." : "Đăng ký",
      disabled: isLoading,
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
            disabled={isLoading}
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
            Đã có tài khoản? <Link href="/sign-in">Đăng nhập tại đây</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
