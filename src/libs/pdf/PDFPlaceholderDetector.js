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

        // DEBUG: Log items containing target numbers AND surrounding items
        const trimmedText = text.trim();
        if (
          trimmedText.includes("26") ||
          trimmedText.includes("27") ||
          trimmedText.includes("28") ||
          trimmedText.includes("2 6") ||
          trimmedText.includes("2 7") ||
          trimmedText.includes("2 8") ||
          trimmedText === "26" ||
          trimmedText === "27" ||
          trimmedText === "28" ||
          trimmedText === "2" ||
          trimmedText === "6" ||
          trimmedText === "7" ||
          trimmedText === "8"
        ) {
          console.log(
            `🔎 Page ${pageNum}, Item ${i}: "${text}" (trimmed: "${trimmedText}")`
          );

          // Log surrounding items (3 before, 3 after)
          console.log(`   📋 Context (3 items before & after):`);
          for (
            let k = Math.max(0, i - 3);
            k <= Math.min(items.length - 1, i + 3);
            k++
          ) {
            const contextItem = items[k];
            const contextText = contextItem.str || "";
            const marker = k === i ? ">>> " : "    ";
            console.log(`   ${marker}[${k}]: "${contextText.trim()}"`);
          }
        }

        //  NEW: Handle SPLIT items like "(" + "1" + ")" in 3 separate items
        // PDF.js sometimes splits (1) into 3 items: "(", "1", ")"
        // ENHANCED: Also handle multi-digit split: "(", "2", "6", ")" or "(", " ", "2", " ", "7", ")"
        // ENHANCED 2: Handle cases where "(" appears with dots: "...........("
        // ENHANCED 3: Handle cases where "(" appears with digit: "...(2" (need to check next item)

        // Check if current item contains "(" and next item might be a digit
        const hasOpenParen = trimmedText.includes("(");

        if (hasOpenParen) {
          // Extract any digits that appear AFTER "(" in current item
          // Example: "...(2" -> extract "2"
          let digits = "";
          const parenIndex = text.indexOf("(");
          if (parenIndex !== -1) {
            const afterParen = text.substring(parenIndex + 1).trim();
            // Check if there are digits after "("
            const digitMatch = afterParen.match(/^(\d+)/);
            if (digitMatch) {
              digits = digitMatch[1];
            }
          }

          // Look ahead to find matching ")" and collect MORE digits in between
          let j = i + 1;
          let closingParenIndex = -1;
          let maxLookAhead = Math.min(i + 10, items.length); // Look max 10 items ahead

          while (j < maxLookAhead) {
            const checkText = (items[j].str || "").trim();

            if (checkText === ")" || checkText.startsWith(")")) {
              closingParenIndex = j;
              break;
            } else if (/^\d+$/.test(checkText)) {
              // It's a digit
              digits += checkText;
            } else if (checkText === "" || checkText === " ") {
              // Ignore spaces
            } else {
              // Non-digit, non-space, non-paren -> not a valid pattern
              break;
            }
            j++;
          }

          // Valid pattern found: "(" + digits + ")"
          if (closingParenIndex !== -1 && digits.length > 0) {
            const numValue = parseInt(digits);

            console.log(
              `🔍 SPLIT ITEMS DETECTED: Found (${numValue}) split across ${
                closingParenIndex - i + 1
              } items`
            );

            // Skip if already processed
            if (seenNumbers.has(numValue)) {
              console.log(`⚠️ Skipping ${numValue} - already processed`);
              continue;
            }

            if (numValue > 100) {
              console.log(`⚠️ Skipping ${numValue} - too large (>100)`);
              continue;
            }

            // Get reference item for position (use first digit item)
            const firstDigitIndex = i + 1;
            const refItem = items[firstDigitIndex];

            // Calculate position: from "(" to ")"
            const prevItem = item; // "("
            const nextItem = items[closingParenIndex]; // ")"

            const x = prevItem.transform[4];
            const y = refItem.transform[5];
            const endX = nextItem.transform[4] + (nextItem.width || 0);
            const width = endX - x;
            const fontSize = Math.abs(refItem.transform[0]) || 12;
            const height = fontSize * 1.2;

            // 🎯 Calculate EXACT position of digits (not "(")
            // Collect all digit items between "(" and ")"
            let digitStartX = Infinity;
            let digitEndX = -Infinity;
            for (let digitIdx = i + 1; digitIdx < closingParenIndex; digitIdx++) {
              const digitItem = items[digitIdx];
              const digitText = (digitItem.str || "").trim();
              // Only count actual digit items, skip spaces
              if (/^\d+$/.test(digitText)) {
                const digitX = digitItem.transform[4];
                const digitWidth = digitItem.width || 0;
                if (digitX < digitStartX) digitStartX = digitX;
                if (digitX + digitWidth > digitEndX) digitEndX = digitX + digitWidth;
              }
            }
            const digitPositionX = digitStartX !== Infinity ? digitStartX : x;
            const digitWidth = digitEndX !== -Infinity ? (digitEndX - digitStartX) : width;

            // Scan for nearby separators
            const Y_TOLERANCE = 10;
            const X_RANGE = 300;

            const nearbyItems = [];
            for (let k = 0; k < items.length; k++) {
              const checkItem = items[k];
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
            const separatorCount = (combinedText.match(/[._…]/g) || []).length;
            const normalizedText = combinedText
              .replace(/\s+/g, "")
              .replace(/…/g, "...");
            const hasPattern = /[._]{2,}/.test(normalizedText);
            const isValid = separatorCount >= 2 || hasPattern;

            if (!isValid) {
              continue;
            }

            // ✅ NEW: Find field START by scanning from line start to digit
            // Find the CLOSEST colon before the digit, then first separator after that colon
            let fieldStartX = startX;
            let closestColonX = -1;
            let closestColonEndX = -1;

            // Step 1: Scan ALL items on the line to find closest colon BEFORE digit
            // We need to check items that might CONTAIN both the colon AND part of the field
            for (const nearItem of nearbyItems) {
              const itemText = nearItem.str || "";
              const itemX = nearItem.transform[4];
              const itemWidth = nearItem.width || 0;

              // Check if this item contains a colon
              if (itemText.includes(":")) {
                const colonIndex = itemText.indexOf(":");
                const charWidth = itemWidth / itemText.length;
                const colonX = itemX + (colonIndex * charWidth);

                // Only consider colons that are BEFORE the digit position
                // Track the closest colon (rightmost one before digit)
                if (colonX < digitPositionX && colonX > closestColonX) {
                  closestColonX = colonX;
                  closestColonEndX = colonX + charWidth;
                  console.log(`  🔍 Found colon at x=${colonX.toFixed(2)} in item "${itemText}" (digitPos=${digitPositionX.toFixed(2)})`);
                }
              }
            }

            // Step 2: Find FIRST SEPARATOR after colon (to handle spaces between colon and field)
            // ✅ CRITICAL: testcase1 "tên:..." vs testcase2 "tên: ..." (note the space)
            // We need to start at first dot/underscore, NOT right after colon
            if (closestColonEndX !== -1) {
              let firstSeparatorX = -1;

              // Scan items after colon to find first separator character
              for (const nearItem of nearbyItems) {
                const itemText = nearItem.str || "";
                const itemX = nearItem.transform[4];
                const itemWidth = nearItem.width || 0;
                const charWidth = itemWidth / itemText.length;

                // ✅ CRITICAL FIX: For items that CONTAIN the colon, search for separator AFTER colon position
                // For items AFTER the colon, search from start of item

                if (itemX < closestColonX && itemX + itemWidth > closestColonX) {
                  // This item CONTAINS the colon - need to search only in part AFTER colon
                  const colonIndex = itemText.indexOf(":");
                  if (colonIndex !== -1) {
                    // Search for separator only in substring AFTER colon
                    const textAfterColon = itemText.substring(colonIndex + 1);
                    const separatorMatch = /[._…]/.exec(textAfterColon);
                    if (separatorMatch) {
                      const separatorIndexInFullText = colonIndex + 1 + separatorMatch.index;
                      firstSeparatorX = itemX + (separatorIndexInFullText * charWidth);
                      console.log(`  🔍 SPLIT: Found first separator at x=${firstSeparatorX.toFixed(2)} in item "${itemText}" (after colon in same item)`);
                      console.log(`    📊 DEBUG: itemX=${itemX.toFixed(2)}, colonIndex=${colonIndex}, separatorMatch.index=${separatorMatch.index}, separatorIndexInFullText=${separatorIndexInFullText}, charWidth=${charWidth.toFixed(2)}`);
                      console.log(`    📊 textAfterColon: "${textAfterColon.substring(0, 20)}..."`);
                      break;
                    }
                  }
                } else if (itemX >= closestColonEndX) {
                  // This item is completely AFTER the colon - search from start
                  const separatorMatch = /[._…]/.exec(itemText);
                  if (separatorMatch) {
                    const separatorIndex = separatorMatch.index;
                    firstSeparatorX = itemX + (separatorIndex * charWidth);
                    console.log(`  🔍 SPLIT: Found first separator at x=${firstSeparatorX.toFixed(2)} in item "${itemText}" (item after colon)`);
                    break;
                  }
                }
                // Skip items completely before colon (itemX + itemWidth <= closestColonX)
              }

              // Use first separator if found, otherwise fall back to right after colon
              if (firstSeparatorX !== -1) {
                fieldStartX = firstSeparatorX;
                console.log(`  ✅ SPLIT: Field starts at x=${fieldStartX.toFixed(2)} (first separator after colon)`);
              } else {
                fieldStartX = closestColonEndX;
                console.log(`  ✅ SPLIT: Field starts at x=${fieldStartX.toFixed(2)} (no separator found, using right after colon)`);
              }
            } else {
              console.log(`  ⚠️ No colon found before digit, using startX=${startX.toFixed(2)}`);
            }

            // ✅ NEW: Find field END by scanning FORWARD from digit position
            // Stop when: (1) next colon found (next field), or (2) non-separator text after separators
            let fieldEndX = endX2;
            let lastSeparatorEndX = -1;
            let inSeparatorZone = false;

            // Start scanning from digit position forward
            for (const nearItem of nearbyItems) {
              const itemText = nearItem.str || "";
              const itemX = nearItem.transform[4];
              const itemWidth = nearItem.width || 0;

              // Skip items before the number
              if (itemX < digitPositionX) continue;

              const trimmedText = itemText.trim();

              // Skip pure whitespace
              if (trimmedText === "") continue;

              // Check if this contains a colon - next field's label
              if (trimmedText.includes(":")) {
                // Found next field's label - end field at last separator
                if (lastSeparatorEndX !== -1) {
                  fieldEndX = lastSeparatorEndX;
                } else {
                  // No separators found after digit, use position before colon
                  const colonIndex = trimmedText.indexOf(":");
                  const charWidth = itemWidth / trimmedText.length;
                  fieldEndX = itemX + (colonIndex * charWidth);
                }
                break;
              }

              // Check if this is a pure separator
              if (/^[._…]+$/.test(trimmedText)) {
                // This is a separator
                lastSeparatorEndX = itemX + itemWidth;
                inSeparatorZone = true;
                continue;
              }

              // Non-separator found after separator zone
              if (inSeparatorZone && !/[._…]/.test(trimmedText)) {
                // Pure non-separator after separators - field ends at last separator
                if (lastSeparatorEndX !== -1) {
                  fieldEndX = lastSeparatorEndX;
                }
                break;
              }
            }

            // If loop completed without finding end, use last separator
            if (fieldEndX === endX2 && lastSeparatorEndX !== -1) {
              fieldEndX = lastSeparatorEndX;
            }

            const fullWidth = fieldEndX - fieldStartX;

            // 🔍 DEBUG: Log boundary detection for split items
            console.log(`🎯 SPLIT (${numValue}) boundaries:`, {
              fullText: combinedText.substring(0, 60),
              startX: startX.toFixed(2),
              endX2: endX2.toFixed(2),
              fieldStartX: fieldStartX.toFixed(2),
              fieldEndX: fieldEndX.toFixed(2),
              fullWidth: fullWidth.toFixed(2),
              digitPositionX: digitPositionX.toFixed(2),
            });

            placeholders.push({
              id: `placeholder_${placeholders.length + 1}`,
              original: `(${numValue})`,
              fullText: combinedText.trim(),
              extractedKey: numValue.toString(),
              type: "numbered",
              page: pageNum,
              x: fieldStartX, // ✅ Start of field (after label/colon)
              y: y,
              width: fullWidth, // ✅ Width of field only (excluding label)
              backgroundX: digitPositionX, // ✅ EXACT position of digits only
              backgroundWidth: digitWidth, // ✅ EXACT width of digits only
              height: height,
              fontSize: fontSize,
              position: allText.length,
              mapped: false,
              tagId: null,
            });

            seenNumbers.add(numValue);
            continue;
          }
        }

        //  ORIGINAL: Find (number) in single text item
        // Support spaces inside: ( 1), (2 ), ( 3 )
        // ENHANCED: Support spaces between digits: (2 6), ( 2 7 ), ( 2 8 )
        const regex = /\(\s*([\d\s]+)\s*\)/g;
        const matches = [...text.matchAll(regex)];

        // DEBUG: Log all matches found
        if (matches.length > 0) {
          console.log(
            `📍 Found ${matches.length} matches in text: "${text.substring(
              0,
              60
            )}..."`
          );
          matches.forEach((m, idx) => {
            console.log(
              `   Match ${idx + 1}: "${m[0]}" -> captured: "${m[1]}"`
            );
          });
        }

        for (const numberedMatch of matches) {
          const num = numberedMatch[1];
          // Remove all spaces from the captured number string: "2 6" -> "26"
          const cleanedNum = num.replace(/\s+/g, "");
          const numValue = parseInt(cleanedNum);

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
          // 1. >= 1 separator total (reduced from 2 for testing), OR
          // 2. Has pattern of 2+ consecutive separators before/after (in normalized text)
          const hasPattern = /[._]{2,}/.test(normalizedText);
          const isValid = separatorCount >= 1 || hasPattern;

          console.log(`🔍 Validation for (${cleanedNum}):`, {
            combinedText: combinedText.substring(0, 50) + "...",
            separatorCount,
            hasPattern,
            isValid,
            normalizedText: normalizedText.substring(0, 50) + "...",
          });

          if (!isValid) {
            console.log(
              `⚠️ REJECTED (${cleanedNum}) - insufficient separators`
            );
            continue;
          }

          // 🎯 CRITICAL: Extract ONLY digit position (ignore parentheses and dots)
          // Example: "...(2)..." - we only want position of "2"
          // Handle spaces in numbers: "(2 6)" -> find position of "2" or "26"
          const itemText = item.str || "";
          const digitOnly = cleanedNum;
          // Try to find the cleaned number first, then fall back to original
          let digitIndex = itemText.indexOf(digitOnly);
          if (digitIndex === -1 && num !== cleanedNum) {
            // If cleaned number not found and differs from original, try original
            digitIndex = itemText.indexOf(num);
          }

          let exactNumberX = x;
          let exactNumberWidth = width;

          if (digitIndex !== -1) {
            // Calculate approximate character width
            const charWidth = width / itemText.length;
            // Calculate position of digit within the text
            const textBeforeWidth = charWidth * digitIndex;
            // Use the length of the matched text (with or without spaces)
            const matchedText = num !== cleanedNum ? num : cleanedNum;
            const digitWidth = charWidth * matchedText.length;

            exactNumberX = x + textBeforeWidth;
            exactNumberWidth = digitWidth;

            console.log(
              `🔍 Single item - digit "${digitOnly}" in "${itemText}":`,
              {
                originalNum: num,
                cleanedNum: cleanedNum,
                x: x.toFixed(2),
                width: width.toFixed(2),
                digitIndex,
                charWidth: charWidth.toFixed(2),
                exactNumberX: exactNumberX.toFixed(2),
                exactNumberWidth: exactNumberWidth.toFixed(2),
              }
            );
          }

          // ✅ NEW: Find field START by scanning from line start to digit
          // Find the CLOSEST colon before the digit, then first separator after that colon
          let fieldStartX = startX;
          let closestColonX = -1;
          let closestColonEndX = -1;

          // Step 1: Scan ALL items on the line to find closest colon BEFORE digit
          // We need to check items that might CONTAIN both the colon AND part of the field
          for (const nearItem of nearbyItems) {
            const itemText = nearItem.str || "";
            const itemX = nearItem.transform[4];
            const itemWidth = nearItem.width || 0;

            // Check if this item contains a colon
            if (itemText.includes(":")) {
              const colonIndex = itemText.indexOf(":");
              const charWidth = itemWidth / itemText.length;
              const colonX = itemX + (colonIndex * charWidth);

              // Only consider colons that are BEFORE the digit position
              // Track the closest colon (rightmost one before digit)
              if (colonX < exactNumberX && colonX > closestColonX) {
                closestColonX = colonX;
                closestColonEndX = colonX + charWidth;
                console.log(`  🔍 SINGLE: Found colon at x=${colonX.toFixed(2)} in item "${itemText}" (digitPos=${exactNumberX.toFixed(2)})`);
              }
            }
          }

          // Step 2: Find FIRST SEPARATOR after colon (to handle spaces between colon and field)
          // ✅ CRITICAL: testcase1 "tên:..." vs testcase2 "tên: ..." (note the space)
          // We need to start at first dot/underscore, NOT right after colon
          if (closestColonEndX !== -1) {
            let firstSeparatorX = -1;

            // Scan items after colon to find first separator character
            for (const nearItem of nearbyItems) {
              const itemText = nearItem.str || "";
              const itemX = nearItem.transform[4];
              const itemWidth = nearItem.width || 0;
              const charWidth = itemWidth / itemText.length;

              // ✅ CRITICAL FIX: For items that CONTAIN the colon, search for separator AFTER colon position
              // For items AFTER the colon, search from start of item

              if (itemX < closestColonX && itemX + itemWidth > closestColonX) {
                // This item CONTAINS the colon - need to search only in part AFTER colon
                const colonIndex = itemText.indexOf(":");
                if (colonIndex !== -1) {
                  // Search for separator only in substring AFTER colon
                  const textAfterColon = itemText.substring(colonIndex + 1);
                  const separatorMatch = /[._…]/.exec(textAfterColon);
                  if (separatorMatch) {
                    const separatorIndexInFullText = colonIndex + 1 + separatorMatch.index;
                    firstSeparatorX = itemX + (separatorIndexInFullText * charWidth);
                    console.log(`  🔍 SINGLE: Found first separator at x=${firstSeparatorX.toFixed(2)} in item "${itemText}" (after colon in same item)`);
                    console.log(`    📊 DEBUG: itemX=${itemX.toFixed(2)}, colonIndex=${colonIndex}, separatorMatch.index=${separatorMatch.index}, separatorIndexInFullText=${separatorIndexInFullText}, charWidth=${charWidth.toFixed(2)}`);
                    console.log(`    📊 textAfterColon: "${textAfterColon.substring(0, 20)}..."`);
                    break;
                  }
                }
              } else if (itemX >= closestColonEndX) {
                // This item is completely AFTER the colon - search from start
                const separatorMatch = /[._…]/.exec(itemText);
                if (separatorMatch) {
                  const separatorIndex = separatorMatch.index;
                  firstSeparatorX = itemX + (separatorIndex * charWidth);
                  console.log(`  🔍 SINGLE: Found first separator at x=${firstSeparatorX.toFixed(2)} in item "${itemText}" (item after colon)`);
                  break;
                }
              }
              // Skip items completely before colon (itemX + itemWidth <= closestColonX)
            }

            // Use first separator if found, otherwise fall back to right after colon
            if (firstSeparatorX !== -1) {
              fieldStartX = firstSeparatorX;
              console.log(`  ✅ SINGLE: Field starts at x=${fieldStartX.toFixed(2)} (first separator after colon)`);
            } else {
              fieldStartX = closestColonEndX;
              console.log(`  ✅ SINGLE: Field starts at x=${fieldStartX.toFixed(2)} (no separator found, using right after colon)`);
            }
          } else {
            console.log(`  ⚠️ SINGLE: No colon found before digit, using startX=${startX.toFixed(2)}`);
          }

          // ✅ NEW: Find field END by scanning FORWARD from digit position
          // Stop when: (1) next colon found (next field), or (2) non-separator text after separators
          let fieldEndX = endX;
          let lastSeparatorEndX = -1;
          let inSeparatorZone = false;

          // Start scanning from digit position forward
          for (const nearItem of nearbyItems) {
            const itemText = nearItem.str || "";
            const itemX = nearItem.transform[4];
            const itemWidth = nearItem.width || 0;

            // Skip items before the number
            if (itemX < exactNumberX) continue;

            const trimmedText = itemText.trim();

            // Skip pure whitespace
            if (trimmedText === "") continue;

            // Check if this contains a colon - next field's label
            if (trimmedText.includes(":")) {
              // Found next field's label - end field at last separator
              if (lastSeparatorEndX !== -1) {
                fieldEndX = lastSeparatorEndX;
              } else {
                // No separators found after digit, use position before colon
                const colonIndex = trimmedText.indexOf(":");
                const charWidth = itemWidth / trimmedText.length;
                fieldEndX = itemX + (colonIndex * charWidth);
              }
              break;
            }

            // Check if this is a pure separator
            if (/^[._…]+$/.test(trimmedText)) {
              // This is a separator
              lastSeparatorEndX = itemX + itemWidth;
              inSeparatorZone = true;
              continue;
            }

            // Non-separator found after separator zone
            if (inSeparatorZone && !/[._…]/.test(trimmedText)) {
              // Pure non-separator after separators - field ends at last separator
              if (lastSeparatorEndX !== -1) {
                fieldEndX = lastSeparatorEndX;
              }
              break;
            }
          }

          // If loop completed without finding end, use last separator
          if (fieldEndX === endX && lastSeparatorEndX !== -1) {
            fieldEndX = lastSeparatorEndX;
          }

          const fullWidth = fieldEndX - fieldStartX;

          // 🔍 DEBUG: Log boundary detection for single items
          console.log(`🎯 SINGLE (${cleanedNum}) boundaries:`, {
            fullText: combinedText.substring(0, 60),
            startX: startX.toFixed(2),
            endX: endX.toFixed(2),
            fieldStartX: fieldStartX.toFixed(2),
            fieldEndX: fieldEndX.toFixed(2),
            fullWidth: fullWidth.toFixed(2),
            exactNumberX: exactNumberX.toFixed(2),
          });

          placeholders.push({
            id: `placeholder_${placeholders.length + 1}`,
            original: `(${num})`,
            fullText: combinedText.trim(),
            extractedKey: cleanedNum, // Use cleaned number without spaces
            type: "numbered",
            page: pageNum,
            x: fieldStartX, // ✅ Start of field (after label/colon)
            y: y,
            width: fullWidth, // ✅ Width of field only (excluding label)
            backgroundX: exactNumberX, // ✅ Only digit X
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

    // Log full extracted data for debugging and copying
    console.log("FULL EXTRACTED TEXT FROM PDF:");
    console.log(allText);
    console.log("FULL PLACEHOLDERS DATA:");
    console.log(JSON.stringify(placeholders, null, 2));

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
 * Main function: Analyze PDF structure without auto-detection
 * Returns basic PDF info only - placeholders will be created manually by user
 */
export const analyzePDFForPlaceholders = async (file) => {
  try {
    // Load PDF.js to get basic info
    const pdfjsLib = await loadPDFJS();

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;

    message.info(
      `PDF đã sẵn sàng (${pdfDocument.numPages} trang). Sử dụng chế độ quét để tạo trường thông tin.`,
      3
    );

    return {
      text: "",
      pageCount: pdfDocument.numPages,
      placeholders: [], // Empty - user will create manually
    };
  } catch (error) {
    message.error("Có lỗi khi tải PDF");
    return null;
  }
};

export { PLACEHOLDER_PATTERNS };
