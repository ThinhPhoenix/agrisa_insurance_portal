/**
 * Chart Helper Functions for TriggerLogicExplainer
 * Provides utility functions for visualizing condition zones and thresholds
 */

// Color constants matching globals.css pastel theme
export const ZONE_COLORS = {
    safe: '#a5d7be',      // --color-primary-300 (xanh lá pastel)
    warning: '#f9e8a5',   // --color-secondary-400 (vàng kem pastel)
    trigger: '#ffcdd2',   // hồng pastel nhẹ
    border: {
        safe: '#62b98c',      // --color-primary-400
        warning: '#c5ba89',   // --color-secondary-600
        trigger: '#ef9a9a',   // darker pink
    }
};

/**
 * Get color for a specific zone type
 * @param {string} zoneType - 'safe' | 'warning' | 'trigger'
 * @param {boolean} border - Return border color instead of fill
 * @returns {string} Hex color code
 */
export const getZoneColor = (zoneType, border = false) => {
    if (border) {
        return ZONE_COLORS.border[zoneType] || ZONE_COLORS.border.safe;
    }
    return ZONE_COLORS[zoneType] || ZONE_COLORS.safe;
};

/**
 * Convert operator symbol to Vietnamese text
 * @param {string} operator - Operator symbol (<, >, <=, >=, ==, !=, change_gt, change_lt)
 * @param {boolean} natural - Use natural language (true) or technical terms (false)
 * @returns {string} Vietnamese text
 */
export const operatorToVietnamese = (operator, natural = false) => {
    if (natural) {
        const naturalMapping = {
            '<': 'giảm xuống dưới',
            '>': 'vượt quá',
            '<=': 'không cao hơn',
            '>=': 'không thấp hơn',
            '==': 'đúng bằng',
            '!=': 'khác với',
            'change_gt': 'tăng lên hơn',
            'change_lt': 'giảm xuống hơn'
        };
        return naturalMapping[operator] || operator;
    } else {
        const mapping = {
            '<': 'nhỏ hơn',
            '>': 'lớn hơn',
            '<=': 'nhỏ hơn hoặc bằng',
            '>=': 'lớn hơn hoặc bằng',
            '==': 'bằng',
            '!=': 'khác',
            'change_gt': 'thay đổi tăng lớn hơn',
            'change_lt': 'thay đổi giảm nhỏ hơn'
        };
        return mapping[operator] || operator;
    }
};

/**
 * Convert aggregation function to Vietnamese text
 * @param {string} func - Aggregation function (sum, avg, min, max, change)
 * @param {boolean} natural - Use natural language
 * @returns {string} Vietnamese text
 */
export const aggregationToVietnamese = (func, natural = false) => {
    if (natural) {
        const naturalMapping = {
            'sum': 'tổng lượng',
            'avg': 'mức trung bình',
            'min': 'mức thấp nhất',
            'max': 'mức cao nhất',
            'change': 'biến đổi'
        };
        return naturalMapping[func] || func;
    } else {
        const mapping = {
            'sum': 'tổng',
            'avg': 'trung bình',
            'min': 'giá trị nhỏ nhất',
            'max': 'giá trị lớn nhất',
            'change': 'thay đổi'
        };
        return mapping[func] || func;
    }
};

/**
 * Calculate chart range and zones based on operator and threshold
 * @param {string} operator - Threshold operator
 * @param {number} thresholdValue - Threshold value
 * @param {number} earlyWarningThreshold - Early warning threshold (optional)
 * @returns {Object} { min, max, zones: [{ type, start, end, label }] }
 */
