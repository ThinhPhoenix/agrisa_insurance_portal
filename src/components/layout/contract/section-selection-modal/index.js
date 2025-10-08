import { CustomForm } from "@/components/custom-form";
import { Button, Modal } from "antd";

const SectionSelectionModal = ({
  sectionModalVisible,
  closeSectionModal,
  confirmSections,
  sections,
  tempSelectedSections,
  setTempSelectedSections,
}) => (
  <Modal
    title="Chọn mục bảo hiểm"
    open={sectionModalVisible}
    onCancel={closeSectionModal}
    footer={[
      <Button key="cancel" onClick={closeSectionModal}>
        Hủy
      </Button>,
      <Button key="confirm" type="primary" onClick={confirmSections}>
        Xác nhận
      </Button>,
    ]}
    width={600}
    destroyOnClose
  >
    <div style={{ padding: "8px 0" }}>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Chọn các mục thông tin cần thiết cho hợp đồng bảo hiểm:
      </p>
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        <CustomForm
          fields={[
            {
              name: "selectedSections",
              type: "checkbox-group",
              label: "Mục bảo hiểm",
              options: sections.map((section) => ({
                value: section.id,
                label: section.name,
                description: (() => {
                  switch (section.id) {
                    case "general":
                      return "Thông tin cơ bản của hợp đồng như tên sản phẩm, thời hạn, phạm vi địa lý";
                    case "personal":
                      return "Thông tin cá nhân của người được bảo hiểm";
                    case "contact":
                      return "Thông tin liên lạc và địa chỉ";
                    case "occupation":
                      return "Thông tin về nghề nghiệp và thu nhập";
                    case "identification":
                      return "Giấy tờ tùy thân như CMND/CCCD, hộ chiếu";
                    case "land":
                      return "Thông tin về đất đai, diện tích, vị trí";
                    case "crop":
                      return "Thông tin về cây trồng và mùa vụ";
                    case "insurance":
                      return "Thông tin về bảo hiểm, phí, quyền lợi";
                    case "beneficiary":
                      return "Thông tin người thụ hưởng";
                    case "documents":
                      return "Tài liệu đính kèm, hồ sơ";
                    case "confirmation":
                      return "Xác nhận và cam kết";
                    case "data-monitoring":
                      return "Cấu hình giám sát dữ liệu thời tiết và vệ tinh";
                    case "trigger-conditions":
                      return "Điều kiện kích hoạt bảo hiểm tự động";
                    default:
                      return "";
                  }
                })(),
              })),
              required: true,
            },
          ]}
          initialValues={{ selectedSections: tempSelectedSections }}
          onValuesChange={(values) => {
            setTempSelectedSections(values.selectedSections || []);
          }}
        />
      </div>
    </div>
  </Modal>
);

export default SectionSelectionModal;
