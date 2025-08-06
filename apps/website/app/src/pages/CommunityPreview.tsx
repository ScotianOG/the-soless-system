// CommunityPreview.tsx - A version of the Community page that doesn't require authentication
import React, { useState } from "react";
import { Trophy, Users, Star, Flame, Book } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PointsInfoModal from "../components/PointsInfoModal";
import StreakIndicator from "../components/StreakIndicator";
import ActivityFeed from "../components/ActivityFeed";
import PointsBreakdown from "../components/PointsBreakdown";
import ContestInfoModal from "../components/ContestInfoModal";
import CommunityGuide from "../components/CommunityGuide";
import { Link } from "react-router-dom";

interface Activity {
  id: string;
  userId: string;
  username: string;
  action: string;
  platform: "TELEGRAM" | "DISCORD" | "TWITTER";
  points: number;
  timestamp: string;
}

// Mock data
const MOCK_RECENT_ACTIVITY = Array.from({ length: 5 }, (_, i) => ({
  id: String(Date.now() + i),
  userId: "user123",
  username: "user123",
  action: ["MESSAGE", "QUALITY_POST", "MENTION", "FACT_SHARE", "INVITE"][i % 5],
  platform: ["TELEGRAM", "DISCORD", "TWITTER"][Math.floor(Math.random() * 3)] as "TELEGRAM" | "DISCORD" | "TWITTER",
  points: Math.floor(Math.random() * 10) + 1,
  timestamp: new Date(Date.now() - i * 3600000).toLocaleString(),
}));

const MOCK_HISTORY = (startPoints: number) => {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    points: Math.max(0, startPoints - Math.floor(Math.random() * 20) * i),
  })).reverse();
};

const CommunityPreview = () => {
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);

  // Mock user data for preview purposes
  const mockUserData = {
    totalPoints: 1250,
    rank: 45,
    platformStats: {
      TELEGRAM: {
        points: 450,
        rank: 30,
        engagements: 125,
        streak: 3,
        history: MOCK_HISTORY(450),
      },
      DISCORD: {
        points: 550,
        rank: 25,
        engagements: 210,
        streak: 5,
        history: MOCK_HISTORY(550),
      },
      TWITTER: {
        points: 250,
        rank: 40,
        engagements: 85,
        streak: 2,
        history: MOCK_HISTORY(250),
      },
    },
    recentActivity: MOCK_RECENT_ACTIVITY,
  };

  // Count active platforms (platforms with points > 0)
  const getActivePlatformsCount = () => {
    return Object.values(mockUserData.platformStats).filter(
      (stats) => stats.points > 0
    ).length;
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg border border-soless-blue/40">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-300 font-medium">{title}</h3>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  const PlatformEngagement = ({
    platform,
    stats,
    platformKey,
  }: {
    platform: string;
    stats: any;
    platformKey: "telegram" | "discord" | "twitter";
  }) => (
    <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg border border-soless-blue/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-soless-blue">{platform}</h3>
        <div className="flex items-center space-x-2">
          <Flame
            className={stats.streak > 0 ? "text-orange-400" : "text-gray-600"}
            size={16}
          />
          <span className="text-sm text-gray-400">{stats.streak}d streak</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-gray-400 text-sm">Points</p>
          <p className="text-white text-lg font-medium">{stats.points}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Rank</p>
          <p className="text-white text-lg font-medium">#{stats.rank}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Engagements</p>
          <p className="text-white text-lg font-medium">{stats.engagements}</p>
        </div>
      </div>

      <StreakIndicator currentStreak={stats.streak} platform={platformKey} />

      <div className="h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={stats.history}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
              }}
            />
            <Line
              type="monotone"
              dataKey="points"
              stroke={
                platformKey === "telegram"
                  ? "#3B82F6"
                  : platformKey === "discord"
                  ? "#6366F1"
                  : "#0EA5E9"
              }
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
        <p className="text-sm text-yellow-400">
          <strong>PREVIEW MODE:</strong> This is a preview of the community
          page.{" "}
          <Link to="/register" className="underline">
            Register
          </Link>{" "}
          or{" "}
          <Link to="/login" className="underline">
            log in
          </Link>{" "}
          to access the full features.
        </p>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10"></div>
        <img
          src="/assets/images/spring-banner.jpg"
          alt="Spring SOLstice Contest Banner"
          className="w-full object-cover h-80"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Spring <span className="text-green-400">SOLstice</span> Contest
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-md">
              Join the community celebration and earn rewards while helping
              build the SOLess ecosystem
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Register Now
              </Link>
              <a
                href="#community-guide"
                className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                <Book className="mr-2 h-5 w-5 text-soless-blue" />
                Community Guide
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-soless-blue">
              Dashboard Preview
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Points"
            value={mockUserData.totalPoints}
            icon={Trophy}
            color="text-yellow-400"
          />
          <StatCard
            title="Global Rank"
            value={`#${mockUserData.rank}`}
            icon={Star}
            color="text-purple-400"
          />
          <StatCard
            title="Active Platforms"
            value={getActivePlatformsCount()}
            icon={Users}
            color="text-soless-blue"
          />
          <StatCard
            title="Best Streak"
            value={Math.max(
              mockUserData.platformStats.TELEGRAM.streak,
              mockUserData.platformStats.DISCORD.streak,
              mockUserData.platformStats.TWITTER.streak
            )}
            icon={Flame}
            color="text-orange-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <PlatformEngagement
            platform="Telegram"
            stats={mockUserData.platformStats.TELEGRAM}
            platformKey="telegram"
          />
          <PlatformEngagement
            platform="Discord"
            stats={mockUserData.platformStats.DISCORD}
            platformKey="discord"
          />
          <PlatformEngagement
            platform="Twitter"
            stats={mockUserData.platformStats.TWITTER}
            platformKey="twitter"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PointsBreakdown
            total={mockUserData.totalPoints}
            telegramPoints={mockUserData.platformStats.TELEGRAM.points}
            discordPoints={mockUserData.platformStats.DISCORD.points}
            twitterPoints={mockUserData.platformStats.TWITTER.points}
          />
          <ActivityFeed
            activities={mockUserData.recentActivity as unknown as Activity[]}
          />
        </div>

        {/* Community Guide Section */}
        <div className="mb-8" id="community-guide">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-soless-blue flex items-center">
              <Book className="mr-2 h-6 w-6" />
              Community Guide
            </h2>
          </div>
          <CommunityGuide />
        </div>
      </div>

      {/* Modals */}
      <PointsInfoModal
        isOpen={isPointsModalOpen}
        setIsOpen={setIsPointsModalOpen}
      />
      <ContestInfoModal
        isOpen={isContestModalOpen}
        setIsOpen={setIsContestModalOpen}
      />
    </div>
  );
};

export default CommunityPreview;