export const calculateChartRange = (operator, thresholdValue, earlyWarningThreshold = null) => {
    const threshold = Number(thresholdValue);
    const warning = earlyWarningThreshold ? Number(earlyWarningThreshold) : null;

    // Calculate a reasonable range around the threshold
    const margin = Math.abs(threshold) * 0.5 || 10; // 50% margin or default 10
    let min, max;
    let zones = [];

    switch (operator) {
        case '<': {
            // Safe zone: values >= threshold
            // Trigger zone: values < threshold
            min = threshold - margin;
            max = threshold + margin;

            if (warning !== null && warning < threshold) {
                // Warning zone exists between warning and threshold
                zones = [
                    { type: 'trigger', start: min, end: warning, label: 'Kích hoạt' },
                    { type: 'warning', start: warning, end: threshold, label: 'Cảnh báo' },
                    { type: 'safe', start: threshold, end: max, label: 'An toàn' }
                ];
            } else {
                zones = [
                    { type: 'trigger', start: min, end: threshold, label: 'Kích hoạt' },
                    { type: 'safe', start: threshold, end: max, label: 'An toàn' }
                ];
            }
            break;
        }

        case '<=': {
            // Similar to < but includes threshold in trigger zone
            min = threshold - margin;
            max = threshold + margin;

            if (warning !== null && warning < threshold) {
                zones = [
                    { type: 'trigger', start: min, end: warning, label: 'Kích hoạt' },
                    { type: 'warning', start: warning, end: threshold, label: 'Cảnh báo' },
                    { type: 'safe', start: threshold, end: max, label: 'An toàn' }
                ];
            } else {
                zones = [
                    { type: 'trigger', start: min, end: threshold, label: 'Kích hoạt' },
                    { type: 'safe', start: threshold, end: max, label: 'An toàn' }
                ];
            }
            break;
        }

        case '>': {
            // Safe zone: values <= threshold
            // Trigger zone: values > threshold
            min = threshold - margin;
            max = threshold + margin;

            if (warning !== null && warning > threshold) {
                // Warning zone exists between threshold and warning
                zones = [
                    { type: 'safe', start: min, end: threshold, label: 'An toàn' },
                    { type: 'warning', start: threshold, end: warning, label: 'Cảnh báo' },
                    { type: 'trigger', start: warning, end: max, label: 'Kích hoạt' }
                ];
            } else {
                zones = [
                    { type: 'safe', start: min, end: threshold, label: 'An toàn' },
                    { type: 'trigger', start: threshold, end: max, label: 'Kích hoạt' }
                ];
            }
            break;
        }

        case '>=': {
            // Similar to > but includes threshold in trigger zone
            min = threshold - margin;
            max = threshold + margin;

            if (warning !== null && warning > threshold) {
                zones = [
                    { type: 'safe', start: min, end: threshold, label: 'An toàn' },
                    { type: 'warning', start: threshold, end: warning, label: 'Cảnh báo' },
                    { type: 'trigger', start: warning, end: max, label: 'Kích hoạt' }
                ];
            } else {
                zones = [
                    { type: 'safe', start: min, end: threshold, label: 'An toàn' },
                    { type: 'trigger', start: threshold, end: max, label: 'Kích hoạt' }
                ];
            }
            break;
        }

        case '==': {
            // Only triggers when exactly equal
            min = threshold - margin;
            max = threshold + margin;
            const equalMargin = margin * 0.05; // Very small margin around exact value

            zones = [
                { type: 'safe', start: min, end: threshold - equalMargin, label: 'An toàn' },
                { type: 'trigger', start: threshold - equalMargin, end: threshold + equalMargin, label: 'Kích hoạt' },
                { type: 'safe', start: threshold + equalMargin, end: max, label: 'An toàn' }
            ];
            break;
        }

        case '!=': {
            // Triggers when not equal (everywhere except exact value)
            min = threshold - margin;
            max = threshold + margin;
            const notEqualMargin = margin * 0.05;

            zones = [
                { type: 'trigger', start: min, end: threshold - notEqualMargin, label: 'Kích hoạt' },
                { type: 'safe', start: threshold - notEqualMargin, end: threshold + notEqualMargin, label: 'An toàn' },
                { type: 'trigger', start: threshold + notEqualMargin, end: max, label: 'Kích hoạt' }
            ];
            break;
        }

        case 'change_gt':
        case 'change_lt': {
            // Change operators work similar to > and <
            min = threshold - margin;
            max = threshold + margin;

            if (operator === 'change_gt') {
                // Trigger when change > threshold
                if (warning !== null && warning > threshold) {
                    zones = [
                        { type: 'safe', start: min, end: threshold, label: 'An toàn' },
                        { type: 'warning', start: threshold, end: warning, label: 'Cảnh báo' },
                        { type: 'trigger', start: warning, end: max, label: 'Kích hoạt' }
                    ];
                } else {
                    zones = [
                        { type: 'safe', start: min, end: threshold, label: 'An toàn' },
                        { type: 'trigger', start: threshold, end: max, label: 'Kích hoạt' }
                    ];
                }
            } else {
                // change_lt: Trigger when change < threshold
                if (warning !== null && warning < threshold) {
                    zones = [
                        { type: 'trigger', start: min, end: warning, label: 'Kích hoạt' },
                        { type: 'warning', start: warning, end: threshold, label: 'Cảnh báo' },
                        { type: 'safe', start: threshold, end: max, label: 'An toàn' }
                    ];
                } else {
                    zones = [
                        { type: 'trigger', start: min, end: threshold, label: 'Kích hoạt' },
                        { type: 'safe', start: threshold, end: max, label: 'An toàn' }
                    ];
                }
            }
            break;
        }

        default: {
            // Default fallback
            min = threshold - margin;
            max = threshold + margin;
            zones = [
                { type: 'safe', start: min, end: max, label: 'An toàn' }
            ];
        }
    }

    return { min, max, zones };
};

/**
 * Generate Chart.js compatible data for zone visualization
 * @param {Object} condition - Condition object
 * @returns {Object} Chart.js data object
 */
export const generateZoneChartData = (condition) => {
    const {
        thresholdOperator,
        thresholdValue,
        earlyWarningThreshold,
        unit = ''
    } = condition;

    const { min, max, zones } = calculateChartRange(
        thresholdOperator,
        thresholdValue,
        earlyWarningThreshold
    );

    // Create datasets for each zone
    const datasets = zones.map(zone => ({
        label: zone.label,
        data: [{ x: [zone.start, zone.end], y: 0 }],
        backgroundColor: getZoneColor(zone.type),
        borderColor: getZoneColor(zone.type, true),
        borderWidth: 1,
        barThickness: 40,
        categoryPercentage: 1.0,
        barPercentage: 1.0
    }));

    return {
        labels: [''],
        datasets,
        min,
        max,
        thresholdValue,
        earlyWarningThreshold,
        unit
    };
};

