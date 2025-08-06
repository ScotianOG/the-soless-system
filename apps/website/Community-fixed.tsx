// app/src/pages/Community.tsx - Fixed version for unregistered wallets
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Trophy,
  Users,
  Star,
  Flame,
  Share2,
  MessageCircle,
  Info,
  CalendarDays,
  Clock,
  Gift,
  CheckCircle,
  Medal,
  Sparkles,
  Award,
  Book,
  Plus,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { FaTelegram, FaDiscord, FaTwitter } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { InviteSection } from "../components/InviteSection";
import { statsApi, usersApi } from "../lib/api";
import { Activity } from "../lib/api/activity";
import { PlatformStats } from "../lib/api/types";
import PointsInfoModal from "../components/PointsInfoModal";
import StreakIndicator from "../components/StreakIndicator";
import ActivityFeed from "../components/ActivityFeed";
import PointsBreakdown from "../components/PointsBreakdown";
import ContestInfoModal from "../components/ContestInfoModal";
import RewardClaimModal from "../components/RewardClaimModal";
import CommunityGuide from "../components/CommunityGuide";
import AddPlatformModal from "../components/AddPlatformModal";

interface ExtendedPlatformStats {
  points: number;
  rank: number;
  engagements: number;
  streak: number;
  history: { date: string; points: number }[];
}

interface UserData {
  totalPoints: number;
  rank: number;
  platformStats: Record<string, ExtendedPlatformStats>;
}

