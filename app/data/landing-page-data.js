export const statsData = [
    {
        icon: 'fas fa-users',
        value: '10,000+',
        label: 'Nhà đầu tư tin dùng',
        color: 'blue'
    },
    {
        icon: 'fas fa-exchange-alt',
        value: '1.5 triệu',
        label: 'Giao dịch được ghi nhận',
        color: 'blue'
    },
    {
        icon: 'fas fa-chart-line',
        value: '25%',
        label: 'Tăng hiệu quả đầu tư',
        color: 'green',
        hasArrow: true
    },
    {
        icon: 'fas fa-shield-alt',
        value: '99.9%',
        label: 'Thời gian hoạt động',
        color: 'blue'
    }
];

export const featuresData = [
    {
        icon: 'fas fa-book',
        title: 'Nhật ký giao dịch chi tiết',
        description: 'Ghi lại chi tiết mọi giao dịch, bao gồm lý do mua/bán, chiến lược và cảm xúc tại thời điểm giao dịch để rút kinh nghiệm.'
    },
    {
        icon: 'fas fa-chart-bar',
        title: 'Phân tích hiệu suất sâu sắc',
        description: 'Đánh giá chi tiết hiệu suất giao dịch với các chỉ số quan trọng như tỷ lệ thắng, hệ số Sharpe và drawdown, giúp bạn hiểu rõ điểm mạnh/yếu.'
    },
    {
        icon: 'fas fa-robot',
        title: 'AI đề xuất chiến lược',
        description: 'Công nghệ AI phân tích lịch sử giao dịch của bạn và các yếu tố thị trường để đề xuất cải thiện, tối ưu hóa lợi nhuận.'
    },
    {
        icon: 'fas fa-sync-alt',
        title: 'Đồng bộ giao dịch tự động',
        description: 'Kết nối trực tiếp với tài khoản chứng khoán của bạn để tự động cập nhật mọi giao dịch, tiết kiệm thời gian nhập liệu thủ công.'
    },
    {
        icon: 'fas fa-users',
        title: 'Cộng đồng chia sẻ kiến thức',
        description: 'Tham gia cộng đồng nhà đầu tư năng động, chia sẻ kinh nghiệm, thảo luận chiến lược và học hỏi từ những người thành công.'
    },
    {
        icon: 'fas fa-mobile-alt',
        title: 'Ứng dụng di động tiện lợi',
        description: 'Theo dõi danh mục và nhập giao dịch mọi lúc mọi nơi với ứng dụng di động trên cả iOS và Android, không bỏ lỡ cơ hội nào.'
    }
];

export const testimonialsData = [
    {
        name: 'Nguyễn Thành',
        role: 'Nhà đầu tư cá nhân, Hà Nội',
        avatar: 'NT',
        color: 'blue',
        content: '"Trading Journal đã giúp tôi nhận ra những sai lầm lặp đi lặp lại trong chiến lược giao dịch. Sau 6 tháng sử dụng, hiệu suất của tôi đã tăng 22%."',
        rating: 5
    },
    {
        name: 'Trần Lan',
        role: 'Trader chuyên nghiệp, TP.HCM',
        avatar: 'TL',
        color: 'green',
        content: '"Tính năng phân tích hiệu suất so với thị trường giúp tôi hiểu rõ khi nào nên tích cực giao dịch và khi nào nên đứng ngoài thị trường."',
        rating: 5
    },
    {
        name: 'Phạm Hương',
        role: 'Nhà đầu tư dài hạn, Đà Nẵng',
        avatar: 'PH',
        color: 'purple',
        content: '"Tôi đã thử nhiều ứng dụng nhật ký giao dịch nhưng Trading Journal là toàn diện nhất. Cộng đồng nhà đầu tư ở đây cũng rất hữu ích và hỗ trợ."',
        rating: 4.5
    }
];

