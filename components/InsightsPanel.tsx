'use client';

import { InsightsResponse } from '@/types';

interface InsightsPanelProps {
  insights: InsightsResponse | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onRetry: () => void;
}

export default function InsightsPanel({
  insights,
  loading,
  error,
  onGenerate,
  onRetry,
}: InsightsPanelProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI Insights</h2>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {loading ? 'Generating insights...' : 'Generate Insights'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col sm:flex-row items-center justify-center py-10 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          <span className="mt-3 sm:mt-0 sm:ml-4 text-gray-600 font-medium text-sm sm:text-base">Generating insights...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start mb-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm sm:text-base text-red-800 font-medium">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!insights && !loading && !error && (
        <div className="text-center py-10 sm:py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-base sm:text-lg font-medium text-gray-700">No insights generated yet</p>
          <p className="text-xs sm:text-sm mt-2 text-gray-500">Click &quot;Generate Insights&quot; to analyze your data with AI</p>
        </div>
      )}

      {/* Insights Content */}
      {insights && !loading && !error && (
        <div className="space-y-6 sm:space-y-8">
          {/* General Insights */}
          {insights.insights && insights.insights.length > 0 && (
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Key Insights
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {insights.insights.map((insight, index) => (
                  <li key={index} className="flex items-start text-sm sm:text-base text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="text-blue-600 mr-2 mt-0.5 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Anomalies */}
          {insights.anomalies && insights.anomalies.length > 0 && (
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Anomalies Detected
              </h3>
              <div className="grid gap-3 sm:gap-4">
                {insights.anomalies.map((anomaly, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <span className="font-semibold text-orange-900 text-sm sm:text-base">
                        {anomaly.date}
                      </span>
                      <span className="text-xs sm:text-sm bg-orange-200 text-orange-800 px-2.5 py-1 rounded-full font-medium w-fit">
                        {anomaly.metric}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-orange-800 mb-2">
                      <strong className="font-semibold">Change:</strong> {anomaly.change}
                    </p>
                    <p className="text-xs sm:text-sm text-orange-700 leading-relaxed">
                      {anomaly.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {insights.opportunities && insights.opportunities.length > 0 && (
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Opportunities
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {insights.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start text-sm sm:text-base text-gray-700 bg-green-50 p-3 rounded-lg border border-green-100">
                    <span className="text-green-600 mr-2 mt-0.5 font-bold">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          {insights.questions && insights.questions.length > 0 && (
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 flex items-center">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Questions to Explore
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {insights.questions.map((question, index) => (
                  <li key={index} className="flex items-start text-sm sm:text-base text-gray-700 bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <span className="text-purple-600 mr-2 mt-0.5 font-bold">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
