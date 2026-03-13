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
        <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-blue-100 font-medium uppercase tracking-wide flex items-center gap-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Total Clicks
              </p>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{formatNumber(totalClicks)}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-blue-100">{derivedMetrics.clicksPerDay} per day</p>
              <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <p className="text-xs font-semibold text-white">Primary</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-purple-100 font-medium uppercase tracking-wide flex items-center gap-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Total Impressions
              </p>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{formatNumber(totalImpressions)}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-purple-100">{derivedMetrics.impressionsPerDay} per day</p>
              <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <p className="text-xs font-semibold text-white">Reach</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative bg-gradient-to-br from-green-500 to-green-600 p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-green-100 font-medium uppercase tracking-wide flex items-center gap-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Average CTR
              </p>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{formatPercentage(avgCtr)}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-100">Click-through rate</p>
              <div className={`backdrop-blur-sm px-2 py-1 rounded-full ${avgCtr > 0.05 ? 'bg-white/20' : 'bg-yellow-400/30'}`}>
                <p className="text-xs font-semibold text-white">
                  {avgCtr > 0.05 ? 'Good' : 'Low'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative bg-gradient-to-br from-orange-500 to-orange-600 p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-orange-100 font-medium uppercase tracking-wide flex items-center gap-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Average Position
              </p>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{formatPosition(avgPosition)}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-orange-100">Search ranking</p>
              <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                <p className="text-xs font-semibold text-white">
                  {derivedMetrics.positionQuality}
                </p>
              </div>
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
