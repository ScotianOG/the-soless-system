import React, { useState, useEffect } from "react";
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  MessageSquare,
  Users,
  Twitter,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { adminApi, PlatformConfig } from "../../lib/api/admin";

const PlatformManagement: React.FC = () => {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPlatformConfigs();
  }, []);

  const loadPlatformConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const configs = await adminApi.getPlatformConfigs();
      setPlatforms(configs);
    } catch (err) {
      setError("Failed to load platform configurations");
      console.error("Error loading platform configs:", err);
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformConfig = async (
    platform: string,
    updates: Partial<PlatformConfig>
  ) => {
    try {
      setSaving(platform);
      setError(null);
      const updated = await adminApi.updatePlatformConfig(platform, updates);

      setPlatforms((prev) =>
        prev.map((p) => (p.platform === platform ? updated : p))
      );

      setSuccess(`${platform} configuration updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to update ${platform} configuration`);
      console.error(`Error updating ${platform} config:`, err);
    } finally {
      setSaving(null);
    }
  };

  const togglePlatform = (platform: string, enabled: boolean) => {
    updatePlatformConfig(platform, { enabled });
  };

  const updatePointRule = (
    platform: string,
    action: string,
    field: string,
    value: number
  ) => {
    const platformConfig = platforms.find((p) => p.platform === platform);
    if (!platformConfig) return;

    const updatedRules = {
      ...platformConfig.pointRules,
      [action]: {
        ...platformConfig.pointRules[action],
        [field]: value,
      },
    };

    updatePlatformConfig(platform, { pointRules: updatedRules });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "TELEGRAM":
        return <MessageSquare className="w-5 h-5" />;
      case "DISCORD":
        return <Users className="w-5 h-5" />;
      case "TWITTER":
        return <Twitter className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const formatCooldown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Platform Management</h2>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <div className="text-gray-400">Loading platform configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Platform Management</h2>
        <button
          onClick={loadPlatformConfigs}
          disabled={loading}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-600 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <span className="text-green-300">{success}</span>
        </div>
      )}

      <div className="grid gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.platform}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {getPlatformIcon(platform.platform)}
                <h3 className="text-xl font-semibold text-white ml-3">
                  {platform.platform}
                </h3>
              </div>
              <button
                onClick={() =>
                  togglePlatform(platform.platform, !platform.enabled)
                }
                disabled={saving === platform.platform}
                className="flex items-center"
              >
                {platform.enabled ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
                <span
                  className={`ml-2 ${
                    platform.enabled ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {platform.enabled ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>

            {platform.enabled && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Point Rules</h4>
                <div className="grid gap-4">
                  {Object.entries(platform.pointRules).map(([action, rule]) => (
                    <div key={action} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-white capitalize">
                          {action.replace("_", " ")}
                        </h5>
                        <div className="text-sm text-gray-400">
                          Cooldown: {formatCooldown(rule.cooldown)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            value={rule.points}
                            onChange={(e) =>
                              updatePointRule(
                                platform.platform,
                                action,
                                "points",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            min="0"
                            max="1000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Cooldown (seconds)
                          </label>
                          <input
                            type="number"
                            value={rule.cooldown}
                            onChange={(e) =>
                              updatePointRule(
                                platform.platform,
                                action,
                                "cooldown",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            min="0"
                            max="86400"
                          />
                        </div>

                        {rule.multiplier !== undefined && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Multiplier
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={rule.multiplier}
                              onChange={(e) =>
                                updatePointRule(
                                  platform.platform,
                                  action,
                                  "multiplier",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              min="0"
                              max="10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saving === platform.platform && (
              <div className="mt-4 flex items-center text-blue-400">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving changes...
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Platform Settings Help
        </h3>
        <div className="space-y-3 text-gray-300">
          <p>
            <strong>Points:</strong> Base points awarded for each action
          </p>
          <p>
            <strong>Cooldown:</strong> Minimum time between actions (in seconds)
          </p>
          <p>
            <strong>Multiplier:</strong> Platform-specific multiplier for
            special events
          </p>
          <p>
            <strong>Toggle:</strong> Enable/disable entire platform
            participation
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformManagement;
