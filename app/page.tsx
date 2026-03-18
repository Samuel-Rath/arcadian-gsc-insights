'use client';

import { useEffect, lazy, Suspense, useCallback, useState } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import SummaryStats from '@/components/SummaryStats';
import FileUpload from '@/components/FileUpload';
import { useData } from '@/hooks/useData';
import { useInsights } from '@/hooks/useInsights';
import { useDateRange } from '@/hooks/useDateRange';

// Lazy load heavy components
const ClicksChart = lazy(() => import('@/components/ClicksChart'));
const InsightsPanel = lazy(() => import('@/components/InsightsPanel'));
const ExportButton = lazy(() => import('@/components/ExportButton'));

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export default function Home() {
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

  // Collapse upload section once data is loaded
  const [uploadOpen, setUploadOpen] = useState(true);

  useEffect(() => {
    if (summary) setUploadOpen(false);
  }, [summary]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchData(dateRange.startDate, dateRange.endDate);
    }
  }, [dateRange.startDate, dateRange.endDate, fetchData]);

  const handleApplyDateRange = useCallback((newDateRange: { startDate: string; endDate: string }) => {
    setDateRange(newDateRange);
    clearInsights();
  }, [setDateRange, clearInsights]);

  const handleGenerateInsights = useCallback(() => {
    generateInsights(dateRange.startDate, dateRange.endDate);
  }, [generateInsights, dateRange.startDate, dateRange.endDate]);

  const handleUploadSuccess = useCallback(() => {
    fetchData(dateRange.startDate, dateRange.endDate);
  }, [fetchData, dateRange.startDate, dateRange.endDate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">AI-Powered Analytics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Arcadian GSC Insights
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Upload your Google Search Console CSV, then explore and analyse your data
              </p>
            </div>
            {!isInitialLoad && !error && summary && (
              <div className="flex-shrink-0">
                <Suspense fallback={<ComponentLoader />}>
                  <ExportButton
                    dateRange={dateRange}
                    summary={summary}
                    chartData={chartData}
                    insights={insights}
                    chartElementId="performance-chart"
                  />
                </Suspense>
              </div>
            )}
          </div>
        </header>

        {/* Step 1 — Upload */}
        <div className="mb-4">
          <button
            onClick={() => setUploadOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 hover:text-indigo-600 transition-colors group"
          >
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Data
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${uploadOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {!uploadOpen && summary && (
              <span className="ml-1 text-xs font-normal text-emerald-600 normal-case tracking-normal">✓ Data loaded</span>
            )}
          </button>
          {uploadOpen && <FileUpload onUploadSuccess={handleUploadSuccess} />}
        </div>

        {/* Step 2 — Date Range */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 animate-fadeIn">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date Range
          </h2>
          <DateRangePicker
            onApply={handleApplyDateRange}
            loading={loadingData}
            defaultStartDate={dateRange.startDate}
            defaultEndDate={dateRange.endDate}
          />
        </div>

        {/* Initial load spinner */}
        {isInitialLoad && loadingData && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-700 text-base sm:text-lg font-medium">Loading data...</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 text-center px-4">
              Indexing CSV file — this may take a minute on first load
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loadingData && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-start mb-3">
              <svg className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm sm:text-base text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => fetchData(dateRange.startDate, dateRange.endDate)}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Warning */}
        {warning && !loadingData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm sm:text-base text-yellow-800 font-medium">{warning}</p>
            </div>
          </div>
        )}

        {/* Main content */}
        {!isInitialLoad && !error && (
          <>
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

            {/* Chart */}
            <div id="performance-chart" className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8 animate-fadeIn">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 sm:mb-6 flex items-center gap-2 uppercase tracking-wide">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Trends
              </h2>
              {loadingData ? (
                <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <Suspense fallback={<ComponentLoader />}>
                  <ClicksChart data={chartData} />
                </Suspense>
              )}
            </div>

            {/* AI Insights */}
            <Suspense fallback={<ComponentLoader />}>
              <InsightsPanel
                insights={insights}
                loading={loadingInsights}
                error={insightsError}
                onGenerate={handleGenerateInsights}
                onRetry={handleGenerateInsights}
              />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}

