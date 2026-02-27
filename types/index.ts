/**
 * Raw CSV row structure.
 * 
 * Represents a single row from the Google Search Console CSV export.
 * Each row contains data for one keyword on one page on one date.
 */
export interface CSVRow {
  analytics_date: string;
  keyword: string;
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  analytics_type: string;
  device: string;
}

/**
 * Daily aggregate structure (cached).
 * 
 * Represents aggregated data for a single date across all keywords and pages.
 * This is what gets cached to disk to avoid re-parsing the CSV.
 * 
 * **Important:** CTR and position are weighted by impressions, not simple averages.
 * This ensures high-traffic keywords have appropriate influence on the metrics.
 */
export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  clicks: number;
  impressions: number;
  ctr: number; // weighted by impressions
  position: number; // weighted by impressions
}

/**
 * Insights payload sent to Claude.
 * 
 * A compact statistical summary designed to be under 30 KB.
 * Contains aggregate metrics, trends, anomalies, and a downsampled time series.
 * 
 * **Design Rationale:**
 * We cannot send the full 200 MB CSV or even complete daily series to Claude.
 * This payload captures the most important patterns while staying within API limits.
 */
export interface InsightsPayload {
  dateRange: {
    start: string;
    end: string;
  };
  totals: {
    clicks: number;
    impressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  trends: {
    clicksChange: number; // percentage
    impressionsChange: number; // percentage
    peakDay: {
      date: string;
      clicks: number;
    };
    troughDay: {
      date: string;
      clicks: number;
    };
    biggestSpike: {
      date: string;
      change: number;
    };
    biggestDrop: {
      date: string;
      change: number;
    };
  };
  anomalies: Array<{
    date: string;
    clicks: number;
    zScore: number; // Standard deviations from mean
  }>;
  series: DailyAggregate[]; // max 60 points (downsampled if needed)
}

/**
 * Insights response from Claude.
 * 
 * Structured output from the AI analysis, designed to be easily
 * rendered in the UI with clear sections.
 */
export interface InsightsResponse {
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