export const pricingData = [
    {
        name: 'Cơ bản',
        description: 'Dành cho nhà đầu tư mới bắt đầu',
        price: 'Miễn phí',
        period: '',
        features: [
            { text: 'Nhật ký giao dịch cơ bản', included: true },
            { text: 'Theo dõi danh mục đầu tư', included: true },
            { text: 'Phân tích hiệu suất cơ bản', included: true },
            { text: 'Tối đa 10 giao dịch/tháng', included: true },
            { text: 'Không giới hạn giao dịch', included: false },
            { text: 'Phân tích AI nâng cao', included: false },
            { text: 'Đồng bộ tự động', included: false }
        ],
        cta: 'Đăng ký ngay',
        ctaLink: '/auth/signup',
        highlight: false
    },
    {
        name: 'Chuyên nghiệp',
        description: 'Dành cho nhà đầu tư tích cực',
        price: '199.000đ',
        period: '/tháng',
        features: [
            { text: 'Tất cả tính năng gói Cơ bản', included: true },
            { text: 'Không giới hạn số giao dịch', included: true, bold: true },
            { text: 'Phân tích AI nâng cao', included: true },
            { text: 'Đồng bộ với sàn giao dịch', included: true },
            { text: 'Cảnh báo thị trường', included: true },
            { text: 'Quản lý nhiều tài khoản', included: false }
        ],
        cta: 'Đăng ký ngay',
        ctaLink: '/auth/signup',
        highlight: true,
        badge: 'Phổ biến nhất'
    },
    {
        name: 'Doanh nghiệp',
        description: 'Dành cho công ty và tổ chức',
        price: '499.000đ',
        period: '/tháng',
        features: [
            { text: 'Tất cả tính năng gói Chuyên nghiệp', included: true },
            { text: 'Quản lý nhiều tài khoản', included: true },
            { text: 'Báo cáo tùy chỉnh', included: true },
            { text: 'API tích hợp', included: true },
            { text: 'Hỗ trợ riêng 24/7', included: true },
            { text: 'Tính năng theo yêu cầu*', included: true, note: true }
        ],
        cta: 'Liên hệ tư vấn',
        ctaLink: 'mailto:support@tradingjournal.vn',
        highlight: false,
        note: '*Liên hệ để thảo luận chi tiết'
    }
];

export const leaderboardData = {
    '1W': {
        users: [
            { name: 'FlashTrade', perf: 5.2 },
            { name: 'DayTraderX', perf: 4.8 },
            { name: 'SwiftProfit', perf: 4.1 },
            { name: 'QuickGainz', perf: 3.9 }
        ],
        vnindex: 1.5
    },
    '1M': {
        users: [
            { name: 'Trader_VN92', perf: 28.5 },
            { name: 'InvestorPro', perf: 23.2 },
            { name: 'MarketMaster', perf: 19.8 },
            { name: 'StockHunter', perf: 16.4 }
        ],
        vnindex: 8.5
    },
    '3M': {
        users: [
            { name: 'InvestorPro', perf: 55.1 },
            { name: 'Trader_VN92', perf: 49.5 },
            { name: 'GrowthSeeker', perf: 42.3 },
            { name: 'MarketMaster', perf: 38.7 }
        ],
        vnindex: 15.2
    },
    '6M': {
        users: [
            { name: 'InvestorPro', perf: 98.7 },
            { name: 'WealthBuilder', perf: 85.2 },
            { name: 'Trader_VN92', perf: 78.1 },
            { name: 'GrowthSeeker', perf: 71.5 }
        ],
        vnindex: 22.8
    },
    '1Y': {
        users: [
            { name: 'InvestorPro', perf: 155.3 },
            { name: 'WealthBuilder', perf: 140.9 },
            { name: 'LongTermVN', perf: 132.5 },
            { name: 'Trader_VN92', perf: 128.6 }
        ],
        vnindex: 45.5
    }
};

export const performanceChartData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
        {
            label: 'Người dùng Trading Journal',
            data: [0, 2.5, 3.8, 6.2, 8.7, 9.9, 12.1, 13.6, 14.9, 16.5, 17.2, 18.4],
            borderColor: 'rgba(37, 99, 235, 1)',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: 'rgba(37, 99, 235, 1)',
            pointRadius: 5,
            pointHoverRadius: 7
        },
        {
            label: 'VN-Index',
            data: [0, 1.2, 2.1, 3.5, 4.8, 5.2, 6.1, 6.9, 7.5, 8.4, 9.3, 10.2],
            borderColor: 'rgba(107, 114, 128, 1)',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            borderDash: [5, 5],
            pointBackgroundColor: 'rgba(107, 114, 128, 1)',
            pointRadius: 5,
            pointHoverRadius: 7
        },
        {
            label: 'HNX-Index',
            data: [0, 1.4, 2.3, 3.1, 4.2, 5.0, 5.8, 6.3, 7.0, 8.1, 8.7, 9.6],
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            borderDash: [3, 3],
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointRadius: 5,
            pointHoverRadius: 7
        }
    ]
};
