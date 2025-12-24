import useDictionary from '@/services/hooks/common/use-dictionary';
import { AlertOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Collapse, Space, Tag } from 'antd';
import { memo, useEffect, useRef } from 'react';
import BlackoutPeriodsSection from './BlackoutPeriodsSection';
import MonitoringAlertsSection from './MonitoringAlertsSection';
import TriggerConditionsSection from './TriggerConditionsSection';
import TriggerConfigSection from './TriggerConfigSection';

const { Panel } = Collapse;

//  OPTIMIZATION: Memoize ConfigurationTab to prevent unnecessary re-renders
const ConfigurationTabComponent = ({
    configurationData,
    mockData,
    basicData,
    onDataChange,
    onAddTriggerCondition,
    onRemoveTriggerCondition,
    onUpdateTriggerCondition,
    onAddBlackoutPeriod,
    onRemoveBlackoutPeriod,
    onUpdateBlackoutPeriod,
    getAvailableDataSourcesForTrigger
}) => {
    const formRef = useRef();
    const dict = useDictionary();

    //  ⚠️ CRITICAL: Sync form with configurationData when it changes (e.g., when template is applied)
    //  Use deep comparison to prevent infinite loop from reference changes
    const configDataRef = useRef(configurationData);
    const syncTimeoutRef = useRef(null);
    useEffect(() => {
        // Deep comparison: check if content actually changed
        const hasContentChanged = JSON.stringify(configDataRef.current) !== JSON.stringify(configurationData);

        if (hasContentChanged && formRef.current) {
            // Clear any pending sync
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }

            // Debounce sync to prevent rapid updates
            syncTimeoutRef.current = setTimeout(() => {
                // Update form fields with current configurationData
                formRef.current.setFieldsValue(configurationData);

                console.log('✅ ConfigurationTab synced with template data:', {
                    conditionsCount: configurationData.conditions?.length || 0,
                    logicalOperator: configurationData.logicalOperator,
                    blackoutPeriodsCount: configurationData.blackoutPeriods?.periods?.length || 0
                });

                // Update ref to new data
                configDataRef.current = configurationData;
            }, 100);
        }

        // Cleanup
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [configurationData]);

    return (
        <div className="configuration-tab">
            <Collapse defaultActiveKey={['monitoring']} size="large">
                {/* Monitoring & Alerts */}
                <Panel
                    header={
                        <Space>
                            <AlertOutlined />
                            <span>{dict.ui.sectionMonitoringAlerts}</span>
                        </Space>
                    }
                    key="monitoring"
                >
                    <MonitoringAlertsSection
                        configurationData={configurationData}
                        onDataChange={onDataChange}
                    />
                </Panel>

                {/* Trigger Configuration */}
                <Panel
                    header={
                        <Space>
                            <SettingOutlined />
                            <span>{dict.ui.sectionTriggerConfig}</span>
                        </Space>
                    }
                    key="trigger-config"
                >
                    <TriggerConfigSection
                        configurationData={configurationData}
                        onDataChange={onDataChange}
                        formRef={formRef}
                    />
                </Panel>

                {/* Blackout Periods Section */}
                <Panel
                    header={
                        <Space>
                            <AlertOutlined />
                            <span>Giai đoạn Không Kích hoạt</span>
                            <Tag color={configurationData.blackoutPeriods?.periods?.length > 0 ? 'purple' : 'default'}>
                                {configurationData.blackoutPeriods?.periods?.length || 0} giai đoạn
                            </Tag>
                            {(!basicData?.insuranceValidFrom || !basicData?.insuranceValidTo) && (
                                <Tag color="orange">Cần nhập thời gian hiệu lực trước</Tag>
                            )}
                        </Space>
                    }
                    key="blackoutPeriods"
                >
                    <BlackoutPeriodsSection
                        configurationData={configurationData}
                        basicData={basicData}
                        onAddBlackoutPeriod={onAddBlackoutPeriod}
                        onRemoveBlackoutPeriod={onRemoveBlackoutPeriod}
                    />
                </Panel>

                {/* Trigger Conditions */}
                <Panel
                    header={
                        <Space>
                            <ClockCircleOutlined />
                            <span>{dict.ui.sectionTriggerConditions}</span>
                            <Tag color={configurationData.conditions?.length > 0 ? 'green' : 'orange'}>
                                {configurationData.conditions?.length || 0} điều kiện
                            </Tag>
                        </Space>
                    }
                    key="conditions"
                >
                    <TriggerConditionsSection
                        configurationData={configurationData}
                        mockData={mockData}
                        onDataChange={onDataChange}
                        onAddTriggerCondition={onAddTriggerCondition}
                        onRemoveTriggerCondition={onRemoveTriggerCondition}
                        onUpdateTriggerCondition={onUpdateTriggerCondition}
                        getAvailableDataSourcesForTrigger={getAvailableDataSourcesForTrigger}
                    />
                </Panel>
            </Collapse>
        </div>
    );
};

const ConfigurationTab = memo(ConfigurationTabComponent);
ConfigurationTab.displayName = 'ConfigurationTab';

export default ConfigurationTab;
