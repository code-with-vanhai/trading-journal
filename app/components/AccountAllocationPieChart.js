'use client';

import { useState } from 'react';
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
  const [hoveredAccount, setHoveredAccount] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  if (!accountAllocations || accountAllocations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center h-96 flex flex-col justify-center">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Phân Bổ Tài Khoản</h2>
        <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu phân bổ tài khoản</p>
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

  // Helper function to truncate account name to 4 characters
  const truncateAccountName = (name) => {
    if (!name) return 'N/A';
    return name.length > 4 ? name.substring(0, 4) : name;
  };

  // Prepare data for the chart - only use account names, no broker info
  const fullAccountNames = accountAllocations.map(account => 
    account.accountInfo?.name || 'Tài khoản không xác định'
  );
  
  const labels = fullAccountNames.map(name => truncateAccountName(name));
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
          padding: 15,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const backgroundColor = dataset.backgroundColor[i];
                
                return {
                  text: label,
                  fillStyle: backgroundColor,
                  strokeStyle: backgroundColor,
                  lineWidth: 0,
                  pointStyle: 'circle',
                  datasetIndex: 0,
                  index: i
                };
              });
            }
            return [];
          }
        },
        onClick: (event, legendItem, legend) => {
          // Custom legend click handler with tooltip
          const index = legendItem.index;
          const fullName = fullAccountNames[index];
          setHoveredAccount(fullName);
          
          // Hide tooltip after 2 seconds
          setTimeout(() => {
            setHoveredAccount(null);
          }, 2000);
        },
        onHover: (event, legendItem, legend) => {
          if (legendItem) {
            const index = legendItem.index;
            const fullName = fullAccountNames[index];
            setHoveredAccount(fullName);
          } else {
            setHoveredAccount(null);
          }
        },
        onLeave: () => {
          setHoveredAccount(null);
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const accountName = fullAccountNames[context.dataIndex];
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
    },
    // Ensure consistent chart diameter by controlling the radius
    elements: {
      arc: {
        borderWidth: 0
      }
    },
    // Control chart sizing to match PortfolioPieChart
    aspectRatio: 1,
    cutout: 0
  };

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({ 
      x: event.clientX - rect.left, 
      y: event.clientY - rect.top 
    });
  };

  const handleMouseLeave = () => {
    setHoveredAccount(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-96 flex flex-col relative"
         onMouseMove={handleMouseMove} 
         onMouseLeave={handleMouseLeave}>
      <h2 className="text-lg font-semibold mb-4 text-center flex-shrink-0 text-gray-900 dark:text-white">Phân Bổ Tài Khoản</h2>
      <div className="flex-1 min-h-0">
        <Pie data={data} options={options} />
      </div>
      
      {/* Custom Tooltip - follows mouse cursor */}
      {hoveredAccount && (
        <div 
          className="absolute z-50 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${Math.min(mousePosition.x + 10, 350)}px`, // Offset from cursor, prevent overflow
            top: `${Math.max(mousePosition.y - 35, 10)}px`, // Above cursor, stay within bounds
            transform: mousePosition.x > 250 ? 'translateX(-100%)' : 'translateX(0)'
          }}
        >
          {hoveredAccount}
          <div className={`absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 ${
            mousePosition.x > 250 ? 'right-3' : 'left-3'
          }`}></div>
        </div>
      )}
    </div>
  );
} 