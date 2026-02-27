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
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide">Total Clicks</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{formatNumber(totalClicks)}</p>
        </div>
        
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide">Total Impressions</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{formatNumber(totalImpressions)}</p>
        </div>
        
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide">Average CTR</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{formatPercentage(avgCtr)}</p>
        </div>
        
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium uppercase tracking-wide">Average Position</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{formatPosition(avgPosition)}</p>
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
