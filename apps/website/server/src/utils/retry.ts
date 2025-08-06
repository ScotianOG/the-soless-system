// src/utils/retry.ts
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delayMs: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError!;
  }