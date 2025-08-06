import React, { useState, useEffect } from "react";
import { Award, Check, X, Filter, Download } from "lucide-react";

interface Reward {
  id: string;
  userId: string;
  contestId: string;
  type: string;
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  amount?: string;
  description?: string;
  claimedAt?: string;
  expiresAt?: string;
  createdAt: string;
  user: {
    wallet: string;
    telegramUsername?: string;
    discordUsername?: string;
    twitterUsername?: string;
  };
  metadata: {
    tierName?: string;
    rank?: number;
    rewardSystem: "tier" | "rank";
  };
}

const RewardDistributionPanel: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "CLAIMED" | "EXPIRED"
  >("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
  const [contestId, setContestId] = useState<string>("");
  const [contests, setContests] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchContests();
  }, []);

  useEffect(() => {
    if (contestId) {
      fetchRewards(contestId);
    }
  }, [contestId]);

  useEffect(() => {
    applyFilters();
  }, [rewards, filterStatus, filterType]);

  const fetchContests = async () => {
    try {
      const response = await fetch("/api/contests/completed");
      if (response.ok) {
        const data = await response.json();
        setContests(data.contests || []);

        // If there are contests, select the first one by default
        if (data.contests && data.contests.length > 0) {
          setContestId(data.contests[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching contests:", error);
    }
  };

  const fetchRewards = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contests/${id}/rewards`);
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rewards];

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((reward) => reward.status === filterStatus);
    }

    if (filterType !== "ALL") {
      filtered = filtered.filter((reward) => reward.type === filterType);
    }

    setFilteredRewards(filtered);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "User ID",
      "Wallet",
      "Telegram",
      "Discord",
      "Twitter",
      "Reward Type",
      "Status",
      "Amount",
      "Description",
      "Claimed At",
      "Expires At",
      "Created At",
      "Tier/Rank",
    ];

    const csvRows = [headers];

    filteredRewards.forEach((reward) => {
      const tierOrRank =
        reward.metadata.rewardSystem === "tier"
          ? reward.metadata.tierName
          : `Rank #${reward.metadata.rank}`;

      csvRows.push([
        reward.userId,
        reward.user.wallet,
        reward.user.telegramUsername || "",
        reward.user.discordUsername || "",
        reward.user.twitterUsername || "",
        reward.type,
        reward.status,
        reward.amount || "",
        reward.description || "",
        reward.claimedAt || "",
        reward.expiresAt || "",
        reward.createdAt,
        tierOrRank || "",
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `rewards-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CLAIMED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" /> Claimed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Award className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getRewardTypeList = () => {
    const types = new Set<string>();
    rewards.forEach((reward) => {
      types.add(reward.type);
    });
    return ["ALL", ...Array.from(types)];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-soless-blue flex items-center">
          <Award className="w-5 h-5 mr-2" />
          Reward Distribution
        </h2>
        <button
          onClick={handleExport}
          className="bg-soless-blue/20 hover:bg-soless-blue/30 text-soless-blue px-3 py-2 rounded-lg flex items-center text-sm"
          disabled={filteredRewards.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Contest selector */}
      <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Contest
        </label>
        <select
          value={contestId}
          onChange={(e) => setContestId(e.target.value)}
          className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
        >
          <option value="">Select a contest</option>
          {contests.map((contest) => (
            <option key={contest.id} value={contest.id}>
              {contest.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-black/30 p-4 rounded-lg border border-soless-blue/20">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Filter className="text-gray-400 w-4 h-4 mr-2" />
            <span className="text-sm text-gray-300 mr-2">Filters:</span>
          </div>

          <div>
            <label className="text-xs text-gray-400 mr-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-black/50 border border-gray-700 text-white rounded px-2 py-1 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CLAIMED">Claimed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mr-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-black/50 border border-gray-700 text-white rounded px-2 py-1 text-sm"
            >
              {getRewardTypeList().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-400">
            Showing {filteredRewards.length} of {rewards.length} rewards
          </div>
        </div>
      </div>

      {/* Rewards table */}
      <div className="bg-black/30 rounded-xl border border-soless-blue/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Claimed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    Loading rewards...
                  </td>
                </tr>
              ) : filteredRewards.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No rewards found
                  </td>
                </tr>
              ) : (
                filteredRewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-black/20">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-medium text-white truncate max-w-[150px]">
                          {reward.user.wallet}
                        </div>
                        <div className="text-xs text-gray-400">
                          {reward.user.telegramUsername ||
                            reward.user.discordUsername ||
                            reward.user.twitterUsername ||
                            "No username"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {reward.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {getStatusBadge(reward.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {reward.metadata.rewardSystem === "tier" ? (
                        <span className="text-soless-blue">
                          {reward.metadata.tierName} Tier
                        </span>
                      ) : (
                        <span className="text-soless-purple">
                          Rank #{reward.metadata.rank}
                        </span>
                      )}
                      {reward.amount && (
                        <span className="block text-white font-medium">
                          {reward.amount}
                        </span>
                      )}
                      {reward.description && (
                        <span className="block text-xs text-gray-400">
                          {reward.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(reward.expiresAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(reward.claimedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RewardDistributionPanel;
