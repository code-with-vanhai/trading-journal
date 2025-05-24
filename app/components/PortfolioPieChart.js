'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from 'chart.js';

// Register the required components
ChartJS.register(ArcElement, Tooltip, Legend, Colors);

export default function PortfolioPieChart({ holdings }) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h2 className="text-lg font-semibold mb-4">Tỷ Trọng Danh Mục</h2>
        <p className="text-gray-500">Không có dữ liệu để hiển thị biểu đồ tỷ trọng</p>
      </div>
    );
  }

  // Generate different colors for the pie chart slices
  const getRandomColors = (count) => {
    // Define a set of nice looking colors for the chart
    const colors = [
      '#4299E1', // blue-500
      '#48BB78', // green-500
      '#F6AD55', // orange-400
      '#F56565', // red-500
      '#9F7AEA', // purple-500
      '#ED64A6', // pink-500
      '#667EEA', // indigo-500
      '#38B2AC', // teal-500
      '#ECC94B', // yellow-400
      '#FC8181', // red-400
    ];

    // If we have more holdings than colors, we'll recycle colors
    return Array(count).fill().map((_, index) => colors[index % colors.length]);
  };

  // Prepare data for the chart
  const labels = holdings.map(holding => holding.ticker);
  const marketValues = holdings.map(holding => holding.marketValue);
  const backgroundColors = getRandomColors(holdings.length);

  const data = {
    labels: labels,
    datasets: [
      {
        data: marketValues,
        backgroundColor: backgroundColors,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const ticker = context.label;
            const value = context.raw;
            const percent = ((value / marketValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${ticker}: ${value.toLocaleString('vi-VN')} VND (${percent}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-center">Tỷ Trọng Danh Mục</h2>
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
} 