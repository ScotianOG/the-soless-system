import React from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  Wallet,
  Image as ImageIcon,
  Settings,
  Store,
  Check,
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
          <img src={image} alt={title} className="w-full h-auto" />
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

// NFT Card component for showcase
const NFTCard = ({
  image,
  title,
  price,
}: {
  image: string;
  title: string;
  price: string;
}) => {
  return (
    <div className="bg-black/50 border border-soless-blue/30 rounded-lg overflow-hidden hover:border-soless-blue/60 transition-colors duration-300 group">
      <div className="aspect-square overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-sm font-medium text-white truncate">{title}</p>
        </div>
      </div>
      <div className="p-3 flex justify-between items-center">
        <span className="text-soless-blue font-medium">{price}</span>
        <button className="bg-soless-blue/20 text-soless-blue text-xs px-3 py-1 rounded-full hover:bg-soless-blue/30 transition-colors">
          View
        </button>
      </div>
    </div>
  );
};

const Solarium = () => {
  // Development updates - these would typically come from an API or CMS
  const developmentUpdates = [
    {
      date: "May 17, 2025",
      title: "Creator Storefront Build",
      description:
        "Successfully completed building the creator storefront feature, including customizable theming, collection organization tools, dynamic pricing models, and seamless integration with the floor price protection system.",
      tags: ["Creator Storefront", "Testing", "Beta Launch"],
    },
    {
      date: "May 12, 2025",
      title: "Advanced NFT Trait Configuration Tools",
      description:
        "Finalized the trait configuration toolset with dynamic rarity visualization, interdependent trait relationships, batch editing capabilities, and multi-collection trait standardization options for creators.",
      tags: ["NFT Traits", "Creator Tools", "Metadata"],
    },
    {
      date: "May 5, 2025",
      title: "Cross-Chain Bridge Completed",
      description:
        "We've implemented the cross-chain bridge functionality allowing individual NFTs to move between Ethereum, Solana and SONIC while maintaining value protection.",
      tags: ["Metadata", "Editor", "Cross-Chain"],
    },
    {
      date: "March 24, 2025",
      title: "Floor Price Protection System Completed",
      description:
        "Finished testing of the  entire floor price protection system. The system uses SOUL token staking to guarantee minimum values for all NFTs.",
      tags: ["Cross-Chain", "Bridge", "Value Protection"],
      image: "/assets/images/SolariumBanner.png",
    },
  ];
  const keyFeatures = [
    {
      icon: Shield,
      title: "Guaranteed NFT Value",
      description:
        "Every NFT is backed by SOUL tokens establishing a minimum floor price, ensuring your digital assets always retain value with our advanced floor price protection system.",
    },
    {
      icon: Settings,
      title: "Instant Liquidity",
      description:
        "Any NFT can be sold back to the market at any time for it's backed price in SOUL tokens. When this happens, the NFT is burnt",
    },
    {
      icon: Wallet,
      title: "Cross-Chain Bridge",
      description:
        "Bridge your NFTs between Ethereum, Solana and SONIC while maintaining value protection, and trade them at floor prices without waiting for external buyers through our Sonic DeFi integration.",
    },
    {
      icon: ImageIcon,
      title: "SOLspace Integration",
      description:
        "All social content minted on SOLspace becomes a part of SOLarium and recieves the same floor price protection. Creators can choose to increase their content's floor price at the time of posting.",
    },
    {
      icon: Store,
      title: "Creator Storefront",
      description:
        "Customizable storefronts for creators with personalized theming, collection organization, dynamic pricing models, and seamless integration with the floor price protection system.",
    },
  ];
  // Sample NFTs for showcase
  const featuredNFTs = [
    {
      image: "/assets/images/soulie-nft-example.png",
      title: "Founder's Collection: Soulie PFP Collection",
      price: "Floor: 12500 SOUL",
    },
    {
      image: "/assets/images/droid-defi.png",
      title: "Daft Droids V1",
      price: "Floor: ??? SOUL",
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
                SOLarium: A{" "}
                <span className="text-soless-blue">Value-Protected</span>{" "}
                Marketplace for NFT Art and Social Content
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                A pioneering vault designed to safeguard and enhance the value
                of NFTs with guaranteed floor prices backed by SOUL tokens.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/public/articles/SOLarium Article 1 (LIQUIDITY).pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-soless-blue hover:bg-soless-blue/80 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  Articles <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <a
                  href="/public/whitepapers/SOLarium Whitepaper V1.0.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  Whitepaper <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>{" "}
            </div>{" "}
            <div className="hidden md:flex items-center pl-6">
              <img
                src="/assets/images/museum.png"
                alt="SOLarium NFT Gallery"
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

          {/* Featured NFTs showcase */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Featured NFTs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredNFTs.map((nft, index) => (
                <NFTCard key={index} {...nft} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="lg:col-span-1">
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
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Cross-chain bridge functionality
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    NFT floor price protection system
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Sonic DeFi integration
                  </p>
                </li>{" "}
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Enhanced metadata editor
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Dark/light mode theming
                  </p>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Loading states and skeleton loaders
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
                    Creator storefront testing
                  </p>
                </li>
                <li className="flex items-start">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    Advanced NFT trait configuration
                  </p>
                </li>
              </ul>
            </div>{" "}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-300 text-sm">Overall Progress</span>
                <span className="text-soless-blue text-sm font-medium">
                  90%
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2">
                <div
                  className="bg-soless-blue h-2 rounded-full"
                  style={{ width: "90%" }}
                ></div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Target Beta Launch: June 27, 2025
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

          {/* Resources */}
          <div className="bg-black/30 border border-soless-blue/40 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Resources</h2>
            <a
              href="/public/whitepapers/SOLarium Whitepaper V1.0.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors mb-4"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">SOLarium Whitepaper</h3>
                <p className="text-xs text-gray-400">
                  Technical details and ecosystem integration
                </p>
              </div>
            </a>
            <a
              href="/public/articles/SOLarium Article 1 (LIQUIDITY).pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-black/50 border border-soless-blue/30 rounded-lg hover:bg-black/70 transition-colors mb-4"
            >
              <div className="mr-4 bg-soless-blue/20 p-2 rounded-full">
                <ExternalLink className="h-5 w-5 text-soless-blue" />
              </div>
              <div>
                <h3 className="font-medium text-white">Liquidity Article</h3>
                <p className="text-xs text-gray-400">
                  How SOLarium solves NFT liquidity problems
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solarium;
