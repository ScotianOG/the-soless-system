import { apiClient } from "./client";

export interface Activity {
  id: string;
  userId: string;
  username: string;
  action: string;
  platform: "TELEGRAM" | "DISCORD" | "TWITTER";
  points: number;
  timestamp: string;
}

export const activityApi = {
  getRecentActivity: async (limit: number = 10): Promise<Activity[]> => {
    const response = await apiClient.get("/activity/recent", {
      params: { limit },
    });
    // Backend returns { activities: [...], total, limit, offset }
    // Extract just the activities array
    return response.data.activities || response.data;
  },
};
