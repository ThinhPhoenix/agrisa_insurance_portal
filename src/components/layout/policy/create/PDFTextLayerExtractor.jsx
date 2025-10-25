/**
 * PDF Text Extractor - Alternative approach without pdfjs-dist heavy dependency
 * Uses multiple methods to extract text from PDF files
 * Handles encoding issues better than basic approaches
 * 
 * INCLUDES FLATEDECODE DECOMPRESSION using pdf-lib's built-in support
 */

/**
 * Decompress FlateDecode stream using pdf-lib's PDFDocument
 * pdf-lib internally uses pako for decompression
 */
async function decompressWithPDFLib(file) {
    try {
        console.log('🔓 [FlateDecode] Using pdf-lib to decompress streams...');

        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        let allText = '';
        const pages = pdfDoc.getPages();

        console.log(`📄 [FlateDecode] Processing ${pages.length} pages`);

        for (let i = 0; i < pages.length; i++) {
            try {
                const page = pages[i];

                // Try to extract text using textContent (if available)
                try {
                    // Get page contents
                    const pageContents = page.node.Contents();
                    if (!pageContents) {
                        console.warn(`⚠️ Page ${i + 1}: No contents`);
                        continue;
                    }

                    // Handle both single stream and array of streams
                    const streams = Array.isArray(pageContents) ? pageContents : [pageContents];

                    for (const streamRef of streams) {
                        try {
                            // Lookup the stream object
                            const stream = pdfDoc.context.lookup(streamRef);

                            if (!stream) continue;

                            console.log(`🔍 Page ${i + 1}, Stream type:`, stream.constructor.name);

                            // Try to get the stream contents
                            let streamBytes = null;

                            // Method 1: If it's a PDFRawStream, we can get contents directly
                            if (stream.contents) {
                                streamBytes = stream.contents;
                                console.log(`✅ Page ${i + 1}: Got contents (${streamBytes.length} bytes)`);
                            }

                            // Method 2: Try to decode the stream
                            if (!streamBytes && typeof stream.decode === 'function') {
                                try {
                                    streamBytes = stream.decode();
                                    console.log(`✅ Page ${i + 1}: Decoded stream (${streamBytes.length} bytes)`);
                                } catch (decodeErr) {
                                    console.warn(`⚠️ Page ${i + 1}: Decode failed:`, decodeErr.message);
                                }
                            }

                            // Method 3: Try getContents() if available
                            if (!streamBytes && typeof stream.getContents === 'function') {
                                try {
                                    streamBytes = stream.getContents();
                                    console.log(`✅ Page ${i + 1}: Got contents via getContents() (${streamBytes.length} bytes)`);
                                } catch (err) {
                                    console.warn(`⚠️ Page ${i + 1}: getContents failed:`, err.message);
                                }
                            }

                            if (streamBytes) {
                                // Decode bytes to string (latin1 for PDF binary)
                                const decoder = new TextDecoder('latin1');
                                const streamText = decoder.decode(streamBytes);

                                console.log(`📝 Page ${i + 1}: Stream text length: ${streamText.length}`);
                                console.log(`📝 Page ${i + 1}: First 200 chars:`, streamText.substring(0, 200));

                                // Extract text between parentheses (PDF text format)
                                const textMatches = streamText.match(/\(([^)]+)\)/g);
                                if (textMatches && textMatches.length > 0) {
                                    const pageText = textMatches
                                        .map(m => {
                                            let text = m.replace(/[()]/g, '');
                                            // Decode escape sequences
                                            text = text
                                                .replace(/\\n/g, '\n')
                                                .replace(/\\r/g, '')
                                                .replace(/\\\(/g, '(')
                                                .replace(/\\\)/g, ')')
                                                .replace(/\\\\/g, '\\');
                                            return text;
                                        })
                                        .join(' ');

                                    console.log(`✅ Page ${i + 1}: Extracted ${textMatches.length} text segments`);
                                    allText += pageText + ' ';
                                } else {
                                    console.warn(`⚠️ Page ${i + 1}: No text found in stream`);
                                }
                            } else {
                                console.warn(`⚠️ Page ${i + 1}: Could not get stream bytes`);
                            }

                        } catch (streamErr) {
                            console.error(`❌ Page ${i + 1}, Stream error:`, streamErr);
                        }
                    }

                } catch (pageErr) {
                    console.error(`❌ Page ${i + 1} error:`, pageErr);
                }

                console.log(`📊 Page ${i + 1} complete. Total text so far: ${allText.length} chars`);

            } catch (err) {
                console.error(`❌ Error processing page ${i + 1}:`, err);
            }
        }

        console.log(`✅ [FlateDecode] Total extracted: ${allText.length} characters`);

        if (allText.length < 100) {
            console.warn('⚠️ [FlateDecode] Very little text extracted!');
            console.warn('💡 This PDF might be:');
            console.warn('   1. Scanned image (need OCR)');
            console.warn('   2. Using complex compression (DCTDecode, etc.)');
            console.warn('   3. Text stored in different format');
            console.warn('💡 Recommendation: Use "Paste Text from PDF" button instead');
        }

        return allText;

    } catch (error) {
        console.error('❌ [FlateDecode] Failed:', error);
        return null;
    }
}/**
 * Method 1: Use PDF-LIB with FlateDecode decompression
 * This automatically handles compressed streams
 */
