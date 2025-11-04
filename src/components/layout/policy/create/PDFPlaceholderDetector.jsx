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

                // First, check if current item contains (number)
                const numberedMatch = text.match(/\(\s*(\d+)\s*\)/);

                if (numberedMatch) {
                    const num = numberedMatch[1];
                    const numValue = parseInt(num);

                    // Validate: Only accept numbers <= 100 (avoid years like 2021)
                    if (numValue > 100) {
                        console.log(`⏭️ Skipping (${num}) - looks like a year`);
                        continue;
                    }

                    // Check context: Look at previous and next items for dots/underscores
                    const prevItem = i > 0 ? items[i - 1] : null;
                    const nextItem = i < items.length - 1 ? items[i + 1] : null;

                    const prevText = prevItem?.str || '';
                    const nextText = nextItem?.str || '';

                    // Check if surrounded by dots or underscores
                    const hasDotsBefore = /[._]+$/.test(prevText) || /^[._]+/.test(text);
                    const hasDotsAfter = /^[._]+/.test(nextText) || /[._]+$/.test(text);

                    // Accept if:
                    // 1. Has dots/underscores on both sides
                    // 2. OR is standalone (but validate by number range)
                    const isValid = (hasDotsBefore && hasDotsAfter) || numValue <= 20;

                    if (isValid) {
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

                        // If previous item is dots, include it in width calculation
                        if (prevItem && /^[._]+$/.test(prevText)) {
                            x = prevItem.transform[4]; // Use prev x
                            width += (prevItem.width || 0);
                        }

                        // If next item is dots, include it in width calculation
                        if (nextItem && /^[._]+$/.test(nextText)) {
                            width += (nextItem.width || 0);
                        }

                        placeholders.push({
                            id: `placeholder_${placeholders.length + 1}`,
                            original: text.trim(),
                            extractedKey: num,
                            type: 'numbered',
                            page: pageNum,
                            x: x,
                            y: y, // ✅ BASELINE Y (bottom-left coordinate system)
                            width: width,
                            height: height,
                            fontSize: fontSize, // ✅ Store fontSize for later use
                            position: allText.length,
                            mapped: false,
                            tagId: null,
                        });

                        console.log(`🎯 Found placeholder: ${text.trim()}`);
                        console.log(`   📍 Coordinates: x=${x.toFixed(2)}, y=${y.toFixed(2)} (BASELINE in bottom-left system)`);
                        console.log(`   📏 Dimensions: width=${width.toFixed(2)}, height=${height.toFixed(2)}, fontSize=${fontSize.toFixed(2)}`);
                        console.log(`   📄 Page: ${pageNum}`);
                        console.log(`   🔤 Context: "${prevText}" [${text}] "${nextText}"`);
                        console.log(`   ✅ Validation: dots before=${hasDotsBefore}, after=${hasDotsAfter}, num=${numValue}`);
                    } else {
                        console.log(`⏭️ Skipping (${num}) - no dots/underscores context`);
                    }
                }
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

