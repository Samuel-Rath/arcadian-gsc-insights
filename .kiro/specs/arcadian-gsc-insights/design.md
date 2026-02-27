# Design: Arcadian GSC Insights

## Overview
This design document outlines the architecture and implementation approach for a Next.js application that processes ~200 MB Google Search Console data and generates AI-powered insights using Claude API.

## Design Philosophy
The challenge intentionally leaves details open to evaluate architectural decision-making. This design prioritizes:
1. **Intelligent data handling** - Never send raw data to Claude or the browser
2. **Clean architecture** - Separation of concerns with reusable utilities
3. **User experience** - Fast, responsive UI with clear feedback
4. **Production-ready code** - TypeScript, error handling, edge cases

## Key Architectural Decisions

### Decision 1: Server-Side Streaming with Persistent Cache
**Problem:** 200 MB CSV is too large to load into browser or send to Claude.

**Solution:** 
- Stream-parse CSV on server using Node.js streams
- Build daily aggregates on first request
- Persist cache to disk (`.data-cache/daily-aggregates.json`)
- Subsequent requests use cached data

**Rationale:**
- Streaming prevents memory issues with large files
- Daily aggregation reduces 200 MB to ~few KB (one entry per date)
- Disk cache survives server restarts
- Fast response times after initial indexing

**Trade-offs:**
- First request is slow (indexing time)
- Cache invalidation needed if CSV changes
- Disk I/O dependency

### Decision 2: Weighted Aggregation for Accurate Metrics
**Problem:** Simple averaging of CTR and position across rows is mathematically incorrect.

**Solution:**
- Weight CTR and position by impressions when aggregating
- Formula: `weighted_metric = sum(metric × impressions) / sum(impressions)`
- Handle zero impressions safely

**Rationale:**
- A keyword with 1000 impressions should influence average more than one with 10
- Matches how Google Search Console calculates averages
- Provides accurate insights

### Decision 3: Smart Insights Payload (<30 KB)
**Problem:** Cannot send 200 MB or even full daily series to Claude.

**Solution:** Send compact statistical summary:
```typescript
{
  // Aggregates
  totalClicks, totalImpressions, avgCtr, avgPosition,
  
  // Trends
  percentChangeClicks, percentChangeImpressions,
  peakDay, troughDay,
  biggestSpike, biggestDrop,
  
  // Anomalies (z-score based)
  anomalyDays: [{ date, clicks, zScore }],
  
  // Downsampled series (max 60 points)
  dailySeries: [{ date, clicks, impressions, ctr, position }]
}
```

**Rationale:**
- Statistical summary captures patterns without raw data
- Z-score identifies outliers mathematically
- Downsampling preserves trends while reducing size
- Structured JSON helps Claude generate consistent output

**Trade-offs:**
- Loses granular keyword-level detail
- Claude can't see individual pages/keywords
- Good enough for high-level insights

### Decision 4: Recharts for Visualization
**Problem:** Need interactive chart with tooltips.

**Solution:** Use Recharts library with LineChart component.

**Rationale:**
- React-native, works seamlessly with Next.js
- Built-in responsive design and tooltips
- Declarative API matches React patterns
- Lightweight compared to alternatives

**Alternatives considered:**
- Chart.js: Requires wrapper, imperative API
- D3.js: Overkill for simple line chart
- Victory: Heavier bundle size

## System Architecture

### Component Hierarchy
```
Page (app/page.tsx)
├── DateRangePicker
│   ├── Start Date Input
│   ├── End Date Input
│   └── Apply Button
├── ClicksChart (Recharts LineChart)
├── SummaryStats
│   ├── Total Clicks
│   ├── Total Impressions
│   ├── Avg CTR
│   └── Avg Position
└── InsightsPanel
    ├── Generate Button
    ├── Insights Section
    ├── Anomalies Section
    ├── Opportunities Section
    └── Questions Section
```

