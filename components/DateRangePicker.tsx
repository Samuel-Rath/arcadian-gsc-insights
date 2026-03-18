'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  onApply: (dateRange: { startDate: string; endDate: string }) => void;
  loading?: boolean;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '6mo', days: 180 },
  { label: '1yr', days: 365 },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DateRangePicker({
  onApply,
  loading = false,
  defaultStartDate = '',
  defaultEndDate = '',
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handleApply = () => {
    if (startDate && endDate && endDate < startDate) {
      setError('End date must be after start date');
      return;
    }
    setError('');
    onApply({ startDate, endDate });
  };

  const handlePreset = (days: number, idx: number) => {
    const start = daysAgo(days);
    const end = today();
    setStartDate(start);
    setEndDate(end);
    setError('');
    setActivePreset(idx);
    onApply({ startDate: start, endDate: end });
  };

  const handleManualChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setError('');
    setActivePreset(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Quick presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide mr-1">Quick:</span>
        {PRESETS.map(({ label, days }, idx) => (
          <button
            key={label}
            onClick={() => handlePreset(days, idx)}
            disabled={loading}
            className={`px-3 py-1 rounded-md text-xs font-medium border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              activePreset === idx
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <label htmlFor="start-date" className="text-sm font-medium text-slate-600 min-w-fit">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => handleManualChange(setStartDate, e.target.value)}
            disabled={loading}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm text-slate-800"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <label htmlFor="end-date" className="text-sm font-medium text-slate-600 min-w-fit">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => handleManualChange(setEndDate, e.target.value)}
            disabled={loading}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm text-slate-800"
          />
        </div>

        <button
          onClick={handleApply}
          disabled={loading || !startDate || !endDate}
          className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {loading ? 'Loading...' : 'Apply'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-md p-2" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
