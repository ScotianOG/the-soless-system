import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import LeaderboardView from "../components/LeaderboardView";
import ContestInfoModal from "../components/ContestInfoModal";
import PointsInfoModal from "../components/PointsInfoModal";
import RewardClaimModal from "../components/RewardClaimModal";
import {
  Info,
  Award,
  Gift,
  CalendarDays,
  Trophy,
  Clock,
  ArrowUpRight,
  Users,
  Star,
  Flame,
  Medal,
} from "lucide-react";
import { contestsApi } from "../lib/api/contests";

export default function Leaderboard() {
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [contestTimeLeft, setContestTimeLeft] = useState<string>("");
  const [contestStatus, setContestStatus] = useState<string>("ACTIVE");
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContestInfo = async () => {
      try {
        const currentContest = await contestsApi.getCurrent();
        const leaderboard = await contestsApi.getLeaderboard(currentContest.id);

        // Set total participants
        setTotalParticipants(leaderboard.length);

        // Set contest status
        setContestStatus(currentContest.status);

        // Calculate time left if contest is active
        if (currentContest.status === "ACTIVE") {
          const endTime = new Date(currentContest.endTime);
          const now = new Date();
          const diff = endTime.getTime() - now.getTime();

          if (diff > 0) {
            // Update time remaining
            const updateTimeLeft = () => {
              const now = new Date();
              const diff = endTime.getTime() - now.getTime();

              if (diff <= 0) {
                setContestTimeLeft("Contest ended");
                return;
              }

              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              );
              const minutes = Math.floor(
                (diff % (1000 * 60 * 60)) / (1000 * 60)
              );

              if (days > 0) {
                setContestTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
              } else {
                setContestTimeLeft(`${hours}h ${minutes}m remaining`);
              }
            };

            updateTimeLeft();
            const interval = setInterval(updateTimeLeft, 60000); // Update every minute
            return () => clearInterval(interval);
          } else {
            setContestTimeLeft("Contest ending...");
          }
        } else if (currentContest.status === "COMPLETED") {
          setContestTimeLeft("Contest ended");
        } else {
          setContestTimeLeft(
            `Starts ${new Date(currentContest.startTime).toLocaleDateString()}`
          );
        }
      } catch (err) {
        console.error("Error fetching contest info:", err);
      }
    };

    fetchContestInfo();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10"></div>
        <img
          src="/assets/images/spring-banner.jpg"
          alt="Spring SOLstice Contest Banner"
          className="w-full object-cover h-64"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
              Contest <span className="text-green-400">Leaderboard</span>
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-md mb-4">
              Track your rank and see how you compare to other participants
            </p>

            {/* Contest Status Badge */}
            {contestTimeLeft && (
              <div className="inline-flex items-center bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/30">
                <Clock className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-green-400 font-medium">
                  {contestTimeLeft}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-r from-soless-blue/20 to-purple-500/20 border-y border-soless-blue/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setIsContestModalOpen(true)}
              className="flex items-center bg-soless-blue/20 hover:bg-soless-blue/30 border border-soless-blue/40 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Info className="mr-2 h-5 w-5" />
              Contest Details
            </button>

            <button
              onClick={() => setIsPointsModalOpen(true)}
              className="flex items-center bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Scoring System
            </button>

            <button
              onClick={() => setIsRewardModalOpen(true)}
              className="flex items-center bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Gift className="mr-2 h-5 w-5" />
              Claim Rewards
            </button>

            <button
              onClick={() => navigate("/community")}
              className="flex items-center bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="mr-2 h-5 w-5" />
              Community Dashboard
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contest Stats */}
      <div className="bg-black/90">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/50 backdrop-blur-lg p-4 rounded-lg border border-soless-blue/30">
              <div className="flex justify-between items-start">
                <h3 className="text-gray-400 text-sm">Total Participants</h3>
                <Users className="h-4 w-4 text-soless-blue" />
              </div>
              <p className="text-xl font-bold text-white mt-1">
                {totalParticipants.toLocaleString()}
              </p>
            </div>

            <div className="bg-black/50 backdrop-blur-lg p-4 rounded-lg border border-purple-500/30">
              <div className="flex justify-between items-start">
                <h3 className="text-gray-400 text-sm">Status</h3>
                <Star className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">
                <span
                  className={
                    contestStatus === "ACTIVE"
                      ? "text-green-400"
                      : contestStatus === "COMPLETED"
                      ? "text-amber-400"
                      : "text-blue-400"
                  }
                >
                  {contestStatus === "ACTIVE"
                    ? "Active"
                    : contestStatus === "COMPLETED"
                    ? "Completed"
                    : "Upcoming"}
                </span>
              </p>
            </div>

            <div className="bg-black/50 backdrop-blur-lg p-4 rounded-lg border border-amber-500/30">
              <div className="flex justify-between items-start">
                <h3 className="text-gray-400 text-sm">Top Prize</h3>
                <Award className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">5,000 SOUL</p>
            </div>

            <div className="bg-black/50 backdrop-blur-lg p-4 rounded-lg border border-green-500/30">
              <div className="flex justify-between items-start">
                <h3 className="text-gray-400 text-sm">Contest Duration</h3>
                <CalendarDays className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-xl font-bold text-white mt-1">90 Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <LeaderboardView autoRefresh={true} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Leaderboard Rules */}
          <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 p-6">
            <h2 className="text-2xl font-bold text-soless-blue mb-4 flex items-center">
              <Info className="mr-2 h-6 w-6" />
              Leaderboard Rules
            </h2>
            <div className="space-y-4 text-gray-300">
              <p>
                The Spring SOLstice Contest leaderboard displays all
                participants ranked by total points earned. Points are
                calculated based on engagement across multiple platforms
                (Telegram, Discord, Twitter).
              </p>
              <p>
                The leaderboard updates in real-time, with positions reflecting
                current standings. Rewards are distributed based on final
                rankings when the contest ends.
              </p>
              <h3 className="text-lg font-medium text-white mt-4">
                Important Notes:
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Leaderboard positions are updated every minute</li>
                <li>The top 10 participants receive special rewards</li>
                <li>Points earned are subject to verification</li>
                <li>Any suspicious activity may result in disqualification</li>
              </ul>
            </div>
          </div>

          {/* Contest Timeline */}
          <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-purple-500/40 p-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center">
              <CalendarDays className="mr-2 h-6 w-6" />
              Contest Timeline
            </h2>
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-500/30" />

              <div className="space-y-6">
                {[
                  {
                    date: "March 20, 2025",
                    title: "Spring SOLstice Launch",
                    status: "completed",
                    description:
                      "Contest officially begins with community challenges",
                  },
                  {
                    date: "April 15, 2025",
                    title: "Mid-Contest Rewards",
                    status: "completed",
                    description: "First round of token rewards distributed",
                  },
                  {
                    date: "May 15, 2025",
                    title: "NFT Drop Phase",
                    status: "active",
                    description:
                      "Special Spring SOLstice NFTs for qualifying participants",
                  },
                  {
                    date: "June 20, 2025",
                    title: "Contest Conclusion",
                    status: "upcoming",
                    description:
                      "Final standings announced and grand prizes distributed",
                  },
                ].map((event, index) => (
                  <div key={index} className="relative pl-10">
                    {/* Timeline node */}
                    <div
                      className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                        event.status === "active"
                          ? "bg-green-500"
                          : event.status === "completed"
                          ? "bg-purple-500"
                          : "bg-gray-700"
                      }`}
                    >
                      {event.status === "active" ? (
                        <Flame className="h-4 w-4 text-white" />
                      ) : event.status === "completed" ? (
                        <Star className="h-4 w-4 text-white" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-300" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="mb-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-white">{event.title}</h3>
                        <span className="text-xs text-gray-400">
                          {event.date}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {event.description}
                      </p>
                      {event.status === "active" && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Current Phase
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-amber-500/40 p-6 mb-8">
          <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center">
            <Award className="mr-2 h-6 w-6" />
            Contest Rewards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Top 10 Participants",
                icon: Trophy,
                rewards: [
                  "5,000 SOUL tokens",
                  "Exclusive Spring SOLstice NFT (Legendary)",
                  "Early access to SOLessSwap alpha",
                ],
              },
              {
                title: "Top 50 Participants",
                icon: Medal,
                rewards: [
                  "1,000 SOUL tokens",
                  "Spring SOLstice NFT (Rare)",
                  "Whitelist spot for future SOLess drops",
                ],
              },
              {
                title: "All Qualified Participants",
                icon: Gift,
                rewards: [
                  "100 SOUL tokens",
                  "Spring SOLstice NFT (Common)",
                  "Community recognition badge",
                ],
              },
            ].map((tier, index) => (
              <div
                key={index}
                className="bg-black/30 border border-amber-500/30 rounded-lg p-4"
              >
                <div className="bg-amber-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <tier.icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  {tier.title}
                </h3>
                <ul className="space-y-2">
                  {tier.rewards.map((reward, idx) => (
                    <li key={idx} className="flex items-start">
                      <Star className="h-4 w-4 text-amber-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{reward}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContestInfoModal
        isOpen={isContestModalOpen}
        setIsOpen={setIsContestModalOpen}
      />
      <PointsInfoModal
        isOpen={isPointsModalOpen}
        setIsOpen={setIsPointsModalOpen}
      />
      <RewardClaimModal
        isOpen={isRewardModalOpen}
        setIsOpen={setIsRewardModalOpen}
        wallet={publicKey?.toString() || ""}
      />
    </div>
  );
}
