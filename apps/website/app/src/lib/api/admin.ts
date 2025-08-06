import { apiClient } from "./client";

export interface ContestConfig {
  id?: string;
  name: string;
  endTime: string;
  rules: {
    minPoints: number;
    bronzeTier: number;
    silverTier: number;
    goldTier: number;
    platinumTier: number;
    diamondTier: number;
  };
  prizes?: {
    [tier: string]: {
      amount: number;
      rank: number;
    };
  };
}

export interface PlatformConfig {
  platform: "TELEGRAM" | "DISCORD" | "TWITTER";
  enabled: boolean;
  pointRules: {
    [action: string]: {
      points: number;
      cooldown: number;
      multiplier?: number;
    };
  };
}

export interface ContestStats {
  id: string;
  name: string;
  status: "UPCOMING" | "ACTIVE" | "PAUSED" | "COMPLETED";
  startTime: string;
  endTime: string;
  totalParticipants: number;
  qualifiedUsers: number;
  totalPoints: number;
  platformStats: {
    [platform: string]: {
      activeUsers: number;
      totalPoints: number;
    };
  };
}

export interface UserAnalytics {
  totalUsers: number;
  activeToday: number;
  newUsersToday: number;
  platformDistribution: {
    [platform: string]: number;
  };
  topUsers: Array<{
    userId: string;
    username?: string;
    totalPoints: number;
    platform: string;
  }>;
}

export interface WhiteLabelConfig {
  name: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
  };
  contestConfig: ContestConfig;
  platformConfigs: PlatformConfig[];
}

export const adminApi = {
  // Contest Management
  async getContestConfig(): Promise<any> {
    const response = await apiClient.get("/admin/contest/config");
    return response.data;
  },

  async updateContestConfig(config: any): Promise<any> {
    const response = await apiClient.put("/admin/contest/config", config);
    return response.data;
  },

  // Contest Control
  async startContest(): Promise<any> {
    const response = await apiClient.post("/admin/contest/action", {
      action: "start",
    });
    return response.data;
  },

  async stopContest(): Promise<any> {
    const response = await apiClient.post("/admin/contest/action", {
      action: "stop",
    });
    return response.data;
  },

  async pauseContest(): Promise<any> {
    const response = await apiClient.post("/admin/contest/action", {
      action: "pause",
    });
    return response.data;
  },

  async resumeContest(): Promise<any> {
    const response = await apiClient.post("/admin/contest/action", {
      action: "resume",
    });
    return response.data;
  },

  // Platform Management
  async getPlatformConfigs(): Promise<any> {
    const response = await apiClient.get("/admin/platforms");
    return response.data;
  },

  async updatePlatformConfig(platform: string, updates: any): Promise<any> {
    const config = { platform, ...updates };
    const response = await apiClient.put("/admin/platforms", config);
    return response.data;
  },

  // Analytics
  async getRealtimeStats(): Promise<any> {
    const response = await apiClient.get("/admin/analytics/realtime");
    return response.data;
  },

  // White Label Export
  async exportConfig(): Promise<any> {
    const response = await apiClient.get("/admin/export/config");
    return response.data;
  },

  async importConfig(config: any): Promise<void> {
    await apiClient.post("/admin/import/config", config);
  },

  // System Health
  async getSystemHealth(): Promise<any> {
    const response = await apiClient.get("/admin/system/health");
    return response.data;
  },

  async getSystemLogs(limit: number = 100): Promise<any[]> {
    const response = await apiClient.get(`/admin/system/logs?limit=${limit}`);
    return response.data;
  },

  // Social AI Management
  async getSocialAIStatus(): Promise<any> {
    const response = await apiClient.get("/admin/social-ai/status");
    return response.data;
  },

  async getSocialAIConfig(): Promise<any> {
    const response = await apiClient.get("/admin/social-ai/config");
    return response.data;
  },

  async updateSocialAIConfig(config: any): Promise<any> {
    const response = await apiClient.put("/admin/social-ai/config", config);
    return response.data;
  },

  async controlSocialAI(
    action: "start" | "stop" | "pause" | "resume"
  ): Promise<any> {
    const response = await apiClient.post(`/admin/social-ai/control/${action}`);
    return response.data;
  },

  async getSocialAIAnalytics(timeframe: string = "24h"): Promise<any> {
    const response = await apiClient.get(
      `/admin/social-ai/analytics?timeframe=${timeframe}`
    );
    return response.data;
  },

  async getSocialAITemplates(): Promise<any[]> {
    const response = await apiClient.get("/admin/social-ai/templates");
    return response.data;
  },

  async createSocialAITemplate(template: any): Promise<any> {
    const response = await apiClient.post(
      "/admin/social-ai/templates",
      template
    );
    return response.data;
  },

  async updateSocialAITemplate(id: string, template: any): Promise<any> {
    const response = await apiClient.put(
      `/admin/social-ai/templates/${id}`,
      template
    );
    return response.data;
  },

  async deleteSocialAITemplate(id: string): Promise<void> {
    await apiClient.delete(`/admin/social-ai/templates/${id}`);
  },

  async createTestPost(
    content: string,
    platform: string = "twitter"
  ): Promise<any> {
    const response = await apiClient.post("/admin/social-ai/test-post", {
      content,
      platform,
    });
    return response.data;
  },

  async getSocialAIQueue(): Promise<any[]> {
    const response = await apiClient.get("/admin/social-ai/queue");
    return response.data;
  },

  async cancelQueuedPost(id: string): Promise<void> {
    await apiClient.delete(`/admin/social-ai/queue/${id}`);
  },
};
