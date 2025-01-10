import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Token } from '../types';

interface TokenLiquidityChartProps {
  token: Token;
}

interface LiquidityRecord {
  timestamp: string;
  hpLiquidity: number;
  gpLiquidity: number;
  totalLiquidity: number;
  holderCount: number;
  lpHolderCount: number;
}

interface ChartDebugInfo {
  tableName: string;
  recordCount: number;
  highestLiquidity: number;
  lowestLiquidity: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export const TokenLiquidityChart: React.FC<TokenLiquidityChartProps> = ({ token }) => {
  const [historyData, setHistoryData] = useState<LiquidityRecord[]>([]);
  const [debugInfo, setDebugInfo] = useState<ChartDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:3002/api/tokens/${token.address}/history`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch history');
        }
        
        const data = await response.json();
        
        if (!data.history || data.history.length === 0) {
          throw new Error('No liquidity history available');
        }

        setDebugInfo(data.debug);
        setHistoryData(data.history);
        console.log('Chart data received:', data);
      } catch (err) {
        console.error('Error fetching history:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load liquidity history');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token.address) {
      fetchHistory();
    }
  }, [token.address]);

  // Format numbers for tooltip
  const formatLiquidity = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format holder counts for tooltip
  const formatHolders = (value: number) => {
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading liquidity history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug Info Panel */}
      <div className="w-full bg-gray-100 rounded-lg shadow-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Chart Debug Info</h3>
        {debugInfo ? (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Table:</span> {debugInfo.tableName}</p>
            <p><span className="font-medium">Records:</span> {debugInfo.recordCount}</p>
            <p><span className="font-medium">Highest Liquidity:</span> ${debugInfo.highestLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><span className="font-medium">Lowest Liquidity:</span> ${debugInfo.lowestLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><span className="font-medium">Time Range:</span> {debugInfo.timeRange.start} to {debugInfo.timeRange.end}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No debug info available</p>
        )}
      </div>

      {/* Liquidity History Chart */}
      <div className="w-full h-96 bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Liquidity History</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              angle={-45}
              textAnchor="end"
              height={60}
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
            />
            <YAxis 
              tickFormatter={formatLiquidity}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value: number) => formatLiquidity(value)}
              labelFormatter={(label: number) => formatTimestamp(label)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="hpLiquidity" 
              stroke="#8884d8" 
              name="Honeypot API Liquidity"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="gpLiquidity" 
              stroke="#82ca9d" 
              name="GoPlus Liquidity"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="totalLiquidity" 
              stroke="#ff7300" 
              name="Total Liquidity"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Holder History Chart */}
      <div className="w-full h-96 bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Holder History</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              angle={-45}
              textAnchor="end"
              height={60}
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
            />
            <YAxis 
              tickFormatter={formatHolders}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value: number) => formatHolders(value)}
              labelFormatter={(label: number) => formatTimestamp(label)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="holderCount" 
              stroke="#8884d8" 
              name="Total Holders"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="lpHolderCount" 
              stroke="#82ca9d" 
              name="LP Holders"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Holder Distribution Stats */}
      <div className="w-full h-64 bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Current Holder Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{token.gpHolderCount || 0}</div>
            <div className="text-sm text-gray-600">Total Holders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{token.gpLpHolderCount || 0}</div>
            <div className="text-sm text-gray-600">LP Holders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{token.gpOwnerPercent ? `${token.gpOwnerPercent.toFixed(2)}%` : '0%'}</div>
            <div className="text-sm text-gray-600">Owner %</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{token.gpCreatorPercent ? `${token.gpCreatorPercent.toFixed(2)}%` : '0%'}</div>
            <div className="text-sm text-gray-600">Creator %</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 