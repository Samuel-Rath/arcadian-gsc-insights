'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from '@/components/DateRangePicker';
import ClicksChart from '@/components/ClicksChart';
import SummaryStats from '@/components/SummaryStats';
import InsightsPanel from '@/components/InsightsPanel';
import FileUpload from '@/components/FileUpload';
import { DailyAggregate, InsightsResponse } from '@/types';

interface Summary {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  startDate: string;
  endDate: string;
}

export default function Home() {
  // State management
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [chartData, setChartData] = useState<DailyAggregate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  // Calculate default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  // Fetch data from API
  const fetchData = async (start: string, end: string) => {
    setLoadingData(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(
        `/api/data?start=${start}&end=${end}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      setChartData(data.series);
      setSummary(data.summary);
      
      // Set warning if present
      if (data.warning) {
        setWarning(data.warning);
      }
    } catch (err) {
      let errorMessage = 'An error occurred while loading data';
      
      if (err instanceof Error) {
        // Network errors (fetch failed)
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
      setIsInitialLoad(false);
    }
  };

  // Fetch insights from API
  const fetchInsights = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setInsightsError('Please select a date range first');
      return;
    }

    setLoadingInsights(true);
    setInsightsError(null);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      let errorMessage = 'An error occurred while generating insights';
      
      if (err instanceof Error) {
        // Network errors (fetch failed)
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setInsightsError(errorMessage);
      console.error('Error fetching insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Initialize with default date range on mount
  useEffect(() => {
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
    fetchData(defaultRange.startDate, defaultRange.endDate);
  }, []);

  // Handle Apply button click
  const handleApplyDateRange = (newDateRange: { startDate: string; endDate: string }) => {
    setDateRange(newDateRange);
    fetchData(newDateRange.startDate, newDateRange.endDate);
    // Clear insights and warning when date range changes
    setInsights(null);
    setWarning(null);
  };

  // Handle Generate Insights button click
  const handleGenerateInsights = () => {
    fetchInsights();
  };

  // Handle retry for insights
  const handleRetryInsights = () => {
    fetchInsights();
  };

  // Handle file upload success
  const handleUploadSuccess = () => {
    // Reload data after file upload
    fetchData(dateRange.startDate, dateRange.endDate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <header className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Arcadian GSC Insights
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Analyze your Google Search Console data with AI-powered insights
          </p>
        </header>

        {/* Date Range Picker */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
            {/* Chart */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Clicks Trend
              </h2>
              {loadingData ? (
                <div className="flex items-center justify-center h-64 sm:h-80 lg:h-96">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ClicksChart data={chartData} />
              )}
            </div>

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

            {/* Insights Panel */}
            <InsightsPanel
              insights={insights}
              loading={loadingInsights}
              error={insightsError}
              onGenerate={handleGenerateInsights}
              onRetry={handleRetryInsights}
            />
          </>
        )}
      </div>
    </div>
  );
}
