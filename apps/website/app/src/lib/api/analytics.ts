// src/lib/api/analytics.ts
import { apiClient } from "./client";
import { handleApiError } from "./utils";

interface EngagementStats {
  totalUsers: number;
  activeToday: number;
  totalPoints: number;
  platformStats: {
    TELEGRAM: { activeUsers: number; totalPoints: number };
    DISCORD: { activeUsers: number; totalPoints: number };
    TWITTER: { activeUsers: number; totalPoints: number };
  };
  topActions: Record<string, number>;
  contest: {
    currentRound: string;
    timeLeft: string;
    qualifiedUsers: number;
  } | null;
}

interface TimeSeriesData {
  date: string;
  TELEGRAM: {
    engagements: number;
    points: number;
  };
  DISCORD: {
    engagements: number;
    points: number;
  };
  TWITTER: {
    engagements: number;
    points: number;
  };
  newUsers: number;
  total: {
    engagements: number;
    points: number;
  };
}

interface ActionBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export type TimeFrame = "DAY" | "WEEK" | "MONTH" | "YEAR";

export const analyticsApi = {
  async getGlobalStats(): Promise<EngagementStats> {
    try {
      const response = await apiClient.get("/stats/global");
      return response.data;
    } catch (error) {
      return handleApiError(error, "Failed to fetch global stats");
    }
  },

  async getTimeSeriesData(
    timeFrame: TimeFrame = "WEEK"
  ): Promise<TimeSeriesData[]> {
    try {
      const response = await apiClient.get(
        `/stats/timeseries?timeframe=${timeFrame}`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error, "Failed to fetch time series data");
    }
  },

  async getActionBreakdown(days: number = 7): Promise<ActionBreakdown[]> {
    try {
      const response = await apiClient.get(`/stats/actions?days=${days}`);
      return response.data.actions;
    } catch (error) {
      return handleApiError(error, "Failed to fetch action breakdown");
    }
  },
};
