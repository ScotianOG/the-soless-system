// src/lib/api/verification.ts
import { apiClient } from "./client";
import { VerificationCode, VerificationData } from "./types";

export interface AccountInfo {
  username?: string;
  platformId?: string;
}

export interface ServerVerificationStatus {
  telegram: boolean;
  discord: boolean;
  twitter: boolean;
  accounts: {
    telegram?: AccountInfo;
    discord?: AccountInfo;
    twitter?: AccountInfo;
  };
}

export interface VerifyCodeData {
  platform: string;
  code: string;
  platformId: string;
  username: string;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

export const verificationApi = {
  generateCode: (wallet: string, platform: string) =>
    apiClient
      .post<VerificationCode>("/verifications/generate", {
        wallet,
        platform: platform.toUpperCase(),
      })
      .then((res) => res.data),

  verifyCode: (data: VerifyCodeData) =>
    apiClient
      .post<VerifyResponse>("/verifications/verify", data)
      .then((res) => res.data),

  getStatus: (wallet: string) =>
    apiClient
      .get<ServerVerificationStatus>(`/verifications/status/${wallet}`)
      .then((res) => res.data),
};
