/**
 * Utility functions to normalize risk analysis data from different API response formats
 * Handles multiple field name variations to ensure consistent UI rendering
 */

/**
 * Normalizes a single risk factor to a consistent format
 * @param {Object} factor - The risk factor object
 * @param {string} parentLevel - Fallback level from parent risk category
 * @returns {Object} Normalized factor with consistent field names
 */
export function normalizeFactor(factor, parentLevel = null) {
  if (!factor) return null;

  return {
    // Use 'description' or 'details' field
    description: factor.description || factor.details || "",

    // Use 'type' or 'name' field
    type: factor.type || factor.name || "unknown",

    // Use factor's level or fall back to parent level
    level: factor.level || parentLevel || "unknown",

    // Score should be consistent across both formats
    score: factor.score || 0,

    // Preserve original data for debugging
    _original: factor,
  };
}

/**
 * Normalizes a risk category (e.g., farm_characteristics_risk, fraud_risk)
 * @param {Object} riskData - The risk category object
 * @returns {Object} Normalized risk category
 */
export function normalizeRiskCategory(riskData) {
  if (!riskData) return null;

  const normalizedFactors = (riskData.factors || []).map((factor) =>
    normalizeFactor(factor, riskData.level)
  );

  return {
    factors: normalizedFactors,
    level: riskData.level || "unknown",
    score: riskData.score || 0,
    _original: riskData,
  };
}

/**
 * Normalizes the entire identified_risks object
 * @param {Object} identifiedRisks - The identified_risks object from API
 * @returns {Object} Normalized identified_risks with all categories
 */
export function normalizeIdentifiedRisks(identifiedRisks) {
  if (!identifiedRisks) return {};

  const normalized = {};

  Object.entries(identifiedRisks).forEach(([riskKey, riskData]) => {
    normalized[riskKey] = normalizeRiskCategory(riskData);
  });

  return normalized;
}

/**
 * Gets a human-readable description from a factor
 * @param {Object} factor - The risk factor
 * @returns {string} The description text
 */
export function getFactorDescription(factor) {
  return factor?.description || factor?.details || "No description available";
}

/**
 * Gets the risk type/name from a factor
 * @param {Object} factor - The risk factor
 * @returns {string} The risk type/name
 */
export function getFactorType(factor) {
  return factor?.type || factor?.name || "Unknown type";
}

/**
 * Gets the risk level from a factor with fallback
 * @param {Object} factor - The risk factor
 * @param {string} fallbackLevel - Fallback level if factor doesn't have one
 * @returns {string} The risk level
 */
export function getFactorLevel(factor, fallbackLevel = "unknown") {
  return factor?.level || fallbackLevel;
}

/**
 * Normalizes trigger simulation results to handle different formats
 * Handles both array format and object format (keyed by condition ID)
 * @param {Array|Object} triggerResults - Array of trigger simulation results or object keyed by condition
 * @returns {Array} Normalized trigger results
 */
export function normalizeTriggerSimulation(triggerResults) {
  if (!triggerResults) return [];

  // Handle object format: { "condition_xxx": {...}, "condition_yyy": {...} }
  if (!Array.isArray(triggerResults) && typeof triggerResults === "object") {
    return Object.entries(triggerResults).map(([conditionKey, trigger]) => ({
      condition_id: trigger.condition_id || conditionKey.replace(/^condition_/, "") || "",
      parameter_name: trigger.parameter_name || trigger.parameterName || "",
      historical_breaches: trigger.historical_breaches || trigger.historicalBreaches || 0,
      simulated_breaches: trigger.simulated_breaches || trigger.simulatedBreaches || trigger.simulated_breaches || 0,
      proximity_to_threshold: trigger.proximity_to_threshold || trigger.proximityToThreshold || "",
      analysis: trigger.analysis || trigger.reason || "",
      breach_dates: trigger.breach_dates || trigger.breachDates || [],
      risk_level: trigger.risk_level || trigger.riskLevel || trigger.risk_level || "",
      status: trigger.status || "completed",
      _original: trigger,
    }));
  }

  // Handle array format
  if (Array.isArray(triggerResults)) {
    return triggerResults.map((trigger) => ({
      condition_id: trigger.condition_id || trigger.conditionId || "",
      parameter_name: trigger.parameter_name || trigger.parameterName || "",
      historical_breaches: trigger.historical_breaches || trigger.historicalBreaches || 0,
      simulated_breaches: trigger.simulated_breaches || trigger.simulatedBreaches || 0,
      proximity_to_threshold: trigger.proximity_to_threshold || trigger.proximityToThreshold || "",
      analysis: trigger.analysis || trigger.reason || "",
      breach_dates: trigger.breach_dates || trigger.breachDates || [],
      risk_level: trigger.risk_level || trigger.riskLevel || "",
      status: trigger.status || "completed",
      _original: trigger,
    }));
  }

  return [];
}

/**
 * Normalizes fraud assessment details
 * @param {Object} fraudAssessment - Fraud assessment object
 * @returns {Object} Normalized fraud assessment
 */
export function normalizeFraudAssessment(fraudAssessment) {
  if (!fraudAssessment) return null;

  return {
    level: fraudAssessment.level || "unknown",
    score: fraudAssessment.score || 0,
    indicators_triggered: fraudAssessment.indicators_triggered ||
                         fraudAssessment.indicatorsTriggered ||
                         [],
    _original: fraudAssessment,
  };
}

/**
 * Risk title mapping for Vietnamese display
 */
export const RISK_TITLE_MAP = {
  farm_characteristics_risk: "Đặc điểm trang trại",
  fraud_risk: "Gian lận",
  historical_performance_risk: "Hiệu suất lịch sử",
  trigger_activation_risk: "Kích hoạt trigger",
};

/**
 * Gets Vietnamese title for risk category
 * @param {string} riskKey - The risk category key
 * @returns {string} Vietnamese title
 */
export function getRiskTitle(riskKey) {
  return RISK_TITLE_MAP[riskKey] || riskKey;
}
