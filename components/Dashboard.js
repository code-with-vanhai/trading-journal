'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
  CartesianGrid,
  Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import PeriodSelector from './PeriodSelector';

export default function Dashboard() {
  const [period, setPeriod] = useState('all');
  const [summaryData, setSummaryData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [tickerData, setTickerData] = useState([]);
  const [loading, setLoading] = useState({
    summary: true,
    performance: true,
    tickers: true,
  });

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Fetch summary data
  useEffect(() => {
    async function fetchSummaryData() {
      try {
        setLoading(prev => ({ ...prev, summary: true }));
        const response = await fetch(`/api/analysis?type=summary&period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch summary data');
        
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      } finally {
        setLoading(prev => ({ ...prev, summary: false }));
      }
    }

    fetchSummaryData();
  }, [period]);

  // Fetch performance data
  useEffect(() => {
    async function fetchPerformanceData() {
      try {
        setLoading(prev => ({ ...prev, performance: true }));
        const response = await fetch(`/api/analysis?type=performance&period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch performance data');
        
        const data = await response.json();
        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(prev => ({ ...prev, performance: false }));
      }
    }

    fetchPerformanceData();
  }, [period]);

  // Fetch ticker breakdown data
  useEffect(() => {
    async function fetchTickerData() {
      try {
        setLoading(prev => ({ ...prev, tickers: true }));
        const response = await fetch(`/api/analysis?type=ticker-breakdown&period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch ticker data');
        
        const data = await response.json();
        setTickerData(data);
      } catch (error) {
        console.error('Error fetching ticker data:', error);
      } finally {
        setLoading(prev => ({ ...prev, tickers: false }));
      }
    }

    fetchTickerData();
  }, [period]);

  // Format tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Period Selector */}
      <div className="flex justify-end mb-4">
        <PeriodSelector onPeriodChange={handlePeriodChange} defaultPeriod={period} />
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {summaryData ? formatCurrency(summaryData.totalPnL) : '$0.00'}
                <span className="text-xs text-muted-foreground ml-1">
                  {summaryData && summaryData.roi ? `(${summaryData.roi.toFixed(2)}%)` : ''}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {summaryData ? `${summaryData.winRate.toFixed(1)}%` : '0%'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {summaryData ? summaryData.totalTrades : 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.summary ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {summaryData ? `${summaryData.winCount}/${summaryData.lossCount}` : '0/0'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="pnl">P&L by Trade</TabsTrigger>
          <TabsTrigger value="tickers">Ticker Breakdown</TabsTrigger>
        </TabsList>

        {/* Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Cumulative P&L over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading.performance ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cumulativePnL"
                      name="Cumulative P&L"
                      stroke="#8884d8"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L by Trade Chart */}
        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>P&L by Period</CardTitle>
              <CardDescription>Profit and loss per period</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading.performance ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="pnl"
                      name="P&L"
                      fill={(data) => (data > 0 ? "#4ade80" : "#f87171")}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No P&L data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticker Breakdown */}
        <TabsContent value="tickers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticker Performance</CardTitle>
              <CardDescription>P&L by ticker</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading.tickers ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : tickerData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tickerData.slice(0, 10)} // Show top 10 tickers
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="ticker" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="pnl"
                      name="P&L"
                      fill={(data) => (data > 0 ? "#4ade80" : "#f87171")}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No ticker data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Ticker Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ticker Breakdown</CardTitle>
          <CardDescription>Performance by ticker</CardDescription>
        </CardHeader>
        <CardContent>
          {loading.tickers ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tickerData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Ticker</th>
                    <th className="py-2 px-4 text-right">P&L</th>
                    <th className="py-2 px-4 text-right">Trades</th>
                    <th className="py-2 px-4 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {tickerData.map((ticker, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-left font-medium">{ticker.ticker}</td>
                      <td className={`py-2 px-4 text-right ${ticker.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(ticker.pnl)}
                      </td>
                      <td className="py-2 px-4 text-right">{ticker.tradeCount}</td>
                      <td className="py-2 px-4 text-right">{ticker.winRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              No ticker data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 