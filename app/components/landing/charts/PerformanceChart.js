'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function PerformanceChart({ data }) {
    const options = {
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
                    label: function (context) {
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
                    callback: function (value) { return (value >= 0 ? '+' : '') + value + '%'; },
                    color: '#555'
                },
                title: { display: true, text: 'Hiệu suất tích lũy', color: '#555' }
            }
        }
    };

    return <Line data={data} options={options} />;
}
