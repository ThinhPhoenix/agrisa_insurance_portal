import { CustomForm } from "@/components/custom-form";
import { useCreateEmployee } from "@/services/hooks/profile/use-create-employee";
import { UserAddOutlined } from "@ant-design/icons";
import { message, Modal, Space } from "antd";
import { useEffect, useRef, useState } from "react";

export default function CreateEmployeeModal({ visible, onClose, onSuccess }) {
  const formRef = useRef();
  const { createEmployee, isLoading } = useCreateEmployee();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && formRef.current) {
      formRef.current.resetFields();
    }
  }, [visible]);

  const handleSubmit = async (values) => {
    setSubmitting(true);

    const result = await createEmployee({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      national_id: values.national_id,
      date_of_birth: values.date_of_birth
        ? values.date_of_birth.format("YYYY-MM-DD")
        : "",
      gender: values.gender,
      address: values.address,
    });

    if (result.success) {
      message.success(result.message);
      formRef.current?.resetFields();
      onSuccess && onSuccess(result.data);
      onClose();
    } else {
      message.error(result.message);
    }

    setSubmitting(false);
  };

  const fields = [
    {
      type: "input",
      name: "full_name",
      label: "Họ và tên",
      placeholder: "Nguyễn Văn A",
      gridColumn: "1 / -1",
      required: true,
      rules: [
        { required: true, message: "Vui lòng nhập họ và tên nhân viên!" },
        { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự!" },
        {
          pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
          message: "Họ và tên chỉ được chứa chữ cái và khoảng trắng!",
        },
      ],
    },
    {
      type: "input",
      name: "email",
      label: "Email",
      placeholder: "employee@example.com",
      required: true,
      rules: [
        { required: true, message: "Vui lòng nhập email!" },
        { type: "email", message: "Email không hợp lệ!" },
      ],
    },
    {
      type: "input",
      name: "phone",
      label: "Số điện thoại",
      placeholder: "0987654321",
      required: true,
      rules: [
        { required: true, message: "Vui lòng nhập số điện thoại!" },
        { min: 10, message: "Số điện thoại phải có ít nhất 10 ký tự!" },
        {
          pattern: /^(\+84|0)[3|5|7|8|9][0-9]{8}$/,
          message:
            "Số điện thoại không hợp lệ! (VD: 0987654321 hoặc +84987654321)",
        },
      ],
    },
    {
      type: "input",
      name: "national_id",
      label: "Số CCCD/CMND",
      placeholder: "051204000055",
      required: true,
      rules: [
        { required: true, message: "Vui lòng nhập số CCCD/CMND!" },
        {
          pattern: /^[0-9]{9,12}$/,
          message: "Số CCCD/CMND phải có 9-12 chữ số!",
        },
      ],
    },
    {
      type: "datepicker",
      name: "date_of_birth",
      label: "Ngày sinh",
      placeholder: "Chọn ngày sinh",
      dateFormat: "DD/MM/YYYY",
      required: true,
      rules: [
        { required: true, message: "Vui lòng chọn ngày sinh!" },
        {
          validator: (_, value) => {
            if (!value) return Promise.resolve();

            const today = new Date();
            const birthDate = new Date(value);
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();

            // Check if user is at least 18 years old
            const isAdult = age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

            if (!isAdult) {
              return Promise.reject(new Error("Nhân viên phải từ 18 tuổi trở lên!"));
            }
            return Promise.resolve();
          },
        },
      ],
    },
    {
      type: "select",
      name: "gender",
      label: "Giới tính",
      placeholder: "Chọn giới tính",
      required: true,
      options: [
        { value: "male", label: "Nam" },
        { value: "female", label: "Nữ" },
        { value: "other", label: "Khác" },
      ],
      rules: [{ required: true, message: "Vui lòng chọn giới tính!" }],
    },
    {
      type: "textarea",
      name: "address",
      label: "Địa chỉ",
      placeholder: "Nhập địa chỉ đầy đủ",
      rows: 2,
      gridColumn: "1 / -1",
      required: true,
      rules: [
        { required: true, message: "Vui lòng nhập địa chỉ!" },
        { min: 5, message: "Địa chỉ phải có ít nhất 5 ký tự!" },
      ],
    },
    {
      type: "password",
      name: "password",
      label: "Mật khẩu",
      placeholder: "Nhập mật khẩu",
      required: true,
      rules: [
        { required: true, message: "Vui lòng nhập mật khẩu!" },
        {
          min: 8,
          message: "Mật khẩu phải có ít nhất 8 ký tự!",
        },
      ],
    },
    {
      type: "password",
      name: "confirm_password",
      label: "Xác nhận mật khẩu",
      placeholder: "Nhập lại mật khẩu",
      required: true,
      dependencies: ["password"],
      rules: [
        { required: true, message: "Vui lòng xác nhận mật khẩu!" },
        {
          validator: (_, value) => {
            const formValues = formRef.current?.getFieldsValue();
            if (!value || formValues?.password === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
          },
        },
      ],
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined style={{ color: "#1890ff" }} />
          <span>Tạo tài khoản nhân viên</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      okText="Tạo tài khoản"
      cancelText="Hủy"
      okButtonProps={{
        loading: submitting || isLoading,
        icon: <UserAddOutlined />,
      }}
      onOk={() => formRef.current?.submit()}
      width={600}
    >
      <CustomForm
        ref={formRef}
        fields={fields}
        onSubmit={handleSubmit}
        gridColumns="1fr 1fr"
        gap="16px"
      />
    </Modal>
  );
}
