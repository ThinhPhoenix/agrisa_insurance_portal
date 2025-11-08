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

/**
 * Replace placeholders trong PDF bằng text mới
 *
 * @param {ArrayBuffer} pdfArrayBuffer - PDF gốc dạng ArrayBuffer
 * @param {Array} replacements - Mảng các replacement instructions
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 *
 * Replacement format:
 * {
 *   page: 1,              // Page number (1-indexed)
 *   x: 150,               // X coordinate (from pdf.js)
 *   y: 200,               // Y coordinate (from pdf.js)
 *   width: 80,            // Text width
 *   height: 12,           // Text height
 *   oldText: '____(1)____',  // Original placeholder
 *   newText: '____Họ và tên____',  // New text
 *   fontSize: 12          // Font size (optional)
 * }
 */
export const replacePlaceholdersInPDF = async (
  pdfArrayBuffer,
  replacements
) => {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    // Embed Vietnamese-compatible font (Roboto)
    const font = await embedVietnameseFont(pdfDoc);

    // Group replacements by page for efficiency
    const byPage = {};
    replacements.forEach((r) => {
      if (!byPage[r.page]) byPage[r.page] = [];
      byPage[r.page].push(r);
    });

    // ✅ Collect warnings for user feedback
    const warnings = [];

    // Apply replacements page by page
    for (const [pageNum, items] of Object.entries(byPage)) {
      const pageIndex = parseInt(pageNum) - 1; // Convert to 0-indexed
      const page = pages[pageIndex];
      const { height: pageHeight } = page.getSize();

      items.forEach(
        ({
          x,
          y,
          width,
          height: textHeight,
          oldText,
          newText,
          fontSize = 12,
          backgroundX, // NEW: exact position of (number) only
          backgroundWidth, // NEW: exact width of (number) only
        }) => {
          try {
            if (backgroundX !== undefined && backgroundWidth !== undefined) {
              // Background info available
            }

            // ✅ CRITICAL UNDERSTANDING:
            // pdf.js textContent.items[].transform[5] returns Y coordinate in BOTTOM-LEFT system!
            // This Y is the BASELINE of the text (not top-left)
            // So we DON'T need to transform: y is already in pdf-lib coordinate system!
            //
            // Reference: https://github.com/mozilla/pdf.js/issues/8276
            // transform[5] = baseline Y coordinate (from bottom)

            const baselineY = y; // ✅ Already in bottom-left coordinate system

            // ✨ SMART REPLACEMENT STRATEGY (v3 - simplified):
            // 1. Use placeholder width from detector (CORRECT width)
            // 2. Scale text to fit if needed
            // 3. Center text in placeholder
            // 4. Draw white rectangle to cover original

            // ✅ SIMPLE: No underscore preservation, no truncate
            // Just write the text as-is and center it on the digit
            let finalText = newText;
            let finalFontSize = fontSize;
            let textWidth = font.widthOfTextAtSize(newText, fontSize);

            // Check if text will overflow (for warning only, don't truncate)
            if (textWidth > width) {
              warnings.push({
                field: newText,
                original: oldText,
                textWidth: textWidth.toFixed(2),
                fieldWidth: width.toFixed(2),
                overflow: (textWidth - width).toFixed(2),
                warning: `Text may overflow field boundaries`,
              });
            }

            // Step 3: Tính tâm của background (số)
            // backgroundX + backgroundWidth/2 = tâm chính xác của số (1)
            // Text sẽ căn giữa xung quanh tâm này
            let centerX;
            if (backgroundX !== undefined && backgroundWidth !== undefined) {
              // Tâm của digit
              const digitCenter = backgroundX + (backgroundWidth / 2);
              // Offset adjustment để căn chính xác hơn (fix systematic left-alignment)
              const offsetAdjustment = 8;
              centerX = digitCenter + offsetAdjustment;

              console.log(`📍 Center "${newText}":`, {
                backgroundX: backgroundX.toFixed(2),
                backgroundWidth: backgroundWidth.toFixed(2),
                digitCenter: digitCenter.toFixed(2),
                offsetAdjustment,
                centerX: centerX.toFixed(2),
                textWidth: textWidth.toFixed(2),
                oldText
              });
            } else {
              // Fallback
              centerX = x + (width / 2);
            }

            // Step 4: Căn giữa text
            const textX = centerX - (textWidth / 2);

            // Step 5: Draw WHITE rectangle based on FINAL TEXT width
            // Background must ONLY cover the new text (e.g., "__họ tên__"), not old underscores
            const rectX = textX - 2; // Add small padding on left
            const rectWidth = textWidth + 4; // Add small padding on both sides

            // ✨ CRITICAL: Rectangle height must be increased to fully cover (number)
            // Standard: 1.3x was not enough, increase to 1.5x
            const rectY = baselineY - finalFontSize * 0.35; // Start slightly lower (was 0.3)
            const rectHeight = finalFontSize * 1.5; // Increased to 1.5x (was 1.3x) to fully cover (number)

            page.drawRectangle({
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              color: rgb(1, 1, 1), // white
              opacity: 1,
            });

            // Step 6: Draw optimized text
            try {
              page.drawText(finalText, {
                x: textX,
                y: baselineY,
                size: finalFontSize,
                font: font,
                color: rgb(0, 0, 0),
              });

              // Check fit
              if (textWidth <= width) {
                // Text fits perfectly
              } else {
                const overflow = textWidth - width;
                // Text overflows
              }
            } catch (textError) {
              throw textError;
            }
          } catch (error) {
            // Error handling
          }
        }
      );
    }

    // Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Log warnings summary
    if (warnings.length > 0) {
      warnings.forEach((w, i) => {
        // Warning details
      });
    }

    return { pdfBytes: modifiedPdfBytes, warnings };
  } catch (error) {
    console.error("❌ Error modifying PDF:", error);
    console.error("❌ Stack:", error.stack);
    throw new Error("Không thể chỉnh sửa PDF: " + error.message);
  }
};

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
