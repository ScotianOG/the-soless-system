import { Link } from "react-router-dom";
import {
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Clock,
  Users,
  RefreshCw,
  Zap,
  CalendarDays,
} from "lucide-react";
import { useState, useEffect } from "react";

// Component for update cards
const UpdateCard = ({
  title,
  date,
  description,
  link,
  type,
}: {
  title: string;
  date: string;
  description: string;
  link?: string;
  type: "news" | "update" | "event";
}) => {
  // Different styling based on update type
  const typeStyles = {
    news: "border-blue-500 bg-blue-500/10",
    update: "border-green-500 bg-green-500/10",
    event: "border-purple-500 bg-purple-500/10",
  };

  return (
    <div
      className={`rounded-lg p-4 border ${typeStyles[type]} hover:bg-black/40 transition-colors duration-200 h-full`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <span className="text-xs text-gray-400 flex items-center">
          <Clock className="mr-1 h-3 w-3" />
          {date}
        </span>
      </div>
      <p className="text-gray-300 text-sm mb-3">{description}</p>
      {link && (
        <Link
          to={link}
          className="text-soless-blue hover:text-soless-blue/80 text-sm flex items-center"
        >
          Read more <ExternalLink className="ml-1 h-3 w-3" />
        </Link>
      )}
    </div>
  );
};

// Social post component
const SocialPost = ({
  platform,
  username,
  content,
  date,
  likes,
}: {
  platform: "twitter" | "reddit" | "telegram";
  username: string;
  content: string;
  date: string;
  likes: number;
}) => {
  const platformStyles = {
    twitter: "border-blue-400",
    reddit: "border-orange-400",
    telegram: "border-cyan-400",
  };

  return (
    <div
      className={`border-l-2 ${platformStyles[platform]} bg-black/30 p-4 rounded-r-lg mb-4`}
    >
      <div className="flex justify-between mb-2">
        <span className="font-medium text-sm">@{username}</span>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
      <p className="text-sm mb-2">{content}</p>
      <div className="flex items-center text-xs text-gray-400">
        <span className="mr-4">{likes} likes</span>
        <button className="text-gray-400 hover:text-soless-blue transition-colors">
          Reply
        </button>
      </div>
    </div>
  );
};

// Platform feature component
const PlatformFeature = ({
  iconPath,
  title,
  description,
  linkTo,
  color,
}: {
  iconPath: string;
  title: string;
  description: string;
  linkTo: string;
  color: string;
}) => {
  return (
    <Link to={linkTo}>
      <div
        className={`bg-black/30 p-6 rounded-xl border border-${color}/40 hover:border-${color}/70 transition-all duration-300 h-full group`}
      >
        <div
          className={`mb-4 p-4 bg-black/50 rounded-full group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}
        >
          <img src={iconPath} alt={title} className="h-12 w-12" />
        </div>
        <h3
          className={`text-2xl font-bold mb-3 text-${color} group-hover:translate-x-1 transition-transform duration-300`}
        >
          {title}
        </h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <span className={`flex items-center text-sm text-${color} font-medium`}>
          Learn more{" "}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </div>
    </Link>
  );
};

const Home = () => {
  // This would typically come from an API
  const updates = [
    {
      title: "Spring SOLstice Contest Launch",
      date: "March 1, 2025",
      description: "Join our community contest with over $10,000 in prizes!",
      link: "/community",
      type: "event" as const,
    },
    {
      title: "SOLessSwap Alpha Release",
      date: "February 22, 2025",
      description:
        "Our revolutionary swap platform is now in alpha testing phase.",
      link: "/alpha-release",
      type: "update" as const,
    },
    {
      title: "New Partnership Announcement",
      date: "February 15, 2025",
      description:
        "SOLess partners with leading DeFi protocol to enhance liquidity options.",
      link: "/pioneer-partnership",
      type: "news" as const,
    },
  ];

  const socialPosts = [
    {
      platform: "twitter" as const,
      username: "SOLessSystem",
      content:
        "Excited to announce our Spring SOLstice Contest! Join now and earn rewards for community participation. #SOLess #SONIC #Web3",
      date: "2h ago",
      likes: 124,
    },
    {
      platform: "reddit" as const,
      username: "SOLess_Official",
      content:
        "SOLessSwap alpha is now available for testing! Check out the new UI and gas-free swapping for any token.",
      date: "5h ago",
      likes: 87,
    },
    {
      platform: "telegram" as const,
      username: "SOLess_Community",
      content:
        "Q&A session with the founders scheduled for tomorrow at 3 PM UTC! Don't miss it!",
      date: "1d ago",
      likes: 56,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center p-8">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-soless-blue to-purple-500">
              The SOLess System
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Three innovative and intricately connected platforms powered by
              burning their native currency, $SOUL.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/community"
                className="bg-soless-blue hover:bg-soless-blue/80 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Register for the Summer of Soulie Contest
              </Link>
              <Link
                to="/soulie"
                className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ask Soulie
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img
              src="/assets/images/new-logo.png"
              alt="SOLess Logo"
              className="h-64 w-auto animate-float"
            />
          </div>
        </div>
      </div>{" "}
      {/* Three Platform Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PlatformFeature
          iconPath="/assets/images/soulie-gas.png"
          title="SOLessSwap"
          description="Pay gas fees in any listed token – even meme coins – eliminating the need for SOL. Every transaction burns $SOUL"
          linkTo="/swap"
          color="soless-blue"
        />
        <PlatformFeature
          iconPath="/assets/images/laptop.png"
          title="SOLspace"
          description="A decentralized social ecosystem where content ownership, engagement metrics, and community work together to burn $SOUL."
          linkTo="/solspace"
          color="soless-blue"
        />
        <PlatformFeature
          iconPath="/assets/images/museum.png"
          title="SOLarium"
          description="Dedicated vault and marketplace for NFT art and social content created on SOLspace. All mints have a guranteed floor price backed by $SOUL"
          linkTo="/solarium"
          color="soless-blue"
        />
      </div>
      {/* Soulie AI chatbot promo card */}
      <div className="bg-black/30 border border-purple-500/40 rounded-xl p-6 mb-8 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden relative">
        {/* Background design element */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="md:w-1/2">
            {" "}
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/20 rounded-full p-2 mr-3 flex items-center justify-center">
                <img
                  src="/assets/icons/purple-soulie-bot-184x224.png"
                  alt="Soulie"
                  className="h-8 w-8"
                />
              </div>
              <h2 className="text-2xl font-bold text-purple-400">
                Meet Soulie
              </h2>
            </div>
            <p className="text-gray-300 mb-6">
              Your tour guide around the SOLess System. Soulie is an AI chatbot,
              designed and built in house. He can help answer questions, provide
              information about our platforms, and show you how everything and
              everyone here is working together to bring on the closed-system
              short squeeze.
            </p>
            <Link
              to="/soulie"
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-6 py-3 rounded-lg transition-colors inline-flex items-center"
            >
              Chat with Soulie <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="md:w-1/2 bg-black/50 rounded-xl p-4 border border-purple-500/30">
            <div className="flex flex-col space-y-3">
              <div className="bg-purple-500/10 rounded-lg p-3 self-start max-w-[80%] border-l-4 border-purple-500">
                <p className="text-purple-300 text-sm">
                  Welcome! I'm Soulie, your guide to the SOLess System. How can
                  I help you today?
                </p>
              </div>
              <div className="text-center text-gray-500 text-xs">
                Visit the Soulie page to start chatting
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
