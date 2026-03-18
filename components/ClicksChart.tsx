'use client';

import { useState, useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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

const CustomTooltip = memo(({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800 mb-2 text-sm">{data.date}</p>
        <div className="space-y-1">
          <p className="text-xs text-slate-600"><span className="font-medium text-indigo-600">Clicks:</span> {data.clicks.toLocaleString()}</p>
          <p className="text-xs text-slate-600"><span className="font-medium text-slate-500">Impressions:</span> {data.impressions.toLocaleString()}</p>
          <p className="text-xs text-slate-600"><span className="font-medium text-emerald-600">CTR:</span> {(data.ctr * 100).toFixed(2)}%</p>
          <p className="text-xs text-slate-600"><span className="font-medium text-amber-600">Position:</span> {data.position.toFixed(1)}</p>
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const ClicksChart = memo(({ data }: ClicksChartProps) => {
  const [visibleLines, setVisibleLines] = useState({
    clicks: true,
    impressions: false,
    ctr: false,
    position: false,
  });

  // Calculate average clicks for reference line
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const avg = data.reduce((sum, d) => sum + d.clicks, 0) / data.length;
    return { clicks: { avg } };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 lg:h-96 flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <svg className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-slate-500 font-medium text-sm sm:text-base">No data available for selected date range</p>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Try adjusting your date range</p>
      </div>
    );
  }

  // Normalize data for better visualization
  const normalizedData = data.map(item => ({
    ...item,
    ctrPercent: item.ctr * 100,
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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide mr-1">Show:</span>
        {[
          { key: 'clicks', label: 'Clicks', color: 'bg-indigo-500' },
          { key: 'impressions', label: 'Impressions', color: 'bg-slate-400' },
          { key: 'ctr', label: 'CTR %', color: 'bg-emerald-500' },
          { key: 'position', label: 'Position', color: 'bg-amber-500' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => handleLegendClick(key)}
            title={`Toggle ${label} line`}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 border ${
              visibleLines[key as keyof typeof visibleLines]
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${color}`}></span>
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-64 sm:h-80 lg:h-96 bg-white rounded-lg p-2 border border-slate-200">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalizedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} tick={{ fill: '#94a3b8' }} tickMargin={8} />
            <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '10px' }} tick={{ fill: '#94a3b8' }} tickMargin={8} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '10px' }} tick={{ fill: '#94a3b8' }} tickMargin={8} />
            <Tooltip content={<CustomTooltip />} />

            {stats && visibleLines.clicks && (
              <ReferenceLine yAxisId="left" y={stats.clicks.avg} stroke="#6366f1" strokeDasharray="5 5" opacity={0.4}
                label={{ value: 'Avg', position: 'right', fill: '#6366f1', fontSize: 10 }} />
            )}
            {visibleLines.clicks && (
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2}
                dot={{ fill: '#6366f1', r: 2, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} name="Clicks" />
            )}
            {visibleLines.impressions && (
              <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#94a3b8" strokeWidth={2}
                dot={{ fill: '#94a3b8', r: 2, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} name="Impressions" />
            )}
            {visibleLines.ctr && (
              <Line yAxisId="right" type="monotone" dataKey="ctrPercent" stroke="#10b981" strokeWidth={2}
                dot={{ fill: '#10b981', r: 2, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} name="CTR %" />
            )}
            {visibleLines.position && (
              <Line yAxisId="right" type="monotone" dataKey="position" stroke="#f59e0b" strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 2, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} name="Position" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

ClicksChart.displayName = 'ClicksChart';

export default ClicksChart;
