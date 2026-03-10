import { useState, useCallback } from 'react';
import { DailyAggregate } from '@/types';
import { clientCache } from '@/lib/client-cache';

interface Summary {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  startDate: string;
  endDate: string;
}

interface UseDataReturn {
  chartData: DailyAggregate[];
  summary: Summary | null;
  loading: boolean;
  error: string | null;
  warning: string | null;
  isInitialLoad: boolean;
  fetchData: (start: string, end: string) => Promise<void>;
}

/**
 * Custom hook for managing data fetching and state.
 * Handles loading, error states, and client-side caching.
 */
export function useData(): UseDataReturn {
  const [chartData, setChartData] = useState<DailyAggregate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchData = useCallback(async (start: string, end: string) => {
    // Check cache first
    const cacheKey = `data-${start}-${end}`;
    const cached = clientCache.get<{ series: DailyAggregate[]; summary: Summary; warning?: string }>(cacheKey);

    if (cached) {
      setChartData(cached.series);
      setSummary(cached.summary);
      if (cached.warning) {
        setWarning(cached.warning);
      }
      setLoading(false);
      setIsInitialLoad(false);
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/data?start=${start}&end=${end}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      
      // Cache the response
      clientCache.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes
      
      setChartData(data.series);
      setSummary(data.summary);
      
      if (data.warning) {
        setWarning(data.warning);
      }
    } catch (err) {
      let errorMessage = 'An error occurred while loading data';
      
      if (err instanceof Error) {
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  return {
    chartData,
    summary,
    loading,
    error,
    warning,
    isInitialLoad,
    fetchData,
  };
}
