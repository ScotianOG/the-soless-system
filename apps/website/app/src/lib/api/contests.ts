// src/lib/api/contests.ts
import { apiClient } from "./client";
import { Contest, ContestEntry, ContestReward } from "./types";
import { handleApiError } from "./utils";

export interface ContestFormData {
  name: string;
  endTime: string;
  rules: {
    entryRequirements: {
      minimumPoints: number;
      platforms: string[];
    };
    tiers: Array<{
      name: string;
      minPoints: number;
      reward: string;
    }>;
  };
}

export const contestsApi = {
  getCurrent: () =>
    apiClient
      .get<Contest>("/contests/current")
      .then((res) => res.data)
      .catch((error) =>
        handleApiError(error, "Failed to fetch current contest")
      ),

  getEntries: (wallet: string) =>
    apiClient
      .get<ContestEntry[]>(`/contests/entries/${wallet}`)
      .then((res) => res.data)
      .catch((error) =>
        handleApiError(error, "Failed to fetch contest entries")
      ),

  getLeaderboard: (contestId: string) =>
    apiClient
      .get<ContestEntry[]>(`/contests/${contestId}/leaderboard`)
      .then((res) => res.data)
      .catch((error) => handleApiError(error, "Failed to fetch leaderboard")),

  getRewards: (wallet: string) =>
    apiClient
      .get<ContestReward[]>(`/contests/rewards/${wallet}`)
      .then((res) => res.data)
      .catch((error) => handleApiError(error, "Failed to fetch rewards")),

  claimReward: (rewardId: string) =>
    apiClient
      .post<{ success: boolean }>("/contests/rewards/claim", { rewardId })
      .then((res) => res.data)
      .catch((error) => handleApiError(error, "Failed to claim reward")),

  // New methods for the admin dashboard
  getAllContests: () =>
    apiClient
      .get<{ contests: Contest[] }>("/contests")
      .then((res) => res.data.contests)
      .catch((error) => handleApiError(error, "Failed to fetch all contests")),

  createContest: (formData: ContestFormData) =>
    apiClient
      .post<{ contest: Contest }>("/contests/start", formData)
      .then((res) => res.data.contest)
      .catch((error) => handleApiError(error, "Failed to create contest")),

  endContest: (id: string) =>
    apiClient
      .post<{ contest: Contest }>(`/contests/${id}/end`)
      .then((res) => res.data.contest)
      .catch((error) => handleApiError(error, "Failed to end contest")),

  distributeRewards: (id: string) =>
    apiClient
      .post<{ result: { contestId: string; rewardsDistributed: number } }>(
        `/contests/${id}/distribute-rewards`
      )
      .then((res) => ({
        success: true,
        message: `Successfully distributed rewards to ${res.data.result.rewardsDistributed} users`,
      }))
      .catch((error) => handleApiError(error, "Failed to distribute rewards")),
};
