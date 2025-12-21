/**
 * Dictionary Helper
 *
 * Provides utility functions to load and retrieve labels/translations
 * from the centralized dictionary.json file
 */

import dictionary from "./dictionary.json";
import { BASE_POLICY_UI_LABELS } from "./ui-lable/base-policy-lable";

/**
 * Get Vietnamese label for a field from a specific section
 * @param {string} section - Section name in dictionary (e.g., 'BasePolicy', 'PolicyStatus')
 * @param {string} field - Field name (e.g., 'product_name', 'active')
 * @returns {string} Vietnamese label or field name if not found
 */
export const getFieldLabel = (section, field) => {
  if (!section || !field) return field || "";

  const sectionData = dictionary[section];
  if (!sectionData || !sectionData[field]) {
    console.warn(`Dictionary: Label not found for ${section}.${field}`);
    return field;
  }

  return sectionData[field].tieng_viet || field;
};

/**
 * Get note/description for a field from a specific section
 * @param {string} section - Section name in dictionary
 * @param {string} field - Field name
 * @returns {string} Note text or empty string
 */
export const getFieldNote = (section, field) => {
  if (!section || !field) return "";

  const sectionData = dictionary[section];
  if (!sectionData || !sectionData[field]) {
    return "";
  }

  return sectionData[field].ghi_chu || "";
};

/**
 * Get both label and note for a field
 * @param {string} section - Section name in dictionary
 * @param {string} field - Field name
 * @returns {object} Object with tieng_viet and ghi_chu properties
 */
export const getFieldInfo = (section, field) => {
  if (!section || !field) return { tieng_viet: field, ghi_chu: "" };

  const sectionData = dictionary[section];
  if (!sectionData || !sectionData[field]) {
    console.warn(`Dictionary: Info not found for ${section}.${field}`);
    return { tieng_viet: field, ghi_chu: "" };
  }

  return {
    tieng_viet: sectionData[field].tieng_viet || field,
    ghi_chu: sectionData[field].ghi_chu || "",
  };
};

/**
 * Get all fields in a section
 * @param {string} section - Section name in dictionary
 * @returns {object} All fields in the section
 */
export const getSection = (section) => {
  if (!section) return {};

  const sectionData = dictionary[section];
  if (!sectionData) {
    console.warn(`Dictionary: Section not found - ${section}`);
    return {};
  }

  return sectionData;
};

/**
 * Get label for enum values (like status values)
 * @param {string} enumSection - Enum section name (e.g., 'BasePolicyStatus', 'PolicyStatus')
 * @param {string} value - Enum value (e.g., 'draft', 'active')
 * @returns {string} Vietnamese label for the enum value
 */
export const getEnumLabel = (enumSection, value) => {
  if (!enumSection || !value) return value || "";

  const enumData = dictionary[enumSection];
  if (!enumData || !enumData[value]) {
    console.warn(
      `Dictionary: Enum label not found for ${enumSection}.${value}`
    );
    return value;
  }

  return enumData[value].tieng_viet || value;
};

/**
 * Get all enum values as an array of options
 * @param {string} enumSection - Enum section name
 * @returns {Array} Array of {value, label, note} objects
 */
export const getEnumOptions = (enumSection) => {
  if (!enumSection) return [];

  const enumData = dictionary[enumSection];
  if (!enumData) {
    console.warn(`Dictionary: Enum section not found - ${enumSection}`);
    return [];
  }

  return Object.keys(enumData).map((key) => ({
    value: key,
    label: enumData[key].tieng_viet || key,
    note: enumData[key].ghi_chu || "",
  }));
};

/**
 * Get common term translation
 * @param {string} term - Common term key (e.g., 'Premium', 'Payout', 'Coverage')
 * @returns {string} Vietnamese translation
 */
export const getCommonTerm = (term) => {
  if (!term) return "";

  const commonData = dictionary["Common"];
  if (!commonData || !commonData[term]) {
    console.warn(`Dictionary: Common term not found - ${term}`);
    return term;
  }

  return commonData[term].tieng_viet || term;
};

/**
 * Get operator label (Threshold, Logical, Aggregation)
 * @param {string} operatorSection - Operator section ('ThresholdOperator', 'LogicalOperator', 'AggregationFunction')
 * @param {string} operator - Operator value
 * @returns {string} Vietnamese label
 */
export const getOperatorLabel = (operatorSection, operator) => {
  return getEnumLabel(operatorSection, operator);
};

/**
 * Create a label getter function for a specific section
 * Useful for creating section-specific helpers
 * @param {string} section - Section name
 * @returns {function} Function that takes field name and returns label
 */
export const createLabelGetter = (section) => {
  return (field) => getFieldLabel(section, field);
};

/**
 * Get UI-specific labels (for buttons, messages, etc.)
 * This is a helper to get common UI text patterns
 */
export const UI_LABELS = BASE_POLICY_UI_LABELS;

export default {
  getFieldLabel,
  getFieldNote,
  getFieldInfo,
  getSection,
  getEnumLabel,
  getEnumOptions,
  getCommonTerm,
  getOperatorLabel,
  createLabelGetter,
  UI_LABELS,
};
