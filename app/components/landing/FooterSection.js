import { IconLineChart, IconFacebook, IconTwitter, IconLinkedin, IconYoutube, IconMapPin, IconPhone, IconMail } from '../ui/Icon';

export default function FooterSection() {
    return (
        <footer className="bg-white/80 dark:bg-black/40 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 py-16 px-4 relative z-20">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div>
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                                <IconLineChart className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Trading Journal</h3>
                        </div>
                        <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Nền tảng nhật ký giao dịch chứng khoán thông minh hàng đầu Việt Nam, giúp bạn theo dõi, phân tích và tối ưu hóa chiến lược đầu tư.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 hover:-translate-y-1"><IconFacebook className="w-5 h-5" /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all duration-300 hover:-translate-y-1"><IconTwitter className="w-5 h-5" /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all duration-300 hover:-translate-y-1"><IconLinkedin className="w-5 h-5" /></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 hover:-translate-y-1"><IconYoutube className="w-5 h-5" /></a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
                            Sản phẩm
                            <span className="absolute -bottom-2 left-0 w-10 h-1 bg-blue-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Nhật ký giao dịch</a></li>
                            <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Phân tích hiệu suất</a></li>
                            <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Công cụ AI</a></li>
                            <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Ứng dụng di động</a></li>
                            <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>API tích hợp</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
                            Trợ giúp
                            <span className="absolute -bottom-2 left-0 w-10 h-1 bg-purple-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Hướng dẫn sử dụng</a></li>
                            <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Câu hỏi thường gặp</a></li>
                            <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Hỗ trợ kỹ thuật</a></li>
                            <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Cộng đồng</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 relative inline-block">
                            Liên hệ
                            <span className="absolute -bottom-2 left-0 w-10 h-1 bg-green-500 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start group">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
                                    <IconMapPin className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                                </div>
                                <span className="flex-1 pt-1">Tầng 16, Tòa nhà Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP.HCM</span>
                            </li>
                            <li className="flex items-center group">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mr-3 group-hover:bg-green-500/20 transition-colors">
                                    <IconPhone className="text-green-600 dark:text-green-400 w-4 h-4" />
                                </div>
                                <span className="pt-0.5">1800-123-456</span>
                            </li>
                            <li className="flex items-center group">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mr-3 group-hover:bg-purple-500/20 transition-colors">
                                    <IconMail className="text-purple-600 dark:text-purple-400 w-4 h-4" />
                                </div>
                                <span className="pt-0.5">support@tradingjournal.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm opacity-80 dark:opacity-60">
                    <p>© 2023 Trading Journal. Tất cả các quyền được bảo lưu.</p>
                    <div className="flex flex-wrap justify-center space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Điều khoản sử dụng</a>
                        <a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Pháp lý</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
