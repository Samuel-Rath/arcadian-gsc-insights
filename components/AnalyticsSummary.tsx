'use client';

import { useMemo, memo } from 'react';
import { DailyAggregate } from '@/types';

interface AnalyticsSummaryProps {
  data: DailyAggregate[];
}

const AnalyticsSummary = memo(({ data }: AnalyticsSummaryProps) => {
  const insights = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Calculate trends
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstHalfClicks = firstHalf.reduce((sum, d) => sum + d.clicks, 0);
    const secondHalfClicks = secondHalf.reduce((sum, d) => sum + d.clicks, 0);
    const clicksTrend = ((secondHalfClicks - firstHalfClicks) / firstHalfClicks) * 100;

    const firstHalfImpressions = firstHalf.reduce((sum, d) => sum + d.impressions, 0);
    const secondHalfImpressions = secondHalf.reduce((sum, d) => sum + d.impressions, 0);
    const impressionsTrend = ((secondHalfImpressions - firstHalfImpressions) / firstHalfImpressions) * 100;

    // Find best and worst days
    const sortedByClicks = [...data].sort((a, b) => b.clicks - a.clicks);
    const bestDay = sortedByClicks[0];
    const worstDay = sortedByClicks[sortedByClicks.length - 1];

    // Calculate volatility (standard deviation)
    const avgClicks = data.reduce((sum, d) => sum + d.clicks, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.clicks - avgClicks, 2), 0) / data.length;
    const volatility = Math.sqrt(variance);
    const volatilityPercent = (volatility / avgClicks) * 100;

    // CTR analysis
    const avgCtr = data.reduce((sum, d) => sum + d.ctr, 0) / data.length;
    const bestCtrDay = [...data].sort((a, b) => b.ctr - a.ctr)[0];

    return {
      clicksTrend,
      impressionsTrend,
      bestDay,
      worstDay,
      volatilityPercent,
      avgCtr: avgCtr * 100,
      bestCtrDay,
      isGrowing: clicksTrend > 0,
      isStable: volatilityPercent < 20,
    };
  }, [data]);

  if (!insights) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Quick Analytics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Performance Trend */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clicks Trend</h4>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${insights.isGrowing ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {insights.isGrowing ? '↑ Up' : '↓ Down'}
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${insights.isGrowing ? 'text-emerald-600' : 'text-red-600'}`}>
            {insights.isGrowing ? '+' : ''}{insights.clicksTrend.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">vs. first half of period</p>
        </div>

        {/* Best Day */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Best Day</h4>
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{insights.bestDay.clicks.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{insights.bestDay.date} · {(insights.bestDay.ctr * 100).toFixed(2)}% CTR</p>
        </div>

        {/* Stability */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Volatility</h4>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${insights.isStable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {insights.isStable ? 'Stable' : 'Variable'}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{insights.volatilityPercent.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">{insights.isStable ? 'Consistent performance' : 'High variability'}</p>
        </div>

        {/* CTR */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg CTR</h4>
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{insights.avgCtr.toFixed(2)}%</p>
          <p className="text-xs text-slate-500">Average click-through rate</p>
        </div>

        {/* Impressions Trend */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Visibility</h4>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${insights.impressionsTrend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {insights.impressionsTrend > 0 ? '↑ Growing' : '↓ Declining'}
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${insights.impressionsTrend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {insights.impressionsTrend > 0 ? '+' : ''}{insights.impressionsTrend.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">Impressions trend</p>
        </div>

        {/* Best CTR Day */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Best CTR Day</h4>
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{(insights.bestCtrDay.ctr * 100).toFixed(2)}%</p>
          <p className="text-xs text-slate-500">{insights.bestCtrDay.date} · {insights.bestCtrDay.clicks} clicks</p>
        </div>
      </div>
    </div>
  );
});

AnalyticsSummary.displayName = 'AnalyticsSummary';

export default AnalyticsSummary;
