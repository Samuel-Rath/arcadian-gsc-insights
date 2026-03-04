'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DailyAggregate } from '@/types';

interface ClicksChartProps {
  data: DailyAggregate[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyAggregate;
    dataKey: string;
    value: number;
    color: string;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 sm:p-4 border-2 border-blue-200 rounded-lg shadow-xl">
        <p className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{data.date}</p>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-semibold text-blue-600">Clicks:</span> {data.clicks.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-semibold text-purple-600">Impressions:</span> {data.impressions.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-semibold text-green-600">CTR:</span> {(data.ctr * 100).toFixed(2)}%
          </p>
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-semibold text-orange-600">Position:</span> {data.position.toFixed(1)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ClicksChart({ data }: ClicksChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    clicks: true,
    impressions: false,
    ctr: false,
    position: false,
  });

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 lg:h-96 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-600 font-medium text-sm sm:text-base">No data available for selected date range</p>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Try adjusting your date range</p>
      </div>
    );
  }

  // Normalize data for better visualization
  const normalizedData = data.map(item => ({
    ...item,
    ctrPercent: item.ctr * 100, // Convert to percentage for better scale
  }));

  const handleLegendClick = (dataKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey as keyof typeof prev],
    }));
  };

  return (
    <div className="w-full">
      {/* Metric Toggle Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleLegendClick('clicks')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
            visibleLines.clicks
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-500 border-2 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <span className="inline-block w-3 h-3 rounded-full bg-blue-600 mr-1.5"></span>
          Clicks
        </button>
        <button
          onClick={() => handleLegendClick('impressions')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
            visibleLines.impressions
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
              : 'bg-gray-100 text-gray-500 border-2 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <span className="inline-block w-3 h-3 rounded-full bg-purple-600 mr-1.5"></span>
          Impressions
        </button>
        <button
          onClick={() => handleLegendClick('ctr')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
            visibleLines.ctr
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-gray-100 text-gray-500 border-2 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <span className="inline-block w-3 h-3 rounded-full bg-green-600 mr-1.5"></span>
          CTR %
        </button>
        <button
          onClick={() => handleLegendClick('position')}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
            visibleLines.position
              ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
              : 'bg-gray-100 text-gray-500 border-2 border-gray-300 hover:bg-gray-200'
          }`}
        >
          <span className="inline-block w-3 h-3 rounded-full bg-orange-600 mr-1.5"></span>
          Position
        </button>
      </div>

      {/* Chart */}
      <div className="w-full h-64 sm:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={normalizedData}
            margin={{ 
              top: 5, 
              right: 10, 
              left: 0, 
              bottom: 5 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
              tick={{ fill: '#6b7280' }}
              tickMargin={8}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
              tick={{ fill: '#6b7280' }}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {visibleLines.clicks && (
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                name="Clicks"
              />
            )}
            
            {visibleLines.impressions && (
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#9333ea"
                strokeWidth={2.5}
                dot={{ fill: '#9333ea', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                name="Impressions"
              />
            )}
            
            {visibleLines.ctr && (
              <Line
                type="monotone"
                dataKey="ctrPercent"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ fill: '#16a34a', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                name="CTR %"
              />
            )}
            
            {visibleLines.position && (
              <Line
                type="monotone"
                dataKey="position"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={{ fill: '#ea580c', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                name="Position"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
