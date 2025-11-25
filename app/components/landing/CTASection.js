import Link from 'next/link';
import { IconCheckCircle } from '../ui/Icon';

export default function CTASection() {
    return (
        <section id="register" className="py-16 gradient-bg dark:from-gray-900 dark:to-gray-800 px-4 text-white">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Bắt đầu hành trình đầu tư hiệu quả ngay hôm nay</h2>
                        <p className="text-lg mb-6 opacity-90 dark:opacity-80">Đăng ký tài khoản miễn phí và khám phá cách Trading Journal có thể giúp bạn trở thành nhà đầu tư thành công hơn.</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                            <div className="flex items-center text-green-300 dark:text-green-400 font-medium">
                                <IconCheckCircle className="mr-2 w-5 h-5" />
                                <span>Không cần thẻ tín dụng</span>
                            </div>
                            <div className="flex items-center text-green-300 dark:text-green-400 font-medium">
                                <IconCheckCircle className="mr-2 w-5 h-5" />
                                <span>Dùng thử miễn phí gói Cơ bản</span>
                            </div>
                        </div>
                    </div>
                    <div className="md:w-1/3 w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-gray-800 dark:text-gray-200">
                        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Tạo tài khoản miễn phí</h3>
                        <form>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Họ và tên</label>
                                <input type="text" id="name" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent" placeholder="Nhập họ và tên" required />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Email</label>
                                <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent" placeholder="email@example.com" required />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Mật khẩu</label>
                                <input type="password" id="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent" placeholder="Tối thiểu 8 ký tự" required minLength={8} />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mật khẩu cần ít nhất 8 ký tự.</p>
                            </div>
                            <button type="submit" className="w-full py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-bold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-md">Đăng ký</button>
                            <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
                                Đã có tài khoản? <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Đăng nhập ngay</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
