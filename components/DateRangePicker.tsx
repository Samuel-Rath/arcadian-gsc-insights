'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  onApply: (dateRange: { startDate: string; endDate: string }) => void;
  loading?: boolean;
  defaultStartDate?: string;
  defaultEndDate?: string;
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

  const handleApply = () => {
    // Validate date range
    if (startDate && endDate && endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    // Clear error and emit event
    setError('');
    onApply({ startDate, endDate });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <label htmlFor="start-date" className="text-sm font-medium text-slate-600 min-w-fit">
            Start Date:
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setError(''); }}
            disabled={loading}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm text-slate-800"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <label htmlFor="end-date" className="text-sm font-medium text-slate-600 min-w-fit">
            End Date:
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setError(''); }}
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
