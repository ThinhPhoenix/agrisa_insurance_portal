/**
 * Tiện ích chỉnh sửa PDF AcroForm
 * Sử dụng pdf-lib để tạo các biểu mẫu PDF có thể điền với các trường AcroForm
 *
 * Mục đích: Tạo biểu mẫu PDF tương tác thay vì chỉ điền và làm phẳng
 * Đầu vào: PDF gốc + định nghĩa trường
 * Đầu ra: PDF với các trường biểu mẫu có thể điền
 *
 * LƯU Ý: Module này sử dụng tiện ích từ @/utils/pdfFormHelper cho chức năng cốt lõi
 * và thêm các hàm cấp cao hơn để tích hợp với placeholder mapping
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Re-export các hàm tiện ích từ pdfFormHelper
export {
  addFormFieldsToPdf,
  createPDFBlobURL,
  downloadPDF,
  pdfBytesToFile,
} from "@/libs/pdf/pdfFormHelper";

// Cache font toàn cục để tránh tải lại font mỗi lần chỉnh sửa PDF
let cachedFontBytes = null;
let cachedFontkitModule = null;

/**
 * Tải và nhúng font Noto Sans (hỗ trợ tiếng Việt)
 * @param {PDFDocument} pdfDoc - Tài liệu PDF
 * @returns {Promise<PDFFont>} - Font đã nhúng
 */
