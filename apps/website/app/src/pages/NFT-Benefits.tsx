import React, { useEffect } from "react";
import {
  ArrowRight,
  Star,
  Zap,
  Shield,
  Users,
  Wallet,
  ExternalLink,
} from "lucide-react";

const NFTRewardsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "SOLess | NFT Benefits";
  }, []);

  const rewardTiers = [
    {
      name: "Base Tier",
      icon: Star,
      features: [
        {
          title: "12,500 Liquidity Tokens + 4,167 Airdrop Tokens",
          description:
            "Each NFT is backed by liquidity tokens that establish a minimum floor price, plus additional airdrop tokens distributed at launch to provide immediate utility.",
        },
        {
          title: "Ad-free platform experience",
          description:
            "Enjoy a completely ad-free experience across all SOLspace platforms, allowing you to focus entirely on content and trading without distractions.",
        },
        {
          title: "100 fee-free trades monthly",
          description:
            "Execute up to 100 trades per month without paying any platform fees, significantly reducing your trading costs and improving profitability.",
        },
        {
          title: "Basic governance voting power",
          description:
            "Participate in platform governance decisions with 1x voting power, helping shape the future of the SOLspace ecosystem.",
        },
        {
          title: "Standard content limits",
          description:
            "Post longer content with expanded character limits and increased media upload allowances compared to regular users.",
        },
        {
          title: "Access to Founders Chat",
          description:
            "Join an exclusive chat community for NFT holders where you can network with other founders and get early updates on platform developments.",
        },
      ],
    },
    {
      name: "Rare Tier",
      icon: Shield,
      features: [
        {
          title: "Enhanced governance voting (2x)",
          description:
            "Double voting power in platform governance decisions, giving you greater influence over future developments and updates.",
        },
        {
          title: "200 fee-free trades monthly",
          description:
            "Execute up to 200 trades monthly without fees, perfect for active traders who want to maximize their trading efficiency.",
        },
        {
          title: "Premium analytics dashboard",
          description:
            "Access advanced trading metrics, market analysis tools, and detailed portfolio tracking features not available to regular users.",
        },
        {
          title: "Custom community tools",
          description:
            "Create and manage communities with advanced moderation tools, custom emojis, and specialized engagement features.",
        },
        {
          title: "Priority content placement",
          description:
            "Your content receives higher visibility in feeds and search results, helping you reach a wider audience.",
        },
        {
          title: "Extended storage limits",
          description:
            "Get significantly more storage space for media uploads, allowing you to share higher quality content and more diverse media types.",
        },
      ],
    },
    {
      name: "Ultra Rare Tier",
      icon: Zap,
      features: [
        {
          title: "Maximum governance power (3x)",
          description:
            "Triple voting power in governance decisions, giving you maximum influence over the platform's direction and development priorities.",
        },
        {
          title: "Unlimited fee-free trading",
          description:
            "Trade as much as you want without ever paying platform fees, maximizing your trading profits and opportunities.",
        },
        {
          title: "Private API access",
          description:
            "Get exclusive access to platform APIs for building custom tools, bots, and integrations with the SOLess ecosystem.",
        },
        {
          title: "Advanced analytics suite",
          description:
            "Access the most comprehensive analytics package, including real-time market data, advanced charting tools, and predictive analytics.",
        },
        {
          title: "Direct dev team access",
          description:
            "Communicate directly with the development team through private channels for feature requests, bug reports, and strategic discussions.",
        },
        {
          title: "Maximum storage allocation",
          description:
            "Enjoy unlimited storage for all your media needs, with support for the highest quality uploads and specialized content types.",
        },
      ],
    },
  ];

  const stackingBenefits = [
    {
      title: "Trading Benefits",
      icon: Wallet,
      benefits: [
        {
          title: "Additional fee-free trades (+50 per NFT)",
          description:
            "Each additional NFT increases your monthly fee-free trade allowance by 50, allowing you to scale up your trading activity without increasing costs.",
        },
        {
          title: "Reduced slippage on large trades",
          description:
            "Enjoy preferential routing and reduced slippage on large trades, with the benefit increasing based on the number of NFTs held.",
        },
        {
          title: "Priority transaction processing",
          description:
            "Your transactions are processed with higher priority in the queue, ensuring faster execution especially during high-traffic periods.",
        },
        {
          title: "Enhanced portfolio tracking",
          description:
            "Access advanced portfolio analytics and tracking features, with support for multiple wallets and detailed performance metrics.",
        },
        {
          title: "Early access to new trading pairs",
          description:
            "Be among the first to trade new pairs and tokens listed on the platform, gaining early mover advantage in new markets.",
        },
      ],
    },
    {
      title: "Platform Privileges",
      icon: Star,
      benefits: [
        {
          title: "Increased content character limits",
          description:
            "Post longer content with expanded character limits that increase with each additional NFT held, perfect for detailed analysis and comprehensive content.",
        },
        {
          title: "Additional media storage",
          description:
            "Get extra storage space for each NFT held, allowing you to upload and share more high-quality media content.",
        },
        {
          title: "Enhanced profile customization",
          description:
            "Access exclusive profile customization options including animated backgrounds, custom themes, and special effects.",
        },
        {
          title: "Multiple verified badges",
          description:
            "Display multiple verification badges across different communities and contexts, establishing your authority in various areas.",
        },
        {
          title: "Custom URL options",
          description:
            "Create custom URLs for your profile and content, making it easier for followers to find and share your presence.",
        },
      ],
    },
    {
      title: "Community Perks",
      icon: Users,
      benefits: [
        {
          title: "Multiple private group creation",
          description:
            "Create and manage multiple private groups with advanced features, perfect for building specialized communities or trading groups.",
        },
        {
          title: "Enhanced moderation tools",
          description:
            "Access powerful moderation features to maintain healthy communities, including automated content filtering and detailed analytics.",
        },
        {
          title: "Priority support response",
          description:
            "Receive faster support responses with dedicated channels for NFT holders, ensuring quick resolution of any issues.",
        },
        {
          title: "Special community badges",
          description:
            "Display exclusive badges that showcase your status and contributions within the SOLspace ecosystem.",
        },
        {
          title: "Exclusive event access",
          description:
            "Get priority access to platform events, AMAs, and special trading competitions with exclusive rewards.",
        },
      ],
    },
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
              SOLess NFT{" "}
              <span className="text-soless-blue">Benefits & Utilities</span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Unlock exclusive rewards and features across the entire SOLess
              ecosystem.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/trading-bot-access"
                className="bg-soless-blue hover:bg-soless-blue/80 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Trading Bot <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="/mint"
                className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Mint <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
                      <div className="hidden md:flex items-center pl-6">
              <img
                src="/assets/images/sunflower.png"
                alt="SOLspace Platform"
                className="h-64 w-auto transition-opacity duration-3000"
              />
            </div>
            </div>
        </div>
      </div>

      {/* Token Rewards */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <h2 className="text-2xl font-bold text-soless-blue mb-6">
          Token Rewards
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4">
              Initial Allocation
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-300">
                <ArrowRight className="w-5 h-5 text-soless-blue shrink-0" />
                12,500 Liquidity Tokens per NFT
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <ArrowRight className="w-5 h-5 text-soless-blue shrink-0" />
                4,167 Airdrop Tokens per NFT
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <ArrowRight className="w-5 h-5 text-soless-blue shrink-0" />
                15.9% of mint price returned in tokens
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-4">
              Value Potential
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-300">
                <ArrowRight className="w-5 h-5 text-soless-blue shrink-0" />
                Break-even at $0.0033 per token
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <ArrowRight className="w-5 h-5 text-soless-blue shrink-0" />
                Long-term value: $0.50 - $2.00 per token
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <ArrowRight className="w-5 h-5 text-soless-blue shrink-0" />
                1000-4000x potential from launch price
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {rewardTiers.map((tier, index) => (
          <div
            key={index}
            className="bg-black/30 p-6 rounded-xl border border-soless-blue/40"
          >
            <div className="flex items-center gap-2 mb-4">
              <tier.icon className="w-6 h-6 text-soless-blue" />
              <h3 className="text-xl font-bold text-soless-blue">
                {tier.name}
              </h3>
            </div>
            <ul className="space-y-3">
              {tier.features.map((feature, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-5 h-5 text-soless-blue shrink-0 mt-0.5" />
                    <span className="text-gray-200 font-medium">
                      {feature.title}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm ml-7">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Stacking Benefits */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <h2 className="text-2xl font-bold text-soless-blue mb-6">
          Stacking Benefits
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {stackingBenefits.map((section, index) => (
            <div key={index}>
              <div className="flex items-center gap-2 mb-4">
                <section.icon className="w-6 h-6 text-soless-blue" />
                <h3 className="text-xl font-semibold text-gray-200">
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {section.benefits.map((benefit, i) => (
                  <li key={i} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-5 h-5 text-soless-blue shrink-0 mt-0.5" />
                      <span className="text-gray-200 font-medium">
                        {benefit.title}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm ml-7">
                      {benefit.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 3D NFT Holder Benefits */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-soless-blue">
            3D Soulie Benefits
          </h2>
          <div className="px-3 py-1 rounded-full bg-soless-blue/20 border border-soless-blue/40 text-sm text-soless-blue">
            30 Limited Edition NFTs
          </div>
        </div>

        <div className="bg-soless-blue/10 border border-soless-blue/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-soless-blue mb-2">
            All Ultra Rare Benefits Included
          </h3>
          <p className="text-gray-300">
            3D holders automatically receive all Ultra Rare tier utility and
            access, plus the following exclusive benefits:
          </p>
        </div>

        <ul className="space-y-6">
          <li className="space-y-1">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-soless-blue shrink-0 mt-0.5" />
              <span className="text-gray-200 font-medium">
                Direct Trading Bot Access
              </span>
            </div>
            <p className="text-gray-400 text-sm ml-7">
              Immediate access to the trading bot without any locking or burning
              requirements.
            </p>
          </li>

          <li className="space-y-1">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-soless-blue shrink-0 mt-0.5" />
              <span className="text-gray-200 font-medium">
                Custom Physical Plushie
              </span>
            </div>
            <p className="text-gray-400 text-sm ml-7">
              Receive a custom plushie of your Soulie when entering a 6 or 12
              month staking contract. Trading bot access is maintained during
              staking period.
            </p>
          </li>
        </ul>
      </div>

      {/* SOULmates Benefits */}
      <div className="bg-black/30 p-8 rounded-xl border border-purple-500/40">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-purple-400">
            SOULmates Benefits
          </h2>
          <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-sm text-purple-400">
            3D NFT + Partner NFT
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">
            Ultra Rare + 3D Benefits Included
          </h3>
          <p className="text-gray-300">
            SOULmates receive all Ultra Rare and 3D NFT benefits, plus these
            exclusive advantages:
          </p>
        </div>

        <ul className="space-y-6">
          <li className="space-y-1">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <span className="text-gray-200 font-medium">
                Soulbound Connection
              </span>
            </div>
            <p className="text-gray-400 text-sm ml-7">
              Your NFTs become eternally bonded and can only be transferred as a
              pair from that moment on.
            </p>
          </li>

          <li className="space-y-1">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <span className="text-gray-200 font-medium">
                Amplified Staking Rewards
              </span>
            </div>
            <p className="text-gray-400 text-sm ml-7">
              Earn significantly higher $SOUL token yields when staking your
              bonded pair. Trading bot access remains available.
            </p>
          </li>

          <li className="space-y-1">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <span className="text-gray-200 font-medium">
                Exclusive Lore Access
              </span>
            </div>
            <p className="text-gray-400 text-sm ml-7">
              Each pair of SOULmates has a story that delves deeper into the
              captivating SOLess System narrative.
            </p>
          </li>

          <li className="space-y-1">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <span className="text-gray-200 font-medium">
                Priority Mint Passes
              </span>
            </div>
            <p className="text-gray-400 text-sm ml-7">
              Automatic whitelist access for every single future NFT drop and in
              some cases will get free mints.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NFTRewardsPage;
