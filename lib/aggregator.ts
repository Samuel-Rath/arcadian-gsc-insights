import { CSVRow, DailyAggregate } from '@/types';

/**
 * Build daily aggregates from CSV stream.
 * 
 * This function processes a large CSV file using streaming to avoid loading
 * the entire file into memory. It groups rows by analytics_date and calculates
 * daily aggregates with weighted metrics.
 * 
 * **Weighted Metrics Algorithm:**
 * Simple averaging of CTR and position across rows is mathematically incorrect
 * because it treats all keywords equally. A keyword with 1000 impressions should
 * influence the average more than one with 10 impressions.
 * 
 * Formula: weighted_metric = sum(metric × impressions) / sum(impressions)
 * 
 * Example:
 * - Keyword A: CTR=10%, impressions=1000 → contributes 100 to numerator
 * - Keyword B: CTR=5%, impressions=100 → contributes 5 to numerator
 * - Weighted CTR = (100 + 5) / (1000 + 100) = 9.5%
 * - Simple average would be (10% + 5%) / 2 = 7.5% (incorrect!)
 * 
 * This matches how Google Search Console calculates averages.
 * 
 * **Edge Cases Handled:**
 * - Zero impressions: Set weighted metrics to 0 to avoid division by zero
 * - Invalid dates: Skip rows with empty or missing dates
 * - NaN/Infinity values: Treat as 0 to prevent calculation errors
 * 
 * @param rows - AsyncIterable of CSVRow objects from CSV parser
 * @returns Promise resolving to array of DailyAggregate objects, sorted by date
 * @throws Error if no valid data rows are found
 */
export async function buildDailyAggregates(
  rows: AsyncIterable<CSVRow>
): Promise<DailyAggregate[]> {
  // Map to accumulate data by date
  // Using Map instead of object for better performance with large datasets
  const dateMap = new Map<string, {
    clicks: number;
    impressions: number;
    ctrWeightedSum: number;      // sum(ctr × impressions) for weighted average
    positionWeightedSum: number; // sum(position × impressions) for weighted average
  }>();

  let processedRows = 0;

  try {
    // Process each row from the stream
    for await (const row of rows) {
      const date = row.analytics_date;
      
      // Skip rows with invalid dates
      if (!date || date.trim() === '') {
        continue;
      }

      // Get or initialize accumulator for this date
      const existing = dateMap.get(date) || {
        clicks: 0,
        impressions: 0,
        ctrWeightedSum: 0,
        positionWeightedSum: 0,
      };

      // Accumulate values (handle NaN and Infinity)
      // isFinite() checks for both NaN and Infinity, treating them as 0
      const clicks = isFinite(row.clicks) ? row.clicks : 0;
      const impressions = isFinite(row.impressions) ? row.impressions : 0;
      const ctr = isFinite(row.ctr) ? row.ctr : 0;
      const position = isFinite(row.position) ? row.position : 0;

      // Accumulate totals
      existing.clicks += clicks;
      existing.impressions += impressions;
      
      // Accumulate weighted sums for later division
      // These will be divided by total impressions to get weighted averages
      existing.ctrWeightedSum += ctr * impressions;
      existing.positionWeightedSum += position * impressions;

      dateMap.set(date, existing);
      processedRows++;
    }
  } catch (error) {
    throw new Error(`Failed to build aggregates: ${(error as Error).message}`);
  }

  // Validate we have data
  if (dateMap.size === 0) {
    throw new Error('No valid data found in CSV file. The file may be empty or contain only invalid rows.');
  }

  console.log(`Processed ${processedRows} rows into ${dateMap.size} daily aggregates`);

  // Convert map to array of DailyAggregate objects
  const aggregates: DailyAggregate[] = [];
  
  for (const [date, data] of dateMap.entries()) {
    const { clicks, impressions, ctrWeightedSum, positionWeightedSum } = data;
    
    // Calculate weighted metrics, handling zero impressions edge case
    // Division by zero would produce Infinity, so we check first
    const ctr = impressions > 0 ? ctrWeightedSum / impressions : 0;
    const position = impressions > 0 ? positionWeightedSum / impressions : 0;

    // Validate calculated values
    if (!isFinite(ctr) || !isFinite(position)) {
      console.warn(`Invalid calculated metrics for date ${date}, using 0`);
    }

    aggregates.push({
      date,
      clicks: isFinite(clicks) ? clicks : 0,
      impressions: isFinite(impressions) ? impressions : 0,
      ctr: isFinite(ctr) ? ctr : 0,
      position: isFinite(position) ? position : 0,
    });
  }

  // Sort by date for consistent ordering
  aggregates.sort((a, b) => a.date.localeCompare(b.date));

  return aggregates;
}

/**
 * Calculate weighted metrics for a set of rows.
 * 
 * This utility function applies the same weighted averaging algorithm
 * used in buildDailyAggregates. It's useful for calculating accurate
 * averages when aggregating data at different levels.
 * 
 * **Why Weighted Metrics Matter:**
 * When aggregating search console data, we must weight metrics by impressions
 * to get accurate averages. This ensures high-traffic keywords have appropriate
 * influence on the overall metrics.
 * 
 * @param rows - Array of CSVRow objects
 * @returns Object with weighted CTR and position
 */
export function calculateWeightedMetrics(rows: CSVRow[]): {
  ctr: number;
  position: number;
} {
  let totalImpressions = 0;
  let ctrWeightedSum = 0;
  let positionWeightedSum = 0;

  for (const row of rows) {
    totalImpressions += row.impressions;
    ctrWeightedSum += row.ctr * row.impressions;
    positionWeightedSum += row.position * row.impressions;
  }

  // Handle zero impressions edge case
  if (totalImpressions === 0) {
    return { ctr: 0, position: 0 };
  }

  return {
    ctr: ctrWeightedSum / totalImpressions,
    position: positionWeightedSum / totalImpressions,
  };
}
