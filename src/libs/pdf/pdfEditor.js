/**
 * PDF Editor Utility
 * Uses pdf-lib to modify PDF files in browser
 *
 * Purpose: Replace placeholders in PDF with actual text
 * Input: Original PDF + replacement instructions
 * Output: Modified PDF bytes + blob URL
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ✅ Global font cache to avoid re-downloading font on every PDF modification
let cachedFontBytes = null;
let cachedFontkitModule = null;

/**
 * ✨ SMART REPLACEMENT ALGORITHM
 * Calculate optimal replacement pattern with dynamic underscores and adaptive font scaling
 *
 * @param {string} originalText - Original placeholder text (e.g., "____(1)____")
 * @param {string} newText - New text to replace (e.g., "họ và tên")
 * @param {number} placeholderWidth - Width of placeholder in PDF units
 * @param {PDFFont} font - Font object from pdf-lib
 * @param {number} fontSize - Original font size
 * @returns {Object} - Optimal replacement configuration
 */
const calculateOptimalReplacement = (
  originalText,
  newText,
  placeholderWidth,
  font,
  fontSize
) => {
  // Step 1: Count underscores in original placeholder
  const underscoreMatch = originalText.match(/^(_+)/);
  const leadingUnderscores = underscoreMatch ? underscoreMatch[1].length : 0;

  // Assume symmetric underscores (e.g., ____(1)____ has 4 on each side)
  const underscoresPerSide = leadingUnderscores;

  // Step 2: Measure widths
  const underscoreWidth = font.widthOfTextAtSize("_", fontSize);
  const textWidth = font.widthOfTextAtSize(newText, fontSize);

  // Step 3: Try to fit with original underscores
  const originalUnderscoreSpace = underscoresPerSide * 2 * underscoreWidth;
  const availableForText = placeholderWidth - originalUnderscoreSpace;

  if (textWidth <= availableForText) {
    // ✅ CASE 1: Text fits perfectly with original underscores
    const pattern =
      "_".repeat(underscoresPerSide) + newText + "_".repeat(underscoresPerSide);

    return {
      pattern,
      fontSize,
      needsScaling: false,
      underscoresPerSide,
      strategy: "keep_original",
    };
  }

  // Step 4: Try reducing underscores progressively
  for (let u = underscoresPerSide - 1; u >= 1; u--) {
    const underscoreSpace = u * 2 * underscoreWidth;
    const available = placeholderWidth - underscoreSpace;

    if (textWidth <= available) {
      // ✅ CASE 2: Text fits with reduced underscores
      const pattern = "_".repeat(u) + newText + "_".repeat(u);

      return {
        pattern,
        fontSize,
        needsScaling: false,
        underscoresPerSide: u,
        strategy: "reduce_underscores",
      };
    }
  }

  // Step 5: Use minimal underscores (1 per side) and scale font if needed
  const minUnderscores = 1;
  const minUnderscoreSpace = minUnderscores * 2 * underscoreWidth;
  const maxAvailable = placeholderWidth - minUnderscoreSpace;

  // Calculate required scaling
  const scaleFactor = maxAvailable / textWidth;
  const minFontSize = 8; // Absolute minimum for readability
  const maxScaleFactor = 0.65; // Don't scale below 65% of original

  const effectiveScaleFactor = Math.max(maxScaleFactor, scaleFactor);
  const newFontSize = Math.max(minFontSize, fontSize * effectiveScaleFactor);

  // Recalculate widths with new font size
  const scaledTextWidth = font.widthOfTextAtSize(newText, newFontSize);
  const scaledUnderscoreWidth = font.widthOfTextAtSize("_", newFontSize);
  const scaledTotalWidth =
    scaledTextWidth + minUnderscores * 2 * scaledUnderscoreWidth;

  const pattern = "_" + newText + "_";

  // Check if scaling is sufficient
  const warning =
    scaledTotalWidth > placeholderWidth
      ? "Text will overflow placeholder boundaries"
      : newFontSize < 10
      ? "Font size reduced - may be harder to read"
      : null;

  return {
    pattern,
    fontSize: newFontSize,
    needsScaling: true,
    underscoresPerSide: minUnderscores,
    strategy: "scale_font",
    warning,
    scaleFactor: effectiveScaleFactor,
  };
};

