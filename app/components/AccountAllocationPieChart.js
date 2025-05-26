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

export default function AccountAllocationPieChart({ accountAllocations }) {
  if (!accountAllocations || accountAllocations.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center h-96 flex flex-col justify-center">
        <h2 className="text-lg font-semibold mb-4">Phân Bổ Tài Khoản</h2>
        <p className="text-gray-500">Chưa có dữ liệu phân bổ tài khoản</p>
      </div>
    );
  }

  // Generate different colors for the pie chart slices
  const getAccountColors = (count) => {
    // Define a set of nice looking colors for account allocation
    const colors = [
      '#3B82F6', // blue-500 (for default account)
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#6366F1', // indigo-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
      '#84CC16', // lime-500
    ];

    return Array(count).fill().map((_, index) => colors[index % colors.length]);
  };

  // Prepare data for the chart
  const labels = accountAllocations.map(account => {
    const accountName = account.accountInfo?.name || 'Tài khoản không xác định';
    const brokerInfo = account.accountInfo?.brokerName ? ` (${account.accountInfo.brokerName})` : '';
    return accountName + brokerInfo;
  });
  
  const values = accountAllocations.map(account => account.totalValue);
  const backgroundColors = getAccountColors(accountAllocations.length);
  
  // Calculate total value for percentage calculations
  const totalValue = values.reduce((sum, value) => sum + value, 0);

  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          font: {
            size: 12
          },
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const accountName = accountAllocations[context.dataIndex].accountInfo?.name || 'N/A';
            const value = context.raw;
            const percent = ((value / totalValue) * 100).toFixed(1);
            const positionsCount = accountAllocations[context.dataIndex].positionsCount;
            
            return [
              `${accountName}`,
              `Giá trị: ${value.toLocaleString('vi-VN')} VNĐ`,
              `Tỷ trọng: ${percent}%`,
              `Số mã: ${positionsCount} cổ phiếu`
            ];
          }
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow h-96 flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-center flex-shrink-0">Phân Bổ Tài Khoản</h2>
      <div className="flex-1 min-h-0">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
} 