'use client';

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function LeaderboardChart({ data, period }) {
    const userBarColors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
    ];
    const vnindexBarColor = 'rgba(107, 114, 128, 0.8)';

    const userLabels = data.users.map(item => item.name);
    const userData = data.users.map(item => item.perf);
    const vnindexPerf = data.vnindex;

    const labels = [...userLabels, 'VN-Index'];
    const chartDataValues = [...userData, vnindexPerf];
    const backgroundColors = [...userBarColors.slice(0, userData.length), vnindexBarColor];
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

    const periodText = {
        '1W': '1 Tuần',
        '1M': '1 Tháng',
        '3M': '3 Tháng',
        '6M': '6 Tháng',
        '1Y': '1 Năm'
    }[period];

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Lợi nhuận (%)',
            data: chartDataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4,
        }]
    };

    const options = {
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
                    label: function (context) {
                        const label = context.label;
                        const value = (context.parsed.x >= 0 ? '+' : '') + context.parsed.x.toFixed(1) + '%';
                        return `${label}: ${value}`;
                    },
                    title: function () { return null; }
                },
                padding: 10
            },
            title: {
                display: true,
                text: `Hiệu suất Top 4 Nhà đầu tư vs VN-Index (${periodText})`,
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
                    callback: function (value) { return (value >= 0 ? '+' : '') + value + '%'; },
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
    };

    return <Bar data={chartData} options={options} />;
}
