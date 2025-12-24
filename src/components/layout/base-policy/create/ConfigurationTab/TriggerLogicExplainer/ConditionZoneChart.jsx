import { Tooltip, Typography } from 'antd';
import { memo, useMemo } from 'react';
import {
    calculateChartRange,
    generateTooltipText,
    getDisplayName,
    getZoneColor
} from './chartHelpers';

const { Text } = Typography;

/**
 * ConditionZoneChart - Simple visual bar showing safe/warning/trigger zones
 * Redesigned for clarity and simplicity
 */
const ConditionZoneChartComponent = ({
    condition,
    showTitle = false,
    height = 80,
    compactMode = false
}) => {
    const {
        thresholdOperator,
        thresholdValue,
        earlyWarningThreshold,
        unit = '',
        parameterName = 'Tham số',
        dataSourceLabel = 'Nguồn dữ liệu'
    } = condition;

    // Calculate zones and range
    const { min, max, zones } = useMemo(() => {
        return calculateChartRange(
            thresholdOperator,
            thresholdValue,
            earlyWarningThreshold
        );
    }, [thresholdOperator, thresholdValue, earlyWarningThreshold]);

    const totalRange = max - min;
    const displayName = getDisplayName(parameterName, dataSourceLabel);

    return (
        <div style={{
            width: '100%',
            padding: compactMode ? '8px' : '12px',
            paddingTop: compactMode ? '8px' : '32px',
            paddingBottom: compactMode ? '8px' : '32px',
            backgroundColor: '#fafafa',
            borderRadius: '6px',
            border: '1px solid #e8e8e8'
        }}>
            {showTitle && (
                <Text strong style={{ display: 'block', marginBottom: 8, color: '#18573f' }}>
                    {displayName} - Vùng Kích Hoạt
                </Text>
            )}

            {/* Visual zone bar */}
            <div style={{
                position: 'relative',
                height: height,
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                overflow: 'visible',
                display: 'flex'
            }}>
                {zones.map((zone, idx) => {
                    const zoneWidth = ((zone.end - zone.start) / totalRange) * 100;
                    return (
                        <Tooltip
                            key={idx}
                            title={
                                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                                    {generateTooltipText(zone.type, condition)}
                                </div>
                            }
                            placement="top"
                        >
                            <div
                                style={{
                                    width: `${zoneWidth}%`,
                                    height: '100%',
                                    backgroundColor: getZoneColor(zone.type),
                                    borderRight: idx < zones.length - 1 ? '2px solid #fff' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'help',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                                className="zone-segment"
                            >
                                {!compactMode && zoneWidth > 12 && (
                                    <>
                                        <Text
                                            strong
                                            style={{
                                                fontSize: 11,
                                                color: zone.type === 'trigger' ? '#fff' : '#18573f',
                                                textShadow: zone.type === 'trigger' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                                                marginBottom: 2
                                            }}
                                        >
                                            {zone.label}
                                        </Text>
                                        {zoneWidth > 18 && (
                                            <Text
                                                style={{
                                                    fontSize: 9,
                                                    color: zone.type === 'trigger' ? 'rgba(255,255,255,0.8)' : '#8c8c8c',
                                                    textShadow: zone.type === 'trigger' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                                }}
                                            >
                                                {zone.start === zone.end
                                                    ? `${zone.start.toFixed(2)}${unit}`
                                                    : `${zone.start.toFixed(2)} - ${zone.end.toFixed(2)}${unit}`
                                                }
                                            </Text>
                                        )}
                                    </>
                                )}
                            </div>
                        </Tooltip>
                    );
                })}

                {/* Threshold marker (main trigger line) */}
                <div
                    style={{
                        position: 'absolute',
                        top: -5,
                        bottom: -5,
                        left: `${((thresholdValue - min) / totalRange) * 100}%`,
                        width: '3px',
                        backgroundColor: '#ff4d4f',
                        zIndex: 10,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '16px',
                        height: '16px',
                        backgroundColor: '#ff4d4f',
                        borderRadius: '50%',
                        border: '3px solid #fff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }} />
                    {!compactMode && (
                        <div style={{
                            position: 'absolute',
                            top: '-24px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#ff4d4f',
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            border: '1px solid #ff4d4f',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            Ngưỡng: {thresholdValue}{unit}
                        </div>
                    )}
                </div>

                {/* Early warning marker */}
                {earlyWarningThreshold !== null && earlyWarningThreshold !== undefined && (
                    <div
                        style={{
                            position: 'absolute',
                            top: -5,
                            bottom: -5,
                            left: `${((earlyWarningThreshold - min) / totalRange) * 100}%`,
                            width: '2px',
                            backgroundColor: '#faad14',
                            zIndex: 9,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '14px',
                            height: '14px',
                            backgroundColor: '#faad14',
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                        {!compactMode && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                whiteSpace: 'nowrap',
                                fontSize: 10,
                                fontWeight: 'bold',
                                color: '#faad14',
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                border: '1px solid #faad14',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                Cảnh báo: {earlyWarningThreshold}{unit}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            {!compactMode && (
                <div style={{
                    display: 'flex',
                    gap: 16,
                    justifyContent: 'center',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid #f0f0f0'
                }}>
                    {zones.map((zone, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 12,
                                height: 12,
                                backgroundColor: getZoneColor(zone.type),
                                borderRadius: 2,
                                border: '1px solid #d9d9d9'
                            }} />
                            <Text style={{ fontSize: 11, color: '#595959' }}>
                                {zone.label}
                            </Text>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .zone-segment:hover {
                    opacity: 0.85;
                    transform: scaleY(1.05);
                }
            `}</style>
        </div>
    );
};

const ConditionZoneChart = memo(ConditionZoneChartComponent);
ConditionZoneChart.displayName = 'ConditionZoneChart';

export default ConditionZoneChart;