### Data Flow
```
1. User loads page
   → GET /api/data?start=X&end=Y
   → Server checks cache
   → If no cache: stream parse CSV → build aggregates → save cache
   → If cache exists: read from disk
   → Filter by date range
   → Return series + summary

2. User clicks Apply
   → GET /api/data with new dates
   → Update chart and stats

3. User clicks Generate Insights
   → POST /api/insights { startDate, endDate }
   → Server builds compact payload
   → Call Claude API
   → Return structured insights
   → Render in UI
```

### Server Utilities

#### `lib/csv-parser.ts`
```typescript
// Stream parse CSV, skip duplicate headers
function streamParseCSV(filePath: string): AsyncIterable<CSVRow>
```

#### `lib/aggregator.ts`
```typescript
// Build daily aggregates from CSV stream
function buildDailyAggregates(rows: AsyncIterable<CSVRow>): Promise<DailyAggregate[]>

// Calculate weighted metrics
function calculateWeightedMetrics(rows: CSVRow[]): { ctr: number, position: number }
```

#### `lib/cache.ts`
```typescript
// Read/write cache to disk
function readCache(): Promise<DailyAggregate[] | null>
function writeCache(data: DailyAggregate[]): Promise<void>
function getCacheOrBuild(): Promise<DailyAggregate[]>
```

#### `lib/insights-builder.ts`
```typescript
// Build compact payload for Claude
function buildInsightsPayload(series: DailyAggregate[], startDate: string, endDate: string): InsightsPayload

// Calculate statistics
function calculateStats(series: DailyAggregate[]): Stats
function detectAnomalies(series: DailyAggregate[]): Anomaly[]
function downsampleSeries(series: DailyAggregate[], maxPoints: number): DailyAggregate[]
```

#### `lib/claude-client.ts`
```typescript
// Call Claude API with insights payload
function generateInsights(payload: InsightsPayload): Promise<InsightsResponse>
```

## API Specifications

### GET /api/data
**Query Parameters:**
- `start`: YYYY-MM-DD (optional, defaults to 30 days ago)
- `end`: YYYY-MM-DD (optional, defaults to today)

**Response:**
```typescript
{
  series: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
    startDate: string;
    endDate: string;
  };
}
```

**Error Cases:**
- 400: Invalid date format
- 400: End date before start date
- 500: Cache build failure
- 500: CSV file not found

### POST /api/insights
**Request Body:**
```typescript
{
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
```

**Response:**
```typescript
{
  insights: string[];
  anomalies: Array<{
    date: string;
    metric: string;
    change: string;
    explanation: string;
  }>;
  opportunities: string[];
  questions: string[];
}
```

**Error Cases:**
- 400: Invalid date format
- 400: Missing required fields
- 500: Claude API failure
- 500: Cache not available

## Data Models

### CSVRow (Raw)
```typescript
interface CSVRow {
  analytics_date: string;
  keyword: string;
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  analytics_type: string;
  device: string;
  // ... other metadata
}
```

### DailyAggregate (Cached)
```typescript
interface DailyAggregate {
  date: string; // YYYY-MM-DD
  clicks: number;
  impressions: number;
  ctr: number; // weighted by impressions
  position: number; // weighted by impressions
}
```

### InsightsPayload (Sent to Claude)
```typescript
interface InsightsPayload {
  dateRange: { start: string; end: string };
  totals: {
    clicks: number;
    impressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  trends: {
    clicksChange: number; // percentage
    impressionsChange: number; // percentage
    peakDay: { date: string; clicks: number };
    troughDay: { date: string; clicks: number };
    biggestSpike: { date: string; change: number };
    biggestDrop: { date: string; change: number };
  };
  anomalies: Array<{
    date: string;
    clicks: number;
    zScore: number;
  }>;
  series: DailyAggregate[]; // max 60 points
}
```

### InsightsResponse (From Claude)
```typescript
interface InsightsResponse {
  insights: string[];
  anomalies: Array<{
    date: string;
    metric: string;
    change: string;
    explanation: string;
  }>;
  opportunities: string[];
  questions: string[];
}
```

## Claude Integration Strategy

