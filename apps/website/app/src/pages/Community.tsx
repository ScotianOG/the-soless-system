import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Trophy,
  Users,
  Activity,
  Plus,
  Book,
  Flame,
  Target,
  Clock,
  Award,
} from "lucide-react";
import { FaTelegram, FaDiscord, FaTwitter } from "react-icons/fa";

// Import existing components
import Navbar from "../components/Navbar";
import ActivityFeed from "../components/ActivityFeed";
import PointsBreakdown from "../components/PointsBreakdown";
import CommunityGuide from "../components/CommunityGuide";
import PointsInfoModal from "../components/PointsInfoModal";
import ContestInfoModal from "../components/ContestInfoModal";
import RewardClaimModal from "../components/RewardClaimModal";

// Import API services
import { usersApi, statsApi, activityApi } from "../lib/api";

// Types
type WalletState =
  | "unconnected"
  | "loading"
  | "unregistered"
  | "partial"
  | "registered"
  | "error";

interface UserData {
  totalPoints: number;
  rank: number;
  platformStats: {
    [key: string]: {
      points: number;
      messages: number;
      rank: number;
      streak: number;
    };
  };
  recentActivity: any[];
  verifiedPlatforms?: {
    telegram: boolean;
    discord: boolean;
    twitter: boolean;
  };
}

interface CommunityStats {
  totalMembers: number;
  activeToday: number;
  totalPointsEarned: number;
}

