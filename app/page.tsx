'use client';

import { useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import ClicksChart from '@/components/ClicksChart';
import SummaryStats from '@/components/SummaryStats';
import InsightsPanel from '@/components/InsightsPanel';
import FileUpload from '@/components/FileUpload';
import AnalyticsSummary from '@/components/AnalyticsSummary';
import ExportButton from '@/components/ExportButton';
import { useData } from '@/hooks/useData';
import { useInsights } from '@/hooks/useInsights';
import { useDateRange } from '@/hooks/useDateRange';

export default function Home() {
  // Custom hooks for state management
  const { dateRange, setDateRange } = useDateRange();
  const { 
    chartData, 
    summary, 
    loading: loadingData, 
    error, 
    warning, 
    isInitialLoad, 
    fetchData 
  } = useData();
  const { 
    insights, 
    loading: loadingInsights, 
    error: insightsError, 
    generateInsights,
    clearInsights 
  } = useInsights();

  // Initialize with default date range on mount
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchData(dateRange.startDate, dateRange.endDate);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Handle Apply button click
  const handleApplyDateRange = (newDateRange: { startDate: string; endDate: string }) => {
    setDateRange(newDateRange);
    clearInsights();
  };

  // Handle Generate Insights button click
  const handleGenerateInsights = () => {
    generateInsights(dateRange.startDate, dateRange.endDate);
  };

  // Handle file upload success
  const handleUploadSuccess = () => {
    fetchData(dateRange.startDate, dateRange.endDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <header className="mb-6 sm:mb-8 lg:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Arcadian GSC Insights
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Analyze your Google Search Console data with AI-powered insights
          </p>
          
          {/* Export Button */}
          {!isInitialLoad && !error && summary && (
            <div className="flex justify-center">
              <ExportButton
                dateRange={dateRange}
                summary={summary}
                chartData={chartData}
                insights={insights}
                chartElementId="performance-chart"
              />
            </div>
          )}
        </header>

        {/* Date Range Picker */}
        <div className="mb-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 border border-gray-100 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Select Date Range
          </h2>
          <DateRangePicker
            onApply={handleApplyDateRange}
            loading={loadingData}
            defaultStartDate={dateRange.startDate}
            defaultEndDate={dateRange.endDate}
          />
        </div>

        {/* File Upload */}
        <FileUpload onUploadSuccess={handleUploadSuccess} />

        {/* Loading State - Initial Indexing */}
        {isInitialLoad && loadingData && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-base sm:text-lg font-medium">Loading data...</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2 text-center px-4">
              Indexing CSV file (this may take a minute)...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loadingData && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm sm:text-base text-red-800 font-medium">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchData(dateRange.startDate, dateRange.endDate)}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        )}

        {/* Warning State */}
        {warning && !loadingData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm sm:text-base text-yellow-800 font-medium">{warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Only show when not in initial loading */}
        {!isInitialLoad && !error && (
          <>
            {/* Summary Statistics */}
            {summary && (
              <div className="mb-6">
                <SummaryStats
                  totalClicks={summary.totalClicks}
                  totalImpressions={summary.totalImpressions}
                  avgCtr={summary.avgCtr}
                  avgPosition={summary.avgPosition}
                  startDate={summary.startDate}
                  endDate={summary.endDate}
                />
              </div>
            )}

            {/* Analytics Summary */}
            {chartData.length > 0 && (
              <AnalyticsSummary data={chartData} />
            )}

            {/* Chart */}
            <div id="performance-chart" className="mb-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 lg:p-8 border border-gray-100 animate-fadeIn">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Trends
              </h2>
              {loadingData ? (
                <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ClicksChart data={chartData} />
              )}
            </div>

            {/* Insights Panel */}
            <InsightsPanel
              insights={insights}
              loading={loadingInsights}
              error={insightsError}
              onGenerate={handleGenerateInsights}
              onRetry={handleGenerateInsights}
            />
          </>
        )}
      </div>
    </div>
  );
}