### Prompt Design
```
You are a Google Search Console data analyst. Analyze the following search performance data and provide insights.

Data Summary:
{JSON.stringify(insightsPayload, null, 2)}

Provide your analysis in the following JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "anomalies": [
    {
      "date": "YYYY-MM-DD",
      "metric": "clicks|impressions|ctr|position",
      "change": "description of change",
      "explanation": "why this is notable"
    }
  ],
  "opportunities": ["opportunity 1", "opportunity 2", ...],
  "questions": ["question 1", "question 2", ...]
}

Guidelines:
- insights: 3-5 high-level observations about trends and patterns
- anomalies: Days with unusual activity (use zScore > 2 as guide)
- opportunities: 2-4 actionable recommendations
- questions: 2-3 questions to investigate further

Respond with ONLY valid JSON, no markdown or explanation.
```

### API Configuration
- **Model:** `claude-3-5-sonnet-20241022` (configurable via `ANTHROPIC_MODEL` env var)
- **Max Tokens:** 2048
- **Temperature:** 0.7 (balance between creativity and consistency)
- **API Key:** From `ANTHROPIC_API_KEY` environment variable

### Error Handling
- Retry logic: 1 retry with exponential backoff
- Timeout: 30 seconds
- Fallback: Return generic error message to user
- Logging: Log full error for debugging

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Arcadian GSC Insights                              │
├─────────────────────────────────────────────────────┤
│  [Start Date] [End Date] [Apply] [Generate Insights]│
├─────────────────────────────────────────────────────┤
│                                                     │
│              Clicks Trend Chart                     │
│                                                     │
│              (Line chart with tooltips)             │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Total Clicks: X  |  Impressions: Y  |  CTR: Z%    │
│  Avg Position: N  |  Date Range: Start - End       │
├─────────────────────────────────────────────────────┤
│  AI Insights                                        │
│  • Insight 1                                        │
│  • Insight 2                                        │
│                                                     │
│  Anomalies                                          │
│  • Date: X - Metric: Y - Change: Z                  │
│                                                     │
│  Opportunities                                      │
│  • Opportunity 1                                    │
│                                                     │
│  Questions to Explore                               │
│  • Question 1                                       │
└─────────────────────────────────────────────────────┘
```

### Loading States
- **Initial page load:** Spinner with "Loading data..."
- **First-time indexing:** Progress message "Indexing CSV file (this may take a minute)..."
- **Applying filter:** Disable Apply button, show spinner
- **Generating insights:** Disable Generate button, show "Generating insights..."

### Error States
- **Invalid date range:** Red text below date pickers: "End date must be after start date"
- **Empty results:** Chart shows "No data available for selected date range"
- **API error:** Alert banner: "Failed to generate insights. Please try again."
- **Missing CSV:** Alert banner: "Data file not found. Please check configuration."

## Edge Cases and Validation

### CSV Parsing
- **Duplicate headers:** Skip rows where `analytics_date === "analytics_date"`
- **Empty values:** Treat empty strings as 0 for numeric fields
- **Invalid dates:** Skip rows with unparseable dates
- **Malformed rows:** Log warning and skip

### Date Range Validation
- **End before start:** Show error, don't make API call
- **Future dates:** Allow (user might have future-dated data)
- **Very large ranges:** Warn if > 365 days (performance consideration)
- **No data in range:** Return empty series with appropriate message

### Aggregation Edge Cases
- **Zero impressions:** Set weighted CTR/position to 0 (avoid division by zero)
- **Single day:** Handle gracefully (no trend calculation)
- **Missing dates:** Don't interpolate, show actual data points only

### Claude API Edge Cases
- **Rate limiting:** Implement exponential backoff
- **Invalid JSON response:** Parse with try-catch, return error
- **Timeout:** 30 second timeout, return error
- **Empty payload:** Validate before sending

## Performance Considerations

### Initial Indexing
- **Expected time:** 30-60 seconds for 200 MB CSV
- **Memory usage:** Streaming keeps memory < 100 MB
- **Optimization:** Could parallelize by date ranges if needed

### Cached Requests
- **Expected time:** < 100ms for date filtering
- **Memory usage:** Minimal (cache is ~few KB)
- **Optimization:** In-memory cache for repeated requests

### Chart Rendering
- **Max data points:** 365 (one year)
- **Performance:** Recharts handles this easily
- **Optimization:** Could virtualize if > 1000 points

### Claude API
- **Payload size:** < 30 KB (well under API limits)
- **Response time:** 2-5 seconds typical
- **Optimization:** Could cache insights per date range

## Testing Strategy

### Unit Tests
- CSV parser with duplicate headers
- Aggregation with zero impressions
- Weighted metric calculations
- Date range validation
- Anomaly detection (z-score)
- Downsampling algorithm

### Integration Tests
- API endpoints with mock cache
- Claude client with mock API
- End-to-end date filtering

### Manual Testing
- Load actual 200 MB CSV
- Test various date ranges
- Verify chart accuracy
- Test insights quality
- Check error states

## Deployment Considerations

### Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
CSV_FILE_PATH=/mnt/data/arckeywords.csv
NODE_ENV=production
```

