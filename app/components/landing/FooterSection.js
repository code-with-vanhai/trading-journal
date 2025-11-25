import { IconLineChart, IconFacebook, IconTwitter, IconLinkedin, IconYoutube, IconMapPin, IconPhone, IconMail } from '../ui/Icon';

export default function FooterSection() {
    return (
        <footer className="bg-gray-900 dark:bg-black text-gray-300 dark:text-gray-400 py-12 px-4">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center mb-4">
                            <IconLineChart className="w-8 h-8 mr-3 text-blue-500 dark:text-blue-400" />
                            <h3 className="text-xl font-bold text-white dark:text-gray-100">Trading Journal</h3>
                        </div>
                        <p className="mb-4 text-sm opacity-80 dark:opacity-70">Nền tảng nhật ký giao dịch chứng khoán thông minh hàng đầu Việt Nam, giúp bạn theo dõi, phân tích và tối ưu hóa chiến lược đầu tư.</p>
                        <div className="flex space-x-4 text-lg">
                            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition"><IconFacebook className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition"><IconTwitter className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition"><IconLinkedin className="w-5 h-5" /></a>
                            <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition"><IconYoutube className="w-5 h-5" /></a>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white dark:text-gray-100 mb-4">Sản phẩm</h4>
                        <ul className="space-y-2 text-sm opacity-80 dark:opacity-70">
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Nhật ký giao dịch</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Phân tích hiệu suất</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Công cụ AI</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Ứng dụng di động</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">API tích hợp</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white dark:text-gray-100 mb-4">Trợ giúp</h4>
                        <ul className="space-y-2 text-sm opacity-80 dark:opacity-70">
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Hướng dẫn sử dụng</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Câu hỏi thường gặp</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Hỗ trợ kỹ thuật</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Blog</a></li>
                            <li><a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Cộng đồng</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white dark:text-gray-100 mb-4">Liên hệ</h4>
                        <ul className="space-y-3 text-sm opacity-80 dark:opacity-70">
                            <li className="flex items-start">
                                <IconMapPin className="mt-1 mr-3 text-blue-500 dark:text-blue-400 w-5 h-5 flex-shrink-0" />
                                <span>Tầng 16, Tòa nhà Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP.HCM</span>
                            </li>
                            <li className="flex items-center">
                                <IconPhone className="mr-3 text-blue-500 dark:text-blue-400 w-5 h-5 flex-shrink-0" />
                                <span>1800-123-456</span>
                            </li>
                            <li className="flex items-center">
                                <IconMail className="mr-3 text-blue-500 dark:text-blue-400 w-5 h-5 flex-shrink-0" />
                                <span>support@tradingjournal.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 dark:border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm opacity-70 dark:opacity-60">
                    <p>© 2023 Trading Journal. Tất cả các quyền được bảo lưu.</p>
                    <div className="flex flex-wrap justify-center space-x-4 md:space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Điều khoản sử dụng</a>
                        <a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-white dark:hover:text-gray-200 transition">Pháp lý</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
