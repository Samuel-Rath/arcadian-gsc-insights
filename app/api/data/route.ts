import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrBuild } from '@/lib/cache';
import { validateDateRange } from '@/lib/security';
import { 
  getDefaultDateRange, 
  filterByDateRange, 
  calculateSummary,
  calculateDateRangeDays,
  handleApiError 
} from '@/lib/api-utils';

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
    const daysDiff = calculateDateRangeDays(start, end);
    
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
    const errorResponse = handleApiError(error, 'GET /api/data');
    return NextResponse.json(
      { 
        error: errorResponse.error,
        details: errorResponse.details
      },
      { status: errorResponse.status }
    );
  }
}
