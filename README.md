# Arcadian GSC Insights

A Next.js application that processes large Google Search Console CSV files, provides interactive data visualization with date filtering, and generates AI-powered insights using Claude API with intelligent data summarization.

## Overview

This application solves the challenge of analyzing large (200+ MB) Google Search Console export files by:

- **Server-side streaming processing** - Never loads the entire CSV into memory or browser
- **Intelligent caching** - Builds daily aggregates on first run, uses cached data for subsequent requests
- **Interactive visualization** - Recharts-powered line chart with date range filtering
- **AI-powered insights** - Claude API analyzes trends, anomalies, and opportunities using compact statistical summaries

## Features

- 📊 Interactive line chart showing clicks over time
- 📅 Date range filtering with start/end date pickers
- 📈 Summary statistics (total clicks, impressions, avg CTR, avg position)
- 🤖 AI-generated insights with anomaly detection
- ⚡ Fast performance with persistent disk cache
- 🔒 Secure server-side API key handling
- 🛡️ Comprehensive security measures (rate limiting, input validation, DoS protection)

## Security

This application implements comprehensive security measures including:
- API key protection (server-side only, never logged)
- Rate limiting (10 requests per minute per IP)
- Input validation (date ranges, payload sizes)
- DoS prevention (cache locks, streaming parser)
- Prompt injection defense (secure system prompts, response validation)
- Error message sanitization (no sensitive data leakage)

For detailed security information, see [SECURITY.md](./SECURITY.md).

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Google Search Console CSV export file

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arcadian-gsc-insights
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the project root:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
   ```

4. **Upload your CSV file**
   
   Once the server is running, use the file upload interface in the application to upload your Google Search Console CSV export. The file will be saved to `uploaded-data/arckeywords.csv`.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key for Claude access |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-5-20250929` | Claude model to use for insights generation |
| `CSV_FILE_PATH` | No | `./uploaded-data/arckeywords.csv` | Path to your GSC CSV file (relative to project root) |

### Getting an Anthropic API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

## How Caching Works

The application uses a two-tier caching strategy to handle large CSV files efficiently:

### First Run (Initial Indexing)

1. Application detects no cache exists
2. Streams and parses the CSV file (never loads entire file into memory)
3. Builds daily aggregates:
   - Groups rows by `analytics_date`
   - Calculates `clicks_sum` and `impressions_sum` per date
   - Calculates weighted CTR: `sum(ctr × impressions) / sum(impressions)`
   - Calculates weighted position: `sum(position × impressions) / sum(impressions)`
4. Saves aggregates to `.data-cache/daily-aggregates.json`
5. Returns filtered data to client

**Expected time:** 30-60 seconds for a 200 MB CSV file

### Subsequent Runs

1. Application reads from `.data-cache/daily-aggregates.json`
2. Filters by requested date range
3. Returns data immediately

**Expected time:** < 100ms

### Cache Invalidation

The cache persists across server restarts. To rebuild the cache:

1. Delete `.data-cache/daily-aggregates.json`
2. Restart the server or make a new request

The cache will automatically rebuild on the next request.

## Architecture

This application follows four key architectural decisions:

### 1. Server-Side Streaming with Persistent Cache

**Problem:** 200 MB CSV is too large to load into browser or send to Claude.

**Solution:** Stream-parse CSV on server using Node.js streams, build daily aggregates on first request, persist cache to disk.

**Benefits:**
- Streaming prevents memory issues
- Daily aggregation reduces 200 MB to ~few KB
- Disk cache survives server restarts
- Fast response times after initial indexing

### 2. Weighted Aggregation for Accurate Metrics

**Problem:** Simple averaging of CTR and position across rows is mathematically incorrect.

**Solution:** Weight CTR and position by impressions when aggregating.

**Formula:** `weighted_metric = sum(metric × impressions) / sum(impressions)`

**Benefits:**
- Keywords with more impressions influence averages appropriately
- Matches Google Search Console calculation methodology
- Provides accurate insights

### 3. Smart Insights Payload (<30 KB)

**Problem:** Cannot send 200 MB or even full daily series to Claude.

**Solution:** Send compact statistical summary including:
- Aggregates (totals, averages)
- Trends (percent changes, peak/trough days)
- Anomalies (z-score based detection)
- Downsampled series (max 60 points)

**Benefits:**
- Statistical summary captures patterns without raw data
- Z-score identifies outliers mathematically
- Stays well under API limits
- Structured JSON helps Claude generate consistent output

### 4. Recharts for Visualization

**Problem:** Need interactive chart with tooltips.

**Solution:** Use Recharts library with LineChart component.

**Benefits:**
- React-native, works seamlessly with Next.js
- Built-in responsive design and tooltips
- Declarative API matches React patterns
- Lightweight compared to alternatives

## Project Structure

