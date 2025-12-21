/**
 * Tiện Ích Hỗ Trợ Form PDF
 *
 * Mục đích: Thêm các trường AcroForm vào PDF tĩnh trước khi upload lên backend
 * Điều này cho phép backend (pdfcpu) điền các trường form tự động bằng code
 *
 * @module pdfFormHelper
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * @typedef {Object} FieldDefinition
 * @property {string} name - Tên trường (phải khớp với key backend mong đợi)
 * @property {number} x - Tọa độ X (gốc dưới-trái)
 * @property {number} y - Tọa độ Y (gốc dưới-trái)
 * @property {number} width - Chiều rộng trường tính bằng points
 * @property {number} height - Chiều cao trường tính bằng points
 * @property {number} [page=0] - Chỉ số trang (bắt đầu từ 0)
 * @property {'text'|'checkbox'|'dropdown'} [type='text'] - Loại trường
 * @property {string} [defaultValue=''] - Giá trị mặc định
 * @property {boolean} [readOnly=false] - Trường có chỉ đọc không
 * @property {boolean} [multiline=false] - Trường text có nhiều dòng không
 * @property {number} [fontSize=12] - Kích thước font cho trường text
 * @property {[number, number, number]} [backgroundColor=[1, 1, 1]] - Màu nền RGB
 * @property {[number, number, number]} [borderColor=[0.7, 0.7, 0.7]] - Màu viền RGB
 * @property {number} [borderWidth=1] - Độ dày viền tính bằng points
 */

/**
 * Bộ nhớ đệm font toàn cục để tránh tải lại mỗi lần thao tác
 */
let cachedFontBytes = null;
let cachedFontkitModule = null;

/**
 * Tải và nhúng font hỗ trợ tiếng Việt
 * @param {PDFDocument} pdfDoc - Đối tượng tài liệu PDF
 * @returns {Promise<PDFFont>} Font đã nhúng
 */
