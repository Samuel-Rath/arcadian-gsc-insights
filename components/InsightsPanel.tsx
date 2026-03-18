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
    <div className="border border-slate-200 rounded-xl p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Insights
          </h2>
          {insights && !loading && (
            <p className="text-xs text-slate-400 mt-0.5">Powered by Claude</p>
          )}
        </div>
        {/* Only show regenerate button when insights already exist */}
        {insights && !loading && (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg border border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col sm:flex-row items-center justify-center py-10 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="mt-3 sm:mt-0 sm:ml-4 text-slate-500 font-medium text-sm">Generating insights...</span>
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
        <div className="text-center py-10 sm:py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <svg className="mx-auto h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm font-medium text-slate-600 mb-1">No insights yet</p>
          <p className="text-xs text-slate-400 mb-4">Claude will analyse your data and surface trends, anomalies, and opportunities</p>
          <button
            onClick={onGenerate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-150"
          >
            Generate Insights
          </button>
        </div>
      )}

      {/* Insights Content */}
      {insights && !loading && !error && (
        <div className="space-y-6 sm:space-y-8">
          {/* General Insights */}
          {insights.insights && insights.insights.length > 0 && (
            <div>
                <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wide">
                <svg className="h-4 w-4 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Key Insights
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {insights.insights.map((insight, index) => (
                  <li key={index} className="flex items-start text-sm text-slate-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <span className="text-indigo-500 mr-2 mt-0.5 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Anomalies */}
          {insights.anomalies && insights.anomalies.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wide">
                <svg className="h-4 w-4 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Anomalies Detected
              </h3>
              <div className="grid gap-3 sm:gap-4">
                {insights.anomalies.map((anomaly, index) => (
                  <div key={index} className="border-l-4 border-amber-400 bg-amber-50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <span className="font-semibold text-slate-800 text-sm">{anomaly.date}</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium w-fit">{anomaly.metric}</span>
                    </div>
                    <p className="text-xs text-slate-700 mb-1"><span className="font-semibold">Change:</span> {anomaly.change}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{anomaly.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {insights.opportunities && insights.opportunities.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wide">
                <svg className="h-4 w-4 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Opportunities
              </h3>
              <ul className="space-y-2">
                {insights.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start text-sm text-slate-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-emerald-600 mr-2 mt-0.5 font-bold">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          {insights.questions && insights.questions.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center uppercase tracking-wide">
                <svg className="h-4 w-4 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Questions to Explore
              </h3>
              <ul className="space-y-2">
                {insights.questions.map((question, index) => (
                  <li key={index} className="flex items-start text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-indigo-500 mr-2 mt-0.5 font-bold">•</span>
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
