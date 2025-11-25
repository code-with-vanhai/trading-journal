'use client';

import { useState } from 'react';
import LeaderboardChart from './charts/LeaderboardChart';
import PerformanceChart from './charts/PerformanceChart';
import { leaderboardData, performanceChartData } from '../../data/landing-page-data';
import { IconChevronRight, IconUser, IconAreaChart, IconRocket } from '../ui/Icon';

export default function PerformanceSection() {
    const [currentTab, setCurrentTab] = useState('1W');

    const handleTabClick = (period) => {
        setCurrentTab(period);
    };

    return (
        <section id="performance-showcase" className="py-16 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Leaderboard Section (Left Column on MD+) */}
                    <div id="leaderboard" className="flex flex-col">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Hiệu suất nhà đầu tư hàng đầu</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Xem cách những nhà đầu tư giỏi nhất của chúng tôi vượt trội hơn thị trường.</p>
                        </div>

                        {/* Time Period Tabs */}
                        <div className="flex justify-center mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                                <button
                                    key={period}
                                    className={`leaderboard-tab ${currentTab === period ? 'active' : ''} dark:text-gray-300 dark:hover:text-white dark:border-gray-700`}
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex-grow flex flex-col">
                            <div className="chart-container">
                                <LeaderboardChart data={leaderboardData[currentTab]} period={currentTab} />
                            </div>
                            <div className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
                                *Hiệu suất dựa trên tổng lợi nhuận phần trăm. Dữ liệu mô phỏng.
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 text-right mt-6 -mx-6 -mb-6">
                                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-end">Xem bảng xếp hạng đầy đủ <IconChevronRight className="w-4 h-4 ml-2" /></a>
                            </div>
                        </div>
                    </div>

                    {/* Performance Comparison Section (Right Column on MD+) */}
                    <div id="performance" className="flex flex-col">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Hiệu quả trung bình Trading Journal</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">So sánh hiệu suất trung bình của người dùng Trading Journal với VN-Index theo thời gian.</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex-grow flex flex-col">
                            <div className="chart-container">
                                <PerformanceChart data={performanceChartData} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-l-4 border-blue-600 dark:border-blue-500 flex items-center">
                                    <IconUser className="text-blue-700 dark:text-blue-400 w-8 h-8 mr-4" />
                                    <div>
                                        <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">Người dùng TJ</h3>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">+18.4%</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Hiệu suất trung bình (12 tháng)</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border-l-4 border-gray-600 dark:border-gray-500 flex items-center">
                                    <IconAreaChart className="text-gray-700 dark:text-gray-400 w-8 h-8 mr-4" />
                                    <div>
                                        <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">VN-Index</h3>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">+10.2%</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Hiệu suất (12 tháng)</p>
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border-l-4 border-green-600 dark:border-green-500 flex items-center">
                                    <IconRocket className="text-green-700 dark:text-green-400 w-8 h-8 mr-4" />
                                    <div>
                                        <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">Vượt trội</h3>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">+8.2%</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Hiệu suất vượt trội so với VN-Index</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
