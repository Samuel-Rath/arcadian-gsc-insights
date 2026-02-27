/**
 * Simple in-memory lock to prevent concurrent cache rebuilds.
 * 
 * **Problem:**
 * If multiple requests arrive while cache is being built, they all try to
 * rebuild simultaneously, causing:
 * - Excessive memory usage (multiple CSV streams)
 * - Wasted CPU (duplicate processing)
 * - Potential file corruption (concurrent writes)
 * 
 * **Solution:**
 * Use a simple lock that allows only one rebuild at a time.
 * Other requests wait for the first one to complete.
 * 
 * **Implementation:**
 * - First request acquires lock and starts rebuild
 * - Subsequent requests wait on a promise
 * - When rebuild completes, all waiting requests get the result
 * - Lock is released automatically
 */

interface LockState {
  locked: boolean;
  promise: Promise<void> | null;
  resolve: (() => void) | null;
}

class CacheLock {
  private state: LockState = {
    locked: false,
    promise: null,
    resolve: null,
  };

  /**
   * Acquire the lock. If already locked, wait for it to be released.
   * 
   * @returns Promise that resolves when lock is acquired
   */
  async acquire(): Promise<void> {
    // If not locked, acquire immediately
    if (!this.state.locked) {
      this.state.locked = true;
      this.state.promise = new Promise((resolve) => {
        this.state.resolve = resolve;
      });
      return;
    }

    // If locked, wait for current operation to complete
    if (this.state.promise) {
      await this.state.promise;
      // After waiting, try to acquire again (recursive)
      return this.acquire();
    }
  }

  /**
   * Release the lock and notify all waiting requests.
   */
  release(): void {
    if (this.state.resolve) {
      this.state.resolve();
    }
    
    this.state.locked = false;
    this.state.promise = null;
    this.state.resolve = null;
  }

  /**
   * Check if lock is currently held.
   */
  isLocked(): boolean {
    return this.state.locked;
  }
}

// Global cache lock instance
export const cacheLock = new CacheLock();

/**
 * Execute a function with the cache lock held.
 * Automatically releases lock on completion or error.
 * 
 * @param fn - Async function to execute with lock held
 * @returns Result of the function
 */
export async function withCacheLock<T>(fn: () => Promise<T>): Promise<T> {
  await cacheLock.acquire();
  
  try {
    const result = await fn();
    return result;
  } finally {
    cacheLock.release();
  }
}
