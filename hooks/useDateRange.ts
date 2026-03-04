import { useState, useEffect } from 'react';

interface UseDateRangeReturn {
  dateRange: { startDate: string; endDate: string };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
}

/**
 * Custom hook for managing date range state.
 * Initializes with last 30 days by default.
 */
export function useDateRange(): UseDateRangeReturn {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    // Calculate default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  }, []);

  return {
    dateRange,
    setDateRange,
  };
}
