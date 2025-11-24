"use client";
import Assets from "@/assets";
import CustomForm from "@/components/custom-form";
import { getSignInValidation } from "@/libs/message";
import { useSignIn } from "@/services/hooks/auth/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { Typography, message } from "antd";
import { Lock, LogIn, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "./signin.css";

const { Title, Text } = Typography;

const SigninPage = () => {
  const { signIn, isLoading } = useSignIn();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Redirect to /policy if already authenticated
  useEffect(() => {
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const hasToken = Boolean(user?.token) || Boolean(storedToken);
    const hasRoles = Array.isArray(user?.roles) && user.roles.length > 0;
    const isAuthenticated = hasToken || hasRoles;

    if (isAuthenticated) {
      router.push("/policy");
    }
  }, [user, router]);

  const onFinish = async (values) => {
    const result = await signIn({
      email: values.email,
      password: values.password,
    });

    if (result.success) {
      message.success(result.message);
      router.push("/policy");
    } else {
      message.error(result.message);
    }
  };

  const fields = [
    {
      name: "email",
      label: "Email hoặc Số điện thoại",
      type: "input",
      placeholder: "Email hoặc Số điện thoại",
      startContent: <User size={14} />,
      rules: [
        { required: true, message: getSignInValidation("IDENTIFIER_REQUIRED") },
      ],
    },
    {
      name: "password",
      label: "Mật khẩu",
      type: "password",
      startContent: <Lock size={14} />,
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
      endContent: <LogIn size={14} />,
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
            Cổng thông tin đối tác bảo hiểm
          </Title>
          <Text className="signin-subtitle">
            Đăng nhập để tiếp tục sử dụng dịch vụ
          </Text>
        </div>

        {/* <div className="signin-google-btn-container">
          <Button
            type="default"
            icon={<GoogleOutlined />}
            className="signin-google-btn"
            loading={isLoading}
          >
            Đăng nhập với Google
          </Button>
        </div>

        <Divider className="signin-divider">hoặc đăng nhập với</Divider> */}

        <CustomForm
          fields={fields}
          onSubmit={onFinish}
          gridColumns="1fr"
          formStyle={{
            background: "transparent",
            padding: 0,
            boxShadow: "none",
          }}
        />

        <div className="signin-forgot">
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </div>

        {/* <div className="signin-signup">
          <div className="signin-signup-text">
            Chưa có tài khoản? <Link href="/sign-up">Đăng ký tại đây</Link>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SigninPage;
