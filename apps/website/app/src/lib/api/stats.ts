// src/lib/api/stats.ts
import { apiClient } from "./client";
import { UserStats, LeaderboardOptions } from "./types";

interface LeaderboardEntry {
  wallet: string;
  points: number;
  rank: number;
}

// Simple cache to prevent rapid API calls
const statsCache = new Map<string, { data: UserStats; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes - increased from 60 seconds

export const statsApi = {
  getUserStats: async (wallet: string): Promise<UserStats> => {
    // Check cache first
    const cached = statsCache.get(wallet);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiClient.get<UserStats>(`/stats/${wallet}`);
      const statsData = response.data;

      // Cache the result
      statsCache.set(wallet, { data: statsData, timestamp: Date.now() });
      return statsData;
    } catch (error) {
      throw error;
    }
  },

  getGlobalStats: async () => {
    try {
      const response = await apiClient.get("/stats/global");
      return response.data;
    } catch (error) {
      console.error("Error fetching global stats:", error);
      throw error;
    }
  },

  getLeaderboard: (options?: LeaderboardOptions) =>
    apiClient
      .get<LeaderboardEntry[]>("/stats/leaderboard", { params: options })
      .then((res) => res.data),

  getPlatformLeaderboard: (
    platform: string,
    options?: Omit<LeaderboardOptions, "platform">
  ) =>
    apiClient
      .get<LeaderboardEntry[]>(`/stats/leaderboard/${platform}`, {
        params: options,
      })
      .then((res) => res.data),
};
