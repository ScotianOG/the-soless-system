// Generic API response type
export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

// Auth types
export interface AuthStatus {
  isAuthenticated: boolean;
  wallet?: string;
}

// Contest types
export interface Contest {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "UPCOMING" | "COMPLETED";
  metadata?: Record<string, any>;
}

export interface ContestEntry {
  id: string;
  contestId: string;
  points: number;
  rank?: number;
  wallet: string;
  qualifiedAt?: string;
  metadata?: Record<string, any>;
  user?: {
    wallet: string;
    telegramUsername?: string;
    discordUsername?: string;
    twitterUsername?: string;
  };
}

export interface ContestReward {
  id: string;
  contestId: string;
  type:
    | "USDC"
    | "SOLANA"
    | "SOUL"
    | "WHITELIST"
    | "FREE_MINT"
    | "FREE_GAS"
    | "NO_FEES"
    | "NONE";
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  amount?: string;
  description?: string;
  claimedAt?: string;
  expiresAt?: string;
  metadata?: {
    amount?: string;
    description?: string;
    rewardSystem?: "tier" | "rank";
    tierName?: string;
    rank?: number;
    qualifyingPoints?: number;
    actualPoints?: number;
  };
  contest: {
    name: string;
    endTime: string;
  };
}

// Invite types
export interface Invite {
  id: string;
  code: string;
  fullInviteLink: string;
  usedCount: number;
  createdAt: string;
  claimsCount: number;
}

// Stats types
export interface UserStats {
  wallet: string;
  totalPoints: number;
  rank: number;
  platforms: Record<string, PlatformStats>;
}

export interface PlatformStats {
  points: number;
  interactions: number;
  lastInteraction?: string;
}

export interface LeaderboardOptions {
  limit?: number;
  offset?: number;
  timeframe?: "all" | "month" | "week" | "day";
}

// User types
export interface UserProfile {
  wallet: string;
  username?: string;
  platforms: Record<string, PlatformProfile>;
}

export interface PlatformProfile {
  username: string;
  verified: boolean;
  lastVerified?: string;
}

// Verification types
export interface VerificationCode {
  code: string;
  expiresAt: string;
}

export interface VerificationStatus {
  verified: boolean;
  lastVerified?: string;
}

export interface VerificationData {
  wallet: string;
  platform: string;
  code: string;
  proof: string;
}