export default function Community() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [showContestInfo, setShowContestInfo] = useState(false);
  const [showRewardClaim, setShowRewardClaim] = useState(false);
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);

  // User state management
  const [userState, setUserState] = useState<
    "loading" | "unconnected" | "unregistered" | "registered" | "error"
  >("unconnected");

  // Refs for preventing duplicate API calls
  const hasFetchedData = useRef(false);
  const isFetchingData = useRef(false);
  const lastFetchedWallet = useRef<string | null>(null);

  // Community overview data (always visible)
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    activeContests: 1,
    totalRewards: "$50,000+",
  });

  const transformPlatformStats = (
    apiStats: PlatformStats | undefined,
    defaultRank: number
  ): ExtendedPlatformStats => ({
    points: apiStats?.points ?? 0,
    rank: defaultRank,
    engagements: apiStats?.interactions ?? 0,
    streak: 0,
    history: [],
  });

  useEffect(() => {
    // Always load community stats first
    loadCommunityStats();

    // Then handle user-specific data
    if (!publicKey) {
      setUserState("unconnected");
      return;
    }

    handleWalletConnection();
  }, [publicKey]);

  const loadCommunityStats = async () => {
    try {
      // Load general community stats that don't require authentication
      const leaderboard = await statsApi.getLeaderboard();
      setCommunityStats({
        totalUsers: leaderboard?.length ?? 0,
        totalPoints:
          leaderboard?.reduce(
            (sum: number, user: any) => sum + (user.totalPoints ?? 0),
            0
          ) ?? 0,
        activeContests: 1,
        totalRewards: "$50,000+",
      });
    } catch (error) {
      console.log("Could not load community stats:", error);
      // Use default values, don't show error
    }
  };

  const handleWalletConnection = async () => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();

    // Reset if wallet changed
    if (
      lastFetchedWallet.current &&
      lastFetchedWallet.current !== walletAddress
    ) {
      hasFetchedData.current = false;
      setUserData(null);
      setError("");
      setUserState("loading");
    }

    // Prevent duplicate calls
    if (
      isFetchingData.current ||
      (lastFetchedWallet.current === walletAddress && hasFetchedData.current)
    ) {
      return;
    }

    isFetchingData.current = true;
    lastFetchedWallet.current = walletAddress;
    setUserState("loading");
    setLoading(true);

    try {
      // Check if user exists and is registered
      const user = await usersApi.getUser(walletAddress);

      if (!user) {
        setUserState("unregistered");
        setLoading(false);
        hasFetchedData.current = true;
        isFetchingData.current = false;
        return;
      }

      // Check if user has verified platforms
      const hasVerifiedPlatform =
        user.platforms &&
        Object.values(user.platforms).some((platform) => platform.verified);

      if (!hasVerifiedPlatform) {
        setUserState("unregistered");
        setLoading(false);
        hasFetchedData.current = true;
        isFetchingData.current = false;
        return;
      }

      // User is registered and verified - load full data
      const stats = await statsApi.getUserStats(walletAddress);

      const generateHistory = (startPoints: number) => {
        return Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            }
          ),
          points: Math.max(0, startPoints - Math.floor(Math.random() * 20) * i),
        })).reverse();
      };

      const transformedData: UserData = {
        totalPoints: stats.totalPoints,
        rank: stats.rank,
        platformStats: {
          TELEGRAM: {
            ...transformPlatformStats(stats.platforms?.telegram, stats.rank),
            history: generateHistory(stats.platforms?.telegram?.points ?? 30),
          },
          DISCORD: {
            ...transformPlatformStats(stats.platforms?.discord, stats.rank),
            history: generateHistory(stats.platforms?.discord?.points ?? 20),
          },
          TWITTER: {
            ...transformPlatformStats(stats.platforms?.twitter, stats.rank),
            history: generateHistory(stats.platforms?.twitter?.points ?? 25),
          },
        },
      };

      setUserData(transformedData);
      setUserState("registered");
      hasFetchedData.current = true;
    } catch (error: any) {
      console.error("Error fetching user data:", error);

      // Handle different error types gracefully
      if (
        error.message?.includes("404") ||
        error.message?.includes("User not found")
      ) {
        setUserState("unregistered");
      } else {
        setUserState("error");
        setError(`Failed to load user data: ${error.message}`);
      }
    } finally {
      setLoading(false);
      isFetchingData.current = false;
    }
  };

  // Render unconnected wallet state
  const renderUnconnectedState = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-soless-blue via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            SOLess Community
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join the revolution of gasless trading, viral NFT creation, and
            decentralized rewards
          </p>
        </div>

        {/* Community Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg border border-soless-blue/40 text-center">
            <div className="text-3xl font-bold text-soless-blue mb-2">
              {communityStats.totalUsers}+
            </div>
            <div className="text-gray-300">Active Members</div>
          </div>
          <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg border border-soless-blue/40 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {communityStats.totalPoints.toLocaleString()}+
            </div>
            <div className="text-gray-300">Points Earned</div>
          </div>
          <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg border border-soless-blue/40 text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">
              {communityStats.activeContests}
            </div>
            <div className="text-gray-300">Active Contests</div>
          </div>
          <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg border border-soless-blue/40 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {communityStats.totalRewards}
            </div>
            <div className="text-gray-300">Total Rewards</div>
          </div>
        </div>

        {/* Connect Wallet CTA */}
        <div className="bg-black/50 backdrop-blur-lg p-8 rounded-lg border border-soless-blue/40 text-center">
          <Wallet className="h-16 w-16 text-soless-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet to Join
          </h2>
          <p className="text-gray-300 mb-6">
            Connect your wallet to access the full community experience, earn
            points, and participate in contests.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-gradient-to-r from-soless-blue to-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Community Guide */}
        <div className="mt-12">
          <CommunityGuide />
        </div>
      </div>
    </div>
  );

  // Render unregistered state (wallet connected but not registered)
  const renderUnregisteredState = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-soless-blue via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Welcome to SOLess Community
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Your wallet is connected! Complete registration to unlock the full
            community experience.
          </p>
        </div>

        {/* Registration CTA */}
        <div className="bg-black/50 backdrop-blur-lg p-8 rounded-lg border border-soless-blue/40 text-center max-w-2xl mx-auto">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            Complete Your Registration
          </h2>
          <p className="text-gray-300 mb-6">
            Connect your social media accounts to start earning points and
            participating in the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-soless-blue to-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-200 flex items-center gap-2 justify-center"
            >
              Complete Registration <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="bg-gray-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 justify-center"
            >
              Learn More <Book className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Show community guide */}
        <div className="mt-12">
          <CommunityGuide />
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading && userState === "loading") {
    return <LoadingState />;
  }

  // Error state
  if (userState === "error") {
    return <ErrorState message={error} />;
  }

  // Unconnected wallet
  if (userState === "unconnected") {
    return renderUnconnectedState();
  }

  // Unregistered wallet
  if (userState === "unregistered") {
    return renderUnregisteredState();
  }

  // Registered user - show full community dashboard
  if (!userData) return null;

  // ... rest of the existing Community component for registered users ...
  // (The existing StatCard, PlatformEngagement, and full dashboard JSX goes here)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Full community dashboard for registered users */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-soless-blue via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Community Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Track your engagement and earn rewards
          </p>
        </div>

        {/* User stats and dashboard content... */}
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">Welcome back!</h2>
          <p>Total Points: {userData.totalPoints}</p>
          <p>Rank: {userData.rank}</p>
          {/* Add the rest of the existing dashboard components here */}
        </div>
      </div>

      {/* Modals - only render when needed */}
      {showPointsInfo && (
        <PointsInfoModal
          isOpen={showPointsInfo}
          setIsOpen={setShowPointsInfo}
        />
      )}
      {showContestInfo && (
        <ContestInfoModal
          isOpen={showContestInfo}
          setIsOpen={setShowContestInfo}
        />
      )}
      {showRewardClaim && (
        <RewardClaimModal
          isOpen={showRewardClaim}
          setIsOpen={setShowRewardClaim}
          wallet={publicKey?.toString() || ""}
        />
      )}
      {showAddPlatformModal && (
        <AddPlatformModal
          isOpen={showAddPlatformModal}
          setIsOpen={setShowAddPlatformModal}
          wallet={publicKey?.toString() || ""}
          existingPlatforms={{
            telegram: false,
            discord: false,
            twitter: false,
          }}
        />
      )}
    </div>
  );
}
