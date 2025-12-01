import Link from 'next/link';
import { IconCheckCircle } from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

export default function CTASection() {
    return (
        <section id="register" className="py-24 px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20 blur-3xl -z-10"></div>

            <div className="container mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="md:w-1/2">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                            Bắt đầu hành trình đầu tư <br/><span className="text-gradient">Hiệu Quả</span> ngay hôm nay
                        </h2>
                        <p className="text-xl mb-8 text-gray-600 dark:text-gray-300 font-light">
                            Đăng ký tài khoản miễn phí và khám phá cách Trading Journal có thể giúp bạn trở thành nhà đầu tư thành công hơn.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-8">
                            <div className="flex items-center text-green-600 dark:text-green-400 font-medium text-lg">
                                <IconCheckCircle className="mr-2 w-6 h-6" />
                                <span>Không cần thẻ tín dụng</span>
                            </div>
                            <div className="flex items-center text-green-600 dark:text-green-400 font-medium text-lg">
                                <IconCheckCircle className="mr-2 w-6 h-6" />
                                <span>Dùng thử miễn phí gói Cơ bản</span>
                            </div>
                        </div>
                    </div>
                    
                    <GlassCard className="md:w-1/3 w-full p-8 shadow-2xl border-t border-white/20">
                        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Tạo tài khoản miễn phí</h3>
                        <form>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-sm">Họ và tên</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    className="input-glass" 
                                    placeholder="Nhập họ và tên" 
                                    required 
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-sm">Email</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    className="input-glass" 
                                    placeholder="email@example.com" 
                                    required 
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-sm">Mật khẩu</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    className="input-glass" 
                                    placeholder="Tối thiểu 8 ký tự" 
                                    required 
                                    minLength={8} 
                                />
                                <p className="text-xs text-gray-500 mt-2">Mật khẩu cần ít nhất 8 ký tự.</p>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Đăng ký
                            </button>
                            <div className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
                                Đã có tài khoản? <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline font-medium transition-colors">Đăng nhập ngay</Link>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </section>
    );
}
