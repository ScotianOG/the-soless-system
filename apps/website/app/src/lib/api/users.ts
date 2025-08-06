// src/lib/api/users.ts
import { apiClient } from "./client";
import { UserProfile } from "./types";

interface StreakUpdateResponse {
  success: boolean;
  currentStreak: number;
  lastUpdated: string;
}

// Simple cache to prevent rapid API calls
const userCache = new Map<
  string,
  { data: UserProfile | null; timestamp: number }
>();
const CACHE_DURATION = 300000; // 5 minutes - increased from 60 seconds

export const usersApi = {
  getUser: async (wallet: string): Promise<UserProfile | null> => {
    // Check cache first
    const cached = userCache.get(wallet);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.post<UserProfile>("/users/get", {
        wallet,
      });
      const userData = response.data;

      // Cache the result
      userCache.set(wallet, { data: userData, timestamp: Date.now() });
      return userData;
    } catch (error: any) {
      // If it's a 404 (user not found), cache null result
      if (error?.response?.status === 404) {
        userCache.set(wallet, { data: null, timestamp: Date.now() });
        return null;
      }
      throw error;
    }
  },

  updateStreak: (wallet: string, platform: string) =>
    apiClient
      .post<StreakUpdateResponse>("/users/streaks/update", { wallet, platform })
      .then((res) => res.data),
};
