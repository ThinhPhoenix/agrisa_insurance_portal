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
  console.log("\n🧮 ═══════════════════════════════════════════════════════");
  console.log("🧮 SMART REPLACEMENT CALCULATION");
  console.log("📊 Input:");
  console.log(`   - Original: "${originalText}"`);
  console.log(`   - New text: "${newText}"`);
  console.log(`   - Placeholder width: ${placeholderWidth.toFixed(2)}px`);
  console.log(`   - Font size: ${fontSize}pt`);

  // Step 1: Count underscores in original placeholder
  const underscoreMatch = originalText.match(/^(_+)/);
  const leadingUnderscores = underscoreMatch ? underscoreMatch[1].length : 0;

  // Assume symmetric underscores (e.g., ____(1)____ has 4 on each side)
  const underscoresPerSide = leadingUnderscores;

  console.log(`   - Underscores per side: ${underscoresPerSide}`);

  // Step 2: Measure widths
  const underscoreWidth = font.widthOfTextAtSize("_", fontSize);
  const textWidth = font.widthOfTextAtSize(newText, fontSize);

  console.log(`📏 Measurements (at ${fontSize}pt):`);
  console.log(`   - Underscore width: ${underscoreWidth.toFixed(2)}px`);
  console.log(`   - Text width: ${textWidth.toFixed(2)}px`);

  // Step 3: Try to fit with original underscores
  const originalUnderscoreSpace = underscoresPerSide * 2 * underscoreWidth;
  const availableForText = placeholderWidth - originalUnderscoreSpace;

  console.log(`💡 Strategy Analysis:`);
  console.log(`   - Space for underscores (${underscoresPerSide}*2): ${originalUnderscoreSpace.toFixed(2)}px`);
  console.log(`   - Available for text: ${availableForText.toFixed(2)}px`);
  console.log(`   - Text needs: ${textWidth.toFixed(2)}px`);

  if (textWidth <= availableForText) {
    // ✅ CASE 1: Text fits perfectly with original underscores
    const pattern = "_".repeat(underscoresPerSide) + newText + "_".repeat(underscoresPerSide);
    console.log(`✅ SOLUTION: Keep original underscores`);
    console.log(`   Pattern: "${pattern}"`);
    console.log(`   Font size: ${fontSize}pt (no scaling)`);
    console.log("═══════════════════════════════════════════════════════\n");

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
      console.log(`✅ SOLUTION: Reduce underscores to ${u} per side`);
      console.log(`   Pattern: "${pattern}"`);
      console.log(`   Font size: ${fontSize}pt (no scaling)`);
      console.log(`   Space saved: ${(originalUnderscoreSpace - underscoreSpace).toFixed(2)}px`);
      console.log("═══════════════════════════════════════════════════════\n");

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

  console.log(`⚠️ Text too long even with minimal underscores`);
  console.log(`   Max available width (with 1 underscore each): ${maxAvailable.toFixed(2)}px`);
  console.log(`   Text needs: ${textWidth.toFixed(2)}px`);

  // Calculate required scaling
  const scaleFactor = maxAvailable / textWidth;
  const minFontSize = 8; // Absolute minimum for readability
  const maxScaleFactor = 0.65; // Don't scale below 65% of original

  const effectiveScaleFactor = Math.max(maxScaleFactor, scaleFactor);
  const newFontSize = Math.max(minFontSize, fontSize * effectiveScaleFactor);

  console.log(`🔽 Font Scaling Calculation:`);
  console.log(`   - Scale factor needed: ${(scaleFactor * 100).toFixed(1)}%`);
  console.log(`   - Effective scale factor: ${(effectiveScaleFactor * 100).toFixed(1)}%`);
  console.log(`   - New font size: ${newFontSize.toFixed(1)}pt (min: ${minFontSize}pt)`);

  // Recalculate widths with new font size
  const scaledTextWidth = font.widthOfTextAtSize(newText, newFontSize);
  const scaledUnderscoreWidth = font.widthOfTextAtSize("_", newFontSize);
  const scaledTotalWidth = scaledTextWidth + (minUnderscores * 2 * scaledUnderscoreWidth);

  console.log(`📐 Scaled measurements:`);
  console.log(`   - Scaled text width: ${scaledTextWidth.toFixed(2)}px`);
  console.log(`   - Scaled underscore width: ${scaledUnderscoreWidth.toFixed(2)}px`);
  console.log(`   - Total width: ${scaledTotalWidth.toFixed(2)}px`);
  console.log(`   - Placeholder width: ${placeholderWidth.toFixed(2)}px`);
  console.log(`   - Fit: ${scaledTotalWidth <= placeholderWidth ? "✅ YES" : "⚠️ NO (will overflow)"}`);

  const pattern = "_" + newText + "_";

  // Check if scaling is sufficient
  const warning = scaledTotalWidth > placeholderWidth
    ? "Text will overflow placeholder boundaries"
    : newFontSize < 10
    ? "Font size reduced - may be harder to read"
    : null;

  if (warning) {
    console.log(`⚠️ WARNING: ${warning}`);
  }

  console.log(`✅ SOLUTION: Minimal underscores + font scaling`);
  console.log(`   Pattern: "${pattern}"`);
  console.log(`   Font size: ${newFontSize.toFixed(1)}pt (scaled from ${fontSize}pt)`);
  console.log("═══════════════════════════════════════════════════════\n");

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
  console.log("📦 Font embedding started...");

  try {
    // ✅ PRODUCTION: Load full Vietnamese font (TTF for complete charset)
    console.log("📦 Loading Vietnamese font (Noto Sans - Full charset)...");

    // ✅ Check cache first
    if (cachedFontBytes) {
      console.log("⚡ Using cached font bytes (no download needed)");
    } else {
      // Use CDN with FULL Vietnamese charset (not subset)
      // Noto Sans has complete Vietnamese Unicode support
      const fontUrl = "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf";

      console.log("🌐 Fetching font from:", fontUrl);
      const fontResponse = await fetch(fontUrl);

      if (!fontResponse.ok) {
        throw new Error(`Font fetch failed: ${fontResponse.status} ${fontResponse.statusText}`);
      }

      cachedFontBytes = await fontResponse.arrayBuffer();
      console.log(`✅ Font downloaded & cached: ${(cachedFontBytes.byteLength / 1024).toFixed(2)} KB`);
      console.log(`✅ Using Noto Sans (full charset with all Vietnamese characters)`);
    }

    // ✅ CRITICAL: pdf-lib can embed .ttf directly without fontkit for basic fonts
    // For .woff2, we need to use fontkit (require installation: npm install @pdf-lib/fontkit)
    // Let's try direct embedding first (works for .ttf)

    // Try using fontkit if available
    let customFont;
    try {
      // Dynamic import fontkit (if installed) - cache module
      if (!cachedFontkitModule) {
        cachedFontkitModule = await import('@pdf-lib/fontkit').then(m => m.default || m);
        console.log("✅ Fontkit module loaded & cached");
      }

      pdfDoc.registerFontkit(cachedFontkitModule);
      console.log("✅ Fontkit registered");

      customFont = await pdfDoc.embedFont(cachedFontBytes);
      console.log("✅ Roboto font embedded successfully with fontkit");
    } catch (fontkitError) {
      console.warn("⚠️ Fontkit not available, trying alternative font...");

      // Fallback: Use .ttf version instead of .woff2 (works without fontkit)
      // Check if we have cached TTF font
      if (!cachedFontBytes || cachedFontBytes.byteLength < 100000) {
        const ttfFontUrl = "https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf";
        console.log("📦 Loading TTF font from:", ttfFontUrl);

        const ttfResponse = await fetch(ttfFontUrl);
        if (!ttfResponse.ok) throw new Error(`TTF font fetch failed: ${ttfResponse.status}`);

        cachedFontBytes = await ttfResponse.arrayBuffer();
        console.log("✅ TTF font downloaded & cached");
      }

      customFont = await pdfDoc.embedFont(cachedFontBytes);
      console.log("✅ Noto Sans TTF embedded successfully");
    }

    // Test font with ALL Vietnamese characters (including problematic ones)
    try {
      const testText = "ăắằẳẵặ êếềểễệ ôốồổỗộ ơớờởỡợ ưứừửữự đĐ";
      const testWidth = customFont.widthOfTextAtSize(testText, 12);
      console.log(`✅ Font test (Vietnamese - all diacritics): "${testText}"`);
      console.log(`   Width: ${testWidth.toFixed(2)}px at 12pt`);

      // Test specific problem case
      const problemText = "chữ khác";
      const problemWidth = customFont.widthOfTextAtSize(problemText, 12);
      console.log(`✅ Font test (problem case): "${problemText}"`);
      console.log(`   Width: ${problemWidth.toFixed(2)}px at 12pt`);
    } catch (err) {
      console.error("❌ Font test failed:", err.message);
    }

    return customFont;

  } catch (error) {
    console.error("❌ Failed to load custom font:", error);
    console.log("🔄 Falling back to Helvetica (built-in)...");

    // Fallback: Use built-in Helvetica
    const builtInFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    console.log("✅ Helvetica embedded (fallback - Vietnamese may not display correctly)");

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

    // ✅ Collect warnings for user feedback
    const warnings = [];

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

            // ✨ SMART REPLACEMENT STRATEGY (v3 - simplified):
            // 1. Use placeholder width from detector (CORRECT width)
            // 2. Scale text to fit if needed
            // 3. Center text in placeholder
            // 4. Draw white rectangle to cover original

            console.log(`     📐 Placeholder analysis:`);
            console.log(`        Detected width: ${width.toFixed(2)}px (from detector)`);
            console.log(`        Using this width as-is (no oldText calculation)`);

            // ✨ UNDERSCORE PRESERVATION:
            // If oldText has underscores/dots, preserve them around newText
            // e.g., "______(1)______" + "Họ và tên" → "__Họ và tên__"
            let displayText = newText;

            // Count leading underscores/dots
            const leadingMatch = oldText.match(/^[._]+/);
            const leadingChars = leadingMatch ? leadingMatch[0] : '';

            // Count trailing underscores/dots
            const trailingMatch = oldText.match(/[._]+$/);
            const trailingChars = trailingMatch ? trailingMatch[0] : '';

            if (leadingChars || trailingChars) {
              // Use 2 underscores/dots on each side (balanced, not too long)
              const leadingChar = leadingChars[0] || '_';
              const trailingChar = trailingChars[0] || '_';
              const leadingCount = Math.min(2, leadingChars.length);
              const trailingCount = Math.min(2, trailingChars.length);

              displayText = leadingChar.repeat(leadingCount) + newText + trailingChar.repeat(trailingCount);

              console.log(`     🎨 Underscore preservation:`);
              console.log(`        Original: "${oldText}"`);
              console.log(`        Leading: "${leadingChars}" (${leadingChars.length} chars) → using ${leadingCount}`);
              console.log(`        Trailing: "${trailingChars}" (${trailingChars.length} chars) → using ${trailingCount}`);
              console.log(`        Display text: "${displayText}"`);
            }

            // Step 1: Calculate if text fits at current font size
            let finalText = displayText;
            let finalFontSize = fontSize;
            let textWidth = font.widthOfTextAtSize(displayText, fontSize);

            console.log(`     📏 Text measurement:`);
            console.log(`        Text: "${displayText}"`);
            console.log(`        Width at ${fontSize}pt: ${textWidth.toFixed(2)}px`);
            console.log(`        Available width: ${width.toFixed(2)}px`);

            // Step 2: Scale down if text doesn't fit
            if (textWidth > width) {
              const scaleFactor = Math.max(0.7, width / textWidth);
              finalFontSize = Math.max(8, fontSize * scaleFactor);
              textWidth = font.widthOfTextAtSize(displayText, finalFontSize);

              console.log(`     ⚠️ Text too wide, scaling down:`);
              console.log(`        Scale factor: ${(scaleFactor * 100).toFixed(0)}%`);
              console.log(`        New font size: ${finalFontSize.toFixed(1)}pt`);
              console.log(`        New width: ${textWidth.toFixed(2)}px`);

              // Step 3: If still too wide after scaling, truncate with ellipsis
              if (textWidth > width) {
                console.log(`     ✂️ Still too wide, truncating...`);

                // Binary search for max characters that fit
                let maxChars = displayText.length;
                const ellipsis = "...";
                const ellipsisWidth = font.widthOfTextAtSize(ellipsis, finalFontSize);

                for (let len = displayText.length - 1; len > 0; len--) {
                  const truncated = displayText.substring(0, len) + ellipsis;
                  const truncatedWidth = font.widthOfTextAtSize(truncated, finalFontSize);

                  if (truncatedWidth <= width) {
                    finalText = truncated;
                    textWidth = truncatedWidth;
                    maxChars = len;
                    break;
                  }
                }

                console.log(`     ✂️ Truncated to ${maxChars} chars: "${finalText}"`);
                console.log(`     📏 Truncated width: ${textWidth.toFixed(2)}px`);

                warnings.push({
                  field: displayText,
                  original: oldText,
                  warning: `Text truncated to fit (showing ${maxChars}/${displayText.length} characters)`,
                  strategy: "truncate"
                });
              }
            } else {
              console.log(`     ✅ Text fits at original font size`);
            }

            const optimal = {
              pattern: finalText,
              fontSize: finalFontSize,
              strategy: textWidth > width ? "scale_font" : "keep_original"
            };

            console.log(`     ✨ Smart Replacement Result:`);
            console.log(`        Strategy: ${optimal.strategy}`);
            console.log(`        Pattern: "${optimal.pattern}"`);
            console.log(`        Font size: ${optimal.fontSize.toFixed(1)}pt`);
            if (optimal.warning) {
              console.log(`        ⚠️ Warning: ${optimal.warning}`);
            }

            console.log(`     📏 Final measurements:`);
            console.log(`        Text: "${finalText}"`);
            console.log(`        Width: ${textWidth.toFixed(2)}px`);
            console.log(`        Font size: ${finalFontSize.toFixed(1)}pt`);

            // Step 3: Calculate center of placeholder
            const placeholderCenterX = x + width / 2;
            console.log(
              `     🎯 Placeholder center X: ${placeholderCenterX.toFixed(2)}`
            );

            // Step 4: Calculate centered text position
            const textX = placeholderCenterX - textWidth / 2;
            console.log(`     📐 Text positioning:`);
            console.log(`        Center X: ${placeholderCenterX.toFixed(2)}`);
            console.log(`        Text X: ${textX.toFixed(2)}`);

            // Step 5: Draw WHITE rectangle based on FINAL TEXT width
            // Background must ONLY cover the new text (e.g., "__họ tên__"), not old underscores
            const rectX = textX - 2;  // Add small padding on left
            const rectWidth = textWidth + 4;  // Add small padding on both sides

            // ✨ CRITICAL: Rectangle height must be PRECISE to avoid covering surrounding content
            const rectY = baselineY - finalFontSize * 0.15;  // Slightly below baseline
            const rectHeight = finalFontSize * 1.0;          // Exactly 1x font size

            console.log(`     🎨 Background positioning (based on FINAL TEXT):`);
            console.log(`        Original placeholder: x=${x.toFixed(2)}, width=${width.toFixed(2)}`);
            console.log(`        Final text width: ${textWidth.toFixed(2)}px`);
            console.log(`        Background: x=${rectX.toFixed(2)}, width=${rectWidth.toFixed(2)}px`);
            console.log(`        💡 Background sized to cover ONLY the replacement text`);

            page.drawRectangle({
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              color: rgb(1, 1, 1), // white
              opacity: 1,
            });
            console.log(
              `     🟦 WHITE rectangle drawn: x=${rectX.toFixed(
                2
              )}, y=${rectY.toFixed(2)}, w=${rectWidth.toFixed(
                2
              )}, h=${rectHeight.toFixed(2)}`
            );

            // Step 6: Draw optimized text
            try {
              page.drawText(finalText, {
                x: textX,
                y: baselineY,
                size: finalFontSize,
                font: font,
                color: rgb(0, 0, 0),
              });

              console.log(
                `     ✏️ Text drawn: "${finalText}"`
              );
              console.log(
                `     🎯 Position: x=${textX.toFixed(
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

              // Check fit
              if (textWidth <= width) {
                console.log(`     ✅ Text fits perfectly within placeholder!`);
              } else {
                const overflow = textWidth - width;
                console.log(
                  `     ↔️ Text overflows by ${overflow.toFixed(2)}px (${((overflow / width) * 100).toFixed(1)}%)`
                );
              }

              console.log(`     ✅ Smart replacement complete!\n`);
            } catch (textError) {
              console.error(`     ❌ Failed to draw text:`, textError.message);
              console.error(`     ❌ Text: "${finalText}"`);
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

    // Log warnings summary
    if (warnings.length > 0) {
      console.log("\n⚠️ ═══════════════════════════════════════════════════════");
      console.log(`⚠️ WARNINGS: ${warnings.length} field(s) with issues`);
      warnings.forEach((w, i) => {
        console.log(`   ${i + 1}. "${w.field}"`);
        console.log(`      - Original: "${w.original}"`);
        console.log(`      - Strategy: ${w.strategy}`);
        console.log(`      - Issue: ${w.warning}`);
      });
      console.log("═══════════════════════════════════════════════════════\n");
    } else {
      console.log("✅ No warnings - all text fit perfectly!");
      console.log("═══════════════════════════════════════════════════════\n");
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
