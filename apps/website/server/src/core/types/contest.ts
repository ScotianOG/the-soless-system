import { Platform } from "./platform";

export type ContestStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

export type ContestTierName =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND";

export interface ContestTier {
  name: ContestTierName;
  minPoints: number;
  reward: RewardType;
}

export interface ContestPrize {
  rank: number;
  reward: RewardType;
  amount?: string;  // Optional to support non-monetary rewards
  description: string;
}

export interface ContestRules {
  entryRequirements: {
    minimumPoints: number;
    platforms: Platform[];
  };
  restrictions: {
    maxEntriesPerUser: number;
    cooldownPeriod: number;
  };
  bonuses: {
    streakMultiplier: number;
    platformMultiplier: Record<Platform, number>;
  };
}

export interface ContestStats {
  currentRound: string;
  timeLeft: string;
  qualifiedUsers: number;
}

export interface ContestMetadata {
  createdAt: Date;
  currentPhase: "START" | "END";
  qualifiedUsers: Array<{
    userId: string;
    points: number;
    rank?: number;
    reward?: RewardType;
  }>;
}

export type RewardType =
  | "USDC"
  | "SOLANA"
  | "SOUL"
  | "WHITELIST"
  | "FREE_MINT"
  | "FREE_GAS"
  | "NO_FEES"
  | "NONE";

export interface ContestConfig {
  enabled: boolean;
  roundDurationHours: number;
  minPointsToQualify: number;
  prizes: ContestPrize[];
  tiers?: ContestTier[]; // Optional to support both tier and rank systems
  rules: ContestRules;
}
