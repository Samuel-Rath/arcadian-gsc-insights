import { DailyAggregate } from '@/types';

/**
 * Shared utility functions for API routes.
 * Extracts common logic to reduce duplication.
 */

/**
 * Get default date range (last 30 days).
 */
export function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Filter aggregates by date range.
 * Uses string comparison which works correctly for YYYY-MM-DD format.
 */
export function filterByDateRange(
  aggregates: DailyAggregate[],
  start: string,
  end: string
): DailyAggregate[] {
  return aggregates.filter((agg) => {
    return agg.date >= start && agg.date <= end;
  });
}

/**
 * Calculate summary statistics from filtered aggregates.
 * Uses weighted averaging for CTR and position.
 */
export function calculateSummary(
  series: DailyAggregate[],
  startDate: string,
  endDate: string
) {
  if (series.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
      startDate,
      endDate,
    };
  }
  
  const totalClicks = series.reduce((sum, agg) => sum + agg.clicks, 0);
  const totalImpressions = series.reduce((sum, agg) => sum + agg.impressions, 0);
  
  // Calculate weighted average CTR and position
  let weightedCtrSum = 0;
  let weightedPositionSum = 0;
  
  for (const agg of series) {
    weightedCtrSum += agg.ctr * agg.impressions;
    weightedPositionSum += agg.position * agg.impressions;
  }
  
  const avgCtr = totalImpressions > 0 ? weightedCtrSum / totalImpressions : 0;
  const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;
  
  return {
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition,
    startDate,
    endDate,
  };
}

/**
 * Calculate date range in days.
 */
export function calculateDateRangeDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Handle common API errors with consistent error responses.
 */
export function handleApiError(error: unknown, context: string) {
  const originalError = (error as Error).message;
  console.error(`Error in ${context}:`, originalError);
  
  // Map common errors to user-friendly messages
  const errorMappings: Record<string, { error: string; details: string; status: number }> = {
    'CSV file not found': {
      error: 'Data source not found',
      details: 'The data file could not be located. Contact your administrator.',
      status: 500,
    },
    'Failed to build aggregates': {
      error: 'Failed to process CSV data',
      details: 'The file may be corrupted or in an invalid format.',
      status: 500,
    },
    'Failed to write cache': {
      error: 'Failed to cache data',
      details: 'Data was processed but could not be cached for future use.',
      status: 500,
    },
    'ANTHROPIC_API_KEY': {
      error: 'AI service is not configured properly',
      details: 'The AI service configuration is missing. Contact your administrator.',
      status: 500,
    },
    'aborted': {
      error: 'AI service request timed out',
      details: 'The request took too long to complete. Please try again with a smaller date range.',
      status: 500,
    },
    'timeout': {
      error: 'AI service request timed out',
      details: 'The request took too long to complete. Please try again with a smaller date range.',
      status: 500,
    },
    'rate_limit': {
      error: 'AI service rate limit exceeded',
      details: 'Too many requests to the AI service. Please wait a moment and try again.',
      status: 429,
    },
  };
  
  // Find matching error
  for (const [key, response] of Object.entries(errorMappings)) {
    if (originalError.includes(key)) {
      return response;
    }
  }
  
  // Default error response
  return {
    error: 'An unexpected error occurred',
    details: 'Please try again later.',
    status: 500,
  };
}
