import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Users,
  TrendingUp,
  Award,
  MessageCircle,
  ThumbsUp,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { analyticsApi, TimeFrame } from "../../lib/api/analytics";

interface EngagementStats {
  totalUsers: number;
  activeToday: number;
  totalPoints: number;
  platformStats: {
    TELEGRAM: { activeUsers: number; totalPoints: number };
    DISCORD: { activeUsers: number; totalPoints: number };
    TWITTER: { activeUsers: number; totalPoints: number };
  };
  topActions: Record<string, number>;
  contest: {
    currentRound: string;
    timeLeft: string;
    qualifiedUsers: number;
  };
}

interface TimeSeriesData {
  date: string;
  TELEGRAM: number;
  DISCORD: number;
  TWITTER: number;
  total: number;
}

const COLORS = ["#3B82F6", "#6366F1", "#0EA5E9", "#10B981"];

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeFrame>("WEEK");
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEngagementStats();
    fetchTimeSeriesData();

    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchEngagementStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchTimeSeriesData();
  }, [timeRange]);

  const fetchEngagementStats = async () => {
    try {
      const data = await analyticsApi.getGlobalStats();
      setStats(data as any); // Type compatibility fix
    } catch (error) {
      console.error("Error fetching engagement stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      const data = await analyticsApi.getTimeSeriesData(timeRange);
      setTimeSeriesData((data as any) || []); // Type compatibility fix
    } catch (error) {
      console.error("Error fetching time series data:", error);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchEngagementStats();
    fetchTimeSeriesData();
  };

  // Prepare platform data for the pie chart
  const getPlatformData = () => {
    if (!stats) return [];
    return [
      {
        name: "Telegram",
        value: stats.platformStats.TELEGRAM.totalPoints,
        color: "#3B82F6",
      },
      {
        name: "Discord",
        value: stats.platformStats.DISCORD.totalPoints,
        color: "#6366F1",
      },
      {
        name: "Twitter",
        value: stats.platformStats.TWITTER.totalPoints,
        color: "#0EA5E9",
      },
    ];
  };

  // Prepare action data for the bar chart
  const getActionData = () => {
    if (!stats || !stats.topActions) return [];

    return Object.entries(stats.topActions)
      .map(([type, count]) => ({
        type: formatEngagementType(type),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Get top 5 actions
  };

  const formatEngagementType = (type: string): string => {
    // Convert SNAKE_CASE to Title Case with spaces
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40 flex items-center justify-center h-64">
        <div className="text-soless-blue animate-pulse flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-soless-blue flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Engagement Analytics
        </h2>
        <button
          onClick={handleRefresh}
          className="bg-soless-blue/20 hover:bg-soless-blue/30 text-soless-blue px-3 py-2 rounded-lg flex items-center text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20">
          <h3 className="text-gray-400 text-sm font-medium flex items-center">
            <Users className="w-4 h-4 mr-1" /> Total Users
          </h3>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.totalUsers?.toLocaleString() || "0"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-green-400">
              {stats?.activeToday?.toLocaleString() || "0"}
            </span>{" "}
            active today
          </p>
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20">
          <h3 className="text-gray-400 text-sm font-medium flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> Total Points
          </h3>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.totalPoints?.toLocaleString() || "0"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Across all platforms</p>
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20">
          <h3 className="text-gray-400 text-sm font-medium flex items-center">
            <Award className="w-4 h-4 mr-1" /> Active Contest
          </h3>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.contest?.currentRound ? "Yes" : "No"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.contest?.timeLeft || "No active contest"}
          </p>
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20">
          <h3 className="text-gray-400 text-sm font-medium flex items-center">
            <Users className="w-4 h-4 mr-1" /> Qualified Users
          </h3>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.contest?.qualifiedUsers?.toLocaleString() || "0"}
          </p>
          <p className="text-xs text-gray-400 mt-1">For current contest</p>
        </div>
      </div>

      {/* Second row with platform-specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/50 p-4 rounded-lg border border-blue-500/20">
          <h3 className="text-blue-400 text-sm font-medium">Telegram</h3>
          <p className="text-xl font-bold text-white mt-1">
            {stats?.platformStats.TELEGRAM.totalPoints?.toLocaleString() || "0"}{" "}
            points
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-blue-400">
              {stats?.platformStats.TELEGRAM.activeUsers?.toLocaleString() ||
                "0"}
            </span>{" "}
            active users
          </p>
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-indigo-500/20">
          <h3 className="text-indigo-400 text-sm font-medium">Discord</h3>
          <p className="text-xl font-bold text-white mt-1">
            {stats?.platformStats.DISCORD.totalPoints?.toLocaleString() || "0"}{" "}
            points
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-indigo-400">
              {stats?.platformStats.DISCORD.activeUsers?.toLocaleString() ||
                "0"}
            </span>{" "}
            active users
          </p>
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-sky-500/20">
          <h3 className="text-sky-400 text-sm font-medium">Twitter</h3>
          <p className="text-xl font-bold text-white mt-1">
            {stats?.platformStats.TWITTER.totalPoints?.toLocaleString() || "0"}{" "}
            points
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <span className="text-sky-400">
              {stats?.platformStats.TWITTER.activeUsers?.toLocaleString() ||
                "0"}
            </span>{" "}
            active users
          </p>
        </div>
      </div>

      {/* Time series chart */}
      <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">
            Engagement Over Time
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("DAY")}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                timeRange === "DAY"
                  ? "bg-soless-blue text-white"
                  : "bg-black/30 text-gray-400 hover:bg-black/50"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeRange("WEEK")}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                timeRange === "WEEK"
                  ? "bg-soless-blue text-white"
                  : "bg-black/30 text-gray-400 hover:bg-black/50"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("MONTH")}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                timeRange === "MONTH"
                  ? "bg-soless-blue text-white"
                  : "bg-black/30 text-gray-400 hover:bg-black/50"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="date"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  borderColor: "#333",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="TELEGRAM"
                stroke="#3B82F6"
                strokeWidth={1}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="DISCORD"
                stroke="#6366F1"
                strokeWidth={1}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="TWITTER"
                stroke="#0EA5E9"
                strokeWidth={1}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution Pie Chart */}
        <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
          <h3 className="text-lg font-medium text-white mb-4">
            Platform Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPlatformData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) =>
                    `${entry.name}: ${entry.value.toLocaleString()}`
                  }
                >
                  {getPlatformData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: "#111",
                    borderColor: "#333",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Engagement Actions Bar Chart */}
        <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40">
          <h3 className="text-lg font-medium text-white mb-4">
            Top Engagement Actions
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getActionData()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  type="number"
                  stroke="#888"
                  tick={{ fill: "#888", fontSize: 12 }}
                />
                <YAxis
                  dataKey="type"
                  type="category"
                  stroke="#888"
                  tick={{ fill: "#888", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    borderColor: "#333",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#8884d8">
                  {getActionData().map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
