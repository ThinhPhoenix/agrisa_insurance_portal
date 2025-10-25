import { NextResponse } from "next/server";

/**
 * API Route để extract text và placeholders từ PDF
 * Chạy server-side nên không có Next.js SSR issues với pdfjs-dist
 *
 * POST /api/pdf/extract
 * Body: FormData với file PDF
 * Response: { success, placeholders: [{ id, original, x, y, page }] }
 */
export async function POST(request) {
  try {
    console.log("🔍 [API] Starting PDF extraction...");

    // Get file from FormData
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("📄 [API] File received:", file.name, file.size, "bytes");

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Dynamic import pdfjs-dist (server-side safe)
    // CRITICAL: Use 'pdfjs-dist' NOT 'pdfjs-dist/legacy/build/pdf.mjs' in Node.js
    const pdfjsLib = await import("pdfjs-dist");

    // CRITICAL: Disable worker to avoid browser-only Canvas API errors
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;

    // Load PDF document with Node.js compatible options
    console.log("📖 [API] Loading PDF document...");
    const loadingTask = pdfjsLib.getDocument({
      data,
      // Disable features that require browser APIs
      useSystemFonts: false,
      standardFontDataUrl: null,
      cMapUrl: null,
      cMapPacked: false,
    });
    const pdfDocument = await loadingTask.promise;

    console.log(`📚 [API] PDF loaded: ${pdfDocument.numPages} pages`);

    const placeholders = [];
    let allText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      console.log(
        `📃 [API] Processing page ${pageNum}/${pdfDocument.numPages}...`
      );

      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      console.log(
        `📝 [API] Page ${pageNum}: ${textContent.items.length} text items`
      );

      // Process each text item
      textContent.items.forEach((item, index) => {
        const text = item.str;
        allText += text + " ";

        // Check if this is a numbered placeholder: (1), (2), etc.
        const numberedMatch = text.match(/^\((\d+)\)$/);
        if (numberedMatch) {
          const num = numberedMatch[1];
          placeholders.push({
            id: `placeholder_${placeholders.length + 1}`,
            original: text, // "(1)"
            extractedKey: num, // "1"
            type: "numbered",
            page: pageNum,
            x: item.transform[4], // X coordinate
            y: item.transform[5], // Y coordinate
            width: item.width,
            height: item.height,
            position: allText.length,
            mapped: false,
            tagId: null,
          });
          console.log(
            `🎯 [API] Found placeholder: ${text} at (${item.transform[4].toFixed(
              2
            )}, ${item.transform[5].toFixed(2)}) on page ${pageNum}`
          );
        }

        // Check for handlebars: {{key}}
        const handlebarsMatch = text.match(
          /^\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}$/
        );
        if (handlebarsMatch) {
          placeholders.push({
            id: `placeholder_${placeholders.length + 1}`,
            original: text,
            extractedKey: handlebarsMatch[1],
            type: "handlebars",
            page: pageNum,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            position: allText.length,
            mapped: false,
            tagId: null,
          });
        }

        // Check for brackets: [key]
        const bracketsMatch = text.match(/^\[([a-zA-Z_][a-zA-Z0-9_]*)\]$/);
        if (bracketsMatch) {
          placeholders.push({
            id: `placeholder_${placeholders.length + 1}`,
            original: text,
            extractedKey: bracketsMatch[1],
            type: "brackets",
            page: pageNum,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            position: allText.length,
            mapped: false,
            tagId: null,
          });
        }
      });
    }

    console.log(`✅ [API] Extraction complete!`);
    console.log(`📊 [API] Total text length: ${allText.length} characters`);
    console.log(`🎯 [API] Found ${placeholders.length} placeholders`);

    // Log first 1000 chars of extracted text
    console.log("📝 [API] Extracted text (first 1000 chars):");
    console.log("━".repeat(80));
    console.log(allText.substring(0, 1000));
    console.log("━".repeat(80));

    return NextResponse.json({
      success: true,
      placeholders,
      textLength: allText.length,
      extractedText: allText.substring(0, 5000), // Send first 5000 chars for verification
      pageCount: pdfDocument.numPages,
    });
  } catch (error) {
    console.error("❌ [API] Error extracting PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