/**
 * Load and embed Roboto font from Google Fonts (supports Vietnamese)
 * @param {PDFDocument} pdfDoc - PDF document
 * @returns {Promise<PDFFont>} - Embedded font
 */
const embedVietnameseFont = async (pdfDoc) => {
  try {
    // ✅ PRODUCTION: Load full Vietnamese font (TTF for complete charset)

    // ✅ Check cache first
    if (cachedFontBytes) {
    } else {
      // Use CDN with FULL Vietnamese charset (not subset)
      // Noto Sans has complete Vietnamese Unicode support
      const fontUrl =
        "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf";

      const fontResponse = await fetch(fontUrl);

      if (!fontResponse.ok) {
        throw new Error(
          `Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`
        );
      }

      cachedFontBytes = await fontResponse.arrayBuffer();
    }

    // ✅ CRITICAL: pdf-lib can embed .ttf directly without fontkit for basic fonts
    // For .woff2, we need to use fontkit (require installation: npm install @pdf-lib/fontkit)
    // Let's try direct embedding first (works for .ttf)

    // Try using fontkit if available
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
    } catch (fontkitError) {
      // Fallback: Use .ttf version instead of .woff2 (works without fontkit)
      // Check if we have cached TTF font
      if (!cachedFontBytes || cachedFontBytes.byteLength < 100000) {
        const ttfFontUrl =
          "https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf";

        const ttfResponse = await fetch(ttfFontUrl);
        if (!ttfResponse.ok)
          throw new Error(`TTF font fetch failed: ${ttfResponse.status}`);

        cachedFontBytes = await ttfResponse.arrayBuffer();
      }

      customFont = await pdfDoc.embedFont(cachedFontBytes);
    }

    // Test font with ALL Vietnamese characters (including problematic ones)
    try {
      const testText = "ăắằẳẵặ êếềểễệ ôốồổỗộ ơớờởỡợ ưứừửữự đĐ";
      const testWidth = customFont.widthOfTextAtSize(testText, 12);

      // Test specific problem case
      const problemText = "chữ khác";
      const problemWidth = customFont.widthOfTextAtSize(problemText, 12);
    } catch (err) {}

    return customFont;
  } catch (error) {
    // Fallback: Use built-in Helvetica
    const builtInFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    return builtInFont;
  }
};

// ❌ REMOVED: replacePlaceholdersInPDF function
// This function was used to write Vietnamese text onto PDF canvas as a visual layer
// It has been removed as we now only create fillable AcroForm fields
// without any text writing layer

/**
 * Create blob URL from PDF bytes for preview
 *
 * @param {Uint8Array} pdfBytes - PDF bytes from pdf-lib
 * @returns {string} - Blob URL (blob:http://...)
 */
export const createPDFBlobURL = (pdfBytes) => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return url;
};

/**
 * Download PDF file
 *
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @param {string} filename - Download filename
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
 * Build document_tags JSON từ mappings và tags
 *
 * @param {Array} placeholders - Danh sách placeholders
 * @param {Object} mappings - Mapping object { placeholder_id: tag_id }
 * @param {Array} tags - Danh sách tags
 * @returns {Object} - document_tags theo format backend
 *
 * Output format:
 * {
 *   "họ và tên": "string",
 *   "ngày sinh": "date",
 *   "số cmnd": "string"
 * }
 */
export const buildDocumentTags = (placeholders, mappings, tags) => {
  const documentTags = {};

  placeholders.forEach((placeholder) => {
    const tagId = mappings[placeholder.id];
    if (!tagId) return; // Skip unmapped

    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    // Map dataType to backend format
    const dataTypeMapping = {
      string: "string",
      text: "string",
      textarea: "string",
      number: "number",
      int: "int",
      integer: "int",
      float: "number",
      decimal: "number",
      date: "date",
      datetime: "datetime",
      time: "time",
      boolean: "boolean",
      select: "string",
      email: "string",
      phone: "string",
      url: "string",
    };

    const backendDataType = dataTypeMapping[tag.dataType] || "string";

    // Use tag.key as field name
    documentTags[tag.key] = backendDataType;
  });

  return documentTags;
};