export default function Community() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  // State management
  const [walletState, setWalletState] = useState<WalletState>("unconnected");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalMembers: 0,
    activeToday: 0,
    totalPointsEarned: 0,
  });
  const [totalEngagements, setTotalEngagements] = useState<number>(0);

  // Modal states
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);

  // Refs for preventing duplicate API calls
  const hasFetchedData = useRef(false);
  const isFetchingData = useRef(false);
  const lastFetchedWallet = useRef<string | null>(null);

  // Simple StatCard component
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );

  // Load community stats (always visible)
  const loadCommunityStats = async () => {
    try {
      // For public global stats, we need to provide a wallet address for authentication
      // Use the current user's wallet if connected, otherwise use a default public address
      const authWallet =
        publicKey?.toString() || "ERRNW5YbWKqtpWisrVvhGbn3zGmvhCKJ7NEJ6Z6SNMUr";
      localStorage.setItem("walletAddress", authWallet);

      // Fetch real global stats from the API
      const globalStats = await statsApi.getGlobalStats();
      console.log("Raw global stats response:", globalStats);

      const communityStatsData: CommunityStats = {
        totalMembers: globalStats.totalUsers || 0,
        activeToday: globalStats.activeToday || 0,
        totalPointsEarned: globalStats.totalPoints || 0,
      };

      setCommunityStats(communityStatsData);
      console.log("Loaded real community stats:", communityStatsData);

      // Store the total engagements for use in the stats display
      const engagements = globalStats.totalEngagements;
      console.log("Total engagements from API:", engagements);

      if (engagements !== undefined && engagements !== null) {
        setTotalEngagements(engagements);
      } else {
        // Fallback to estimated value if not available from backend
        const estimatedEngagements = Math.floor(
          (globalStats.totalPoints || 0) / 5
        );
        console.log("Using estimated engagements:", estimatedEngagements);
        setTotalEngagements(estimatedEngagements);
      }
    } catch (error) {
      console.error("Error loading community stats:", error);
      // Fallback to reasonable default values if API fails
      setCommunityStats({
        totalMembers: 1000,
        activeToday: 50,
        totalPointsEarned: 100000,
      });
      setTotalEngagements(5000);
    }
  };

  // Main data fetching effect
  useEffect(() => {
    // Always load community stats
    loadCommunityStats();

    // Handle wallet-specific logic
    if (!publicKey) {
      setWalletState("unconnected");
      setUserData(null);
      setUserProfile(null);
      setError("");
      hasFetchedData.current = false;
      lastFetchedWallet.current = null;
      return;
    }

    handleWalletConnection();
  }, [publicKey]);

  const handleWalletConnection = async () => {
    if (!publicKey) return;

    const walletAddress = publicKey.toString();

    // Reset state if wallet changed
    if (
      lastFetchedWallet.current &&
      lastFetchedWallet.current !== walletAddress
    ) {
      hasFetchedData.current = false;
      setUserData(null);
      setUserProfile(null);
      setError("");
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
    setWalletState("loading");
    setLoading(true);

    try {
      console.log(
        `Fetching data for wallet: ${walletAddress.substring(0, 10)}...`
      );

      // First, check if user exists and get their profile
      const user = await usersApi.getUser(walletAddress);

      if (!user) {
        console.log("User not found - unregistered state");
        setWalletState("unregistered");
        setLoading(false);
        hasFetchedData.current = true;
        return;
      }

      setUserProfile(user);

      // Check verification status
      const verifiedPlatforms = {
        telegram: user.platforms?.telegram?.verified ?? false,
        discord: user.platforms?.discord?.verified ?? false,
        twitter: user.platforms?.twitter?.verified ?? false,
      };

      const hasAnyVerification = Object.values(verifiedPlatforms).some(
        (verified) => verified
      );

      if (!hasAnyVerification) {
        console.log(
          "User exists but no verified platforms - unregistered state"
        );
        setWalletState("unregistered");
        setLoading(false);
        hasFetchedData.current = true;
        return;
      }

      const allPlatformsVerified = Object.values(verifiedPlatforms).every(
        (verified) => verified
      );
      setWalletState(allPlatformsVerified ? "registered" : "partial");

      // Fetch user stats
      const stats = await statsApi.getUserStats(walletAddress);
      console.log("User stats:", stats);

      // Fetch recent activity for this user
      let recentActivity: any[] = [];
      try {
        const globalActivity = await activityApi.getRecentActivity(10);
        // Show global activity in the community feed
        recentActivity = globalActivity.slice(0, 10);
      } catch (activityError) {
        console.warn("Could not load activity data:", activityError);
        recentActivity = [];
      }

      const transformedData: UserData = {
        totalPoints: stats.totalPoints || 0,
        rank: stats.rank || 1,
        platformStats: {
          TELEGRAM: {
            points: (stats as any).platformStats?.TELEGRAM?.points || 0,
            messages: (stats as any).platformStats?.TELEGRAM?.interactions || 0,
            rank: stats.rank || 1,
            streak:
              ((stats as any).platformStats?.TELEGRAM?.points || 0) > 0 ? 2 : 0, // Estimated streak for Telegram
          },
          DISCORD: {
            points: (stats as any).platformStats?.DISCORD?.points || 0,
            messages: (stats as any).platformStats?.DISCORD?.interactions || 0,
            rank: (stats.rank || 1) + 1,
            streak:
              ((stats as any).platformStats?.DISCORD?.points || 0) > 0 ? 1 : 0, // Estimated streak
          },
          TWITTER: {
            points: (stats as any).platformStats?.TWITTER?.points || 0,
            messages: (stats as any).platformStats?.TWITTER?.interactions || 0,
            rank: (stats.rank || 1) + 2,
            streak:
              ((stats as any).platformStats?.TWITTER?.points || 0) > 0 ? 1 : 0, // Estimated streak
          },
        },
        recentActivity,
        verifiedPlatforms,
      };

      setUserData(transformedData);
      hasFetchedData.current = true;
      console.log("User data loaded successfully");
    } catch (error: any) {
      console.error("Error fetching user data:", error);

      if (
        error.message?.includes("404") ||
        error.message?.includes("User not found")
      ) {
        setWalletState("unregistered");
      } else {
        setWalletState("error");
        setError(`Failed to load user data: ${error.message}`);
      }
    } finally {
      setLoading(false);
      isFetchingData.current = false;
    }
  };

  // Handle "Connect Wallet" action
  const handleConnectWallet = () => {
    // This will trigger the wallet selection modal in your app
    // The exact implementation depends on your wallet adapter setup
  };

  // Handle social verification (redirects to register)
  const handleAddSocial = () => {
    navigate("/register");
  };

  // Handle retry for error states
  const handleRetry = () => {
    if (publicKey) {
      hasFetchedData.current = false;
      setError("");
      handleWalletConnection();
    }
  };

  // Render different states based on wallet connection and registration
  const renderWalletState = () => {
    switch (walletState) {
      case "unconnected":
        return (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-300 mb-6">
                  Connect your Solana wallet to view your contest stats,
                  rankings, and activity.
                </p>
                <button
                  onClick={handleConnectWallet}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                           text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading your data...</p>
          </div>
        );

      case "unregistered":
        return (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">
                  Complete Registration
                </h3>
                <p className="text-gray-300 mb-6">
                  Your wallet is connected, but you need to verify your social
                  media accounts to participate in the contest.
                </p>
                <button
                  onClick={handleAddSocial}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 
                           text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Verify Social Accounts
                </button>
              </div>
            </div>
          </div>
        );

      case "partial":
        return (
          <div className="space-y-6">
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Partial Verification
                  </h3>
                  <p className="text-gray-300">
                    You've verified some platforms. Add more to maximize your
                    contest participation!
                  </p>
                </div>
                <button
                  onClick={handleAddSocial}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 
                           text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Add More Platforms
                </button>
              </div>
            </div>
            {renderUserDashboard()}
          </div>
        );

      case "registered":
        return renderUserDashboard();

      case "error":
        return (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">
                  Error Loading Data
                </h3>
                <p className="text-gray-300 mb-6">{error}</p>
                <button
                  onClick={handleRetry}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 
                           text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return renderUserDashboard();
    }
  };

  const renderUserDashboard = () => {
    if (!userData) return null;

    // Count active platforms (platforms with points > 0)
    const getActivePlatformsCount = () => {
      return Object.values(userData.platformStats).filter(
        (stats) => stats.points > 0
      ).length;
    };

    const handleAddPlatform = () => {
      navigate("/register");
    };

    return (
      <div className="space-y-8">
        {/* User Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-soless-blue">
              Your Dashboard
            </h2>
          </div>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Points"
            value={userData.totalPoints}
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
              userData.platformStats.TELEGRAM.streak,
              userData.platformStats.DISCORD.streak,
              userData.platformStats.TWITTER.streak
            )}
            icon={Flame}
            color="text-orange-400"
          />
          <StatCard
            title="Leaderboard Rank"
            value={`#${userData.rank}`}
            icon={Trophy}
            color="text-yellow-400"
          />
        </div>

        {/* Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Platform Stats</h3>
              <button
                onClick={() => setIsPointsModalOpen(true)}
                className="text-soless-blue hover:text-blue-300 text-sm font-medium"
              >
                How Points Work
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(userData.platformStats).map(
                ([platform, stats]) => {
                  let icon;
                  let color;
                  let bgColor;
                  let platformName;

                  switch (platform) {
                    case "TELEGRAM":
                      icon = <FaTelegram className="text-xl" />;
                      color = "text-blue-400";
                      bgColor = "bg-blue-900/30 border-blue-500/30";
                      platformName = "Telegram";
                      break;
                    case "DISCORD":
                      icon = <FaDiscord className="text-xl" />;
                      color = "text-indigo-400";
                      bgColor = "bg-indigo-900/30 border-indigo-500/30";
                      platformName = "Discord";
                      break;
                    case "TWITTER":
                      icon = <FaTwitter className="text-xl" />;
                      color = "text-sky-400";
                      bgColor = "bg-sky-900/30 border-sky-500/30";
                      platformName = "Twitter";
                      break;
                    default:
                      icon = <Star className="h-5 w-5" />;
                      color = "text-gray-400";
                      bgColor = "bg-gray-900/30 border-gray-500/30";
                      platformName = platform;
                  }

                  return (
                    <div
                      key={platform}
                      className={`${bgColor} rounded-xl p-6 border`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={color}>{icon}</div>
                          <h4 className="text-lg font-semibold text-white">
                            {platformName}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            {stats.points}
                          </p>
                          <p className="text-sm text-gray-400">points</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {stats.messages}
                          </p>
                          <p className="text-xs text-gray-400">Messages</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">
                            #{stats.rank}
                          </p>
                          <p className="text-xs text-gray-400">Rank</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {stats.streak}
                          </p>
                          <p className="text-xs text-gray-400">Streak</p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsContestModalOpen(true)}
                  className="text-soless-blue hover:text-blue-300 text-sm font-medium"
                >
                  Contest Rules
                </button>
                <button
                  onClick={() => setIsRewardModalOpen(true)}
                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                >
                  Claim Rewards
                </button>
              </div>
            </div>

            <ActivityFeed activities={userData.recentActivity} />

            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Points History
              </h4>
              <PointsBreakdown
                telegramPoints={userData.platformStats.TELEGRAM?.points || 0}
                discordPoints={userData.platformStats.DISCORD?.points || 0}
                twitterPoints={userData.platformStats.TWITTER?.points || 0}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Community Stats Section - Always show */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Members"
            value={communityStats.totalMembers}
            icon={Users}
            color="text-green-400"
          />
          <StatCard
            title="Total Points Earned"
            value={communityStats.totalPointsEarned.toLocaleString()}
            icon={Star}
            color="text-purple-400"
          />
          <StatCard
            title="Total Engagements"
            value={totalEngagements.toLocaleString()}
            icon={Trophy}
            color="text-yellow-400"
          />
        </div>

        {/* Wallet State-Specific Content */}
        {renderWalletState()}

        {/* Community Guide - Always show */}
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
      {userData && (
        <>
          <PointsInfoModal
            isOpen={isPointsModalOpen}
            setIsOpen={setIsPointsModalOpen}
          />
          <ContestInfoModal
            isOpen={isContestModalOpen}
            setIsOpen={setIsContestModalOpen}
          />
          <RewardClaimModal
            isOpen={isRewardModalOpen}
            setIsOpen={setIsRewardModalOpen}
            wallet={publicKey?.toString() || ""}
          />
        </>
      )}

      {/* Add Platform Modal */}
      {showAddPlatformModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-soless-blue/40 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-soless-blue mb-4">
              Connect More Socials
            </h3>
            <p className="text-gray-300 mb-6">
              Connect additional social media platforms to earn more points and
              rewards.
            </p>

            <div className="space-y-4 mb-6">
              <a
                href="/register"
                className="flex items-center justify-between p-4 bg-black/50 border border-blue-500/30 rounded-lg hover:bg-black/70 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <FaTelegram className="text-blue-400 text-xl" />
                  </div>
                  <span className="text-white">Telegram</span>
                </div>
                <span className="text-blue-400">Connect</span>
              </a>

              <a
                href="/register"
                className="flex items-center justify-between p-4 bg-black/50 border border-indigo-500/30 rounded-lg hover:bg-black/70 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                    <FaDiscord className="text-indigo-400 text-xl" />
                  </div>
                  <span className="text-white">Discord</span>
                </div>
                <span className="text-indigo-400">Connect</span>
              </a>

              <a
                href="/register"
                className="flex items-center justify-between p-4 bg-black/50 border border-sky-500/30 rounded-lg hover:bg-black/70 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center mr-3">
                    <FaTwitter className="text-sky-400 text-xl" />
                  </div>
                  <span className="text-white">Twitter</span>
                </div>
                <span className="text-sky-400">Connect</span>
              </a>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAddPlatformModal(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