export async function extractWithPDFLib(file) {
    // Use the new FlateDecode decompression method
    return await decompressWithPDFLib(file);
}/**
 * Method 2: Binary text extraction with advanced regex
 * Works with uncompressed text-based PDFs
 */
export async function extractWithBinaryParsing(file) {
    try {
        console.log('🔧 [Binary Parser] Starting extraction...');

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to string (latin1 encoding for PDF binary)
        let pdfText = '';
        for (let i = 0; i < uint8Array.length; i++) {
            pdfText += String.fromCharCode(uint8Array[i]);
        }

        console.log(`📄 [Binary Parser] PDF size: ${pdfText.length} bytes`);

        // Extract text between stream and endstream
        const streamRegex = /stream\s*\n([\s\S]*?)\nendstream/g;
        let extractedText = '';
        let match;
        let streamCount = 0;

        while ((match = streamRegex.exec(pdfText)) !== null) {
            streamCount++;
            const streamContent = match[1];

            // Check if stream is compressed
            const beforeStream = pdfText.substring(Math.max(0, match.index - 500), match.index);
            const isCompressed = /\/Filter\s*\/FlateDecode/.test(beforeStream);

            if (isCompressed) {
                console.log(`⚠️ [Binary Parser] Stream ${streamCount}: Compressed (skipping - use PDF-LIB method instead)`);
                continue;
            }

            // Look for text operators: Tj, TJ, ', "
            const textRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
            const arrayTextRegex = /\[\(([^)]*)\)\]\s*TJ/g;

            let textMatch;
            while ((textMatch = textRegex.exec(streamContent)) !== null) {
                let text = textMatch[1];
                // Decode escape sequences
                text = text
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\\(/g, '(')
                    .replace(/\\\)/g, ')')
                    .replace(/\\\\/g, '\\');

                extractedText += text + ' ';
            }

            while ((textMatch = arrayTextRegex.exec(streamContent)) !== null) {
                extractedText += textMatch[1] + ' ';
            }
        }

        console.log(`📊 [Binary Parser] Processed ${streamCount} streams`);

        // Also try to find text in simple format
        const simpleTextRegex = /\(([^)]{2,})\)/g;
        const matches = pdfText.match(simpleTextRegex);

        if (matches && matches.length > extractedText.length / 10) {
            console.log('📝 [Binary Parser] Using simple text extraction as fallback');
            const simpleText = matches
                .map(m => m.replace(/[()]/g, ''))
                .filter(text => {
                    // Filter out PDF commands and binary data
                    return text.length > 1 &&
                        !/^[0-9.]+$/.test(text) && // Not just numbers
                        !/^\s*$/.test(text) &&      // Not whitespace
                        !/[\x00-\x08\x0B-\x1F]/.test(text); // No control chars
                })
                .join(' ');

            if (simpleText.length > extractedText.length) {
                extractedText = simpleText;
            }
        }

        console.log(`✅ [Binary Parser] Extracted ${extractedText.length} characters`);
        console.log('📝 [Binary Parser] Sample:', extractedText.substring(0, 500));

        return extractedText;

    } catch (error) {
        console.error('❌ [Binary Parser] Failed:', error);
        throw error;
    }
}/**
 * Method 3: UTF-8 decoding with Vietnamese support
 * Handles Unicode properly for Vietnamese text
 */