const embedVietnameseFont = async (pdfDoc) => {
  try {
    // Kiểm tra cache trước
    if (!cachedFontBytes) {
      // DejaVu Sans font hỗ trợ tiếng Việt và có phạm vi Unicode tốt
      const fontUrl =
        "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf";

      const fontResponse = await fetch(fontUrl);

      if (!fontResponse.ok) {
        throw new Error(
          `Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`
        );
      }

      cachedFontBytes = await fontResponse.arrayBuffer();
    }

    let customFont;
    try {
      // Dynamic import fontkit (nếu đã cài đặt) - cache module
      if (!cachedFontkitModule) {
        cachedFontkitModule = await import("@pdf-lib/fontkit").then(
          (m) => m.default || m
        );
      }

      pdfDoc.registerFontkit(cachedFontkitModule);
      customFont = await pdfDoc.embedFont(cachedFontBytes);
    } catch (fontkitError) {
      customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    return customFont;
  } catch (error) {
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
};

/**
 * Tạo các trường AcroForm trong PDF
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc dạng ArrayBuffer
 * @param {Array} fieldDefinitions - Mảng các định nghĩa trường
 * @param {Object} options - Tùy chọn bổ sung
 * @returns {Promise<{pdfBytes: Uint8Array, warnings: Array}>} - PDF đã chỉnh sửa với các trường biểu mẫu
 *
 * Định dạng field definition:
 * {
 *   page: 1,                  // Page number (1-indexed)
 *   x: 150,                   // X coordinate (from pdf.js, bottom-left system)
 *   y: 200,                   // Y coordinate (from pdf.js, bottom-left system)
 *   width: 80,                // Field width
 *   height: 12,               // Field height
 *   fieldName: 'ho_va_ten',   // Unique field name (key)
 *   fieldType: 'text',        // Field type: 'text', 'checkbox', 'radio', 'dropdown'
 *   defaultValue: '',         // Default value (optional)
 *   placeholder: '____(1)____', // Original placeholder text
 *   dataType: 'string',       // Data type for validation
 *   fontSize: 12,             // Font size (optional)
 *   required: false,          // Whether field is required
 *   readOnly: false,          // Whether field is read-only
 *   multiline: false,         // For text fields: allow multiline
 *   backgroundColor: [1, 1, 1], // RGB array for background color
 *   borderColor: [0, 0, 0],   // RGB array for border color
 *   borderWidth: 1,           // Border width in points
 * }
 *
 * Options:
 * {
 *   fillFields: false,        // Whether to fill fields with default values
 *   makeFieldsEditable: true, // Whether fields should be editable
 *   showBorders: true,        // Whether to show field borders
 *   removeOriginalText: true, // Whether to remove original placeholder text
 * }
 */
export const createAcroFormFields = async (
  pdfArrayBuffer,
  fieldDefinitions,
  options = {}
) => {
  try {
    const {
      fillFields = false,
      makeFieldsEditable = true,
      showBorders = true,
      removeOriginalText = true,
    } = options;

    // Tải tài liệu PDF
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    // Nhúng font tương thích tiếng Việt
    const font = await embedVietnameseFont(pdfDoc);

    // Lấy hoặc tạo form
    const form = pdfDoc.getForm();

    // Nhóm các trường theo trang để tối ưu
    const byPage = {};
    fieldDefinitions.forEach((field) => {
      if (!byPage[field.page]) byPage[field.page] = [];
      byPage[field.page].push(field);
    });

    // Thu thập warnings để phản hồi cho người dùng
    const warnings = [];

    // Tạo các trường theo từng trang
    for (const [pageNum, fields] of Object.entries(byPage)) {
      const pageIndex = parseInt(pageNum) - 1; // Chuyển sang 0-indexed
      const page = pages[pageIndex];
      const { height: pageHeight } = page.getSize();

      for (const field of fields) {
        try {
          const {
            x,
            y,
            width,
            height: fieldHeight,
            fieldName,
            fieldType = "text",
            defaultValue = "",
            placeholder = "",
            fontSize = 12,
            required = false,
            readOnly = false,
            multiline = false,
            backgroundColor = [1, 1, 1], // Nền trắng
            borderColor = [0.7, 0.7, 0.7], // Viền xám
            borderWidth = showBorders ? 1 : 0,
            backgroundX,
            backgroundWidth,
          } = field;

          // Bước 1: Xóa text placeholder gốc nếu cần
          if (
            removeOriginalText &&
            backgroundX !== undefined &&
            backgroundWidth !== undefined
          ) {
            // Vẽ hình chữ nhật trắng lên placeholder gốc
            const rectX = backgroundX;
            const rectWidth = backgroundWidth;
            const rectY = y - fontSize * 0.35;
            const rectHeight = fontSize * 1.5;

            page.drawRectangle({
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              color: rgb(1, 1, 1), // Màu trắng
              opacity: 1,
            });
          }

          // Bước 2: Tạo trường biểu mẫu dựa trên loại
          let formField;

          switch (fieldType.toLowerCase()) {
            case "text":
            case "string":
            case "number":
            case "date":
            case "email":
            case "phone":
              // Tạo text field
              formField = form.createTextField(fieldName);

              // QUAN TRỌNG: Set font tiếng Việt TRƯỚC setText để tránh lỗi WinAnsi
              try {
                // Lấy tên font từ embedded font
                const fontName = font.name;
                const fontRef = pdfDoc.context.getObjectRef(font.ref);

                // Thêm font vào default resources của AcroForm
                const acroForm = pdfDoc.catalog.lookup(
                  pdfDoc.context.obj("AcroForm")
                );
                if (acroForm) {
                  const dr = acroForm.get(pdfDoc.context.obj("DR"));
                  const fontDict = dr?.get(pdfDoc.context.obj("Font"));
                  if (fontDict) {
                    fontDict.set(pdfDoc.context.obj(fontName), fontRef);
                  }
                }

                // Set Default Appearance với embedded font
                const acroField = formField.acroField;
                const appearanceString = `/${fontName} ${fontSize} Tf 0 0 0 rg`;
                acroField.setDefaultAppearance(appearanceString);
              } catch (fontError) {
                // Bỏ qua lỗi font
              }

              // CẢNH BÁO: KHÔNG gọi setText trước addToPage - sẽ trigger WinAnsi encoding
              const textValue = fillFields ? defaultValue : "";

              if (multiline) {
                formField.enableMultiline();
              }

              if (readOnly || !makeFieldsEditable) {
                formField.enableReadOnly();
              }

              if (required) {
                formField.enableRequired();
              }

              // LOGIC MỚI: Sử dụng toàn bộ chiều rộng placeholder (từ đầu đến cuối vùng trường)
              // Placeholder x và width đã đại diện cho toàn bộ vùng trường
              // (từ dấu chấm/gạch dưới đầu tiên đến dấu chấm/gạch dưới cuối cùng)
              // Điều này cho chúng ta 99% phạm vi của vùng trường không có padding
              const fieldX = x;
              const fieldWidth = width;
              const fieldY = y - fontSize * 0.35; // Điều chỉnh cho baseline
              const fieldHeightCalculated = fieldHeight || fontSize * 1.5;

              // Thêm widget (giao diện hiển thị) vào trang
              // Sử dụng tùy chọn tối thiểu để tránh trigger WinAnsi appearance generation
              formField.addToPage(page, {
                x: fieldX,
                y: fieldY,
                width: fieldWidth,
                height: fieldHeightCalculated,
                // Bỏ qua appearance options để tránh lỗi WinAnsi encoding
              });

              // Set text tiếng Việt SAU addToPage
              if (textValue) {
                try {
                  // Sử dụng setText built-in của pdf-lib để tạo appearance đúng
                  // Điều này sẽ tạo appearance stream với embedded font
                  const normalizedText = textValue.normalize("NFC");
                  formField.setText(normalizedText);
                } catch (setValueError) {
                  // Bỏ qua lỗi set value
                }
              }

              break;

            case "checkbox":
            case "boolean":
              // Tạo checkbox
              formField = form.createCheckBox(fieldName);

              if (fillFields && defaultValue === true) {
                formField.check();
              }

              if (readOnly || !makeFieldsEditable) {
                formField.enableReadOnly();
              }

              // LOGIC MỚI: Kích thước checkbox dựa trên chiều rộng trường
              // Kích thước checkbox mặc định là 15px
              // Nếu chiều rộng trường < 15px, dùng logic cũ (căn giữa trường)
              // Nếu chiều rộng trường >= 15px, tạo checkbox vuông với cạnh = chiều rộng trường
              const defaultCheckboxSize = 15;
              let actualCheckboxSize;
              let checkboxX, checkboxY;

              // Xác định chiều rộng trường (dùng backgroundWidth nếu có, nếu không dùng width)
              const effectiveFieldWidth =
                backgroundX !== undefined && backgroundWidth !== undefined
                  ? backgroundWidth
                  : width;

              if (effectiveFieldWidth < defaultCheckboxSize) {
                // Trường hợp 1: Trường nhỏ hơn checkbox mặc định -> dùng logic căn giữa cũ
                actualCheckboxSize = defaultCheckboxSize;

                if (
                  backgroundX !== undefined &&
                  backgroundWidth !== undefined
                ) {
                  // Căn giữa checkbox trên vị trí chữ số
                  const digitCenterX = backgroundX + backgroundWidth / 2;
                  checkboxX = digitCenterX - actualCheckboxSize / 2;
                } else {
                  // Fallback: dùng tâm placeholder
                  const centerX = x + width / 2;
                  checkboxX = centerX - actualCheckboxSize / 2;
                }
              } else {
                // Trường hợp 2: Trường lớn hơn hoặc bằng checkbox mặc định -> tạo checkbox vuông = chiều rộng trường
                actualCheckboxSize = effectiveFieldWidth;

                if (
                  backgroundX !== undefined &&
                  backgroundWidth !== undefined
                ) {
                  // Đặt checkbox tại đầu background
                  checkboxX = backgroundX;
                } else {
                  // Fallback: dùng đầu placeholder
                  checkboxX = x;
                }
              }

              checkboxY = y - actualCheckboxSize / 2 + 2; // Điều chỉnh căn chỉnh dọc

              formField.addToPage(page, {
                x: checkboxX,
                y: checkboxY,
                width: actualCheckboxSize,
                height: actualCheckboxSize,
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth: borderWidth,
              });

              break;

            case "dropdown":
            case "select":
              // Tạo dropdown
              const options = field.options || [];
              formField = form.createDropdown(fieldName);

              formField.addOptions(options);

              if (fillFields && defaultValue) {
                formField.select(defaultValue);
              }

              if (readOnly || !makeFieldsEditable) {
                formField.enableReadOnly();
              }

              // Thêm widget vào trang
              // Sử dụng tùy chọn tối thiểu cho dropdown để tránh lỗi WinAnsi
              formField.addToPage(page, {
                x: x,
                y: y,
                width: width,
                height: fieldHeight || fontSize * 1.5,
              });

              break;

            default:
              warnings.push({
                fieldName,
                warning: `Unsupported field type: ${fieldType}. Defaulting to text field.`,
              });

              // Mặc định là text field
              formField = form.createTextField(fieldName);

              // Set font tiếng Việt cho text field mặc định
              try {
                const fontName = font.name;
                const fontRef = pdfDoc.context.getObjectRef(font.ref);

                const acroForm = pdfDoc.catalog.lookup(
                  pdfDoc.context.obj("AcroForm")
                );
                if (acroForm) {
                  const dr = acroForm.get(pdfDoc.context.obj("DR"));
                  const fontDict = dr?.get(pdfDoc.context.obj("Font"));
                  if (fontDict) {
                    fontDict.set(pdfDoc.context.obj(fontName), fontRef);
                  }
                }

                const acroField = formField.acroField;
                acroField.setDefaultAppearance(
                  `/${fontName} ${fontSize} Tf 0 0 0 rg`
                );
              } catch (fontError) {
                // Bỏ qua lỗi font
              }

              const defaultText = fillFields ? defaultValue : "";

              // LOGIC MỚI: Sử dụng toàn bộ chiều rộng placeholder cho trường hợp mặc định
              const defaultFieldX = x;
              const defaultFieldWidth = width;
              const defaultFieldY = y;
              const defaultFieldHeightCalculated =
                fieldHeight || fontSize * 1.5;

              // Thêm không có appearance options cho trường hợp mặc định
              formField.addToPage(page, {
                x: defaultFieldX,
                y: defaultFieldY,
                width: defaultFieldWidth,
                height: defaultFieldHeightCalculated,
              });

              // Set text tiếng Việt SAU addToPage
              if (defaultText) {
                try {
                  const acroField = formField.acroField;
                  // Normalize về NFC
                  const normalizedText = defaultText.normalize("NFC");
                  acroField.dict.set(
                    pdfDoc.context.obj("V"),
                    pdfDoc.context.obj(normalizedText)
                  );
                } catch (err) {
                  // Bỏ qua lỗi set value
                }
              }
          }
        } catch (fieldError) {
          console.error(
            `❌ Lỗi khi tạo trường ${field.fieldName}:`,
            fieldError
          );
          warnings.push({
            fieldName: field.fieldName,
            warning: `Failed to create field: ${fieldError.message}`,
          });
        }
      }
    }

    // Lưu PDF đã chỉnh sửa với các trường biểu mẫu
    // QUAN TRỌNG: Tắt updateFieldAppearances để tránh lỗi WinAnsi encoding
    const modifiedPdfBytes = await pdfDoc.save({
      updateFieldAppearances: false,
    });

    return { pdfBytes: modifiedPdfBytes, warnings };
  } catch (error) {
    console.error("❌ Lỗi khi tạo trường AcroForm:", error);
    console.error("❌ Stack:", error.stack);
    throw new Error("Không thể tạo fillable PDF: " + error.message);
  }
};

/**
 * Tạo fillable PDF từ placeholder mappings
 * Đây là hàm cấp cao chuyển đổi placeholder mappings thành field definitions
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc
 * @param {Array} placeholders - Danh sách placeholders từ PDFPlaceholderDetector
 * @param {Object} mappings - Mapping object { placeholder_id: tag_id }
 * @param {Array} tags - Danh sách tags
 * @param {Object} options - Tùy chọn bổ sung
 * @returns {Promise<{pdfBytes: Uint8Array, warnings: Array}>}
 */
export const createFillablePDFFromMappings = async (
  pdfArrayBuffer,
  placeholders,
  mappings,
  tags,
  options = {}
) => {
  try {
    // Chuyển đổi placeholders + mappings thành field definitions
    const fieldDefinitions = [];

    placeholders.forEach((placeholder) => {
      const tagId = mappings[placeholder.id];
      if (!tagId) return; // Bỏ qua placeholders chưa map

      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;

      // Normalize tất cả text tiếng Việt về NFC (composed form)
      const normalizedKey = (tag.key || "").normalize("NFC");
      const normalizedDefaultValue = (tag.defaultValue || "").normalize("NFC");

      // Map tag thành field definition
      const fieldDef = {
        page: placeholder.page,
        x: placeholder.x,
        y: placeholder.y,
        width: placeholder.width,
        height: placeholder.height,
        backgroundX: placeholder.backgroundX,
        backgroundWidth: placeholder.backgroundWidth,
        fieldName: normalizedKey, // Sử dụng tag key đã normalize làm field name
        fieldType: mapDataTypeToFieldType(tag.dataType),
        defaultValue: normalizedDefaultValue,
        placeholder: placeholder.fullText,
        dataType: tag.dataType,
        fontSize: placeholder.fontSize || 12,
        required: tag.required || false,
        readOnly: tag.readOnly || false,
        multiline: tag.dataType === "textarea",
      };

      fieldDefinitions.push(fieldDef);
    });

    // Tạo các trường AcroForm
    return await createAcroFormFields(
      pdfArrayBuffer,
      fieldDefinitions,
      options
    );
  } catch (error) {
    console.error("❌ Lỗi khi tạo fillable PDF từ mappings:", error);
    throw error;
  }
};

/**
 * Map data type thành field type
 */
const mapDataTypeToFieldType = (dataType) => {
  const mapping = {
    string: "text",
    text: "text",
    textarea: "text",
    number: "text",
    int: "text",
    integer: "text",
    float: "text",
    decimal: "text",
    date: "text",
    datetime: "text",
    time: "text",
    boolean: "checkbox",
    select: "dropdown",
    email: "text",
    phone: "text",
    url: "text",
  };

  return mapping[dataType] || "text";
};

// pdfBytesToFile is also already exported from pdfFormHelper - removed duplicate
