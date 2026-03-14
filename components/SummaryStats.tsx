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

  // Calculate derived metrics for better insights
  const derivedMetrics = useMemo(() => {
    const clicksPerDay = totalClicks / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
    const impressionsPerDay = totalImpressions / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      clicksPerDay: clicksPerDay.toFixed(0),
      impressionsPerDay: impressionsPerDay.toFixed(0),
      clickThroughRate: avgCtr,
      positionQuality: avgPosition <= 10 ? 'Excellent' : avgPosition <= 20 ? 'Good' : avgPosition <= 30 ? 'Fair' : 'Needs Improvement',
      positionColor: avgPosition <= 10 ? 'text-green-600' : avgPosition <= 20 ? 'text-blue-600' : avgPosition <= 30 ? 'text-yellow-600' : 'text-red-600',
    };
  }, [totalClicks, totalImpressions, avgCtr, avgPosition, startDate, endDate]);

  return (
    <div className="w-full">
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

      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs sm:text-sm text-slate-600">
            <span className="font-medium text-slate-800">Period:</span>{' '}
            <span className="font-semibold text-indigo-700">{startDate}</span>
            {' '}<span className="text-slate-400">→</span>{' '}
            <span className="font-semibold text-indigo-700">{endDate}</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span>Clicks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span>Impressions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>CTR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Position</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
