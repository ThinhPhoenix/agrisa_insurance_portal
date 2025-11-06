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

                // ✅ SIMPLE & ROBUST: Find (number) with at least 3 separators on same Y coordinate
                // Support spaces inside: ( 1), (2 ), ( 3 )
                const regex = /\(\s*(\d+)\s*\)/g;
                const matches = [...text.matchAll(regex)];

                for (const numberedMatch of matches) {
                    const num = numberedMatch[1];
                    const numValue = parseInt(num);

                    // Skip duplicates
                    if (seenNumbers.has(numValue)) {
                        console.log(`⏭️ Skip (${num}) - duplicate`);
                        continue;
                    }

                    // Skip large numbers (years)
                    if (numValue > 100) {
                        console.log(`⏭️ Skip (${num}) - too large`);
                        continue;
                    }

                    // Get current item position
                    const x = item.transform[4];
                    const y = item.transform[5];
                    const width = item.width || 0;
                    const fontSize = Math.abs(item.transform[0]) || 12;
                    const height = fontSize * 1.2;

                    // ✅ EXPANDED SEARCH: Look for separators in wider X range (not just Y)
                    // This handles cases where `( 1)` is in separate item from dots/underscores
                    const Y_TOLERANCE = 5; // Same line tolerance (increased to 5 to handle Y variations)
                    const X_RANGE = 150; // Look 150px before and after

                    const nearbyItems = [];
                    for (let j = 0; j < items.length; j++) {
                        const checkItem = items[j];
                        const checkX = checkItem.transform[4];
                        const checkY = checkItem.transform[5];

                        // Include items on same line (Y) AND within X range
                        const sameY = Math.abs(checkY - y) <= Y_TOLERANCE;
                        const nearX = checkX >= (x - X_RANGE) && checkX <= (x + width + X_RANGE);

                        if (sameY && nearX) {
                            nearbyItems.push(checkItem);
                        }
                    }

                    // Sort by X position to maintain order
                    nearbyItems.sort((a, b) => a.transform[4] - b.transform[4]);

                    // Build combined text and calculate bounds
                    let combinedText = '';
                    let startX = x;
                    let endX = x + width;

                    for (const nearItem of nearbyItems) {
                        const nearText = nearItem.str || '';
                        combinedText += nearText;

                        const itemX = nearItem.transform[4];
                        const itemWidth = nearItem.width || 0;

                        if (itemX < startX) startX = itemX;
                        if (itemX + itemWidth > endX) endX = itemX + itemWidth;
                    }

                    // Count separators (. or _) in combined text
                    const separatorMatches = combinedText.match(/[._]/g);
                    const separatorCount = separatorMatches ? separatorMatches.length : 0;

                    console.log(`🔍 (${num}): text="${combinedText.substring(0, 120)}", seps=${separatorCount}`);
                    console.log(`   📍 Position: x=${x.toFixed(2)}, y=${y.toFixed(2)}, page=${pageNum}`);
                    console.log(`   📦 Found ${nearbyItems.length} nearby items within X±${X_RANGE}, Y±${Y_TOLERANCE}`);

                    // ✅ FLEXIBLE VALIDATION: Accept if:
                    // 1. >= 3 separators total, OR
                    // 2. Has pattern of 2+ consecutive separators before/after
                    const hasPattern = /[._]{2,}/.test(combinedText);
                    const isValid = separatorCount >= 3 || hasPattern;

                    if (!isValid) {
                        console.log(`   ⏭️ Skip - seps=${separatorCount}, hasPattern=${hasPattern}`);
                        continue;
                    }

                    // Calculate full width
                    const fullWidth = endX - startX;

                    placeholders.push({
                        id: `placeholder_${placeholders.length + 1}`,
                        original: `(${num})`,
                        fullText: combinedText.trim(),
                        extractedKey: num,
                        type: 'numbered',
                        page: pageNum,
                        x: startX,
                        y: y,
                        width: fullWidth,
                        backgroundX: x,
                        backgroundWidth: width,
                        height: height,
                        fontSize: fontSize,
                        position: allText.length,
                        mapped: false,
                        tagId: null,
                    });

                    seenNumbers.add(numValue);
                    console.log(`   ✅ ACCEPTED (${num}) [seps=${separatorCount}]`);
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

        // ✅ SMART FALLBACK: Find missing numbers in extracted text
        console.log('\n🔍 Checking for missing placeholders...');
        const foundNumbers = new Set(placeholders.map(p => parseInt(p.extractedKey)));
        const missingNumbers = [];

        // Find all (number) in text to determine expected range
        const allNumberMatches = allText.matchAll(/\(\s*(\d+)\s*\)/g);
        let maxNumber = 0;
        for (const match of allNumberMatches) {
            const num = parseInt(match[1]);
            if (num > maxNumber && num <= 100) maxNumber = num;
        }

        // Check which numbers are missing
        for (let i = 1; i <= maxNumber; i++) {
            if (!foundNumbers.has(i)) {
                missingNumbers.push(i);
            }
        }

        console.log(`📊 Found: ${foundNumbers.size}, Expected: ${maxNumber}, Missing: [${missingNumbers.join(', ')}]`);

        // ✅ FALLBACK for missing numbers: Find in text with relaxed validation
        if (missingNumbers.length > 0) {
            console.log(`\n🔧 FALLBACK: Searching for missing placeholders in text...`);

            for (const missingNum of missingNumbers) {
                const pattern = new RegExp(`[._ ]{2,}\\(\\s*${missingNum}\\s*\\)[._ ]{2,}`, 'g');
                const match = pattern.exec(allText);

                if (match) {
                    console.log(`   ✅ Found (${missingNum}) in text at position ${match.index}`);

                    // Estimate coordinates from nearby placeholders on same page
                    let estimatedPage = 1;
                    let estimatedX = 100;
                    let estimatedY = 700;
                    let estimatedFontSize = 10;

                    // Try to find a nearby placeholder to copy coordinates from
                    const nearbyPlaceholder = placeholders.find(p =>
                        Math.abs(parseInt(p.extractedKey) - missingNum) <= 3
                    );

                    if (nearbyPlaceholder) {
                        estimatedPage = nearbyPlaceholder.page;
                        estimatedX = nearbyPlaceholder.x;
                        estimatedY = nearbyPlaceholder.y + (missingNum - parseInt(nearbyPlaceholder.extractedKey)) * 20;
                        estimatedFontSize = nearbyPlaceholder.fontSize;
                        console.log(`   📍 Using nearby (${nearbyPlaceholder.extractedKey}) as reference`);
                    }

                    placeholders.push({
                        id: `placeholder_${placeholders.length + 1}`,
                        original: `(${missingNum})`,
                        fullText: match[0].trim(),
                        extractedKey: missingNum.toString(),
                        type: 'numbered',
                        page: estimatedPage,
                        x: estimatedX,
                        y: estimatedY,
                        width: match[0].length * estimatedFontSize * 0.6,
                        backgroundX: estimatedX,
                        backgroundWidth: match[0].length * estimatedFontSize * 0.6,
                        height: estimatedFontSize * 1.2,
                        fontSize: estimatedFontSize,
                        position: match.index,
                        mapped: false,
                        tagId: null,
                        fallback: true, // Mark as fallback
                    });

                    console.log(`   ✅ Added (${missingNum}) via FALLBACK with estimated coordinates`);
                }
            }
        }

        console.log('═══════════════════════════════════════════════════════\n');

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

