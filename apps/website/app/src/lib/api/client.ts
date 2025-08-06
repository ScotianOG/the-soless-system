// src/lib/api/client.ts
import axios, { AxiosRequestConfig } from "axios";
import { shouldAllowRequest, triggerCircuitBreaker } from "./rateLimiter";

declare module "axios" {
  export interface AxiosRequestConfig {
    retry?: boolean;
    _retryCount?: number;
  }
}

// Fix API URL to use /api prefix for production, maintaining localhost for development
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:3001");

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
  timeoutErrorMessage: "Request timed out - please try again",
});

// Add rate limiting and wallet address header
apiClient.interceptors.request.use((config) => {
  const endpoint = config.url || "";

  // Check rate limiting
  if (!shouldAllowRequest(endpoint)) {
    return Promise.reject(
      new Error(
        "Rate limit exceeded. Please wait before making another request."
      )
    );
  }

  // Add wallet address header if available
  const walletAddress = localStorage.getItem("walletAddress");
  if (walletAddress) {
    config.headers = config.headers || {};
    config.headers["X-Wallet-Address"] = walletAddress;
  }

  return config;
});

// Add retry functionality for 429 and network errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;

    // Log the full error for debugging
    console.error("API Error:", {
      config: error.config,
      response: error.response,
      message: error.message,
    });

    // Don't retry if retry is disabled or we've exceeded retry count
    if (!config || config.retry === false) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount || 0;

    // Retry on 429 (rate limit) or network errors
    const shouldRetry =
      error.response?.status === 429 ||
      error.code === "ECONNABORTED" ||
      error.code === "NETWORK_ERROR" ||
      !error.response;

    // Trigger circuit breaker on 429 errors
    if (error.response?.status === 429) {
      triggerCircuitBreaker();
    }

    if (shouldRetry && config._retryCount < 3) {
      config._retryCount += 1;

      // Exponential backoff with jitter for 429 errors
      const baseDelay = error.response?.status === 429 ? 5000 : 1000; // Increased delay for 429
      const delay =
        baseDelay * Math.pow(2, config._retryCount - 1) + Math.random() * 2000;

      const backoff = new Promise((resolve) => {
        setTimeout(() => resolve(null), delay);
      });

      await backoff;
      return apiClient(config);
    }

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }

      // Create error with status code in message for easier checking
      const message = error.response.data?.error || error.response.statusText;
      return Promise.reject(new Error(`${error.response.status}: ${message}`));
    } else if (error.request) {
      // Request was made but no response received
      const message =
        error.code === "ECONNABORTED"
          ? "Request timed out - please check your connection and try again"
          : "No response from server - please try again";
      return Promise.reject(new Error(message));
    } else {
      // Something happened in setting up the request
      return Promise.reject(error);
    }
  }
);

// Configure default retry behavior
apiClient.defaults.retry = true;

// Export types for use in components
export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

export type ApiError = {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};
