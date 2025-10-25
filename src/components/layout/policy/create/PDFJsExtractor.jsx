/**
 * Extract text from PDF using Mozilla PDF.js (pdfjs-dist)
 * This handles PDF encoding much better than pdf-lib
 * Uses dynamic import to avoid Next.js SSR issues
 * @param {File} file - The PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextWithPDFJs(file) {
    try {
        console.log('🔧 [PDF.js] Starting text extraction...');

        // Dynamic import to avoid SSR issues with Next.js
        const pdfjsLib = await import('pdfjs-dist');

        // Configure worker (only on client side)
        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        console.log(`📄 [PDF.js] PDF loaded: ${pdf.numPages} pages`);

        let fullText = '';

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine all text items
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                fullText += pageText + '\n';

                console.log(`📃 [PDF.js] Page ${pageNum}/${pdf.numPages}: ${pageText.length} characters`);
            } catch (pageError) {
                console.error(`❌ [PDF.js] Error on page ${pageNum}:`, pageError);
            }
        }

        console.log(`✅ [PDF.js] Total extracted: ${fullText.length} characters`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 [PDF.js] FULL EXTRACTED TEXT:');
        console.log(fullText.substring(0, 3000)); // Show more chars
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Test for common patterns
        console.log('\n🔍 [PDF.js] Pattern Detection Tests:');
        console.log('Contains (1)?', /\(1\)/.test(fullText));
        console.log('Contains (2)?', /\(2\)/.test(fullText));
        console.log('Contains (5)?', /\(5\)/.test(fullText));
        console.log('Contains (10)?', /\(10\)/.test(fullText));
        console.log('Contains (20)?', /\(20\)/.test(fullText));
        console.log('Contains {{?', /\{\{/.test(fullText));
        console.log('Contains [?', /\[/.test(fullText));

        // Show sample matches
        const numberedMatches = fullText.match(/\((\d+)\)/g);
        if (numberedMatches) {
            console.log(`\n🎯 [PDF.js] Found numbered placeholders: ${numberedMatches.slice(0, 10).join(', ')}`);
        }

        return fullText;

    } catch (error) {
        console.error('❌ [PDF.js] Extraction failed:', error);
        throw error;
    }
}

/**
 * Extract text with layout preservation (maintains positioning)
 * Useful for more accurate placeholder detection
 * @param {File} file - The PDF file
 * @returns {Promise<string>} - Extracted text with layout preserved
 */
export async function extractTextWithLayout(file) {
    try {
        console.log('🔧 [PDF.js Layout] Starting extraction...');

        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import('pdfjs-dist');

        // Configure worker
        if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Sort items by position (top to bottom, left to right)
            const sortedItems = textContent.items.sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5]; // Y position (inverted in PDF)
                if (Math.abs(yDiff) > 5) return yDiff; // Different lines
                return a.transform[4] - b.transform[4]; // X position (same line)
            });

            let lastY = null;
            let pageText = '';

            for (const item of sortedItems) {
                const y = item.transform[5];

                // New line if Y position changed significantly
                if (lastY !== null && Math.abs(y - lastY) > 5) {
                    pageText += '\n';
                }

                pageText += item.str + ' ';
                lastY = y;
            }

            fullText += pageText + '\n\n';
        }

        console.log(`✅ [PDF.js Layout] Extracted ${fullText.length} characters with layout`);

        return fullText;

    } catch (error) {
        console.error('❌ [PDF.js Layout] Extraction failed:', error);
        throw error;
    }
}
