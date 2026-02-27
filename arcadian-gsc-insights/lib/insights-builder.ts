import { DailyAggregate, InsightsPayload } from '@/types';

/**
 * Build insights payload for Claude API.
 * 
 * This function creates a compact statistical summary of the data that can be
 * sent to Claude API without exceeding size limits. The payload is designed to
 * be under 30 KB while preserving the most important patterns and trends.
 * 
 * **Design Decision:**
 * We cannot send the full 200 MB CSV or even the complete daily series to Claude.
 * Instead, we send a statistical summary that captures:
 * - Aggregate metrics (totals, averages)
 * - Trend indicators (percent changes, peaks, spikes)
 * - Anomaly flags (z-score based detection)
 * - Downsampled time series (max 60 points)
 * 
 * This approach allows Claude to generate meaningful insights without seeing
 * raw data, while keeping the payload size manageable.
 * 
 * **SECURITY NOTE:**
 * Currently sends aggregated data only (no keywords or URLs), which provides
 * some data leakage protection. For production use, consider:
 * - Sanitizing any remaining sensitive fields
 * - Stripping query parameters from URLs if URLs are added
 * - Truncating long strings to prevent data leakage
 * 
 * @param series - Filtered daily aggregates for the date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns InsightsPayload object ready to send to Claude
 */
export function buildInsightsPayload(
  series: DailyAggregate[],
  startDate: string,
  endDate: string
): InsightsPayload {
  // Calculate totals and averages
  const totals = calculateTotals(series);
  
  // Calculate trends (percent changes, peaks, spikes)
  const trends = calculateTrends(series);
  
  // Detect anomalies using z-score
  const anomalies = detectAnomalies(series);
  
  // Downsample series if needed (max 60 points)
  const downsampledSeries = downsampleSeries(series, 60);
  
  return {
    dateRange: {
      start: startDate,
      end: endDate,
    },
    totals,
    trends,
    anomalies,
    series: downsampledSeries,
  };
}

/**
 * Calculate total and average metrics.
 * 
 * Uses weighted averaging for CTR and position to ensure accuracy.
 * See aggregator.ts for detailed explanation of weighted metrics.
 */
function calculateTotals(series: DailyAggregate[]) {
  if (series.length === 0) {
    return {
      clicks: 0,
      impressions: 0,
      avgCtr: 0,
      avgPosition: 0,
    };
  }
  
  const totalClicks = series.reduce((sum, agg) => sum + agg.clicks, 0);
  const totalImpressions = series.reduce((sum, agg) => sum + agg.impressions, 0);
  
  // Calculate weighted averages
  let weightedCtrSum = 0;
  let weightedPositionSum = 0;
  
  for (const agg of series) {
    weightedCtrSum += agg.ctr * agg.impressions;
    weightedPositionSum += agg.position * agg.impressions;
  }
  
  const avgCtr = totalImpressions > 0 ? weightedCtrSum / totalImpressions : 0;
  const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;
  
  return {
    clicks: totalClicks,
    impressions: totalImpressions,
    avgCtr,
    avgPosition,
  };
}

/**
 * Calculate trends: percent changes, peaks, spikes.
 * 
 * This function identifies key patterns in the time series:
 * - Overall trend (first day to last day percent change)
 * - Peak and trough days (highest and lowest clicks)
 * - Day-to-day volatility (biggest spike and drop)
 * 
 * These metrics help Claude understand the overall trajectory and
 * identify significant events in the data.
 */
function calculateTrends(series: DailyAggregate[]) {
  if (series.length === 0) {
    return {
      clicksChange: 0,
      impressionsChange: 0,
      peakDay: { date: '', clicks: 0 },
      troughDay: { date: '', clicks: 0 },
      biggestSpike: { date: '', change: 0 },
      biggestDrop: { date: '', change: 0 },
    };
  }
  
  // Sort by date to ensure chronological order
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  
  // Handle single day range gracefully (no trend calculation possible)
  if (sorted.length === 1) {
    const singleDay = sorted[0];
    return {
      clicksChange: 0,
      impressionsChange: 0,
      peakDay: { date: singleDay.date, clicks: singleDay.clicks },
      troughDay: { date: singleDay.date, clicks: singleDay.clicks },
      biggestSpike: { date: '', change: 0 },
      biggestDrop: { date: '', change: 0 },
    };
  }
  
  // Calculate percent changes (first to last day)
  const firstDay = sorted[0];
  const lastDay = sorted[sorted.length - 1];
  
  const clicksChange = firstDay.clicks > 0
    ? ((lastDay.clicks - firstDay.clicks) / firstDay.clicks) * 100
    : 0;
  
  const impressionsChange = firstDay.impressions > 0
    ? ((lastDay.impressions - firstDay.impressions) / firstDay.impressions) * 100
    : 0;
  
  // Find peak and trough days
  let peakDay = sorted[0];
  let troughDay = sorted[0];
  
  for (const agg of sorted) {
    if (agg.clicks > peakDay.clicks) {
      peakDay = agg;
    }
    if (agg.clicks < troughDay.clicks) {
      troughDay = agg;
    }
  }
  
  // Find biggest day-to-day spike and drop
  let biggestSpike = { date: '', change: 0 };
  let biggestDrop = { date: '', change: 0 };
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const change = curr.clicks - prev.clicks;
    
    if (change > biggestSpike.change) {
      biggestSpike = { date: curr.date, change };
    }
    
    if (change < biggestDrop.change) {
      biggestDrop = { date: curr.date, change };
    }
  }
  
  return {
    clicksChange,
    impressionsChange,
    peakDay: {
      date: peakDay.date,
      clicks: peakDay.clicks,
    },
    troughDay: {
      date: troughDay.date,
      clicks: troughDay.clicks,
    },
    biggestSpike,
    biggestDrop,
  };
}

