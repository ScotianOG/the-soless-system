// src/lib/api/auth.ts
import { apiClient } from "./client";
import { AuthStatus } from "./types";

interface PlatformVerificationData {
  wallet: string;
  signature: string;
  message: string;
}

export const authApi = {
  // Twitter auth
  getTwitterAuthUrl: (wallet: string) =>
    `${apiClient.defaults.baseURL}/auth/twitter?wallet=${wallet}`,

  // Platform verification
  verifyPlatform: (platform: string, data: PlatformVerificationData) =>
    apiClient
      .post<{ success: boolean }>(`/auth/platform/${platform}/verify`, data)
      .then((res) => res.data),

  // Get auth status
  getAuthStatus: (wallet: string) =>
    apiClient.get<AuthStatus>(`/auth/status/${wallet}`).then((res) => res.data),
};
