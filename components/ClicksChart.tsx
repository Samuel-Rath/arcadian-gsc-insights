'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyAggregate } from '@/types';

interface ClicksChartProps {
  data: DailyAggregate[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyAggregate;
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

  return (
    <div className="w-full h-64 sm:h-80 lg:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            label={{ 
              value: 'Clicks', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#374151' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
