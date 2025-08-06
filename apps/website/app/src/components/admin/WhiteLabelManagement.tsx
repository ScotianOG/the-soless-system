import React, { useState, useEffect } from "react";
import {
  Download,
  Upload,
  Settings,
  Palette,
  Save,
  AlertCircle,
  CheckCircle,
  FileText,
  Copy,
} from "lucide-react";
import { adminApi, WhiteLabelConfig } from "../../lib/api/admin";

const WhiteLabelManagement: React.FC = () => {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importData, setImportData] = useState<string>("");

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentConfig = await adminApi.exportConfig();
      setConfig(currentConfig);
    } catch (err) {
      setError("Failed to load current configuration");
      console.error("Error loading config:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportConfig = async () => {
    try {
      const config = await adminApi.exportConfig();
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `white-label-config-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess("Configuration exported successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to export configuration");
      console.error("Error exporting config:", err);
    }
  };

  const importConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      const parsedConfig = JSON.parse(importData);
      await adminApi.importConfig(parsedConfig);

      setSuccess("Configuration imported successfully");
      setImportData("");
      await loadCurrentConfig();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to import configuration. Please check the JSON format.");
      console.error("Error importing config:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = (field: string, value: string) => {
    if (!config) return;

    setConfig({
      ...config,
      branding: {
        ...config.branding,
        [field]: value,
      },
    });
  };

  const saveBrandingChanges = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      await adminApi.importConfig(config);
      setSuccess("Branding updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save branding changes");
      console.error("Error saving branding:", err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            White Label Management
          </h2>
        </div>
        <div className="text-gray-400">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          White Label Management
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={exportConfig}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </button>
        </div>
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

      {/* Branding Configuration */}
      {config && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-6">
            <Palette className="w-5 h-5 text-blue-400 mr-2" />
            <h3 className="text-xl font-semibold text-white">
              Branding Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={config.branding.companyName}
                onChange={(e) => updateBranding("companyName", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={config.branding.logo || ""}
                onChange={(e) => updateBranding("logo", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={config.branding.primaryColor}
                  onChange={(e) =>
                    updateBranding("primaryColor", e.target.value)
                  }
                  className="w-12 h-10 bg-gray-700 border border-gray-600 rounded-l-lg"
                />
                <input
                  type="text"
                  value={config.branding.primaryColor}
                  onChange={(e) =>
                    updateBranding("primaryColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-r-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secondary Color
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={config.branding.secondaryColor}
                  onChange={(e) =>
                    updateBranding("secondaryColor", e.target.value)
                  }
                  className="w-12 h-10 bg-gray-700 border border-gray-600 rounded-l-lg"
                />
                <input
                  type="text"
                  value={config.branding.secondaryColor}
                  onChange={(e) =>
                    updateBranding("secondaryColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-r-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveBrandingChanges}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Branding"}
            </button>
          </div>
        </div>
      )}

      {/* Configuration Preview */}
      {config && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="text-xl font-semibold text-white">
                Configuration Preview
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(config, null, 2))}
              className="flex items-center px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy JSON
            </button>
          </div>
          <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto max-h-96">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}

      {/* Import Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <Upload className="w-5 h-5 text-blue-400 mr-2" />
          <h3 className="text-xl font-semibold text-white">
            Import Configuration
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Configuration JSON
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
              placeholder="Paste your configuration JSON here..."
            />
          </div>
          <button
            onClick={importConfig}
            disabled={!importData.trim() || saving}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {saving ? "Importing..." : "Import Configuration"}
          </button>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          White Label Instructions
        </h3>
        <div className="space-y-3 text-gray-300">
          <p>
            <strong>Export:</strong> Download the current configuration to share
            with clients
          </p>
          <p>
            <strong>Import:</strong> Apply a white-label configuration from a
            client
          </p>
          <p>
            <strong>Branding:</strong> Customize colors, logos, and company
            information
          </p>
          <p>
            <strong>Configuration:</strong> Includes contest rules, platform
            settings, and prizes
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelManagement;
