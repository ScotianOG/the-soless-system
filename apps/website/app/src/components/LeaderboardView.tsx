import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { contestsApi } from "../lib/api/contests";
import {
  Trophy,
  Medal,
  Crown,
  Search,
  Clock,
  RefreshCcw,
  Gift,
} from "lucide-react";
import { ContestEntry } from "../lib/api/types";

interface LeaderboardViewProps {
  contestId?: string;
  limit?: number;
  autoRefresh?: boolean;
}

export default function LeaderboardView({
  contestId,
  limit = 50,
  autoRefresh = true,
}: LeaderboardViewProps) {
  const { publicKey } = useWallet();
  const [leaderboard, setLeaderboard] = useState<ContestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [userRank, setUserRank] = useState<number | null>(null);

  // Function to fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      let contestData;
      if (contestId) {
        contestData = await contestsApi.getLeaderboard(contestId);
      } else {
        const currentContest = await contestsApi.getCurrent();
        contestData = await contestsApi.getLeaderboard(currentContest.id);

        // Calculate time left
        if (currentContest.status === "ACTIVE") {
          const endTime = new Date(currentContest.endTime);
          const now = new Date();
          const diff = endTime.getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${minutes}m remaining`);
          } else {
            setTimeLeft("Contest ending...");
          }
        }
      }

      setLeaderboard(contestData);
      setLastUpdated(new Date());

      // Find user's rank if logged in
      if (publicKey) {
        const userWallet = publicKey.toString();
        const userEntry = contestData.find(
          (entry) =>
            entry.user?.wallet === userWallet || entry.wallet === userWallet
        );

        if (userEntry) {
          setUserRank(userEntry.rank || null);
        }
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard on component mount and when contestId changes
  useEffect(() => {
    fetchLeaderboard();

    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLeaderboard();
      }, 60000); // Refresh every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [contestId, publicKey]);

  // Filter leaderboard based on search term
  const filteredLeaderboard = searchTerm
    ? leaderboard.filter((entry) => {
        const username =
          entry.user?.telegramUsername ||
          entry.user?.discordUsername ||
          entry.user?.twitterUsername ||
          entry.wallet.slice(0, 8);

        return username.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : leaderboard;

  // Format time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();

    if (diff < 60000) {
      // Less than a minute
      return "Updated just now";
    } else if (diff < 3600000) {
      // Less than an hour
      const minutes = Math.floor(diff / 60000);
      return `Updated ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else {
      const hours = Math.floor(diff / 3600000);
      return `Updated ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
  };

  const getUsernameDisplay = (entry: ContestEntry) => {
    const username =
      entry.user?.telegramUsername ||
      entry.user?.discordUsername ||
      entry.user?.twitterUsername;

    if (username) {
      return username;
    }

    // For wallet addresses, shorten them
    const wallet = entry.user?.wallet || entry.wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const isCurrentUser = (entry: ContestEntry) => {
    if (!publicKey) return false;

    const userWallet = publicKey.toString();
    return entry.user?.wallet === userWallet || entry.wallet === userWallet;
  };

  return (
    <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-soless-blue flex items-center mb-3 md:mb-0">
          <Trophy className="mr-2 h-6 w-6" />
          Contest Leaderboard
        </h2>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {timeLeft && (
            <div className="flex items-center text-sm bg-black/40 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 mr-1 text-green-400" />
              <span className="text-green-400">{timeLeft}</span>
            </div>
          )}

          <div className="flex items-center text-sm bg-black/40 px-3 py-1 rounded-full">
            <RefreshCcw
              className={`h-4 w-4 mr-1 text-gray-400 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className="text-gray-400">{getTimeSinceUpdate()}</span>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="bg-soless-blue/20 hover:bg-soless-blue/30 text-soless-blue px-3 py-1 rounded-md text-sm font-medium transition-colors"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search participants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/30 border border-soless-blue/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-soless-blue/60"
        />
      </div>

      {/* User's rank if available */}
      {userRank !== null && (
        <div className="mb-6 p-4 bg-soless-blue/20 border border-soless-blue/40 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <p className="text-white flex items-center">
              <Crown className="h-5 w-5 text-yellow-400 mr-2" />
              <span>Your current rank:</span>
              <span className="ml-2 text-xl font-bold text-white">
                #{userRank}
              </span>
            </p>

            {userRank <= 50 && (
              <div className="mt-3 md:mt-0 flex items-center bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                <Gift className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-green-400 text-sm font-medium">
                  {userRank <= 10
                    ? "Eligible for top tier rewards!"
                    : userRank <= 50
                    ? "Eligible for mid tier rewards!"
                    : "Eligible for participant rewards"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6">
          {error}
          <button onClick={fetchLeaderboard} className="ml-3 underline">
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !leaderboard.length && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soless-blue"></div>
        </div>
      )}

      {/* Leaderboard table */}
      {filteredLeaderboard.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  Participant
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {filteredLeaderboard.slice(0, limit).map((entry, index) => {
                const isUser = isCurrentUser(entry);
                const rankDisplay = entry.rank || index + 1;

                return (
                  <tr
                    key={index}
                    className={`${
                      isUser ? "bg-soless-blue/10" : ""
                    } hover:bg-black/30 transition-colors`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {rankDisplay <= 3 ? (
                          <div
                            className={`
                            w-6 h-6 rounded-full flex items-center justify-center mr-2
                            ${
                              rankDisplay === 1
                                ? "bg-yellow-500/20 text-yellow-500"
                                : rankDisplay === 2
                                ? "bg-gray-300/20 text-gray-300"
                                : "bg-amber-600/20 text-amber-600"
                            }
                          `}
                          >
                            {rankDisplay === 1 ? (
                              <Crown className="h-3 w-3" />
                            ) : rankDisplay === 2 ? (
                              <Medal className="h-3 w-3" />
                            ) : (
                              <Trophy className="h-3 w-3" />
                            )}
                          </div>
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center mr-2 text-gray-500">
                            {rankDisplay}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        isUser ? "font-medium text-white" : "text-gray-300"
                      }`}
                    >
                      {getUsernameDisplay(entry)}
                      {isUser && (
                        <span className="ml-2 text-xs text-soless-blue">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span
                        className={`
                        ${
                          rankDisplay === 1
                            ? "text-yellow-500"
                            : rankDisplay === 2
                            ? "text-gray-300"
                            : rankDisplay === 3
                            ? "text-amber-600"
                            : isUser
                            ? "text-soless-blue"
                            : "text-gray-400"
                        }
                      `}
                      >
                        {entry.points.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !loading ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No participants found</p>
        </div>
      ) : null}
    </div>
  );
}
