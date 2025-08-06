import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  Settings,
  BarChart3,
  MessageSquare,
  Bot,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { adminApi } from "../../lib/api/admin";

interface SocialAIStatus {
  isRunning: boolean;
  isPaused: boolean;
  uptime: number;
  lastActivity: string;
  queueSize: number;
  errorsToday: number;
}

interface SocialAIConfig {
  enabled: boolean;
  postingSchedule: {
    enabled: boolean;
    intervals: { min: number; max: number };
    activeHours: { start: number; end: number };
  };
  engagement: {
    enabled: boolean;
    maxRepliesPerHour: number;
    keywords: string[];
    sentiment: { minScore: number; maxScore: number };
  };
  platforms: {
    twitter: {
      enabled: boolean;
      maxTweetsPerDay: number;
      maxRepliesPerDay: number;
    };
  };
}

interface Analytics {
  summary: {
    postsCreated: number;
    repliesSent: number;
    mentionsDetected: number;
    errors: number;
  };
  trendingTopics: Array<{
    topic: string;
    score: number;
    relevance: number;
  }>;
  recentActivity: Array<{
    type: string;
    action: string;
    createdAt: string;
    metadata: any;
  }>;
}

interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  tags: string[];
  enabled: boolean;
}

const SocialAIManagement: React.FC = () => {
  const [status, setStatus] = useState<SocialAIStatus | null>(null);
  const [config, setConfig] = useState<SocialAIConfig | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "config" | "analytics" | "templates"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [testContent, setTestContent] = useState("");
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("24h");

  useEffect(() => {
    loadData();
    const interval = setInterval(loadStatus, 30000); // Refresh status every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStatus(),
        loadConfig(),
        loadAnalytics(),
        loadTemplates(),
      ]);
    } catch (error) {
      console.error("Failed to load Social AI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await adminApi.getSocialAIStatus();
      setStatus(response);
    } catch (error) {
      console.error("Failed to load status:", error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await adminApi.getSocialAIConfig();
      setConfig(response);
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await adminApi.getSocialAIAnalytics(analyticsTimeframe);
      setAnalytics(response);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await adminApi.getSocialAITemplates();
      setTemplates(response);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handleControl = async (
    action: "start" | "stop" | "pause" | "resume"
  ) => {
    try {
      setActionLoading(action);
      await adminApi.controlSocialAI(action);
      await loadStatus(); // Refresh status
    } catch (error) {
      console.error(`Failed to ${action} Social AI:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigUpdate = async (updatedConfig: SocialAIConfig) => {
    try {
      await adminApi.updateSocialAIConfig(updatedConfig);
      setConfig(updatedConfig);
    } catch (error) {
      console.error("Failed to update config:", error);
    }
  };

  const handleTestPost = async () => {
    if (!testContent.trim()) return;

    try {
      setActionLoading("test");
      await adminApi.createTestPost(testContent);
      setTestContent("");
      await loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error("Failed to create test post:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = () => {
    if (!status) return "bg-gray-500";
    if (!status.isRunning) return "bg-red-500";
    if (status.isPaused) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!status) return "Unknown";
    if (!status.isRunning) return "Stopped";
    if (status.isPaused) return "Paused";
    return "Running";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-400">
          Loading Social AI Management...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Social AI Management
          </h2>
          <p className="text-gray-400">
            Control and monitor automated social media presence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm font-medium text-gray-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleControl("start")}
          disabled={
            actionLoading === "start" ||
            (status?.isRunning && !status?.isPaused)
          }
          className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {actionLoading === "start" ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span className="ml-2 font-medium">Start</span>
        </button>

        <button
          onClick={() => handleControl("pause")}
          disabled={
            actionLoading === "pause" || !status?.isRunning || status?.isPaused
          }
          className="flex items-center justify-center p-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {actionLoading === "pause" ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
          <span className="ml-2 font-medium">Pause</span>
        </button>

        <button
          onClick={() => handleControl("resume")}
          disabled={actionLoading === "resume" || !status?.isPaused}
          className="flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {actionLoading === "resume" ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span className="ml-2 font-medium">Resume</span>
        </button>

        <button
          onClick={() => handleControl("stop")}
          disabled={actionLoading === "stop" || !status?.isRunning}
          className="flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {actionLoading === "stop" ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Square className="w-5 h-5" />
          )}
          <span className="ml-2 font-medium">Stop</span>
        </button>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Uptime</p>
                <p className="text-lg font-semibold text-white">
                  {formatUptime(status.uptime)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Queue Size</p>
                <p className="text-lg font-semibold text-white">
                  {status.queueSize}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Errors Today</p>
                <p className="text-lg font-semibold text-white">
                  {status.errorsToday}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last Activity</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(status.lastActivity).toLocaleTimeString()}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "config", label: "Configuration", icon: Settings },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "templates", label: "Templates", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && analytics && (
          <div className="space-y-6">
            {/* Test Post */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Test Post
              </h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Enter test content to post..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleTestPost}
                  disabled={!testContent.trim() || actionLoading === "test"}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
                >
                  {actionLoading === "test" ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Post
                </button>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Posts Created</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.summary.postsCreated}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Replies Sent</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.summary.repliesSent}
                    </p>
                  </div>
                  <Send className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Mentions Detected</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.summary.mentionsDetected}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Errors</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.summary.errors}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Trending Topics
              </h3>
              <div className="space-y-2">
                {analytics.trendingTopics.slice(0, 5).map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-700 rounded"
                  >
                    <span className="text-white font-medium">
                      {topic.topic}
                    </span>
                    <span className="text-sm text-gray-400">
                      Score: {topic.score.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "config" && config && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                System Configuration
              </h3>

              {/* Enable/Disable */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) =>
                      handleConfigUpdate({
                        ...config,
                        enabled: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-white">Enable Social AI System</span>
                </label>
              </div>

              {/* Posting Schedule */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-2">
                  Posting Schedule
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.postingSchedule.enabled}
                      onChange={(e) =>
                        handleConfigUpdate({
                          ...config,
                          postingSchedule: {
                            ...config.postingSchedule,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-white">Enable Scheduled Posting</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Min Interval (minutes)
                      </label>
                      <input
                        type="number"
                        value={config.postingSchedule.intervals.min}
                        onChange={(e) =>
                          handleConfigUpdate({
                            ...config,
                            postingSchedule: {
                              ...config.postingSchedule,
                              intervals: {
                                ...config.postingSchedule.intervals,
                                min: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Max Interval (minutes)
                      </label>
                      <input
                        type="number"
                        value={config.postingSchedule.intervals.max}
                        onChange={(e) =>
                          handleConfigUpdate({
                            ...config,
                            postingSchedule: {
                              ...config.postingSchedule,
                              intervals: {
                                ...config.postingSchedule.intervals,
                                max: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Settings */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-2">
                  Platform Settings
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700 rounded">
                    <h5 className="font-medium text-white mb-2">Twitter</h5>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={config.platforms.twitter.enabled}
                        onChange={(e) =>
                          handleConfigUpdate({
                            ...config,
                            platforms: {
                              ...config.platforms,
                              twitter: {
                                ...config.platforms.twitter,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-white">Enable Twitter</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Max Tweets/Day
                        </label>
                        <input
                          type="number"
                          value={config.platforms.twitter.maxTweetsPerDay}
                          onChange={(e) =>
                            handleConfigUpdate({
                              ...config,
                              platforms: {
                                ...config.platforms,
                                twitter: {
                                  ...config.platforms.twitter,
                                  maxTweetsPerDay: parseInt(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Max Replies/Day
                        </label>
                        <input
                          type="number"
                          value={config.platforms.twitter.maxRepliesPerDay}
                          onChange={(e) =>
                            handleConfigUpdate({
                              ...config,
                              platforms: {
                                ...config.platforms,
                                twitter: {
                                  ...config.platforms.twitter,
                                  maxRepliesPerDay: parseInt(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Analytics</h3>
              <select
                value={analyticsTimeframe}
                onChange={(e) => {
                  setAnalyticsTimeframe(e.target.value);
                  loadAnalytics();
                }}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {analytics && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-white mb-4">
                    Recent Activity
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analytics.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded"
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-3 ${
                              activity.type === "ERROR"
                                ? "bg-red-500"
                                : activity.type === "POST_CREATED"
                                ? "bg-green-500"
                                : activity.type === "REPLY_SENT"
                                ? "bg-blue-500"
                                : "bg-gray-500"
                            }`}
                          ></div>
                          <span className="text-white font-medium">
                            {activity.action}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(activity.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Content Templates
              </h3>
              <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">
                      {template.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-blue-400">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    {template.category}
                  </p>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                    {template.template}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        template.enabled ? "bg-green-500" : "bg-gray-500"
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialAIManagement;
