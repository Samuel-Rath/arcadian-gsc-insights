import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { CSVRow } from '@/types';

/**
 * Stream parse CSV file and yield rows as CSVRow objects.
 * 
 * **Streaming Design Decision:**
 * The CSV file is ~200 MB, which is too large to load entirely into memory.
 * This function uses Node.js streams to process the file incrementally,
 * keeping memory usage low (~100 MB) regardless of file size.
 * 
 * **Special Handling:**
 * - Skips duplicate header rows (where analytics_date === "analytics_date")
 * - Treats empty/invalid numeric values as 0
 * - Handles malformed CSV gracefully (relaxed parsing)
 * - Stops processing if too many errors occur (likely corrupted file)
 * 
 * **Error Handling:**
 * - File not found: Throws clear error with file path
 * - Permission denied: Throws clear error
 * - Too many invalid rows: Throws error to prevent processing bad data
 * - Individual row errors: Logs warning and continues
 * 
 * @param filePath - Path to the CSV file
 * @returns AsyncIterable of CSVRow objects
 * @throws Error if file cannot be read or parsed
 */
export async function* streamParseCSV(filePath: string): AsyncIterable<CSVRow> {
  let rowCount = 0;
  let errorCount = 0;
  const maxErrors = 100; // Stop if too many errors
  
  try {
    const stream = createReadStream(filePath);
    
    // Handle stream errors
    stream.on('error', (error) => {
      throw new Error(`Failed to read CSV file: ${error.message}`);
    });
    
    const parser = stream.pipe(
      parse({
        columns: true,              // Use first row as column names
        skip_empty_lines: true,     // Ignore blank lines
        trim: true,                 // Remove whitespace from values
        cast: false,                // Manual casting for better control
        relax_quotes: true,         // Handle malformed quotes gracefully
        relax_column_count: true,   // Handle rows with different column counts
        escape: '"',                // Standard escape character
        quote: '"',                 // Standard quote character
        skip_records_with_error: true, // Skip problematic rows instead of failing
      })
    );

    for await (const record of parser) {
      rowCount++;
      
      try {
        // Skip duplicate header rows where analytics_date equals "analytics_date"
        if (record.analytics_date === 'analytics_date') {
          continue;
        }
        
        // Skip rows with missing critical fields
        if (!record.analytics_date || record.analytics_date.trim() === '') {
          errorCount++;
          if (errorCount > maxErrors) {
            throw new Error(`Too many invalid rows (${errorCount}). CSV file may be corrupted.`);
          }
          continue;
        }

        // Parse numeric fields, treating empty/invalid values as 0
        const clicks = parseNumericField(record.clicks);
        const impressions = parseNumericField(record.impressions);
        const ctr = parseNumericField(record.ctr);
        const position = parseNumericField(record.position);

        yield {
          analytics_date: record.analytics_date || '',
          keyword: record.keyword || '',
          page_url: record.page_url || '',
          clicks,
          impressions,
          ctr,
          position,
          analytics_type: record.analytics_type || '',
          device: record.device || '',
        };
      } catch (rowError) {
        errorCount++;
        console.warn(`Error parsing row ${rowCount}:`, rowError);
        
        if (errorCount > maxErrors) {
          throw new Error(`Too many parsing errors (${errorCount}). CSV file may be corrupted.`);
        }
      }
    }
    
    if (rowCount === 0) {
      throw new Error('CSV file is empty or contains no valid data rows');
    }
    
    if (errorCount > 0) {
      console.log(`CSV parsing completed with ${errorCount} skipped/invalid rows out of ${rowCount} total rows`);
    }
    
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`CSV file not found at path: ${filePath}`);
    }
    
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new Error(`Permission denied reading CSV file: ${filePath}`);
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Parse a numeric field from CSV, treating empty/invalid values as 0.
 * 
 * This defensive parsing ensures we never crash on malformed data.
 * Empty strings, whitespace, and non-numeric values all become 0.
 * 
 * @param value - String value from CSV
 * @returns Parsed number or 0 if invalid
 */
function parseNumericField(value: string | undefined): number {
  if (!value || value.trim() === '') {
    return 0;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
