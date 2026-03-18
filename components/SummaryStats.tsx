'use client';

import { useMemo } from 'react';

interface SummaryStatsProps {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  startDate: string;
  endDate: string;
}

export default function SummaryStats({
  totalClicks,
  totalImpressions,
  avgCtr,
  avgPosition,
  startDate,
  endDate,
}: SummaryStatsProps) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatPosition = (num: number): string => {
    return num.toFixed(1);
  };

  const derivedMetrics = useMemo(() => {
    const days = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
    return {
      clicksPerDay: (totalClicks / days).toFixed(0),
      impressionsPerDay: (totalImpressions / days).toFixed(0),
      positionQuality: avgPosition <= 10 ? 'Excellent' : avgPosition <= 20 ? 'Good' : avgPosition <= 30 ? 'Fair' : 'Needs Improvement',
    };
  }, [totalClicks, totalImpressions, avgPosition, startDate, endDate]);

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return null;
    const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }, [startDate, endDate]);

  return (
    <div className="w-full">
      {periodLabel && (
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {periodLabel}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {/* Clicks */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Clicks</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{formatNumber(totalClicks)}</p>
          <p className="text-xs text-slate-500">{derivedMetrics.clicksPerDay} per day</p>
        </div>

        {/* Impressions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Impressions</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{formatNumber(totalImpressions)}</p>
          <p className="text-xs text-slate-500">{derivedMetrics.impressionsPerDay} per day</p>
        </div>

        {/* CTR */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${avgCtr > 0.05 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {avgCtr > 0.05 ? 'Good' : 'Low'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{formatPercentage(avgCtr)}</p>
          <p className="text-xs text-slate-500">Avg click-through rate</p>
        </div>

        {/* Position */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${avgPosition <= 10 ? 'bg-emerald-50 text-emerald-700' : avgPosition <= 20 ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
              {derivedMetrics.positionQuality}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{formatPosition(avgPosition)}</p>
          <p className="text-xs text-slate-500">Avg search position</p>
        </div>
      </div>
    </div>
  );
}
