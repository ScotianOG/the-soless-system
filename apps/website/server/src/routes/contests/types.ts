// src/routes/contests/types.ts
import {
  ContestRules,
  ContestMetadata,
  ContestStatus,
  RewardType,
} from "../../core/types/contest";

export interface ContestRequestBody {
  name: string;
  endTime: string | Date;
  rules?: ContestRules;
}

export interface ContestResponse {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  status: ContestStatus;
  metadata?: ContestMetadata;
}

export interface ContestEntryResponse {
  id: string;
  contestId: string;
  userId: string;
  points: number;
  contest: ContestResponse;
  user: {
    wallet: string;
    points: number;
    telegramUsername?: string;
    discordUsername?: string;
    twitterUsername?: string;
  };
}

export interface ContestRewardResponse {
  id: string;
  contestId: string;
  userId: string;
  type: RewardType;
  status: string;
  expiresAt: Date;
  claimedAt?: Date;
  metadata: {
    amount?: string;
    description?: string;
    rewardSystem: "tier" | "rank";
  };
  contest: {
    name: string;
    endTime: Date;
  };
}
