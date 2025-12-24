import TriggerLogicExplainer from '@/components/layout/base-policy/create/ConfigurationTab/TriggerLogicExplainer/TriggerLogicExplainer';
import useDictionary from '@/services/hooks/common/use-dictionary';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Card, Form } from 'antd';
import { memo, useMemo, useRef, useState } from 'react';
import ConditionForm from './ConditionForm';
import ConditionsTable from './ConditionsTable';

const TriggerConditionsSection = memo(({
    configurationData,
    mockData,
    onDataChange,
    onAddTriggerCondition,
    onRemoveTriggerCondition,
    onUpdateTriggerCondition,
    getAvailableDataSourcesForTrigger
}) => {
    const [conditionForm] = Form.useForm();
    const conditionFormRef = useRef();
    const [editingCondition, setEditingCondition] = useState(null);
    const [selectedDataSourceForForm, setSelectedDataSourceForForm] = useState(null);
    const [selectedThresholdOperator, setSelectedThresholdOperator] = useState(null);
    const dict = useDictionary();

    const availableDataSources = getAvailableDataSourcesForTrigger();

    // Compute which threshold operators are already used for each dataSourceId
    const usedOperatorsBySource = useMemo(() => {
        const map = {};
        (configurationData.conditions || []).forEach((c) => {
            // when editing a condition, do not count its current operator
            if (editingCondition && c.id === editingCondition.id) return;
            const ds = c.dataSourceId;
            if (!ds) return;
            if (!map[ds]) map[ds] = new Set();
            if (c.thresholdOperator) map[ds].add(c.thresholdOperator);
        });
        return map;
    }, [configurationData.conditions, editingCondition]);

    // Handle edit condition
    const handleEditCondition = (condition) => {
        setEditingCondition(condition);
        setSelectedThresholdOperator(condition.thresholdOperator);
        setSelectedDataSourceForForm(condition.dataSourceId);
        conditionForm.setFieldsValue(condition);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingCondition(null);
        setSelectedThresholdOperator(null);
        conditionForm.resetFields();
    };

    // Handle save condition
    const handleSaveCondition = (condition, editingCondition) => {
        if (editingCondition) {
            onUpdateTriggerCondition(editingCondition.id, condition);
            setEditingCondition(null);
        } else {
            onAddTriggerCondition(condition);
        }

        setSelectedThresholdOperator(null);
        conditionFormRef.current?.resetFields();
    };

    // Handle drag end - Reorder conditions and update conditionOrder
    const handleDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (sourceIndex === destIndex) {
            return;
        }

        // Reorder array
        const newConditions = Array.from(configurationData.conditions);
        const [removed] = newConditions.splice(sourceIndex, 1);
        newConditions.splice(destIndex, 0, removed);

        // Update conditionOrder for all conditions based on new position
        const updatedConditions = newConditions.map((condition, index) => ({
            ...condition,
            conditionOrder: index + 1
        }));

        // Update parent state
        onDataChange({
            ...configurationData,
            conditions: updatedConditions
        });
    };

    return (
        <>
            {/* Add/Edit Condition Form */}
            <Card className="condition-form-card" style={{ marginBottom: 16 }}>
                <ConditionForm
                    availableDataSources={availableDataSources}
                    mockData={mockData}
                    configurationData={configurationData}
                    editingCondition={editingCondition}
                    conditionForm={conditionForm}
                    selectedThresholdOperator={selectedThresholdOperator}
                    onSave={handleSaveCondition}
                    onCancel={handleCancelEdit}
                    onOperatorChange={setSelectedThresholdOperator}
                />
            </Card>

            {/* Conditions Table */}
            {configurationData.conditions?.length === 0 ? (
                <Alert
                    message="Chưa có điều kiện nào được tạo"
                    description="Vui lòng thêm ít nhất một điều kiện kích hoạt để tiếp tục"
                    type="info"
                    icon={<InfoCircleOutlined />}
                    className="no-conditions-alert"
                />
            ) : (
                <ConditionsTable
                    conditions={configurationData.conditions}
                    onEdit={handleEditCondition}
                    onDelete={onRemoveTriggerCondition}
                    onDragEnd={handleDragEnd}
                />
            )}

            {/* Logic Explainer - Diễn giải logic trigger thành câu văn dễ hiểu */}
            <div style={{ marginTop: 16 }}>
                <TriggerLogicExplainer
                    configurationData={configurationData}
                    mockData={mockData}
                />
            </div>
        </>
    );
});

TriggerConditionsSection.displayName = 'TriggerConditionsSection';

export default TriggerConditionsSection;
