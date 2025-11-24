/**
 * PDF AcroForm Editor Utility
 * Uses pdf-lib to create fillable PDF forms with AcroForm fields
 *
 * Purpose: Create interactive PDF forms instead of just filling and flattening
 * Input: Original PDF + field definitions
 * Output: PDF with fillable form fields
 *
 * NOTE: This module uses the utility from @/utils/pdfFormHelper for core functionality
 * and adds higher-level functions for placeholder mapping integration
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Re-export utility functions from pdfFormHelper
export {
  addFormFieldsToPdf,
  createPDFBlobURL,
  downloadPDF,
  pdfBytesToFile,
} from "@/libs/pdf/pdfFormHelper";

// ✅ Global font cache to avoid re-downloading font on every PDF modification
let cachedFontBytes = null;
let cachedFontkitModule = null;

/**
 * Load and embed Noto Sans font (supports Vietnamese)
 * @param {PDFDocument} pdfDoc - PDF document
 * @returns {Promise<PDFFont>} - Embedded font
 */
const embedVietnameseFont = async (pdfDoc) => {
  try {
    // ✅ Check cache first
    if (!cachedFontBytes) {
      // DejaVu Sans font supports Vietnamese and has good Unicode coverage
      const fontUrl =
        "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf";

      const fontResponse = await fetch(fontUrl);

      if (!fontResponse.ok) {
        throw new Error(
          `Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`
        );
      }

      cachedFontBytes = await fontResponse.arrayBuffer();
      console.log("✅ Font downloaded and cached:", fontUrl);
    } else {
      console.log("✅ Using cached font from previous load");
    }

    let customFont;
    try {
      // Dynamic import fontkit (if installed) - cache module
      if (!cachedFontkitModule) {
        cachedFontkitModule = await import("@pdf-lib/fontkit").then(
          (m) => m.default || m
        );
      }

      pdfDoc.registerFontkit(cachedFontkitModule);
      customFont = await pdfDoc.embedFont(cachedFontBytes);
      console.log("✅ Custom font embedded successfully:", customFont.name);
    } catch (fontkitError) {
      console.warn("Fontkit not available, using fallback");
      customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    return customFont;
  } catch (error) {
    console.warn("Failed to load custom font, using Helvetica:", error);
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
};

/**
 * Create AcroForm fields in PDF
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc dạng ArrayBuffer
 * @param {Array} fieldDefinitions - Mảng các field definitions
 * @param {Object} options - Additional options
 * @returns {Promise<{pdfBytes: Uint8Array, warnings: Array}>} - Modified PDF with form fields
 *
 * Field definition format:
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

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    // Embed Vietnamese-compatible font
    const font = await embedVietnameseFont(pdfDoc);
    console.log("🔤 Embedded font for PDF:", {
      fontName: font.name,
      fontRef: font.ref?.toString(),
      isCached: cachedFontBytes !== null,
    });

    // Get or create the form
    const form = pdfDoc.getForm();

    // Group fields by page for efficiency
    const byPage = {};
    fieldDefinitions.forEach((field) => {
      if (!byPage[field.page]) byPage[field.page] = [];
      byPage[field.page].push(field);
    });

    // ✅ Collect warnings for user feedback
    const warnings = [];

    // Create fields page by page
    for (const [pageNum, fields] of Object.entries(byPage)) {
      const pageIndex = parseInt(pageNum) - 1; // Convert to 0-indexed
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
            backgroundColor = [1, 1, 1], // White background
            borderColor = [0.7, 0.7, 0.7], // Gray border
            borderWidth = showBorders ? 1 : 0,
            backgroundX,
            backgroundWidth,
          } = field;

          // ✅ Step 1: Remove original placeholder text if needed
          if (
            removeOriginalText &&
            backgroundX !== undefined &&
            backgroundWidth !== undefined
          ) {
            // Draw white rectangle over original placeholder
            const rectX = backgroundX;
            const rectWidth = backgroundWidth;
            const rectY = y - fontSize * 0.35;
            const rectHeight = fontSize * 1.5;

            page.drawRectangle({
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              color: rgb(1, 1, 1), // white
              opacity: 1,
            });
          }

          // ✅ Step 2: Create form field based on type
          let formField;

          switch (fieldType.toLowerCase()) {
            case "text":
            case "string":
            case "number":
            case "date":
            case "email":
            case "phone":
              // Create text field
              formField = form.createTextField(fieldName);

              // ✅ CRITICAL: Set Vietnamese font BEFORE setText to avoid WinAnsi error
              try {
                // Get font name from embedded font
                const fontName = font.name;
                const fontRef = pdfDoc.context.getObjectRef(font.ref);

                console.log("📝 Setting font for field:", {
                  fieldName,
                  fontName,
                  fontRef: fontRef?.toString(),
                  fontSize,
                });

                // Add font to AcroForm's default resources
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

                // Set Default Appearance with embedded font
                const acroField = formField.acroField;
                const appearanceString = `/${fontName} ${fontSize} Tf 0 0 0 rg`;
                acroField.setDefaultAppearance(appearanceString);

                console.log("✅ Default appearance set:", {
                  fieldName,
                  appearanceString,
                });
              } catch (fontError) {
                console.warn(
                  `⚠️ Could not set Vietnamese font for ${fieldName}:`,
                  fontError.message
                );
              }

              // ⚠️ DO NOT call setText before addToPage - it will trigger WinAnsi encoding
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

              // ✅ NEW LOGIC: Use full placeholder width (from start to end of field space)
              // The placeholder x and width already represent the full field area
              // (from first dot/underscore to last dot/underscore)
              // This gives us 99% coverage of the field space with no padding
              const fieldX = x;
              const fieldWidth = width;
              const fieldY = y - fontSize * 0.35; // Adjust for baseline
              const fieldHeightCalculated = fieldHeight || fontSize * 1.5;

              // Add widget (visual appearance) to the page
              // ✅ Use minimal options to avoid triggering WinAnsi appearance generation
              formField.addToPage(page, {
                x: fieldX,
                y: fieldY,
                width: fieldWidth,
                height: fieldHeightCalculated,
                // Skip appearance options to avoid WinAnsi encoding errors
              });

              // ✅ Set Vietnamese text AFTER addToPage using low-level API
              if (textValue) {
                try {
                  const acroField = formField.acroField;
                  // ✅ Normalize to NFC to prevent decomposed characters
                  const normalizedText = textValue.normalize("NFC");
                  const pdfString = pdfDoc.context.obj(normalizedText);
                  acroField.dict.set(pdfDoc.context.obj("V"), pdfString);
                  console.log(
                    `✍️ Set Vietnamese value (${
                      pdfString?.constructor?.name || typeof pdfString
                    }) for '${fieldName}': '${normalizedText}' - Font in default appearance: ${fontName}`
                  );
                } catch (setValueError) {
                  console.warn(
                    `⚠️ Could not set value for ${fieldName}:`,
                    setValueError.message
                  );
                }
              }

              break;

            case "checkbox":
            case "boolean":
              // Create checkbox
              formField = form.createCheckBox(fieldName);

              if (fillFields && defaultValue === true) {
                formField.check();
              }

              if (readOnly || !makeFieldsEditable) {
                formField.enableReadOnly();
              }

              // ✅ NEW LOGIC: Checkbox size based on field width
              // Default checkbox size is 15px
              // If field width < 15px, use old logic (centered on field)
              // If field width >= 15px, make checkbox square with side = field width
              const defaultCheckboxSize = 15;
              let actualCheckboxSize;
              let checkboxX, checkboxY;

              // Determine field width (use backgroundWidth if available, otherwise use width)
              const effectiveFieldWidth =
                backgroundX !== undefined && backgroundWidth !== undefined
                  ? backgroundWidth
                  : width;

              if (effectiveFieldWidth < defaultCheckboxSize) {
                // Case 1: Field is smaller than default checkbox -> use old centered logic
                actualCheckboxSize = defaultCheckboxSize;

                if (
                  backgroundX !== undefined &&
                  backgroundWidth !== undefined
                ) {
                  // Center checkbox over the digit position
                  const digitCenterX = backgroundX + backgroundWidth / 2;
                  checkboxX = digitCenterX - actualCheckboxSize / 2;
                } else {
                  // Fallback: use placeholder center
                  const centerX = x + width / 2;
                  checkboxX = centerX - actualCheckboxSize / 2;
                }
              } else {
                // Case 2: Field is larger than or equal to default checkbox -> make square checkbox = field width
                actualCheckboxSize = effectiveFieldWidth;

                if (
                  backgroundX !== undefined &&
                  backgroundWidth !== undefined
                ) {
                  // Position checkbox at the start of background
                  checkboxX = backgroundX;
                } else {
                  // Fallback: use placeholder start
                  checkboxX = x;
                }
              }

              checkboxY = y - actualCheckboxSize / 2 + 2; // Adjust for vertical alignment

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
              // Create dropdown
              const options = field.options || [];
              formField = form.createDropdown(fieldName);

              formField.addOptions(options);

              if (fillFields && defaultValue) {
                formField.select(defaultValue);
              }

              if (readOnly || !makeFieldsEditable) {
                formField.enableReadOnly();
              }

              // Add widget to the page
              // ✅ Use minimal options for dropdown to avoid WinAnsi errors
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

              // Default to text field
              formField = form.createTextField(fieldName);

              // ✅ Set Vietnamese font for default text field too
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
                console.warn(`⚠️ Font setup failed for ${fieldName}`);
              }

              const defaultText = fillFields ? defaultValue : "";

              // ✅ NEW LOGIC: Use full placeholder width for default case too
              const defaultFieldX = x;
              const defaultFieldWidth = width;
              const defaultFieldY = y;
              const defaultFieldHeightCalculated =
                fieldHeight || fontSize * 1.5;

              // ✅ Add without appearance options for default case too
              formField.addToPage(page, {
                x: defaultFieldX,
                y: defaultFieldY,
                width: defaultFieldWidth,
                height: defaultFieldHeightCalculated,
              });

              // ✅ Set Vietnamese text AFTER addToPage
              if (defaultText) {
                try {
                  const acroField = formField.acroField;
                  // ✅ Normalize to NFC
                  const normalizedText = defaultText.normalize("NFC");
                  acroField.dict.set(
                    pdfDoc.context.obj("V"),
                    pdfDoc.context.obj(normalizedText)
                  );
                  console.log(
                    `✍️ Set Vietnamese value: "${fieldName}" = "${normalizedText}" using font: ${fontName}`
                  );
                } catch (err) {
                  console.warn(`⚠️ Failed to set value for ${fieldName}`);
                }
              }
          }

          console.log(
            `✅ Created ${fieldType} field: ${fieldName} at page ${pageNum}`
          );
        } catch (fieldError) {
          console.error(
            `❌ Error creating field ${field.fieldName}:`,
            fieldError
          );
          warnings.push({
            fieldName: field.fieldName,
            warning: `Failed to create field: ${fieldError.message}`,
          });
        }
      }
    }

    // Save modified PDF with form fields
    // ✅ CRITICAL: Disable updateFieldAppearances to prevent WinAnsi encoding errors
    const modifiedPdfBytes = await pdfDoc.save({
      updateFieldAppearances: false,
    });

    // Log warnings summary
    if (warnings.length > 0) {
      console.warn(
        `⚠️ ${warnings.length} warnings during form creation:`,
        warnings
      );
    }

    console.log(
      `✅ Created ${fieldDefinitions.length} form fields successfully`
    );

    return { pdfBytes: modifiedPdfBytes, warnings };
  } catch (error) {
    console.error("❌ Error creating AcroForm fields:", error);
    console.error("❌ Stack:", error.stack);
    throw new Error("Không thể tạo fillable PDF: " + error.message);
  }
};

/**
 * Create fillable PDF from placeholder mappings
 * This is a higher-level function that converts placeholder mappings to field definitions
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc
 * @param {Array} placeholders - Danh sách placeholders từ PDFPlaceholderDetector
 * @param {Object} mappings - Mapping object { placeholder_id: tag_id }
 * @param {Array} tags - Danh sách tags
 * @param {Object} options - Additional options
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
    // Convert placeholders + mappings to field definitions
    const fieldDefinitions = [];

    placeholders.forEach((placeholder) => {
      const tagId = mappings[placeholder.id];
      if (!tagId) return; // Skip unmapped placeholders

      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;

      // ✅ Normalize all Vietnamese text to NFC (composed form)
      const normalizedKey = (tag.key || "").normalize("NFC");
      const normalizedDefaultValue = (tag.defaultValue || "").normalize("NFC");

      // Map tag to field definition
      const fieldDef = {
        page: placeholder.page,
        x: placeholder.x,
        y: placeholder.y,
        width: placeholder.width,
        height: placeholder.height,
        backgroundX: placeholder.backgroundX,
        backgroundWidth: placeholder.backgroundWidth,
        fieldName: normalizedKey, // Use normalized tag key as field name
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

    // Create AcroForm fields
    return await createAcroFormFields(
      pdfArrayBuffer,
      fieldDefinitions,
      options
    );
  } catch (error) {
    console.error("❌ Error creating fillable PDF from mappings:", error);
    throw error;
  }
};

/**
 * Map data type to field type
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

/**
 * Create blob URL from PDF bytes for preview
 */
export const createPDFBlobURL = (pdfBytes) => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return url;
};

/**
 * Download PDF file
 */
export const downloadPDF = (pdfBytes, filename) => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Convert Uint8Array to File object
 */
export const pdfBytesToFile = (
  pdfBytes,
  filename = "fillable_contract.pdf"
) => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const file = new File([blob], filename, { type: "application/pdf" });
  return file;
};
