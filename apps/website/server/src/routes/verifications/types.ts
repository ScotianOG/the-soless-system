export type Platform = "TELEGRAM" | "DISCORD" | "TWITTER";

export interface VerificationCode {
  id: string;
  code: string;
  userId: string;
  platform: Platform;
  expiresAt: Date;
  isUsed: boolean;
}

export interface VerificationStatus {
  telegram: boolean;
  discord: boolean;
  twitter: boolean;
  accounts: {
    telegram?: any;
    discord?: any;
    twitter?: any;
  };
}

export interface GenerateCodeRequest {
  wallet: string;
  platform: Platform;
}

export interface VerifyCodeRequest {
  platform: Platform;
  code: string;
  platformId: string;
  username: string;
}