/**
 * Convert Uint8Array (pdf-lib output) to File object
 *
 * @param {Uint8Array} pdfBytes - Modified PDF bytes
 * @param {string} filename - File name
 * @returns {File} - File object ready for FormData
 */
export const pdfBytesToFile = (
  pdfBytes,
  filename = "modified_contract.pdf"
) => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const file = new File([blob], filename, { type: "application/pdf" });

  return file;
};

/**
 * Create fillable PDF with AcroForm fields
 * This creates interactive PDF forms instead of filling and flattening
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc
 * @param {Array} fieldDefinitions - Field definitions
 * @param {Object} options - Options for field creation
 * @returns {Promise<{pdfBytes: Uint8Array, warnings: Array}>}
 */
export const createFillablePDF = async (
  pdfArrayBuffer,
  fieldDefinitions,
  options = {}
) => {
  try {
    const {
      fillFields = false,
      makeFieldsEditable = true,
      showBorders = true,
      removeOriginalText = true, // Remove placeholder background text (default)
      writeTextBeforeField = false, // No text writing layer (pure AcroForm)
    } = options;

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    // Embed Vietnamese-compatible font
    const font = await embedVietnameseFont(pdfDoc);

    // Create AcroForm fields directly
    // Fields will have ASCII-safe pre-filled values for BE
    // No text writing layer - pure fillable PDF approach

    // Get or create the form
    const form = pdfDoc.getForm();

    // Group fields by page
    const byPage = {};
    fieldDefinitions.forEach((field) => {
      if (!byPage[field.page]) byPage[field.page] = [];
      byPage[field.page].push(field);
    });

    const warnings = [];

    // Create fields page by page
    for (const [pageNum, fields] of Object.entries(byPage)) {
      const pageIndex = parseInt(pageNum) - 1;
      const page = pages[pageIndex];

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
            fontSize = 12,
            readOnly = false,
            multiline = false,
            backgroundX,
            backgroundWidth,
          } = field;

          // Create form field based on type
          let formField;

          if (fieldType === "checkbox" || fieldType === "boolean") {
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
            const effectiveFieldWidth = (backgroundX !== undefined && backgroundWidth !== undefined)
              ? backgroundWidth
              : width;

            if (effectiveFieldWidth < defaultCheckboxSize) {
              // Case 1: Field is smaller than default checkbox -> use old centered logic
              actualCheckboxSize = defaultCheckboxSize;

              if (backgroundX !== undefined && backgroundWidth !== undefined) {
                // Center checkbox over the digit position
                const digitCenterX = backgroundX + backgroundWidth / 2;
                checkboxX = digitCenterX - actualCheckboxSize / 2;
                console.log(
                  `✅ Checkbox (small field) using backgroundX: ${backgroundX}, backgroundWidth: ${backgroundWidth}, checkboxX: ${checkboxX}`
                );
              } else {
                // Fallback: use placeholder center
                const centerX = x + width / 2;
                checkboxX = centerX - actualCheckboxSize / 2;
                console.log(
                  `⚠️ Checkbox (small field) fallback - using x: ${x}, width: ${width}, checkboxX: ${checkboxX}`
                );
              }
            } else {
              // Case 2: Field is larger than or equal to default checkbox -> make square checkbox = field width
              actualCheckboxSize = effectiveFieldWidth;

              if (backgroundX !== undefined && backgroundWidth !== undefined) {
                // Position checkbox at the start of background
                checkboxX = backgroundX;
                console.log(
                  `✅ Checkbox (large field) using backgroundX: ${backgroundX}, size: ${actualCheckboxSize}`
                );
              } else {
                // Fallback: use placeholder start
                checkboxX = x;
                console.log(
                  `⚠️ Checkbox (large field) fallback - using x: ${x}, size: ${actualCheckboxSize}`
                );
              }
            }

            checkboxY = y - actualCheckboxSize / 2 + 2; // Adjust for vertical alignment

            console.log(
              `📐 Checkbox "${fieldName}": size=${actualCheckboxSize}, checkboxX=${checkboxX.toFixed(
                2
              )}, checkboxY=${checkboxY.toFixed(2)}`
            );

            formField.addToPage(page, {
              x: checkboxX,
              y: checkboxY,
              width: actualCheckboxSize,
              height: actualCheckboxSize,
              backgroundColor: rgb(1, 1, 1),
              borderColor: rgb(0.7, 0.7, 0.7),
              borderWidth: showBorders ? 1 : 0,
            });
          } else {
            // Text field (default)
            formField = form.createTextField(fieldName);

            // ✅ Reduce font size to avoid overlapping when multiple fields are close
            const reducedFontSize = fontSize * 0.85; // 85% of original font size

            // ✅ CRITICAL: Embed Vietnamese font into form resources and set as field font
            // This allows Vietnamese text to be rendered properly in form fields
            try {
              // Get font name from embedded font
              const fontName = font.name;
              const fontRef = pdfDoc.context.getObjectRef(font.ref);

              // Add font to AcroForm's default resources
              const acroForm = pdfDoc.catalog.lookup(pdfDoc.context.obj('AcroForm'));
              if (acroForm) {
                const dr = acroForm.get(pdfDoc.context.obj('DR'));
                const fontDict = dr?.get(pdfDoc.context.obj('Font'));
                if (fontDict) {
                  fontDict.set(pdfDoc.context.obj(fontName), fontRef);
                }
              }

              // Set Default Appearance with embedded font
              const acroField = formField.acroField;
              acroField.setDefaultAppearance(
                `/${fontName} ${reducedFontSize} Tf 0 0 0 rg`
              );
            } catch (daError) {
              console.warn(
                `⚠️ Could not set Vietnamese font for ${fieldName}:`,
                daError.message
              );
            }

            // ⚠️ CRITICAL: DO NOT call setText() before addToPage()
            // setText() stores text but addToPage() will try to render it with WinAnsi
            // We will set the value AFTER addToPage using low-level PDF API
            const textValue = fillFields ? defaultValue || fieldName : "";

            // Set multiline/readonly BEFORE adding to page
            if (multiline) {
              formField.enableMultiline();
            }

            if (readOnly || !makeFieldsEditable) {
              formField.enableReadOnly();
            }

            // ✅ NEW LOGIC: Use full placeholder width (from start to end of field space)
            // The placeholder x and width already represent the full field area
            // (from first dot/underscore to last dot/underscore)
            // This gives us 99% coverage of the field space with no padding
            const fieldX = x;
            const fieldWidth = width;
            const fieldY = y - reducedFontSize * 0.3; // Position field at text baseline
            const fieldHeightCalculated = reducedFontSize * 1.2; // Field height 1.2x reduced font size

            console.log(`📐 Field dimensions for "${fieldName}":`, {
              fieldX: fieldX.toFixed(2),
              fieldWidth: fieldWidth.toFixed(2),
              fieldY: fieldY.toFixed(2),
              fieldHeight: fieldHeightCalculated.toFixed(2),
              fontSize: reducedFontSize.toFixed(2),
            });
            console.log(`📦 Placeholder data received for "${fieldName}":`, {
              originalX: x,
              originalWidth: width,
              backgroundX: backgroundX,
              backgroundWidth: backgroundWidth,
            });

            // ✅ CRITICAL: Add to page WITHOUT appearance options to prevent auto-generation
            // This avoids the WinAnsi encoding error when pdf-lib tries to render text
            // The /DA string we set earlier will be used by PDF readers instead
            try {
              // Use minimal options to avoid triggering appearance generation
              formField.addToPage(page, {
                x: fieldX,
                y: fieldY,
                width: fieldWidth,
                height: fieldHeightCalculated,
                // ⚠️ Don't specify textColor - it triggers appearance generation
                // backgroundColor: rgb(1, 1, 1, 0), // Skip to avoid appearance gen
                // borderColor: rgb(0.7, 0.7, 0.7),  // Skip to avoid appearance gen
                // borderWidth: showBorders ? 1 : 0,  // Skip to avoid appearance gen
              });

              // ✅ Set field value AFTER addToPage using low-level API
              // This sets the /V (Value) entry without triggering appearance generation
              if (textValue && fillFields) {
                try {
                  const acroField = formField.acroField;
                  // ✅ CRITICAL: Normalize Vietnamese text to NFC (composed form)
                  const normalizedText = textValue.normalize('NFC');

                  // ✅ Encode as UTF-16BE with BOM for proper Unicode support in PDF
                  // PDF spec: Text strings can be PDFDocEncoding or UTF-16BE (with BOM: 0xFEFF)
                  const utf16Bytes = new Uint8Array([0xFE, 0xFF]); // BOM
                  const encoder = new TextEncoder();

                  // Convert to UTF-16BE manually
                  let utf16String = '\uFEFF'; // BOM character
                  for (let i = 0; i < normalizedText.length; i++) {
                    const code = normalizedText.charCodeAt(i);
                    utf16String += String.fromCharCode(code);
                  }

                  // Use PDFHexString for UTF-16BE encoding
                  const { PDFHexString } = await import('pdf-lib');

                  // Convert text to UTF-16BE hex string
                  let hexStr = 'FEFF'; // BOM in hex
                  for (let i = 0; i < normalizedText.length; i++) {
                    const code = normalizedText.charCodeAt(i);
                    hexStr += code.toString(16).padStart(4, '0').toUpperCase();
                  }

                  const pdfHexString = PDFHexString.of(hexStr);
                  acroField.dict.set(pdfDoc.context.obj('V'), pdfHexString);

                  console.log(
                    `✍️ Set Vietnamese value (UTF-16BE) for "${fieldName}": "${normalizedText}"`
                  );
                } catch (setValueError) {
                  console.warn(
                    `⚠️ Could not set value for ${fieldName}:`,
                    setValueError.message
                  );
                }
              }
            } catch (addError) {
              console.error(
                `❌ Failed to add field to page: ${fieldName}`,
                addError
              );
              throw addError;
            }

            // ❌ Don't call updateAppearances() - it will try to render with WinAnsi
            // Field value is set directly in /V, PDF reader will render using /DA font
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

    // Save PDF with form fields
    // ✅ CRITICAL: Save with updateFieldAppearances: false to prevent WinAnsi errors
    const modifiedPdfBytes = await pdfDoc.save({
      updateFieldAppearances: false, // Don't regenerate appearances with StandardFont
    });

    if (warnings.length > 0) {
      console.warn(
        `⚠️ ${warnings.length} warnings during form creation:`,
        warnings
      );
    }

    return { pdfBytes: modifiedPdfBytes, warnings };
  } catch (error) {
    console.error("❌ Error creating fillable PDF:", error);
    throw new Error("Không thể tạo fillable PDF: " + error.message);
  }
};

/**
 * Create fillable PDF from placeholder mappings
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc
 * @param {Array} placeholders - Placeholders from detector
 * @param {Object} mappings - Mapping object { placeholder_id: tag_id }
 * @param {Array} tags - Tag definitions
 * @param {Object} options - Options
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
      if (!tagId) return;

      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;

      // ✅ Normalize all Vietnamese text to NFC (composed form) to prevent decomposed characters
      const normalizedKey = (tag.key || "").normalize('NFC');
      const normalizedDefaultValue = (tag.defaultValue || tag.key || "").normalize('NFC');

      const fieldDef = {
        page: placeholder.page,
        x: placeholder.x,
        y: placeholder.y,
        width: placeholder.width,
        height: placeholder.height,
        backgroundX: placeholder.backgroundX,
        backgroundWidth: placeholder.backgroundWidth,
        fieldName: normalizedKey,
        fieldType: mapDataTypeToFieldType(tag.dataType),
        // ✅ Use normalized tag.key as default value to display in PDF (not empty)
        defaultValue: normalizedDefaultValue,
        fontSize: placeholder.fontSize || 12,
        readOnly: tag.readOnly || false,
        multiline: tag.dataType === "textarea",
      };

      fieldDefinitions.push(fieldDef);
    });

    return await createFillablePDF(pdfArrayBuffer, fieldDefinitions, options);
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
    select: "text",
    email: "text",
    phone: "text",
    url: "text",
  };

  return mapping[dataType] || "text";
};
