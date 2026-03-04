import { NextRequest, NextResponse } from 'next/server';
import { getCacheOrBuild } from '@/lib/cache';
import { buildInsightsPayload } from '@/lib/insights-builder';
import { generateInsights } from '@/lib/claude-client';
import { 
  insightsRateLimiter, 
  getClientIp, 
  validateDateRange
} from '@/lib/security';
import { filterByDateRange, handleApiError } from '@/lib/api-utils';

/**
 * POST /api/insights
 * 
 * Generates AI-powered insights using Claude API.
 * 
 * **Flow:**
 * 1. Check rate limit (10 requests per minute per IP)
 * 2. Parse and validate request body (startDate, endDate)
 * 3. Validate date range (max 365 days)
 * 4. Get daily aggregates from cache
 * 5. Filter by date range
 * 6. Build compact insights payload (<30 KB)
 * 7. Call Claude API with retry logic
 * 8. Return structured insights
 * 
 * **Design Decision:**
 * This endpoint uses POST instead of GET because:
 * - It triggers an expensive external API call
 * - It's not idempotent (Claude may return different insights)
 * - POST semantics better match the "generate" action
 * 
 * **SECURITY MEASURES:**
 * - Rate limiting: 10 requests per minute per IP (prevents API abuse)
 * - Date range validation: Max 365 days (prevents excessive processing)
 * - Payload size validation: <30 KB (prevents API overload)
 * - Error message sanitization: No sensitive data leaked
 * - Timeout: 30 seconds (prevents hanging requests)
 * 
 * For production, consider adding:
 * - Authentication to track usage per user
 * - Request logging for abuse detection
 * - Insights caching per date range
 * - More sophisticated rate limiting (per user, not just IP)
 * 
 * Request Body:
 * - startDate: YYYY-MM-DD (required)
 * - endDate: YYYY-MM-DD (required)
 * 
 * Returns:
 * - insights: Array of insight strings
 * - anomalies: Array of anomaly objects
 * - opportunities: Array of opportunity strings
 * - questions: Array of question strings
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting to prevent API abuse
    const clientIp = getClientIp(request);
    const isAllowed = insightsRateLimiter.checkLimit(clientIp);
    
    if (!isAllowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please wait a moment and try again. Limit: 10 requests per minute.'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60', // Suggest retry after 60 seconds
          }
        }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { startDate, endDate } = body;
    
    // Validate required fields
    if (!startDate) {
      return NextResponse.json(
        { error: 'Missing required field: startDate' },
        { status: 400 }
      );
    }
    
    if (!endDate) {
      return NextResponse.json(
        { error: 'Missing required field: endDate' },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate date range to prevent abuse
    const dateRangeError = validateDateRange(startDate, endDate, 365);
    if (dateRangeError) {
      return NextResponse.json(
        { error: dateRangeError },
        { status: 400 }
      );
    }
    
    // Get daily aggregates from cache
    const aggregates = await getCacheOrBuild();
    
    // Filter by date range
    const filteredSeries = filterByDateRange(aggregates, startDate, endDate);
    
    // Check if we have data
    if (filteredSeries.length === 0) {
      return NextResponse.json(
        { error: 'No data available for the selected date range' },
        { status: 400 }
      );
    }
    
    // Build insights payload
    const payload = buildInsightsPayload(filteredSeries, startDate, endDate);
    
    // SECURITY: Validate payload size (should be < 30 KB)
    // This ensures we stay within Claude API limits and keep costs reasonable
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 30000) {
      console.warn(`Insights payload size is ${payloadSize} bytes, exceeding 30 KB target`);
      return NextResponse.json(
        { 
          error: 'Date range too large',
          details: 'The selected date range produces too much data. Please select a smaller range.'
        },
        { status: 400 }
      );
    }
    
    // Call Claude API
    const insights = await generateInsights(payload);
    
    // Return structured insights
    return NextResponse.json(insights);
    
  } catch (error) {
    const errorResponse = handleApiError(error, 'POST /api/insights');
    
    // Handle rate limiting specially
    if (errorResponse.status === 429) {
      return NextResponse.json(
        { 
          error: errorResponse.error,
          details: errorResponse.details
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorResponse.error,
        details: errorResponse.details
      },
      { status: errorResponse.status }
    );
  }
}
