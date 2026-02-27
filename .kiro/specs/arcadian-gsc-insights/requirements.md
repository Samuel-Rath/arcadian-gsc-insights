# Requirements: Arcadian GSC Insights

## Overview
A Next.js application that processes large Google Search Console CSV files, provides interactive data visualization with date filtering, and generates AI-powered insights using Claude API with intelligent data summarization.

## User Stories

### 1. Data Visualization
As a user, I want to view my search console data in an interactive chart so that I can understand traffic trends over time.

**Acceptance Criteria:**
- 1.1 Application displays a line chart showing total clicks per day for the selected date range
- 1.2 Chart tooltips display impressions, CTR, and position for each day
- 1.3 Chart updates when date range filter is applied
- 1.4 Empty state is shown when no data matches the filter

### 2. Date Range Filtering
As a user, I want to filter data by date range so that I can focus on specific time periods.

**Acceptance Criteria:**
- 2.1 UI provides start date and end date picker controls
- 2.2 UI provides an "Apply" button to trigger the filter
- 2.3 Clicking Apply updates both the chart and summary statistics
- 2.4 Invalid date ranges (end before start) show a user-friendly error message
- 2.5 Date pickers default to a reasonable range (e.g., last 30 days)

### 3. Summary Statistics
As a user, I want to see aggregate metrics for my selected date range so that I can quickly understand overall performance.

**Acceptance Criteria:**
- 3.1 Display total clicks for the selected range
- 3.2 Display total impressions for the selected range
- 3.3 Display average CTR (weighted by impressions)
- 3.4 Display average position (weighted by impressions)
- 3.5 Display the selected date range
- 3.6 Statistics update when date filter is applied

### 4. AI-Powered Insights
As a user, I want to generate AI insights about my data so that I can discover patterns and opportunities.

**Acceptance Criteria:**
- 4.1 UI provides a "Generate Insights" button
- 4.2 Clicking the button calls Claude API with summarized data
- 4.3 Insights are returned in structured format with sections:
  - General insights (array of strings)
  - Anomalies (date, metric, change, explanation)
  - Opportunities (array of strings)
  - Questions (array of strings)
- 4.4 Insights are rendered in a clear, readable format
- 4.5 Loading state is shown while insights are being generated
- 4.6 Error handling for API failures with user-friendly messages

### 5. Large Dataset Handling
As a user, I want the application to handle large CSV files efficiently so that I don't experience slow load times or browser crashes.

**Acceptance Criteria:**
- 5.1 CSV file is never loaded into the browser
- 5.2 Server-side streaming parser processes the CSV
- 5.3 Daily aggregates are cached on disk after first parse
- 5.4 Subsequent requests use cached data
- 5.5 Loading state is shown during initial indexing
- 5.6 Duplicate header rows in CSV are skipped
- 5.7 Empty or invalid CTR/position values are handled safely

## Technical Requirements

### Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **AI API:** Anthropic Claude
- **Chart Library:** Recharts
- **Styling:** Tailwind CSS (optional, minimal)

### Data Source
- **File Location:** `/mnt/data/arckeywords.csv`
- **CSV Columns:** analytics_date, keyword, page_url, clicks, impressions, ctr, position, analytics_type, device, plus ID metadata
- **Special Handling:** Skip rows where analytics_date equals "analytics_date" (duplicate headers)

### Server-Side Architecture

#### Daily Aggregate Cache
- **Cache Location:** `.data-cache/` or `data-cache/` folder in repo
- **Cache Format:** JSON file with daily aggregates
- **Aggregation Logic:**
  - Group by analytics_date
  - Per date, calculate:
    - `clicks_sum`: sum of all clicks
    - `impressions_sum`: sum of all impressions
    - `ctr_weighted`: sum(ctr × impressions) / sum(impressions)
    - `position_weighted`: sum(position × impressions) / sum(impressions)
  - Handle zero impressions safely (avoid division by zero)

#### API Endpoints

**GET /api/data**
- Query Parameters: `start` (YYYY-MM-DD), `end` (YYYY-MM-DD)
- Response:
  ```json
  {
    "series": [
      { "date": "YYYY-MM-DD", "clicks": number, "impressions": number, "ctr": number, "position": number }
    ],
    "summary": {
      "totalClicks": number,
      "totalImpressions": number,
      "avgCtr": number,
      "avgPosition": number,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    }
  }
  ```

**POST /api/insights**
- Request Body: `{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }`
- Response:
  ```json
  {
    "insights": ["string"],
    "anomalies": [
      { "date": "YYYY-MM-DD", "metric": "string", "change": "string", "explanation": "string" }
    ],
    "opportunities": ["string"],
    "questions": ["string"]
  }
  ```

### Insights Payload Design
The payload sent to Claude must be compact (under ~30 KB) and include:
- Totals and averages for the selected range
- Start-to-end percent change for clicks and impressions
- Peak day and trough day for clicks
- Biggest day-to-day spike and drop in clicks
- Simple anomaly flags using z-score or threshold (mean ± standard deviation)
- Downsampled daily series (max 60 points if range is large)
- Structured JSON format

### Claude Integration
- **API Key:** Environment variable `ANTHROPIC_API_KEY`
- **Model:** Configurable via environment variable with sensible default
- **Security:** Server-only calls, never expose key to client
- **Prompt:** Request strict JSON output matching the response schema

## Non-Functional Requirements

### Performance
- Initial CSV indexing should show loading state
- Cached data should respond in < 1 second
- Chart rendering should be smooth for up to 365 data points

### Security
- API keys must never be exposed to the client
- All Claude API calls must be server-side only

### Usability
- Clean, simple layout
- User-friendly error messages
- Clear loading states
- Responsive design (mobile-friendly)

### Maintainability
- Clear project structure following Next.js conventions
- Modular server utilities for reusability
- TypeScript for type safety
- Comprehensive README documentation

## Project Structure

```
arcadian-gsc-insights/
├── app/
│   ├── api/
│   │   ├── data/
│   │   │   └── route.ts
│   │   └── insights/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── lib/
│   ├── csv-parser.ts
│   ├── cache.ts
│   ├── aggregator.ts
│   ├── insights-builder.ts
│   └── claude-client.ts
├── components/
│   ├── DateRangePicker.tsx
│   ├── ClicksChart.tsx
│   ├── SummaryStats.tsx
│   └── InsightsPanel.tsx
├── .data-cache/
│   └── daily-aggregates.json
├── .env.local
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables
- `ANTHROPIC_API_KEY`: Required for Claude API access
- `ANTHROPIC_MODEL`: Optional, defaults to a sensible Claude model
- `CSV_FILE_PATH`: Optional, defaults to `/mnt/data/arckeywords.csv`

## Edge Cases and Error Handling
- Invalid date range (end before start): Show user-friendly message
- Empty results: Show empty chart state
- During initial indexing: Show loading state
- Duplicate header rows: Skip rows where analytics_date equals "analytics_date"
- Empty CTR/position values: Handle as 0 or skip safely
- Claude API failures: Show error message with retry option
- Missing CSV file: Show clear error message
- Corrupted cache: Rebuild from CSV
- Zero impressions: Avoid division by zero in weighted calculations

## Success Criteria
- Application successfully loads and parses the 200 MB CSV file
- Chart displays correctly with filtered data
- Claude API returns structured insights
- No performance issues or browser crashes
- All edge cases are handled gracefully
- README provides clear setup and usage instructions
