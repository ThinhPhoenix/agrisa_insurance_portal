"use client";
import Assets from "@/assets";
import { GoogleOutlined } from "@ant-design/icons";
import { Button, Divider, Typography, message } from "antd";
import CustomForm from "@/components/custom-form";
import "./signin.css";
import Link from "next/link";
import { Lock, LogIn, User } from "lucide-react";
import { getSignInValidation } from "@/libs/message";
import { useSignIn } from "@/services/hooks/auth/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const { Title, Text } = Typography;

const SigninPage = () => {
  const { signIn, isLoading, error } = useSignIn();
  const router = useRouter();

  const onFinish = async (values) => {
    const result = await signIn({
      identifier: values.identifier,
      password: values.password,
    });

    if (result.success) {
      message.success(result.message);
      router.push("/");
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
      name: "identifier",
      label: "Email hoặc Số điện thoại",
      type: "input",
      placeholder: "Email hoặc Số điện thoại",
      startContent: <User size={15} />,
      rules: [
        { required: true, message: getSignInValidation("IDENTIFIER_REQUIRED") },
      ],
    },
    {
      name: "password",
      label: "Mật khẩu",
      type: "password",
      startContent: <Lock size={15} />,
      placeholder: "Mật khẩu",
      rules: [
        { required: true, message: getSignInValidation("PASSWORD_REQUIRED") },
      ],
    },
    {
      name: "signin",
      type: "button",
      variant: "primary",
      isSubmit: true,
      endContent: <LogIn size={15} />,
      buttonText: "Đăng nhập",
      loading: isLoading,
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
            loading={isLoading}
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
            Chưa có tài khoản? <Link href="/sign-up">Đăng ký tại đây</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
