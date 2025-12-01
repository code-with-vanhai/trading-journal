'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { IconLineChart, IconBriefcase } from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

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
        <section className="py-24 px-4 relative overflow-hidden">
             {/* Background Elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/30 dark:bg-purple-500/30 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/30 dark:bg-blue-500/30 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="md:w-1/2 mb-12 md:mb-0 md:pr-8 fade-in-up">
                    {status === 'authenticated' ? (
                        <>
                            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
                                Chào mừng trở lại, <span className="text-gradient">{session?.user?.name || session?.user?.username || 'bạn'}</span>!
                            </h1>
                            <p className="text-xl mb-8 text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
                                Tiếp tục quản lý danh mục đầu tư và theo dõi giao dịch chứng khoán của bạn với Trading Journal.
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <Link href="/transactions" className="glass-button-primary flex items-center justify-center">
                                    <IconLineChart className="w-5 h-5 mr-2" />
                                    Xem Giao Dịch
                                </Link>
                                <Link href="/portfolio" className="glass-button flex items-center justify-center hover:text-blue-600 dark:hover:text-blue-300">
                                    <IconBriefcase className="w-5 h-5 mr-2" />
                                    Danh Mục Đầu Tư
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
                                Nhật ký giao dịch <span className="text-gradient block mt-2">Thông Minh</span>
                            </h1>
                            <p className="text-xl mb-10 text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed font-light">
                                Theo dõi, phân tích và tối ưu hóa chiến lược giao dịch chứng khoán của bạn với nền tảng hàng đầu Việt Nam.
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                                <Link href="/auth/signup" className="glass-button-primary text-center text-lg">
                                    Dùng thử miễn phí
                                </Link>
                                <a href="#features" className="glass-button text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-300 text-center text-lg">
                                    Tìm hiểu thêm
                                </a>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="md:w-1/2 flex justify-center perspective-1000">
                    <GlassCard className="p-2 relative group bg-white dark:bg-gray-900/50">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white dark:bg-gray-900/50 rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                            <img 
                                id="hero-dashboard-preview" 
                                src="/images/trading-dashboard-hero.jpg" 
                                alt="Giao diện Dashboard Trading Journal" 
                                className="w-full max-w-md md:max-w-full rounded-lg shadow-2xl hero-image-preview transform transition-transform duration-500 hover:scale-105" 
                            />
                            {/* Overlay reflection effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 dark:from-white/5 to-transparent pointer-events-none"></div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </section>
    );
}
