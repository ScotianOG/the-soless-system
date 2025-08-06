import React from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Zap,
  DollarSign,
  BarChart3,
  Check,
  Shield,
  Activity,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";

// Progress update component
const ProgressUpdate = ({
  date,
  title,
  description,
  tags,
  image,
}: {
  date: string;
  title: string;
  description: string;
  tags: string[];
  image?: string;
}) => {
  return (
    <div className="bg-black/40 border border-soless-blue/30 rounded-lg overflow-hidden mb-6 hover:border-soless-blue/60 transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center mb-3 text-gray-400">
          <CalendarDays className="h-4 w-4 mr-2" />
          <span className="text-sm">{date}</span>
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="bg-soless-blue/20 text-soless-blue text-xs px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {image && (
        <div className="border-t border-soless-blue/20">
          <img
            src={image}
            alt={title}
            className="w-auto h-auto flex items-center justify-center"
          />
        </div>
      )}
    </div>
  );
};

// Feature card component with icon
const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-black/30 border border-soless-blue/30 rounded-lg p-6 hover:border-soless-blue/60 transition-colors duration-300">
      <div className="bg-soless-blue/10 p-3 rounded-full inline-block mb-4">
        <Icon className="h-6 w-6 text-soless-blue" />
      </div>
      <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
};

// Token pair component
const TokenPair = ({
  token1,
  token2,
  apr,
  volume,
}: {
  token1: { symbol: string; image: string };
  token2: { symbol: string; image: string };
  apr: string;
  volume: string;
}) => {
  return (
    <div className="bg-black/50 border border-soless-blue/30 rounded-lg p-4 hover:bg-black/70 transition-colors duration-300">
      <div className="flex items-center mb-3">
        <div className="relative">
          <img
            src={token1.image}
            alt={token1.symbol}
            className="h-8 w-8 rounded-full"
          />
          <img
            src={token2.image}
            alt={token2.symbol}
            className="h-8 w-8 rounded-full absolute -right-2 -bottom-2 border-2 border-black"
          />
        </div>
        <span className="ml-4 font-medium text-white">
          {token1.symbol}/{token2.symbol}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-gray-400">APR</p>
          <p className="text-green-400 font-medium">{apr}</p>
        </div>
        <div>
          <p className="text-gray-400">24h Volume</p>
          <p className="text-white font-medium">{volume}</p>
        </div>
      </div>
    </div>
  );
};