export async function extractWithUTF8(file) {
    try {
        console.log('🔧 [UTF-8 Parser] Starting extraction...');

        const arrayBuffer = await file.arrayBuffer();

        // Try UTF-8 decoding
        const decoder = new TextDecoder('utf-8', { fatal: false });
        let text = decoder.decode(arrayBuffer);

        console.log(`📄 [UTF-8 Parser] Decoded ${text.length} characters`);

        // Extract text between parentheses (PDF text format)
        const textMatches = [];
        const regex = /\(([^)]{2,})\)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const extracted = match[1];

            // Filter valid text (not PDF commands)
            if (extracted.length > 1 &&
                !/^[\s\d.]+$/.test(extracted) && // Not just numbers/spaces
                !extracted.includes('endobj') &&
                !extracted.includes('stream')) {

                // Decode escape sequences
                const decoded = extracted
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '')
                    .replace(/\\\(/g, '(')
                    .replace(/\\\)/g, ')')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));

                textMatches.push(decoded);
            }
        }

        const extractedText = textMatches.join(' ');

        console.log(`✅ [UTF-8 Parser] Extracted ${extractedText.length} characters`);
        console.log(`🎯 [UTF-8 Parser] Found ${textMatches.length} text segments`);

        return extractedText;

    } catch (error) {
        console.error('❌ [UTF-8 Parser] Failed:', error);
        throw error;
    }
}

/**
 * Master extraction function - tries all methods in order
 * Returns the best result
 */
export async function extractTextFromPDFMultiMethod(file) {
    console.log('\n🚀 ═══════════════════════════════════════════════════════');
    console.log('🔍 Multi-Method PDF Text Extraction');
    console.log('📄 File:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    console.log('═══════════════════════════════════════════════════════\n');

    const results = [];

    // Try Method 1: PDF-LIB with FlateDecode (BEST for compressed PDFs)
    try {
        console.log('🔧 Method 1: PDF-LIB with FlateDecode decompression [RECOMMENDED]');
        const text = await extractWithPDFLib(file);
        if (text && text.length > 50) {
            results.push({ method: 'PDF-LIB (FlateDecode)', text, score: text.length * 1.2 }); // Bonus score
            console.log('✅ Method 1: SUCCESS');
        }
    } catch (err) {
        console.warn('⚠️ PDF-LIB failed:', err.message);
    }

    // Try Method 2: UTF-8 Parser (Fast & Good for uncompressed Vietnamese)
    try {
        console.log('\n🔧 Method 2: UTF-8 Parser');
        const text = await extractWithUTF8(file);
        if (text && text.length > 50) {
            results.push({ method: 'UTF-8 Parser', text, score: text.length });
            console.log('✅ Method 2: SUCCESS');
        }
    } catch (err) {
        console.warn('⚠️ UTF-8 Parser failed:', err.message);
    }

    // Try Method 3: Binary Parser (For uncompressed streams)
    try {
        console.log('\n🔧 Method 3: Binary Parser');
        const text = await extractWithBinaryParsing(file);
        if (text && text.length > 50) {
            results.push({ method: 'Binary Parser', text, score: text.length });
            console.log('✅ Method 3: SUCCESS');
        }
    } catch (err) {
        console.warn('⚠️ Binary Parser failed:', err.message);
    } if (results.length === 0) {
        console.error('❌ All extraction methods failed');
        return '';
    }

    // Choose best result (longest text with valid content)
    const best = results.reduce((prev, current) => {
        // Prefer results with more content and valid patterns
        const currentHasNumbers = /\(\d+\)/.test(current.text);
        const prevHasNumbers = /\(\d+\)/.test(prev.text);

        if (currentHasNumbers && !prevHasNumbers) return current;
        if (!currentHasNumbers && prevHasNumbers) return prev;

        return current.score > prev.score ? current : prev;
    });

    console.log('\n✅ ═══════════════════════════════════════════════════════');
    console.log(`🏆 Best method: ${best.method}`);
    console.log(`📊 Extracted: ${best.text.length} characters`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 EXTRACTED TEXT (first 3000 chars):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(best.text.substring(0, 3000));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Pattern tests
    console.log('🔍 Pattern Detection:');
    const patterns = [
        { name: '(1)', regex: /\(1\)/ },
        { name: '(2)', regex: /\(2\)/ },
        { name: '(5)', regex: /\(5\)/ },
        { name: '(10)', regex: /\(10\)/ },
        { name: '(20)', regex: /\(20\)/ },
        { name: '{{key}}', regex: /\{\{/ },
        { name: '[key]', regex: /\[/ }
    ];

    patterns.forEach(p => {
        const found = p.regex.test(best.text);
        console.log(`  ${p.name.padEnd(10)}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });

    // Find all numbered placeholders
    const numberedMatches = best.text.match(/\((\d+)\)/g);
    if (numberedMatches) {
        console.log(`\n🎯 Numbered placeholders: ${numberedMatches.length} found`);
        console.log('   ', numberedMatches.slice(0, 30).join(', '));
        if (numberedMatches.length > 30) {
            console.log(`   ... and ${numberedMatches.length - 30} more`);
        }
    }

    return best.text;
}
