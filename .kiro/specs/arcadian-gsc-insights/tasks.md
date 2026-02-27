# Tasks: Arcadian GSC Insights

## 1. Project Setup and Scaffolding
- [x] 1.1 Initialize Next.js project with TypeScript
  - Run `npx create-next-app@latest arcadian-gsc-insights --typescript --app --no-src-dir`
  - Configure TypeScript strict mode in tsconfig.json
  - Set up .gitignore to exclude .data-cache/ and .env.local
- [x] 1.2 Install dependencies
  - Install Recharts: `npm install recharts`
  - Install Anthropic SDK: `npm install @anthropic-ai/sdk`
  - Install CSV parser: `npm install csv-parse`
  - Install date utilities: `npm install date-fns`
- [x] 1.3 Create project structure
  - Create `lib/` directory for server utilities
  - Create `components/` directory for React components
  - Create `.data-cache/` directory for cache storage
  - Create `.env.local` with placeholder for ANTHROPIC_API_KEY
- [x] 1.4 Set up TypeScript types
  - Create `types/index.ts` with interfaces: CSVRow, DailyAggregate, InsightsPayload, InsightsResponse

## 2. Server-Side CSV Processing
- [x] 2.1 Implement CSV stream parser (`lib/csv-parser.ts`)
  - Create async generator function to stream parse CSV
  - Skip rows where analytics_date equals "analytics_date" (duplicate headers)
  - Handle empty/invalid values safely (treat as 0)
  - Parse numeric fields: clicks, impressions, ctr, position
- [x] 2.2 Implement aggregator (`lib/aggregator.ts`)
  - Create function to build daily aggregates from CSV stream
  - Group rows by analytics_date
  - Calculate clicks_sum and impressions_sum per date
  - Calculate weighted CTR: sum(ctr × impressions) / sum(impressions)
  - Calculate weighted position: sum(position × impressions) / sum(impressions)
  - Handle zero impressions edge case (set weighted values to 0)
- [x] 2.3 Implement cache manager (`lib/cache.ts`)
  - Create readCache() to read from `.data-cache/daily-aggregates.json`
  - Create writeCache() to write aggregates to disk
  - Create getCacheOrBuild() that checks cache, builds if missing
  - Handle file not found, corrupted JSON, and write errors

## 3. API Endpoints
- [x] 3.1 Implement GET /api/data endpoint (`app/api/data/route.ts`)
  - Accept query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
  - Default to last 30 days if params missing
  - Validate date format and range (end >= start)
  - Call getCacheOrBuild() to get daily aggregates
  - Filter aggregates by date range
  - Calculate summary stats: totalClicks, totalImpressions, avgCtr, avgPosition
  - Return JSON with series and summary
  - Handle errors: 400 for invalid dates, 500 for cache/CSV errors
- [x] 3.2 Implement POST /api/insights endpoint (`app/api/insights/route.ts`)
  - Accept body: { startDate, endDate }
  - Validate required fields and date format
  - Get filtered series from cache
  - Build insights payload using insights-builder
  - Call Claude API using claude-client
  - Return structured insights JSON
  - Handle errors: 400 for validation, 500 for API failures

## 4. Insights Builder and Claude Integration
- [x] 4.1 Implement insights payload builder (`lib/insights-builder.ts`)
  - Create buildInsightsPayload() function
  - Calculate totals: sum clicks, impressions, avg CTR, avg position
  - Calculate trends: percent change from first to last day
  - Find peak day (max clicks) and trough day (min clicks)
  - Calculate biggest day-to-day spike and drop
  - Implement anomaly detection using z-score (threshold > 2)
  - Implement downsampling for series > 60 points (keep peak/trough)
  - Ensure payload size < 30 KB
- [x] 4.2 Implement Claude client (`lib/claude-client.ts`)
  - Create generateInsights() function
  - Initialize Anthropic client with API key from env
  - Build prompt requesting JSON output with insights, anomalies, opportunities, questions
  - Call Claude API with model from env (default: claude-3-5-sonnet-20241022)
  - Set max_tokens: 2048, temperature: 0.7
  - Parse JSON response with error handling
  - Implement retry logic (1 retry with exponential backoff)
  - Set 30 second timeout
  - Handle API errors gracefully

## 5. UI Components
- [x] 5.1 Create DateRangePicker component (`components/DateRangePicker.tsx`)
  - Render start date input (type="date")
  - Render end date input (type="date")
  - Render Apply button
  - Validate end >= start, show error message if invalid
  - Emit onApply event with { startDate, endDate }
  - Disable Apply button during loading
