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

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            console.log(`📃 Processing page ${pageNum}/${pdfDocument.numPages}...`);

            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();

            console.log(`📝 Page ${pageNum}: ${textContent.items.length} text items`);

            // Process each text item
            textContent.items.forEach((item) => {
                const text = item.str;
                allText += text + ' ';

                // Check if this is a numbered placeholder exactly like "(1)" OR
                // a numbered placeholder with surrounding dots/underscores like "...(1)..." or "___(1)___".
                const numberedMatch = text.match(/^[._]*\(\s*(\d+)\s*\)[._]*$/);
                if (numberedMatch) {
                    const num = numberedMatch[1];
                    placeholders.push({
                        id: `placeholder_${placeholders.length + 1}`,
                        original: text,
                        extractedKey: num,
                        type: 'numbered',
                        page: pageNum,
                        x: item.transform[4],
                        y: item.transform[5],
                        width: item.width,
                        height: item.height,
                        position: allText.length,
                        mapped: false,
                        tagId: null,
                    });
                    console.log(`🎯 Found placeholder: ${text} at (${item.transform[4].toFixed(2)}, ${item.transform[5].toFixed(2)}) on page ${pageNum}`);
                }
            });
        }

        console.log('\n📝 ═══════════════════════════════════════════════════════');
        console.log('📝 EXTRACTED TEXT (VIA CDN):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(allText.substring(0, 1000));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Total length: ${allText.length} characters`);
        console.log(`🎯 Placeholders from coordinate scan: ${placeholders.length}`);
        console.log('═══════════════════════════════════════════════════════\n');

        // FALLBACK: Detect placeholders from full text (handle spaced text)
        // Pattern: .(1). or ..(2).. or ...(3)... (MUST have dots on both sides to avoid year like (2021))
        console.log('🔍 FALLBACK: Scanning full text for placeholders...');
        console.log('📏 Validation rule: Placeholder MUST have dots or underscores on both sides: .(number). or _(number)_');

        // Regex: Look for pattern with dots or underscores before and after: .{1,}(number).{1,} or _{1,}(number)_{1,}
        // This avoids matching years like (2021) or standalone numbers. We now accept underscores as filler too.
        const placeholderRegex = /[._]+\s*\(\s*(\d+)\s*\)\s*[._]+/g;
        const textPlaceholderMatches = allText.match(placeholderRegex);

        if (textPlaceholderMatches && textPlaceholderMatches.length > 0) {
            console.log(`✨ Found ${textPlaceholderMatches.length} VALID placeholders (with dots) in full text!`);
            console.log('📋 Placeholders:', textPlaceholderMatches.slice(0, 30).join(', '));

            // Extract unique numbers from validated matches
            const uniqueNumbers = new Set();
            textPlaceholderMatches.forEach(match => {
                const num = match.match(/\d+/)[0];
                if (num && parseInt(num) <= 100) { // Only accept numbers <= 100 to avoid years
                    uniqueNumbers.add(num);
                }
            });

            console.log(`✅ Extracted ${uniqueNumbers.size} unique valid numbers:`, Array.from(uniqueNumbers).sort((a, b) => parseInt(a) - parseInt(b)));

            // Create placeholder objects from text matches
            const textBasedPlaceholders = Array.from(uniqueNumbers).map((num, index) => ({
                id: `placeholder_${index + 1}`,
                original: `(${num})`,
                extractedKey: num,
                type: 'numbered',
                page: 1, // Default page (we don't have exact coordinates)
                x: null,
                y: null,
                width: null,
                height: null,
                position: allText.indexOf(`(${num})`),
                mapped: false,
                tagId: null,
            }));

            console.log(`✅ Created ${textBasedPlaceholders.length} placeholder objects`);
            console.log('💡 Note: Years like (2021) are excluded by validation rule');

            return {
                success: true,
                text: allText,
                pageCount: pdfDocument.numPages,
                placeholdersWithCoordinates: textBasedPlaceholders
            };
        }

        console.log('⚠️ No valid placeholders found with pattern .(number) or _(number)_ .');
        console.log('💡 Tip: Placeholders should have dots or underscores on both sides, e.g., ...(1)... or ___(1)___');        // Test patterns
        console.log('🔍 Pattern Detection Tests:');
        console.log('  (1)  :', /\(\s*1\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  (2)  :', /\(\s*2\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  (5)  :', /\(\s*5\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  (10) :', /\(\s*10\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');
        console.log('  (20) :', /\(\s*20\s*\)/.test(allText) ? '✅ FOUND' : '❌ NOT FOUND');

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

