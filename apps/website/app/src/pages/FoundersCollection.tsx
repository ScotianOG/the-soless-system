import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Twitter,
  Lock,
  Flame,
  ArrowRight,
  Check,
  ExternalLink,
} from "lucide-react";

const FoundersCollection = () => {
  const tiers = [
    {
      name: "Base Tier",
      count: "2250 NFTs",
      benefits: [
        "Guaranteed floor price of 12,500 $SOUL each",
        "Standard utility package",
        "Ad-free platform experience",
        "Extended content limits",
        "Custom profile themes",
      ],
    },
    {
      name: "Rare Tier",
      count: "600 NFTs",
      benefits: [
        "Enhanced governance voting",
        "Increased fee reductions",
        "Custom community tools",
        "Priority content placement",
        "Advanced analytics dashboard",
      ],
    },
    {
      name: "Ultra Rare Tier",
      count: "120 NFTs",
      benefits: [
        "Maximum fee reduction",
        "Private API access",
        "Premium analytics suite",
        "Verified communities",
        "Direct dev team access",
      ],
    },
  ];

  const universalBenefits = [
    "Ad-free social media experience",
    "Extended character limits",
    "Custom profiles with personalized themes",
    "Priority access to new features",
    "Exclusive Founders chat access",
    "Zero fees on first 100 trades/month",
    "Priority transaction processing",
    "Enhanced wallet features",
    "Premium market analytics",
    "NFT showcase capabilities",
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 p-8">
          <div className="flex justify-between items-center">
            <div className="max-w-3xl flex-1">
              <h1 className="text-4xl font-bold mb-4 text-white">
                SOLess{" "}
                <span className="text-soless-blue">Founder's Club</span>
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Exclusive NFTs with premium benefits and a guaranteed floor
                price backed by SOUL. The Founder's Collection mint date will be
                announced soon. Join our social channels to be the first to
                know.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center mb-12">
                <Link
                  to="https://t.me/SolessSystem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-soless-blue hover:bg-soless-blue/80 text-black px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <MessageSquare className="h-5 w-5" />
                  Join Telegram
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  to="https://twitter.com/SolessSystem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <Twitter className="h-5 w-5" />
                  Follow Twitter
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center pl-6">
              <img
                src="/assets/images/open-arms-looking-left.png"
                alt="Founder's Club"
                className="h-64 w-auto transition-opacity duration-3000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Info */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <h3 className="text-2xl font-bold text-soless-blue">3,000</h3>
            <p className="text-gray-300">Total NFTs</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-soless-blue">0.17 SOL</h3>
            <p className="text-gray-300">Mint Price</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-soless-blue">12,500 SOUL</h3>
            <p className="text-gray-300">Guaranteed Floor Price</p>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {tiers.map((tier, index) => (
          <div
            key={index}
            className="bg-black/30 p-6 rounded-xl border border-soless-blue/40"
          >
            <h3 className="text-xl font-bold text-soless-blue mb-2">
              {tier.name}
            </h3>
            <p className="text-gray-400 mb-4">{tier.count}</p>
            <ul className="space-y-2">
              {tier.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300">
                  <Check className="w-5 h-5 text-soless-blue shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 3D Soulie Section */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">
              3D Soulie Exclusive Access
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              Only 30 digitally signed 3D Soulies will ever exist. 15 available
              to mint. When one is discovered, his partner will be revealed and
              auctioned off to the highest bidder.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Digitally signed by artist</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Direct trading bot access</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Personal AI analytics agent</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Lifetime platform benefits</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Exclusive 3D holder events</span>
              </div>
            </div>
            <Link
              to="/trading-bot-access"
              className="inline-block bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Learn More About Trading Bot
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-lg blur-xl"></div>
              <img
                src="/assets/images/3d-soulie-preview.png"
                alt="3D Soulie Preview"
                className="relative w-full max-w-sm h-auto rounded-lg border border-cyan-400/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Universal Benefits */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-soless-blue">
            Universal Benefits
          </h2>
          <Link
            to="/NFT-Benefits"
            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-soless-blue to-soless-purple rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            View All Benefits <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {universalBenefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-soless-blue shrink-0 mt-0.5" />
              <span className="text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Token Value */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-soless-blue mb-4">
              12,500 $SOUL Guaranteed Floor
            </h2>
            <div className="space-y-4">
              <p className="text-gray-300">Each NFT receives:</p>
              <ul className="space-y-4 text-gray-300">
                <li className="text-gray-300">
                  <span className="block font-semibold mb-2">
                    Smart Contract Vault
                  </span>
                  Each NFT in the Founders Collection has 12,500 $SOUL tokens
                  allocated specifically for floor price protection, locked in a
                  dedicated smart contract vault. These tokens cannot be
                  accessed or moved except through the redemption process.
                </li>
                <li className="text-gray-300">
                  <span className="block font-semibold mb-2">
                    Redemption Process
                  </span>
                  When a holder wants to exercise their floor price guarantee,
                  they can burn their NFT through our vault contract, which will
                  automatically release the corresponding 12,500 tokens to their
                  wallet. This process is permissionless and trustless - once
                  the NFT is burned, the smart contract immediately handles the
                  token transfer without any intermediary steps or approvals
                  needed.
                </li>
                <li className="text-gray-300">
                  <span className="block font-semibold mb-2">
                    Liquidity Backing
                  </span>
                  The vault contract maintains a 1:1 relationship between NFTs
                  and their allocated tokens, ensuring that the liquidity
                  backing is always available for redemption.
                </li>
                <li className="text-gray-300">
                  <span className="block font-semibold mb-2">
                    Additional Rewards
                  </span>
                  4,167 Airdrop Tokens at launch (unlocked)
                </li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-soless-blue/20 to-purple-500/20 rounded-lg blur-xl"></div>
              <img
                src="/assets/images/2d-soulie-preview.png"
                alt="2D Soulie Example"
                className="relative w-full max-w-sm h-auto rounded-lg border border-soless-blue/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundersCollection;
