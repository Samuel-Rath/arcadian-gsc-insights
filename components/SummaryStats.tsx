'use client';

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

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Total Clicks
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{formatNumber(totalClicks)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-white p-4 sm:p-5 rounded-xl border border-purple-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Total Impressions
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{formatNumber(totalImpressions)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-white p-4 sm:p-5 rounded-xl border border-green-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Average CTR
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{formatPercentage(avgCtr)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-white p-4 sm:p-5 rounded-xl border border-orange-100 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Average Position
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">{formatPosition(avgPosition)}</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-xs sm:text-sm text-gray-700">
          <span className="font-medium text-gray-900">Date Range:</span>{' '}
          <span className="font-semibold text-blue-700">{startDate}</span>
          {' '}<span className="text-gray-500">to</span>{' '}
          <span className="font-semibold text-blue-700">{endDate}</span>
        </p>
      </div>
    </div>
  );
}
