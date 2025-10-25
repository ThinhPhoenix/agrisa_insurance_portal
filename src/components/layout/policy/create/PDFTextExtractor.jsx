/**
 * Advanced PDF Text Extraction
 * Parse PDF content streams để extract text chính xác hơn
 */

/**
 * Decode PDF text encoding
 * Handle escaped characters and special encodings
 */
export const decodeText = (text) => {
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .trim();
};

/**
 * Parse PDF content stream để extract text
 * PDF content streams chứa text operators
 */
export const parseContentStream = (contentStream) => {
    try {
        // Convert stream to string
        let text = '';

        if (typeof contentStream === 'string') {
            text = contentStream;
        } else if (contentStream.toString) {
            text = contentStream.toString();
        } else {
            console.warn('Unknown content stream type:', typeof contentStream);
            return '';
        }

        const extractedTexts = [];

        // Pattern: (text) with operators
        // Match all text within parentheses followed by PDF operators
        const textPattern = /\(([^)]*)\)/g;
        let match;

        while ((match = textPattern.exec(text)) !== null) {
            const decodedText = decodeText(match[1]);
            if (decodedText) {
                extractedTexts.push(decodedText);
            }
        }

        return extractedTexts.join(' ');
    } catch (error) {
        console.error('Error parsing content stream:', error);
        return '';
    }
};

/**
 * Extract text từ PDF với multiple strategies
 */
export const extractTextAdvanced = async (pdfDoc) => {
    const pages = pdfDoc.getPages();
    let allText = '';

    console.log(`📄 Processing ${pages.length} pages...`);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        try {
            // Get content stream
            const contentStreams = page.node.Contents();

            if (!contentStreams) {
                console.warn(`Page ${i}: No content streams`);
                continue;
            }

            // Handle array of streams
            if (Array.isArray(contentStreams)) {
                console.log(`Page ${i}: ${contentStreams.length} content streams`);
                for (const stream of contentStreams) {
                    const streamText = parseContentStream(stream);
                    if (streamText) {
                        allText += streamText + ' ';
                    }
                }
            } else {
                // Single stream
                console.log(`Page ${i}: Single content stream`);
                const streamText = parseContentStream(contentStreams);
                if (streamText) {
                    allText += streamText + ' ';
                }
            }

        } catch (err) {
            console.warn(`Error extracting from page ${i}:`, err);
        }
    }

    console.log(`✅ Extracted ${allText.length} characters total`);
    console.log(`📝 Sample: ${allText.substring(0, 300)}...`);

    return allText;
};