### Build Configuration
- Next.js static optimization where possible
- API routes run on server
- Cache directory in `.gitignore`

### Production Checklist
- [ ] Environment variables configured
- [ ] CSV file accessible at specified path
- [ ] Cache directory writable
- [ ] Error logging configured
- [ ] API rate limits considered
- [ ] CORS configured if needed

## Future Enhancements (Out of Scope)

### Phase 2 Ideas
- Multiple chart types (impressions, CTR, position)
- Keyword-level drill-down
- Export insights to PDF
- Scheduled insight generation
- Comparison between date ranges
- Real-time CSV updates

### Scalability
- Database instead of JSON cache
- Redis for in-memory caching
- Background job for indexing
- Pagination for very large date ranges

## Correctness Properties

### Property 1: Cache Consistency
**Property:** Cached daily aggregates must match aggregates computed from raw CSV.

**Validation:** Compare cache output with fresh parse for sample date range.

### Property 2: Weighted Metric Accuracy
**Property:** Weighted CTR/position must equal Google Search Console calculation.

**Validation:** For any date, `weighted_ctr = sum(ctr × impressions) / sum(impressions)` matches manual calculation.

### Property 3: Date Range Filtering
**Property:** Filtered series must include only dates within [start, end] inclusive.

**Validation:** All returned dates satisfy `start <= date <= end`.

### Property 4: Insights Payload Size
**Property:** Insights payload must be < 30 KB.

**Validation:** `JSON.stringify(payload).length < 30000`.

### Property 5: No Data Loss in Downsampling
**Property:** Downsampled series must preserve peak and trough days.

**Validation:** Max and min clicks in downsampled series match original series.

## Comparison to Original Challenge

### What the Challenge Asked For
- Display data (1 trend chart)
- Filter by date range
- Generate AI insights with Claude
- Handle 200 MB intelligently
- Use Next.js, TypeScript, Claude API

### What This Design Delivers
✅ **All requirements met**
✅ **Architectural decisions documented**
✅ **Intelligent data handling** (streaming, caching, summarization)
✅ **Production-ready approach** (error handling, edge cases, validation)
✅ **Clear rationale** for each decision

### Key Differences from Prescriptive Requirements
The original challenge was intentionally open-ended. This design:
- Makes specific technology choices (Recharts, streaming, z-score)
- Documents the reasoning behind each choice
- Shows trade-off analysis
- Demonstrates software engineering thinking

The earlier requirements document was more prescriptive (telling exactly what to build), while this design document shows decision-making process (explaining why to build it this way).

## Time Breakdown Estimate

- **Setup & scaffolding:** 15 min
- **CSV parser & aggregator:** 30 min
- **Cache implementation:** 15 min
- **API endpoints:** 20 min
- **UI components:** 25 min
- **Claude integration:** 20 min
- **Testing & debugging:** 20 min
- **README & polish:** 15 min

**Total:** ~2 hours

This is achievable with AI coding assistants (Cursor/Claude) handling boilerplate while developer focuses on architecture and logic.
