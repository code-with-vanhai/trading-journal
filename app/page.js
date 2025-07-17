'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [currentTab, setCurrentTab] = useState('1W');

  useEffect(() => {
    // Load scripts and initialize charts after component mounts
    const loadScripts = async () => {


      // Hero image fade-in
      const heroImage = document.getElementById('hero-dashboard-preview');
      if (heroImage) {
        setTimeout(() => {
          heroImage.classList.add('is-loaded');
        }, 300);
      }

      // Initialize charts if Chart.js is available
      if (typeof window !== 'undefined' && window.Chart) {
        initializeCharts();
      } else {
        // Try to load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
          initializeCharts();
        };
        document.head.appendChild(script);
      }
    };

    const initializeCharts = () => {
      // Sample data for leaderboard chart
      const leaderboardData = {
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

      const userBarColors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ];
      const vnindexBarColor = 'rgba(107, 114, 128, 0.8)';

      let leaderboardChart;
      let performanceChart;

      function updateLeaderboardChart(period) {
        const dataForPeriod = leaderboardData[period];
        const userLabels = dataForPeriod.users.map(item => item.name);
        const userData = dataForPeriod.users.map(item => item.perf);
        const vnindexPerf = dataForPeriod.vnindex;

        const labels = [...userLabels, 'VN-Index'];
        const data = [...userData, vnindexPerf];
        const backgroundColors = [...userBarColors.slice(0, userData.length), vnindexBarColor];
        const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

        if (leaderboardChart) {
          leaderboardChart.data.labels = labels;
          leaderboardChart.data.datasets[0].data = data;
          leaderboardChart.data.datasets[0].backgroundColor = backgroundColors;
          leaderboardChart.data.datasets[0].borderColor = borderColors;

          const periodText = {
            '1W': '1 Tuần',
            '1M': '1 Tháng',
            '3M': '3 Tháng',
            '6M': '6 Tháng',
            '1Y': '1 Năm'
          }[period];
          leaderboardChart.options.plugins.title.text = `Hiệu suất Top 4 Nhà đầu tư vs VN-Index (${periodText})`;

          leaderboardChart.update();
        }
      }

      // Performance Comparison Chart Setup
      const ctx = document.getElementById('performanceChart');
      if (ctx) {
        performanceChart = new window.Chart(ctx.getContext('2d'), {
          type: 'line',
          data: {
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
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: { size: 14, weight: '500' },
                  color: '#333'
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { weight: 'bold' },
                bodyFont: { weight: 'normal' },
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) { label += ': '; }
                    if (context.parsed.y !== null) {
                      label += (context.parsed.y >= 0 ? '+' : '') + context.parsed.y.toFixed(1) + '%';
                    }
                    return label;
                  }
                },
                padding: 10
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#555' },
                title: { display: true, text: 'Thời gian (Tháng)', color: '#555' }
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.08)' },
                ticks: {
                  callback: function(value) { return (value >= 0 ? '+' : '') + value + '%'; },
                  color: '#555'
                },
                title: { display: true, text: 'Hiệu suất tích lũy', color: '#555' }
              }
            }
          }
        });
      }

      // Leaderboard Chart Setup
      const leaderboardCtx = document.getElementById('leaderboardChart');
      if (leaderboardCtx) {
        leaderboardChart = new window.Chart(leaderboardCtx.getContext('2d'), {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: 'Lợi nhuận (%)',
              data: [],
              backgroundColor: [],
              borderColor: [],
              borderWidth: 1,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { weight: 'bold' },
                bodyFont: { weight: 'normal' },
                callbacks: {
                  label: function(context) {
                    const label = context.label;
                    const value = (context.parsed.x >= 0 ? '+' : '') + context.parsed.x.toFixed(1) + '%';
                    return `${label}: ${value}`;
                  },
                  title: function() { return null; }
                },
                padding: 10
              },
              title: {
                display: true,
                text: 'Hiệu suất Top 4 Nhà đầu tư vs VN-Index',
                font: { size: 16, weight: 'bold' },
                padding: { top: 10, bottom: 30 },
                color: '#333'
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.08)' },
                ticks: {
                  callback: function(value) { return (value >= 0 ? '+' : '') + value + '%'; },
                  color: '#555'
                },
                title: { display: true, text: 'Lợi nhuận (%)', color: '#555' }
              },
              y: {
                grid: { display: false },
                ticks: { color: '#555' },
                title: { display: true, text: 'Đối tượng so sánh', color: '#555' }
              }
            }
          }
        });
      }

      // Leaderboard Tab Functionality
      const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
      const defaultPeriod = '1W';

      function handleTabClick() {
        const period = this.dataset.period;
        leaderboardTabs.forEach(tab => tab.classList.remove('active'));
        this.classList.add('active');
        updateLeaderboardChart(period);
      }

      leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
      });

      // Find and activate the default tab on load
      const defaultTab = document.querySelector(`[data-period="${defaultPeriod}"]`);
      if (defaultTab) {
        defaultTab.classList.add('active');
      }
      // Initialize chart with default period data
      updateLeaderboardChart(defaultPeriod);
    };

    loadScripts();
  }, []);

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

        body {
          font-family: 'Roboto', sans-serif;
          color: #333;
          padding-top: 64px;
        }

        .gradient-bg {
          background: linear-gradient(90deg, #1a237e 0%, #0d47a1 100%);
        }

        .feature-card {
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        }

        .leaderboard-tab {
          padding: 0.75rem 1.5rem;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.3s ease, border-color 0.3s ease;
          font-weight: 500;
          color: #555;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .leaderboard-tab:hover {
          color: #3b82f6;
          border-color: #bfdbfe;
        }

        .leaderboard-tab.active {
          color: #2563eb;
          border-color: #2563eb;
          font-weight: 700;
        }

        .chart-container {
          height: 350px;
          position: relative;
        }



        .testimonial-card {
          position: relative;
          overflow: hidden;
        }

        .testimonial-card::before {
          content: '"';
          font-family: Georgia, serif;
          font-weight: bold;
          position: absolute;
          top: 10px;
          right: 15px;
          font-size: 3rem;
          color: rgba(59, 130, 246, 0.2);
          z-index: 1;
          line-height: 1;
        }

        .hero-image-preview {
          transition: opacity 0.5s ease-in-out;
          opacity: 0;
        }
        .hero-image-preview.is-loaded {
          opacity: 1;
        }
      `}</style>

      <div className="bg-gray-50">
        

        {/* Hero Section */}
        <section className="py-20 px-4 gradient-bg text-white min-h-screen flex items-center">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-12 md:mb-0 md:pr-8">
              {status === 'authenticated' ? (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Chào mừng trở lại, {session?.user?.name || session?.user?.username || 'bạn'}!</h1>
                  <p className="text-xl mb-8 opacity-90 max-w-lg">Tiếp tục quản lý danh mục đầu tư và theo dõi giao dịch chứng khoán của bạn với Trading Journal.</p>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link href="/transactions" className="cta-button bg-white text-blue-900 px-10 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-100 text-center">
                      <i className="fas fa-chart-line mr-2"></i>
                      Xem Giao Dịch
                    </Link>
                    <Link href="/portfolio" className="cta-button border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-900 transition text-center">
                      <i className="fas fa-briefcase mr-2"></i>
                      Danh Mục Đầu Tư
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Nhật ký giao dịch thông minh cho nhà đầu tư hiện đại</h1>
                  <p className="text-xl mb-8 opacity-90 max-w-lg">Theo dõi, phân tích và tối ưu hóa chiến lược giao dịch chứng khoán của bạn với nền tảng hàng đầu Việt Nam.</p>
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link href="/auth/signup" className="cta-button bg-white text-blue-900 px-10 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-100 text-center">Dùng thử miễn phí</Link>
                    <a href="#features" className="cta-button border-2 border-white text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-900 transition text-center">Tìm hiểu thêm</a>
                  </div>
                </>
              )}
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img id="hero-dashboard-preview" src="/images/trading-dashboard-hero.jpg" alt="Giao diện Dashboard Trading Journal với nhiều màn hình hiển thị biểu đồ giao dịch chứng khoán" className="w-full max-w-md md:max-w-full rounded-lg shadow-2xl hero-image-preview"/>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Tin cậy bởi hàng ngàn nhà đầu tư</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Những con số ấn tượng về sự phát triển và hiệu quả của Trading Journal.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4 flex flex-col items-center">
                <i className="fas fa-users text-blue-600 text-4xl mb-3"></i>
                <p className="text-4xl font-bold text-blue-900 mb-2">10,000+</p>
                <p className="text-gray-600">Nhà đầu tư tin dùng</p>
              </div>
              <div className="p-4 flex flex-col items-center">
                <i className="fas fa-exchange-alt text-blue-600 text-4xl mb-3"></i>
                <p className="text-4xl font-bold text-blue-900 mb-2">1.5 triệu</p>
                <p className="text-gray-600">Giao dịch được ghi nhận</p>
              </div>
              <div className="p-4 flex flex-col items-center">
                <i className="fas fa-chart-line text-blue-600 text-4xl mb-3"></i>
                <p className="text-4xl font-bold text-green-600 mb-2">25%<i className="fas fa-arrow-up ml-2 text-green-500 text-3xl"></i></p>
                <p className="text-gray-600">Tăng hiệu quả đầu tư</p>
              </div>
              <div className="p-4 flex flex-col items-center">
                <i className="fas fa-shield-alt text-blue-600 text-4xl mb-3"></i>
                <p className="text-4xl font-bold text-blue-900 mb-2">99.9%</p>
                <p className="text-gray-600">Thời gian hoạt động</p>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Showcase: Leaderboard Chart & Average Performance Side-by-Side */}
        <section id="performance-showcase" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Leaderboard Section (Left Column on MD+) */}
              <div id="leaderboard" className="flex flex-col">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Hiệu suất nhà đầu tư hàng đầu</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">Xem cách những nhà đầu tư giỏi nhất của chúng tôi vượt trội hơn thị trường.</p>
                </div>

                {/* Time Period Tabs */}
                <div className="flex justify-center mb-8 border-b border-gray-200 overflow-x-auto">
                  <button className="leaderboard-tab active" data-period="1W">1 Tuần</button>
                  <button className="leaderboard-tab" data-period="1M">1 Tháng</button>
                  <button className="leaderboard-tab" data-period="3M">3 Tháng</button>
                  <button className="leaderboard-tab" data-period="6M">6 Tháng</button>
                  <button className="leaderboard-tab" data-period="1Y">1 Năm</button>
                </div>

                {/* Leaderboard Chart */}
                <div className="bg-white rounded-lg shadow-lg p-6 flex-grow flex flex-col">
                  <div className="chart-container">
                    <canvas id="leaderboardChart"></canvas>
                  </div>
                  <div className="mt-6 text-center text-gray-600 text-sm">
                    *Hiệu suất dựa trên tổng lợi nhuận phần trăm. Dữ liệu mô phỏng.
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right mt-6 -mx-6 -mb-6">
                    <a href="#" className="text-blue-600 hover:underline font-medium flex items-center justify-end">Xem bảng xếp hạng đầy đủ <i className="fas fa-chevron-right text-xs ml-2"></i></a>
                  </div>
                </div>
              </div>

              {/* Performance Comparison Section (Right Column on MD+) */}
              <div id="performance" className="flex flex-col">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Hiệu quả trung bình Trading Journal</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">So sánh hiệu suất trung bình của người dùng Trading Journal với VN-Index theo thời gian.</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 flex-grow flex flex-col">
                  <div className="chart-container">
                    <canvas id="performanceChart"></canvas>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600 flex items-center">
                      <i className="fas fa-user-chart text-blue-700 text-3xl mr-4"></i>
                      <div>
                        <h3 className="font-bold text-xl mb-1">Người dùng TJ</h3>
                        <p className="text-3xl font-bold text-green-600 mb-1">+18.4%</p>
                        <p className="text-gray-600 text-sm">Hiệu suất trung bình (12 tháng)</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-600 flex items-center">
                      <i className="fas fa-chart-area text-gray-700 text-3xl mr-4"></i>
                      <div>
                        <h3 className="font-bold text-xl mb-1">VN-Index</h3>
                        <p className="text-3xl font-bold text-green-600 mb-1">+10.2%</p>
                        <p className="text-gray-600 text-sm">Hiệu suất (12 tháng)</p>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600 flex items-center">
                      <i className="fas fa-rocket text-green-700 text-3xl mr-4"></i>
                      <div>
                        <h3 className="font-bold text-xl mb-1">Vượt trội</h3>
                        <p className="text-3xl font-bold text-green-600 mb-1">+8.2%</p>
                        <p className="text-gray-600 text-sm">Hiệu suất vượt trội so với VN-Index</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-50 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Tính năng mạnh mẽ hỗ trợ bạn</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Trading Journal cung cấp các công cụ chuyên nghiệp giúp bạn theo dõi, phân tích và tối ưu hóa chiến lược giao dịch.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="feature-card bg-white p-6 rounded-lg shadow-lg">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-book text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Nhật ký giao dịch chi tiết</h3>
                <p className="text-gray-600">Ghi lại chi tiết mọi giao dịch, bao gồm lý do mua/bán, chiến lược và cảm xúc tại thời điểm giao dịch để rút kinh nghiệm.</p>
              </div>
              <div className="feature-card bg-white p-6 rounded-lg shadow-lg">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-chart-bar text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Phân tích hiệu suất sâu sắc</h3>
                <p className="text-gray-600">Đánh giá chi tiết hiệu suất giao dịch với các chỉ số quan trọng như tỷ lệ thắng, hệ số Sharpe và drawdown, giúp bạn hiểu rõ điểm mạnh/yếu.</p>
              </div>
              <div className="feature-card bg-white p-6 rounded-lg shadow-lg">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-robot text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">AI đề xuất chiến lược</h3>
                <p className="text-gray-600">Công nghệ AI phân tích lịch sử giao dịch của bạn và các yếu tố thị trường để đề xuất cải thiện, tối ưu hóa lợi nhuận.</p>
              </div>
              <div className="feature-card bg-white p-6 rounded-lg shadow-lg">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-sync-alt text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Đồng bộ giao dịch tự động</h3>
                <p className="text-gray-600">Kết nối trực tiếp với tài khoản chứng khoán của bạn để tự động cập nhật mọi giao dịch, tiết kiệm thời gian nhập liệu thủ công.</p>
              </div>
              <div className="feature-card bg-white p-6 rounded-lg shadow-lg">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-users text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Cộng đồng chia sẻ kiến thức</h3>
                <p className="text-gray-600">Tham gia cộng đồng nhà đầu tư năng động, chia sẻ kinh nghiệm, thảo luận chiến lược và học hỏi từ những người thành công.</p>
              </div>
              <div className="feature-card bg-white p-6 rounded-lg shadow-lg">
                <div className="text-blue-600 mb-4">
                  <i className="fas fa-mobile-alt text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-3">Ứng dụng di động tiện lợi</h3>
                <p className="text-gray-600">Theo dõi danh mục và nhập giao dịch mọi lúc mọi nơi với ứng dụng di động trên cả iOS và Android, không bỏ lỡ cơ hội nào.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-white px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Nhà đầu tư nói gì về chúng tôi</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Hàng ngàn nhà đầu tư đã cải thiện hiệu suất giao dịch của họ với Trading Journal.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="testimonial-card bg-gray-50 p-6 rounded-lg shadow">
                <div className="text-yellow-500 mb-4">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
                <p className="text-gray-700 mb-6 relative z-10">"Trading Journal đã giúp tôi nhận ra những sai lầm lặp đi lặp lại trong chiến lược giao dịch. Sau 6 tháng sử dụng, hiệu suất của tôi đã tăng 22%."</p>
                <div className="flex items-center relative z-10">
                  <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">NT</div>
                  <div>
                    <h4 className="font-bold">Nguyễn Thành</h4>
                    <p className="text-sm text-gray-600">Nhà đầu tư cá nhân, Hà Nội</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card bg-gray-50 p-6 rounded-lg shadow">
                <div className="text-yellow-500 mb-4">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
                <p className="text-gray-700 mb-6 relative z-10">"Tính năng phân tích hiệu suất so với thị trường giúp tôi hiểu rõ khi nào nên tích cực giao dịch và khi nào nên đứng ngoài thị trường."</p>
                <div className="flex items-center relative z-10">
                  <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">TL</div>
                  <div>
                    <h4 className="font-bold">Trần Lan</h4>
                    <p className="text-sm text-gray-600">Trader chuyên nghiệp, TP.HCM</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card bg-gray-50 p-6 rounded-lg shadow">
                <div className="text-yellow-500 mb-4">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
                <p className="text-gray-700 mb-6 relative z-10">"Tôi đã thử nhiều ứng dụng nhật ký giao dịch nhưng Trading Journal là toàn diện nhất. Cộng đồng nhà đầu tư ở đây cũng rất hữu ích và hỗ trợ."</p>
                <div className="flex items-center relative z-10">
                  <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">PH</div>
                  <div>
                    <h4 className="font-bold">Phạm Hương</h4>
                    <p className="text-sm text-gray-600">Nhà đầu tư dài hạn, Đà Nẵng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 bg-gray-50 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Gói dịch vụ phù hợp cho bạn</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Lựa chọn gói dịch vụ phù hợp với nhu cầu đầu tư của bạn.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Basic Plan */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold mb-2 text-center">Cơ bản</h3>
                  <p className="text-gray-600 mb-6 text-center">Dành cho nhà đầu tư mới bắt đầu</p>
                  <div className="mb-6 text-center">
                    <span className="text-4xl font-bold">Miễn phí</span>
                  </div>
                  <ul className="mb-8 space-y-3 text-gray-700">
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Nhật ký giao dịch cơ bản</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Theo dõi danh mục đầu tư</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Phân tích hiệu suất cơ bản</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Tối đa 10 giao dịch/tháng</li>
                    <li className="flex items-center text-gray-400"><i className="fas fa-times text-red-500 mr-3 text-lg"></i> Không giới hạn giao dịch</li>
                    <li className="flex items-center text-gray-400"><i className="fas fa-times text-red-500 mr-3 text-lg"></i> Phân tích AI nâng cao</li>
                    <li className="flex items-center text-gray-400"><i className="fas fa-times text-red-500 mr-3 text-lg"></i> Đồng bộ tự động</li>
                  </ul>
                </div>
                <div className="p-6 bg-gray-50">
                  <Link href="/auth/signup" className="w-full py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition block text-center">Đăng ký ngay</Link>
                </div>
              </div>

              {/* Professional Plan (Popular) */}
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-blue-600 h-full flex flex-col">
                <div className="bg-blue-600 text-white text-center py-2">
                  <p className="font-bold text-sm">Phổ biến nhất</p>
                </div>
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold mb-2 text-center text-blue-900">Chuyên nghiệp</h3>
                  <p className="text-gray-600 mb-6 text-center">Dành cho nhà đầu tư tích cực</p>
                  <div className="mb-6 text-center">
                    <span className="text-4xl font-bold text-blue-900">199.000đ</span>
                    <span className="text-gray-600">/tháng</span>
                  </div>
                  <ul className="mb-8 space-y-3 text-gray-700">
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Tất cả tính năng gói Cơ bản</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> <strong>Không giới hạn số giao dịch</strong></li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Phân tích AI nâng cao</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Đồng bộ với sàn giao dịch</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Cảnh báo thị trường</li>
                    <li className="flex items-center text-gray-400"><i className="fas fa-times text-red-500 mr-3 text-lg"></i> Quản lý nhiều tài khoản</li>
                  </ul>
                </div>
                <div className="p-6 bg-blue-600">
                  <Link href="/auth/signup" className="w-full py-3 bg-white text-blue-700 rounded-lg font-bold hover:bg-blue-100 transition block text-center text-lg shadow-md">Đăng ký ngay</Link>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
                <div className="p-6 flex-grow">
                  <h3 className="text-xl font-bold mb-2 text-center">Doanh nghiệp</h3>
                  <p className="text-gray-600 mb-6 text-center">Dành cho công ty và tổ chức</p>
                  <div className="mb-6 text-center">
                    <span className="text-4xl font-bold">499.000đ</span>
                    <span className="text-gray-600">/tháng</span>
                  </div>
                  <ul className="mb-8 space-y-3 text-gray-700">
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Tất cả tính năng gói Chuyên nghiệp</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Quản lý nhiều tài khoản</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Báo cáo tùy chỉnh</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> API tích hợp</li>
                    <li className="flex items-center"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Hỗ trợ riêng 24/7</li>
                    <li className="flex items-center text-gray-400"><i className="fas fa-check text-green-500 mr-3 text-lg"></i> Tính năng theo yêu cầu*</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-4 text-center">*Liên hệ để thảo luận chi tiết</p>
                </div>
                <div className="p-6 bg-gray-50">
                  <a href="mailto:support@tradingjournal.vn" className="w-full py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition block text-center">Liên hệ tư vấn</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action / Register Section */}
        <section id="register" className="py-16 gradient-bg px-4 text-white">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Bắt đầu hành trình đầu tư hiệu quả ngay hôm nay</h2>
                <p className="text-lg mb-6 opacity-90">Đăng ký tài khoản miễn phí và khám phá cách Trading Journal có thể giúp bạn trở thành nhà đầu tư thành công hơn.</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center text-green-300 font-medium">
                    <i className="fas fa-check-circle mr-2 text-xl"></i>
                    <span>Không cần thẻ tín dụng</span>
                  </div>
                  <div className="flex items-center text-green-300 font-medium">
                    <i className="fas fa-check-circle mr-2 text-xl"></i>
                    <span>Dùng thử miễn phí gói Cơ bản</span>
                  </div>
                </div>
              </div>
              <div className="md:w-1/3 w-full bg-white p-8 rounded-lg shadow-xl text-gray-800">
                <h3 className="text-2xl font-bold mb-6 text-center">Tạo tài khoản miễn phí</h3>
                <form>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Họ và tên</label>
                    <input type="text" id="name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="Nhập họ và tên" required/>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                    <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="email@example.com" required/>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
                    <input type="password" id="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="Tối thiểu 8 ký tự" required minLength={8}/>
                    <p className="text-sm text-gray-500 mt-1">Mật khẩu cần ít nhất 8 ký tự.</p>
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-md">Đăng ký</button>
                  <div className="mt-6 text-center text-gray-600">
                    Đã có tài khoản? <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">Đăng nhập ngay</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <i className="fas fa-chart-line text-3xl mr-3 text-blue-500"></i>
                  <h3 className="text-xl font-bold text-white">Trading Journal</h3>
                </div>
                <p className="mb-4 text-sm opacity-80">Nền tảng nhật ký giao dịch chứng khoán thông minh hàng đầu Việt Nam, giúp bạn theo dõi, phân tích và tối ưu hóa chiến lược đầu tư.</p>
                <div className="flex space-x-4 text-lg">
                  <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-facebook-f"></i></a>
                  <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-twitter"></i></a>
                  <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-linkedin-in"></i></a>
                  <a href="#" className="text-gray-400 hover:text-white transition"><i className="fab fa-youtube"></i></a>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Sản phẩm</h4>
                <ul className="space-y-2 text-sm opacity-80">
                  <li><a href="#" className="hover:text-white transition">Nhật ký giao dịch</a></li>
                  <li><a href="#" className="hover:text-white transition">Phân tích hiệu suất</a></li>
                  <li><a href="#" className="hover:text-white transition">Công cụ AI</a></li>
                  <li><a href="#" className="hover:text-white transition">Ứng dụng di động</a></li>
                  <li><a href="#" className="hover:text-white transition">API tích hợp</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Trợ giúp</h4>
                <ul className="space-y-2 text-sm opacity-80">
                  <li><a href="#" className="hover:text-white transition">Hướng dẫn sử dụng</a></li>
                  <li><a href="#" className="hover:text-white transition">Câu hỏi thường gặp</a></li>
                  <li><a href="#" className="hover:text-white transition">Hỗ trợ kỹ thuật</a></li>
                  <li><a href="#" className="hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition">Cộng đồng</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Liên hệ</h4>
                <ul className="space-y-3 text-sm opacity-80">
                  <li className="flex items-start">
                    <i className="fas fa-map-marker-alt mt-1 mr-3 text-blue-500 text-lg"></i>
                    <span>Tầng 16, Tòa nhà Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP.HCM</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-phone-alt mr-3 text-blue-500 text-lg"></i>
                    <span>1800-123-456</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-envelope mr-3 text-blue-500 text-lg"></i>
                    <span>support@tradingjournal.vn</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm opacity-70">
              <p>© 2023 Trading Journal. Tất cả các quyền được bảo lưu.</p>
              <div className="flex flex-wrap justify-center space-x-4 md:space-x-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition">Điều khoản sử dụng</a>
                <a href="#" className="hover:text-white transition">Chính sách bảo mật</a>
                <a href="#" className="hover:text-white transition">Pháp lý</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 