/**
 * Generate natural Vietnamese tooltip text for a zone
 * @param {string} zone - Zone type ('safe', 'warning', 'trigger')
 * @param {Object} condition - Condition object
 * @returns {string} Human-readable tooltip text
 */
export const generateTooltipText = (zone, condition) => {
    const {
        parameterName = 'Tham số',
        thresholdOperator,
        thresholdValue,
        earlyWarningThreshold,
        unit = '',
        aggregationFunction,
        aggregationWindowDays
    } = condition;

    const opText = operatorToVietnamese(thresholdOperator, true);
    const aggText = aggregationToVietnamese(aggregationFunction, true);
    const unitStr = unit ? ` ${unit}` : '';

    switch (zone) {
        case 'safe':
            if (thresholdOperator === '<' || thresholdOperator === '<=') {
                return `Vùng an toàn: ${parameterName} ${aggText} từ ${thresholdValue}${unitStr} trở lên trong ${aggregationWindowDays} ngày sẽ không kích hoạt bảo hiểm.`;
            } else if (thresholdOperator === '>' || thresholdOperator === '>=') {
                return `Vùng an toàn: ${parameterName} ${aggText} dưới ${thresholdValue}${unitStr} trong ${aggregationWindowDays} ngày sẽ không kích hoạt bảo hiểm.`;
            } else if (thresholdOperator === '==') {
                return `Vùng an toàn: ${parameterName} ${aggText} khác ${thresholdValue}${unitStr} sẽ không kích hoạt bảo hiểm.`;
            } else if (thresholdOperator === '!=') {
                return `Vùng an toàn: ${parameterName} ${aggText} đúng bằng ${thresholdValue}${unitStr} sẽ không kích hoạt bảo hiểm.`;
            }
            return `Vùng an toàn: Không kích hoạt bảo hiểm`;

        case 'warning':
            if (earlyWarningThreshold) {
                return `Vùng cảnh báo sớm: ${parameterName} ${aggText} đạt ${earlyWarningThreshold}${unitStr}. Hệ thống sẽ cảnh báo nhưng chưa kích hoạt thanh toán.`;
            }
            return `Vùng cảnh báo`;

        case 'trigger':
            return `Vùng kích hoạt: Khi ${parameterName} ${aggText} ${opText} ${thresholdValue}${unitStr} trong ${aggregationWindowDays} ngày, hệ thống sẽ kích hoạt thanh toán bảo hiểm.`;

        default:
            return zone;
    }
};

/**
 * Get display name for parameter (prefer label over technical name)
 * @param {string} parameterName - Technical parameter name
 * @param {string} dataSourceLabel - Human-readable label
 * @returns {string} Display name
 */
export const getDisplayName = (parameterName, dataSourceLabel) => {
    // If dataSourceLabel exists and is more descriptive, use it
    if (dataSourceLabel && dataSourceLabel !== 'Nguồn dữ liệu') {
        // If parameterName is just a code (like 'ndmi', 'ndvi'), show label with code in parentheses
        if (parameterName && parameterName.length <= 4) {
            return `${dataSourceLabel} (${parameterName.toUpperCase()})`;
        }
        return dataSourceLabel;
    }
    return parameterName || dataSourceLabel || 'Tham số';
};

/**
 * Build natural sentence for condition explanation
 * @param {Object} condition - Condition object
 * @returns {string} Natural Vietnamese sentence
 */
export const buildNaturalSentence = (condition) => {
    const {
        dataSourceLabel = 'Nguồn dữ liệu',
        parameterName = '',
        aggregationFunction,
        aggregationWindowDays,
        thresholdOperator,
        thresholdValue,
        unit = '',
        baselineWindowDays,
        baselineFunction
    } = condition;

    const sourceName = getDisplayName(parameterName, dataSourceLabel);
    const aggText = aggregationToVietnamese(aggregationFunction, true);
    const opText = operatorToVietnamese(thresholdOperator, true);
    const unitStr = unit ? ` ${unit}` : '';

    let sentence = `Khi **${aggText} ${sourceName}** trong **${aggregationWindowDays} ngày liên tiếp** `;
    sentence += `${opText} **${thresholdValue}${unitStr}**`;

    // Add baseline info for change operators
    if ((thresholdOperator === 'change_gt' || thresholdOperator === 'change_lt') && baselineWindowDays && baselineFunction) {
        const baselineText = aggregationToVietnamese(baselineFunction, true);
        sentence += ` so với ${baselineText} ${baselineWindowDays} ngày trước`;
    }

    sentence += `, hệ thống sẽ **kích hoạt thanh toán bảo hiểm**.`;

    return sentence;
};
