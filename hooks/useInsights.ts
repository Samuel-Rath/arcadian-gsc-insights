import { useState } from 'react';
import { InsightsResponse } from '@/types';

interface UseInsightsReturn {
  insights: InsightsResponse | null;
  loading: boolean;
  error: string | null;
  generateInsights: (startDate: string, endDate: string) => Promise<void>;
  clearInsights: () => void;
}

/**
 * Custom hook for managing insights generation.
 * Handles loading, error states, and insights caching.
 */
export function useInsights(): UseInsightsReturn {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      setError('Please select a date range first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
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
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearInsights = () => {
    setInsights(null);
    setError(null);
  };

  return {
    insights,
    loading,
    error,
    generateInsights,
    clearInsights,
  };
}
