/**
 * PDF Form Helper Utility
 *
 * Purpose: Add AcroForm fields to static PDFs before uploading to backend
 * This allows backend (pdfcpu) to fill form fields programmatically
 *
 * @module pdfFormHelper
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * @typedef {Object} FieldDefinition
 * @property {string} name - Field name (must match backend expected keys)
 * @property {number} x - X coordinate (bottom-left origin)
 * @property {number} y - Y coordinate (bottom-left origin)
 * @property {number} width - Field width in points
 * @property {number} height - Field height in points
 * @property {number} [page=0] - Page index (0-based)
 * @property {'text'|'checkbox'|'dropdown'} [type='text'] - Field type
 * @property {string} [defaultValue=''] - Default value
 * @property {boolean} [readOnly=false] - Whether field is read-only
 * @property {boolean} [multiline=false] - Whether text field is multiline
 * @property {number} [fontSize=12] - Font size for text field
 * @property {[number, number, number]} [backgroundColor=[1, 1, 1]] - RGB background color
 * @property {[number, number, number]} [borderColor=[0.7, 0.7, 0.7]] - RGB border color
 * @property {number} [borderWidth=1] - Border width in points
 */

/**
 * Global font cache to avoid re-downloading on every operation
 */
let cachedFontBytes = null;
let cachedFontkitModule = null;

/**
 * Load and embed Vietnamese-compatible font
 * @param {PDFDocument} pdfDoc - PDF document instance
 * @returns {Promise<PDFFont>} Embedded font
 */
async function embedVietnameseFont(pdfDoc) {
  try {
    // Check cache first
    if (!cachedFontBytes) {
      const fontUrl =
        'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf';

      const fontResponse = await fetch(fontUrl);
      if (!fontResponse.ok) {
        throw new Error(`Font fetch failed: ${fontResponse.status}`);
      }

      cachedFontBytes = await fontResponse.arrayBuffer();
    }

    let customFont;
    try {
      // Dynamic import fontkit (if installed)
      if (!cachedFontkitModule) {
        cachedFontkitModule = await import('@pdf-lib/fontkit').then(
          (m) => m.default || m
        );
      }

      pdfDoc.registerFontkit(cachedFontkitModule);
      customFont = await pdfDoc.embedFont(cachedFontBytes);
    } catch (fontkitError) {
      console.warn('Fontkit not available, using fallback font');
      customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    return customFont;
  } catch (error) {
    console.warn('Failed to load custom font, using Helvetica:', error);
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}

/**
 * Add AcroForm fields to a PDF document
 *
 * @param {ArrayBuffer|Uint8Array} pdfBytes - PDF file as ArrayBuffer or Uint8Array
 * @param {FieldDefinition[]} fields - Array of field definitions
 * @returns {Promise<Uint8Array>} Modified PDF with form fields
 *
 * @example
 * const pdfBytes = await file.arrayBuffer();
 * const fields = [
 *   { name: 'farmer_name', x: 150, y: 680, width: 200, height: 20 },
 *   { name: 'policy_number', x: 400, y: 680, width: 150, height: 20 },
 * ];
 * const modifiedPdf = await addFormFieldsToPdf(pdfBytes, fields);
 */
export async function addFormFieldsToPdf(pdfBytes, fields) {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Embed font for Vietnamese support
    const font = await embedVietnameseFont(pdfDoc);

    // Get or create form
    const form = pdfDoc.getForm();

    // Group fields by page for efficient processing
    const fieldsByPage = {};
    fields.forEach((field) => {
      const pageIndex = field.page ?? 0;
      if (!fieldsByPage[pageIndex]) {
        fieldsByPage[pageIndex] = [];
      }
      fieldsByPage[pageIndex].push(field);
    });

    // Create fields page by page
    for (const [pageIndexStr, pageFields] of Object.entries(fieldsByPage)) {
      const pageIndex = parseInt(pageIndexStr);

      // Validate page index
      if (pageIndex >= pages.length) {
        console.warn(`Page index ${pageIndex} out of bounds, skipping fields`);
        continue;
      }

      const page = pages[pageIndex];

      for (const field of pageFields) {
        try {
          const {
            name,
            x,
            y,
            width,
            height,
            type = 'text',
            defaultValue = '',
            readOnly = false,
            multiline = false,
            fontSize = 12,
            backgroundColor = [1, 1, 1],
            borderColor = [0.7, 0.7, 0.7],
            borderWidth = 1,
          } = field;

          let formField;

          switch (type.toLowerCase()) {
            case 'text':
              // Create text field
              formField = form.createTextField(name);
              formField.setText(defaultValue);
              formField.setFontSize(fontSize);

              if (multiline) {
                formField.enableMultiline();
              }

              if (readOnly) {
                formField.enableReadOnly();
              }

              // Add field to page
              formField.addToPage(page, {
                x,
                y,
                width,
                height,
                textColor: rgb(0, 0, 0),
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth,
              });
              break;

            case 'checkbox':
              // Create checkbox
              formField = form.createCheckBox(name);

              if (defaultValue === true || defaultValue === 'true') {
                formField.check();
              }

              if (readOnly) {
                formField.enableReadOnly();
              }

              formField.addToPage(page, {
                x,
                y,
                width: height || 12,
                height: height || 12,
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth,
              });
              break;

            case 'dropdown':
              // Create dropdown (requires options)
              const options = field.options || [];
              formField = form.createDropdown(name);
              formField.addOptions(options);

              if (defaultValue) {
                formField.select(defaultValue);
              }

              if (readOnly) {
                formField.enableReadOnly();
              }

              formField.addToPage(page, {
                x,
                y,
                width,
                height,
                textColor: rgb(0, 0, 0),
                backgroundColor: rgb(...backgroundColor),
                borderColor: rgb(...borderColor),
                borderWidth,
              });
              break;

            default:
              console.warn(`Unsupported field type: ${type}, defaulting to text`);
              formField = form.createTextField(name);
              formField.setText(defaultValue);
              formField.addToPage(page, { x, y, width, height });
          }

          console.log(`✅ Created ${type} field: ${name} on page ${pageIndex}`);
        } catch (fieldError) {
          console.error(`❌ Error creating field ${field.name}:`, fieldError);
        }
      }
    }

    // Save and return modified PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('❌ Error adding form fields to PDF:', error);
    throw new Error(`Failed to add form fields: ${error.message}`);
  }
}

/**
 * Convert Uint8Array PDF to File object
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @param {string} filename - Output filename
 * @returns {File} File object ready for upload
 */
export function pdfBytesToFile(pdfBytes, filename = 'modified.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * Create PDF blob URL for preview
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @returns {string} Blob URL for preview
 */
export function createPDFBlobURL(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

/**
 * Download PDF file
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @param {string} filename - Download filename
 */
export function downloadPDF(pdfBytes, filename = 'form.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Example field definitions for common templates
 * Customize these based on your actual template coordinates
 */
export const TEMPLATE_FIELD_DEFINITIONS = {
  // Example: Rice insurance policy template
  rice_policy: [
    { name: 'farmer_name', x: 150, y: 680, width: 200, height: 20 },
    { name: 'policy_number', x: 400, y: 680, width: 150, height: 20 },
    { name: 'farm_location', x: 150, y: 620, width: 300, height: 20 },
    { name: 'coverage_amount', x: 150, y: 560, width: 150, height: 20 },
    { name: 'start_date', x: 350, y: 560, width: 100, height: 20 },
    { name: 'end_date', x: 500, y: 560, width: 100, height: 20 },
  ],

  // Add more templates as needed
  // drought_policy: [...],
  // flood_policy: [...],
};
