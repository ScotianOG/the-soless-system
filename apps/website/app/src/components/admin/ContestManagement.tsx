import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  Users,
  Trophy,
  AlertTriangle,
  Play,
  Square,
  Pause,
  RefreshCw,
  Settings,
  Edit,
  Trash2,
} from "lucide-react";
import { adminApi, ContestConfig, ContestStats } from "../../lib/api/admin";
import { contestsApi } from "../../lib/api/contests";

interface Contest extends ContestStats {}

interface ContestFormData extends ContestConfig {}

const ContestManagement: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingContest, setEditingContest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContestFormData>({
    name: "",
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    rules: {
      minPoints: 500,
      bronzeTier: 500,
      silverTier: 1000,
      goldTier: 2000,
      platinumTier: 3000,
      diamondTier: 5000,
    },
  });

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const contestConfig = await adminApi.getContestConfig();
      // Transform the backend response to match our component's expected format
      const contest: Contest = {
        id: contestConfig.currentContest?.id || "current",
        name: contestConfig.currentContest?.name || "Current Contest",
        status: contestConfig.currentContest?.status || "ACTIVE",
        startTime:
          contestConfig.currentContest?.startTime || new Date().toISOString(),
        endTime:
          contestConfig.currentContest?.endTime || new Date().toISOString(),
        totalParticipants: contestConfig.currentContest?.entries?.length || 0,
        qualifiedUsers: contestConfig.qualifiedUsers || 0,
        totalPoints: 0,
        platformStats: {},
      };
      setContests([contest]);
    } catch (error) {
      setError("Failed to fetch contest config");
      console.error("Error fetching contest config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...(formData[parent as keyof ContestFormData] as any),
          [child]: parseInt(value) || 0,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Transform the form data to match the backend expected format
      const config = {
        enabled: true,
        roundDurationHours: 24, // Default 24 hours
        minPointsToQualify: formData.rules.minPoints,
        prizes: [
          {
            rank: 1,
            reward: "USDC",
            amount: "100",
            description: "First Place",
          },
          {
            rank: 2,
            reward: "USDC",
            amount: "75",
            description: "Second Place",
          },
        ],
        tiers: [
          {
            name: "BRONZE",
            minPoints: formData.rules.bronzeTier,
            reward: "WHITELIST",
          },
          {
            name: "SILVER",
            minPoints: formData.rules.silverTier,
            reward: "FREE_MINT",
          },
          {
            name: "GOLD",
            minPoints: formData.rules.goldTier,
            reward: "FREE_GAS",
          },
          {
            name: "PLATINUM",
            minPoints: formData.rules.platinumTier,
            reward: "NO_FEES",
          },
          {
            name: "DIAMOND",
            minPoints: formData.rules.diamondTier,
            reward: "SOUL",
          },
        ],
      };

      await adminApi.updateContestConfig(config);
      setSuccess("Contest configuration updated successfully");
      setFormData({
        name: "",
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
        rules: {
          minPoints: 500,
          bronzeTier: 500,
          silverTier: 1000,
          goldTier: 2000,
          platinumTier: 3000,
          diamondTier: 5000,
        },
      });
      await fetchContests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to update contest configuration");
      console.error("Error updating contest config:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleContestAction = async (
    action: "start" | "stop" | "pause" | "resume"
  ) => {
    setError(null);
    try {
      let result;
      switch (action) {
        case "start":
          result = await adminApi.startContest();
          break;
        case "stop":
          result = await adminApi.stopContest();
          break;
        case "pause":
          result = await adminApi.pauseContest();
          break;
        case "resume":
          result = await adminApi.resumeContest();
          break;
      }

      setSuccess(`Contest ${action}ed successfully`);
      await fetchContests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(`Failed to ${action} contest`);
      console.error(`Error ${action}ing contest:`, error);
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    if (!confirm("Are you sure you want to delete this contest?")) return;

    setError(null);
    try {
      // For now, just show a message since delete isn't implemented in backend
      setError("Contest deletion not yet implemented in backend");
    } catch (error) {
      setError("Failed to delete contest");
      console.error("Error deleting contest:", error);
    }
  };

  const handleEndContest = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to end this contest? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await contestsApi.endContest(id);
      fetchContests();
    } catch (error) {
      console.error("Error ending contest:", error);
      alert(
        `Failed to end contest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDistributeRewards = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to distribute rewards for this contest? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await contestsApi.distributeRewards(id);
      alert(result.message);
    } catch (error) {
      console.error("Error distributing rewards:", error);
      alert(
        `Failed to distribute rewards: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Clock className="w-3 h-3 mr-1" /> Active
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Calendar className="w-3 h-3 mr-1" /> Upcoming
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-soless-blue flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Contest Management
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-soless-blue hover:bg-soless-blue/80 text-white px-3 py-2 rounded-lg flex items-center text-sm"
        >
          {isCreating ? (
            "Cancel"
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Configure Contest
            </>
          )}
        </button>
      </div>

      {/* Create contest form */}
      {isCreating && (
        <div className="bg-black/50 p-6 rounded-xl border border-soless-blue/20 mb-6">
          <h3 className="text-lg font-semibold text-soless-blue mb-4">
            Create New Contest
          </h3>
          <form onSubmit={handleCreateContest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contest Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Spring SOLstice Contest"
                className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Qualification Thresholds
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Minimum Points to Qualify
                  </label>
                  <input
                    type="number"
                    name="rules.minPoints"
                    value={formData.rules.minPoints}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-bronze mb-1">
                    Bronze Tier
                  </label>
                  <input
                    type="number"
                    name="rules.bronzeTier"
                    value={formData.rules.bronzeTier}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-silver mb-1">
                    Silver Tier
                  </label>
                  <input
                    type="number"
                    name="rules.silverTier"
                    value={formData.rules.silverTier}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-yellow-400 mb-1">
                    Gold Tier
                  </label>
                  <input
                    type="number"
                    name="rules.goldTier"
                    value={formData.rules.goldTier}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1">
                    Platinum Tier
                  </label>
                  <input
                    type="number"
                    name="rules.platinumTier"
                    value={formData.rules.platinumTier}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-blue-300 mb-1">
                    Diamond Tier
                  </label>
                  <input
                    type="number"
                    name="rules.diamondTier"
                    value={formData.rules.diamondTier}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-black/50 border border-gray-700 text-white rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-soless-blue to-soless-purple hover:opacity-90 text-white px-4 py-2 rounded-lg"
              >
                Create Contest
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contest list */}
      <div className="bg-black/30 rounded-xl border border-soless-blue/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
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
                    Loading contests...
                  </td>
                </tr>
              ) : contests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No contests found
                  </td>
                </tr>
              ) : (
                contests.map((contest) => (
                  <tr key={contest.id} className="hover:bg-black/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {contest.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contest.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(contest.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(contest.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {contest.qualifiedUsers || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex space-x-2">
                        {contest.status === "ACTIVE" && (
                          <>
                            <button
                              onClick={() => handleContestAction("pause")}
                              className="text-yellow-500 hover:text-yellow-400 flex items-center"
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </button>
                            <button
                              onClick={() => handleContestAction("stop")}
                              className="text-red-500 hover:text-red-400 flex items-center"
                            >
                              <Square className="w-4 h-4 mr-1" />
                              Stop
                            </button>
                          </>
                        )}

                        {contest.status === "PAUSED" && (
                          <button
                            onClick={() => handleContestAction("resume")}
                            className="text-green-500 hover:text-green-400 flex items-center"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </button>
                        )}

                        {!contests.some((c) => c.status === "ACTIVE") && (
                          <button
                            onClick={() => handleContestAction("start")}
                            className="text-green-500 hover:text-green-400 flex items-center"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start New
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {contests.some((c) => c.status === "ACTIVE") && (
        <div className="bg-amber-900/30 p-4 rounded-lg border border-amber-500/40 flex items-center">
          <AlertTriangle className="text-amber-500 w-5 h-5 mr-3" />
          <p className="text-sm text-amber-200">
            There is currently an active contest. You cannot create a new
            contest until the current one ends.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContestManagement;
