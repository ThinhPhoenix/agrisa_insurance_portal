/**
 * PDF Template Field Definitions
 *
 * Define AcroForm field positions for static PDF templates
 * Coordinates use bottom-left origin (PDF standard)
 *
 * @module pdfTemplateFields
 */

/**
 * Field definition format:
 * {
 *   name: string,        // Field name (must match backend expectations)
 *   x: number,           // X coordinate from bottom-left
 *   y: number,           // Y coordinate from bottom-left
 *   width: number,       // Field width in points
 *   height: number,      // Field height in points
 *   page: number,        // Page index (0-based), default 0
 *   type: string,        // 'text', 'checkbox', 'dropdown'
 *   fontSize: number,    // Font size (default 12)
 *   defaultValue: string,// Default value
 *   readOnly: boolean,   // Whether field is read-only
 *   multiline: boolean,  // For text fields: allow multiline
 * }
 */

/**
 * Example: Rice Drought Insurance Policy Template
 *
 * Measurements based on A4 page (595 x 842 points)
 * Top margin: 50pt, Left margin: 50pt
 *
 * TODO: Replace these with actual measurements from your PDF template
 */
export const RICE_DROUGHT_TEMPLATE = {
  name: 'Rice Drought Insurance Policy',
  description: 'Standard template for rice drought coverage',
  pageSize: { width: 595, height: 842 }, // A4
  fields: [
    // Header Section
    {
      name: 'policy_number',
      x: 400,
      y: 792, // Top of page (842) - margin (50)
      width: 145,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'issue_date',
      x: 400,
      y: 762,
      width: 145,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },

    // Farmer Information
    {
      name: 'farmer_name',
      x: 150,
      y: 720,
      width: 395,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'farmer_id',
      x: 150,
      y: 690,
      width: 195,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'phone_number',
      x: 350,
      y: 690,
      width: 195,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },

    // Farm Information
    {
      name: 'farm_location',
      x: 150,
      y: 650,
      width: 395,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'farm_area',
      x: 150,
      y: 620,
      width: 145,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'crop_type',
      x: 350,
      y: 620,
      width: 195,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },

    // Coverage Details
    {
      name: 'coverage_amount',
      x: 150,
      y: 580,
      width: 195,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'premium_amount',
      x: 350,
      y: 580,
      width: 195,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },

    // Coverage Period
    {
      name: 'coverage_start_date',
      x: 150,
      y: 540,
      width: 145,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },
    {
      name: 'coverage_end_date',
      x: 350,
      y: 540,
      width: 145,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 12,
    },

    // Trigger Conditions (Summary)
    {
      name: 'trigger_description',
      x: 150,
      y: 480,
      width: 395,
      height: 60,
      page: 0,
      type: 'text',
      fontSize: 10,
      multiline: true,
    },

    // Signature Section
    {
      name: 'farmer_signature_date',
      x: 100,
      y: 100,
      width: 100,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 10,
    },
    {
      name: 'agent_signature_date',
      x: 400,
      y: 100,
      width: 100,
      height: 20,
      page: 0,
      type: 'text',
      fontSize: 10,
    },
  ],
};

/**
 * Example: Rice Flood Insurance Policy Template
 */
export const RICE_FLOOD_TEMPLATE = {
  name: 'Rice Flood Insurance Policy',
  description: 'Standard template for rice flood coverage',
  pageSize: { width: 595, height: 842 },
  fields: [
    // Similar structure to drought template
    // TODO: Add actual field definitions
  ],
};

/**
 * Template registry
 * Map template keys to field definitions
 */
export const POLICY_TEMPLATES = {
  rice_drought: RICE_DROUGHT_TEMPLATE,
  rice_flood: RICE_FLOOD_TEMPLATE,
  // Add more templates as needed
};

/**
 * Get field definitions for a template type
 * @param {string} templateType - Template key
 * @returns {Array|null} Field definitions or null if not found
 */
export function getTemplateFields(templateType) {
  const template = POLICY_TEMPLATES[templateType];
  return template ? template.fields : null;
}

/**
 * List all available templates
 * @returns {Array<{key: string, name: string, description: string}>}
 */
export function listTemplates() {
  return Object.entries(POLICY_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name,
    description: template.description,
  }));
}

/**
 * Backend field name mapping
 * Maps frontend field names to backend expected names (if different)
 *
 * IMPORTANT: Verify these match your backend's FillPDFTemplate function
 */
export const BACKEND_FIELD_MAPPING = {
  // Frontend → Backend
  farmer_name: 'farmer_name',
  farmer_id: 'farmer_id',
  phone_number: 'phone_number',
  farm_location: 'farm_location',
  farm_area: 'farm_area',
  crop_type: 'crop_type',
  coverage_amount: 'coverage_amount',
  premium_amount: 'premium_amount',
  coverage_start_date: 'coverage_start_date',
  coverage_end_date: 'coverage_end_date',
  policy_number: 'policy_number',
  issue_date: 'issue_date',
  trigger_description: 'trigger_description',
  farmer_signature_date: 'farmer_signature_date',
  agent_signature_date: 'agent_signature_date',
};

/**
 * Convert frontend field names to backend field names
 * @param {Object} data - Data with frontend field names
 * @returns {Object} Data with backend field names
 */
export function mapToBackendFieldNames(data) {
  const mapped = {};
  for (const [frontendName, value] of Object.entries(data)) {
    const backendName = BACKEND_FIELD_MAPPING[frontendName] || frontendName;
    mapped[backendName] = value;
  }
  return mapped;
}
