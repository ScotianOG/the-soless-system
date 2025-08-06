// src/lib/api/rateLimiter.ts

interface RateLimitState {
  lastRequest: number;
  requestCount: number;
}

const rateLimitState = new Map<string, RateLimitState>();
const MIN_REQUEST_INTERVAL = 100; // Reduced from 3000ms to 100ms
const MAX_REQUESTS_PER_MINUTE = 1000; // Increased from 3 to 1000
const MINUTE_MS = 60000;

// Global request tracking to prevent any rapid-fire requests
const globalRequestTracker = new Map<string, number>();
const GLOBAL_DEBOUNCE_TIME = 50; // Reduced from 2000ms to 50ms

// Circuit breaker for 429 errors - very relaxed
const circuitBreaker = {
  isOpen: false,
  openedAt: 0,
  resetTimeout: 5000, // Reduced from 30 seconds to 5 seconds
};

const checkCircuitBreaker = (): boolean => {
  // Always allow requests - circuit breaker disabled
  return true;

  /* ORIGINAL CODE DISABLED:
  if (!circuitBreaker.isOpen) return true;

  const now = Date.now();
  if (now - circuitBreaker.openedAt > circuitBreaker.resetTimeout) {
    console.log("Circuit breaker reset - allowing requests again");
    circuitBreaker.isOpen = false;
    return true;
  }

  console.log("Circuit breaker is open - blocking request");
  return false;
  */
};

const openCircuitBreaker = (): void => {
  // Circuit breaker disabled - do nothing
  console.log("Circuit breaker trigger ignored (disabled)");

  /* ORIGINAL CODE DISABLED:
  console.log("Opening circuit breaker due to rate limiting");
  circuitBreaker.isOpen = true;
  circuitBreaker.openedAt = Date.now();
  */
};

export const shouldAllowRequest = (endpoint: string): boolean => {
  // Temporarily disable client-side rate limiting entirely
  // since we've resolved the server-side rate limiting issues
  return true;

  /* ORIGINAL CODE DISABLED:
  const now = Date.now();

  // Check circuit breaker first
  if (!checkCircuitBreaker()) {
    return false;
  }

  // Check global debounce first
  const lastGlobalRequest = globalRequestTracker.get(endpoint);
  if (lastGlobalRequest && now - lastGlobalRequest < GLOBAL_DEBOUNCE_TIME) {
    console.log(`Global debounce active for ${endpoint}`);
    return false;
  }

  const state = rateLimitState.get(endpoint);

  if (!state) {
    rateLimitState.set(endpoint, { lastRequest: now, requestCount: 1 });
    globalRequestTracker.set(endpoint, now);
    return true;
  }

  // Reset count if a minute has passed
  if (now - state.lastRequest > MINUTE_MS) {
    state.requestCount = 1;
    state.lastRequest = now;
    globalRequestTracker.set(endpoint, now);
    return true;
  }

  // Check if too many requests in the last minute
  if (state.requestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.log(
      `Rate limit exceeded for ${endpoint}: ${state.requestCount}/${MAX_REQUESTS_PER_MINUTE}`
    );
    openCircuitBreaker();
    return false;
  }

  // Check if too soon since last request
  if (now - state.lastRequest < MIN_REQUEST_INTERVAL) {
    console.log(
      `Request too soon for ${endpoint}: ${
        now - state.lastRequest
      }ms < ${MIN_REQUEST_INTERVAL}ms`
    );
    return false;
  }

  state.requestCount++;
  state.lastRequest = now;
  globalRequestTracker.set(endpoint, now);
  return true;
  */
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000 // Increased from 1000 to 2000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on 4xx errors except 429
      if (
        error?.response?.status >= 400 &&
        error?.response?.status < 500 &&
        error?.response?.status !== 429
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000; // Increased jitter
      console.log(
        `Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

// Export circuit breaker function for external use
export const triggerCircuitBreaker = openCircuitBreaker;
