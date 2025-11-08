import { message } from "antd";

/**
 * PDF Placeholder Detector - CDN APPROACH
 * Load PDF.js từ CDN để BYPASS webpack bundling issues
 *
 * Đọc PDF và tự động detect các placeholders theo pattern:
 * - (1), (2), (3)... - số trong ngoặc đơn
 * - {{key}} - placeholder dạng handlebars
 * - [key] - placeholder dạng brackets
 */

// Regex patterns để detect placeholders
const PLACEHOLDER_PATTERNS = [
  {
    name: "numbered",
    regex: /\((\d+)\)/g,
    description: "Số trong ngoặc đơn: (1), (2), (3)...",
  },
  // Support placeholders that are surrounded by dots or underscores like ...(1)... or ___(1)___
  {
    name: "numbered_filled",
    // matches patterns like .(1).  ..(2)..  ___(3)___  ._(4)_.
    regex: /[._]+\s*\(\s*(\d+)\s*\)\s*[._]+/g,
    description: "Numbered with filler: ...(1)... or ___(1)___",
  },
  {
    name: "handlebars",
    regex: /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g,
    description: "Handlebars: {{name}}, {{dob}}...",
  },
  {
    name: "brackets",
    regex: /\[([a-zA-Z_][a-zA-Z0-9_]*)\]/g,
    description: "Brackets: [name], [dob]...",
  },
];

/**
 * Load PDF.js từ CDN (bypass webpack bundling)
 * Đây là cách duy nhất để tránh webpack issues trong Next.js
 */
const loadPDFJS = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    // Load PDF.js from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      if (window.pdfjsLib) {
        // Set worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to load"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load PDF.js from CDN"));
    };

    document.head.appendChild(script);
  });
};

/**
 * Đọc text content từ PDF file - CDN APPROACH
 * Load pdfjs-dist từ CDN để bypass webpack bundling issues
 */
