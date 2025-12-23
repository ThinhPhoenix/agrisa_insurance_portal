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
    //  This ensures PolicyTemplateSelector can update ConfigurationTab data
    const configDataRef = useRef(configurationData);
    useEffect(() => {
        const hasChanged = configDataRef.current !== configurationData;

        if (hasChanged && formRef.current) {
            // Update form fields with current configurationData
            formRef.current.setFieldsValue(configurationData);

            // Manually trigger onDataChange to ensure parent component updates
            onDataChange(configurationData);

            console.log(' ConfigurationTab synced with template data:', {
                conditionsCount: configurationData.conditions?.length || 0,
                logicalOperator: configurationData.logicalOperator,
                blackoutPeriodsCount: configurationData.blackoutPeriods?.periods?.length || 0
            });
        }

        configDataRef.current = configurationData;
    }, [configurationData, onDataChange]);

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
