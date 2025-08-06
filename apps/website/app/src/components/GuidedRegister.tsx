import { Check, HelpCircle, Trophy, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegram, FaDiscord, FaTwitter } from "react-icons/fa";
import { TwitterLoginButton } from "./TwitterLogin";
import { DiscordLoginButton } from "./DiscordLogin";
import ContestInfoModal from "./ContestInfoModal";

interface Platform {
  linked: boolean;
  verificationCode?: string;
}

interface Platforms {
  telegram: Platform;
  discord: Platform;
  twitter: Platform;
}

// Platform-specific colors and configurations remain the same
const platformColors = {
  telegram: {
    primary: "text-blue-400",
    border: "border-blue-400/20",
    bg: "from-blue-400/20",
    hover: "hover:bg-blue-400/10",
  },
  discord: {
    primary: "text-indigo-400",
    border: "border-indigo-400/20",
    bg: "from-indigo-400/20",
    hover: "hover:bg-indigo-400/10",
  },
  twitter: {
    primary: "text-sky-400",
    border: "border-sky-400/20",
    bg: "from-sky-400/20",
    hover: "hover:bg-sky-400/10",
  },
};

const platformIcons = {
  telegram: FaTelegram,
  discord: FaDiscord,
  twitter: FaTwitter,
};

const platformUrls = {
  telegram: "https://t.me/SOLessSystem",
  discord: "https://discord.gg/SOLessSystem",
  twitter: "https://twitter.com/SOLessSystem",
};

// Updated Registration Title Component
const RegistrationTitle = () => (
  <motion.h1
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-4xl md:text-6xl font-bold text-center px-4 mt-8 mb-16 pb-4"
    style={{
      background:
        "linear-gradient(90deg, #00E5FF 0%, #00B8D4 50%, #0091EA 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
      fontFamily: "'Changa One', display",
      lineHeight: "1.4", // Ensures 'g' isn't cut off
    }}
  >
    Registration
  </motion.h1>
);

const Tooltip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => (
  <div className="relative group">
    {children}
    <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 bottom-full left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg mb-2 min-w-[200px] shadow-xl">
      {content}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
    </div>
  </div>
);

