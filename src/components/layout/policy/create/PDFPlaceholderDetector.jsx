import { message } from 'antd';

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
        name: 'numbered',
        regex: /\((\d+)\)/g,
        description: 'Số trong ngoặc đơn: (1), (2), (3)...'
    },
    // Support placeholders that are surrounded by dots or underscores like ...(1)... or ___(1)___
    {
        name: 'numbered_filled',
        // matches patterns like .(1).  ..(2)..  ___(3)___  ._(4)_.
        regex: /[._]+\s*\(\s*(\d+)\s*\)\s*[._]+/g,
        description: 'Numbered with filler: ...(1)... or ___(1)___'
    },
    {
        name: 'handlebars',
        regex: /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g,
        description: 'Handlebars: {{name}}, {{dob}}...'
    },
    {
        name: 'brackets',
        regex: /\[([a-zA-Z_][a-zA-Z0-9_]*)\]/g,
        description: 'Brackets: [name], [dob]...'
    }
];

/**
 * Load PDF.js từ CDN (bypass webpack bundling)
 * Đây là cách duy nhất để tránh webpack issues trong Next.js
 */
const loadPDFJS = () => {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.pdfjsLib) {
            console.log('✅ PDF.js already loaded from CDN');
            resolve(window.pdfjsLib);
            return;
        }

        console.log('📦 Loading PDF.js from CDN...');

        // Load PDF.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;

        script.onload = () => {
            if (window.pdfjsLib) {
                // Set worker
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                console.log('✅ PDF.js loaded successfully from CDN');
                resolve(window.pdfjsLib);
            } else {
                reject(new Error('PDF.js failed to load'));
            }
        };

        script.onerror = () => {
            reject(new Error('Failed to load PDF.js from CDN'));
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
        console.log('\n🚀 ═══════════════════════════════════════════════════════');
        console.log('🔍 Extracting PDF via CDN (BYPASS WEBPACK)');
        console.log('📄 File:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
        console.log('✨ Loading PDF.js from CDN - NO webpack issues!');
        console.log('═══════════════════════════════════════════════════════\n');

        // Load PDF.js from CDN (bypass webpack)
        const pdfjsLib = await loadPDFJS();

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        console.log('📖 Loading PDF document...');
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdfDocument = await loadingTask.promise;

        console.log(`📚 PDF loaded: ${pdfDocument.numPages} pages`);

        const placeholders = [];
        let allText = '';
        const seenNumbers = new Set(); // ✅ Track which numbers we've already added

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            console.log(`📃 Processing page ${pageNum}/${pdfDocument.numPages}...`);

            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();

            console.log(`📝 Page ${pageNum}: ${textContent.items.length} text items`);

            // Process each text item
            const items = textContent.items;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const text = item.str;
                allText += text + ' ';

                // Check if this is a numbered placeholder: (1), (2), etc.
                // Accept formats:
                // - Standalone: (1)
                // - With dots: .(1). or ..(1).. or ...(1)...
                // - With underscores: _(1)_ or ___(1)___
                // - Mixed: ._(1)_. or _.(1)._

                // ✅ Find ALL (number) patterns in this item using matchAll
                // Example: "i: ______(11)_____ Email: _____(12)______" → finds both (11) and (12)
                const regex = /\(\s*(\d+)\s*\)/g;
                const matches = [...text.matchAll(regex)];

                // Check context items (for logging)
                const prevItem = i > 0 ? items[i - 1] : null;
                const nextItem = i < items.length - 1 ? items[i + 1] : null;
                const prevText = prevItem?.str || '';
                const nextText = nextItem?.str || '';

                // Process each (number) found in this item
                for (const numberedMatch of matches) {
                    const num = numberedMatch[1];
                    const numValue = parseInt(num);

                    // ✅ CRITICAL: Skip if we've already seen this number
                    if (seenNumbers.has(numValue)) {
                        console.log(`⏭️ Skipping (${num}) - already added to placeholders`);
                        continue;
                    }

                    // Validate: Only accept numbers <= 100 (avoid years like 2021)
                    if (numValue > 100) {
                        console.log(`⏭️ Skipping (${num}) - looks like a year`);
                        continue;
                    }

                    // ✅ FLEXIBLE RULE: Allow spaces between separators and (number)
                    //    Valid: "______(1)_" or "_____ (13)______" (space before/after OK)
                    //    Strategy: Scan backward/forward to find separator (. or _)
                    //    Stop at: letter or start/end of text

                    const matchStart = numberedMatch.index;
                    const matchEnd = matchStart + numberedMatch[0].length;

                    // Scan backward to find a separator (. or _)
                    let foundBefore = false;
                    for (let j = matchStart - 1; j >= 0; j--) {
                        const char = text[j];
                        if (char === '.' || char === '_') {
                            foundBefore = true;
                            break;
                        }
                        // Stop if we hit a letter (not a separator)
                        if (/[a-zA-ZÀ-ỹ]/.test(char)) {
                            break;
                        }
                    }

                    // Scan forward to find a separator (. or _)
                    let foundAfter = false;
                    for (let j = matchEnd; j < text.length; j++) {
                        const char = text[j];
                        if (char === '.' || char === '_') {
                            foundAfter = true;
                            break;
                        }
                        // Stop if we hit a letter (not a separator)
                        if (/[a-zA-ZÀ-ỹ]/.test(char)) {
                            break;
                        }
                    }

                    if (!foundBefore || !foundAfter) {
                        console.log(`⏭️ Skipping (${num}) - no separator found before/after`);
                        console.log(`   foundBefore: ${foundBefore}, foundAfter: ${foundAfter}`);
                        console.log(`   text: "${text}"`);
                        continue;
                    }

                    // ✅ Valid! Extract placeholder coordinates
                    // ✅ CRITICAL: pdf.js coordinate system
                    // transform[4] = X coordinate (distance from LEFT edge)
                    // transform[5] = Y coordinate (distance from BOTTOM edge - already in pdf-lib coordinate!)
                    //
                    // IMPORTANT: pdf.js transform[5] is NOT top-left, it's BASELINE!
                    // This means it's already in bottom-left coordinate system like pdf-lib!

                    let x = item.transform[4];
                    let y = item.transform[5]; // ✅ This is BASELINE Y in bottom-left coordinates
                    let width = item.width || 0;

                    // Get font size from text item
                    const fontSize = Math.abs(item.transform[0]) || 12;
                    let height = fontSize * 1.2; // Text height ≈ fontSize * 1.2

                    // ✨ IMPROVED: Scan backwards to find ALL underscores/dots (skip spaces)
                    // We need TWO values:
                    // 1. firstUnderscoreX - for white background (closest to number)
                    // 2. startX - for full width calculation (farthest from number)
                    let startIdx = i;
                    let startX = x;
                    let firstUnderscoreX = x; // Track first underscore found (closest to number)
                    let foundFirstUnderscore = false;

                    console.log(`   🔍 Starting backward scan from item ${i}: "${text}"`);

                    for (let scanIdx = i - 1; scanIdx >= 0; scanIdx--) {
                        const scanItem = items[scanIdx];
                        const scanText = scanItem?.str || '';

                        console.log(`   👀 Scanning item ${scanIdx}: "${scanText}" (length=${scanText.length})`);

                        // Skip whitespace items
                        if (/^\s*$/.test(scanText)) {
                            console.log(`      ⏭️ → Whitespace, continuing...`);
                            continue;
                        }

                        // If this is ONLY dots/underscores (pure separator), include it
                        if (/^[._]+$/.test(scanText)) {
                            const scanX = scanItem.transform[4];

                            console.log(`      ✅ → Pure separator, including it`);

                            // First underscore found (closest to number) - use for background
                            if (!foundFirstUnderscore) {
                                firstUnderscoreX = scanX;
                                foundFirstUnderscore = true;
                                console.log(`      🎯 First underscore at x=${firstUnderscoreX.toFixed(2)} (for background)`);
                            }

                            // Keep updating startX for full width
                            startX = scanX;
                            startIdx = scanIdx;
                            console.log(`      📍 Updated startX to ${startX.toFixed(2)}`);
                        } else {
                            // Hit ANY other text (label, mixed content, etc.) → STOP
                            console.log(`      🛑 → Non-separator text: "${scanText}", STOPPING scan`);
                            console.log(`      📊 Final startX = ${startX.toFixed(2)}, startIdx = ${startIdx}`);
                            break;
                        }
                    }

                    // ✨ IMPROVED: Scan forwards to find ALL underscores/dots (skip spaces)
                    let endIdx = i;
                    let endX = x + width;
                    let lastUnderscoreEndX = x + width; // Track last underscore found (closest to number)
                    let foundLastUnderscore = false;

                    console.log(`   🔍 Starting forward scan from item ${i}: "${text}"`);

                    for (let scanIdx = i + 1; scanIdx < items.length; scanIdx++) {
                        const scanItem = items[scanIdx];
                        const scanText = scanItem?.str || '';

                        console.log(`   👀 Scanning item ${scanIdx}: "${scanText}" (length=${scanText.length})`);

                        // Skip whitespace items
                        if (/^\s*$/.test(scanText)) {
                            console.log(`      ⏭️ → Whitespace, continuing...`);
                            continue;
                        }

                        // If this is ONLY dots/underscores (pure separator), include it
                        if (/^[._]+$/.test(scanText)) {
                            const scanWidth = scanItem.width || 0;
                            const scanEndX = scanItem.transform[4] + scanWidth;

                            console.log(`      ✅ → Pure separator, including it`);

                            // First underscore found after number (closest to number) - use for background
                            if (!foundLastUnderscore) {
                                lastUnderscoreEndX = scanEndX;
                                foundLastUnderscore = true;
                                console.log(`      🎯 Last underscore ends at x=${lastUnderscoreEndX.toFixed(2)} (for background)`);
                            }

                            // Keep updating endX for full width
                            endX = scanEndX;
                            endIdx = scanIdx;
                            console.log(`      📍 Updated endX to ${endX.toFixed(2)}`);
                        } else {
                            // Hit non-separator, non-space text → stop
                            console.log(`      🛑 → Non-separator text: "${scanText}", STOPPING scan`);
                            console.log(`      📊 Final endX = ${endX.toFixed(2)}, endIdx = ${endIdx}`);
                            break;
                        }
                    }

                    // ✨ Calculate full width from all scanned items
                    const fullWidth = endX - startX;
                    console.log(`   📐 Full width: ${fullWidth.toFixed(2)}px (from x=${startX.toFixed(2)} to x=${endX.toFixed(2)})`);

                    // ✨ Background must cover ALL underscores (full width)
                    // Use startX and endX directly (they already exclude label due to break on non-separator)
                    const backgroundX = startX;
                    const backgroundWidth = fullWidth;
                    console.log(`   🎨 Background: x=${backgroundX.toFixed(2)}, width=${backgroundWidth.toFixed(2)}px`);
                    console.log(`   💡 This covers ALL underscores from first to last`);

                    // ✨ Build fullText from all scanned items (for underscore preservation)
                    let fullText = '';
                    for (let idx = startIdx; idx <= endIdx; idx++) {
                        const itemText = items[idx]?.str || '';
                        // Skip pure whitespace when building fullText
                        if (!/^\s*$/.test(itemText)) {
                            fullText += itemText;
                        }
                    }
                    console.log(`   📝 Full text: "${fullText}"`);

                    placeholders.push({
                        id: `placeholder_${placeholders.length + 1}`,
                        original: `(${num})`, // ✅ Show only "(1)", "(2)" in UI
                        fullText: fullText,   // ✅ Store complete text like "______(1)______" for replacement
                        extractedKey: num,
                        type: 'numbered',
                        page: pageNum,
                        x: startX,            // ✅ Full width start (for width calculation)
                        y: y,                 // ✅ BASELINE Y (bottom-left coordinate system)
                        width: fullWidth,     // ✅ Full width including all underscores
                        backgroundX: backgroundX,        // ✅ Background start (only underscores, not label)
                        backgroundWidth: backgroundWidth, // ✅ Background width (only underscores + number)
                        height: height,
                        fontSize: fontSize,   // ✅ Store fontSize for later use
                        position: allText.length,
                        mapped: false,
                        tagId: null,
                    });

                    // ✅ Mark this number as seen
                    seenNumbers.add(numValue);

                    console.log(`🎯 Found placeholder (${num}) in item: "${text.substring(0, 50)}..."`);
                    console.log(`   📍 Coordinates: x=${x.toFixed(2)}, y=${y.toFixed(2)} (BASELINE in bottom-left system)`);
                    console.log(`   📏 Dimensions: width=${width.toFixed(2)}, height=${height.toFixed(2)}, fontSize=${fontSize.toFixed(2)}`);
                    console.log(`   📄 Page: ${pageNum}`);
                    console.log(`   ✅ Validation: foundBefore=${foundBefore}, foundAfter=${foundAfter}`);
                } // End of matches loop
            }
        }

        console.log('\n📝 ═══════════════════════════════════════════════════════');
        console.log('📝 EXTRACTED TEXT (VIA CDN):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(allText.substring(0, 1000));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Total length: ${allText.length} characters`);
        console.log(`🎯 Placeholders from coordinate scan: ${placeholders.length}`);
        console.log('✅ Using placeholders from coordinate scan (NO FALLBACK)');
        console.log('💡 Fallback disabled to ensure coordinates are available');

        console.log('═══════════════════════════════════════════════════════\n');

        // ❌ FALLBACK DISABLED: Tạo placeholders từ text sẽ KHÔNG có coordinates!
        // Chỉ dùng placeholders từ coordinate scan ở trên
        console.log('⚠️ FALLBACK disabled - only using coordinate-based detection');
        console.log('💡 Reason: Fallback creates placeholders WITHOUT coordinates (x, y = null)');

        // If no placeholders found from coordinate scan, show warning
        if (placeholders.length === 0) {
            console.log('⚠️ No placeholders found with coordinates!');
            console.log('💡 Tip: Placeholders should have dots or underscores on both sides, e.g., ...(1)... or ___(1)___');

            // Test patterns
            console.log('🔍 Pattern Detection Tests:');
            console.log('  (1)  :', /\(\s*1\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
            console.log('  (2)  :', /\(\s*2\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
            console.log('  (5)  :', /\(\s*5\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
            console.log('  (10) :', /\(\s*10\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
            console.log('  (20) :', /\(\s*20\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
        }

        return {
            success: true,
            text: allText,
            pageCount: pdfDocument.numPages,
            placeholdersWithCoordinates: placeholders
        };

    } catch (error) {
        console.error('❌ Error extracting text via CDN:', error);
        console.error('❌ Stack:', error.stack);

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Detect placeholders từ text content
 */
export const detectPlaceholders = (text) => {
    const placeholders = [];
    const seen = new Set(); // Tránh trùng lặp

    PLACEHOLDER_PATTERNS.forEach(pattern => {
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
                    suggestedTagKey: (pattern.name === 'numbered' || pattern.name === 'numbered_filled') ? `field_${key}` : key,
                    position: match.index,
                    mapped: false, // Chưa map với tag
                    tagId: null // ID của tag được map
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
        console.log('🔍 Analyzing PDF for placeholders via CDN...');
        console.log('📁 File name:', file.name);
        console.log('📊 File size:', file.size, 'bytes');

        // Extract text from PDF via CDN (includes coordinates!)
        const result = await extractTextFromPDF(file);

        if (!result.success) {
            console.error('❌ Extraction failed:', result.error);
            message.error(`Không thể đọc nội dung PDF: ${result.error}`);
            return null;
        }

        console.log('✅ Extraction success via CDN!');
        console.log('📄 Text length:', result.text?.length || 0);
        console.log('📄 First 500 chars:', result.text?.substring(0, 500));

        // Use placeholders from extraction (they already have x, y coordinates!)
        const placeholders = result.placeholdersWithCoordinates || [];

        console.log('🔎 Detection complete');
        console.log('📊 Found placeholders:', placeholders.length);
        console.log('📍 Placeholders with coordinates:', placeholders.map(p => ({
            original: p.original,
            page: p.page,
            x: p.x?.toFixed(2),
            y: p.y?.toFixed(2)
        })));

        if (placeholders.length === 0) {
            console.warn('⚠️ No placeholders found!');
            console.log('💡 Showing first 1000 chars of extracted text:');
            console.log(result.text?.substring(0, 1000));
            message.warning(
                'Không tìm thấy placeholders. Vui lòng kiểm tra định dạng PDF hoặc dùng chức năng "Paste Text"',
                5
            );
        } else {
            message.success(`Tìm thấy ${placeholders.length} placeholders trong PDF!`);
        }

        return {
            text: result.text,
            pageCount: result.pageCount,
            placeholders
        };

    } catch (error) {
        console.error('❌ Error analyzing PDF:', error);
        message.error('Có lỗi khi phân tích PDF');
        return null;
    }
};

export { PLACEHOLDER_PATTERNS };

