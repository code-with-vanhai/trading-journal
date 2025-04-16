import React, { useState, useEffect } from 'react';
import { Spinner } from './ui/Spinner';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const response = await fetch('/api/portfolio');
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        
        const data = await response.json();
        setPortfolio(data.portfolio);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded">
        Error: {error}
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        Bạn chưa có cổ phiếu nào trong danh mục đầu tư.
      </div>
    );
  }

  // Calculate total portfolio value
  const totalValue = portfolio.reduce((sum, position) => 
    sum + (position.quantity * position.avgCost), 0);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Danh Mục Đầu Tư</h2>
        <p className="text-sm text-gray-500">
          Tổng giá trị: {new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
          }).format(totalValue)}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã CP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số Lượng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá TB
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng Giá Trị
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Danh Mục
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {portfolio.map((position) => {
              const positionValue = position.quantity * position.avgCost;
              const percentage = (positionValue / totalValue) * 100;
              
              return (
                <tr key={position.ticker}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{position.ticker}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {position.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Intl.NumberFormat('vi-VN').format(position.avgCost.toFixed(0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Intl.NumberFormat('vi-VN').format(positionValue.toFixed(0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {percentage.toFixed(2)}%
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 