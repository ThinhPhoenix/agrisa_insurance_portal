import useDictionary from '@/services/hooks/common/use-dictionary';
import {
    BulbOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    CopyOutlined,
    EnvironmentOutlined,
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
import dayjs from 'dayjs';
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
 */

// Mock data cho các template gói bảo hiểm
// Dựa trên data thực tế từ API:
// - Category: "Satellite", "Weather"
// - Tiers: "Tiêu chuẩn", "Nâng cao", "Độ nét cao", "Chính xác", "Siêu cấp"
// - Data Sources: "ndmi" (Chỉ số độ ẩm thực vật), "ndvi" (Chỉ số thực vật)
// Cả 2 data sources đều thuộc Satellite > Nâng cao
const POLICY_TEMPLATES = [
    {
        id: 'rice_ndvi_basic',
        name: 'Bảo Hiểm Lúa - Giám Sát Sức Khỏe Cây (NDVI)',
        category: 'Lúa (Rice)',
        description: 'Gói bảo hiểm sử dụng chỉ số NDVI từ vệ tinh để giám sát sức khỏe cây lúa. Phát hiện sớm khi cây bị stress hoặc bệnh hại.',
        icon: '🌾',
        difficulty: 'Dễ',
        recommended: true,
        basicData: {
            productName: 'Bảo Hiểm Lúa Giám Sát NDVI',
            productCode: 'RICE_NDVI_BASIC_2025',
            productDescription: 'Bảo hiểm tiên tiến sử dụng chỉ số thực vật NDVI từ ảnh vệ tinh để giám sát sức khỏe cây lúa. Chi trả tự động khi phát hiện sự suy giảm đáng kể của NDVI, báo hiệu cây bị stress, bệnh hại hoặc thiếu dinh dưỡng.',
            cropType: 'Lúa',
            coverageCurrency: 'VND',
            coverageDurationDays: 120,

            // Premium
            isPerHectare: true,
            premiumBaseRate: 0.05,
            fixPremiumAmount: 1500000, // ✅ Mẫu: 1,500,000 ₫
            maxPremiumPaymentProlong: 30, // Gia hạn nộp phí: 30 ngày
            cancelPremiumRate: 0.8,

            // Payout
            isPayoutPerHectare: true,
            payoutBaseRate: 0.75,
            fixPayoutAmount: 5000000, // ✅ Mẫu: 5,000,000 ₫
            payoutCap: 10000000,
            overThresholdMultiplier: 1.2,

            // Enrollment (Thời gian đăng ký)
            enrollmentStartDay: dayjs().subtract(5, 'day'),
            enrollmentEndDay: dayjs().add(25, 'day'),

            // Validity (Thời hạn bảo hiểm)
            insuranceValidFrom: dayjs(),
            insuranceValidTo: dayjs().add(120, 'day'),

            // Renewal
            autoRenewal: false,
            renewalDiscountRate: 0,
            basePolicyInvalidDate: null,

            // Status
            status: 'draft',
            documentValidationStatus: 'pending',
            importantAdditionalInformation: '',
        },
        configurationData: {
            logicalOperator: 'OR',
            monitorInterval: 1,
            monitorFrequencyUnit: 'week',
            growthStage: 'Giai đoạn sinh trưởng thân lá',
            blackoutPeriods: {
                periods: [
                    {
                        start: '01-01',
                        end: '01-14',
                        reason: 'Giai đoạn gieo hạt - NDVI chưa ổn định'
                    }
                ]
            },
            conditions: [
                {
                    dataSourceKey: 'ndvi',
                    parameterName: 'ndvi',
                    thresholdOperator: '<',
                    thresholdValue: 0.3,
                    aggregationFunction: 'avg',
                    aggregationWindowDays: 7,
                    dataQuality: 'good',
                    conditionOrder: 1
                }
            ]
        },
        requiredDataSources: [
            {
                parameterName: 'ndvi',
                categoryName: 'Satellite',
                tierName: 'Nâng cao',
                usage: 'Đo lường sức khỏe cây qua chỉ số thực vật'
            }
        ],
        estimatedCost: '300,000 ₫/tháng',
        benefits: [
            'Phát hiện sớm tình trạng cây bị stress',
            'Công nghệ vệ tinh tiên tiến',
            'Chi trả tự động, không cần kiểm tra hiện trường',
            'Theo dõi xu hướng dài hạn'
        ]
    },
    {
        id: 'rice_ndmi_drought',
        name: 'Bảo Hiểm Lúa - Chống Hạn Hán (NDMI)',
        category: 'Lúa (Rice)',
        description: 'Gói bảo hiểm sử dụng chỉ số NDMI từ vệ tinh để phát hiện thiếu nước. Phù hợp cho mùa khô.',
        icon: '🌾',
        difficulty: 'Dễ',
        recommended: true,
        basicData: {
            productName: 'Bảo Hiểm Lúa Chống Hạn NDMI',
            productCode: 'RICE_NDMI_DROUGHT_2025',
            productDescription: 'Bảo hiểm chống hạn hán cho cây lúa sử dụng chỉ số NDMI (Normalized Difference Moisture Index) để đánh giá hàm lượng nước trong thảm thực vật. Chi trả tự động khi phát hiện tình trạng thiếu nước nghiêm trọng.',
            cropType: 'Lúa',
            coverageCurrency: 'VND',
            coverageDurationDays: 120,

            // Premium
            isPerHectare: true,
            premiumBaseRate: 0.06,
            fixPremiumAmount: 1800000, // ✅ Mẫu: 1,800,000 ₫
            maxPremiumPaymentProlong: 30,
            cancelPremiumRate: 0.8,

            // Payout
            isPayoutPerHectare: true,
            payoutBaseRate: 0.8,
            fixPayoutAmount: 6000000, // ✅ Mẫu: 6,000,000 ₫
            payoutCap: 12000000,
            overThresholdMultiplier: 1.3,

            // Enrollment (Thời gian đăng ký)
            enrollmentStartDay: dayjs().subtract(3, 'day'),
            enrollmentEndDay: dayjs().add(27, 'day'),

            // Validity (Thời hạn bảo hiểm)
            insuranceValidFrom: dayjs().add(10, 'day'),
            insuranceValidTo: dayjs().add(130, 'day'),

            // Renewal
            autoRenewal: false,
            renewalDiscountRate: 0,
            basePolicyInvalidDate: null,

            // Status
            status: 'draft',
            documentValidationStatus: 'pending',
            importantAdditionalInformation: '',
        },
        configurationData: {
            logicalOperator: 'OR',
            monitorInterval: 3,
            monitorFrequencyUnit: 'day',
            growthStage: 'Giai đoạn phát triển thân lá và trổ bông',
            blackoutPeriods: {
                periods: [
                    {
                        start: '01-01',
                        end: '01-10',
                        reason: 'Giai đoạn gieo hạt - chưa cần bảo hiểm'
                    }
                ]
            },
            conditions: [
                {
                    dataSourceKey: 'ndmi',
                    parameterName: 'ndmi',
                    thresholdOperator: '<',
                    thresholdValue: -0.2,
                    aggregationFunction: 'avg',
                    aggregationWindowDays: 14,
                    dataQuality: 'good',
                    conditionOrder: 1
                }
            ]
        },
        requiredDataSources: [
            {
                parameterName: 'ndmi',
                categoryName: 'Satellite',
                tierName: 'Nâng cao',
                usage: 'Đánh giá hàm lượng nước trong thực vật để phát hiện hạn hán'
            }
        ],
        estimatedCost: '350,000 ₫/tháng',
        benefits: [
            'Phát hiện sớm tình trạng thiếu nước',
            'Phù hợp cho mùa khô',
            'Chi trả tự động dựa trên dữ liệu vệ tinh',
            'Quản lý tưới tiêu hiệu quả'
        ]
    },
    {
        id: 'rice_ndvi_ndmi_premium',
        name: 'Bảo Hiểm Lúa - Toàn Diện (NDVI + NDMI)',
        category: 'Lúa (Rice)',
        description: 'Gói bảo hiểm cao cấp kết hợp NDVI và NDMI để giám sát toàn diện sức khỏe cây và tình trạng nước. Bảo vệ tối ưu.',
        icon: '🌾',
        difficulty: 'Trung bình',
        recommended: true,
        basicData: {
            productName: 'Bảo Hiểm Lúa Toàn Diện NDVI+NDMI',
            productCode: 'RICE_COMPREHENSIVE_2025',
            productDescription: 'Bảo hiểm toàn diện cho cây lúa kết hợp cả chỉ số NDVI (sức khỏe cây) và NDMI (hàm lượng nước). Bảo vệ cây lúa khỏi cả bệnh hại lẫn hạn hán. Chi trả tự động khi một trong hai chỉ số vượt ngưỡng cảnh báo.',
            cropType: 'Lúa',
            coverageCurrency: 'VND',
            coverageDurationDays: 150,

            // Premium
            isPerHectare: true,
            premiumBaseRate: 0.08,
            fixPremiumAmount: 2200000, // ✅ Mẫu: 2,200,000 ₫
            maxPremiumPaymentProlong: 45,
            cancelPremiumRate: 0.7,

            // Payout
            isPayoutPerHectare: true,
            payoutBaseRate: 0.85,
            fixPayoutAmount: 7500000, // ✅ Mẫu: 7,500,000 ₫
            payoutCap: 15000000,
            overThresholdMultiplier: 1.5,

            // Enrollment (Thời gian đăng ký)
            enrollmentStartDay: dayjs().subtract(7, 'day'),
            enrollmentEndDay: dayjs().add(23, 'day'),

            // Validity (Thời hạn bảo hiểm)
            insuranceValidFrom: dayjs(),
            insuranceValidTo: dayjs().add(150, 'day'),

            // Renewal
            autoRenewal: true,
            renewalDiscountRate: 0.1,
            basePolicyInvalidDate: null,

            // Status
            status: 'draft',
            documentValidationStatus: 'pending',
            importantAdditionalInformation: '',
        },
        configurationData: {
            logicalOperator: 'OR',
            monitorInterval: 3,
            monitorFrequencyUnit: 'day',
            growthStage: 'Toàn bộ chu kỳ sinh trưởng',
            blackoutPeriods: {
                periods: []
            },
            conditions: [
                {
                    dataSourceKey: 'ndvi',
                    parameterName: 'ndvi',
                    thresholdOperator: '<',
                    thresholdValue: 0.3,
                    aggregationFunction: 'avg',
                    aggregationWindowDays: 7,
                    dataQuality: 'good',
                    conditionOrder: 1
                },
                {
                    dataSourceKey: 'ndmi',
                    parameterName: 'ndmi',
                    thresholdOperator: '<',
                    thresholdValue: -0.2,
                    aggregationFunction: 'avg',
                    aggregationWindowDays: 14,
                    dataQuality: 'good',
                    conditionOrder: 2
                }
            ]
        },
        requiredDataSources: [
            {
                parameterName: 'ndvi',
                categoryName: 'Satellite',
                tierName: 'Nâng cao',
                usage: 'Giám sát sức khỏe và sinh khối cây'
            },
            {
                parameterName: 'ndmi',
                categoryName: 'Satellite',
                tierName: 'Nâng cao',
                usage: 'Giám sát hàm lượng nước trong cây'
            }
        ],
        estimatedCost: '600,000 ₫/tháng',
        benefits: [
            'Bảo vệ toàn diện cả sức khỏe và nước',
            'Kết hợp 2 chỉ số vệ tinh tiên tiến',
            'Chi trả cao hơn khi thiệt hại nặng',
            'Tự động gia hạn với ưu đãi 10%'
        ]
    },
    {
        id: 'coffee_ndvi_health',
        name: 'Bảo Hiểm Cà Phê - Giám Sát Sức Khỏe (NDVI)',
        category: 'Cà Phê (Coffee)',
        description: 'Bảo vệ cây cà phê bằng giám sát chỉ số NDVI. Phát hiện sớm bệnh hại, sâu bệnh và stress nhiệt.',
        icon: '☕',
        difficulty: 'Trung bình',
        recommended: false,
        basicData: {
            productName: 'Bảo Hiểm Cà Phê Giám Sát NDVI',
            productCode: 'COFFEE_NDVI_2025',
            productDescription: 'Bảo hiểm chuyên biệt cho cây cà phê sử dụng chỉ số NDVI để giám sát sức khỏe cây. Phát hiện sớm tình trạng stress do nhiệt độ, bệnh hại, hoặc thiếu dinh dưỡng qua sự suy giảm NDVI.',
            cropType: 'Cà phê',
            coverageCurrency: 'VND',
            coverageDurationDays: 180,

            // Premium
            isPerHectare: true,
            premiumBaseRate: 0.07,
            fixPremiumAmount: 2000000, // ✅ Mẫu: 2,000,000 ₫
            maxPremiumPaymentProlong: 30,
            cancelPremiumRate: 0.75,

            // Payout
            isPayoutPerHectare: true,
            payoutBaseRate: 0.8,
            fixPayoutAmount: 8000000, // ✅ Mẫu: 8,000,000 ₫
            payoutCap: 18000000,
            overThresholdMultiplier: 1.4,

            // Enrollment (Thời gian đăng ký)
            enrollmentStartDay: dayjs().subtract(10, 'day'),
            enrollmentEndDay: dayjs().add(20, 'day'),

            // Validity (Thời hạn bảo hiểm)
            insuranceValidFrom: dayjs().add(5, 'day'),
            insuranceValidTo: dayjs().add(185, 'day'),
            // Renewal
            autoRenewal: false,
            renewalDiscountRate: 0,
            basePolicyInvalidDate: null,

            // Status
            status: 'draft',
            documentValidationStatus: 'pending',
            importantAdditionalInformation: '',
        },
        configurationData: {
            logicalOperator: 'OR',
            monitorInterval: 1,
            monitorFrequencyUnit: 'week',
            growthStage: 'Giai đoạn ra hoa và phát triển quả',
            blackoutPeriods: {
                periods: [
                    {
                        start: '06-01',
                        end: '06-30',
                        reason: 'Giai đoạn thu hoạch - không cần bảo hiểm'
                    }
                ]
            },
            conditions: [
                {
                    dataSourceKey: 'ndvi',
                    parameterName: 'ndvi',
                    thresholdOperator: '<',
                    thresholdValue: 0.4,
                    aggregationFunction: 'avg',
                    aggregationWindowDays: 14,
                    dataQuality: 'good',
                    conditionOrder: 1
                }
            ]
        },
        requiredDataSources: [
            {
                parameterName: 'ndvi',
                categoryName: 'Satellite',
                tierName: 'Nâng cao',
                usage: 'Phát hiện sớm stress và bệnh hại trên cây cà phê'
            }
        ],
        estimatedCost: '450,000 ₫/tháng',
        benefits: [
            'Bảo vệ cây cà phê khỏi stress và bệnh hại',
            'Phù hợp cho vùng khí hậu biến đổi',
            'Công nghệ vệ tinh độ phân giải cao',
            'Chi trả linh hoạt theo mức độ thiệt hại'
        ]
    }
];

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
                console.log('🔄 Pre-loading data for templates...');

                // Step 1: Find Satellite category (đã có từ trước)
                const satelliteCategory = categories.find(cat =>
                    cat.category_name.toLowerCase() === 'satellite'
                );

                if (!satelliteCategory) {
                    console.error('❌ Satellite category not found');
                    message.error('Không tìm thấy category Satellite. Vui lòng tải lại trang.');
                    setIsPreloading(false);
                    return;
                }

                console.log('📡 Found Satellite category:', satelliteCategory.id);

                // Step 2: Fetch tiers cho Satellite (nếu chưa có)
                let satelliteTiers = tiersRef.current.filter(t => t.data_tier_category_id === satelliteCategory.id);
                console.log(`🔍 Current Satellite tiers count: ${satelliteTiers.length}`);

                if (satelliteTiers.length === 0) {
                    console.log('⬇️ Fetching tiers for Satellite...');
                    await fetchTiersByCategory(satelliteCategory.id);

                    // Đợi state update và retry tìm tiers using ref
                    console.log('⏳ Waiting for tiers to be loaded...');
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Retry finding tiers using ref (ref always has latest value)
                    satelliteTiers = tiersRef.current.filter(t => t.data_tier_category_id === satelliteCategory.id);
                    console.log(`🔍 After fetch - Satellite tiers count: ${satelliteTiers.length}`);

                    if (satelliteTiers.length === 0) {
                        console.warn('⚠️ Tiers still not loaded after fetch, will try again when user applies template');
                    } else {
                        console.log('✅ Tiers fetched and loaded');
                    }
                } else {
                    console.log('✅ Tiers already loaded');
                }

                // Step 3: Find "Nâng cao" tier và fetch data sources
                console.log('🔍 Looking for "Nâng cao" tier...');

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
                        console.log(`⏳ Tier "Nâng cao" not found yet, retry ${retries + 1}/${maxRetries}...`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries++;
                    } else {
                        break;
                    }
                }

                if (nangCaoTier) {
                    console.log('📊 Found "Nâng cao" tier:', nangCaoTier.id);

                    // Check if data sources already loaded using ref
                    let nangCaoDataSources = dataSourcesRef.current.filter(ds => ds.data_tier_id === nangCaoTier.id);
                    console.log(`🔍 Current data sources for "Nâng cao": ${nangCaoDataSources.length}`);

                    if (nangCaoDataSources.length === 0) {
                        console.log('⬇️ Fetching data sources for "Nâng cao" tier...');
                        await fetchDataSourcesByTier(nangCaoTier.id);

                        // Đợi state update và retry using ref
                        console.log('⏳ Waiting for data sources to be loaded...');
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Check again using ref
                        nangCaoDataSources = dataSourcesRef.current.filter(ds => ds.data_tier_id === nangCaoTier.id);
                        console.log(`🔍 After fetch - Data sources count: ${nangCaoDataSources.length}`);

                        if (nangCaoDataSources.length > 0) {
                            console.log('✅ Data sources fetched successfully');
                        } else {
                            console.warn('⚠️ Data sources still not loaded after fetch');
                        }
                    } else {
                        console.log('✅ Data sources already loaded');
                    }
                } else {
                    console.error('❌ Could not find "Nâng cao" tier after retries');
                    message.warning('Không tìm thấy tier "Nâng cao". Vui lòng thử lại hoặc chọn tier thủ công.');
                }

                console.log('✅ Pre-loading complete');
                console.log('📊 Final state:', {
                    categories: categories.length,
                    tiers: tiersRef.current.length,
                    dataSources: dataSourcesRef.current.length
                });

            } catch (error) {
                console.error('❌ Error pre-loading data:', error);
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
            title: '⚠️ Xác nhận áp dụng template',
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph>
                        Bạn có chắc chắn muốn áp dụng template <Text strong>"{template.name}"</Text>?
                    </Paragraph>
                    <Alert
                        message="Lưu ý"
                        description="Tất cả dữ liệu hiện tại trong form sẽ bị ghi đè. Hành động này không thể hoàn tác."
                        type="warning"
                        showIcon
                    />
                </Space>
            ),
            okText: 'Áp dụng',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                applyTemplate(template);
            }
        });
    };

    // Logic áp dụng template
    const applyTemplate = async (template) => {
        try {
            console.log('🔄 Starting template application:', template.name);
            console.log('📊 Current state:', {
                categories: categories.length,
                tiers: tiers.length,
                dataSources: dataSources.length
            });

            // ✅ RETRY LOGIC: If data not loaded, trigger fetch
            let retryCategories = categories;
            let retryTiers = tiers;
            let retryDataSources = dataSources;

            if (categories.length === 0) {
                console.warn('⚠️ Categories not loaded, attempting fetch...');
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
                    console.warn(`⚠️ Category not found for: ${reqSource.categoryName}`);
                    console.warn(`Available categories:`, retryCategories.map(c => ({ name: c.category_name, id: c.id })));
                    continue; // Skip this source and continue with next
                }

                console.log(`✅ Found category: ${category.category_name} (ID: ${category.id})`);

                // Tìm tier (so sánh chính xác với tierName và category_id)
                let tier = retryTiers.find(t =>
                    t.tier_name.toLowerCase() === reqSource.tierName.toLowerCase() &&
                    t.data_tier_category_id === category.id
                );

                // If tier not found, attempt to fetch for this category
                if (!tier && fetchTiersByCategory) {
                    console.warn(`⚠️ Tier not found for category ${category.category_name}, attempting fetch...`);
                    await fetchTiersByCategory(category.id);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    retryTiers = tiers;

                    tier = retryTiers.find(t =>
                        t.tier_name.toLowerCase() === reqSource.tierName.toLowerCase() &&
                        t.data_tier_category_id === category.id
                    );
                }

                if (!tier) {
                    console.warn(`⚠️ Tier not found for: ${reqSource.tierName} in category ${category.category_name}`);
                    console.warn(`Available tiers for category ${category.category_name}:`,
                        retryTiers.filter(t => t.data_tier_category_id === category.id).map(t => ({ name: t.tier_name, id: t.id }))
                    );
                    continue; // Skip this source
                }

                console.log(`✅ Found tier: ${tier.tier_name} (ID: ${tier.id})`);

                // Tìm data source (so sánh chính xác với parameter_name và tier_id)
                let dataSource = retryDataSources.find(ds =>
                    ds.parameter_name.toLowerCase() === reqSource.parameterName.toLowerCase() &&
                    ds.data_tier_id === tier.id
                );

                // If data source not found, attempt to fetch for this tier
                if (!dataSource && fetchDataSourcesByTier) {
                    console.warn(`⚠️ Data source not found for tier ${tier.tier_name}, attempting fetch...`);
                    await fetchDataSourcesByTier(tier.id);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    retryDataSources = dataSources;

                    dataSource = retryDataSources.find(ds =>
                        ds.parameter_name.toLowerCase() === reqSource.parameterName.toLowerCase() &&
                        ds.data_tier_id === tier.id
                    );
                }

                if (!dataSource) {
                    console.warn(`⚠️ Data source not found: ${reqSource.parameterName}`);
                    console.warn(`Available data sources for tier ${tier.tier_name}:`,
                        retryDataSources.filter(ds => ds.data_tier_id === tier.id).map(ds => ({ name: ds.parameter_name, id: ds.id }))
                    );
                    continue; // Skip this source
                }

                console.log(`✅ Mapped data source: ${dataSource.parameter_name}`, {
                    category: category.category_name,
                    tier: tier.tier_name,
                    dataSource: dataSource.parameter_name,
                    baseCost: dataSource.base_cost
                });

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
                console.error('❌ Failed to map any data sources');
                message.error('Không tìm thấy nguồn dữ liệu phù hợp. Vui lòng kiểm tra lại cấu hình hệ thống.');
                return;
            }

            // 2. Map conditions với data source IDs
            const mappedConditions = template.configurationData.conditions.map((condition, index) => {
                const dataSource = mappedDataSources.find(ds =>
                    ds.parameterName === condition.parameterName
                );

                if (!dataSource) {
                    console.warn(`⚠️ Data source not found for condition: ${condition.parameterName}`);
                    console.warn(`Available sources:`, mappedDataSources.map(ds => ds.parameterName));
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
                console.error('❌ Failed to map any conditions');
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
            message.success(`✅ Đã áp dụng template "${template.name}" thành công!`);

        } catch (error) {
            console.error('❌ Error applying template:', error);
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
