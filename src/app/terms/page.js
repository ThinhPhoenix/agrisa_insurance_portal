"use client";

import {
  ArrowLeftOutlined,
  BankOutlined,
  CloudOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PrinterOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Layout, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Assets from "../../assets";

const { Title, Paragraph, Text } = Typography;
const { Sider, Content } = Layout;

const sections = [
  {
    key: "gioithieu",
    label: "Giới thiệu",
    content: `Agrisa là nền tảng kết nối trung gian giữa nông dân và các công ty bảo hiểm, cung cấp dịch vụ phân phối và quản lý các gói bảo hiểm nông nghiệp.

**AGRISA PLATFORM**

**Agrisa không phải là công ty bảo hiểm** và **không chịu trách nhiệm về các quyết định bảo hiểm, bồi thường hay Tranh chấp**. Tất cả các gói bảo hiểm được cung cấp bởi các đối tác bảo hiểm độc lập, và mọi nghĩa vụ thanh toán, bồi thường đều thuộc trách nhiệm của đối tác bảo hiểm tương ứng.

**Cam kết của chúng tôi là mang lại sự minh bạch, tin cậy và hiệu quả trong việc kết nối nông dân với các giải pháp bảo hiểm phù hợp nhất.**`,
  },
  {
    key: "vai_tro",
    label: "Vai trò & Trách nhiệm",
    content: `**2.1 Vai trò của Agrisa**\n\nAgrisa đóng vai trò là bên cung cấp nền tảng công nghệ và dịch vụ trung gian, bao gồm:\n• Cung cấp không gian để các công ty bảo hiểm đăng tải các gói bảo hiểm của họ\n• Kết nối nông dân với các gói bảo hiểm phù hợp\n• Thu thập và xử lý dữ liệu vệ tinh, thời tiết để phục vụ việc theo dõi và đánh giá rủi ro\n• Cung cấp công cụ quản lý và theo dõi hợp đồng bảo hiểm\n\n**Lưu ý quan trọng:** Agrisa không tham gia vào việc định giá, phê duyệt hay từ chối các yêu cầu bồi thường.\n\n**2.2 Vai trò của Đối tác Bảo hiểm**\n\nCác công ty bảo hiểm là bên **chịu trách nhiệm hoàn toàn** về các gói bảo hiểm của mình, bao gồm:\n• Thiết kế sản phẩm bảo hiểm và xác định mức phí, điều kiện bảo hiểm\n• Xem xét và quyết định phê duyệt hoặc từ chối hồ sơ đăng ký bảo hiểm\n• Xử lý và giải quyết các yêu cầu bồi thường\n• **Thực hiện nghĩa vụ thanh toán bồi thường** cho nông dân\n• Giải quyết mọi tranh chấp phát sinh liên quan đến hợp đồng bảo hiểm\n\n**2.3 Vai trò của Nông dân**\n\nNông dân là người sử dụng dịch vụ để tìm kiếm, lựa chọn và mua các gói bảo hiểm phù hợp, có **trách nhiệm bắt buộc**:\n• Cung cấp thông tin **chính xác và trung thực** về trang trại, diện tích canh tác, loại cây trồng\n• **Thanh toán phí bảo hiểm đầy đủ và đúng hạn**\n• Tuân thủ các điều khoản và điều kiện của hợp đồng bảo hiểm đã ký kết`,
  },
  {
    key: "taikhoan",
    label: "Tài khoản & Xác thực",
    content: `**3.1 Đăng ký tài khoản**\n\n**Quy định nghiêm ngặt:** Mỗi người chỉ được phép tạo **một tài khoản duy nhất** trên nền tảng Agrisa. Tài khoản phải được xác định bằng:\n• Số điện thoại đã xác thực\n• Địa chỉ email hợp lệ\n• Giấy tờ tùy thân đã được kiểm tra xác thực\n\n**Nghiêm cấm:** Tạo nhiều tài khoản cho cùng một người hoặc sử dụng thông tin giả mạo.\n\n**3.2 Xác thực danh tính**\n\n**Bắt buộc:** Trước khi có thể đăng ký bảo hiểm hoặc thực hiện thanh toán, nông dân **phải hoàn tất quy trình xác thực danh tính điện tử** thông qua đối tác xác thực của chúng tôi.\n\n• Việc xác thực chỉ cần thực hiện **một lần duy nhất** cho mỗi tài khoản\n• Trong trường hợp xác thực không thành công, nông dân có thể được yêu cầu xác thực bằng phương thức thay thế\n\n**3.3 Bảo mật tài khoản**\n\nNgười dùng có **trách nhiệm bảo mật** thông tin đăng nhập của mình. Hệ thống sẽ tự động đăng xuất sau một khoảng thời gian không sử dụng để đảm bảo an toàn.\n\n**Quan trọng:** Mọi hành động quan trọng trên nền tảng đều được **ghi lại và lưu trữ trong thời gian tối thiểu 5 năm** phục vụ mục đích kiểm tra và giải quyết tranh chấp.`,
  },
  {
    key: "trangtrai",
    label: "Quản lý trang trại",
    content: `**4.1 Yêu cầu đối với trang trại**\n\n**Điều kiện bắt buộc** để đủ điều kiện đăng ký bảo hiểm:\n• Diện tích **tối thiểu 1,000 m²**\n• Nằm hoàn toàn trong **lãnh thổ Việt Nam**\n• Cung cấp **tọa độ chính xác** xác định ranh giới trang trại\n• **Phải có hình ảnh thực tế** của trang trại khi tạo hồ sơ\n\n**4.2 Thông tin không thể thay đổi**\n\n**Quy định quan trọng:** Khi đã có hợp đồng bảo hiểm đang có hiệu lực, nông dân **không được phép thay đổi** các thông tin về:\n• Vị trí trang trại\n• Diện tích trang trại\n• Loại cây trồng\n\nCho đến khi hợp đồng hết hạn hoặc bị hủy. Điều này nhằm đảm bảo **tính minh bạch và công bằng** trong quá trình theo dõi và đánh giá rủi ro.\n\n**4.3 Hạn chế bảo hiểm trùng lặp**\n\n**Không được phép:** Một trang trại không thể được bảo hiểm đồng thời bởi nhiều hợp đồng cho **cùng một loại rủi ro** trong cùng khoảng thời gian.\n\n**Được phép:** Nông dân có thể đăng ký nhiều gói bảo hiểm khác nhau từ các đối tác khác nhau cho cùng một trang trại.`,
  },
  {
    key: "goi-hopdong",
    label: "Gói bảo hiểm & Hợp đồng",
    content: `**5.1 Lựa chọn gói bảo hiểm**\n\nNông dân chỉ có thể xem và đăng ký các gói bảo hiểm **đang được mở cho phép đăng ký** trong thời gian quy định. Mỗi gói bảo hiểm có các điều kiện, mức phí và quyền lợi cụ thể do đối tác bảo hiểm quy định.\n\n**Lưu ý quan trọng:** Nông dân cần **đọc kỹ các điều khoản** trước khi đăng ký.\n\n**5.2 Hiệu lực hợp đồng**\n\n**Điều kiện có hiệu lực:** Hợp đồng bảo hiểm chỉ có hiệu lực và ràng buộc về mặt pháp lý sau khi:\n• Nông dân đã **hoàn tất thanh toán phí bảo hiểm**\n• Nhận được **xác nhận thanh toán thành công**\n\n**Thời gian chờ đợi:** Quyền bảo hiểm chỉ bắt đầu có hiệu lực sau một **khoảng thời gian chờ đợi bắt buộc** kể từ ngày mua.\n\n**Quan trọng:** Bất kỳ sự cố nào xảy ra trong thời gian chờ đợi này đều **không được bồi thường**.\n\n**5.3 Tính bất biến của hợp đồng**\n\n**Không thể thay đổi:** Sau khi hợp đồng được tạo thành công, **không bên nào** có thể thay đổi bất kỳ nội dung nào của hợp đồng, bao gồm:\n• Mức phí\n• Thời gian bảo hiểm\n• Các điều khoản đã thỏa thuận\n\nĐiều này đảm bảo **tính công bằng và minh bạch** cho cả hai bên.`,
  },
  {
    key: "thanh_toan",
    label: "Thanh toán & Hoàn phí",
    content: `**6.1 Phương thức thanh toán**\n\n**Đồng tiền:** Tất cả các giao dịch trên nền tảng được thực hiện bằng **đồng Việt Nam**.\n\n**Thời hạn thanh toán:** Nông dân phải thanh toán phí bảo hiểm trong vòng **24 giờ** kể từ khi đăng ký được chấp nhận.\n\n**Hậu quả:** Quá thời gian này, đăng ký sẽ **tự động bị hủy** và nông dân cần đăng ký lại nếu muốn tiếp tục.\n\n**6.2 Quyền hủy và hoàn phí**\n\n**Quyền hủy trong 24h:** Nông dân có quyền hủy hợp đồng trong vòng **24 giờ** kể từ khi thanh toán thành công để được **hoàn lại toàn bộ số tiền** đã trả, với điều kiện thời gian bảo hiểm chưa bắt đầu.\n\n**Không hoàn phí:** Sau khi thời gian bảo hiểm đã bắt đầu, phí bảo hiểm sẽ **không được hoàn lại** dưới bất kỳ hình thức nào, kể cả khi nông dân:\n• Bán đất\n• Chuyển đổi mục đích sử dụng\n• Ngừng canh tác\n\n**6.3 Gia hạn tự động**\n\nMột số gói bảo hiểm có **tính năng gia hạn tự động** khi hết hạn. Nếu nông dân không muốn gia hạn, cần **chủ động hủy** trước khi hợp đồng hết hạn.\n\n**Thanh toán gia hạn:** Khi gia hạn, nông dân phải thanh toán phí bảo hiểm mới trong thời gian quy định, nếu không hợp đồng sẽ **tự động bị hủy**.`,
  },
  {
    key: "theo_doi",
    label: "Theo dõi & Đánh giá rủi ro",
    content: `**7.1 Nguồn dữ liệu**\n\nNền tảng Agrisa sử dụng **dữ liệu vệ tinh và dữ liệu thời tiết** từ các nhà cung cấp độc lập để theo dõi tình trạng trang trại và môi trường canh tác.\n\n**Tần suất cập nhật:** Dữ liệu này được **cập nhật hàng ngày** và sử dụng làm **cơ sở chính** để đánh giá rủi ro và xác định quyền lợi bồi thường.\n\n**7.2 Vai trò của công nghệ**\n\nHệ thống sử dụng **công nghệ trí tuệ nhân tạo** để phân tích và đưa ra các khuyến nghị về rủi ro.\n\n**Lưu ý quan trọng:** Các khuyến nghị này **chỉ mang tính tham khảo**. Quyết định cuối cùng về việc chấp nhận hay từ chối hồ sơ bảo hiểm, cũng như phê duyệt hay từ chối các yêu cầu bồi thường, **hoàn toàn thuộc về đối tác bảo hiểm**.\n\n**7.3 Thông báo cảnh báo**\n\nNông dân có thể nhận được các **thông báo cảnh báo sớm** về điều kiện thời tiết bất lợi hoặc nguy cơ rủi ro.\n\n**Chú ý:** Những thông báo này **chỉ nhằm mục đích giúp nông dân chuẩn bị** và không tự động dẫn đến việc được bồi thường. Chỉ khi các điều kiện đạt đến **ngưỡng quy định trong hợp đồng**, yêu cầu bồi thường mới được tạo ra.`,
  },
  {
    key: "boi_thuong",
    label: "Bồi thường & Quyền lợi",
    content: `**8.1 Cơ sở xác định bồi thường**\n\nQuyền lợi bồi thường được xác định dựa trên **dữ liệu khách quan** từ vệ tinh và thời tiết đã được ghi nhận trong hệ thống, so sánh với các **ngưỡng đã được quy định rõ ràng** trong hợp đồng.\n\n**Tính minh bạch:** Công thức tính toán số tiền bồi thường được **thiết lập trước** và áp dụng một cách minh bạch cho tất cả các trường hợp.\n\n**8.2 Quy trình xử lý yêu cầu bồi thường**\n\n**Tự động:** Khi điều kiện kích hoạt bồi thường được phát hiện, hệ thống sẽ **tự động tạo yêu cầu bồi thường** và thông báo cho nông dân.\n\n**Xem xét:** Yêu cầu này sẽ được chuyển đến **đối tác bảo hiểm** để xem xét và đưa ra quyết định.\n\n**Thời gian xử lý:** Đối tác bảo hiểm có trách nhiệm xử lý yêu cầu trong **thời gian hợp lý**.\n\n**Hạn chế:** Trong khi chờ đối tác xem xét, nông dân **không thể tạo thêm yêu cầu bồi thường mới** cho cùng hợp đồng đó.\n\n**8.3 Phê duyệt và thanh toán**\n\nKhi đối tác bảo hiểm **phê duyệt yêu cầu bồi thường**, số tiền bồi thường sẽ được **giải ngân trực tiếp** cho nông dân theo thỏa thuận mức độ dịch vụ.\n\n**8.4 Từ chối yêu cầu bồi thường**\n\n**Quyền từ chối:** Đối tác bảo hiểm có quyền **từ chối yêu cầu bồi thường** nếu xét thấy các điều kiện chưa đủ để thanh toán, **ngay cả khi các ngưỡng kỹ thuật đã được đáp ứng**.\n\n**8.5 Giới hạn bồi thường**\n\n**Quan trọng:** Mỗi hợp đồng bảo hiểm chỉ được bồi thường **một lần duy nhất** trong suốt thời gian hiệu lực.`,
  },
  {
    key: "doi_tac",
    label: "Đối tác bảo hiểm",
    content: `**9.1 Quyền tự chủ trong kinh doanh**\n\nĐối tác bảo hiểm có **toàn quyền** trong các hoạt động:\n• Thiết kế sản phẩm\n• Định giá\n• Quyết định chấp nhận hay từ chối hồ sơ\n• Giải quyết các yêu cầu bồi thường\n\n**Vai trò của Agrisa:** Agrisa **không can thiệp** vào các quyết định kinh doanh này và **không chịu trách nhiệm** về hậu quả của các quyết định đó.\n\n**9.2 Nghĩa vụ minh bạch**\n\n**Bắt buộc:** Đối tác bảo hiểm phải cung cấp **đầy đủ thông tin** về điều kiện, điều khoản và quyền lợi của từng gói bảo hiểm **bằng tiếng Việt**.`,
  },
];

const ICON_COLOR = "#18573f";
const iconsMap = {
  gioithieu: <InfoCircleOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
  vai_tro: <TeamOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
  taikhoan: <LockOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
  trangtrai: <HomeOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
  "goi-hopdong": (
    <FileTextOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />
  ),
  thanh_toan: (
    <CreditCardOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />
  ),
  theo_doi: <CloudOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
  boi_thuong: <WalletOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
  doi_tac: <BankOutlined style={{ color: ICON_COLOR, fontSize: 18 }} />,
};

export default function TermsPage() {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState("gioithieu");

  const selectedSection = sections.find((s) => s.key === selectedKey);

  const handleExportPDF = () => {
    // Create a new window with all content for printing
    const printWindow = window.open("", "_blank");
    const allContent = sections
      .map((section) => {
        const contentWithoutMarkdown = section.content.replace(
          /\*\*([^*]+)\*\*/g,
          '<strong style="color: #18573f">$1</strong>'
        );
        return `
        <div class="content-section" style="margin-bottom: 30px;">
          <h2 class="section-title" style="color: #18573f; border-bottom: 2px solid #18573f; padding-bottom: 8px; font-family: 'Fraunces', serif; page-break-before: auto; page-break-after: avoid;">${
            section.label
          }</h2>
          <div style="line-height: 1.6; text-align: justify; white-space: pre-wrap; page-break-inside: avoid;">${contentWithoutMarkdown
            .split("\n\n")
            .map(
              (para) =>
                `<p style="margin-bottom: 16px; text-indent: 0;">${para}</p>`
            )
            .join("")}</div>
        </div>
      `;
      })
      .join("");

    const logoImg = Assets?.Agrisa?.src
      ? `<img src="${Assets.Agrisa.src}" alt="Agrisa" style="width: 80px; height: 80px; object-fit: contain; margin: 0 auto; display: block;" />`
      : "";

    printWindow.document.write(`
      <html>
        <head>
          <title> </title>
          <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              padding: 2cm;
            }
            
            h1, h2, h3, h4, h5, h6 { font-family: 'Fraunces', serif; }
            
            @page {
              size: A4;
              margin: 0;
            }
            
            @media print { 
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }
              
              .print-title {
                text-align: center;
                margin-bottom: 30px;
                page-break-after: avoid;
              }
              
              .content-section {
                page-break-inside: avoid;
                margin-bottom: 25px;
              }
              
              .section-title {
                page-break-after: avoid;
                margin-top: 20px;
              }
            }
            
            .section-title {
              color: #18573f;
              border-bottom: 2px solid #18573f;
              padding-bottom: 8px;
              font-family: 'Fraunces', serif;
              page-break-after: avoid;
            }
          </style>
        </head>
        <body>
          <div class="print-title" style="text-align: center; margin-bottom: 40px; page-break-inside: avoid;">
            ${logoImg}
            <h1 style="color: #18573f; margin: 16px 0; font-family: 'Fraunces', serif; font-size: 24px;">Điều khoản sử dụng</h1>
            <p style="color: rgba(0,0,0,0.6); margin: 0; font-size: 14px;">Agrisa Platform</p>
            <p style="color: rgba(0,0,0,0.4); margin: 5px 0 0 0; font-size: 12px;">Cập nhật: ${new Date().toLocaleDateString(
              "vi-VN"
            )}</p>
          </div>
          ${allContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const renderContent = (content, isIntro = false) => {
    return content.split("\n\n").map((para, idx) => {
      // Show large logo after the second paragraph in introduction
      const showLogo = isIntro && idx === 2 && Assets?.Agrisa?.src;

      // Replace **text** with bold styling
      const formattedPara = para.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} strong style={{ color: ICON_COLOR }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      });

      return (
        <div key={idx}>
          {showLogo && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "40px 0",
                width: "100%",
              }}
            >
              <img
                src={Assets.Agrisa.src}
                alt="Agrisa Platform"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}
          <Paragraph
            style={{
              textAlign: "justify",
              whiteSpace: "pre-wrap",
              marginBottom: 16,
              lineHeight: "1.6",
              fontSize: para.includes("**AGRISA PLATFORM**") ? 16 : 15,
              textAlign: para.includes("**AGRISA PLATFORM**")
                ? "center"
                : "justify",
              fontWeight: para.includes("**AGRISA PLATFORM**") ? 500 : 400,
            }}
          >
            {formattedPara}
          </Paragraph>
        </div>
      );
    });
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Sidebar */}
      <Sider
        width={320}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #e8e8e8",
          position: "fixed",
          height: "100vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid #e8e8e8",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {Assets?.Agrisa?.src && (
              <img
                src={Assets.Agrisa.src}
                alt="Agrisa"
                style={{ width: 40, height: 40, objectFit: "contain" }}
              />
            )}
            <div>
              <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                Điều khoản sử dụng
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Agrisa Platform
              </Text>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Quay lại
            </Button>
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={handleExportPDF}
            >
              In PDF
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: "8px 0" }}>
          {sections.map((section) => (
            <div
              key={section.key}
              onClick={() => setSelectedKey(section.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                cursor: "pointer",
                background:
                  selectedKey === section.key ? "#f0f9f0" : "transparent",
                borderRight:
                  selectedKey === section.key
                    ? `3px solid ${ICON_COLOR}`
                    : "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (selectedKey !== section.key) {
                  e.target.style.background = "#f9f9f9";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedKey !== section.key) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              {iconsMap[section.key]}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: selectedKey === section.key ? 500 : 400,
                  color: selectedKey === section.key ? ICON_COLOR : "inherit",
                }}
              >
                {section.label}
              </Text>
            </div>
          ))}
        </div>
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: 320 }}>
        <Content
          style={{
            padding: "20px 40px",
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            minHeight: "calc(100vh - 48px)",
          }}
        >
          {selectedSection && (
            <article>
              <Title
                level={3}
                style={{
                  marginTop: 0,
                  marginBottom: 24,
                  color: ICON_COLOR,
                  borderBottom: `2px solid ${ICON_COLOR}`,
                  paddingBottom: 12,
                }}
              >
                {selectedSection.label}
              </Title>
              <div style={{ maxWidth: "none", fontSize: 15 }}>
                {renderContent(
                  selectedSection.content,
                  selectedSection.key === "gioithieu"
                )}
              </div>
            </article>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
