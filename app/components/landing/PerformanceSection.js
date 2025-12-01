'use client';

import { useState } from 'react';
import LeaderboardChart from './charts/LeaderboardChart';
import PerformanceChart from './charts/PerformanceChart';
import { leaderboardData, performanceChartData } from '../../data/landing-page-data';
import { IconChevronRight, IconUser, IconAreaChart, IconRocket } from '../ui/Icon';
import GlassCard from '../ui/GlassCard';

export default function PerformanceSection() {
    const [currentTab, setCurrentTab] = useState('1W');

    const handleTabClick = (period) => {
        setCurrentTab(period);
    };

    return (
        <section id="performance-showcase" className="py-20 relative">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Leaderboard Section */}
                    <div id="leaderboard" className="flex flex-col">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Hiệu suất nhà đầu tư <span className="text-gradient">Hàng Đầu</span></h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Xem cách những nhà đầu tư giỏi nhất của chúng tôi vượt trội hơn thị trường.</p>
                        </div>

                        {/* Time Period Tabs */}
                        <div className="flex justify-center mb-8 space-x-2 overflow-x-auto">
                            {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                                <button
                                    key={period}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
                                        currentTab === period 
                                        ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-400 text-blue-600 dark:text-blue-400 shadow-lg' 
                                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                    onClick={() => handleTabClick(period)}
                                >
                                    {period === '1W' ? '1 Tuần' :
                                        period === '1M' ? '1 Tháng' :
                                            period === '3M' ? '3 Tháng' :
                                                period === '6M' ? '6 Tháng' : '1 Năm'}
                                </button>
                            ))}
                        </div>

                        {/* Leaderboard Chart */}
                        <GlassCard className="p-6 flex-grow flex flex-col">
                            <div className="chart-container relative h-[350px]">
                                <LeaderboardChart data={leaderboardData[currentTab]} period={currentTab} />
                            </div>
                            <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                                *Hiệu suất dựa trên tổng lợi nhuận phần trăm. Dữ liệu mô phỏng.
                            </div>
                            <div className="border-t border-gray-200 dark:border-white/10 px-4 py-3 text-right mt-6 -mx-6 -mb-6">
                                <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center justify-end transition">
                                    Xem bảng xếp hạng đầy đủ <IconChevronRight className="w-4 h-4 ml-2" />
                                </a>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Performance Comparison Section */}
                    <div id="performance" className="flex flex-col">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Hiệu quả trung bình <span className="text-gradient">Trading Journal</span></h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">So sánh hiệu suất trung bình của người dùng Trading Journal với VN-Index theo thời gian.</p>
                        </div>

                        <GlassCard className="p-6 flex-grow flex flex-col">
                            <div className="chart-container relative h-[350px]">
                                <PerformanceChart data={performanceChartData} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-500 flex items-center">
                                    <IconUser className="text-blue-600 dark:text-blue-400 w-8 h-8 mr-3" />
                                    <div>
                                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Người dùng TJ</h3>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">+18.4%</p>
                                    </div>
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 border-l-4 border-gray-500 flex items-center">
                                    <IconAreaChart className="text-gray-500 dark:text-gray-400 w-8 h-8 mr-3" />
                                    <div>
                                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">VN-Index</h3>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">+10.2%</p>
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-l-4 border-green-500 flex items-center">
                                    <IconRocket className="text-green-600 dark:text-green-400 w-8 h-8 mr-3" />
                                    <div>
                                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Vượt trội</h3>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">+8.2%</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                </div>
            </div>
        </section>
    );
}
