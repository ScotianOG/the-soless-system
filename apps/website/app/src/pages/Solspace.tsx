import React from "react";
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

// Progress update component
const ProgressUpdate = ({
  date,
  title,
  description,
  tags,
  image,
  smallImage,
}: {
  date: string;
  title: string;
  description: string;
  tags: string[];
  image?: string;
  smallImage?: boolean;
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
        <div
          className={`border-t border-soless-blue/20 ${
            smallImage ? "flex justify-center p-4" : ""
          }`}
        >
          <img
            src={image}
            alt={title}
            className={
              smallImage ? "w-1/2 h-auto rounded-lg shadow-md" : "w-full h-auto"
            }
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

const Solspace = () => {
  // Development updates based on project progress report
  const developmentUpdates = [
    {
      date: "May 17, 2025",
      title: "Enhanced Portfolio UI & Mobile Optimizations",
      description:
        "Refined the portfolio overview component with improved visualization and analytics, implemented responsive design for better mobile experiences, enhanced tooltip formatting, added cross-platform activity metrics, and improved chart rendering with gradient styling.",
      tags: ["Portfolio", "UI/UX", "Mobile Optimization"],
      image: "/assets/images/portfolio-overview.png",
    },
    {
      date: "May 14, 2025",
      title: "Content Moderation Tools Implementation",
      description:
        "Deployed advanced content moderation tools including AI-powered toxicity detection, community reporting system with configurable thresholds, multi-level review process, and automated content flagging based on engagement patterns.",
      tags: ["Moderation", "AI Integration", "Community Safety"],
      image: "/assets/images/moderation-tools.png",
      smallImage: true,
    },
    {
      date: "May 8, 2025",
      title: "Social Feed Implementation Progress",
      description:
        "Completed core social feed algorithmic sorting with engagement-based ranking, personalized content recommendations, and trending content detection. Integrated with the viral content detection system for elevated presentation of high-engagement content.",
      tags: ["Social Feed", "Algorithms", "User Engagement"],
    },
    {
      date: "March 20, 2025",
      title: "Project Architecture & Smart Contract Implementation",
      description:
        "We've established the core architecture using Next.js, TailwindCSS, and integrated with the SONIC blockchain. Basic Rust contracts for NFT operations on SONIC have been implemented and tested.",
      tags: ["Architecture", "Smart Contracts", "Blockchain"],
      image: "/assets/images/SOLspaceBanner.png",
    },
  ];
  const keyFeatures = [
    {
      icon: ThumbsUp,
      title: "NFT Minting for Every Post",
      description:
        "Every piece of content shared on SOLspace is minted as an NFT, ensuring you have true ownership of your content preserved on the blockchain.",
    },
    {
      icon: Users,
      title: "Direct Monetization Options",
      description:
        "Multiple avenues to monetize your content directly through tipping, token-based paywalls, and a tokenized rewards system.",
    },
    {
      icon: Check,
      title: "Verified Meme Economy",
      description:
        "A thriving ecosystem supporting creators with tools to verify identity, build trust, and measure influence in the rapidly growing world of memes.",
    },
    {
      icon: Shield,
      title: "Advanced Content Moderation",
      description:
        "AI-powered moderation tools with community reporting, configurable thresholds, and multi-level review process to keep the platform safe and engaging.",
    },
    {
      icon: BarChart2,
      title: "Enhanced Portfolio Analytics",
      description:
        "Visualize your portfolio performance across all platforms with improved charts, cross-platform metrics, and quick access to common actions.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {" "}
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 p-8">
          <div className="flex justify-between items-center">
            <div className="max-w-3xl flex-1">
              <h1 className="text-4xl font-bold mb-4 text-white">
                SOLspace: Own Your Content in the{" "}
                <span className="text-soless-blue">Decentralized Era</span>
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                A revolutionary social network built for the decentralized age,
                designed to give creators true ownership over their content and
                fair tracking and monetization of their influence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/solspace-system"
                  className="bg-soless-blue hover:bg-soless-blue/80 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  View New User Onboarding Flow{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a
                  href="/public/whitepapers/SOLspace Whitepaper V1.0.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  Read Whitepaper <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="hidden md:flex items-center pl-6">
              <img
                src="/assets/images/laptop.png"
                alt="SOLspace Platform"
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

          {/* Platform introduction */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              About SOLspace
            </h2>
            <p className="text-gray-300 mb-6">
              SOLspace is a revolutionary social network built for the
              decentralized age. Unlike traditional platforms where your posts
              can be altered or removed, SOLspace's NFT-based framework ensures
              your work remains truly yours, safeguarded on the blockchain.
            </p>

            {/* Platform Landing Page Preview */}
            <div className="border border-soless-blue/30 rounded-lg overflow-hidden mb-6">
              <img
                src="/assets/images/solspace-landing.png"
                alt="SOLspace Landing Page"
                className="w-full h-auto"
              />
              <div className="bg-black/80 p-3 text-center">
                <p className="text-soless-blue text-sm font-medium">
                  SOLspace Platform Landing Page
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-soless-blue">
                  Built on SONIC
                </h3>
                <p className="text-gray-300 text-sm">
                  Leveraging SONIC's high-speed, low-fee blockchain for a
                  seamless social experience with thousands of interactions
                  every second.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-soless-blue">
                  Creator-First Economy
                </h3>
                <p className="text-gray-300 text-sm">
                  SOLspace empowers users to benefit from their creativity and
                  influence, not just platforms profiting from user data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="lg:col-span-1">
          {/* System Flow promo */}
          <Link to="/solspace-system">
            <div className="bg-black/30 border border-green-500/50 rounded-xl p-6 mb-8 hover:border-green-500 transition-all duration-300 group">
              <h2 className="text-xl font-bold text-green-400 mb-2 group-hover:translate-x-1 transition-transform duration-300">
                SOLspace New User Oboarding Flow
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                See how viral content is detected, preserved as NFTs, and
                distributed to creators on the blockchain.
              </p>
              <div className="flex items-center text-green-400 group-hover:text-green-300">
                <span className="text-sm font-semibold">
                  View Interactive Demo
                </span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>{" "}
          {/* Project Status */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">
              Project Status
            </h2>

            <div className="mb-4">
              <h3 className="text-md font-semibold text-soless-blue mb-2">
                Completed
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Viral content detection
                  </p>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Basic NFT minting system
                  </p>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Token-based tipping system
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
                    Content moderation tools
                  </p>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Social feed implementation
                  </p>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">Advanced NFT features</p>
                </li>
              </ul>
            </div>{" "}

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-300 text-sm">Overall Progress</span>
                <span className="text-soless-blue text-sm font-medium">
                  85%
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2">
                <div
                  className="bg-soless-blue h-2 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              Target Beta Launch: July 10, 2025
            </div>
          </div>
          {/* Key features */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Key Features</h2>
            <div className="space-y-4">
              {keyFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
          {/* Whitepaper download */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Resources</h2>
            <a
              href="/public/whitepapers/SOLspace Whitepaper V1.0.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors mb-4"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">SOLspace Whitepaper</h3>
                <p className="text-xs text-gray-400">
                  Full technical details and roadmap
                </p>
              </div>
            </a>
            <a
              href="/public/articles/SOLspace Article 1 (CREATORS).pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  Creator Economy Article
                </h3>
                <p className="text-xs text-gray-400">
                  How SOLspace empowers creators
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solspace;