```
arcadian-gsc-insights/
├── app/
│   ├── api/
│   │   ├── data/
│   │   │   └── route.ts          # GET endpoint for chart data
│   │   └── insights/
│   │       └── route.ts          # POST endpoint for AI insights
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/
│   ├── csv-parser.ts             # Stream CSV parser
│   ├── cache.ts                  # Cache read/write utilities
│   ├── aggregator.ts             # Daily aggregation logic
│   ├── insights-builder.ts       # Compact payload builder
│   └── claude-client.ts          # Claude API client
├── components/
│   ├── DateRangePicker.tsx       # Date filter controls
│   ├── ClicksChart.tsx           # Recharts line chart
│   ├── SummaryStats.tsx          # Aggregate metrics display
│   └── InsightsPanel.tsx         # AI insights display
├── types/
│   └── index.ts                  # TypeScript interfaces
├── .data-cache/
│   └── daily-aggregates.json     # Cached daily aggregates
├── .env.local                    # Environment variables (not in git)
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## API Endpoints

### GET /api/data

Retrieves filtered chart data and summary statistics.

**Query Parameters:**
- `start` (optional): Start date in YYYY-MM-DD format (defaults to 30 days ago)
- `end` (optional): End date in YYYY-MM-DD format (defaults to today)

**Response:**
```json
{
  "series": [
    {
      "date": "2024-01-01",
      "clicks": 1234,
      "impressions": 56789,
      "ctr": 2.17,
      "position": 12.5
    }
  ],
  "summary": {
    "totalClicks": 12345,
    "totalImpressions": 567890,
    "avgCtr": 2.17,
    "avgPosition": 12.5,
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

### POST /api/insights

Generates AI-powered insights for a date range.

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Response:**
```json
{
  "insights": [
    "Traffic increased 15% over the period",
    "CTR improved significantly in the last week"
  ],
  "anomalies": [
    {
      "date": "2024-01-15",
      "metric": "clicks",
      "change": "spike of 200%",
      "explanation": "Unusual traffic surge, possibly viral content"
    }
  ],
  "opportunities": [
    "Focus on keywords with high impressions but low CTR",
    "Investigate pages with declining position"
  ],
  "questions": [
    "What caused the traffic spike on Jan 15?",
    "Are there seasonal patterns in the data?"
  ]
}
```

## Time Breakdown

Estimated development time with AI coding assistants (Cursor/Claude):

- **Setup & scaffolding:** 15 min
- **CSV parser & aggregator:** 30 min
- **Cache implementation:** 15 min
- **API endpoints:** 20 min
- **UI components:** 25 min
- **Claude integration:** 20 min
- **Testing & debugging:** 20 min
- **README & polish:** 15 min

**Total:** ~2 hours

## Troubleshooting

### "Data file not found" error

**Problem:** Application cannot find the CSV file.

**Solution:**
1. Verify the file exists at the path specified in `CSV_FILE_PATH`
2. Check file permissions (application needs read access)
3. Use absolute path in `.env.local`
4. On Windows, use forward slashes: `C:/data/file.csv`

### Initial load is very slow

**Problem:** First request takes 30-60 seconds.

**Solution:** This is expected behavior during initial indexing. The application is:
1. Streaming and parsing the entire CSV file
2. Building daily aggregates
3. Writing cache to disk

Subsequent requests will be fast (<100ms). You'll see "Indexing CSV file (this may take a minute)..." message during this process.

### "Invalid API key" error

**Problem:** Claude API returns authentication error.

**Solution:**
1. Verify `ANTHROPIC_API_KEY` is set correctly in `.env.local`
2. Check for extra spaces or quotes around the key
3. Ensure the key starts with `sk-ant-`
4. Verify the key is active in your Anthropic console
5. Restart the dev server after changing `.env.local`

### "Model not found" error

**Problem:** Claude API returns 404 error for the model.

**Solution:**
1. The application is configured to use `claude-sonnet-4-5-20250929`
2. If this model is not available with your API key, try these alternatives:
   - `claude-3-5-sonnet-20241022`
   - `claude-3-sonnet-20240229`
   - `claude-2.1`
3. Check your Anthropic console for which models your API key can access
4. Restart the dev server after changing the model

### Insights generation fails

**Problem:** "Failed to generate insights" error appears.

**Solution:**
1. Check your Anthropic API key is valid
2. Verify you have API credits remaining
3. Check network connectivity
4. Try a smaller date range (reduces payload size)
5. Check browser console and server logs for detailed error messages

### Chart shows "No data available"

**Problem:** Chart is empty after applying date filter.

**Solution:**
1. Verify the date range contains data in your CSV
2. Check that start date is before end date
3. Ensure CSV file has valid data for the selected period
4. Check browser console for errors

### Cache is stale or corrupted

**Problem:** Data doesn't match CSV file or shows errors.

**Solution:**
1. Stop the dev server
2. Delete `.data-cache/daily-aggregates.json`
3. Restart the dev server
4. Make a new request to rebuild the cache

### TypeScript errors

**Problem:** Build fails with TypeScript errors.

**Solution:**
1. Ensure all dependencies are installed: `npm install`
2. Check `tsconfig.json` is properly configured
3. Run `npm run build` to see detailed errors
4. Verify all type definitions in `types/index.ts` are correct

### Port 3000 already in use

**Problem:** Cannot start dev server.

**Solution:**
1. Stop other applications using port 3000
2. Or specify a different port: `npm run dev -- -p 3001`
3. On Windows, find and kill the process: `netstat -ano | findstr :3000`

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **AI API:** Anthropic Claude
- **Chart Library:** Recharts
- **CSV Parsing:** csv-parse
- **Date Utilities:** date-fns
- **Runtime:** Node.js 18+

## License

MIT License

Copyright (c) 2026 Samuel Rath

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

Contributions are welcome! This project was created by Samuel Rath.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run build
   npm run lint
   ```
5. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Keep commits focused and write clear commit messages

### Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub with:
- A clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (OS, Node version, etc.)

### Security Issues

For security vulnerabilities, please see [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines.

## Author

**Samuel Rath**

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI insights powered by [Anthropic Claude](https://www.anthropic.com/)
- Charts by [Recharts](https://recharts.org/)
- CSV parsing by [csv-parse](https://csv.js.org/parse/)