const Swap = () => {
  // Development updates based on the progress report
  const developmentUpdates = [
    {
      date: "May 17, 2025",
      title: "Portfolio Performance Optimization",
      description:
        "Achieved exceptional performance metrics for cross-platform portfolio loading, with average response times of 155ms for small portfolios, 154ms for medium portfolios, and 166ms for large portfolios of 50+ tokens.",
      tags: ["Performance", "Optimization", "Portfolio"],
      image: "/assets/images/portfolio-performance.png",
    },
    {
      date: "May 10, 2025",
      title: "Advanced Fee Distribution Mechanisms",
      description:
        "Implemented new fee distribution system with configurable parameters, allowing projects to customize how transaction fees are allocated between burn vaults, liquidity pools, and project treasuries.",
      tags: ["Fee Mechanism", "Tokenomics", "Core Feature"],
      image: "/assets/images/fee-distribution.png",
    },
    {
      date: "March 23, 2025",
      title: "Cross-Platform Integration Complete",
      description:
        "Implemented platform comparison analytics displaying fees and congestion, with automatic recommendation system for optimal transaction routing based on real-time performance data across SONIC and other blockchain platforms.",
      tags: ["Cross-Platform", "Routing", "Analytics"],
      image: "/assets/images/crossplatformswap.png",
    },
    {
      date: "March 10, 2025",
      title: "Slippage Protection & Dynamic Gas Model",
      description:
        "Successfully implemented slippage protection controls with configurable tolerance settings (0.1%, 0.5%, 1.0%, 2.0%) and our Dynamic Gas Model allowing users to pay transaction fees with any token in their wallet, not just SOL.",
      tags: ["Slippage Protection", "Gas Model", "Core Feature"],
      image: "/assets/images/transaction.png",
    },
  ];
  const keyFeatures = [
    {
      icon: Globe,
      title: "Cross-Platform Integration",
      description:
        "Automatic recommendation system for optimal transaction routing based on fees and network congestion across multiple platforms including SONIC and other blockchains.",
    },
    {
      icon: Shield,
      title: "Slippage Protection",
      description:
        "Configurable slippage tolerance settings (0.1%, 0.5%, 1.0%, 2.0%) with price impact calculations to protect your trades from unexpected price movements.",
    },
    {
      icon: Activity,
      title: "Transaction Status Tracking",
      description:
        "Real-time visualization of transaction status including checking, creating, confirming, completed, and failed states with helpful feedback.",
    },
    {
      icon: DollarSign,
      title: "Gasless Trading",
      description:
        "Pay transaction fees with any token in your wallet, not just SOL. No need to keep SOL on hand for a seamless trading experience.",
    },
    {
      icon: Zap,
      title: "Deflationary Tokenomics",
      description:
        "Every transaction contributes to burn vaults, systematically reducing token supply over time and supporting price stability.",
    },
    {
      icon: BarChart3,
      title: "Smart Routing & Analytics",
      description:
        "Advanced algorithms ensure optimal trade execution while predictive analytics help you identify the best trading opportunities.",
    },
    {
      icon: RefreshCw,
      title: "Optimized Portfolio Tracking",
      description:
        "Lightning-fast portfolio loading and tracking across all platforms with response times under 166ms even for large portfolios of 50+ tokens.",
    },
  ];
  // Sample tokens for showcase
  const popularPairs = [
    {
      token1: { symbol: "SOUL", image: "/assets/images/logo.png" },
      token2: { symbol: "SOL", image: "/assets/images/DocBanner.png" },
      apr: "26.8%",
      volume: "1.8M USDC",
    },
    {
      token1: { symbol: "SOUL", image: "/assets/images/logo.png" },
      token2: { symbol: "USDC", image: "/assets/images/DocBanner.png" },
      apr: "19.5%",
      volume: "1.2M USDC",
    },
    {
      token1: { symbol: "SOUL", image: "/assets/images/logo.png" },
      token2: { symbol: "BONK", image: "/assets/images/DocBanner.png" },
      apr: "34.2%",
      volume: "940K USDC",
    },
    {
      token1: { symbol: "SOUL", image: "/assets/images/logo.png" },
      token2: { symbol: "DOGE", image: "/assets/images/DocBanner.png" },
      apr: "31.7%",
      volume: "780K USDC",
    },
    {
      token1: { symbol: "SOUL", image: "/assets/images/logo.png" },
      token2: { symbol: "WIF", image: "/assets/images/DocBanner.png" },
      apr: "28.3%",
      volume: "650K USDC",
    },
    {
      token1: { symbol: "SOUL", image: "/assets/images/logo.png" },
      token2: { symbol: "JUP", image: "/assets/images/DocBanner.png" },
      apr: "22.9%",
      volume: "580K USDC",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {" "}
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 p-8">
          {" "}
          <div className="flex justify-between items-center">
            {" "}
            <div className="max-w-3xl flex-1">
              <h1 className="text-4xl font-bold mb-4 text-white">
                SOLess Swap: Defi Exhange where you can use <span className="text-soless-blue">any token</span>{" "}
                for gas
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                A flexible, decentralized exchange on Solana and SONIC where you can pay
                transaction fees with any token - even meme coins.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/public/articles/SOLessSwap Article 1 (MEME).pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-soless-blue hover:bg-soless-blue/80 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  Articles <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <a
                  href="/public/whitepapers/SOLess Swap v3.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  Whitepaper <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center pl-6">
              <img
                src="/assets/images/soulie-gas.png"
                alt="Soulie"
                className="h-64 w-auto transition-opacity duration-3000"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main content - Development updates */}
        <div className="lg:col-span-2">
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Development Progress
            </h2>
            {developmentUpdates.map((update, index) => (
              <ProgressUpdate key={index} {...update} />
            ))}
          </div>

          {/* Swap interface mockup */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Swap Interface Preview
            </h2>

            {/* Advanced swap interface mockup with status visualization */}
            <div className="max-w-md mx-auto bg-black/60 border border-soless-blue/30 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Swap</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-white p-1">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Platform selection */}
              <div className="bg-soless-blue/10 border border-soless-blue/30 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Execution Platform
                  </span>
                  <div className="flex items-center">
                    <div className="flex items-center bg-gradient-to-r from-green-600/20 to-green-400/20 border border-green-500/30 rounded-lg px-3 py-1">
                      <span className="text-green-400 text-sm font-medium mr-1">
                        SONIC
                      </span>
                      <div className="bg-green-500/30 p-1 rounded-full">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-1">Fee:</span>
                    <span className="text-green-400">0.0005 SOL</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-1">Network:</span>
                    <span className="text-green-400">Low Congestion</span>
                  </div>
                </div>
              </div>

              {/* From token */}
              <div className="bg-black/70 border border-soless-blue/30 rounded-lg p-4 mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">From</span>
                  <span className="text-sm text-gray-400">
                    Balance: 1,420.69
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value="1.0"
                    readOnly
                    className="bg-transparent text-white text-2xl font-medium w-2/3 focus:outline-none"
                  />
                  <button className="flex items-center bg-soless-blue/20 hover:bg-soless-blue/30 text-white rounded-lg px-3 py-2 transition-colors">
                    <img
                      src="/assets/images/logo.png"
                      alt="SOUL"
                      className="h-6 w-6 mr-2"
                    />
                    <span>SOUL</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>

              {/* Swap icon */}
              <div className="flex justify-center -my-2 relative z-10">
                <button className="bg-soless-blue/20 p-2 rounded-full border-4 border-black hover:bg-soless-blue/30 transition-colors">
                  <ArrowRight className="h-5 w-5 text-soless-blue transform rotate-90" />
                </button>
              </div>

              {/* To token */}
              <div className="bg-black/70 border border-soless-blue/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">To</span>
                  <span className="text-sm text-gray-400">Balance: 0.05</span>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value="0.00058"
                    readOnly
                    className="bg-transparent text-white text-2xl font-medium w-2/3 focus:outline-none"
                  />
                  <button className="flex items-center bg-soless-blue/20 hover:bg-soless-blue/30 text-white rounded-lg px-3 py-2 transition-colors">
                    <img
                      src="/assets/images/DocBanner.png"
                      alt="SOL"
                      className="h-6 w-6 mr-2"
                    />
                    <span>SOL</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>

              {/* Slippage settings */}
              <div className="bg-black/50 border border-soless-blue/20 rounded-lg p-3 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Slippage Tolerance
                  </span>
                  <span className="text-sm text-soless-blue">0.5%</span>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-black/50 text-gray-400 px-2 py-1 rounded text-xs border border-gray-700 hover:border-soless-blue/50 transition-colors">
                    0.1%
                  </button>
                  <button className="bg-soless-blue/20 text-soless-blue px-2 py-1 rounded text-xs border border-soless-blue/30 hover:border-soless-blue transition-colors">
                    0.5%
                  </button>
                  <button className="bg-black/50 text-gray-400 px-2 py-1 rounded text-xs border border-gray-700 hover:border-soless-blue/50 transition-colors">
                    1.0%
                  </button>
                  <button className="bg-black/50 text-gray-400 px-2 py-1 rounded text-xs border border-gray-700 hover:border-soless-blue/50 transition-colors">
                    2.0%
                  </button>
                </div>
              </div>

              {/* Transaction info */}
              <div className="bg-soless-blue/10 border border-soless-blue/30 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Price Impact</span>
                  <span className="text-green-400">0.05%</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Est. Time</span>
                  <span className="text-white">~3 seconds</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gas Payment</span>
                  <span className="text-soless-blue">SOUL (no SOL needed)</span>
                </div>
              </div>

              {/* Transaction status indicator */}
              <div className="bg-black/60 border border-soless-blue/20 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 mr-2">Status:</span>
                  <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
                    Idle
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1">
                  <div className="h-1 bg-gray-700 rounded-l"></div>
                  <div className="h-1 bg-gray-700"></div>
                  <div className="h-1 bg-gray-700"></div>
                  <div className="h-1 bg-gray-700"></div>
                  <div className="h-1 bg-gray-700 rounded-r"></div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Checking</span>
                  <span>Creating</span>
                  <span>Confirming</span>
                  <span>Completed</span>
                </div>
              </div>

              {/* Swap button */}
              <button className="w-full bg-soless-blue hover:bg-soless-blue/80 text-white font-medium rounded-lg py-3 transition-colors">
                Swap
              </button>
            </div>

            <div className="text-center text-gray-400 text-sm">
              Note: This is a preview mockup. The actual interface may vary in
              the final release.
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="lg:col-span-1">
          {/* Key features */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Key Features</h2>
            <div className="space-y-4">
              {keyFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
          {/* Project Status */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">
              Project Status
            </h2>{" "}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-300 text-sm">Overall Progress</span>
                <span className="text-soless-blue text-sm font-medium">
                  95%
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2">
                <div
                  className="bg-soless-blue h-2 rounded-full"
                  style={{ width: "95%" }}
                ></div>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-md font-semibold text-soless-blue mb-2">
                Completed
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Cross-platform integration & routing
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Transaction status visualization
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Slippage protection controls
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Dynamic gas model for any token
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Core swap interface components
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Portfolio performance optimization
                  </p>
                </li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-md font-semibold text-yellow-500 mb-2">
                In Progress
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Mobile UI optimizations
                  </p>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Advanced fee distribution mechanisms
                  </p>
                </li>
              </ul>
            </div>{" "}
            <div className="mt-4 text-xs text-gray-400">
              Target Beta Launch: June 13, 2025
            </div>
          </div>{" "}
          {/* Resources */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Resources</h2>
            <a
              href="/public/whitepapers/SOLess Swap v3.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors mb-4"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  SOLessSwap Whitepaper
                </h3>
                <p className="text-xs text-gray-400">
                  Technical details and roadmap
                </p>
              </div>
            </a>
            <a
              href="/public/articles/SOLessSwap Article 1 (MEME).pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors mb-4"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">Meme Coin Economy</h3>
                <p className="text-xs text-gray-400">
                  How SOLessSwap empowers meme tokens
                </p>
              </div>
            </a>
            <a
              href="/public/articles/SOLessSwap Article 2 (FEE).pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors mb-4"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  Fee Distribution System
                </h3>
                <p className="text-xs text-gray-400">
                  Advanced fee mechanisms explained
                </p>
              </div>
            </a>
            <a
              href="/public/docs/performance-report-may-2025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors"
            >
              <div className="mr-4 bg-green-500/20 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-white">Performance Report</h3>
                <p className="text-xs text-gray-400">
                  May 2025 portfolio optimization results
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Swap;