export const extractTextFromPDF = async (file) => {
  try {
    // Load PDF.js from CDN (bypass webpack)
    const pdfjsLib = await loadPDFJS();

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;

    const placeholders = [];
    let allText = "";
    const seenNumbers = new Set(); //  Track which numbers we've already added

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Process each text item
      const items = textContent.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.str;
        allText += text + " ";

        //  NEW: Handle SPLIT items like "(" + "1" + ")" in 3 separate items
        // PDF.js sometimes splits (1) into 3 items: "(", "1", ")"
        const isSingleDigit = /^\d+$/.test(text.trim());
        if (isSingleDigit && text.trim().length <= 2) {
          const prevItem = i > 0 ? items[i - 1] : null;
          const nextItem = i < items.length - 1 ? items[i + 1] : null;

          if (prevItem && nextItem) {
            const prevText = prevItem.str || "";
            const nextText = nextItem.str || "";

            // Check if prev="(" and next=")"
            if (prevText.trim() === "(" && nextText.trim() === ")") {
              const numValue = parseInt(text.trim());

              // Skip if already processed
              if (seenNumbers.has(numValue)) {
                continue;
              }

              if (numValue > 100) {
                continue;
              }

              // Calculate position: from "(" to ")"
              const x = prevItem.transform[4];
              const y = item.transform[5];
              const endX = nextItem.transform[4] + (nextItem.width || 0);
              const width = endX - x;
              const fontSize = Math.abs(item.transform[0]) || 12;
              const height = fontSize * 1.2;

              // Scan for nearby separators
              const Y_TOLERANCE = 10;
              const X_RANGE = 300;

              const nearbyItems = [];
              for (let j = 0; j < items.length; j++) {
                const checkItem = items[j];
                const checkX = checkItem.transform[4];
                const checkY = checkItem.transform[5];
                const sameY = Math.abs(checkY - y) <= Y_TOLERANCE;
                const nearX =
                  checkX >= x - X_RANGE && checkX <= x + width + X_RANGE;
                if (sameY && nearX) nearbyItems.push(checkItem);
              }

              nearbyItems.sort((a, b) => a.transform[4] - b.transform[4]);

              // Build combined text
              let combinedText = "";
              let startX = x;
              let endX2 = endX;

              for (const nearItem of nearbyItems) {
                combinedText += nearItem.str || "";
                const itemX = nearItem.transform[4];
                const itemWidth = nearItem.width || 0;
                if (itemX < startX) startX = itemX;
                if (itemX + itemWidth > endX2) endX2 = itemX + itemWidth;
              }

              // Validate separators
              const separatorCount = (combinedText.match(/[._…]/g) || [])
                .length;
              const normalizedText = combinedText
                .replace(/\s+/g, "")
                .replace(/…/g, "...");
              const hasPattern = /[._]{2,}/.test(normalizedText);
              const isValid = separatorCount >= 2 || hasPattern;

              if (!isValid) {
                continue;
              }

              const fullWidth = endX2 - startX;

              placeholders.push({
                id: `placeholder_${placeholders.length + 1}`,
                original: `(${numValue})`,
                fullText: combinedText.trim(),
                extractedKey: numValue.toString(),
                page: pageNum,
                x: startX,
                y: y,
                width: fullWidth,
                height: height,
                fontSize: fontSize,
              });

              seenNumbers.add(numValue);
              continue;
            }
          }
        }

        //  ORIGINAL: Find (number) in single text item
        // Support spaces inside: ( 1), (2 ), ( 3 )
        const regex = /\(\s*(\d+)\s*\)/g;
        const matches = [...text.matchAll(regex)];

        for (const numberedMatch of matches) {
          const num = numberedMatch[1];
          const numValue = parseInt(num);

          // Skip duplicates
          if (seenNumbers.has(numValue)) {
            continue;
          }

          // Skip large numbers (years)
          if (numValue > 100) {
            continue;
          }

          // Get current item position
          const x = item.transform[4];
          const y = item.transform[5];
          const width = item.width || 0;
          const fontSize = Math.abs(item.transform[0]) || 12;
          const height = fontSize * 1.2;

          //  EXPANDED SEARCH: Look for separators in wider X range (not just Y)
          // This handles cases where `( 1)` is in separate item from dots/underscores
          const Y_TOLERANCE = 10; // Same line tolerance (increased to 10 to handle more Y variations)
          const X_RANGE = 300; // Look 300px before and after (increased from 200 to cover more area)

          const nearbyItems = [];
          for (let j = 0; j < items.length; j++) {
            const checkItem = items[j];
            const checkX = checkItem.transform[4];
            const checkY = checkItem.transform[5];

            // Include items on same line (Y) AND within X range
            const sameY = Math.abs(checkY - y) <= Y_TOLERANCE;
            const nearX =
              checkX >= x - X_RANGE && checkX <= x + width + X_RANGE;

            if (sameY && nearX) {
              nearbyItems.push(checkItem);
            }
          }

          // Sort by X position to maintain order
          nearbyItems.sort((a, b) => a.transform[4] - b.transform[4]);

          // Build combined text and calculate bounds
          let combinedText = "";
          let startX = x;
          let endX = x + width;

          for (const nearItem of nearbyItems) {
            const nearText = nearItem.str || "";
            combinedText += nearText;

            const itemX = nearItem.transform[4];
            const itemWidth = nearItem.width || 0;

            if (itemX < startX) startX = itemX;
            if (itemX + itemWidth > endX) endX = itemX + itemWidth;
          }

          // Count separators: dots (. or … ellipsis Unicode U+2026), underscores (_)
          // Handle both regular dots and ellipsis characters commonly used in PDFs
          const separatorMatches = combinedText.match(/[._…]/g);
          const separatorCount = separatorMatches ? separatorMatches.length : 0;

          //  NORMALIZE: Remove spaces before validation to handle cases like ".... ..... (1) .... ....."
          // Spaces between separators break the pattern detection
          // Also normalize ellipsis to dots for consistent pattern matching
          const normalizedText = combinedText
            .replace(/\s+/g, "")
            .replace(/…/g, "...");

          //  FLEXIBLE VALIDATION: Accept if:
          // 1. >= 2 separators total (reduced from 3), OR
          // 2. Has pattern of 2+ consecutive separators before/after (in normalized text)
          const hasPattern = /[._]{2,}/.test(normalizedText);
          const isValid = separatorCount >= 2 || hasPattern;

          if (!isValid) {
            continue;
          }

          // Calculate full width
          const fullWidth = endX - startX;

          // 🎯 CRITICAL: Extract ONLY digit position (ignore parentheses and dots)
          // Example: "...(2)..." - we only want position of "2"
          const itemText = item.str || "";
          const digitOnly = num;
          const digitIndex = itemText.indexOf(digitOnly);

          let exactNumberX = x;
          let exactNumberWidth = width;

          if (digitIndex !== -1) {
            // Calculate approximate character width
            const charWidth = width / itemText.length;
            // Calculate position of digit within the text
            const textBeforeWidth = charWidth * digitIndex;
            const digitWidth = charWidth * digitOnly.length;

            exactNumberX = x + textBeforeWidth;
            exactNumberWidth = digitWidth;

            console.log(`🔍 Single item - digit "${digitOnly}" in "${itemText}":`, {
              x: x.toFixed(2),
              width: width.toFixed(2),
              digitIndex,
              charWidth: charWidth.toFixed(2),
              exactNumberX: exactNumberX.toFixed(2),
              exactNumberWidth: exactNumberWidth.toFixed(2),
              fullWidth: fullWidth.toFixed(2)
            });
          }

          placeholders.push({
            id: `placeholder_${placeholders.length + 1}`,
            original: `(${num})`,
            fullText: combinedText.trim(),
            extractedKey: num,
            type: "numbered",
            page: pageNum,
            x: startX,
            y: y,
            width: fullWidth,
            backgroundX: exactNumberX,      // ✅ Only digit X
            backgroundWidth: exactNumberWidth, // ✅ Only digit width
            height: height,
            fontSize: fontSize,
            position: allText.length,
            mapped: false,
            tagId: null,
          });

          seenNumbers.add(numValue);
        } // End of matches loop
      }
    }

    // If no placeholders found from coordinate scan, show warning
    if (placeholders.length === 0) {
      // Test patterns
    }

    return {
      success: true,
      text: allText,
      pageCount: pdfDocument.numPages,
      placeholdersWithCoordinates: placeholders,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Detect placeholders từ text content
 */
export const detectPlaceholders = (text) => {
  const placeholders = [];
  const seen = new Set(); // Tránh trùng lặp

  PLACEHOLDER_PATTERNS.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0]; // (1), {{name}}, [dob]
      const key = match[1]; // 1, name, dob

      if (!seen.has(fullMatch)) {
        seen.add(fullMatch);

        placeholders.push({
          id: `placeholder_${placeholders.length + 1}`,
          original: fullMatch, // (1)
          extractedKey: key, // 1
          type: pattern.name, // 'numbered', 'numbered_filled', 'handlebars', 'brackets'
          suggestedTagKey:
            pattern.name === "numbered" || pattern.name === "numbered_filled"
              ? `field_${key}`
              : key,
          position: match.index,
          mapped: false, // Chưa map với tag
          tagId: null, // ID của tag được map
        });
      }
    }
  });

  // Sort theo vị trí xuất hiện
  placeholders.sort((a, b) => a.position - b.position);

  return placeholders;
};

/**
 * Main function: Phân tích PDF và detect placeholders
 */
export const analyzePDFForPlaceholders = async (file) => {
  try {
    // Extract text from PDF via CDN (includes coordinates!)
    const result = await extractTextFromPDF(file);

    if (!result.success) {
      message.error(`Không thể đọc nội dung PDF: ${result.error}`);
      return null;
    }

    // Use placeholders from extraction (they already have x, y coordinates!)
    const placeholders = result.placeholdersWithCoordinates || [];

    if (placeholders.length === 0) {
      message.warning(
        'Không tìm thấy placeholders. Vui lòng kiểm tra định dạng PDF hoặc dùng chức năng "Paste Text"',
        5
      );
    } else {
      message.success(
        `Tìm thấy ${placeholders.length} placeholders trong PDF!`
      );
    }

    return {
      text: result.text,
      pageCount: result.pageCount,
      placeholders,
    };
  } catch (error) {
    message.error("Có lỗi khi phân tích PDF");
    return null;
  }
};

export { PLACEHOLDER_PATTERNS };
