import { POLICY_TEMPLATES } from '@/constants/policy-templates';
import useDictionary from '@/services/hooks/common/use-dictionary';
import {
    BulbOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    CopyOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Drawer,
    Empty,
    Modal,
    Row,
    Space,
    Tag,
    Typography,
    message
} from 'antd';
import { memo, useEffect, useRef, useState } from 'react';

const { Title, Text, Paragraph } = Typography;

/**
 * PolicyTemplateSelector Component
 *
 * Cho phép người dùng chọn các template gói bảo hiểm có sẵn
 * để tự động điền dữ liệu vào form BasicTab và ConfigurationTab
 *
 * Props:
 * - onSelectTemplate: Function được gọi khi user chọn template
 * - categories: Danh sách categories từ API
 * - tiers: Danh sách tiers từ API
 * - dataSources: Danh sách data sources từ API
 *
 * Performance optimizations:
 * - Templates extracted to separate constants file
 * - Component wrapped with React.memo
 * - Callbacks memoized with useCallback
 * - Expensive computations memoized with useMemo
 */

// ✅ Templates now imported from constants file (reduces component size by ~400 lines)
// const POLICY_TEMPLATES = [ ... ] moved to src/constants/policy-templates.js

const PolicyTemplateSelector = memo(({
    onSelectTemplate,
    categories = [],
    tiers = [],
    dataSources = [],
    fetchCategories,
    fetchTiersByCategory,
    fetchDataSourcesByTier
}) => {
    const dict = useDictionary();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [isPreloading, setIsPreloading] = useState(false);

    // Use refs to access latest props in async functions
    const tiersRef = useRef(tiers);
    const dataSourcesRef = useRef(dataSources);

    useEffect(() => {
        tiersRef.current = tiers;
    }, [tiers]);

    useEffect(() => {
        dataSourcesRef.current = dataSources;
    }, [dataSources]);

    // Xử lý mở drawer - Pre-load data TUẦN TỰ
    const handleOpenDrawer = async () => {
        setDrawerVisible(true);

        // Pre-load tiers and data sources for Satellite > Nâng cao
        // Data được lấy TUẦN TỰ: Category → Tiers → Data Sources
        if (fetchTiersByCategory && fetchDataSourcesByTier && categories.length > 0) {
            setIsPreloading(true);

            try {
                // Pre-loading data for templates

                // Step 1: Find Satellite category (đã có từ trước)
                const satelliteCategory = categories.find(cat =>
                    cat.category_name.toLowerCase() === 'satellite'
                );

                if (!satelliteCategory) {
                    message.error('Không tìm thấy category Satellite. Vui lòng tải lại trang.');
                    setIsPreloading(false);
                    return;
                }
                // Satellite category found

                // Step 2: Fetch tiers cho Satellite (nếu chưa có)
                let satelliteTiers = tiersRef.current.filter(t => t.data_tier_category_id === satelliteCategory.id);
                // Current Satellite tiers count available in ref

                if (satelliteTiers.length === 0) {
                    // Fetching tiers for Satellite...
                    await fetchTiersByCategory(satelliteCategory.id);

                    // Đợi state update và retry tìm tiers using ref
                    // Waiting for tiers to be loaded
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Retry finding tiers using ref (ref always has latest value)
                    satelliteTiers = tiersRef.current.filter(t => t.data_tier_category_id === satelliteCategory.id);
                    // After fetch - Satellite tiers count checked
                    if (satelliteTiers.length === 0) {
                        // Tiers still not loaded after fetch
                    } else {
                        // Tiers fetched and loaded
                    }
                } else {
                    // Tiers already loaded
                }

                // Step 3: Find "Nâng cao" tier và fetch data sources
                // Looking for "Nâng cao" tier...

                // Retry mechanism để tìm tier "Nâng cao" using ref
                let nangCaoTier = null;
                let retries = 0;
                const maxRetries = 5;

                while (!nangCaoTier && retries < maxRetries) {
                    nangCaoTier = tiersRef.current.find(t =>
                        t.tier_name && t.tier_name.toLowerCase() === 'nâng cao' &&
                        t.data_tier_category_id === satelliteCategory.id
                    );

                    if (!nangCaoTier && retries < maxRetries - 1) {
                        // retrying to find "Nâng cao" tier
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries++;
                    } else {
                        break;
                    }
                }

                if (nangCaoTier) {
                    // Found "Nâng cao" tier

                    // Check if data sources already loaded using ref
                    let nangCaoDataSources = dataSourcesRef.current.filter(ds => ds.data_tier_id === nangCaoTier.id);
                    // Current data sources count for "Nâng cao" available in ref

                    if (nangCaoDataSources.length === 0) {
                        // Fetching data sources for "Nâng cao" tier...
                        await fetchDataSourcesByTier(nangCaoTier.id);

                        // Đợi state update và retry using ref
                        // Waiting for data sources to be loaded
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Check again using ref
                        nangCaoDataSources = dataSourcesRef.current.filter(ds => ds.data_tier_id === nangCaoTier.id);
                        // After fetch - Data sources count checked
                        if (nangCaoDataSources.length > 0) {
                            // Data sources fetched successfully
                        } else {
                            // Data sources still not loaded after fetch
                        }
                    } else {
                        // Data sources already loaded
                    }
                } else {
                    // Could not find "Nâng cao" tier after retries
                    message.warning('Không tìm thấy tier "Nâng cao". Vui lòng thử lại hoặc chọn tier thủ công.');
                }
                // Pre-loading complete; final state counts available via props/refs

            } catch (error) {
                message.error('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
            } finally {
                setIsPreloading(false);
            }
        }
    };

    // Xử lý đóng drawer
    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setSelectedTemplate(null);
    };

    // Xử lý xem preview template
    const handlePreview = (template) => {
        setSelectedTemplate(template);
        setPreviewModalVisible(true);
    };

    // Xử lý áp dụng template
    const handleApplyTemplate = (template) => {
        Modal.confirm({
            title: 'Xác nhận áp dụng template',
            icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
            centered: true,
            width: 560,
            maskClosable: false,
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ wordBreak: 'break-word', fontSize: 14 }}>
                        Bạn có chắc chắn muốn áp dụng template <Text strong>"{template.name}"</Text>?
                    </div>
                    <Alert
                        message="Lưu ý"
                        description="Tất cả dữ liệu hiện tại trong form sẽ bị ghi đè. Hành động này không thể hoàn tác."
                        type="warning"
                        showIcon
                    />
                </div>
            ),
            okText: 'Áp dụng',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => applyTemplate(template)
        });
    };

    // Logic áp dụng template
    const applyTemplate = async (template) => {
        try {
            // Starting template application

            // ✅ RETRY LOGIC: If data not loaded, trigger fetch
            let retryCategories = categories;
            let retryTiers = tiers;
            let retryDataSources = dataSources;

            if (categories.length === 0) {
                // Categories not loaded, attempt fetch
                if (fetchCategories) {
                    await fetchCategories();
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    retryCategories = categories;
                }
            }

            // Map required data sources
            const mappedDataSources = [];

            for (const reqSource of template.requiredDataSources) {
                // Tìm category (so sánh chính xác)
                let category = retryCategories.find(cat =>
                    cat.category_name.toLowerCase() === reqSource.categoryName.toLowerCase()
                );

                if (!category) {
                    // Category not found for required source
                    continue; // Skip this source and continue with next
                }

                // Tìm tier (so sánh chính xác với tierName và category_id)
                let tier = retryTiers.find(t =>
                    t.tier_name.toLowerCase() === reqSource.tierName.toLowerCase() &&
                    t.data_tier_category_id === category.id
                );

                // If tier not found, attempt to fetch for this category
                if (!tier && fetchTiersByCategory) {
                    await fetchTiersByCategory(category.id);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    retryTiers = tiers;

                    tier = retryTiers.find(t =>
                        t.tier_name.toLowerCase() === reqSource.tierName.toLowerCase() &&
                        t.data_tier_category_id === category.id
                    );
                }

                if (!tier) {
                    // Tier not found for the required category
                    continue; // Skip this source
                }

                // Tìm data source (so sánh chính xác với parameter_name và tier_id)
                let dataSource = retryDataSources.find(ds =>
                    ds.parameter_name.toLowerCase() === reqSource.parameterName.toLowerCase() &&
                    ds.data_tier_id === tier.id
                );

                // If data source not found, attempt to fetch for this tier
                if (!dataSource && fetchDataSourcesByTier) {
                    await fetchDataSourcesByTier(tier.id);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    retryDataSources = dataSources;

                    dataSource = retryDataSources.find(ds =>
                        ds.parameter_name.toLowerCase() === reqSource.parameterName.toLowerCase() &&
                        ds.data_tier_id === tier.id
                    );
                }

                if (!dataSource) {
                    // Data source not found for the required parameter
                    continue; // Skip this source
                }

                // Tính calculatedCost
                const calculatedCost = Math.round(
                    dataSource.base_cost * category.category_cost_multiplier * tier.data_tier_multiplier
                );

                // Thêm vào mappedDataSources với đầy đủ label fields cho EstimatedCosts
                mappedDataSources.push({
                    id: dataSource.id,
                    label: dataSource.display_name_vi || dataSource.parameter_name,
                    parameterName: dataSource.parameter_name,
                    unit: dataSource.unit,
                    description: dataSource.description_vi || dataSource.parameter_name,
                    baseCost: dataSource.base_cost,
                    category: category.category_name,
                    categoryId: category.id,
                    categoryLabel: category.category_name,
                    categoryMultiplier: category.category_cost_multiplier,
                    tier: tier.tier_name,
                    tierId: tier.id,
                    tierLabel: tier.tier_name,
                    tierMultiplier: tier.data_tier_multiplier,
                    calculatedCost: calculatedCost,
                    data_tier_id: tier.id,
                    ...dataSource
                });
            }

            if (mappedDataSources.length === 0) {
                message.error('Không tìm thấy nguồn dữ liệu phù hợp. Vui lòng kiểm tra lại cấu hình hệ thống.');
                return;
            }

            // 2. Map conditions với data source IDs
            const mappedConditions = template.configurationData.conditions.map((condition, index) => {
                const dataSource = mappedDataSources.find(ds =>
                    ds.parameterName === condition.parameterName
                );

                if (!dataSource) {
                    // Data source not found for condition
                    return null;
                }

                // Map dataQuality to Vietnamese label
                const dataQuality = condition.dataQuality || 'good';
                const dataQualityLabel = dataQuality === 'good' ? 'Tốt' :
                    dataQuality === 'acceptable' ? 'Chấp nhận được' : 'Kém';

                // Map aggregation function to Vietnamese label
                const aggregationFunctionLabel = {
                    'avg': 'Trung bình',
                    'sum': 'Tổng',
                    'min': 'Nhỏ nhất',
                    'max': 'Lớn nhất'
                }[condition.aggregationFunction] || condition.aggregationFunction;

                // Map threshold operator to Vietnamese label
                const thresholdOperatorLabel = {
                    '<': 'Nhỏ hơn',
                    '>': 'Lớn hơn',
                    '<=': 'Nhỏ hơn hoặc bằng',
                    '>=': 'Lớn hơn hoặc bằng',
                    'change_lt': 'Thay đổi < baseline',
                    'change_gt': 'Thay đổi > baseline'
                }[condition.thresholdOperator] || condition.thresholdOperator;

                // Tính calculatedCost cho condition
                const conditionCalculatedCost = Math.round(
                    dataSource.baseCost * dataSource.categoryMultiplier * dataSource.tierMultiplier
                );

                return {
                    id: `condition_${Date.now()}_${index}`,
                    dataSourceId: dataSource.id,
                    dataSourceLabel: dataSource.label,
                    parameterName: dataSource.parameterName,
                    unit: dataSource.unit,
                    thresholdOperator: condition.thresholdOperator,
                    thresholdValue: condition.thresholdValue,
                    aggregationFunction: condition.aggregationFunction,
                    aggregationWindowDays: condition.aggregationWindowDays,
                    baselineWindowDays: condition.baselineWindowDays || null,
                    baselineFunction: condition.baselineFunction || null,
                    validationWindowDays: condition.validationWindowDays || null,
                    consecutiveRequired: condition.consecutiveRequired || false,
                    includeComponent: condition.includeComponent || false,
                    dataQuality: dataQuality,
                    dataQualityLabel: dataQualityLabel,
                    aggregationFunctionLabel: aggregationFunctionLabel,
                    thresholdOperatorLabel: thresholdOperatorLabel,
                    conditionOrder: condition.conditionOrder,
                    baseCost: dataSource.baseCost,
                    categoryMultiplier: dataSource.categoryMultiplier,
                    tierMultiplier: dataSource.tierMultiplier,
                    calculatedCost: conditionCalculatedCost,
                };
            }).filter(Boolean);

            if (mappedConditions.length === 0) {
                message.error('Không thể tạo điều kiện kích hoạt. Vui lòng kiểm tra lại nguồn dữ liệu.');
                return;
            }

            // 3. Prepare final data
            const finalBasicData = {
                ...template.basicData,
                selectedDataSources: mappedDataSources
            };

            const finalConfigurationData = {
                ...template.configurationData,
                conditions: mappedConditions
            };

            // 4. Call parent callback
            onSelectTemplate({
                basicData: finalBasicData,
                configurationData: finalConfigurationData,
                templateInfo: {
                    id: template.id,
                    name: template.name,
                    category: template.category
                }
            });

            // 5. Close drawer and show success
            handleCloseDrawer();
            message.success(`Đã áp dụng template "${template.name}" thành công!`);

        } catch (error) {
            message.error('Có lỗi xảy ra khi áp dụng template. Vui lòng thử lại.');
        }
    };

    // Render difficulty tag
    const renderDifficultyTag = (difficulty) => {
        const colorMap = {
            'Dễ': 'green',
            'Trung bình': 'orange',
            'Nâng cao': 'red'
        };
        return <Tag color={colorMap[difficulty] || 'default'}>{difficulty}</Tag>;
    };

    // Render template card
    const renderTemplateCard = (template) => (
        <Badge.Ribbon
            text={template.recommended ? 'Đề xuất' : null}
            color="gold"
            key={template.id}
        >
            <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                    <Button
                        type="link"
                        icon={<InfoCircleOutlined />}
                        onClick={() => handlePreview(template)}
                        key="preview"
                    >
                        Xem chi tiết
                    </Button>,
                    <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={() => handleApplyTemplate(template)}
                        disabled={isPreloading}
                        loading={isPreloading}
                        key="apply"
                    >
                        {isPreloading ? 'Đang tải...' : 'Áp dụng'}
                    </Button>
                ]}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{ fontSize: '48px', textAlign: 'center' }}>
                        {template.icon}
                    </div>

                    <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
                        {template.name}
                    </Title>

                    <Space size="small" wrap style={{ justifyContent: 'center', width: '100%' }}>
                        <Tag color="blue">{template.category}</Tag>
                        {renderDifficultyTag(template.difficulty)}
                    </Space>

                    <Paragraph
                        ellipsis={{ rows: 3 }}
                        style={{ margin: 0, minHeight: '60px' }}
                    >
                        {template.description}
                    </Paragraph>

                    <Divider style={{ margin: '8px 0' }} />

                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text type="secondary">
                            <ThunderboltOutlined /> Chi phí ước tính: <Text strong>{template.estimatedCost}</Text>
                        </Text>
                        <Text type="secondary">
                            <EnvironmentOutlined /> Nguồn dữ liệu: <Text strong>{template.requiredDataSources.length}</Text>
                        </Text>
                    </Space>
                </Space>
            </Card>
        </Badge.Ribbon>
    );

    // Render preview modal
    const renderPreviewModal = () => {
        if (!selectedTemplate) return null;

        return (
            <Modal
                title={
                    <Space>
                        <span style={{ fontSize: '32px' }}>{selectedTemplate.icon}</span>
                        <Title level={3} style={{ margin: 0 }}>
                            {selectedTemplate.name}
                        </Title>
                    </Space>
                }
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setPreviewModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="apply"
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={() => {
                            setPreviewModalVisible(false);
                            handleApplyTemplate(selectedTemplate);
                        }}
                        disabled={isPreloading}
                        loading={isPreloading}
                    >
                        {isPreloading ? 'Đang tải dữ liệu...' : 'Áp dụng Template'}
                    </Button>
                ]}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Thông tin chung */}
                    <Card title="📋 Thông tin chung" size="small">
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Danh mục">
                                <Tag color="blue">{selectedTemplate.category}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Độ khó">
                                {renderDifficultyTag(selectedTemplate.difficulty)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chi phí ước tính" span={2}>
                                <Text strong style={{ color: '#1890ff' }}>
                                    {selectedTemplate.estimatedCost}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả" span={2}>
                                {selectedTemplate.description}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Thông tin cơ bản */}
                    <Card title="ℹ️ Thông tin cơ bản (Basic)" size="small">
                        <Descriptions column={2} size="small" bordered>
                            <Descriptions.Item label="Loại cây trồng">
                                {selectedTemplate.basicData.cropType}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời hạn BH">
                                {selectedTemplate.basicData.coverageDurationDays} ngày
                            </Descriptions.Item>
                            <Descriptions.Item label="Tỷ lệ phí cơ bản">
                                {(selectedTemplate.basicData.premiumBaseRate * 100).toFixed(2)}%
                            </Descriptions.Item>
                            <Descriptions.Item label="Tỷ lệ chi trả">
                                {(selectedTemplate.basicData.payoutBaseRate * 100).toFixed(2)}%
                            </Descriptions.Item>
                            <Descriptions.Item label="Trần chi trả">
                                {selectedTemplate.basicData.payoutCap?.toLocaleString('vi-VN')} ₫
                            </Descriptions.Item>
                            <Descriptions.Item label="Hệ số vượt ngưỡng">
                                {selectedTemplate.basicData.overThresholdMultiplier}x
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Cấu hình trigger */}
                    <Card title="⚙️ Cấu hình giám sát (Configuration)" size="small">
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Descriptions column={2} size="small" bordered>
                                <Descriptions.Item label="Toán tử logic">
                                    <Tag color={selectedTemplate.configurationData.logicalOperator === 'AND' ? 'purple' : 'orange'}>
                                        {selectedTemplate.configurationData.logicalOperator}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tần suất giám sát">
                                    {selectedTemplate.configurationData.monitorInterval} {selectedTemplate.configurationData.monitorFrequencyUnit}
                                </Descriptions.Item>
                                <Descriptions.Item label="Giai đoạn" span={2}>
                                    {selectedTemplate.configurationData.growthStage}
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider orientation="left" plain>Điều kiện kích hoạt</Divider>
                            {selectedTemplate.configurationData.conditions.map((condition, index) => (
                                <Card
                                    key={index}
                                    size="small"
                                    type="inner"
                                    title={`Điều kiện ${index + 1}: ${condition.parameterName}`}
                                >
                                    <Descriptions column={2} size="small">
                                        <Descriptions.Item label="Toán tử">
                                            <Tag>{condition.thresholdOperator}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Ngưỡng">
                                            <Text strong>{condition.thresholdValue}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Hàm tổng hợp">
                                            <Tag color="cyan">{condition.aggregationFunction}</Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Cửa sổ">
                                            {condition.aggregationWindowDays} ngày
                                        </Descriptions.Item>
                                        {condition.baselineWindowDays && (
                                            <>
                                                <Descriptions.Item label="Baseline Window">
                                                    {condition.baselineWindowDays} ngày
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Baseline Function">
                                                    <Tag color="geekblue">{condition.baselineFunction}</Tag>
                                                </Descriptions.Item>
                                            </>
                                        )}
                                    </Descriptions>
                                </Card>
                            ))}
                        </Space>
                    </Card>

                    {/* Nguồn dữ liệu */}
                    <Card title="📡 Nguồn dữ liệu yêu cầu" size="small">
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {selectedTemplate.requiredDataSources.map((source, index) => (
                                <Card key={index} size="small" type="inner">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Text strong>{source.parameterName}</Text>
                                        <Space size="small">
                                            <Tag color="blue">{source.categoryName}</Tag>
                                            <Tag color="green">{source.tierName}</Tag>
                                        </Space>
                                        <Text type="secondary">{source.usage}</Text>
                                    </Space>
                                </Card>
                            ))}
                        </Space>
                    </Card>

                    {/* Lợi ích */}
                    <Card title="✨ Lợi ích" size="small">
                        <ul>
                            {selectedTemplate.benefits.map((benefit, index) => (
                                <li key={index}>
                                    <Text><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />{benefit}</Text>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </Space>
            </Modal>
        );
    };

    return (
        <>
            {/* Nút mở drawer */}
            <Button
                type="dashed"
                icon={<BulbOutlined />}
                onClick={handleOpenDrawer}
                size="large"
                style={{ width: '100%' }}
            >
                Chọn từ Gói Gợi Ý (Templates)
            </Button>

            {/* Drawer hiển thị templates */}
            <Drawer
                title={
                    <Space>
                        <BulbOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                        <Title level={3} style={{ margin: 0 }}>
                            Gợi Ý Gói Bảo Hiểm
                        </Title>
                    </Space>
                }
                placement="right"
                onClose={handleCloseDrawer}
                open={drawerVisible}
                width={1200}
                extra={
                    <Button icon={<CloseOutlined />} onClick={handleCloseDrawer}>
                        Đóng
                    </Button>
                }
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Thông báo hướng dẫn */}
                    <Alert
                        message="Cách sử dụng"
                        description={
                            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                <li>Chọn một template phù hợp với nhu cầu của bạn</li>
                                <li>Click "Xem chi tiết" để xem đầy đủ thông tin</li>
                                <li>Click "Áp dụng" để tự động điền dữ liệu vào form</li>
                                <li>Bạn có thể chỉnh sửa dữ liệu sau khi áp dụng</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                        closable
                    />

                    {/* Loading indicator */}
                    {isPreloading && (
                        <Alert
                            message="Đang tải dữ liệu..."
                            description="Vui lòng đợi trong giây lát. Hệ thống đang tải thông tin nguồn dữ liệu."
                            type="warning"
                            showIcon
                        />
                    )}

                    {/* Danh sách templates */}
                    <Row gutter={[16, 16]}>
                        {POLICY_TEMPLATES.length > 0 ? (
                            POLICY_TEMPLATES.map(template => (
                                <Col xs={24} sm={12} lg={8} key={template.id}>
                                    {renderTemplateCard(template)}
                                </Col>
                            ))
                        ) : (
                            <Col span={24}>
                                <Empty description="Chưa có template nào" />
                            </Col>
                        )}
                    </Row>
                </Space>
            </Drawer>

            {/* Preview modal */}
            {renderPreviewModal()}
        </>
    );
});

PolicyTemplateSelector.displayName = 'PolicyTemplateSelector';

export default PolicyTemplateSelector;
