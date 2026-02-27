import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrBuild } from '@/lib/cache';
import { DailyAggregate } from '@/types';
import { validateDateRange, sanitizeErrorMessage } from '@/lib/security';

/**
 * Get default date range (last 30 days).
 * 
 * Used when user doesn't specify start/end parameters.
 * Provides a reasonable default view of recent data.
 */
function getDefaultDateRange(): { start: string; end: string } {
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
 * 
 * Uses string comparison which works correctly for YYYY-MM-DD format
 * because it's lexicographically sortable.
 */
function filterByDateRange(
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
 * 
 * Uses weighted averaging for CTR and position to ensure accuracy.
 * See aggregator.ts for detailed explanation of weighted metrics.
 */
function calculateSummary(
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
 * GET /api/data
 * 
 * Main endpoint for fetching search console data with date filtering.
 * 
 * **Flow:**
 * 1. Parse and validate query parameters (start, end dates)
 * 2. Validate date range (max 730 days for data endpoint)
 * 3. Get daily aggregates from cache (or build from CSV if first request)
 * 4. Filter aggregates by date range
 * 5. Calculate summary statistics
 * 6. Return series and summary
 * 
 * **Performance:**
 * - First request: ~60s (CSV parsing + caching)
 * - Subsequent requests: <100ms (cache read + filtering)
 * 
 * **SECURITY:**
 * - Date range validation prevents excessive processing
 * - Error message sanitization prevents information leakage
 * - Cache lock prevents DoS via concurrent rebuilds
 * 
 * Query Parameters:
 * - start: YYYY-MM-DD (optional, defaults to 30 days ago)
 * - end: YYYY-MM-DD (optional, defaults to today)
 * 
 * Returns:
 * - series: Array of daily aggregates
 * - summary: Summary statistics
 * - warning: Optional warning for large date ranges
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
    // Use defaults if params not provided
    const defaults = getDefaultDateRange();
    const start = startParam || defaults.start;
    const end = endParam || defaults.end;
    
    // SECURITY: Validate date range (max 730 days for data endpoint)
    // This is more lenient than insights endpoint (365 days) since
    // data retrieval is less expensive than Claude API calls
    const dateRangeError = validateDateRange(start, end, 730);
    if (dateRangeError) {
      return NextResponse.json(
        { error: dateRangeError },
        { status: 400 }
      );
    }
    
    // Warn if date range is very large (> 365 days)
    // Large ranges can impact chart performance and insights quality
    const startDate = new Date(start);
    const endDate = new Date(end);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let warning = undefined;
    if (daysDiff > 365) {
      warning = `Date range spans ${daysDiff} days (> 365 days). Large date ranges may impact performance and insights quality.`;
      console.warn(warning);
    }
    
    // Get daily aggregates from cache or build from CSV
    const aggregates = await getCacheOrBuild();
    
    // Filter by date range
    const series = filterByDateRange(aggregates, start, end);
    
    // Calculate summary statistics
    const summary = calculateSummary(series, start, end);
    
    // Return response
    return NextResponse.json({
      series,
      summary,
      ...(warning && { warning }),
    });
    
  } catch (error) {
    // SECURITY: Sanitize error messages before logging
    const originalError = (error as Error).message;
    const sanitizedError = sanitizeErrorMessage(originalError);
    console.error('Error in GET /api/data:', sanitizedError);
    
    // Handle specific error messages
    const errorMessage = originalError;
    
    if (errorMessage.includes('CSV file not found')) {
      return NextResponse.json(
        { 
          error: 'CSV file not found. Please ensure the data file exists at the configured path.',
          details: 'The application could not locate the CSV data file. Contact your administrator.'
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('Failed to build aggregates')) {
      return NextResponse.json(
        { 
          error: 'Failed to process CSV data. The file may be corrupted or in an invalid format.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('Failed to write cache')) {
      return NextResponse.json(
        { 
          error: 'Failed to cache data. The application may not have write permissions.',
          details: 'Data was processed but could not be cached for future use.'
        },
        { status: 500 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while loading data.',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
