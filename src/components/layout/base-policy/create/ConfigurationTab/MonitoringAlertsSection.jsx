import CustomForm from '@/components/custom-form';
import { getTriggerValidation } from '@/libs/message';
import useDictionary from '@/services/hooks/common/use-dictionary';
import { Typography, Tooltip } from 'antd';
import { memo, useRef } from 'react';

const { Text: TypographyText } = Typography;

const MonitoringAlertsSection = memo(({ configurationData, onDataChange }) => {
    const formRef = useRef();
    const dict = useDictionary();

    // Helper function to render select option with tooltip
    const renderOptionWithTooltip = (option, tooltipContent) => {
        return (
            <Tooltip
                title={tooltipContent}
                placement="right"
                mouseEnterDelay={0.3}
            >
                <div style={{ maxWidth: '280px', cursor: 'pointer' }} className="option-hover-item">
                    <TypographyText style={{
                        fontSize: '13px',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {option.label}
                    </TypographyText>
                    {option.description && (
                        <TypographyText type="secondary" style={{
                            fontSize: '11px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {option.description}
                        </TypographyText>
                    )}
                </div>
            </Tooltip>
        );
    };

    // Generate monitoring fields
    const getMonitoringFields = () => [
        {
            name: 'monitorInterval',
            label: 'Tần suất giám sát',
            type: 'number',
            required: true,
            gridColumn: '1',
            min: 1,
            placeholder: '1',
            size: 'large',
            tooltip: 'Số lần kiểm tra (VD: 1 ngày = kiểm tra mỗi ngày)',
            rules: [
                { required: true, message: getTriggerValidation('MONITOR_INTERVAL_REQUIRED') },
                { type: 'number', min: 1, message: getTriggerValidation('MONITOR_INTERVAL_MIN') }
            ]
        },
        {
            name: 'monitorFrequencyUnit',
            label: 'Đơn vị tần suất',
            type: 'select',
            required: true,
            gridColumn: '2',
            placeholder: 'Chọn đơn vị',
            size: 'large',
            optionLabelProp: 'label',
            dropdownStyle: { maxWidth: '300px' },
            tooltip: 'Đơn vị thời gian (giờ, ngày, tuần, tháng, năm)',
            options: [
                { value: 'hour', label: 'giờ', description: 'Giám sát theo giờ' },
                { value: 'day', label: 'ngày', description: 'Giám sát theo ngày' },
                { value: 'week', label: 'tuần', description: 'Giám sát theo tuần' },
                { value: 'month', label: 'tháng', description: 'Giám sát theo tháng' },
                { value: 'year', label: 'năm', description: 'Giám sát theo năm' }
            ],
            renderOption: (option) => renderOptionWithTooltip(option, null),
            rules: [
                { required: true, message: getTriggerValidation('MONITOR_FREQUENCY_UNIT_REQUIRED') }
            ]
        }
    ];

    return (
        <CustomForm
            ref={formRef}
            fields={getMonitoringFields()}
            initialValues={configurationData}
            onValuesChange={onDataChange}
            gridColumns="repeat(2, 1fr)"
            gap="24px"
        />
    );
});

MonitoringAlertsSection.displayName = 'MonitoringAlertsSection';

export default MonitoringAlertsSection;