/**
 * Detect anomalies using z-score (threshold > 2).
 * 
 * **Z-Score Anomaly Detection Algorithm:**
 * 
 * The z-score measures how many standard deviations a value is from the mean.
 * It's calculated as: z = (value - mean) / standard_deviation
 * 
 * A z-score > 2 (or < -2) indicates the value is more than 2 standard deviations
 * from the mean, which occurs in only ~5% of cases in a normal distribution.
 * This makes it a good threshold for identifying unusual days.
 * 
 * **Example:**
 * - Mean clicks: 1000
 * - Standard deviation: 200
 * - Day with 1500 clicks: z = (1500 - 1000) / 200 = 2.5 (anomaly!)
 * - Day with 1100 clicks: z = (1100 - 1000) / 200 = 0.5 (normal)
 * 
 * **Edge Cases:**
 * - Less than 3 data points: Not enough for meaningful detection
 * - Zero standard deviation: All values are identical, no anomalies
 * 
 * @param series - Daily aggregates to analyze
 * @returns Array of anomalies with date, clicks, and z-score
 */
function detectAnomalies(series: DailyAggregate[]) {
  if (series.length < 3) {
    // Not enough data for meaningful anomaly detection
    return [];
  }
  
  // Calculate mean and standard deviation of clicks
  const clicks = series.map(agg => agg.clicks);
  const mean = clicks.reduce((sum, val) => sum + val, 0) / clicks.length;
  
  // Calculate variance: average of squared differences from mean
  const squaredDiffs = clicks.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / clicks.length;
  
  // Standard deviation is the square root of variance
  const stdDev = Math.sqrt(variance);
  
  // Avoid division by zero
  if (stdDev === 0) {
    return [];
  }
  
  // Find anomalies (z-score > 2)
  const anomalies = [];
  
  for (const agg of series) {
    const zScore = (agg.clicks - mean) / stdDev;
    
    if (Math.abs(zScore) > 2) {
      anomalies.push({
        date: agg.date,
        clicks: agg.clicks,
        zScore,
      });
    }
  }
  
  return anomalies;
}

/**
 * Downsample series to max points while preserving peak and trough.
 * 
 * **Downsampling Algorithm:**
 * 
 * When the date range is large (e.g., 365 days), sending all data points to
 * Claude would exceed size limits and add noise. This function reduces the
 * series to a maximum number of points while preserving important features.
 * 
 * **Strategy:**
 * 1. If series is already small enough, return as-is
 * 2. Sample uniformly across the time range (every Nth point)
 * 3. Always include: first day, last day, peak day, trough day
 * 4. This preserves overall trend while highlighting extremes
 * 
 * **Example:**
 * - Input: 365 days, maxPoints: 60
 * - Step size: 365 / 60 ≈ 6 (take every 6th day)
 * - Plus: day 1, day 365, peak day (e.g., day 180), trough day (e.g., day 45)
 * - Result: ~60 points that capture the overall pattern
 * 
 * **Design Trade-off:**
 * We lose granular day-to-day detail but preserve the overall shape and
 * key events. This is acceptable for high-level insights generation.
 * 
 * @param series - Daily aggregates to downsample
 * @param maxPoints - Maximum number of points to return
 * @returns Downsampled series with key days preserved
 */
function downsampleSeries(series: DailyAggregate[], maxPoints: number): DailyAggregate[] {
  if (series.length <= maxPoints) {
    return series;
  }
  
  // Sort by date
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  
  // Find peak and trough indices
  let peakIdx = 0;
  let troughIdx = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].clicks > sorted[peakIdx].clicks) {
      peakIdx = i;
    }
    if (sorted[i].clicks < sorted[troughIdx].clicks) {
      troughIdx = i;
    }
  }
  
  // Calculate step size for uniform sampling
  // Example: 365 days / 60 max points = step of ~6 (take every 6th day)
  const step = Math.ceil(sorted.length / maxPoints);
  
  // Sample uniformly across the series
  const sampled = new Set<number>();
  
  for (let i = 0; i < sorted.length; i += step) {
    sampled.add(i);
  }
  
  // Always include critical days to preserve key features
  // These ensure we don't lose important information during downsampling
  sampled.add(0);                    // First day (start of range)
  sampled.add(sorted.length - 1);    // Last day (end of range)
  sampled.add(peakIdx);              // Peak day (highest clicks)
  sampled.add(troughIdx);            // Trough day (lowest clicks)
  
  // Convert to array and sort by index
  const indices = Array.from(sampled).sort((a, b) => a - b);
  
  // Take only maxPoints if we still have too many
  const finalIndices = indices.length > maxPoints
    ? indices.slice(0, maxPoints)
    : indices;
  
  return finalIndices.map(i => sorted[i]);
}
