import React, { useState, useEffect } from "react";
import { Users, Calendar, TrendingUp, Download } from "lucide-react";

interface BetaSignup {
  id: string;
  solanaAddress: string;
  sonicAddress: string;
  telegramUsername: string;
  twitterHandle: string;
  createdAt: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    submittedAt?: string;
  };
}

interface BetaStats {
  totalSignups: number;
  signupsToday: number;
  signupsThisWeek: number;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const BetaAdmin = () => {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [stats, setStats] = useState<BetaStats | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSignups = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:3001/beta/signups?page=${page}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setSignups(data.data.signups);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching signups:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:3001/beta/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSignups(currentPage), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Solana Address",
      "Sonic Address",
      "Telegram",
      "Twitter",
      "Created At",
      "IP",
    ];
    const csvData = signups.map((signup) => [
      signup.id,
      signup.solanaAddress,
      signup.sonicAddress,
      signup.telegramUsername,
      signup.twitterHandle,
      formatDate(signup.createdAt),
      signup.metadata?.ip || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beta-signups-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soless-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-soless-blue via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Beta Signups Admin
          </h1>
          <p className="text-xl text-gray-300">
            Monitor and manage beta tester applications
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-lg border border-soless-blue/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Signups</p>
                  <p className="text-3xl font-bold text-soless-blue">
                    {stats.totalSignups}
                  </p>
                </div>
                <Users className="h-8 w-8 text-soless-blue" />
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-lg border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Today</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {stats.signupsToday}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">This Week</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    {stats.signupsThisWeek}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Signups</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-soless-blue to-purple-600 hover:from-purple-600 hover:to-soless-blue text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Signups Table */}
        <div className="bg-black/60 backdrop-blur-xl border border-soless-blue/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-soless-blue/10 border-b border-soless-blue/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Solana Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sonic Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Telegram
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Twitter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-soless-blue/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300 font-mono">
                        {signup.solanaAddress.slice(0, 8)}...
                        {signup.solanaAddress.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {signup.sonicAddress}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-400">
                        {signup.telegramUsername}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-400">
                        {signup.twitterHandle}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {formatDate(signup.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {signups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No beta signups yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetaAdmin;
