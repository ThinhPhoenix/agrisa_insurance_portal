/**
 * PDF Editor Utility
 * Uses pdf-lib to modify PDF files in browser
 *
 * Purpose: Replace placeholders in PDF with actual text
 * Input: Original PDF + replacement instructions
 * Output: Modified PDF bytes + blob URL
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Load and embed Roboto font from Google Fonts (supports Vietnamese)
 * @param {PDFDocument} pdfDoc - PDF document
 * @returns {Promise<PDFFont>} - Embedded font
 */
const embedVietnameseFont = async (pdfDoc) => {
  console.log("📦 Font embedding started...");

  // ✅ TEMPORARY FIX: Use built-in Helvetica first to test if text drawing works
  // Once text drawing works, we can add custom Vietnamese font support
  console.log("⚠️ Using Helvetica (built-in) for testing...");
  console.log("⚠️ Vietnamese characters may not display correctly!");

  const builtInFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  console.log("✅ Helvetica embedded (built-in font)");

  // Test font
  try {
    const testWidth = builtInFont.widthOfTextAtSize("Test ABC 123", 12);
    console.log(`✅ Font test: width = ${testWidth.toFixed(2)}px at 12pt`);
  } catch (err) {
    console.error("❌ Font test failed:", err.message);
  }

  return builtInFont;

  /* TODO: Add Vietnamese font support later
  try {
    console.log("📦 Loading Vietnamese font (Roboto)...");
    pdfDoc.registerFontkit(fontkit);
    
    const fontUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2";
    const fontBytes = await fetch(fontUrl).then((res) => {
      if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
      return res.arrayBuffer();
    });
    
    const customFont = await pdfDoc.embedFont(fontBytes);
    console.log("✅ Roboto font embedded successfully");
    return customFont;
  } catch (error) {
    console.error("❌ Failed to load custom font:", error);
    return builtInFont; // Fallback to Helvetica
  }
  */
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
    console.log("\n🔧 ═══════════════════════════════════════════════════════");
    console.log("🔧 Starting PDF modification with pdf-lib");
    console.log("📊 Replacements to apply:", replacements.length);
    console.log("═══════════════════════════════════════════════════════\n");

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    console.log("✅ PDF loaded:", pages.length, "pages");

    // Embed Vietnamese-compatible font (Roboto)
    const font = await embedVietnameseFont(pdfDoc);

    // Group replacements by page for efficiency
    const byPage = {};
    replacements.forEach((r) => {
      if (!byPage[r.page]) byPage[r.page] = [];
      byPage[r.page].push(r);
    });

    console.log("📄 Pages to modify:", Object.keys(byPage).join(", "));

    // Apply replacements page by page
    for (const [pageNum, items] of Object.entries(byPage)) {
      const pageIndex = parseInt(pageNum) - 1; // Convert to 0-indexed
      const page = pages[pageIndex];
      const { height: pageHeight } = page.getSize();

      console.log(
        `\n📃 Processing page ${pageNum} (${items.length} replacements)...`
      );

      items.forEach(
        ({
          x,
          y,
          width,
          height: textHeight,
          oldText,
          newText,
          fontSize = 12,
        }) => {
          try {
            console.log(`\n  🔄 Replacing "${oldText}" → "${newText}"`);
            console.log(
              `     📍 Input coordinates: x=${x.toFixed(2)}, y=${y.toFixed(
                2
              )} (from pdf.js)`
            );
            console.log(
              `     📏 Dimensions: width=${width.toFixed(
                2
              )}, height=${textHeight.toFixed(2)}, fontSize=${fontSize}`
            );
            console.log(`     📄 Page height: ${pageHeight.toFixed(2)}`);

            // ✅ CRITICAL UNDERSTANDING:
            // pdf.js textContent.items[].transform[5] returns Y coordinate in BOTTOM-LEFT system!
            // This Y is the BASELINE of the text (not top-left)
            // So we DON'T need to transform: y is already in pdf-lib coordinate system!
            //
            // Reference: https://github.com/mozilla/pdf.js/issues/8276
            // transform[5] = baseline Y coordinate (from bottom)

            const baselineY = y; // ✅ Already in bottom-left coordinate system

            console.log(
              `     ✅ Using Y as baseline: ${baselineY.toFixed(
                2
              )} (no transformation needed)`
            );

            // ✅ FINAL STRATEGY:
            // 1. Che placeholder (1), (2), etc. bằng rectangle nhỏ
            // 2. Text CENTERED: Tâm của text đè lên vị trí placeholder center
            // 3. Text tràn 2 bên tự nhiên
            // 4. Rectangle cao hơn một chút để thấy gạch chân ___

            // Step 1: Calculate text width
            let textWidth;
            try {
              textWidth = font.widthOfTextAtSize(newText, fontSize);
              console.log(
                `     📏 Text width: ${textWidth.toFixed(2)}px (${
                  newText.length
                } chars)`
              );
            } catch (err) {
              console.warn(
                `     ⚠️ Failed to calculate text width:`,
                err.message
              );
              textWidth = newText.length * fontSize * 0.6; // Fallback
              console.log(
                `     📏 Estimated text width: ${textWidth.toFixed(2)}px`
              );
            }

            console.log(`     📏 Placeholder width: ${width.toFixed(2)}px`);

            // Step 2: Calculate center of placeholder
            const placeholderCenterX = x + width / 2;
            console.log(
              `     🎯 Placeholder center X: ${placeholderCenterX.toFixed(2)}`
            );

            // Step 3: Draw MINIMAL rectangle - CHỈ CHE SỐ (1), (2), etc.
            // ✅ CRITICAL: Rectangle NHỎ - chỉ che số, KHÔNG che gạch dưới ____
            // Estimate: (1) = ~3 chars, (10) = ~4 chars
            const numberWidth = Math.min(fontSize * 2.5, width * 0.3); // Max 30% của placeholder
            const rectWidth = numberWidth;

            // Rectangle centered on placeholder center
            const rectX = placeholderCenterX - rectWidth / 2;

            // Rectangle position - CAO HƠN để thấy gạch chân
            const rectY = baselineY - fontSize * 0.05; // Cao hơn baseline
            const rectHeight = fontSize * 1.0; // Vừa đủ che số

            page.drawRectangle({
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              color: rgb(1, 1, 1), // white
              opacity: 1,
            });
            console.log(
              `     🟦 SMALL rectangle (chỉ che số): x=${rectX.toFixed(
                2
              )}, y=${rectY.toFixed(2)}, w=${rectWidth.toFixed(
                2
              )}, h=${rectHeight.toFixed(2)}`
            );
            console.log(
              `     🟦 Rectangle centered at placeholder center (${placeholderCenterX.toFixed(
                2
              )})`
            );

            // Step 4: Calculate text X position (CENTER text on placeholder center)
            // Text center = placeholderCenterX
            // Text start X = placeholderCenterX - (textWidth / 2)
            const textX = placeholderCenterX - textWidth / 2;

            console.log(`     📐 Text center aligns with placeholder center`);
            console.log(
              `     📐 Text X: ${textX.toFixed(
                2
              )} (centered, may overflow both sides)`
            );

            // Step 5: Draw text CENTERED on placeholder
            try {
              page.drawText(newText, {
                x: textX, // ✅ CENTERED - tâm text trùng tâm placeholder
                y: baselineY, // ✅ Same baseline (cao hơn rectangle)
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
              });

              console.log(
                `     ✏️ Text: "${newText}" (width: ${textWidth.toFixed(2)}px)`
              );
              console.log(
                `     🎯 Text position: x=${textX.toFixed(
                  2
                )}, y=${baselineY.toFixed(2)}`
              );
              console.log(
                `     🎯 Text range: ${textX.toFixed(2)} → ${(
                  textX + textWidth
                ).toFixed(2)}`
              );
              console.log(
                `     🎯 Placeholder range: ${x.toFixed(2)} → ${(
                  x + width
                ).toFixed(2)}`
              );

              // Check overflow
              const leftOverflow = Math.max(0, x - textX);
              const rightOverflow = Math.max(
                0,
                textX + textWidth - (x + width)
              );

              if (leftOverflow > 0 || rightOverflow > 0) {
                console.log(
                  `     ↔️ Text overflows: left=${leftOverflow.toFixed(
                    2
                  )}px, right=${rightOverflow.toFixed(2)}px (OK)`
                );
              }

              console.log(`     ✅ Replacement complete!\n`);
            } catch (textError) {
              console.error(`     ❌ Failed to draw text:`, textError.message);
              console.error(`     ❌ Text: "${newText}"`);
              throw textError;
            }
          } catch (error) {
            console.error(
              `     ❌ Error replacing "${oldText}":`,
              error.message
            );
            console.error(`     ❌ Error stack:`, error.stack);
          }
        }
      );
    }

    // Save modified PDF
    console.log("\n💾 Saving modified PDF...");
    const modifiedPdfBytes = await pdfDoc.save();

    console.log("✅ PDF modification complete!");
    console.log(
      "📊 Output size:",
      (modifiedPdfBytes.length / 1024).toFixed(2),
      "KB"
    );
    console.log("═══════════════════════════════════════════════════════\n");

    return modifiedPdfBytes;
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
  console.log("🔗 Created blob URL:", url);
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
  console.log("📥 Downloaded:", filename);
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

  console.log("📋 Built document_tags:", documentTags);
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

  console.log("📄 Created File object:", {
    name: file.name,
    size: (file.size / 1024).toFixed(2) + " KB",
    type: file.type,
  });

  return file;
};