async function embedVietnameseFont(pdfDoc) {
  try {
    // Kiểm tra cache trước
    if (!cachedFontBytes) {
      const fontUrl =
        "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf";

      const fontResponse = await fetch(fontUrl);
      if (!fontResponse.ok) {
        throw new Error(`Font fetch failed: ${fontResponse.status}`);
      }

      cachedFontBytes = await fontResponse.arrayBuffer();
    }

    let customFont;
    try {
      // Import động fontkit (nếu đã cài đặt)
      if (!cachedFontkitModule) {
        cachedFontkitModule = await import("@pdf-lib/fontkit").then(
          (m) => m.default || m
        );
      }

      pdfDoc.registerFontkit(cachedFontkitModule);
      customFont = await pdfDoc.embedFont(cachedFontBytes);
    } catch (fontkitError) {
      console.warn("Fontkit not available, using fallback font");
      customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    return customFont;
  } catch (error) {
    console.warn("Failed to load custom font, using Helvetica:", error);
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}

/**
 * Thêm các trường AcroForm vào tài liệu PDF
 *
 * @param {ArrayBuffer|Uint8Array} pdfBytes - File PDF dạng ArrayBuffer hoặc Uint8Array
 * @param {FieldDefinition[]} fields - Mảng định nghĩa các trường
 * @returns {Promise<Uint8Array>} PDF đã chỉnh sửa với các trường form
 *
 * @example
 * const pdfBytes = await file.arrayBuffer();
 * const fields = [
 *   { name: 'farmer_name', x: 150, y: 680, width: 200, height: 20 },
 *   { name: 'policy_number', x: 400, y: 680, width: 150, height: 20 },
 * ];
 * const modifiedPdf = await addFormFieldsToPdf(pdfBytes, fields);
 */
export async function addFormFieldsToPdf(pdfBytes, fields) {
  try {
    // Tải tài liệu PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Nhúng font hỗ trợ tiếng Việt
    const font = await embedVietnameseFont(pdfDoc);

    // Lấy hoặc tạo form mới
    const form = pdfDoc.getForm();

    // Nhóm các trường theo trang để xử lý hiệu quả
    const fieldsByPage = {};
    fields.forEach((field) => {
      const pageIndex = field.page ?? 0;
      if (!fieldsByPage[pageIndex]) {
        fieldsByPage[pageIndex] = [];
      }
      fieldsByPage[pageIndex].push(field);
    });

    // Tạo các trường theo từng trang
    for (const [pageIndexStr, pageFields] of Object.entries(fieldsByPage)) {
      const pageIndex = parseInt(pageIndexStr);

      // Kiểm tra tính hợp lệ của chỉ số trang
      if (pageIndex >= pages.length) {
        console.warn(`Page index ${pageIndex} out of bounds, skipping fields`);
        continue;
      }

      const page = pages[pageIndex];

      for (const field of pageFields) {
        try {
          const {
            name,
            x,
            y,
            width,
            height,
            type = "text",
            defaultValue = "",
            readOnly = false,
            multiline = false,
            fontSize = 12,
            backgroundColor = [1, 1, 1],
            borderColor = [0.7, 0.7, 0.7],
            borderWidth = 1,
          } = field;

          let formField;

          switch (type.toLowerCase()) {
            case "text":
              // tạo thẻ text
              formField = form.createTextField(name);
              formField.setText(defaultValue);
              formField.setFontSize(fontSize);

              if (multiline) {
                formField.enableMultiline();
              }

              if (readOnly) {
                formField.enableReadOnly();
              }

              // Thêm trường vào trang
              formField.addToPage(page, {
                x,
                y,
                width,
                height,
                textColor: rgb(0, 0, 0),
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth,
              });
              break;

            case "checkbox":
              // Tạo checkbox
              formField = form.createCheckBox(name);

              if (defaultValue === true || defaultValue === "true") {
                formField.check();
              }

              if (readOnly) {
                formField.enableReadOnly();
              }

              formField.addToPage(page, {
                x,
                y,
                width: height || 12,
                height: height || 12,
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth,
              });
              break;

            case "dropdown":
              // Tạo dropdown (yêu cầu có options)
              const options = field.options || [];
              formField = form.createDropdown(name);
              formField.addOptions(options);

              if (defaultValue) {
                formField.select(defaultValue);
              }

              if (readOnly) {
                formField.enableReadOnly();
              }

              formField.addToPage(page, {
                x,
                y,
                width,
                height,
                textColor: rgb(0, 0, 0),
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth,
              });
              break;

            default:
              console.warn(
                `Unsupported field type: ${type}, defaulting to text`
              );
              formField = form.createTextField(name);
              formField.setText(defaultValue);
              formField.addToPage(page, { x, y, width, height });
          }

          console.log(`✅ Created ${type} field: ${name} on page ${pageIndex}`);
        } catch (fieldError) {
          console.error(`❌ Error creating field ${field.name}:`, fieldError);
        }
      }
    }

    // Lưu và trả về PDF đã chỉnh sửa
    return await pdfDoc.save();
  } catch (error) {
    console.error("❌ Error adding form fields to PDF:", error);
    throw new Error(`Failed to add form fields: ${error.message}`);
  }
}

/**
 * Chuyển đổi Uint8Array PDF thành File object
 * @param {Uint8Array} pdfBytes - Dữ liệu PDF dạng bytes
 * @param {string} filename - Tên file đầu ra
 * @returns {File} File object sẵn sàng để upload
 */
export function pdfBytesToFile(pdfBytes, filename = "modified.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return new File([blob], filename, { type: "application/pdf" });
}

/**
 * Tạo blob URL để xem trước PDF
 * @param {Uint8Array} pdfBytes - Dữ liệu PDF dạng bytes
 * @returns {string} Blob URL để xem trước
 */
export function createPDFBlobURL(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

/**
 * Tải xuống file PDF
 * @param {Uint8Array} pdfBytes - Dữ liệu PDF dạng bytes
 * @param {string} filename - Tên file khi tải xuống
 */
export function downloadPDF(pdfBytes, filename = "form.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
