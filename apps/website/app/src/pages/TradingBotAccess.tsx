import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  BarChart2,
  Settings,
  RefreshCw,
  Lock,
  Flame,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const TradingBotAccess = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "SOLess | Trading Bot Access";
  }, []);

  const [selectedAccessPath, setSelectedAccessPath] = useState<number | null>(
    null
  );
  const [lockedSoulies, setLockedSoulies] = useState(127);
  const [burntSoulies, setBurntSoulies] = useState(45);
  const accessPaths = [
    {
      name: "3D Soulie Holder",
      description: "Direct access with single 3D NFT (30 exclusive editions)",
      requirements: "Hold 1 3D Soulie NFT",
      icon: Brain,
      color: "cyan",
    },
    {
      name: "Base Tier Path",
      description: "Lock 4 Base NFTs + Burn 1 Base NFT",
      requirements: "5 Base NFTs total required",
      icon: Lock,
      color: "blue",
    },
    {
      name: "Rare + Base Path",
      description: "Lock 2 Rare NFTs + Burn 1 Base NFT",
      requirements: "2 Rare + 1 Base NFT required",
      icon: Lock,
      color: "purple",
    },
    {
      name: "Rare Burn Path",
      description: "Burn 1 Rare NFT",
      requirements: "1 Rare NFT required",
      icon: Flame,
      color: "red",
    },
    {
      name: "Ultra Rare Path",
      description: "Lock 1 Ultra Rare NFT",
      requirements: "1 Ultra Rare NFT required",
      icon: Lock,
      color: "gold",
    },
  ];

  // Sample performance data
  const performanceData = [
    { time: "9:00", portfolio: 100, market: 100, poolLiquidity: 100 },
    { time: "10:00", portfolio: 108, market: 102, poolLiquidity: 98 },
    { time: "11:00", portfolio: 115, market: 99, poolLiquidity: 105 },
    { time: "12:00", portfolio: 112, market: 97, poolLiquidity: 102 },
    { time: "13:00", portfolio: 120, market: 101, poolLiquidity: 108 },
    { time: "14:00", portfolio: 118, market: 103, poolLiquidity: 112 },
    { time: "15:00", portfolio: 125, market: 104, poolLiquidity: 115 },
    { time: "16:00", portfolio: 122, market: 102, poolLiquidity: 118 },
    { time: "17:00", portfolio: 130, market: 105, poolLiquidity: 120 },
  ];

  const tradeHistory = [
    { time: "14:55", pair: "SOL/USDC", profit: 2.4, amount: 10.5 },
    { time: "14:40", pair: "SOL/USDT", profit: 1.8, amount: 8.2 },
    { time: "14:25", pair: "BONK/SOL", profit: 3.2, amount: 15.0 },
    { time: "14:10", pair: "SOL/USDC", profit: 1.5, amount: 7.8 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 p-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4 text-white">
              SOLess <span className="text-cyan-400">Trading Bot</span> Access
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Professional-grade trading automation with AI-powered insights for
              NFT holders.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/founders-collection"
                className="bg-soless-blue hover:bg-soless-blue/80 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Founders Collection <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="https://soless.app/trading-bot-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Bot Demo <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-6">
          Trading Bot Access
        </h1>
        <p className="text-2xl text-gray-300">
          Professional-grade trading automation with AI-powered insights
        </p>
      </div>

      {/* Main Features */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-black/30 p-8 rounded-xl border border-cyan-400/50">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-cyan-400/10 rounded-lg">
              <div className="text-cyan-400 text-3xl">🤖</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Advanced Trading Bot
              </h3>
              <p className="text-gray-400">
                Professional-grade automated trading with sophisticated risk
                management
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Multi-strategy trading engine
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Real-time market monitoring
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Advanced risk management
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Performance optimization
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Emergency safety protocols
            </li>
          </ul>
        </div>

        <div className="bg-black/30 p-8 rounded-xl border border-purple-400/50">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-purple-400/10 rounded-lg">
              <div className="text-purple-400 text-3xl">🧠</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                AI Analytics Agent
              </h3>
              <p className="text-gray-400">
                Your personal market analyst powered by advanced AI
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Market intelligence
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Portfolio analysis
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Risk assessment
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Strategic recommendations
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Customized reporting
            </li>
          </ul>
        </div>
      </div>

      {/* Access Paths */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        {/* 3D Soulie Holder */}
        <div className="bg-black/30 p-6 rounded-xl border border-cyan-400/50 text-center">
          <Brain className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-2">
            3D Soulie Holder
          </h3>
          <p className="text-sm text-gray-400">
            Direct access with single 3D NFT (30 exclusive editions)
          </p>
          <p className="text-xs text-gray-500 mt-2">Hold 1 3D Soulie NFT</p>
        </div>

        {/* Base Tier Path */}
        <div className="bg-black/30 p-6 rounded-xl border border-gray-400/50 text-center">
          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-2">Base Tier Path</h3>
          <p className="text-sm text-gray-400">
            Lock 4 Base NFTs + Burn 1 Base NFT
          </p>
          <p className="text-xs text-gray-500 mt-2">
            5 Base NFTs total required
          </p>
        </div>

        {/* Rare + Base Path */}
        <div className="bg-black/30 p-6 rounded-xl border border-purple-400/50 text-center">
          <Lock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-2">
            Rare + Base Path
          </h3>
          <p className="text-sm text-gray-400">
            Lock 2 Rare NFTs + Burn 1 Base NFT
          </p>
          <p className="text-xs text-gray-500 mt-2">
            2 Rare + 1 Base NFT required
          </p>
        </div>

        {/* Rare Burn Path */}
        <div className="bg-black/30 p-6 rounded-xl border border-red-400/50 text-center">
          <Flame className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-2">Rare Burn Path</h3>
          <p className="text-sm text-gray-400">Burn 1 Rare NFT</p>
          <p className="text-xs text-gray-500 mt-2">1 Rare NFT required</p>
        </div>

        {/* Ultra Rare Path */}
        <div className="bg-black/30 p-6 rounded-xl border border-yellow-400/50 text-center">
          <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-2">Ultra Rare Path</h3>
          <p className="text-sm text-gray-400">
            Lock 1 Ultra Rare NFT + Burn 1 Base NFT
          </p>
          <p className="text-xs text-gray-500 mt-2">
            1 Ultra Rare + 1 Base NFT required
          </p>
        </div>
      </div>

      {/* Trading Interface Container */}
      <div className="bg-black/30 p-8 rounded-xl border border-cyan-400/50 mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">
          Trading Interface
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Chart - 2 columns */}
          <div className="col-span-2 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="time" stroke="#666" label="Time (Hours)" />
                <YAxis
                  stroke="#666"
                  label={{
                    value: "Performance %",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    border: "1px solid rgba(0, 255, 255, 0.2)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  stroke="#00ffff"
                  name="Bot Performance"
                />
                <Line
                  type="monotone"
                  dataKey="market"
                  stroke="#9945FF"
                  name="Market"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Chat - 1 column */}
          <div className="flex flex-col">
            <div className="flex-grow overflow-auto space-y-4 mb-4">
              <div className="bg-gradient-to-r from-cyan-400/10 to-purple-500/10 p-3 rounded-lg border border-cyan-400/20">
                <p className="text-sm text-cyan-400">
                  Would you like me to analyze the current market conditions?
                </p>
                <p className="text-xs text-gray-500 mt-1">2:45 PM</p>
              </div>
              <div className="bg-black/50 p-3 rounded-lg">
                <p className="text-sm text-white">
                  Yes, please analyze SOL/USDC pair.
                </p>
                <p className="text-xs text-gray-500 mt-1">2:46 PM</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-400/10 to-purple-500/10 p-3 rounded-lg border border-cyan-400/20">
                <p className="text-sm text-cyan-400">
                  Detecting unusual volume spike. Consider adjusting position
                  sizes.
                </p>
                <p className="text-xs text-gray-500 mt-1">2:47 PM</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Ask AI Assistant..."
              className="w-full bg-black/50 border border-cyan-400/50 rounded-lg p-2 text-white"
            />
          </div>

          {/* Trade History - 2 columns */}
          <div className="col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Trade History</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                {[
                  {
                    pair: "SOL/USDC",
                    amount: "10.5",
                    profit: "+2.4%",
                    time: "14:55",
                  },
                  {
                    pair: "SOL/USDT",
                    amount: "8.2",
                    profit: "+1.8%",
                    time: "14:40",
                  },
                ].map((trade, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 bg-black/50 rounded-lg border border-cyan-400/20"
                  >
                    <div>
                      <p className="text-white">{trade.pair}</p>
                      <p className="text-xs text-gray-500">
                        {trade.amount} SOL
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400">{trade.profit}</p>
                      <p className="text-xs text-gray-500">{trade.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  {
                    pair: "BONK/SOL",
                    amount: "15.0",
                    profit: "+3.2%",
                    time: "14:25",
                  },
                  {
                    pair: "SOL/USDC",
                    amount: "7.8",
                    profit: "+1.5%",
                    time: "14:10",
                  },
                ].map((trade, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 bg-black/50 rounded-lg border border-cyan-400/20"
                  >
                    <div>
                      <p className="text-white">{trade.pair}</p>
                      <p className="text-xs text-gray-500">
                        {trade.amount} SOL
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400">{trade.profit}</p>
                      <p className="text-xs text-gray-500">{trade.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions - 1 column */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg text-white">
                Generate Report
              </button>
              <button className="w-full p-3 bg-black/50 border border-cyan-400/50 rounded-lg text-white">
                Review Settings
              </button>
              <button className="w-full p-3 bg-black/50 border border-cyan-400/50 rounded-lg text-white">
                Update Strategy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats Container */}
      <div className="bg-black/30 p-8 rounded-xl border border-cyan-400/50 mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">
          Platform Stats
        </h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">Total Value Locked</p>
            <p className="text-2xl text-cyan-400">8.2M SOL</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">Platform $SOUL Burnt</p>
            <p className="text-2xl text-cyan-400">1.2M</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">24h Volume</p>
            <p className="text-2xl text-cyan-400">450K SOL</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">Total $SOUL Burnt</p>
            <p className="text-2xl text-cyan-400">2.8M</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">Active Users</p>
            <p className="text-2xl text-cyan-400">127</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">$SOUL Price</p>
            <p className="text-2xl text-cyan-400">$1.26</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-gray-400">Success Rate</p>
            <p className="text-2xl text-cyan-400">94%</p>
          </div>
        </div>
      </div>

      {/* Soulie Stats Container */}
      <div className="bg-black/30 p-8 rounded-xl border border-cyan-400/50">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">Soulie Stats</h2>
        <div className="space-y-6">
          {/* Base Tier */}
          <div className="bg-black/50 p-4 rounded-lg border border-gray-400/50">
            <h3 className="text-lg font-bold text-white mb-4">Base Tier</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Locked</span>
                  <span className="text-cyan-400">342</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Burnt</span>
                  <span className="text-red-400">156</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-red-400 to-orange-500 h-full rounded-full"
                    style={{ width: "25%" }}
                  ></div>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Floor Price</span>
                <span className="text-xl text-cyan-400">1.2 SOL</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Last Sale</span>
                <span className="text-xl text-cyan-400">1.4 SOL</span>
              </div>
            </div>
          </div>

          {/* Rare Tier */}
          <div className="bg-black/50 p-4 rounded-lg border border-purple-400/50">
            <h3 className="text-lg font-bold text-white mb-4">Rare Tier</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Locked</span>
                  <span className="text-cyan-400">127</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full"
                    style={{ width: "63.5%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Burnt</span>
                  <span className="text-red-400">45</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-red-400 to-orange-500 h-full rounded-full"
                    style={{ width: "35%" }}
                  ></div>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Floor Price</span>
                <span className="text-xl text-cyan-400">2.5 SOL</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Last Sale</span>
                <span className="text-xl text-cyan-400">3.2 SOL</span>
              </div>
            </div>
          </div>

          {/* Ultra Rare Tier */}
          <div className="bg-black/50 p-4 rounded-lg border border-yellow-400/50">
            <h3 className="text-lg font-bold text-white mb-4">
              Ultra Rare Tier
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Locked</span>
                  <span className="text-cyan-400">86</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full"
                    style={{ width: "71.6%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Burnt</span>
                  <span className="text-red-400">12</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-red-400 to-orange-500 h-full rounded-full"
                    style={{ width: "10%" }}
                  ></div>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Floor Price</span>
                <span className="text-xl text-cyan-400">4.8 SOL</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Last Sale</span>
                <span className="text-xl text-cyan-400">5.2 SOL</span>
              </div>
            </div>
          </div>

          {/* 3D Soulie Tier */}
          <div className="bg-black/50 p-4 rounded-lg border border-cyan-400/50">
            <h3 className="text-lg font-bold text-white mb-4">
              3D Soulie Tier
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Locked</span>
                  <span className="text-cyan-400">23/30</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full"
                    style={{ width: "76.6%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">SOULmates Paired</span>
                  <span className="text-purple-400">3/15</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full"
                    style={{ width: "20%" }}
                  ></div>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Floor Price</span>
                <span className="text-xl text-cyan-400">12.5 SOL</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-2">Last Sale</span>
                <span className="text-xl text-cyan-400">15.0 SOL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingBotAccess;
