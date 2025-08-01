'use client';

import { useState, memo } from 'react';
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

function PortfolioPieChart({ holdings }) {
  const [hoveredTicker, setHoveredTicker] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center h-96 flex flex-col justify-center">
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

  // Helper function to truncate ticker to 4 characters
  const truncateTicker = (ticker) => {
    if (!ticker) return 'N/A';
    return ticker.length > 4 ? ticker.substring(0, 4) : ticker;
  };

  // Prepare data for the chart
  const fullTickers = holdings.map(holding => holding.ticker);
  const labels = fullTickers.map(ticker => truncateTicker(ticker));
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
          const fullTicker = fullTickers[index];
          setHoveredTicker(fullTicker);
          
          // Hide tooltip after 2 seconds
          setTimeout(() => {
            setHoveredTicker(null);
          }, 2000);
        },
        onHover: (event, legendItem, legend) => {
          if (legendItem) {
            const index = legendItem.index;
            const fullTicker = fullTickers[index];
            setHoveredTicker(fullTicker);
          } else {
            setHoveredTicker(null);
          }
        },
        onLeave: () => {
          setHoveredTicker(null);
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const ticker = fullTickers[context.dataIndex];
            const value = context.raw;
            const percent = ((value / marketValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${ticker}: ${value.toLocaleString('vi-VN')} VND (${percent}%)`;
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
    // Control chart sizing to match AccountAllocationPieChart
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
    setHoveredTicker(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow h-96 flex flex-col relative"
         onMouseMove={handleMouseMove} 
         onMouseLeave={handleMouseLeave}>
      <h2 className="text-lg font-semibold mb-4 text-center flex-shrink-0">Tỷ Trọng Danh Mục</h2>
      <div className="flex-1 min-h-0">
        <Pie data={data} options={options} />
      </div>
      
      {/* Custom Tooltip - follows mouse cursor */}
      {hoveredTicker && (
        <div 
          className="absolute z-50 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${Math.min(mousePosition.x + 10, 350)}px`, // Offset from cursor, prevent overflow
            top: `${Math.max(mousePosition.y - 35, 10)}px`, // Above cursor, stay within bounds
            transform: mousePosition.x > 250 ? 'translateX(-100%)' : 'translateX(0)'
          }}
        >
          {hoveredTicker}
          <div className={`absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 ${
            mousePosition.x > 250 ? 'right-3' : 'left-3'
          }`}></div>
        </div>
      )}
    </div>
  );
}

// Custom comparison function to prevent unnecessary re-renders
const areEqual = (prevProps, nextProps) => {
  // If both are empty or null, they're equal
  if (!prevProps.holdings && !nextProps.holdings) return true;
  if (!prevProps.holdings || !nextProps.holdings) return false;
  
  // If lengths are different, they're not equal
  if (prevProps.holdings.length !== nextProps.holdings.length) return false;
  
  // Compare each holding's key properties that affect the chart
  return prevProps.holdings.every((prevHolding, index) => {
    const nextHolding = nextProps.holdings[index];
    return (
      prevHolding.ticker === nextHolding.ticker &&
      prevHolding.marketValue === nextHolding.marketValue
    );
  });
};

export default memo(PortfolioPieChart, areEqual); 