interface GuidedRegisterProps {
  publicKey: string | null;
  generateVerificationCode: (platform: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  platforms: Platforms;
  setPlatforms: React.Dispatch<React.SetStateAction<Platforms>>;
  submitting: {
    telegram: boolean;
    discord: boolean;
    twitter: boolean;
    registration: boolean;
  };
  success: boolean;
}

function GuidedRegister({
  publicKey,
  generateVerificationCode,
  handleSubmit,
  platforms,
  submitting,
  success,
}: GuidedRegisterProps) {
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const steps = [
    {
      title: "Connect Wallet",
      description: "Connect your Solana wallet to begin",
      tooltip:
        "You'll need a Solana wallet like Phantom or Solflare installed to register for the contest",
    },
    {
      title: "Link Telegram",
      description: "Join our community on Telegram",
      tooltip:
        "Join our Telegram group and verify with @Soulie_bot to start earning points",
    },
    {
      title: "Link Discord",
      description: "Connect your Discord account",
      tooltip:
        "Join our Discord server for exclusive content and community events",
    },
    {
      title: "Link Twitter",
      description: "Connect with us on Twitter",
      tooltip: "Follow and engage with us on Twitter for additional rewards",
    },
  ];

  const getProgress = () => {
    if (!publicKey) return 0;
    const verifiedCount = Object.values(platforms).filter(
      (p: Platform) => p.linked
    ).length;
    return 1 + verifiedCount;
  };

  // Updated Progress Bar Component
  const ProgressBar = () => (
    <div className="max-w-4xl mx-auto mb-12">
      {/* Desktop Progress Steps */}
      <div className="hidden md:flex justify-center space-x-16 mb-8 px-8">
        {steps.map((step, index) => {
          const isComplete = getProgress() > index;
          const isCurrent = getProgress() === index;

          return (
            <Tooltip key={index} content={step.tooltip}>
              <div className="flex flex-col items-center w-24">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
                    ${
                      isComplete
                        ? "bg-gradient-to-br from-soless-blue to-purple-500"
                        : isCurrent
                        ? "bg-gradient-to-br from-soless-blue/50 to-purple-500/50"
                        : "bg-gray-800"
                    }`}
                  whileHover={{ scale: 1.1 }}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isComplete ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-medium">{index + 1}</span>
                  )}
                </motion.div>
                <div className="text-center">
                  <span
                    className={`text-sm font-medium ${
                      isComplete ? "text-soless-blue" : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Mobile Progress Steps */}
      <div className="md:hidden space-y-4 mb-4">
        {steps.map((step, index) => {
          const isComplete = getProgress() > index;
          const isCurrent = getProgress() === index;

          return (
            <div key={index} className="flex items-center space-x-3">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${
                    isComplete
                      ? "bg-gradient-to-br from-soless-blue to-purple-500"
                      : isCurrent
                      ? "bg-gradient-to-br from-soless-blue/50 to-purple-500/50"
                      : "bg-gray-800"
                  }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white text-sm">{index + 1}</span>
                )}
              </motion.div>
              <div className="flex flex-col">
                <span
                  className={`text-sm font-medium ${
                    isComplete ? "text-soless-blue" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
                <span className="text-xs text-gray-500">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar - Centered and wider */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden w-3/4 mx-auto">
        <motion.div
          className="h-full bg-gradient-to-r from-soless-blue via-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: `${(getProgress() / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  const PlatformCard = ({
    platform,
  }: {
    platform: keyof typeof platformIcons;
  }) => {
    const Icon = platformIcons[platform];
    const colors = platformColors[platform];

    return (
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`bg-gradient-to-br from-black/30 ${colors.bg} backdrop-blur-sm rounded-lg border ${colors.border} overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-medium ${colors.primary} capitalize flex items-center`}
            >
              <span className="mr-2">
                <Icon size={24} />
              </span>
              {platform}
            </h3>
            {platforms[platform].linked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Check className="w-5 h-5 text-green-400" />
              </motion.div>
            )}
          </div>

          {platform === "discord" ? (
            // Discord login with OAuth
            <div className="space-y-4">
              {platforms[platform].linked ? (
                <div className="text-center p-3 bg-indigo-900/20 rounded border border-indigo-400/20">
                  <p className="text-indigo-400 flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" /> Discord connected
                  </p>
                </div>
              ) : platforms[platform].verificationCode ? (
                <div className="space-y-4">
                  <p className="text-gray-300">Verification Code:</p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-black/50 rounded p-4 font-mono text-lg text-center ${colors.primary} border ${colors.border}`}
                  >
                    {platforms[platform].verificationCode}
                  </motion.div>
                  <DiscordLoginButton publicKey={publicKey || undefined} />
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => generateVerificationCode(platform)}
                  disabled={submitting[platform]}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-soless-blue to-purple-500 hover:from-soless-blue/80 hover:to-purple-500/80 rounded-md text-white 
                      font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 
                      flex items-center justify-center ${
                        submitting[platform]
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                >
                  <span className="mr-2">
                    <Icon size={20} />
                  </span>
                  {submitting[platform] ? "Generating..." : "Generate Code"}
                </motion.button>
              )}
            </div>
          ) : platform === "twitter" ? (
            // Twitter login with OAuth
            <div className="space-y-4">
              {platforms[platform].linked ? (
                <div className="text-center p-3 bg-sky-900/20 rounded border border-sky-400/20">
                  <p className="text-sky-400 flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" /> Twitter connected
                  </p>
                </div>
              ) : platforms[platform].verificationCode ? (
                <div className="space-y-4">
                  <p className="text-gray-300">Verification Code:</p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-black/50 rounded p-4 font-mono text-lg text-center ${colors.primary} border ${colors.border}`}
                  >
                    {platforms[platform].verificationCode}
                  </motion.div>
                  <TwitterLoginButton publicKey={publicKey || undefined} />
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => generateVerificationCode(platform)}
                  disabled={submitting[platform]}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-soless-blue to-purple-500 hover:from-soless-blue/80 hover:to-purple-500/80 rounded-md text-white 
                      font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 
                      flex items-center justify-center ${
                        submitting[platform]
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                >
                  <span className="mr-2">
                    <Icon size={20} />
                  </span>
                  {submitting[platform] ? "Generating..." : "Generate Code"}
                </motion.button>
              )}
            </div>
          ) : (
            // Standard Telegram verification flow
            <div>
              {platforms[platform].verificationCode ? (
                <div className="space-y-4">
                  <p className="text-gray-300">Verification Code:</p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-black/50 rounded p-4 font-mono text-lg text-center ${colors.primary} border ${colors.border}`}
                  >
                    {platforms[platform].verificationCode}
                  </motion.div>
                  <div>
                    <a
                      href={platformUrls[platform]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm ${colors.primary} ${colors.hover} flex items-center`}
                    >
                      <span className="mr-1">
                        <Icon size={16} />
                      </span>
                      Open {platform} and verify →
                    </a>
                    <div className="text-xs text-gray-500 mt-2 space-y-2">
                      <p>You can verify your account in two ways:</p>
                      <p>
                        1. Send this code as a private message to @Soulie_bot
                      </p>
                      <p>
                        2. Use the command /verify{" "}
                        {platforms[platform].verificationCode} in our Telegram
                        group
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => generateVerificationCode(platform)}
                  disabled={submitting[platform]}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-soless-blue to-purple-500 hover:from-soless-blue/80 hover:to-purple-500/80 rounded-md text-white 
                      font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 
                      flex items-center justify-center ${
                        submitting[platform]
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                >
                  <span className="mr-2">
                    <Icon size={20} />
                  </span>
                  {submitting[platform] ? "Generating..." : "Generate Code"}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black/95 pt-16 pb-24">
      {/* Hero Banner */}
      <div className="mb-12">
        <div className="relative h-48 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/95" />
          <img
            src="/assets/images/spring-banner.jpg"
            alt="SOLess Spring Theme"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/assets/images/winter-banner.jpg"; // Fallback image
              target.onerror = null; // Prevent infinite error loop
            }}
          />
        </div>
        <RegistrationTitle />

        <motion.button
          onClick={() => setIsContestModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-soless-blue/20 to-purple-500/20 hover:from-soless-blue/30 hover:to-purple-500/30 
            border border-soless-blue/40 rounded-lg px-6 py-3 text-white font-medium transition-all duration-200
            flex items-center gap-2 mx-auto mb-8"
        >
          <Trophy className="w-5 h-5" />
          Learn About the Spring SOLstice Contest
        </motion.button>

        <ContestInfoModal
          isOpen={isContestModalOpen}
          setIsOpen={setIsContestModalOpen}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <ProgressBar />

        <AnimatePresence mode="wait">
          {!publicKey ? (
            <motion.div
              key="connect"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center backdrop-blur-lg p-8 md:p-12 rounded-lg"
            >
              <motion.img
                src="/assets/images/laptop.png"
                alt="Welcome Soulie"
                className="w-36 h-36 mx-auto mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              <p className="text-xl text-gray-300">
                Connect your wallet using the panel on the right to begin your
                journey
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlatformCard platform="telegram" />
                <PlatformCard platform="discord" />
                <PlatformCard platform="twitter" />
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={
                  Object.values(platforms).every((p: Platform) => !p.linked) ||
                  submitting.registration
                }
                whileHover={
                  !submitting.registration ? { scale: 1.02 } : undefined
                }
                whileTap={
                  !submitting.registration ? { scale: 0.98 } : undefined
                }
                className={`w-full py-4 px-6 rounded-md text-white font-medium text-lg transition-all duration-200
                    ${
                      submitting.registration ||
                      Object.values(platforms).every((p: Platform) => !p.linked)
                        ? "bg-gray-600/50 cursor-not-allowed"
                        : "bg-gradient-to-r from-soless-blue to-purple-500 hover:from-soless-blue/80 hover:to-purple-500/80 hover:shadow-lg hover:shadow-purple-500/20"
                    }`}
              >
                {submitting.registration
                  ? "Registering..."
                  : "Complete Registration"}
              </motion.button>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-green-900/20 border border-green-400/20 text-green-400 
                        rounded-md backdrop-blur-lg text-center"
                  >
                    Welcome to SOLess Community! Redirecting...
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GuidedRegister;
