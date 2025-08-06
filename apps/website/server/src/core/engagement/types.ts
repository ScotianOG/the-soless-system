import { EngagementEvent, Platform } from '../types';
import { ContestStats } from '../types/contest';

export interface IEngagementTracker {
  trackEngagement(event: EngagementEvent): Promise<boolean>;
  getGlobalStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    totalPoints: number;
    platformStats: Record<Platform, {
      activeUsers: number;
      totalPoints: number;
    }>;
    topActions: Record<string, number>;
    contest: ContestStats;
  }>;
  getUserStats(userId: string): Promise<{
    userId: string;
    totalPoints: number;
    rank: number;
    platformStats: Record<Platform, {
      points: number;
      rank: number;
      streak: number;
    }>;
    streaks: Record<Platform, number>;
    recentActivity: Array<{
      timestamp: Date;
      points: number;
      type: string;
      platform: string;
      description: string;
    }>;
  }>;
  startContestRound(): Promise<void>;
  endContestRound(): Promise<void>;
}