- [x] 5.2 Create ClicksChart component (`components/ClicksChart.tsx`)
  - Use Recharts LineChart with ResponsiveContainer
  - Plot clicks on Y-axis, date on X-axis
  - Add Tooltip showing: date, clicks, impressions, CTR, position
  - Format CTR as percentage, position with 1 decimal
  - Handle empty data state with message
  - Style with clean, minimal design
- [x] 5.3 Create SummaryStats component (`components/SummaryStats.tsx`)
  - Display total clicks, total impressions
  - Display average CTR (as percentage), average position
  - Display date range
  - Format numbers with commas (e.g., 1,234)
  - Use card/grid layout for clean presentation
- [x] 5.4 Create InsightsPanel component (`components/InsightsPanel.tsx`)
  - Render Generate Insights button
  - Show loading state while generating
  - Render insights as bulleted list
  - Render anomalies as cards with date, metric, change, explanation
  - Render opportunities as bulleted list
  - Render questions as bulleted list
  - Handle empty state (no insights yet)
  - Handle error state with retry option

## 6. Main Page Integration
- [x] 6.1 Implement main page (`app/page.tsx`)
  - Set up state: dateRange, chartData, summary, insights, loading states
  - Initialize with default date range (last 30 days)
  - Fetch initial data on mount using /api/data
  - Handle Apply button: fetch new data with selected date range
  - Handle Generate Insights button: call /api/insights
  - Show loading spinner during initial indexing
  - Render all components with proper data flow
  - Handle errors with user-friendly messages
- [x] 6.2 Style the layout (`app/page.tsx` or global CSS)
  - Create clean, simple layout with proper spacing
  - Ensure responsive design (mobile-friendly)
  - Add minimal styling (Tailwind optional, or plain CSS)
  - Ensure good contrast and readability

## 7. Error Handling and Edge Cases
- [x] 7.1 Add comprehensive error handling
  - CSV file not found: show clear error message
  - Corrupted cache: rebuild from CSV
  - Invalid date inputs: show validation errors
  - Empty results: show "No data available" state
  - Claude API failures: show error with retry option
  - Network errors: show connection error message
- [x] 7.2 Add loading states
  - Initial page load: spinner with "Loading data..."
  - First-time indexing: "Indexing CSV file (this may take a minute)..."
  - Applying filter: disable button, show spinner
  - Generating insights: disable button, show "Generating insights..."
- [x] 7.3 Handle edge cases
  - Duplicate CSV headers: skip in parser
  - Empty CTR/position values: treat as 0
  - Zero impressions: avoid division by zero in weighted calculations
  - Single day range: handle gracefully (no trend calculation)
  - Very large date ranges: warn if > 365 days

## 8. Documentation and Polish
- [x] 8.1 Create comprehensive README.md
  - Overview of the application
  - Setup instructions (clone, install, configure)
  - Environment variables documentation
  - How to run dev server: `npm run dev`
  - How caching works (first run vs subsequent)
  - Architecture notes (4 key decisions from design doc)
  - Time breakdown example
  - Troubleshooting section
- [x] 8.2 Add code comments
  - Document complex algorithms (weighted metrics, z-score, downsampling)
  - Add JSDoc comments to public functions
  - Explain non-obvious design decisions in comments
- [x] 8.3 Final testing and polish
  - Test with actual 200 MB CSV file
  - Verify all date range combinations work
  - Test insights generation with various ranges
  - Check all error states display correctly
  - Verify responsive design on mobile
  - Check console for warnings/errors
  - Ensure no sensitive data in logs

## 9. Optional Enhancements*
- [ ] 9.1 Add unit tests for core utilities
  - Test CSV parser with duplicate headers
  - Test aggregator with zero impressions
  - Test weighted metric calculations
  - Test anomaly detection algorithm
- [ ] 9.2 Add loading progress for initial indexing
  - Show percentage complete during CSV parsing
  - Estimate time remaining
- [ ] 9.3 Add insights caching
  - Cache insights per date range to avoid repeated API calls
  - Invalidate cache after 1 hour
- [ ] 9.4 Add export functionality
  - Export chart as PNG
  - Export insights as PDF or text file

## Notes
- Tasks marked with * are optional enhancements
- Focus on core functionality first (tasks 1-8)
- Estimated total time: ~2 hours for core tasks
- Use AI coding assistants (Cursor, Claude) for boilerplate and implementation
- Test incrementally after each major task
