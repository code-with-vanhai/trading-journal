'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { IconLineChart, IconBriefcase } from '../ui/Icon';

export default function HeroSection() {
    const { data: session, status } = useSession();

    useEffect(() => {
        const heroImage = document.getElementById('hero-dashboard-preview');
        if (heroImage) {
            setTimeout(() => {
                heroImage.classList.add('is-loaded');
            }, 300);
        }
    }, []);

    return (
        <section className="py-20 px-4 gradient-bg dark:from-gray-900 dark:to-gray-800 text-white min-h-screen flex items-center">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
                <div className="md:w-1/2 mb-12 md:mb-0 md:pr-8">
                    {status === 'authenticated' ? (
                        <>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Chào mừng trở lại, {session?.user?.name || session?.user?.username || 'bạn'}!</h1>
                            <p className="text-xl mb-8 opacity-90 dark:opacity-80 max-w-lg">Tiếp tục quản lý danh mục đầu tư và theo dõi giao dịch chứng khoán của bạn với Trading Journal.</p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <Link href="/transactions" className="cta-button bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 px-10 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition text-center flex items-center justify-center">
                                    <IconLineChart className="w-5 h-5 mr-2" />
                                    Xem Giao Dịch
                                </Link>
                                <Link href="/portfolio" className="cta-button border-2 border-white dark:border-gray-300 text-white dark:text-gray-100 px-10 py-4 rounded-lg font-bold text-lg hover:bg-white dark:hover:bg-gray-800 hover:text-blue-900 dark:hover:text-blue-100 transition text-center flex items-center justify-center">
                                    <IconBriefcase className="w-5 h-5 mr-2" />
                                    Danh Mục Đầu Tư
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Nhật ký giao dịch thông minh cho nhà đầu tư hiện đại</h1>
                            <p className="text-xl mb-8 opacity-90 dark:opacity-80 max-w-lg">Theo dõi, phân tích và tối ưu hóa chiến lược giao dịch chứng khoán của bạn với nền tảng hàng đầu Việt Nam.</p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <Link href="/auth/signup" className="cta-button bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 px-10 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition text-center">Dùng thử miễn phí</Link>
                                <a href="#features" className="cta-button border-2 border-white dark:border-gray-300 text-white dark:text-gray-100 px-10 py-4 rounded-lg font-bold text-lg hover:bg-white dark:hover:bg-gray-800 hover:text-blue-900 dark:hover:text-blue-100 transition text-center">Tìm hiểu thêm</a>
                            </div>
                        </>
                    )}
                </div>
                <div className="md:w-1/2 flex justify-center">
                    <img id="hero-dashboard-preview" src="/images/trading-dashboard-hero.jpg" alt="Giao diện Dashboard Trading Journal với nhiều màn hình hiển thị biểu đồ giao dịch chứng khoán" className="w-full max-w-md md:max-w-full rounded-lg shadow-2xl hero-image-preview dark:opacity-90" />
                </div>
            </div>
        </section>
    );
}
