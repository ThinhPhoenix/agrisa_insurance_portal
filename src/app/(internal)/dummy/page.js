"use client";

import CustomForm from "@/components/custom-form";
import CustomTable from "@/components/custom-table";
import SelectedColumn from "@/components/selected-column";
import { Button, Collapse, Tag } from "antd";
import { BrushCleaning, Delete, Edit, Eye, Search } from "lucide-react";
import { useState } from "react";

const DummyPage = () => {
  // Columns for the table (đã thêm các cột mới: Email, Số điện thoại, Địa chỉ, Ngày sinh, Ghi chú)
  const columns = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      width: 120,
      ellipsis: true,
      render: (text) => (
        <span title={text} className="inline-block max-w-full">
          {text}
        </span>
      ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Thời gian đặt",
      dataIndex: "bookingTime",
      key: "bookingTime",
      width: 200,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusMap = {
          new: <Tag color="blue">Mới</Tag>,
          processing: <Tag color="orange">Đang xử lý</Tag>,
          completed: <Tag color="green">Hoàn thành</Tag>,
          canceled: <Tag color="red">Hủy</Tag>,
        };
        return statusMap[status] || status;
      },
    },
    {
      title: "Kích hoạt",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (active) => (active ? "Có" : "Không"),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
      ellipsis: true,
      render: (text) => (
        <span title={text} className="inline-block max-w-full">
          {text}
        </span>
      ),
    },
    {
      title: "Ngày sinh",
      dataIndex: "dob",
      key: "dob",
      width: 120,
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 300,
      ellipsis: true,
      render: (text) => (
        <span title={text} className="inline-block max-w-full">
          {text}
        </span>
      ),
    },
    {
      title: "Hành động",
      fixed: "right",
      key: "action",
      width: 150,
      render: () => (
        <div className="flex gap-2">
          <Button
            type="dashed"
            size="small"
            className="!bg-blue-100 !border-blue-200 !text-blue-800 hover:!bg-blue-200"
          >
            <Eye size={14} />
          </Button>
          <Button
            type="dashed"
            size="small"
            className="!bg-orange-100 !border-orange-200 !text-orange-800 hover:!bg-orange-200"
          >
            <Edit size={14} />
          </Button>
          <Button
            type="dashed"
            size="small"
            className="!bg-red-100 !border-red-200 !text-red-800 hover:!bg-red-200"
          >
            <Delete size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((col) => col.dataIndex)
  );

  const fields = [
    {
      name: "id",
      label: "Mã",
      type: "input",
      placeholder: "Mã",
    },
    {
      name: "name",
      label: "Tên",
      type: "input",
      placeholder: "Tên",
    },
    {
      name: "booking-time",
      label: "Thời gian đặt",
      type: "daterangepicker",
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "combobox",
      placeholder: "Chọn trạng thái",
      options: [
        { label: "Mới", value: "new" },
        { label: "Đang xử lý", value: "processing" },
        { label: "Hoàn thành", value: "completed" },
        { label: "Hủy", value: "canceled" },
      ],
    },
    {
      name: "active",
      label: "Kích hoạt",
      type: "switch",
      initialValue: true,
    },
    {
      name: "search",
      label: " ",
      type: "button",
      variant: "primary",
      buttonText: "Tìm kiếm",
      startContent: <Search size={14} />,
      isSubmit: true,
    },
    {
      name: "clear",
      label: " ",
      type: "button",
      variant: "dashed",
      startContent: <BrushCleaning size={14} />,
      buttonText: "Xóa bộ lọc",
    },
  ];

  // Sample data for testing (đã mở rộng với nhiều dữ liệu và cột mới)
  const dataSource = [
    {
      key: "1",
      id: "001dfsdfsfsdfsdfsfdsfds",
      name: "Nguyễn Văn A",
      bookingTime: "2023-10-01 tới 2023-10-05",
      status: "new",
      active: true,
      email: "nguyenvana@example.com",
      phone: "0123456789",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      dob: "1990-01-01",
      notes: "Khách hàng thân thiết, ưu tiên xử lý nhanh.",
    },
    {
      key: "2",
      id: "002dsasasasdadasasdadsadas",
      name: "Trần Thị B",
      bookingTime: "2023-10-10 tới 2023-10-15",
      status: "processing",
      active: false,
      email: "tranthib@example.com",
      phone: "0987654321",
      address: "456 Đường XYZ, Quận 2, TP.HCM",
      dob: "1985-05-15",
      notes: "Yêu cầu hỗ trợ thêm về bảo hiểm.",
    },
    {
      key: "3",
      id: "003",
      name: "Lê Văn C",
      bookingTime: "2023-10-20 tới 2023-10-25",
      status: "completed",
      active: true,
      email: "levanc@example.com",
      phone: "0111111111",
      address: "789 Đường DEF, Quận 3, TP.HCM",
      dob: "1992-12-10",
      notes: "Hoàn thành thành công, không có vấn đề.",
    },
    {
      key: "4",
      id: "004",
      name: "Phạm Thị D",
      bookingTime: "2023-11-01 tới 2023-11-05",
      status: "canceled",
      active: true,
      email: "phamthid@example.com",
      phone: "0222222222",
      address: "101 Đường GHI, Quận 4, TP.HCM",
      dob: "1988-07-20",
      notes: "Hủy do thay đổi kế hoạch.",
    },
    {
      key: "5",
      id: "005",
      name: "Hoàng Văn E",
      bookingTime: "2023-11-10 tới 2023-11-15",
      status: "new",
      active: false,
      email: "hoangvane@example.com",
      phone: "0333333333",
      address: "202 Đường JKL, Quận 5, TP.HCM",
      dob: "1995-03-30",
      notes: "Khách hàng mới, cần hướng dẫn chi tiết.",
    },
    {
      key: "6",
      id: "006",
      name: "Đỗ Thị F",
      bookingTime: "2023-11-20 tới 2023-11-25",
      status: "processing",
      active: true,
      email: "dothif@example.com",
      phone: "0444444444",
      address: "303 Đường MNO, Quận 6, TP.HCM",
      dob: "1980-09-05",
      notes: "Đang xử lý yêu cầu bổ sung.",
    },
    {
      key: "7",
      id: "007",
      name: "Vũ Văn G",
      bookingTime: "2023-12-01 tới 2023-12-05",
      status: "completed",
      active: true,
      email: "vuvang@example.com",
      phone: "0555555555",
      address: "404 Đường PQR, Quận 7, TP.HCM",
      dob: "1993-11-12",
      notes: "Hoàn thành, gửi xác nhận qua email.",
    },
    {
      key: "8",
      id: "008",
      name: "Bùi Thị H",
      bookingTime: "2023-12-10 tới 2023-12-15",
      status: "new",
      active: false,
      email: "buithih@example.com",
      phone: "0666666666",
      address: "505 Đường STU, Quận 8, TP.HCM",
      dob: "1987-04-18",
      notes: "Chờ xác nhận từ khách hàng.",
    },
    {
      key: "9",
      id: "009",
      name: "Nguyễn Thị I",
      bookingTime: "2023-12-16 tới 2023-12-20",
      status: "processing",
      active: true,
      email: "nguyenthii@example.com",
      phone: "0777777777",
      address: "606 Đường VWX, Quận 9, TP.HCM",
      dob: "1991-06-25",
      notes: "Đang xử lý hồ sơ bảo hiểm.",
    },
    {
      key: "10",
      id: "010",
      name: "Lý Văn J",
      bookingTime: "2023-12-21 tới 2023-12-25",
      status: "completed",
      active: false,
      email: "lyvanj@example.com",
      phone: "0888888888",
      address: "707 Đường YZ, Quận 10, TP.HCM",
      dob: "1989-08-14",
      notes: "Hoàn thành xử lý, đã thanh toán.",
    },
    {
      key: "11",
      id: "011",
      name: "Cao Thị K",
      bookingTime: "2024-01-01 tới 2024-01-05",
      status: "new",
      active: true,
      email: "caothik@example.com",
      phone: "0999999999",
      address: "808 Đường ABC, Quận 11, TP.HCM",
      dob: "1994-02-28",
      notes: "Khách hàng mới đăng ký.",
    },
    {
      key: "12",
      id: "012",
      name: "Đinh Văn L",
      bookingTime: "2024-01-06 tới 2024-01-10",
      status: "canceled",
      active: false,
      email: "dinhvanl@example.com",
      phone: "0101010101",
      address: "909 Đường DEF, Quận 12, TP.HCM",
      dob: "1986-10-03",
      notes: "Hủy do không đủ điều kiện.",
    },
    {
      key: "13",
      id: "013",
      name: "Mai Thị M",
      bookingTime: "2024-01-11 tới 2024-01-15",
      status: "processing",
      active: true,
      email: "maithim@example.com",
      phone: "0121212121",
      address: "1010 Đường GHI, Bình Thạnh, TP.HCM",
      dob: "1992-12-07",
      notes: "Đang chờ thẩm định hồ sơ.",
    },
  ];

  return (
    <div className="space-y-2">
      <Collapse
        size="small"
        items={[
          {
            key: "1",
            label: (
              <p className="flex items-center gap-2">
                <Search size={16} />
                Bộ lọc & Tìm kiếm
              </p>
            ),
            children: (
              <CustomForm
                fields={fields}
                gridColumns="1fr 1fr 1fr 1fr"
                gap="10px"
              />
            ),
          },
        ]}
      />

      <div className="overflow-x-auto">
        <div className="flex justify-end items-center gap-2 mb-2">
          <SelectedColumn
            columns={columns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
        </div>

        <CustomTable
          dataSource={dataSource}
          columns={columns}
          visibleColumns={visibleColumns}
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
};

export default DummyPage;
