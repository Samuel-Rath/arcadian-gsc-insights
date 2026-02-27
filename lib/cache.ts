import { promises as fs } from 'fs';
import { join } from 'path';
import { DailyAggregate } from '@/types';
import { streamParseCSV } from './csv-parser';
import { buildDailyAggregates } from './aggregator';
import { withCacheLock } from './cache-lock';

const CACHE_DIR = '.data-cache';
const CACHE_FILE = 'daily-aggregates.json';

// Default CSV path - use uploaded-data folder in project directory
const getCSVPath = () => {
  if (process.env.CSV_FILE_PATH) {
    return process.env.CSV_FILE_PATH;
  }
  // Default to uploaded-data folder in project directory (Windows-friendly)
  return join(process.cwd(), 'uploaded-data', 'arckeywords.csv');
};

const CSV_FILE_PATH = getCSVPath();

/**
 * Read cached daily aggregates from disk.
 * 
 * **Cache Design:**
 * The cache stores pre-computed daily aggregates to avoid re-parsing the
 * 200 MB CSV file on every request. This reduces response time from ~60s
 * to <100ms after the initial indexing.
 * 
 * @returns Promise resolving to array of DailyAggregate objects, or null if cache doesn't exist or is corrupted
 */
export async function readCache(): Promise<DailyAggregate[] | null> {
  try {
    const cachePath = join(process.cwd(), CACHE_DIR, CACHE_FILE);
    const data = await fs.readFile(cachePath, 'utf-8');
    
    // Parse JSON and validate structure
    const parsed = JSON.parse(data);
    
    // Basic validation: ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn('Cache file is not an array, treating as corrupted');
      return null;
    }
    
    return parsed as DailyAggregate[];
  } catch (error) {
    // Handle file not found
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    
    // Handle corrupted JSON
    if (error instanceof SyntaxError) {
      console.warn('Cache file contains invalid JSON, treating as corrupted');
      return null;
    }
    
    // Log other errors but return null
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Write daily aggregates to disk cache.
 * 
 * Creates cache directory if it doesn't exist. The cache persists across
 * server restarts, so we only need to parse the CSV once.
 * 
 * @param data - Array of DailyAggregate objects to cache
 * @throws Error if write fails after directory creation
 */
export async function writeCache(data: DailyAggregate[]): Promise<void> {
  try {
    const cacheDir = join(process.cwd(), CACHE_DIR);
    const cachePath = join(cacheDir, CACHE_FILE);
    
    // Ensure cache directory exists
    try {
      await fs.mkdir(cacheDir, { recursive: true });
    } catch (mkdirError) {
      // Ignore error if directory already exists
      if ((mkdirError as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw mkdirError;
      }
    }
    
    // Write cache file
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(cachePath, jsonData, 'utf-8');
    
    console.log(`Cache written successfully: ${data.length} daily aggregates`);
  } catch (error) {
    console.error('Error writing cache:', error);
    throw new Error(`Failed to write cache: ${(error as Error).message}`);
  }
}

/**
 * Get cached daily aggregates or build from CSV if cache doesn't exist.
 * 
 * **This is the main entry point for accessing daily aggregates.**
 * 
 * **Caching Strategy:**
 * 1. First request: Parse CSV (slow, ~60s) → Write cache → Return data
 * 2. Subsequent requests: Read cache (fast, <100ms) → Return data
 * 3. If cache is corrupted: Rebuild from CSV automatically
 * 
 * **Design Trade-off:**
 * The cache doesn't auto-invalidate when the CSV changes. If the CSV is
 * updated, the cache must be manually deleted. This is acceptable for this
 * use case where the CSV is relatively static.
 * 
 * **SECURITY: Cache Lock Protection**
 * Uses a lock to prevent concurrent cache rebuilds. If multiple requests
 * arrive during initial indexing, only the first one parses the CSV.
 * Others wait for the first to complete, preventing:
 * - Excessive memory usage (multiple CSV streams)
 * - Wasted CPU (duplicate processing)
 * - Potential DoS attacks (intentional concurrent requests)
 * 
 * @returns Promise resolving to array of DailyAggregate objects
 * @throws Error if CSV file is not found or cannot be parsed
 */
export async function getCacheOrBuild(): Promise<DailyAggregate[]> {
  // Try to read from cache first (fast path, no lock needed)
  const cached = await readCache();
  
  if (cached !== null) {
    console.log(`Using cached data: ${cached.length} daily aggregates`);
    return cached;
  }
  
  // Cache doesn't exist or is corrupted, build from CSV with lock protection
  console.log('Cache not found or corrupted, building from CSV...');
  
  return withCacheLock(async () => {
    // Double-check cache after acquiring lock (another request might have built it)
    const cachedAfterLock = await readCache();
    if (cachedAfterLock !== null) {
      console.log(`Cache was built by another request: ${cachedAfterLock.length} daily aggregates`);
      return cachedAfterLock;
    }
    
    try {
      // Stream parse CSV and build aggregates
      const rows = streamParseCSV(CSV_FILE_PATH);
      const aggregates = await buildDailyAggregates(rows);
      
      // Write to cache for future requests
      await writeCache(aggregates);
      
      console.log(`Built ${aggregates.length} daily aggregates from CSV`);
      return aggregates;
    } catch (error) {
      // Handle CSV file not found
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`CSV file not found at path: ${CSV_FILE_PATH}`);
      }
      
      // Re-throw other errors
      throw new Error(`Failed to build aggregates from CSV: ${(error as Error).message}`);
    }
  });
}
