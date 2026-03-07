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
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Total Clicks
            </p>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{formatNumber(totalClicks)}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{derivedMetrics.clicksPerDay} per day</p>
            <div className="bg-blue-100 px-2 py-0.5 rounded-full">
              <p className="text-xs font-semibold text-blue-700">Primary</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-white p-4 sm:p-5 rounded-xl border border-purple-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Total Impressions
            </p>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">{formatNumber(totalImpressions)}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{derivedMetrics.impressionsPerDay} per day</p>
            <div className="bg-purple-100 px-2 py-0.5 rounded-full">
              <p className="text-xs font-semibold text-purple-700">Reach</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Average CTR
            </p>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">{formatPercentage(avgCtr)}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Click-through rate</p>
            <div className={`px-2 py-0.5 rounded-full ${avgCtr > 0.05 ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <p className={`text-xs font-semibold ${avgCtr > 0.05 ? 'text-green-700' : 'text-yellow-700'}`}>
                {avgCtr > 0.05 ? 'Good' : 'Low'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5 rounded-xl border border-orange-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Average Position
            </p>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1">{formatPosition(avgPosition)}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Search ranking</p>
            <div className={`px-2 py-0.5 rounded-full ${avgPosition <= 10 ? 'bg-green-100' : avgPosition <= 20 ? 'bg-blue-100' : 'bg-yellow-100'}`}>
              <p className={`text-xs font-semibold ${derivedMetrics.positionColor}`}>
                {derivedMetrics.positionQuality}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-medium text-gray-900">Date Range:</span>{' '}
            <span className="font-semibold text-blue-700">{startDate}</span>
            {' '}<span className="text-gray-500">to</span>{' '}
            <span className="font-semibold text-blue-700">{endDate}</span>
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span>Clicks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
              <span>Impressions</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <span>CTR</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-600"></div>
              <span>Position</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
